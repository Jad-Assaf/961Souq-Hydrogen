// app/components/RelatedProductsFromHistory.jsx
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {Link} from '@remix-run/react';
import {Money} from '@shopify/hydrogen';

const API_URL = 'https://961souqs.myshopify.com/api/2025-04/graphql.json';
const API_TOKEN = 'e00803cf918c262c99957f078d8b6d44';

/** Tuning */
const SOURCE_LIMIT = 30; // how many history IDs to consider
const OUTPUT_LIMIT = 120; // total cards to render at most
const BATCH_SIZE = 8; // cards per “page”
const CACHE_TTL_MS = 600 * 60 * 60 * 1000; // 6 hours? (Note: value is ~600h)
const HARD_TIMEOUT_MS = 1800; // abort slow requests
const SKELETON_HEIGHT = 400; // reserve container height
const SKELETON_CARD_H = 357; // skeleton card height

// NEW: minimal customer-account tracking on product click
function trackAccountProductView({id, handle, source = 'related-history'}) {
  try {
    fetch('/api/track/view', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({id, handle, source}),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export default function RelatedProductsFromHistory({currentProductId}) {
  const [heading, setHeading] = useState('');
  const [rendered, setRendered] = useState([]);
  const [pool, setPool] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  const [serverIds, setServerIds] = useState([]); // NEW: ids from cookie-based history

  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);

  // horizontal scroll ref + handler (for prev/next buttons)
  const rowRef = useRef(null);
  const scrollRow = useCallback((delta) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({left: delta, behavior: 'smooth'});
  }, []);

  // ---- NEW: fetch per-user cookie history (expanded to products -> IDs) ----
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/user/history?expand=products&limit=${SOURCE_LIMIT}`,
          {headers: {accept: 'application/json'}},
        );
        const data = await res.json().catch(() => ({}));
        const ids =
          Array.isArray(data?.products) && data.products.length
            ? data.products.map((p) => p.id).filter(Boolean)
            : [];
        if (!abort) setServerIds(ids);
      } catch {
        if (!abort) setServerIds([]);
      }
    })();
    return () => {
      abort = true;
    };
  }, []);

  // ---- read local history synchronously (client only) ----
  const localIds = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const viewed = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
    const list = currentProductId
      ? viewed.filter((id) => id !== currentProductId)
      : viewed;
    return list.slice(0, SOURCE_LIMIT);
  }, [currentProductId]);

  // ---- merge server + local sources for seed IDs ----
  const sourceIds = useMemo(() => {
    const merged = [...serverIds, ...localIds];
    // unique, preserve order
    const seen = new Set();
    const out = [];
    for (const id of merged) {
      if (id && !seen.has(id) && id !== currentProductId) {
        seen.add(id);
        out.push(id);
      }
    }
    return out.slice(0, SOURCE_LIMIT);
  }, [serverIds, localIds, currentProductId]);

  // ---- Bootstrap from cache ----
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const contiguous = readContiguousCached(sourceIds);
    setHeading(sourceIds.length ? 'Based on items you viewed' : 'Random Items');

    if (contiguous.length) {
      const deduped = dedupe(contiguous, currentProductId).slice(
        0,
        OUTPUT_LIMIT,
      );
      setPool(deduped);
      setRendered(deduped.slice(0, Math.min(BATCH_SIZE, deduped.length)));
      setIsBootstrapped(true);
    } else {
      setPool([]);
      setRendered([]);
      setIsBootstrapped(false);
    }
  }, [sourceIds, currentProductId]);

  // ---- Fetch data (history → recs OR random fallback) ----
  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HARD_TIMEOUT_MS);

    (async () => {
      setIsLoading(true);

      if (!sourceIds.length) {
        const items = await fetchRandomProducts(controller.signal).catch(
          () => [],
        );
        if (aborted) return;

        const deduped = dedupe(items, currentProductId).slice(0, OUTPUT_LIMIT);
        setPool(deduped);

        if (!isBootstrapped) {
          setRendered(deduped.slice(0, Math.min(BATCH_SIZE, deduped.length)));
          setIsBootstrapped(true);
        }

        setIsLoading(false);
        return;
      }

      const firstId = sourceIds[0];
      const hasValidFirst = hasValidCache(firstId);
      if (!hasValidFirst) {
        const first = await fetchRecommendationsForId(
          firstId,
          controller.signal,
        );
        if (!aborted && Array.isArray(first)) {
          writeCache(firstId, first);
          const contiguous = readContiguousCached(sourceIds);
          const deduped = dedupe(contiguous, currentProductId).slice(
            0,
            OUTPUT_LIMIT,
          );
          setPool(deduped);
          if (!isBootstrapped) {
            setRendered(deduped.slice(0, Math.min(BATCH_SIZE, deduped.length)));
            setIsBootstrapped(true);
          }
        }
      }

      const remaining = sourceIds.slice(1).filter((id) => !hasValidCache(id));
      if (remaining.length) {
        const results = await Promise.allSettled(
          remaining.map((id) =>
            fetchRecommendationsForId(id, controller.signal),
          ),
        );
        results.forEach((res, idx) => {
          const sourceId = remaining[idx];
          if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            writeCache(sourceId, res.value);
          }
        });
      }

      if (!aborted) {
        const mergedAll = readAllCached(sourceIds);
        const deduped = dedupe(mergedAll, currentProductId).slice(
          0,
          OUTPUT_LIMIT,
        );
        setPool(deduped);
        if (!isBootstrapped && deduped.length) {
          setRendered(deduped.slice(0, Math.min(BATCH_SIZE, deduped.length)));
          setIsBootstrapped(true);
        }
        setIsLoading(false);
      }
    })();

    return () => {
      clearTimeout(timer);
      controller.abort();
      aborted = true;
    };
  }, [sourceIds, currentProductId, isBootstrapped]);

  // ---- infinite “load more” when reaching the end ----
  const loadMore = useCallback(() => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;

    setRendered((prev) => {
      if (!pool.length) {
        loadingMoreRef.current = false;
        return prev;
      }
      const nextStart = prev.length;
      const nextEnd = Math.min(nextStart + BATCH_SIZE, pool.length);
      const slice = pool.slice(nextStart, nextEnd);
      loadingMoreRef.current = false;
      return slice.length ? prev.concat(slice) : prev;
    });
  }, [pool]);

  // Observe last card to trigger loadMore
  const sentinelIndex = rendered.length - 1;
  useEffect(() => {
    if (sentinelIndex < 0) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          rendered.length < Math.min(pool.length, OUTPUT_LIMIT)
        ) {
          loadMore();
        }
      },
      {rootMargin: '200px 0px 0px 0px', threshold: 0.01},
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rendered, pool, loadMore, sentinelIndex]);

  const showSkeleton = !isBootstrapped && (isLoading || rendered.length === 0);

  return (
    <div className="collection-section">
      <div
        className="section-head"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{margin: 0}}>{heading}</h2>

        <Link
          to={
            currentProductId
              ? `/recently-viewed?select=${encodeURIComponent(
                  currentProductId,
                )}`
              : '/recently-viewed'
          }
          className="view-all-link"
        >
          View all
        </Link>
      </div>

      {showSkeleton ? (
        <SkeletonRow count={8} fixedHeight={SKELETON_HEIGHT} />
      ) : !rendered.length ? null : (
        <div
          className="product-row-container"
          style={{minHeight: SKELETON_HEIGHT}}
        >
          <button
            className="home-prev-button"
            onClick={() => scrollRow(-600)}
            aria-label="Previous"
          >
            <LeftArrowIcon />
          </button>

          <div className="collection-products-row" ref={rowRef}>
            {rendered.map((product, index) => {
              const isLast = index === rendered.length - 1;
              return (
                <RelatedProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  refProp={isLast ? sentinelRef : undefined}
                />
              );
            })}
          </div>

          <button
            className="home-next-button"
            onClick={() => scrollRow(600)}
            aria-label="Next"
          >
            <RightArrowIcon />
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- networking ---------------- */

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

async function fetchRandomProducts(signal) {
  const query = `
    query RandomProducts {
      products(first: 100, sortKey: BEST_SELLING) {
        nodes {
          id
          handle
          title
          featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
        }
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
    body: JSON.stringify({query}),
  });
  const json = await res.json();
  if (json?.errors) {
    console.error('GraphQL errors (random):', json.errors);
    return [];
  }
  const nodes = json?.data?.products?.nodes || [];
  const arr = nodes.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ---------------- cache helpers ---------------- */

function cacheKey(id) {
  return `recs:${id}`;
}
function hasValidCache(id) {
  try {
    const raw = sessionStorage.getItem(cacheKey(id));
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed.expires > Date.now() && Array.isArray(parsed.items);
  } catch {
    return false;
  }
}
function writeCache(id, items) {
  try {
    sessionStorage.setItem(
      cacheKey(id),
      JSON.stringify({items, expires: Date.now() + CACHE_TTL_MS}),
    );
  } catch {}
}
function readContiguousCached(ids) {
  const out = [];
  for (const id of ids) {
    try {
      const raw = sessionStorage.getItem(cacheKey(id));
      if (!raw) break;
      const parsed = JSON.parse(raw);
      if (!(parsed.expires > Date.now() && Array.isArray(parsed.items))) break;
      out.push(...parsed.items);
    } catch {
      break;
    }
  }
  return out;
}
function readAllCached(ids) {
  const out = [];
  for (const id of ids) {
    try {
      const raw = sessionStorage.getItem(cacheKey(id));
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.items)) out.push(...parsed.items);
    } catch {}
  }
  return out;
}
function dedupe(list, currentProductId) {
  const map = new Map();
  for (const p of list) {
    if (!p || p.id === currentProductId) continue;
    if (!map.has(p.id)) map.set(p.id, p);
  }
  return Array.from(map.values());
}

/* ---------------- UI ---------------- */

function SkeletonRow({count = 8, fixedHeight = 400}) {
  return (
    <div
      className="product-row-container"
      style={{height: fixedHeight, display: 'grid', alignItems: 'center'}}
    >
      <div className="collection-products-row">
        {Array.from({length: count}).map((_, i) => (
          <div key={i} className="product-item">
            <div className="product-card skeleton" style={{height: 357}}>
              <div className="skeleton-img" />
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .product-card.skeleton { padding: 8px; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; box-sizing: border-box; }
        .skeleton-img { width: 150px; height: 150px; border-radius: 8px; background: linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%); background-size: 400% 100%; animation: sh 1.1s ease-in-out infinite; }
        .skeleton-line { height: 12px; margin-top: 8px; border-radius: 6px; width: 80%; background: linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%); background-size: 400% 100%; animation: sh 1.1s ease-in-out infinite; }
        .skeleton-line.short { width: 60%; }
        @keyframes sh { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
      `}</style>
    </div>
  );
}

function RelatedProductCard({product, index, refProp}) {
  const firstPrice = product.priceRange?.minVariantPrice;
  return (
    <div
      ref={refProp}
      className="product-item"
      style={{transitionDelay: `${index * 40}ms`}}
    >
      <div className="product-card">
        <Link
          to={`/products/${encodeURIComponent(product.handle)}`}
          onClick={() =>
            trackAccountProductView({
              id: product.id,
              handle: product.handle,
              source: 'related-history',
            })
          }
        >
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
