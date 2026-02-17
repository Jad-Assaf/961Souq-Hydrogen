// app/routes/wishlist.jsx
import {CartForm} from '@shopify/hydrogen';
import {Link, useFetcher} from '@remix-run/react';
import React, {useEffect, useMemo, useState} from 'react';
import {useWishlist} from '~/lib/WishlistContext';
import {json} from '@shopify/remix-oxygen';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [
    {title: '961Souq | Wishlist'},
    {name: 'robots', content: 'noindex, nofollow'},
  ];
};

/* -------------------------------------------
   Server: fetch product thumbs + prices
------------------------------------------- */
const WISHLIST_THUMBS_QUERY = `#graphql
  query WishlistThumbs($query: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 50, query: $query) {
      nodes {
        handle

        featuredImage { url }
        images(first: 1) { edges { node { url } } }

        priceRange {
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }

        variants(first: 250) {
          nodes {
            id
            availableForSale
            image { url }
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
          }
        }
      }
    }
  }
`;

function extractHandle(url) {
  if (!url) return null;
  const match = url.match(/\/products\/([^/?#]+)/);
  return match ? match[1] : null;
}

function buildWishlistOptimisticVariant(item) {
  if (!item?.variantId) return null;
  const handle = item.handle || extractHandle(item.url);
  return {
    id: item.variantId,
    title: item.title || 'Item',
    image: item.image
      ? {
          url: item.image,
          altText: item.title || 'Item',
        }
      : null,
    selectedOptions: [],
    product: {
      title: item.title || 'Item',
      handle,
    },
  };
}

export async function action({request, context}) {
  const {storefront} = context;

  try {
    // Support both JSON and FormData submissions
    const ct = request.headers.get('content-type') || '';
    let items = [];
    if (ct.includes('application/json')) {
      const body = await request.json();
      items = Array.isArray(body?.items) ? body.items : [];
    } else {
      const fd = await request.formData();
      const raw = fd.get('items');
      if (raw) items = JSON.parse(String(raw));
    }

    if (!Array.isArray(items) || items.length === 0) {
      return json({images: {}, prices: {}});
    }

    // Unique handles
    const handles = Array.from(
      new Set(
        items
          .map((i) => i?.handle)
          .filter(Boolean)
          .map((h) => h.trim()),
      ),
    );
    if (handles.length === 0) return json({images: {}, prices: {}});

    // Build search query like: handle:foo OR handle:bar
    const queryStr = handles.map((h) => `handle:${h}`).join(' OR ');

    const data = await storefront.query(WISHLIST_THUMBS_QUERY, {
      variables: {query: queryStr},
    });

    const byHandle = new Map();
    for (const p of data?.products?.nodes || []) {
      byHandle.set(p.handle, p);
    }

    const images = {}; // { [handle]: urlWithQuality }
    const prices = {}; // { [handle]: {amount, currencyCode} }

    for (const item of items) {
      const handle = item?.handle?.trim();
      const wantedVariantId = item?.variantId || null;
      if (!handle) continue;

      const p = byHandle.get(handle);
      if (!p) continue;

      // ---- image (prefer matching variant, then featured, then first image)
      let url =
        p.variants?.nodes?.find((v) => v.id === wantedVariantId)?.image?.url ||
        p.featuredImage?.url ||
        p.images?.edges?.[0]?.node?.url ||
        null;

      if (typeof url === 'string' && url.startsWith('//')) url = `https:${url}`;
      if (url)
        images[handle] = `${url}${url.includes('?') ? '&' : '?'}quality=15`;

      // ---- price (prefer variant price if variantId exists, else product minVariantPrice)
      const vMatch = p.variants?.nodes?.find((v) => v.id === wantedVariantId);
      const best = vMatch?.price ?? p.priceRange?.minVariantPrice ?? null;

      if (best?.amount && best?.currencyCode) {
        prices[handle] = {
          amount: best.amount,
          currencyCode: best.currencyCode,
        };
      }
    }

    return json({images, prices});
  } catch {
    // fail-safe: empty maps
    return json({images: {}, prices: {}});
  }
}

/* -------------------------------------------
   Client: wishlist page
------------------------------------------- */
export default function WishlistPage() {
  const {items, remove, clear} = useWishlist();
  const fetcher = useFetcher();
  const [imgMap, setImgMap] = useState({}); // {handle: imageUrl}
  const [priceMap, setPriceMap] = useState({}); // {handle: {amount, currencyCode}}

  // Prepare compact payload (handle + variantId)
  const payload = useMemo(
    () =>
      items
        .map((i) => ({
          handle: i.handle || i.product?.handle || null,
          variantId: i.variantId || null,
        }))
        .filter((x) => x.handle),
    [items],
  );

  // Build "Add All" lines — MUST be declared before any early return
  const allLines = useMemo(
    () =>
      items
        .filter((i) => i.variantId)
        .map((i) => ({
          merchandiseId: i.variantId,
          quantity: 1,
          selectedVariant: buildWishlistOptimisticVariant(i),
        })),
    [items],
  );

  // Fetch images + prices from server when wishlist changes
  useEffect(() => {
    if (!payload.length) {
      setImgMap({});
      setPriceMap({});
      return;
    }
    const fd = new FormData();
    fd.append('items', JSON.stringify(payload));
    fetcher.submit(fd, {method: 'post'});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(payload)]);

  // Store results
  useEffect(() => {
    if (fetcher.data?.images) setImgMap(fetcher.data.images);
    if (fetcher.data?.prices) setPriceMap(fetcher.data.prices);
  }, [fetcher.data]);

  // Safe early return (after all hooks above have run)
  if (!items.length) {
    return (
      <section className="wishlist-container">
        <h1 style={{margin: '20px', fontSize: '30px'}}>Wishlist</h1>
        <svg
          width="100px"
          height="100px"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="#2172af"
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
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z"
              stroke="#2172af"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>{' '}
          </g>
        </svg>
        <p style={{marginBottom: '20px', fontSize: '36px'}}>
          Your wishlist is empty.
        </p>
        <p
          style={{
            marginBottom: '10px',
            fontSize: '18px',
            color: 'grey',
            fontStyle: 'italic',
          }}
        >
          You don't have any products in your wishlist yet. Click the button
          below to browse all our products.
        </p>
        <Link
          to="/collections/new-arrivals"
          style={{
            display: 'inline-block',
            marginTop: '12px',
            color: '#2172af',
            background: 'rgba(255, 255, 255, 0.88)',
            padding: '12px 24px',
            borderRadius: '30px',
            border: '1px solid #cfe0ef',
          }}
        >
          Browse products →
        </Link>
      </section>
    );
  }

  return (
    <section className="wishlist-page">
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h1>Wishlist</h1>
        {/* <button onClick={clear} className="wishlist-clear-btn">
          Clear All
        </button> */}
      </header>

      <div className="wishlist-grid">
        {items.map((item) => {
          const handle = item.handle || item.product?.handle || '';

          // ----- image (prefer server image; fallback to stored)
          const raw =
            imgMap[handle] ||
            (typeof item.image === 'string' && item.image) ||
            item.image?.url ||
            '';
          const src =
            raw && !raw.includes('quality=')
              ? `${raw}${raw.includes('?') ? '&' : '?'}quality=15`
              : raw;

          // ----- price (prefer stored; fallback to server by handle)
          const srv = priceMap[handle];
          const amount = item.price ?? srv?.amount;
          const currency = item.currency ?? srv?.currencyCode;

          return (
            <article key={item.productId || handle} className="wishlist-card">
              <Link to={item.url || '#'} className="wishlist-thumb">
                <img
                  src={src}
                  alt={item.title || 'Wishlist item'}
                  loading="lazy"
                />
              </Link>

              <div className="wishlist-info">
                <Link to={item.url || '#'} className="wishlist-title">
                  {item.title}
                </Link>

                {amount != null && (
                  <div className="wishlist-price">
                    ${Number(amount).toFixed(2)} {currency || ''}
                  </div>
                )}
              </div>

              <div className="wishlist-actions">
                {item.variantId ? (
                  <CartForm
                    route="/cart"
                    action={CartForm.ACTIONS.LinesAdd}
                    inputs={{
                      lines: [
                        {
                          merchandiseId: item.variantId,
                          quantity: 1,
                          selectedVariant: buildWishlistOptimisticVariant(item),
                        },
                      ],
                    }}
                  >
                    <button type="submit" className="wishlist-add-btn">
                      Add to Cart
                    </button>
                  </CartForm>
                ) : (
                  <button className="wishlist-add-btn disabled-look" disabled>
                    Variant unavailable
                  </button>
                )}

                <button
                  className="wishlist-remove-btn"
                  onClick={() => remove(item.productId)}
                >
                  Remove
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {allLines.length > 0 && (
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            margin: '20px auto',
          }}
        >
          <CartForm
            route="/cart"
            action={CartForm.ACTIONS.LinesAdd}
            inputs={{lines: allLines}}
          >
            <button type="submit" className="wishlist-addall-btn">
              Add All to Cart
            </button>
          </CartForm>
          <Link to="/cart" className="wishlist-gotocart-link">
            Go to Cart →
          </Link>
        </div>
      )}
    </section>
  );
}
