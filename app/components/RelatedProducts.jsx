import React, {useRef, useState, useEffect} from 'react';
import {Link} from '@remix-run/react';
import {Money} from '@shopify/hydrogen';

export default function RelatedProductsRow({
  products,
  title = 'You May Also Like',
  hasMore = false,
  isLoadingMore = false,
  onNeedMore,
}) {
  const rowRef = useRef(null);

  if (!Array.isArray(products) || products.length === 0) return null;

  const maybeLoadMore = () => {
    const row = rowRef.current;
    if (!row || !hasMore || isLoadingMore || !onNeedMore) return;

    const remaining = row.scrollWidth - row.scrollLeft - row.clientWidth;
    if (remaining < 500) onNeedMore();
  };

  const scrollRow = (offset) => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({
      left: offset,
      behavior: 'smooth',
    });
    window.setTimeout(maybeLoadMore, 350);
  };

  return (
    <div className="collection-section">
      <h2>{title}</h2>
      <div className="product-row-container">
        <button className="home-prev-button" onClick={() => scrollRow(-600)}>
          <LeftArrowIcon />
        </button>
        <div
          className="collection-products-row"
          ref={rowRef}
          onScroll={maybeLoadMore}
        >
          {products.map((product, index) => (
            <RelatedProductItem
              key={product.id}
              product={product}
              index={index}
            />
          ))}
        </div>
        <button className="home-next-button" onClick={() => scrollRow(600)}>
          <RightArrowIcon />
        </button>
      </div>
    </div>
  );
}

function RelatedProductItem({product, index}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, index * 50);
    return () => clearTimeout(timeout);
  }, [index]);

  // ✅ Use the first variant’s price instead of minVariantPrice
  const firstVariant = product.variants?.nodes?.[0];
  const variantPrice =
    firstVariant?.price || product.priceRange?.minVariantPrice;

  return (
    <div
      className="product-item"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <div
        className="product-card"
        style={{
          filter: isVisible ? 'blur(0px)' : 'blur(10px)',
          opacity: isVisible ? 1 : 0,
          transition: 'filter 0.5s ease, opacity 0.5s ease',
        }}
      >
        <Link to={`/products/${encodeURIComponent(product.handle)}`}>
          <img
            data={product.images.edges[0]?.node}
            aspectratio="1/1"
            sizes="(min-width: 45em) 20vw, 40vw"
            srcSet={`${product.images.edges[0]?.node.url}&format=webp&width=200 300w,
                     ${product.images.edges[0]?.node.url}&format=webp&width=200 600w,
                     ${product.images.edges[0]?.node.url}&format=webp&width=200 1200w`}
            alt={product.images.edges[0]?.node.altText || product.title}
            width="150px"
            height="150px"
            loading="lazy"
          />
          <div className="product-title">{product.title}</div>
          <div className="product-price">
            {variantPrice && Number(variantPrice.amount) > 0 ? (
              <Money data={variantPrice} />
            ) : (
              <span>Call For Price</span>
            )}
          </div>
        </Link>
      </div>
    </div>
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
