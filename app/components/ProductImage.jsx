import { useState } from 'react';
import { Image } from '@shopify/hydrogen';
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import 'yet-another-react-lightbox/styles.css';
import '../styles/ProductImage.css';
import { AnimatedImage } from './AnimatedImage';

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
export function ProductImages({ images }) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return <div className="product-images" />;
  }

  const selectedImage = images[selectedImageIndex].node;

  const handlePrevImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="product-images-container">
      {/* Thumbnails on the Left */}
      <div className="thumbnails">
        {images.map(({ node: image }, index) => (
          <div
            key={image.id}
            className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
            onClick={() => setSelectedImageIndex(index)}
          >
            <AnimatedImage
              alt={image.altText || 'Thumbnail Image'}
              aspectRatio="1/1"
              data={image}
              sizes="50px"
            />
          </div>
        ))}
      </div>

      {/* Main Image with Prev/Next Buttons */}
      <div
        className="main-image"
        onClick={() => setIsLightboxOpen(true)}
        style={{ cursor: 'grab' }}
      >
        <AnimatedImage
          alt={selectedImage.altText || 'Product Image'}
          aspectRatio="1/1"
          data={selectedImage}
          sizes="(min-width: 45em) 50vw, 100vw"
          width="200"
          height="200"
        />
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

      {/* Lightbox without Thumbnails */}
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
