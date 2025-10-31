import React, {useEffect, useMemo, useState} from 'react';
import {Link} from '@remix-run/react';
import {Money} from '@shopify/hydrogen';

const API_URL = 'https://961souqs.myshopify.com/api/2025-04/graphql.json';
const API_TOKEN = 'e00803cf918c262c99957f078d8b6d44';

const SOURCE_LIMIT = 20; // use only first 2 history items for speed
const OUTPUT_LIMIT = 100; // max cards to render
const CACHE_TTL_MS = 6 * 60 * 60 * 10000; // 6h
const HARD_TIMEOUTMS = 1800; // cut slow requests

export default function RelatedProductsFromHistory({currentProductId}) {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // read history synchronously
  const sourceIds = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const viewed = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
    const list = currentProductId
      ? viewed.filter((id) => id !== currentProductId)
      : viewed;
    return list.slice(0, SOURCE_LIMIT);
  }, [currentProductId]);

  // 1) paint from cache immediately (if any)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    const merged = [];

    for (const id of sourceIds) {
      const raw = sessionStorage.getItem(cacheKey(id));
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.expires > now && Array.isArray(parsed.items)) {
          merged.push(...parsed.items);
        } else {
          sessionStorage.removeItem(cacheKey(id));
        }
      } catch {
        sessionStorage.removeItem(cacheKey(id));
      }
    }

    if (merged.length) {
      setRelatedProducts(dedupeAndLimit(merged, currentProductId));
    } else {
      setRelatedProducts([]); // ensures skeleton shows
    }
  }, [sourceIds, currentProductId]);

  // 2) fetch only missing/expired sources in parallel; SWR style
  useEffect(() => {
    if (!sourceIds.length) {
      setRelatedProducts([]);
      return;
    }

    let aborted = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HARD_TIMEOUTMS);

    (async () => {
      const now = Date.now();
      const needed = sourceIds.filter((id) => {
        const raw = sessionStorage.getItem(cacheKey(id));
        if (!raw) return true;
        try {
          const parsed = JSON.parse(raw);
          return !(parsed.expires > now && Array.isArray(parsed.items));
        } catch {
          return true;
        }
      });

      if (!needed.length) return; // everything painted from cache

      setIsUpdating(true);

      // parallel fetch
      const results = await Promise.allSettled(
        needed.map((id) => fetchRecommendationsForId(id, controller.signal)),
      );

      // write cache per-source
      results.forEach((res, idx) => {
        const sourceId = needed[idx];
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          sessionStorage.setItem(
            cacheKey(sourceId),
            JSON.stringify({
              items: res.value,
              expires: Date.now() + CACHE_TTL_MS,
            }),
          );
        }
      });

      // merge: cached (for all sources) + fresh
      if (!aborted) {
        const merged = [];
        for (const id of sourceIds) {
          const raw = sessionStorage.getItem(cacheKey(id));
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.items)) merged.push(...parsed.items);
          } catch {}
        }
        setRelatedProducts(dedupeAndLimit(merged, currentProductId));
        setIsUpdating(false);
      }
    })();

    return () => {
      aborted = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [sourceIds, currentProductId]);

  if (!relatedProducts.length && !isUpdating) return null;

  return (
    <div className="collection-section">
      <h2>Related Products Based on Your Browsing</h2>

      {!relatedProducts.length ? (
        <SkeletonRow count={4} />
      ) : (
        <div className="product-row-container">
          <button
            className="home-prev-button"
            onClick={() => scrollRow?.(-600)}
          >
            <LeftArrowIcon />
          </button>
          <div className="collection-products-row">
            {relatedProducts.map((product, index) => (
              <RelatedProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>
          <button className="home-next-button" onClick={() => scrollRow?.(600)}>
            <RightArrowIcon />
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------ networking ------------ */

async function fetchRecommendationsForId(productId, signal) {
  const query = `
    query productRecommendations($productId: ID!) {
      productRecommendations(productId: $productId) {
        id
        title
        handle
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
      }
    }
  `;

  const res = await fetch(API_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': API_TOKEN,
    },
    body: JSON.stringify({query, variables: {productId}}),
  });

  const json = await res.json();
  if (json?.errors) {
    console.error('GraphQL errors:', json.errors);
    return [];
  }
  return json?.data?.productRecommendations || [];
}

/* ------------ helpers ------------ */

function cacheKey(sourceId) {
  return `recs:${sourceId}`;
}

function dedupeAndLimit(list, currentProductId) {
  const map = new Map();
  for (const p of list) {
    if (!p || p.id === currentProductId) continue;
    if (!map.has(p.id)) map.set(p.id, p);
    if (map.size >= OUTPUT_LIMIT) break;
  }
  return Array.from(map.values());
}

/* ------------ UI ------------ */

function SkeletonRow({count = 4}) {
  return (
    <div className="product-row-container">
      <div className="collection-products-row">
        {Array.from({length: count}).map((_, i) => (
          <div key={i} className="product-item">
            <div className="product-card skeleton">
              <div className="skeleton-img" />
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RelatedProductCard({product, index}) {
  const firstPrice = product.priceRange?.minVariantPrice;
  return (
    <div className="product-item" style={{transitionDelay: `${index * 40}ms`}}>
      <div className="product-card">
        <Link to={`/products/${encodeURIComponent(product.handle)}`}>
          <img
            src={`${product.featuredImage.url}&width=200`}
            alt={product.featuredImage.altText || product.title}
            width="150"
            height="150"
            loading={index < 2 ? 'eager' : 'lazy'}
            fetchpriority={index < 2 ? 'high' : 'auto'}
            decoding="async"
          />
          <div className="product-title">{product.title}</div>
          <div className="product-price">
            {firstPrice && Number(firstPrice.amount) > 0 ? (
              <Money data={firstPrice} />
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
