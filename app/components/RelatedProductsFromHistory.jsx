// app/components/RelatedProductsFromHistory.jsx
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {Link} from '@remix-run/react';
import {Money} from '@shopify/hydrogen';

const API_URL = 'https://961souqs.myshopify.com/api/2025-04/graphql.json';
const API_TOKEN = 'e00803cf918c262c99957f078d8b6d44';

/** Tuning */
const SOURCE_LIMIT = 15; // how many history IDs to consider
const OUTPUT_LIMIT = 24; // total cards to render at most
const BATCH_SIZE = 6; // cards per “page”
const CACHE_TTL_MS = 600 * 60 * 60 * 1000; // 6 hours
const HARD_TIMEOUT_MS = 8000; // abort slow requests
const SKELETON_HEIGHT = 400; // reserve container height
const SKELETON_CARD_H = 357; // skeleton card height

export default function RelatedProductsFromHistory({currentProductId}) {
  const [heading, setHeading] = useState('');
  const [rendered, setRendered] = useState([]);
  const [pool, setPool] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  const [serverIds, setServerIds] = useState([]); // ids from cookie-based history
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // NEW: readiness flags to prevent multi-wave jitter
  const [statusReady, setStatusReady] = useState(false);
  const [historyReady, setHistoryReady] = useState(false);

  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const rowRef = useRef(null);
  const scrollRow = useCallback((delta) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({left: delta, behavior: 'smooth'});
  }, []);

  // Keep ref in sync so fetch effect doesn't depend on isBootstrapped
  const isBootstrappedRef = useRef(false);
  useEffect(() => {
    isBootstrappedRef.current = isBootstrapped;
  }, [isBootstrapped]);

  // ---- check if customer is logged in ----
  useEffect(() => {
    let abort = false;

    (async () => {
      try {
        const res = await fetch('/api/user/status', {
          headers: {accept: 'application/json'},
        });
        const data = await res.json().catch(() => ({}));
        if (!abort) setIsLoggedIn(Boolean(data?.loggedIn));
      } catch {
        if (!abort) setIsLoggedIn(false);
      } finally {
        if (!abort) setStatusReady(true);
      }
    })();

    return () => {
      abort = true;
    };
  }, []);

  // ---- fetch per-user cookie history ----
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
      } finally {
        if (!abort) setHistoryReady(true);
      }
    })();

    return () => {
      abort = true;
    };
  }, []);

  // ---- read local history only after status is known ----
  const localIds = useMemo(() => {
    if (typeof window === 'undefined') return [];
    if (!statusReady) return [];
    if (isLoggedIn) return [];

    const viewed = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
    const list = currentProductId
      ? viewed.filter((id) => id !== currentProductId)
      : viewed;
    return list.slice(0, SOURCE_LIMIT);
  }, [currentProductId, isLoggedIn, statusReady]);

  // ---- merge server + local sources for seed IDs ----
  const sourceIds = useMemo(() => {
    const merged = [...serverIds, ...localIds];
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

  // ---- Bootstrap from cache (only after both sources ready) ----
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!statusReady || !historyReady) return;

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
  }, [sourceIds, currentProductId, statusReady, historyReady]);

  // ---- Fetch data (history → recs OR random fallback) ----
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!statusReady || !historyReady) return;

    let aborted = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HARD_TIMEOUT_MS);

    (async () => {
      setIsLoading(true);

      const booted = isBootstrappedRef.current;

      if (!sourceIds.length) {
        const items = await fetchRandomProducts(controller.signal).catch(
          () => [],
        );
        if (aborted) return;

        const deduped = dedupe(items, currentProductId).slice(0, OUTPUT_LIMIT);
        setPool(deduped);

        if (!booted) {
          setRendered(deduped.slice(0, Math.min(BATCH_SIZE, deduped.length)));
          setIsBootstrapped(true);
        }

        setIsLoading(false);
        return;
      }

      const firstId = sourceIds[0];

      if (!hasValidCache(firstId)) {
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

          if (!booted) {
            setRendered(deduped.slice(0, Math.min(BATCH_SIZE, deduped.length)));
            setIsBootstrapped(true);
          }
        }
      }

      // Fetch remaining with limited concurrency to reduce network jank
      const remaining = sourceIds
        .slice(1)
        .filter((id) => id && !hasValidCache(id));

      if (remaining.length) {
        const results = await fetchRecsWithConcurrency(
          remaining,
          controller.signal,
          3,
        );

        results.forEach(({id, items}) => {
          if (Array.isArray(items)) writeCache(id, items);
        });
      }

      if (!aborted) {
        const mergedAll = readAllCached(sourceIds);
        const deduped = dedupe(mergedAll, currentProductId).slice(
          0,
          OUTPUT_LIMIT,
        );
        setPool(deduped);

        if (!isBootstrappedRef.current && deduped.length) {
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
  }, [sourceIds, currentProductId, statusReady, historyReady]);

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

  const showSkeleton =
    !statusReady ||
    !historyReady ||
    (!isBootstrapped && (isLoading || rendered.length === 0));

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

async function fetchRecsWithConcurrency(ids, signal, concurrency = 3) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < ids.length) {
      const i = index++;
      const id = ids[i];

      try {
        const items = await fetchRecommendationsForId(id, signal);
        results.push({id, items});
      } catch {
        results.push({id, items: []});
      }
    }
  }

  const workers = Array.from({length: Math.min(concurrency, ids.length)}, () =>
    worker(),
  );

  await Promise.all(workers);
  return results;
}

async function fetchRandomProducts(signal) {
  const query = `
    query RandomProducts {
      products(first: 40, sortKey: BEST_SELLING) {
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
            <div
              className="product-card skeleton"
              style={{height: SKELETON_CARD_H}}
            >
              <div className="skeleton-img" />
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .product-card.skeleton {
          padding: 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          box-sizing: border-box;
        }
        .skeleton-img {
          width: 150px;
          height: 150px;
          border-radius: 8px;
          background: linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%);
          background-size: 400% 100%;
          animation: sh 1.1s ease-in-out infinite;
        }
        .skeleton-line {
          height: 12px;
          margin-top: 8px;
          border-radius: 6px;
          width: 80%;
          background: linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%);
          background-size: 400% 100%;
          animation: sh 1.1s ease-in-out infinite;
        }
        .skeleton-line.short { width: 60%; }
        @keyframes sh {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </div>
  );
}

function addWidthParam(url, width) {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('width', String(width));
    return u.toString();
  } catch {
    // fallback for non-standard URLs
    const joiner = url.includes('?') ? '&' : '?';
    return `${url}${joiner}width=${width}`;
  }
}

function RelatedProductCard({product, index, refProp}) {
  const firstPrice = product.priceRange?.minVariantPrice;
  const imgUrl = addWidthParam(product.featuredImage?.url, 200);

  return (
    <div ref={refProp} className="product-item">
      <div className="product-card">
        <Link to={`/products/${encodeURIComponent(product.handle)}`}>
          {product.featuredImage?.url ? (
            <img
              src={imgUrl}
              alt={product.featuredImage.altText || product.title}
              width="150"
              height="150"
              loading={index < 2 ? 'eager' : 'lazy'}
              fetchpriority={index < 2 ? 'high' : 'auto'}
              decoding="async"
            />
          ) : null}

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
