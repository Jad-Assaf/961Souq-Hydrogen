import { useEffect, useState } from 'react';
import { Image } from '@shopify/hydrogen';
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import 'yet-another-react-lightbox/styles.css';
import '../styles/ProductImage.css';

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
 * @param {{
 *   images: Array<{node: ProductFragment['images']['edges'][0]['node']}>;
 * }}
 */
export function ProductImages({ images, selectedVariantImage }) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Keep track of whether the variant image was just selected
  const [isVariantSelected, setIsVariantSelected] = useState(false);

  // Effect to set the variant image initially when it changes
  useEffect(() => {
    if (selectedVariantImage) {
      const variantImageIndex = images.findIndex(({ node }) => node.id === selectedVariantImage.id);
      if (variantImageIndex >= 0 && !isVariantSelected) {
        setSelectedImageIndex(variantImageIndex);
        setIsVariantSelected(true); // Prevents resetting on every re-render
      }
    }
  }, [selectedVariantImage, images, isVariantSelected]);

  // Reset isVariantSelected when the variant image changes
  useEffect(() => {
    setIsVariantSelected(false);
  }, [selectedVariantImage]);

  if (!images || images.length === 0) {
    return <div className="product-images" />;
  }

  const selectedImage = images[selectedImageIndex]?.node;

  const handlePrevImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
    setIsVariantSelected(false); // Allow navigation
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
    setIsVariantSelected(false); // Allow navigation
  };

  return (
    <div className="product-images-container">
      <div className="thumbContainer">
        <div className="thumbnails">
          {images.map(({ node: image }, index) => (
            <div
              key={image.id}
              className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
              onClick={() => setSelectedImageIndex(index)}
            >
              <Image
                data={image}
                alt={image.altText || 'Thumbnail Image'}
                aspectRatio="1/1"
                width={100}
                height={100}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className="main-image"
        onClick={() => setIsLightboxOpen(true)}
        style={{ cursor: 'grab' }}
      >
        {selectedImage && (
          <Image
            data={selectedImage}
            alt={selectedImage.altText || 'Product Image'}
            aspectRatio="1/1"
            sizes="(min-width: 45em) 50vw, 100vw"
            width="100%"
            height="auto"
            loading="eager"
          />
        )}
        <div className="ImageArrows">
          <button
            className="prev-button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevImage();
            }}
          >
            <LeftArrowIcon />
          </button>
          <button
            className="next-button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextImage();
            }}
          >
            <RightArrowIcon />
          </button>
        </div>
      </div>

      {isLightboxOpen && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          index={selectedImageIndex}
          slides={images.map(({ node }) => ({ src: node.url }))}
          onIndexChange={setSelectedImageIndex}
          plugins={[Fullscreen]}
        />
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */