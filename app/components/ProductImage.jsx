import { Image } from '@shopify/hydrogen';
import { useState } from 'react';
import '../styles/ProductImage.css';

/**
 * ProductImage component that displays all product images as thumbnails.
 * @param {{
 *   images: ProductFragment['images']['nodes'];
 * }}
 */
export function ProductImage({ images }) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  if (!images || images.length === 0) {
    return <div className="product-image" />;
  }

  return (
    <div className="product-image-gallery">
      {/* Main Image Display */}
      <div className="productPage-image">
        <Image
          alt={selectedImage.altText || 'Product Image'}
          aspectRatio="1/1"
          data={selectedImage}
          key={selectedImage.id}
          sizes="(min-width: 45em) 50vw, 100vw"
        />
      </div>

      {/* Thumbnail Images */}
      <div className="product-thumbnails">
        {images.map((image) => (
          <div
            key={image.id}
            className={`thumbnail ${selectedImage.id === image.id ? 'active' : ''}`}
            onClick={() => setSelectedImage(image)}
          >
            <Image
              alt={image.altText || 'Thumbnail Image'}
              data={image}
              width={75}
              height={75}
              aspectRatio="1/1"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
