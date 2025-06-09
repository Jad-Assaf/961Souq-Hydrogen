import { useEffect, useState, useRef } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import 'yet-another-react-lightbox/styles.css';
import '../styles/ProductImage.css';
import { useSwipeable } from 'react-swipeable';

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

export function ProductImages({ media, selectedVariantImage }) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVariantSelected, setIsVariantSelected] = useState(false);
  const [showKeyIndicator, setShowKeyIndicator] = useState(false);
  const thumbnailRefs = useRef([]);
  thumbnailRefs.current = [];
  const imageRef = useRef(null);

  // Preload an image given its URL
  const preloadImage = (url) => {
    if (!url) return;
    const img = new window.Image();
    img.src = url;
  };

  // Preload ALL images on mount (if they are MediaImage type)
  useEffect(() => {
    media.forEach(({ node }) => {
      if (node.__typename === 'MediaImage' && node.image?.url) {
        preloadImage(node.image.url);
      }
    });
  }, [media]);

  // (Optional) Preload adjacent images as well
  useEffect(() => {
    const total = media.length;
    if (total === 0) return;
    const nextIndex = (selectedIndex + 1) % total;
    const prevIndex = (selectedIndex - 1 + total) % total;
    const preloadURLs = [];
    if (media[nextIndex]?.node?.__typename === 'MediaImage') {
      preloadURLs.push(media[nextIndex].node.image.url);
    }
    if (media[prevIndex]?.node?.__typename === 'MediaImage') {
      preloadURLs.push(media[prevIndex].node.image.url);
    }
    preloadURLs.forEach((url) => preloadImage(url));
  }, [selectedIndex, media]);

  // Update selected index if variant image is selected
  useEffect(() => {
    if (selectedVariantImage) {
      const variantImageIndex = media.findIndex(({ node }) => {
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
      prevIndex === 0 ? media.length - 1 : prevIndex - 1
    );
    setIsVariantSelected(false);
  };

  const doNextImage = () => {
    setSelectedIndex((prevIndex) =>
      prevIndex === media.length - 1 ? 0 : prevIndex + 1
    );
    setIsVariantSelected(false);
  };

  const handleArrowButtonClick = (callback, e) => {
    e.stopPropagation();
    callback();
    setShowKeyIndicator(false);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: doNextImage,
    onSwipedRight: doPrevImage,
    trackMouse: true,
  });

  const getThumbnailInfo = (node) => {
    let thumbSrc = '';
    let altText = node.alt || 'Thumbnail';
    let isVideo = false;
    if (node.__typename === 'MediaImage') {
      thumbSrc = node.image?.url;
      altText = node.image?.altText || altText;
    } else if (node.__typename === 'ExternalVideo') {
      thumbSrc = 'https://img.icons8.com/color/480/youtube-play.png';
      isVideo = true;
    } else if (node.__typename === 'Video') {
      thumbSrc = 'https://img.icons8.com/fluency/480/video.png';
      isVideo = true;
    } else if (node.__typename === 'Model3d') {
      thumbSrc = 'https://img.icons8.com/3d-fluency/94/3d-rotate.png';
      isVideo = true;
    }
    return { thumbSrc, altText, isVideo };
  };

  const lightboxSlides = media.map(({ node }) => {
    if (node.__typename === 'MediaImage') {
      return { src: node.image.url };
    } else if (node.__typename === 'ExternalVideo') {
      return { src: node.embedUrl };
    } else if (node.__typename === 'Video') {
      const vidSource = node.sources?.[0]?.url;
      return { src: vidSource || '' };
    } else if (node.__typename === 'Model3d') {
      return { src: '' };
    }
    return { src: '' };
  });

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
                    src={`${thumbSrc}&width=150`}
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
        onClick={() => setIsLightboxOpen(true)}
        style={{cursor: 'grab'}}
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
                src={selectedMedia.image.url}
                alt={selectedMedia.image.altText || 'Product Image'}
                loading="eager"
                fetchpriority='high'
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
            {showKeyIndicator && (
              <div className="key-indicator">
                <div className="arrow-icons">
                  <span>
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
                  </span>
                  <span>
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
                  </span>
                </div>
                <p>Use arrow keys</p>
              </div>
            )}
            <button
              className="prev-button"
              onMouseEnter={() => setShowKeyIndicator(true)}
              onClick={(e) => handleArrowButtonClick(doPrevImage, e)}
            >
              <LeftArrowIcon />
            </button>
            <button
              className="next-button"
              onMouseEnter={() => setShowKeyIndicator(true)}
              onClick={(e) => handleArrowButtonClick(doNextImage, e)}
            >
              <RightArrowIcon />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          index={selectedIndex}
          slides={lightboxSlides}
          onIndexChange={setSelectedIndex}
          plugins={[Fullscreen]}
          controller={{
            closeOnBackdropClick: true,
          }}
          carousel={{
            // other carousel settings…
            imageProps: {
              onContextMenu: (e) => e.preventDefault(),
              // Optional: disable text selection and dragging
              draggable: false,
              style: {userSelect: 'none'},
            },
          }}
        />
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
