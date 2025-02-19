import {useEffect, useState, useRef} from 'react';
import {Image} from '@shopify/hydrogen';
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import 'yet-another-react-lightbox/styles.css';
import '../styles/ProductImage.css';
import {useSwipeable} from 'react-swipeable';

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

/**
 * A comprehensive ProductImages component that handles:
 * - Images
 * - External Videos (YouTube, Vimeo, etc.)
 * - Hosted Shopify Videos
 * - 3D Models
 * - Thumbnails (with fallback icons for videos)
 * - Swipe & Keyboard navigation
 * - Lightbox
 * - Animated "Use Arrow Keys" indicator
 */
export function ProductImages({media, selectedVariantImage}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageKey, setImageKey] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVariantSelected, setIsVariantSelected] = useState(false);

  // "Use Arrow Keys" indicator
  const [showKeyIndicator, setShowKeyIndicator] = useState(false);

  // Refs for thumbnails so we can scroll the active one into view
  const thumbnailRefs = useRef([]);
  thumbnailRefs.current = [];

  /**
   * 1) If a specific variant image is chosen, find its matching index in media
   *    so we can show that item in the main preview.
   */
  useEffect(() => {
    if (selectedVariantImage) {
      const variantImageIndex = media.findIndex(({node}) => {
        // Compare based on URL instead of ID
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

  // Reset the “variant selected” flag if selectedVariantImage changes
  useEffect(() => {
    setIsVariantSelected(false);
  }, [selectedVariantImage]);

  // Whenever the selectedIndex changes, we "invalidate" the imageKey so <Image> re-renders
  const selectedMedia = media[selectedIndex]?.node;
  useEffect(() => {
    setImageKey((prevKey) => prevKey + 1);
    setIsImageLoaded(false);
  }, [selectedIndex]);

  // Scroll the thumbnails so the new item is visible
  useEffect(() => {
    if (thumbnailRefs.current[selectedIndex]) {
      thumbnailRefs.current[selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedIndex]);

  /**
   * 2) Keyboard navigation:
   *    Only handle arrow keys if the lightbox is NOT open.
   *    Otherwise we’d “double-skip” images due to the lightbox’s arrow logic.
   */
  useEffect(() => {
    function handleKeyDown(e) {
      if (isLightboxOpen) return; // Don’t conflict with lightbox’s arrow keys

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

  // Handle Prev/Next
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

  // Clicking arrow buttons => hide the “Use Arrow Keys” indicator
  const handleArrowButtonClick = (callback, e) => {
    e.stopPropagation();
    callback();
    setShowKeyIndicator(false);
  };

  // Mouse enters an arrow => show the arrow-keys indicator
  const handleArrowMouseEnter = () => {
    setShowKeyIndicator(true);
  };

  // SWIPE / Drag handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: doNextImage,
    onSwipedRight: doPrevImage,
    trackMouse: true, // also allow mouse-drag for desktop
  });

  // Build “thumbnail” data for each media item
  const getThumbnailInfo = (node) => {
    let thumbSrc = '';
    let altText = node.alt || 'Thumbnail';
    let isVideo = false;

    if (node.__typename === 'MediaImage') {
      thumbSrc = node.image?.url;
      altText = node.image?.altText || altText;
    } else if (node.__typename === 'ExternalVideo') {
      // Fallback icon for e.g. YouTube
      thumbSrc = 'https://img.icons8.com/color/480/youtube-play.png';
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

  // Generate slides for lightbox usage
  const lightboxSlides = media.map(({node}) => {
    if (node.__typename === 'MediaImage') {
      return {src: node.image.url};
    } else if (node.__typename === 'ExternalVideo') {
      // Lightbox expects a "src", but we can embed a link or fallback image
      return {src: node.embedUrl};
    } else if (node.__typename === 'Video') {
      const vidSource = node.sources?.[0]?.url;
      return {src: vidSource || ''};
    } else if (node.__typename === 'Model3d') {
      return {src: ''};
    }
    return {src: ''};
  });

  // Determine if the currently selected media is a video
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

            // Maybe style video thumbs differently
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
                    src={thumbSrc}
                    alt={altText}
                    width={80}
                    height={80}
                    loading="lazy"
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
              filter: isImageLoaded ? 'blur(0px)' : 'blur(10px)',
              transition: 'filter 0.3s ease',
            }}
          >
            {/* If the media is a Shopify Image */}
            {selectedMedia.__typename === 'MediaImage' && (
              <Image
                key={imageKey}
                data={selectedMedia.image}
                alt={selectedMedia.image.altText || 'Product Image'}
                sizes="(min-width: 45em) 50vw, 100vw"
                loading="eager"
                decoding="async"
                onLoad={() => setIsImageLoaded(true)}
                loaderOptions={{scale: 2}}
              />
            )}

            {/* If the media is an ExternalVideo (YouTube, Vimeo, etc.) */}
            {selectedMedia.__typename === 'ExternalVideo' && (
              <iframe
                key={imageKey}
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

            {/* If the media is a Shopify Video */}
            {selectedMedia.__typename === 'Video' &&
              selectedMedia.sources?.[0] && (
                <video
                  key={imageKey}
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

            {/* If it's a 3D model */}
            {selectedMedia.__typename === 'Model3d' && (
              <div style={{textAlign: 'center'}}>
                <p>3D Model preview not implemented</p>
              </div>
            )}
          </div>
        )}

        {/* Conditionally render the arrow keys usage indicator if not a video */}
        {!isVideoMedia && (
          <div className="ImageArrows">
            {showKeyIndicator && (
              <div className="key-indicator">
                <div className="arrow-icons">
                  <span>⇦</span>
                  <span>⇨</span>
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

      {/* Lightbox for bigger view. 
          Slides come from the 'lightboxSlides' array we built. */}
      {isLightboxOpen && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          index={selectedIndex}
          slides={lightboxSlides}
          onIndexChange={setSelectedIndex}
          plugins={[Fullscreen]}
        />
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
