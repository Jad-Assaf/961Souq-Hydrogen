import React, {useEffect, useRef, useState, useCallback} from 'react';
import {Link, useRevalidator} from '@remix-run/react';
import {Money} from '@shopify/hydrogen';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import CollectionRows from './CollectionRows';
import WishlistButton from './WishlistButton';

const FREE_SHIPPING_TAGS = new Set([
  'gaming laptops',
  'business laptops',
  'apple macbooks',
  'apple imac',
]);

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

export function ProductRow({products, showFreeShippingTags = false}) {
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
          <ProductItem
            key={product.id}
            product={product}
            showFreeShippingTags={showFreeShippingTags}
          />
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

function addWidthParam(url, width) {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${width}`;
}

function ProductQuickViewModal({
  product,
  images,
  selectedVariant,
  isOpen,
  isClosing,
  isLoadingDetails,
  onClose,
  onAfterClose,
  openCart,
  revalidator,
}) {
  const overlayRef = useRef(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const selectedVariantForCart = selectedVariant
    ? {
        id: selectedVariant.id,
        title: selectedVariant.title,
        image: selectedVariant.image,
        selectedOptions: selectedVariant.selectedOptions ?? [],
        product: {
          title: product?.title,
          handle: product?.handle,
        },
      }
    : null;

  // Reset slideshow index when opening or product changes
  useEffect(() => {
    if (isOpen && !isClosing) {
      setModalImageIndex(0);
    }
  }, [isOpen, isClosing, product?.id]);

  // Lock body scroll while modal is mounted/opening/closing
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // ESC close
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // When closing animation finishes
  useEffect(() => {
    if (!isOpen || !isClosing) return;

    const t = setTimeout(() => {
      onAfterClose();
    }, 220);

    return () => clearTimeout(t);
  }, [isOpen, isClosing, onAfterClose]);

  if (!isOpen) return null;

  const hasMultipleVariants = (product?.variants?.nodes?.length || 0) > 1;

  const canAdd =
    !!selectedVariant &&
    selectedVariant.availableForSale &&
    parseFloat(selectedVariant?.price?.amount || '0') > 0;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const descriptionHtml = (product?.descriptionHtml || '').trim();

  const nextImage = () => {
    if (!images.length) return;
    setModalImageIndex((i) => (i + 1) % images.length);
  };

  const prevImage = () => {
    if (!images.length) return;
    setModalImageIndex((i) => (i - 1 + images.length) % images.length);
  };

  const currentImg = images[modalImageIndex];

  return (
    <div
      ref={overlayRef}
      className={`product-modal-overlay ${!isClosing ? 'visible' : ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${product?.title || 'Product'} quick view`}
    >
      <button
        className="product-modal-close"
        onClick={onClose}
        aria-label="Close"
        type="button"
      >
        ×
      </button>
      <div className={`product-modal ${!isClosing ? 'visible' : ''}`}>
        <div className="product-modal-body">
          {/* Images (slideshow) */}
          <div className="product-modal-images">
            {images.length > 0 ? (
              <>
                <div className="product-modal-media-card">
                  <div className="product-modal-main-image">
                    <img
                      key={`${product?.id || 'p'}-${modalImageIndex}`}
                      src={currentImg?.url}
                      alt={`${product?.title || 'Product'} image ${
                        modalImageIndex + 1
                      }`}
                      width={420}
                      height={420}
                      loading="eager"
                      className="product-modal-main-img-anim"
                      onContextMenu={(e) => e.preventDefault()}
                    />

                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="product-modal-nav prev"
                          onClick={prevImage}
                          aria-label="Previous image"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="product-modal-nav next"
                          onClick={nextImage}
                          aria-label="Next image"
                        >
                          ›
                        </button>
                      </>
                    )}
                  </div>

                  {images.length > 1 && (
                    <div className="product-modal-thumbs">
                      {images.map((img, idx) => (
                        <button
                          key={`${img?.url || idx}`}
                          type="button"
                          className={`product-modal-thumb ${
                            idx === modalImageIndex ? 'active' : ''
                          }`}
                          onClick={() => setModalImageIndex(idx)}
                          aria-label={`Image ${idx + 1}`}
                        >
                          <img
                            src={img?.url}
                            alt=""
                            width={64}
                            height={64}
                            loading="lazy"
                            onContextMenu={(e) => e.preventDefault()}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="product-modal-no-image">No images available</div>
            )}
          </div>

          {/* Info */}
          <div className="product-modal-info">
            <div className="product-modal-header">
              <h3 className="product-modal-title">{product?.title}</h3>

              <div className="product-modal-price">
                {selectedVariant?.price &&
                parseFloat(selectedVariant.price.amount) === 0 ? (
                  <span>Call for Price!</span>
                ) : selectedVariant?.price ? (
                  <Money data={selectedVariant.price} />
                ) : null}

                {selectedVariant?.compareAtPrice &&
                  selectedVariant?.price &&
                  parseFloat(selectedVariant.price.amount) > 0 &&
                  parseFloat(selectedVariant.compareAtPrice.amount) >
                    parseFloat(selectedVariant.price.amount) && (
                    <small className="discountedPrice">
                      <Money data={selectedVariant.compareAtPrice} />
                    </small>
                  )}
              </div>
            </div>

            {descriptionHtml ? (
              <div
                className="product-modal-description"
                dangerouslySetInnerHTML={{__html: descriptionHtml}}
              />
            ) : isLoadingDetails ? (
              <p className="product-modal-description">Loading details...</p>
            ) : (
              <p className="product-modal-description">
                No description available for this product.
              </p>
            )}

            <div className="product-modal-actions">
              <AddToCartButton
                className="product-modal-atc"
                disabled={!canAdd}
                onClick={async () => {
                  if (!selectedVariant) return;

                  if (hasMultipleVariants) {
                    window.location.href = `/products/${product.handle}`;
                    return;
                  }

                  await revalidator.revalidate();
                  openCart('cart');
                }}
                lines={
                  selectedVariantForCart
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
                contentId={product?.id}
              >
                {!selectedVariant
                  ? 'Unavailable'
                  : !selectedVariant.availableForSale
                  ? 'Sold out'
                  : parseFloat(selectedVariant.price.amount) === 0
                  ? 'Call for Price'
                  : hasMultipleVariants
                  ? 'Select Options'
                  : 'Add to cart'}
              </AddToCartButton>

              <Link
                className="product-modal-view-link"
                to={`/products/${encodeURIComponent(product.handle)}`}
                onClick={onClose}
              >
                View full details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductItem({product, showFreeShippingTags}) {
  const ref = useRef(null);
  const {open} = useAside();
  const revalidator = useRevalidator();

  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewLoading, setQuickViewLoading] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [isSoldOut, setIsSoldOut] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);

  const displayProduct = quickViewProduct || product;
  const images = displayProduct.images?.nodes || [];

  useEffect(() => {
    const soldOut = !displayProduct.variants?.nodes?.some(
      (v) => v.availableForSale,
    );
    setIsSoldOut(soldOut);
  }, [displayProduct]);

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
    displayProduct.variants?.nodes?.find((v) => v.availableForSale) ||
    displayProduct.variants?.nodes?.[0] ||
    null;

  const showFreeShipping =
    showFreeShippingTags &&
    (displayProduct.tags || []).some((tag) =>
      FREE_SHIPPING_TAGS.has(tag.toLowerCase().trim()),
    );

  const showWishlist = !!(
    selectedVariant &&
    selectedVariant.availableForSale &&
    Number(selectedVariant?.price?.amount) > 0
  );

  const ensureQuickViewLoaded = useCallback(() => {
    if (quickViewProduct || quickViewLoading) return;
    if (!product?.handle) return;

    setQuickViewLoading(true);
    fetch(`/api/home-product?handle=${encodeURIComponent(product.handle)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load product: ${product.handle}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data?.product) {
          setQuickViewProduct(data.product);
        }
      })
      .catch((error) => {
        console.error('Quick view product fetch failed', error);
      })
      .finally(() => {
        setQuickViewLoading(false);
      });
  }, [product?.handle, quickViewLoading, quickViewProduct]);

  const handleMouseEnter = () => images.length > 1 && setCurrentImageIndex(1);
  const handleMouseLeave = () => setCurrentImageIndex(0);

  const openModal = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    ensureQuickViewLoaded();
    setIsModalClosing(false);
    setIsModalOpen(true);
  }, [ensureQuickViewLoaded]);

  const closeModal = useCallback(() => {
    setIsModalClosing(true);
  }, []);

  const finalizeClose = useCallback(() => {
    setIsModalOpen(false);
    setIsModalClosing(false);
  }, []);

  return (
    <div ref={ref} className="product-card">
      {showWishlist && (
        <WishlistButton product={product} variantId={selectedVariant?.id} />
      )}

      {/* + Quick View Button */}
      <button
        type="button"
        className="product-info-plus"
        onClick={openModal}
        aria-label="Quick view"
        title="Quick view"
      >
        <svg
          width="22px"
          height="22px"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></g>
          <g id="SVGRepo_iconCarrier">
            {' '}
            <path
              d="M4 12H20M12 4V20"
              stroke="#2172af"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>{' '}
          </g>
        </svg>
      </button>

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
              {(() => {
                const imageUrl = images[currentImageIndex]?.url || '';
                const src = addWidthParam(imageUrl, 320);
                const srcSet = imageUrl
                  ? `${addWidthParam(imageUrl, 200)} 200w, ${addWidthParam(
                      imageUrl,
                      320,
                    )} 320w, ${addWidthParam(imageUrl, 480)} 480w`
                  : undefined;

                return (
                  <img
                    src={src}
                    alt={product.title}
                    srcSet={srcSet}
                    sizes="200px"
                    width={180}
                    height={180}
                    loading="lazy"
                    decoding="async"
                    className={`product-image image${fadeIn ? ' loaded' : ''}${
                      firstLoad ? ' no-transition' : ''
                    }`}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                );
              })()}
            </div>
          </div>
        )}

        <p className="product-title">{product.title}</p>

        <div className="product-price">
          {selectedVariant?.price &&
          parseFloat(selectedVariant.price.amount) === 0 ? (
            'Call for Price!'
          ) : selectedVariant?.price ? (
            <Money data={selectedVariant.price} />
          ) : null}

          {selectedVariant?.compareAtPrice &&
            selectedVariant?.price &&
            parseFloat(selectedVariant.price.amount) > 0 &&
            parseFloat(selectedVariant.compareAtPrice.amount) >
              parseFloat(selectedVariant.price.amount) && (
              <small className="discountedPrice">
                <Money data={selectedVariant.compareAtPrice} />
              </small>
            )}
        </div>

        {showFreeShipping && (
          <div className="product-free-shipping">
            <svg
              className="bc-free-delivery-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              width="18"
              height="18"
            >
              <rect x="3" y="7" width="11" height="9" rx="1.2" fill="#1f6feb" />
              <path d="M14 10h4l3 3v3h-7z" fill="#2ea043"></path>
              <path d="M16 11h2.6l1.4 1.4H16z" fill="#a5d6ff"></path>
              <circle cx="7" cy="18" r="1.7" fill="#111"></circle>
              <circle cx="18" cy="18" r="1.7" fill="#111"></circle>
            </svg>
            <span>Free Shipping</span>
          </div>
        )}
      </Link>

      <ProductQuickViewModal
        product={displayProduct}
        images={images}
        selectedVariant={selectedVariant}
        isOpen={isModalOpen}
        isClosing={isModalClosing}
        isLoadingDetails={quickViewLoading && !quickViewProduct}
        onClose={closeModal}
        onAfterClose={finalizeClose}
        openCart={open}
        revalidator={revalidator}
      />
    </div>
  );
}
