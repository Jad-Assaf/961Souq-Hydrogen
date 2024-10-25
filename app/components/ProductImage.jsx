import { useState } from 'react';
import { Image } from '@shopify/hydrogen';
import Lightbox from 'yet-another-react-lightbox';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import 'yet-another-react-lightbox/styles.css';
import '../styles/ProductImage.css';

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

  return (
    <div className="product-images-container">
      {/* Main Image */}
      <div
        className="main-image"
        onClick={() => setIsLightboxOpen(true)}
        style={{ cursor: 'grab' }}
      >
        <Image
          alt={selectedImage.altText || 'Product Image'}
          aspectRatio="1/1"
          data={selectedImage}
          sizes="(min-width: 45em) 50vw, 100vw"
        />
      </div>

      {/* Thumbnails */}
      <div className="thumbnails">
        {images.map(({ node: image }, index) => (
          <div
            key={image.id}
            className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
            onClick={() => setSelectedImageIndex(index)}
          >
            <Image
              alt={image.altText || 'Thumbnail Image'}
              aspectRatio="1/1"
              data={image}
              sizes="50px"
            />
          </div>
        ))}
      </div>

      {/* Lightbox with Swipe, Thumbnails, and Fullscreen */}
      {isLightboxOpen && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          index={selectedImageIndex}
          slides={images.map(({ node }) => ({ src: node.url }))}
          onIndexChange={setSelectedImageIndex}
          plugins={[Thumbnails, Fullscreen]}
        />
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
