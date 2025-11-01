// app/components/WishlistButton.jsx
import React, {useMemo} from 'react';
import {useWishlist} from '~/lib/WishlistContext';

function urlFromImage(img) {
  if (!img) return null;
  const raw = img.url || img.src || img.originalSrc || null;
  if (!raw) return null;
  return typeof raw === 'string' && raw.startsWith('//') ? `https:${raw}` : raw;
}

export default function WishlistButton({
  product,
  variantId,
  className,
  style,
  addLabel = 'Add to wishlist',
  inLabel = 'In wishlist',
}) {
  const {toggle, contains} = useWishlist();

  const entry = useMemo(() => {
    const vId =
      variantId ||
      product?.selectedVariant?.id ||
      product?.variants?.nodes?.[0]?.id ||
      product?.defaultVariant?.id ||
      null;

    const variantObj =
      product?.variants?.nodes?.find((x) => x.id === vId) ||
      product?.selectedVariant ||
      product?.variants?.nodes?.[0];

    // Keep your original priority but add nodes() support and a media-image fallback
    const imageUrl =
      urlFromImage(variantObj?.image) ||
      urlFromImage(product?.images?.nodes?.[0]) || // added
      urlFromImage(product?.images?.edges?.[0]?.node) ||
      urlFromImage(product?.featuredImage) ||
      urlFromImage(
        product?.media?.nodes?.find((m) => m?.__typename === 'MediaImage')
          ?.image,
      ) ||
      null;

    return {
      productId: product?.id,
      variantId: vId,
      handle: product?.handle,
      title: product?.title,
      image: imageUrl, // direct URL string
      price:
        variantObj?.price?.amount ??
        product?.selectedVariant?.price?.amount ??
        product?.priceRange?.minVariantPrice?.amount ??
        null,

      currency:
        variantObj?.price?.currencyCode ??
        product?.selectedVariant?.price?.currencyCode ??
        product?.priceRange?.minVariantPrice?.currencyCode ??
        null,

      url: product?.handle ? `/products/${product.handle}` : null,
    };
  }, [product, variantId]);

  const active = contains(entry.productId);
  const labelText = active ? inLabel : addLabel;

  return (
    <div className="wishlist-button-wrap">
      <button
        type="button"
        aria-pressed={active}
        aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
        className={`wishlist-button ${active ? 'is-active' : ''} ${
          className || ''
        }`.trim()}
        style={style}
        onClick={() => toggle(entry)}
      >
        {/* Heart SVG with dynamic fill */}
        <svg
          width="25"
          height="25"
          viewBox="-1.6 -1.6 19.20 19.20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="#2172af"
          strokeWidth="1"
          aria-hidden="true"
          className="wishlist-heart"
        >
          <path
            d="M1.24264 8.24264L8 15L14.7574 8.24264C15.553 7.44699 16 6.36786 16 5.24264V5.05234C16 2.8143 14.1857 1 11.9477 1C10.7166 1 9.55233 1.55959 8.78331 2.52086L8 3.5L7.21669 2.52086C6.44767 1.55959 5.28338 1 4.05234 1C1.8143 1 0 2.8143 0 5.05234V5.24264C0 6.36786 0.44699 7.44699 1.24264 8.24264Z"
            fill={active ? '#2172af' : '#ffffff'}
          />
        </svg>
      </button>

      {/* Live-updating status text under the button */}
      <span
        className="wishlist-status-text"
        aria-live="polite"
        style={{fontSize: 12, marginTop: 6}}
      >
        {labelText}
      </span>
    </div>
  );
}
