import '../styles/ProductImage.css';
import {useEffect, useState, useRef} from 'react';
import {createPortal} from 'react-dom';

function useHorizontalSwipe({onSwipeLeft, onSwipeRight, threshold = 45}) {
  const gestureRef = useRef(null);
  const didSwipeRef = useRef(false);

  const startGesture = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    didSwipeRef.current = false;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const endGesture = (event) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    gestureRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX < threshold || absX < absY * 1.25) return;

    didSwipeRef.current = true;
    if (deltaX < 0) {
      onSwipeLeft();
    } else {
      onSwipeRight();
    }
  };

  const cancelGesture = () => {
    gestureRef.current = null;
  };

  return {
    onPointerDown: startGesture,
    onPointerUp: endGesture,
    onPointerCancel: cancelGesture,
    onPointerLeave: cancelGesture,
    wasSwiped: () => didSwipeRef.current,
    clearSwiped: () => {
      didSwipeRef.current = false;
    },
  };
}

const LeftArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const RightArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

export function ProductImages({media, selectedVariantImage}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVariantSelected, setIsVariantSelected] = useState(false);
  const [showKeyIndicator, setShowKeyIndicator] = useState(false);
  const thumbnailRefs = useRef([]);
  thumbnailRefs.current = [];
  const imageRef = useRef(null);

  const preloadImage = (url) => {
    if (!url || typeof window === 'undefined') return;
    const img = new window.Image();
    img.src = `${url}&format=webp&width=600`;
  };

  useEffect(() => {
    const total = media.length;
    if (total === 0) return;

    const nearbyIndexes = new Set([
      selectedIndex,
      (selectedIndex + 1) % total,
      (selectedIndex - 1 + total) % total,
    ]);

    for (const index of nearbyIndexes) {
      const node = media[index]?.node;
      if (node?.__typename === 'MediaImage') {
        preloadImage(node.image?.url);
      }
    }
  }, [selectedIndex, media]);

  // Update selected index if variant image is selected
  useEffect(() => {
    if (selectedVariantImage) {
      const variantImageIndex = media.findIndex(({node}) => {
        return (
          node.__typename === 'MediaImage' &&
          node.image?.url === selectedVariantImage.url
        );
      });
      if (variantImageIndex >= 0 && !isVariantSelected) {
        setSelectedIndex(variantImageIndex);
        setIsVariantSelected(true);
      }
    }
  }, [selectedVariantImage, media, isVariantSelected]);

  // Reset the “variant selected” flag when variant changes
  useEffect(() => {
    setIsVariantSelected(false);
  }, [selectedVariantImage]);

  // Mark image as not loaded whenever selected index changes
  useEffect(() => {
    setIsImageLoaded(false);
  }, [selectedIndex]);

  // Check if image is already loaded (from cache) on mount/update
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      setIsImageLoaded(true);
    }
  }, [selectedIndex]);

  // Scroll the active thumbnail into view
  useEffect(() => {
    if (thumbnailRefs.current[selectedIndex]) {
      thumbnailRefs.current[selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (isLightboxOpen) return;
      if (e.key === 'ArrowLeft') {
        doPrevImage();
        setShowKeyIndicator(false);
      } else if (e.key === 'ArrowRight') {
        doNextImage();
        setShowKeyIndicator(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [media, isLightboxOpen]);

  const doPrevImage = () => {
    setSelectedIndex((prevIndex) =>
      prevIndex === 0 ? media.length - 1 : prevIndex - 1,
    );
    setIsVariantSelected(false);
  };

  const doNextImage = () => {
    setSelectedIndex((prevIndex) =>
      prevIndex === media.length - 1 ? 0 : prevIndex + 1,
    );
    setIsVariantSelected(false);
  };

  const handleArrowButtonClick = (callback, e) => {
    e.stopPropagation();
    callback();
    setShowKeyIndicator(false);
  };

  const {
    wasSwiped,
    clearSwiped,
    ...swipeHandlers
  } = useHorizontalSwipe({
    onSwipeLeft: doNextImage,
    onSwipeRight: doPrevImage,
  });

  const getThumbnailInfo = (node) => {
    let thumbSrc = '';
    let altText = node.alt || 'Thumbnail';
    let isVideo = false;
    if (node.__typename === 'MediaImage') {
      thumbSrc = node.image?.url;
      altText = node.image?.altText || altText;
    } else if (node.__typename === 'ExternalVideo') {
      thumbSrc = 'https://img.icons8.com/color/480/youtube-play.png?quality=50';
      isVideo = true;
    } else if (node.__typename === 'Video') {
      thumbSrc = 'https://img.icons8.com/fluency/480/video.png';
      isVideo = true;
    } else if (node.__typename === 'Model3d') {
      thumbSrc = 'https://img.icons8.com/3d-fluency/94/3d-rotate.png';
      isVideo = true;
    }
    return {thumbSrc, altText, isVideo};
  };

  const selectedMedia = media[selectedIndex]?.node;
  const isVideoMedia =
    selectedMedia &&
    (selectedMedia.__typename === 'ExternalVideo' ||
      selectedMedia.__typename === 'Video');

  return (
    <div className="product-images-container">
      {/* Thumbnails */}
      <div className="thumbContainer">
        <div className="thumbnails">
          {media.map(({node}, index) => {
            const {thumbSrc, altText, isVideo} = getThumbnailInfo(node);
            const isActive = index === selectedIndex;
            const thumbnailStyle = isVideo
              ? {background: '#232323', padding: '14px'}
              : {};
            return (
              <div
                key={node.id || index}
                className={`thumbnail ${isActive ? 'active' : ''}`}
                ref={(el) => (thumbnailRefs.current[index] = el)}
                style={thumbnailStyle}
                onClick={() => setSelectedIndex(index)}
              >
                {thumbSrc ? (
                  <img
                    src={`${thumbSrc}&format=webp&width=150`}
                    alt={altText}
                    width={80}
                    height={80}
                    loading="lazy"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                ) : (
                  <div>Media</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Media */}
      <div
        className="main-image"
        onClick={() => {
          if (wasSwiped()) {
            clearSwiped();
            return;
          }
          setIsLightboxOpen(true);
        }}
        style={{cursor: 'grab', touchAction: 'pan-y'}}
        {...swipeHandlers}
      >
        {selectedMedia && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              filter: isImageLoaded ? 'blur(0px)' : 'blur(10px)',
              transition: 'filter 0.3s ease',
            }}
          >
            {selectedMedia.__typename === 'MediaImage' && (
              <img
                ref={imageRef}
                src={`${selectedMedia.image.url}&format=webp&width=600`}
                alt={selectedMedia.image.altText || 'Product Image'}
                loading="eager"
                fetchpriority="high"
                decoding="async"
                onLoad={() => setIsImageLoaded(true)}
                width="562.5px"
                height="562.5px"
                onContextMenu={(e) => e.preventDefault()}
              />
            )}

            {selectedMedia.__typename === 'ExternalVideo' && (
              <iframe
                width="100%"
                height="auto"
                src={selectedMedia.embedUrl}
                title="External Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsImageLoaded(true)}
              />
            )}

            {selectedMedia.__typename === 'Video' &&
              selectedMedia.sources?.[0] && (
                <video
                  width="100%"
                  height="auto"
                  controls
                  onLoadedData={() => setIsImageLoaded(true)}
                >
                  <source
                    src={selectedMedia.sources[0].url}
                    type={selectedMedia.sources[0].mimeType || 'video/mp4'}
                  />
                  Your browser does not support the video tag.
                </video>
              )}

            {selectedMedia.__typename === 'Model3d' && (
              <div style={{textAlign: 'center'}}>
                <p>3D Model preview not implemented</p>
              </div>
            )}
          </div>
        )}

        {!isVideoMedia && (
          <div className="ImageArrows">
            <button
              className="prev-button"
              aria-label="Previous Image"
              onMouseEnter={() => setShowKeyIndicator(true)}
              onClick={(e) => handleArrowButtonClick(doPrevImage, e)}
            >
              <LeftArrowIcon />
            </button>
            <button
              className="next-button"
              aria-label="Next Image"
              onMouseEnter={() => setShowKeyIndicator(true)}
              onClick={(e) => handleArrowButtonClick(doNextImage, e)}
            >
              <RightArrowIcon />
            </button>
          </div>
        )}
      </div>

      {isLightboxOpen && (
        <ProductLightbox
          media={media}
          selectedIndex={selectedIndex}
          onClose={() => setIsLightboxOpen(false)}
          onPrevious={doPrevImage}
          onNext={doNextImage}
          onSelect={setSelectedIndex}
        />
      )}
    </div>
  );
}

function ProductLightbox({
  media,
  selectedIndex,
  onClose,
  onPrevious,
  onNext,
  onSelect,
}) {
  const closeButtonRef = useRef(null);
  const selectedMedia = media[selectedIndex]?.node;
  const total = media.length;
  const selectedImageUrl =
    selectedMedia?.__typename === 'MediaImage'
      ? selectedMedia.image?.url
      : null;
  const [isLightboxImageLoaded, setIsLightboxImageLoaded] = useState(
    selectedMedia?.__typename !== 'MediaImage',
  );
  const {wasSwiped: _wasSwiped, clearSwiped: _clearSwiped, ...swipeHandlers} =
    useHorizontalSwipe({
    onSwipeLeft: onNext,
    onSwipeRight: onPrevious,
  });

  useEffect(() => {
    setIsLightboxImageLoaded(selectedMedia?.__typename !== 'MediaImage');
  }, [selectedImageUrl, selectedMedia?.__typename]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft') {
        onPrevious();
      } else if (event.key === 'ArrowRight') {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onNext, onPrevious]);

  if (!selectedMedia) return null;

  const renderLightboxMedia = () => {
    if (selectedMedia.__typename === 'MediaImage') {
      return (
        <>
          {!isLightboxImageLoaded ? (
            <div className="product-lightbox__loader" aria-live="polite">
              Loading image
            </div>
          ) : null}
          <img
            key={selectedMedia.id || selectedMedia.image.url}
            src={`${selectedMedia.image.url}&format=webp&width=1400`}
            alt={selectedMedia.image.altText || 'Product Image'}
            className={`product-lightbox__image ${
              isLightboxImageLoaded ? 'is-loaded' : 'is-loading'
            }`}
            draggable="false"
            decoding="async"
            onLoad={() => setIsLightboxImageLoaded(true)}
            onContextMenu={(event) => event.preventDefault()}
          />
        </>
      );
    }

    if (selectedMedia.__typename === 'ExternalVideo') {
      return (
        <iframe
          src={selectedMedia.embedUrl}
          title="Product video"
          className="product-lightbox__iframe"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (selectedMedia.__typename === 'Video' && selectedMedia.sources?.[0]) {
      return (
        <video className="product-lightbox__video" controls autoPlay>
          <source
            src={selectedMedia.sources[0].url}
            type={selectedMedia.sources[0].mimeType || 'video/mp4'}
          />
          Your browser does not support the video tag.
        </video>
      );
    }

    return (
      <div className="product-lightbox__unsupported">
        3D Model preview not implemented
      </div>
    );
  };

  const lightboxMarkup = (
    <div
      className="product-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Product media viewer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        ref={closeButtonRef}
        type="button"
        className="product-lightbox__close"
        aria-label="Close product media viewer"
        onClick={onClose}
      >
        <span aria-hidden="true">&times;</span>
      </button>

      {total > 1 ? (
        <button
          type="button"
          className="product-lightbox__nav product-lightbox__nav--prev"
          aria-label="Previous media"
          onClick={onPrevious}
        >
          <LeftArrowIcon />
        </button>
      ) : null}

      <div
        className="product-lightbox__stage"
        style={{touchAction: 'pan-y'}}
        {...swipeHandlers}
      >
        {renderLightboxMedia()}
      </div>

      {total > 1 ? (
        <button
          type="button"
          className="product-lightbox__nav product-lightbox__nav--next"
          aria-label="Next media"
          onClick={onNext}
        >
          <RightArrowIcon />
        </button>
      ) : null}

      {total > 1 ? (
        <div className="product-lightbox__footer">
          <span className="product-lightbox__counter">
            {selectedIndex + 1} / {total}
          </span>
          <div className="product-lightbox__thumbs">
            {media.map(({node}, index) => {
              const isActive = index === selectedIndex;
              const thumbSrc =
                node.__typename === 'MediaImage'
                  ? node.image?.url
                  : node.__typename === 'ExternalVideo'
                  ? 'https://img.icons8.com/color/480/youtube-play.png?quality=50'
                  : node.__typename === 'Video'
                  ? 'https://img.icons8.com/fluency/480/video.png'
                  : '';

              return (
                <button
                  key={node.id || index}
                  type="button"
                  className={`product-lightbox__thumb ${
                    isActive ? 'is-active' : ''
                  }`}
                  aria-label={`View media ${index + 1}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => onSelect(index)}
                >
                  {thumbSrc ? (
                    <img
                      src={`${thumbSrc}&format=webp&width=120`}
                      alt=""
                      width="56"
                      height="56"
                      loading="lazy"
                    />
                  ) : (
                    <span>3D</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );

  if (typeof document === 'undefined') return lightboxMarkup;

  return createPortal(lightboxMarkup, document.body);
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
