import { useState } from 'react';
import { Image } from '@shopify/hydrogen';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css'; // Lightbox styles
import '../styles/ProductImage.css';

/**
 * @param {{
 *   images: Array<{node: ProductFragment['images']['edges'][0]['node']}>;
 * }}
 */
export function ProductImages({ images }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return <div className="product-images" />;
  }

  const selectedImage = images[selectedImageIndex].node;
  const lightboxImages = images.map(({ node }) => node.url);

  return (
    <div className="product-images-container">
      <div className="main-image" onClick={() => setIsLightboxOpen(true)}>
        <Image
          alt={selectedImage.altText || 'Product Image'}
          aspectRatio="1/1"
          data={selectedImage}
          sizes="(min-width: 45em) 50vw, 100vw"
        />
      </div>

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

      {isLightboxOpen && (
        <Lightbox
          mainSrc={lightboxImages[selectedImageIndex]}
          nextSrc={lightboxImages[(selectedImageIndex + 1) % images.length]}
          prevSrc={
            lightboxImages[
            (selectedImageIndex + images.length - 1) % images.length
            ]
          }
          onCloseRequest={() => setIsLightboxOpen(false)}
          onMovePrevRequest={() =>
            setSelectedImageIndex(
              (selectedImageIndex + images.length - 1) % images.length
            )
          }
          onMoveNextRequest={() =>
            setSelectedImageIndex((selectedImageIndex + 1) % images.length)
          }
        />
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
