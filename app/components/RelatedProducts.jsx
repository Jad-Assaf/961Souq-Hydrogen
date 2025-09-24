import React, {useRef, useState, useEffect} from 'react';
import {Link} from '@remix-run/react';
import {Money, Image} from '@shopify/hydrogen'; // Import Image from hydrogen

export default function RelatedProductsRow({products}) {
  const rowRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  return (
    <div className="collection-section">
      <h2>You May Also Like</h2>
      <div className="product-row-container">
        <button className="home-prev-button" onClick={() => scrollRow(-600)}>
          <LeftArrowIcon />
        </button>
        <div className="collection-products-row">
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
            srcSet={`${product.images.edges[0]?.node.url}&width=200 300w,
                     ${product.images.edges[0]?.node.url}&width=200 600w,
                     ${product.images.edges[0]?.node.url}&width=200 1200w`}
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
