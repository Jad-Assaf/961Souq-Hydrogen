import React, {useRef, useState, useEffect} from 'react';
import {Link} from '@remix-run/react';
import {Money} from '@shopify/hydrogen';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';

export default function RelatedProductsRow({
  products,
  title = 'You May Also Like',
  hasMore = false,
  isLoadingMore = false,
  onAddToCart,
  onNeedMore,
  showAddToCart = false,
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
      {title ? <h2>{title}</h2> : null}
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
              onAddToCart={onAddToCart}
              showAddToCart={showAddToCart}
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

function RelatedProductItem({product, index, onAddToCart, showAddToCart}) {
  const [isVisible, setIsVisible] = useState(false);
  const {open} = useAside();

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
  const canAddToCart = Boolean(
    showAddToCart &&
      product.availableForSale &&
      firstVariant?.id &&
      variantPrice &&
      Number(variantPrice.amount) > 0,
  );
  const selectedVariantForCart = firstVariant
    ? {
        id: firstVariant.id,
        title: firstVariant.title,
        image: firstVariant.image,
        selectedOptions: firstVariant.selectedOptions ?? [],
        product: {
          title: product.title,
          handle: product.handle,
        },
      }
    : null;

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
        {showAddToCart ? (
          <div className="complementary-add-to-cart-wrap">
            <AddToCartButton
              ariaLabel="Add to cart"
              className="complementary-add-to-cart-button"
              disabled={!canAddToCart}
              includeBaseClass={false}
              onClick={(event) => {
                event.stopPropagation();
                if (canAddToCart) {
                  onAddToCart?.(product);
                  open('cart');
                }
              }}
              lines={
                canAddToCart && selectedVariantForCart
                  ? [
                      {
                        merchandiseId: selectedVariantForCart.id,
                        quantity: 1,
                        selectedVariant: selectedVariantForCart,
                        product: {
                          ...product,
                          selectedVariant: selectedVariantForCart,
                          handle: product.handle,
                        },
                      },
                    ]
                  : []
              }
              title="Add to cart"
            >
              <svg
                width="22px"
                height="22px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g strokeWidth="0"></g>
                <g strokeLinecap="round" strokeLinejoin="round"></g>
                <g>
                  <path
                    d="M4 12H20M12 4V20"
                    stroke="#03072c"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </g>
              </svg>
            </AddToCartButton>
          </div>
        ) : null}
        <Link to={`/products/${encodeURIComponent(product.handle)}`}>
          {product.images.edges[0]?.node?.url ? (
            <img
              data={product.images.edges[0]?.node}
              aspectratio="1/1"
              sizes="(min-width: 45em) 12vw, 32vw"
              srcSet={`${product.images.edges[0]?.node.url}&format=webp&width=160 300w,
                       ${product.images.edges[0]?.node.url}&format=webp&width=240 600w,
                       ${product.images.edges[0]?.node.url}&format=webp&width=320 1200w`}
              alt={product.images.edges[0]?.node.altText || product.title}
              width="120px"
              height="120px"
              loading="lazy"
            />
          ) : null}
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
