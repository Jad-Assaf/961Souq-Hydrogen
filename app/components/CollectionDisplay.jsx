import React, {useEffect, useRef, useState} from 'react';
import {Link, useRevalidator} from '@remix-run/react';
import {Money} from '@shopify/hydrogen';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import CollectionRows from './CollectionRows';

export function truncateText(text, maxWords) {
  if (!text || typeof text !== 'string') return '';
  const words = text.split(' ');
  return words.length > maxWords
    ? words.slice(0, maxWords).join(' ') + '...'
    : text;
}

export const CollectionDisplay = React.memo(({menuCollections}) => (
  <div className="collections-container">
    <CollectionRows menuCollections={menuCollections} />
  </div>
));

export function ProductRow({products}) {
  const rowRef = useRef(null);
  const scrollRow = (distance) =>
    rowRef.current.scrollBy({left: distance, behavior: 'smooth'});

  return (
    <>
      <button
        className="home-prev-button"
        onClick={() => scrollRow(-600)}
        aria-label="Scroll left"
      >
        <LeftArrowIcon />
      </button>
      <div className="collection-products-row" ref={rowRef}>
        {products.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </div>
      <button
        className="home-next-button"
        onClick={() => scrollRow(600)}
        aria-label="Scroll right"
      >
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
    <polyline points="15 18 9 12 15 6" />
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
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export function ProductItem({product}) {
  const ref = useRef(null);
  const {open} = useAside();
  const revalidator = useRevalidator();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [isSoldOut, setIsSoldOut] = useState(false);
  const images = product.images?.nodes || [];

  useEffect(() => {
    const soldOut = !product.variants?.nodes?.some((v) => v.availableForSale);
    setIsSoldOut(soldOut);
  }, [product]);

  useEffect(() => {
    if (firstLoad && currentImageIndex === 0) {
      setFadeIn(true);
    } else {
      setFadeIn(false);
      const timer = setTimeout(() => {
        setFadeIn(true);
        setFirstLoad(false);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [currentImageIndex, firstLoad]);

  const selectedVariant =
    product.variants?.nodes?.find((v) => v.availableForSale) ||
    product.variants?.nodes?.[0] ||
    null;

  const handleMouseEnter = () => images.length > 1 && setCurrentImageIndex(1);
  const handleMouseLeave = () => setCurrentImageIndex(0);

  return (
    <div ref={ref} className="product-card">
      <Link to={`/products/${encodeURIComponent(product.handle)}`}>
        {images.length > 0 && (
          <div
            className="product-image-container slideshow"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className={`sold-out-ban${isSoldOut ? ' visible' : ''}`}>
              <p>Sold Out</p>
            </div>
            <div className="imageWrapper">
              <img
                src={images[currentImageIndex]?.url}
                alt={product.title}
                srcSet={`
                  ${images[currentImageIndex]?.url}&width=200 300w,
                  ${images[currentImageIndex]?.url}&width=200 600w,
                  ${images[currentImageIndex]?.url}&width=200 1200w
                `}
                sizes="(min-width: 45em) 20vw, 40vw"
                width={180}
                height={180}
                loading="lazy"
                className={`product-image image${fadeIn ? ' loaded' : ''}${
                  firstLoad ? ' no-transition' : ''
                }`}
              />
            </div>
          </div>
        )}
        <h4 className="product-title">{product.title}</h4>
        <div className="product-price">
          {selectedVariant?.price &&
          parseFloat(selectedVariant.price.amount) === 0 ? (
            'Call for Price!'
          ) : (
            <Money data={selectedVariant.price} />
          )}
          {selectedVariant?.compareAtPrice &&
            parseFloat(selectedVariant.price.amount) > 0 &&
            parseFloat(selectedVariant.compareAtPrice.amount) >
              parseFloat(selectedVariant.price.amount) && (
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
          parseFloat(selectedVariant.price.amount) === 0
        }
        onClick={async () => {
          if (product.variants?.nodes?.length > 1) {
            window.location.href = `/products/${product.handle}`;
          } else {
            await revalidator.revalidate();
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
        {!selectedVariant.availableForSale
          ? 'Sold out'
          : parseFloat(selectedVariant.price.amount) === 0
          ? 'Call for Price'
          : product.variants.nodes.length > 1
          ? 'Select Options'
          : 'Add to cart'}
      </AddToCartButton>
    </div>
  );
}
