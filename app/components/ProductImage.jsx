import { useEffect, useState } from 'react';
import { Image } from '@shopify/hydrogen';
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import { motion } from 'framer-motion';
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
  const [imageKey, setImageKey] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const [isVariantSelected, setIsVariantSelected] = useState(false);

  useEffect(() => {
    if (selectedVariantImage) {
      const variantImageIndex = images.findIndex(({ node }) => node.id === selectedVariantImage.id);
      if (variantImageIndex >= 0 && !isVariantSelected) {
        setSelectedImageIndex(variantImageIndex);
        setIsVariantSelected(true);
      }
    }
  }, [selectedVariantImage, images, isVariantSelected]);

  useEffect(() => {
    setIsVariantSelected(false);
  }, [selectedVariantImage]);

  const selectedImage = images[selectedImageIndex]?.node;

  // Trigger a unique key change on each image change
  useEffect(() => {
    setImageKey(prevKey => prevKey + 1);
    setIsImageLoaded(false); // Reset loading status when image changes
  }, [selectedImageIndex]);

  const handlePrevImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
    setIsVariantSelected(false);
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
    setIsVariantSelected(false);
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
          <motion.div
            initial={{ filter: 'blur(15px)' }}
            animate={{ filter: isImageLoaded ? 'blur(0px)' : 'blur(15px)' }}
            transition={{ duration: 0.5 }}
          >
            <Image
              key={imageKey}
              data={selectedImage}
              alt={selectedImage.altText || 'Product Image'}
              aspectRatio="1/1"
              sizes="(min-width: 45em) 50vw, 100vw"
              width="570px"
              height="570px"
              loading="eager"
              onLoad={() => setIsImageLoaded(true)}
            />
          </motion.div>
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