// app/routes/recently-viewed.jsx
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {Link, useSearchParams, useLoaderData} from '@remix-run/react';
import {Money, CartForm} from '@shopify/hydrogen';
import {json} from '@shopify/remix-oxygen';

export async function loader({context}) {
  const {PUBLIC_STOREFRONT_API_TOKEN, PUBLIC_STORE_DOMAIN} = context.env;
  return json({
    API_URL: `https://${PUBLIC_STORE_DOMAIN}/api/2025-04/graphql.json`,
    API_TOKEN: PUBLIC_STOREFRONT_API_TOKEN,
  });
}

const SKELETON_CARD_H = 357;

/* ---------------- Utils ---------------- */
function truncateWords(text, maxWords = 50) {
  if (!text) return '';
  const words = String(text).trim().split(/\s+/);
  return words.length <= maxWords
    ? words.join(' ')
    : words.slice(0, maxWords).join(' ') + '…';
}

/* ---------------- GraphQL helpers ---------------- */

async function fetchProductsByIds(ids, signal, API_URL, API_TOKEN) {
  if (!ids.length) return [];
  const query = `
    query ProductsByIds($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          handle
          title
          description
          featuredImage { url altText }
          availableForSale
          priceRange { minVariantPrice { amount currencyCode } }
          variants(first: 1) {
            nodes { id availableForSale }
          }
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
    body: JSON.stringify({query, variables: {ids}}),
  });
  const json = await res.json();
  if (json?.errors) {
    console.error('GraphQL errors (productsByIds):', json.errors);
    return [];
  }
  const nodes = json?.data?.nodes || [];
  return nodes.filter(Boolean);
}

async function fetchRecommendationsForId(
  productId,
  signal,
  API_URL,
  API_TOKEN,
) {
  const query = `
    query productRecommendationsAndCollection($productId: ID!) {
      productRecommendations(productId: $productId) {
        id
        title
        handle
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
      }
      product(id: $productId) {
        collections(first: 2) {
          nodes {
            products(first: 90) {
              nodes {
                id
                title
                handle
                featuredImage { url altText }
                priceRange { minVariantPrice { amount currencyCode } }
              }
            }
          }
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
    body: JSON.stringify({query, variables: {productId}}),
  });

  const json = await res.json();
  if (json?.errors) {
    console.error('GraphQL errors (recs):', json.errors);
    return [];
  }

  const recs = json?.data?.productRecommendations || [];
  const collectionProducts =
    json?.data?.product?.collections?.nodes?.flatMap((c) => c.products.nodes) ||
    [];

  const combined = [...recs, ...collectionProducts];
  const seen = new Map();
  const unique = combined.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.set(p.id, true);
    return true;
  });

  return unique.slice(0, 90);
}

/* ---------------- Page ---------------- */

export default function RecentlyViewedPage() {
  const {API_URL, API_TOKEN} = useLoaderData();
  const [searchParams] = useSearchParams();
  const preselect = searchParams.get('select') || null;

  const [recent, setRecent] = useState([]); // recently viewed product objects
  const [selectedId, setSelectedId] = useState(null); // selected product id
  const [related, setRelated] = useState([]); // related products for selected
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false); // NEW

  // Thumbnails strip scroller
  const thumbsRef = useRef(null);
  const scrollThumbs = useCallback((delta) => {
    const el = thumbsRef.current;
    if (el) el.scrollBy({left: delta, behavior: 'smooth'});
  }, []);

  // NEW: check login state (new customer accounts)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/status', {
          headers: {accept: 'application/json'},
        });
        const json = await res.json().catch(() => ({}));
        if (!cancelled) setIsLoggedIn(Boolean(json?.loggedIn));
      } catch {
        if (!cancelled) setIsLoggedIn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load recent product IDs and fetch their data (merge server cookie + localStorage)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isMounted = true;

    (async () => {
      try {
        setLoadingRecent(true);

        // NEW: if logged in, ignore local storage completely
        const idsLocal = isLoggedIn
          ? []
          : Array.from(
              new Set(
                JSON.parse(localStorage.getItem('viewedProducts') || '[]'),
              ),
            );

        // Ask the server cookie (or server store) for expanded products
        const server = await fetch(
          '/api/user/history?expand=products&limit=60',
          {headers: {accept: 'application/json'}},
        )
          .then((r) => r.json())
          .catch(() => ({}));

        const serverProds = Array.isArray(server?.products)
          ? server.products
          : [];

        // Build a map from server products for fast lookup
        const serverMap = new Map(serverProds.map((p) => [p.id, p]));
        // Ensure all local ids have entries; we’ll fetch them if missing
        const needFetch = idsLocal.filter((id) => !serverMap.has(id));

        let fetched = [];
        if (needFetch.length) {
          const controller = new AbortController();
          fetched = await fetchProductsByIds(
            needFetch,
            controller.signal,
            API_URL,
            API_TOKEN,
          );
        }

        const allProds = [...serverProds, ...fetched];
        // Preserve order: server first (already ordered), then local in seen order
        const seen = new Set(allProds.map((p) => p.id));
        for (const id of idsLocal) {
          if (!seen.has(id)) {
            const fake = {id, handle: '', title: '', featuredImage: null};
            allProds.push(fake); // placeholder if fetch failed
          }
        }

        // Filter nulls and dedupe by id (server first)
        const uniq = [];
        const uSeen = new Set();
        for (const p of allProds) {
          if (!p || !p.id || uSeen.has(p.id)) continue;
          uSeen.add(p.id);
          uniq.push(p);
        }

        if (isMounted) {
          setRecent(uniq);
          const initial =
            preselect && uniq.find((p) => p.id === preselect)
              ? preselect
              : uniq[0]?.id || null;
          setSelectedId(initial);
        }
      } finally {
        if (isMounted) setLoadingRecent(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [preselect, API_URL, API_TOKEN, isLoggedIn]);

  // When a product is selected, load its related products
  useEffect(() => {
    if (!selectedId) {
      setRelated([]);
      return;
    }
    let isMounted = true;
    const controller = new AbortController();

    (async () => {
      setLoadingRelated(true);
      const recs = await fetchRecommendationsForId(
        selectedId,
        controller.signal,
        API_URL,
        API_TOKEN,
      );
      if (isMounted) {
        setRelated(recs || []);
        setLoadingRelated(false);
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selectedId, API_URL, API_TOKEN]);

  // Selected product object (for the middle card)
  const selected = useMemo(
    () => recent.find((p) => p.id === selectedId) || null,
    [recent, selectedId],
  );

  return (
    <div
      className="recently-viewed-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        maxWidth: 1575,
        padding: 10,
        margin: '75px auto',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{margin: 0}}>Recently viewed Items</h1>
      </header>

      {/* 1) TOP: images-only strip of recently viewed */}
      <section className="recent-thumbs" style={{position: 'relative'}}>
        <button
          onClick={() => scrollThumbs(-600)}
          aria-label="Previous viewed items"
          style={{position: 'absolute', left: 0, top: '40%', zIndex: 2}}
        >
          <LeftArrowIcon />
        </button>

        <div
          ref={thumbsRef}
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            alignItems: 'center',
            minHeight: 90,
          }}
        >
          {loadingRecent ? (
            Array.from({length: 8}).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 10,
                  background: '#eee',
                  flex: '0 0 auto',
                }}
              />
            ))
          ) : recent.length ? (
            recent.map((p) => {
              const selected = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  aria-pressed={selected}
                  title={p.title}
                  style={{
                    border: selected ? '2px solid #111' : '1px solid #e5e5e5',
                    borderRadius: 12,
                    padding: 0,
                    background: '#fff',
                    width: 72,
                    height: 72,
                    overflow: 'hidden',
                    flex: '0 0 auto',
                    cursor: 'pointer',
                    scrollSnapAlign: 'start',
                  }}
                >
                  <img
                    src={`${p.featuredImage?.url || ''}&width=144`}
                    alt={p.featuredImage?.altText || p.title || 'Product'}
                    width="72"
                    height="72"
                    style={{
                      objectFit: 'cover',
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                    }}
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              );
            })
          ) : (
            <div style={{padding: 16}}>No recently viewed items.</div>
          )}
        </div>

        <button
          onClick={() => scrollThumbs(600)}
          aria-label="Next viewed items"
          style={{position: 'absolute', right: 0, top: '40%', zIndex: 2}}
        >
          <RightArrowIcon />
        </button>
      </section>

      {/* 2) MIDDLE: selected item — image left, info right (flex) */}
      <section className="selected-item">
        <h2 style={{margin: '0 0 8px'}}>Selected item</h2>

        {selected ? (
          (() => {
            const firstPrice = selected?.priceRange?.minVariantPrice;
            const hasPrice = firstPrice && Number(firstPrice.amount) > 0;
            const firstVariant = selected?.variants?.nodes?.[0] || null;
            const firstVariantId = firstVariant?.id || null;
            const optimisticVariant = firstVariant
              ? {
                  id: firstVariant.id,
                  title: selected?.title,
                  image: selected?.featuredImage
                    ? {
                        url: selected.featuredImage.url,
                        altText:
                          selected.featuredImage.altText || selected.title,
                      }
                    : null,
                  selectedOptions: [],
                  product: {
                    title: selected?.title,
                    handle: selected?.handle,
                  },
                }
              : null;

            const inStock =
              (selected?.availableForSale ?? true) &&
              (selected?.variants?.nodes?.[0]?.availableForSale ?? true);

            return (
              <div
                className="selected-wrap"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 24,
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  background: '#fff',
                  borderRadius: 20,
                  boxShadow: 'rgba(131, 126, 255, 0.3) 0px 4.8px 14.4px',
                  marginBottom: 30,
                }}
              >
                <Link
                  to={`/products/${encodeURIComponent(selected.handle)}`}
                  style={{display: 'block', flex: '0 1 360px', maxWidth: 360}}
                >
                  <img
                    src={`${selected.featuredImage?.url || ''}&width=720`}
                    alt={
                      selected.featuredImage?.altText ||
                      selected.title ||
                      'Product'
                    }
                    width="360"
                    height="360"
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: 12,
                      display: 'block',
                    }}
                    loading="eager"
                    decoding="async"
                  />
                </Link>

                <div
                  className="selected-info"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 25,
                    flex: '1 1 320px',
                    minWidth: 280,
                    marginTop: 50,
                    padding: 15,
                  }}
                >
                  <Link
                    to={`/products/${encodeURIComponent(selected.handle)}`}
                    style={{textDecoration: 'none', color: 'inherit'}}
                  >
                    <h3
                      className="selectedTitle"
                      style={{margin: 0, fontWeight: 600}}
                    >
                      {selected.title || 'Product'}
                    </h3>
                  </Link>

                  {selected?.description ? (
                    <p
                      className="selectedDescription"
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontStyle: 'italic',
                        color: 'grey',
                        lineHeight: 1.4,
                      }}
                    >
                      {truncateWords(selected.description, 50)}
                    </p>
                  ) : null}

                  <div
                    className="selected-price"
                    style={{fontSize: 20, fontWeight: 400}}
                  >
                    {hasPrice ? (
                      <Money data={firstPrice} />
                    ) : (
                      <span>Call For Price</span>
                    )}
                  </div>

                  {hasPrice ? (
                    inStock ? (
                      firstVariantId ? (
                        <CartForm
                          route="/cart"
                          action={CartForm.ACTIONS.LinesAdd}
                          inputs={{
                            lines: [
                              {
                                merchandiseId: firstVariantId,
                                quantity: 1,
                                selectedVariant: optimisticVariant,
                              },
                            ],
                          }}
                        >
                          {(fetcher) => (
                            <button
                              type="submit"
                              disabled={fetcher.state !== 'idle'}
                              style={{
                                border: '1px solid #fff',
                                padding: '10px 38px',
                                borderRadius: 999,
                                fontWeight: 500,
                                background: '#2172af',
                                color: '#fff',
                                cursor: 'pointer',
                                width: 'fit-content',
                              }}
                            >
                              {fetcher.state === 'submitting'
                                ? 'Adding…'
                                : 'Add to Cart'}
                            </button>
                          )}
                        </CartForm>
                      ) : null
                    ) : (
                      <button
                        disabled
                        style={{
                          border: '1px solid #ccc',
                          padding: '10px 18px',
                          borderRadius: 999,
                          fontWeight: 600,
                          background: '#f3f3f3',
                          color: '#777',
                          width: 'fit-content',
                        }}
                      >
                        Out of stock
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            );
          })()
        ) : (
          <div style={{padding: 16}}>Pick a product above.</div>
        )}
      </section>

      {/* 3) BOTTOM: related products — flex, wrapping */}
      <section className="related-section">
        <h2 style={{marginTop: 0}}>People Also Browsed</h2>
        {loadingRelated ? (
          <SkeletonFlex count={8} />
        ) : !related.length ? (
          <div style={{padding: 16}}>No related products found.</div>
        ) : (
          <div
            className="related-flex"
            style={{display: 'flex', flexWrap: 'wrap', gap: 16}}
          >
            {related.map((p, idx) => (
              <div key={p.id} className="related-card">
                <ProductCard product={p} index={idx} />
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{`
        .product-card.skeleton { padding: 8px; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; box-sizing: border-box; }
        .skeleton-img { width: 150px; height: 150px; border-radius: 8px; background: linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%); background-size: 400% 100%; animation: sh 1.1s ease-in-out infinite; }
        .skeleton-line { height: 12px; margin-top: 8px; border-radius: 6px; width: 80%; background: linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%); background-size: 400% 100%; animation: sh 1.1s ease-in-out infinite; }
        .skeleton-line.short { width: 60%; }
        @keyframes sh { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        .related-card { max-width: 200px; }
        @media (max-width: 720px) {
          .related-card { max-width: 47%; }
          .related-flex { justify-content: space-between; }
          .selectedTitle { font-size: 18px !important; font-weight: 500 !important; }
          .selectedDescription { font-size: 12px !important; }
        }
      `}</style>
    </div>
  );
}

/* ---------------- Small UI helpers (skeletons) ---------------- */

function SkeletonFlex({count = 8}) {
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
      {Array.from({length: count}).map((_, i) => (
        <div
          key={i}
          className="product-card skeleton"
          style={{height: SKELETON_CARD_H, flex: '1 1 180px', maxWidth: 260}}
        >
          <div className="skeleton-img" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

/* ---------------- Product card (shared styling) ---------------- */

function ProductCard({product, index = 0}) {
  const firstPrice = product?.priceRange?.minVariantPrice;

  return (
    <div
      className="product-item"
      style={{
        transitionDelay: `${index * 40}ms`,
        width: '100%',
        minWidth: '100%',
        margin: '0 auto',
      }}
    >
      <div
        className="product-card"
        style={{maxWidth: '100%', width: '100%', minWidth: '100%'}}
      >
        <Link to={`/products/${encodeURIComponent(product.handle)}`}>
          <img
            src={`${product.featuredImage?.url || ''}&width=200`}
            alt={product.featuredImage?.altText || product.title || 'Product'}
            width="150"
            height="150"
            loading={index < 2 ? 'eager' : 'lazy'}
            fetchPriority={index < 2 ? 'high' : 'auto'}
            decoding="async"
          />
          <div className="product-title">{product.title || 'Product'}</div>
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

/* ---------------- Icons ---------------- */

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
