import { useState } from 'react';
import { Image } from '@shopify/hydrogen';
import Lightbox from 'react-awesome-lightbox';
import 'react-awesome-lightbox/build/style.css'; // Import the lightbox styles
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
      <div className="main-image" onClick={() => setIsLightboxOpen(true)}>
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

      {/* Lightbox */}
      {isLightboxOpen && (
        <Lightbox
          images={images.map(({ node }) => ({ url: node.url, title: node.altText }))}
          startIndex={selectedImageIndex}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
