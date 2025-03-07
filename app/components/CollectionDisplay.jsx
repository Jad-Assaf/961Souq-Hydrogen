import React, {useEffect, useRef, useState} from 'react';
import {Link} from '@remix-run/react';
import {Money, Image} from '@shopify/hydrogen';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import CollectionRows from './CollectionRows';

// Truncate text to fit within the given max word count
export function truncateText(text, maxWords) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  const words = text.split(' ');
  return words.length > maxWords
    ? words.slice(0, maxWords).join(' ') + '...'
    : text;
}

// Simplified CollectionDisplay
export const CollectionDisplay = React.memo(({menuCollections}) => {
  return (
    <div className="collections-container">
      <CollectionRows menuCollections={menuCollections} />
    </div>
  );
});

export function ProductRow({products}) {
  const rowRef = useRef(null);

  const scrollRow = (distance) => {
    rowRef.current.scrollBy({left: distance, behavior: 'smooth'});
  };

  return (
    <>
      <button className="home-prev-button" onClick={() => scrollRow(-600)}>
        <LeftArrowIcon />
      </button>
      <div className="collection-products-row" ref={rowRef}>
        {products.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </div>
      <button className="home-next-button" onClick={() => scrollRow(600)}>
        <RightArrowIcon />
      </button>
    </>
  );
}

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

export function ProductItem({product}) {
  const ref = useRef(null);
  const {open} = useAside();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Controls opacity for the fade transition
  const [fadeIn, setFadeIn] = useState(true);
  // Flag to avoid applying transition on first render
  const [firstLoad, setFirstLoad] = useState(true);
  const [isSoldOut, setIsSoldOut] = useState(false);
  const images = product.images?.nodes || [];

  useEffect(() => {
    // Check if the product is sold out
    const soldOut = !product.variants?.nodes?.some(
      (variant) => variant.availableForSale,
    );
    setIsSoldOut(soldOut);
  }, [product]);

  // Trigger fade-in effect when the current image changes
  useEffect(() => {
    if (firstLoad && currentImageIndex === 0) {
      // On initial render, ensure image is visible with no transition.
      setFadeIn(true);
    } else {
      // When switching images, start with opacity 0...
      setFadeIn(false);
      // ...and then, after a brief delay, set opacity to 1 to trigger the fade.
      const timer = setTimeout(() => {
        setFadeIn(true);
        setFirstLoad(false);
      }, 10); // delay allows the browser to register the change
      return () => clearTimeout(timer);
    }
  }, [currentImageIndex, firstLoad]);

  const selectedVariant =
    product.variants?.nodes?.find((variant) => variant.availableForSale) ||
    product.variants?.nodes?.[0] ||
    null;

  const hasDiscount =
    selectedVariant?.compareAtPrice &&
    selectedVariant.compareAtPrice.amount > selectedVariant.price.amount;

  // Attach hover events only on the image container
  const handleMouseEnter = () => {
    if (images.length > 1) {
      setCurrentImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  return (
    <div ref={ref} className="product-card">
      <Link to={`/products/${encodeURIComponent(product.handle)}`}>
        {images.length > 0 && (
          <div
            className="product-image-container"
            style={styles.slideshow}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Sold-out banner */}
            <div
              className="sold-out-ban"
              style={{display: isSoldOut ? 'flex' : 'none'}}
            >
              <p>Sold Out</p>
            </div>
            <div style={styles.imageWrapper}>
              <Image
                key={currentImageIndex} // re-mount the image when index changes
                src={images[currentImageIndex]?.url}
                alt={images[currentImageIndex]?.altText || 'Product Image'}
                aspectRatio="1/1"
                sizes="(min-width: 45em) 20vw, 40vw"
                srcSet={`
                  ${images[currentImageIndex]?.url}?width=300&quality=10 300w,
                  ${images[currentImageIndex]?.url}?width=600&quality=10 600w,
                  ${images[currentImageIndex]?.url}?width=1200&quality=10 1200w
                `}
                width="180px"
                height="180px"
                loading="lazy"
                style={{
                  ...styles.image,
                  opacity: fadeIn ? 1 : 0,
                  transition: firstLoad ? 'none' : 'opacity 0.2s linear',
                }}
                className="product-image"
              />
            </div>
          </div>
        )}
        <h4 className="product-title">{product.title}</h4>
        <div className="product-price">
          {selectedVariant?.price &&
            (parseFloat(selectedVariant.price.amount) === 0 ? (
              'Call for Price!'
            ) : (
              <Money data={selectedVariant.price} />
            ))}
          {hasDiscount && (
            <small className="discountedPrice">
              <Money data={selectedVariant.compareAtPrice} />
            </small>
          )}
        </div>
      </Link>

      <AddToCartButton
        disabled={
          !selectedVariant ||
          !selectedVariant.availableForSale ||
          (selectedVariant?.price &&
            parseFloat(selectedVariant.price.amount) === 0)
        }
        onClick={() => {
          if (product.variants?.nodes?.length > 1) {
            window.location.href = `/products/${product.handle}`;
          } else {
            open('cart');
          }
        }}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                  product: {
                    ...product,
                    selectedVariant,
                    handle: product.handle,
                  },
                },
              ]
            : []
        }
      >
        {!selectedVariant?.availableForSale
          ? 'Sold out'
          : selectedVariant?.price &&
            parseFloat(selectedVariant.price.amount) === 0
          ? 'Call for Price'
          : product.variants?.nodes?.length > 1
          ? 'Select Options'
          : 'Add to cart'}
      </AddToCartButton>
    </div>
  );
}

const styles = {
  slideshow: {
    position: 'relative',
    width: '100%',
    height: 'auto',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: 'auto',
  },
  image: {
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
  },
};
