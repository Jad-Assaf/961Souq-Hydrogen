import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {Link} from '@remix-run/react';
import {Money} from '@shopify/hydrogen';

const API_URL = 'https://961souqs.myshopify.com/api/2025-04/graphql.json';
const API_TOKEN = 'e00803cf918c262c99957f078d8b6d44';

/** Tuning */
const SOURCE_LIMIT = 30; // ~30 history source IDs
const OUTPUT_LIMIT = 120; // total cards we’re willing to show
const BATCH_SIZE = 8; // how many cards to append per “page”
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours (correct)
const HARD_TIMEOUT_MS = 1800; // abort slow requests
const SKELETON_HEIGHT = 440; // reserve space to avoid CLS
const SKELETON_CARD_H = 357;

export default function RelatedProductsFromHistory({currentProductId}) {
  const [heading, setHeading] = useState('');
  const [rendered, setRendered] = useState([]); // cards currently rendered
  const [pool, setPool] = useState([]); // full deduped pool we can page from
  const [page, setPage] = useState(1); // pagination page (1-based)
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapped, setIsBootstrapped] = useState(false); // first paint ready

  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false); // avoid double triggers

  // -------- pull history ids (client only) --------
  const sourceIds = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const viewed = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
    const list = currentProductId
      ? viewed.filter((id) => id !== currentProductId)
      : viewed;
    return list.slice(0, SOURCE_LIMIT);
  }, [currentProductId]);

  // -------- bootstrap from cache immediately + set heading --------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const now = Date.now();
    const collected = [];

    if (sourceIds.length) {
      for (const id of sourceIds) {
        const raw = sessionStorage.getItem(cacheKey(id));
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed.expires > now && Array.isArray(parsed.items)) {
            collected.push(...parsed.items);
          } else {
            sessionStorage.removeItem(cacheKey(id));
          }
        } catch {
          sessionStorage.removeItem(cacheKey(id));
        }
      }
      setHeading('Based on items you viewed');
    } else {
      setHeading('Random Items');
    }

    if (collected.length) {
      const deduped = dedupe(collected, currentProductId);
      setPool(deduped.slice(0, OUTPUT_LIMIT));
      // pre-render first page immediately
      setRendered(deduped.slice(0, Math.min(BATCH_SIZE, OUTPUT_LIMIT)));
      setPage(1);
      setIsBootstrapped(true);
    } else {
      // nothing cached => show skeleton, then fetch
      setPool([]);
      setRendered([]);
      setPage(0); // nothing rendered yet
      setIsBootstrapped(false);
    }
  }, [sourceIds, currentProductId]);

  // -------- fetch data (history → recs OR random fallback) --------
  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HARD_TIMEOUT_MS);

    (async () => {
      setIsLoading(true);

      // If no history: fetch random pool once
      if (!sourceIds.length) {
        const items = await fetchRandomProducts(controller.signal).catch(
          () => [],
        );
        if (aborted) return;
        const deduped = dedupe(items, currentProductId).slice(0, OUTPUT_LIMIT);
        setPool(deduped);

        // if nothing was rendered from cache, render page 1 now
        if (!isBootstrapped) {
          const firstPage = deduped.slice(
            0,
            Math.min(BATCH_SIZE, OUTPUT_LIMIT),
          );
          setRendered(firstPage);
          setPage(firstPage.length ? 1 : 0);
          setIsBootstrapped(true);
        }

        setIsLoading(false);
        return;
      }

      // With history: fetch only missing/expired source recs in parallel
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

      if (needed.length) {
        const results = await Promise.allSettled(
          needed.map((id) => fetchRecommendationsForId(id, controller.signal)),
        );
        // write cache per source
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
      }

      // merge everything from cache after fetch
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
        const deduped = dedupe(merged, currentProductId).slice(0, OUTPUT_LIMIT);
        setPool(deduped);

        // if nothing was rendered from cache, render page 1 now
        if (!isBootstrapped) {
          const firstPage = deduped.slice(
            0,
            Math.min(BATCH_SIZE, OUTPUT_LIMIT),
          );
          setRendered(firstPage);
          setPage(firstPage.length ? 1 : 0);
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

  // -------- infinite “load more” when reaching the end --------
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
    setPage((p) => p + 1);
  }, [pool]);

  // Observe the last rendered card to trigger loadMore
  useEffect(() => {
    if (!rendered.length) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // Only load more if we still have items available in the pool
          if (rendered.length < Math.min(pool.length, OUTPUT_LIMIT)) {
            loadMore();
          }
        }
      },
      {rootMargin: '200px 0px 0px 0px', threshold: 0.01},
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rendered, pool, loadMore]);

  // -------- UI --------

  const showSkeleton = !isBootstrapped && (isLoading || rendered.length === 0);

  return (
    <div className="collection-section">
      <h2>{heading}</h2>

      {showSkeleton ? (
        <SkeletonRow count={8} fixedHeight={SKELETON_HEIGHT} />
      ) : !rendered.length ? null : (
        <div
          className="product-row-container"
          style={{minHeight: SKELETON_HEIGHT}}
        >
          <button
            className="home-prev-button"
            onClick={() => scrollRow?.(-600)}
          >
            <LeftArrowIcon />
          </button>

          <div className="collection-products-row">
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

async function fetchRandomProducts(signal) {
  // BEST_SELLING as a proxy for “good” randoms; shuffle client-side
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

/* ------------ helpers ------------ */

function cacheKey(sourceId) {
  return `recs:${sourceId}`;
}

function dedupe(list, currentProductId) {
  const map = new Map();
  for (const p of list) {
    if (!p || p.id === currentProductId) continue;
    if (!map.has(p.id)) map.set(p.id, p);
  }
  return Array.from(map.values());
}

/* ------------ UI ------------ */

function SkeletonRow({count = 8, fixedHeight = SKELETON_HEIGHT}) {
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
          width: 150px; height: 150px; border-radius: 8px;
          background: linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%);
          background-size: 400% 100%; animation: sh 1.1s ease-in-out infinite;
        }
        .skeleton-line {
          height: 12px; margin-top: 8px; border-radius: 6px;
          width: 80%;
          background: linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%);
          background-size: 400% 100%; animation: sh 1.1s ease-in-out infinite;
        }
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
