import { Image } from '@shopify/hydrogen';
import '../styles/ProductImage.css'

/**
 * @param {{
 *   images: Array<{node: ProductFragment['images']['edges'][0]['node']}>;
 * }}
 */
export function ProductImages({ images }) {
  if (!images || images.length === 0) {
    return <div className="product-images" />;
  }

  return (
    <div className="product-images">
      {images.map(({ node: image }) => (
        <div className="product-image" key={image.id}>
          <Image
            alt={image.altText || 'Product Image'}
            aspectRatio="1/1"
            data={image}
            sizes="(min-width: 45em) 50vw, 100vw"
          />
        </div>
      ))}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
