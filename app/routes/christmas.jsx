// app/routes/christmas.jsx
import React, {useEffect, useState, useMemo, useRef} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import christmasStyles from '~/styles/christmas.css?url';

const CHRISTMAS_COLLECTION_HANDLE = 'all';

const CHRISTMAS_COLLECTION_QUERY = `#graphql
  query ChristmasCollection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      title
      description
      image {
        url
        altText
      }
      products(first: 100) {
        nodes {
          id
          handle
          title
          availableForSale
          featuredImage {
            id
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

export const links = () => [{rel: 'stylesheet', href: christmasStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {collection} = await storefront.query(CHRISTMAS_COLLECTION_QUERY, {
    variables: {
      handle: CHRISTMAS_COLLECTION_HANDLE,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  return json({
    collection,
    christmasCollectionHandle: CHRISTMAS_COLLECTION_HANDLE,
  });
}

function getTimeRemaining(targetDate) {
  const total = targetDate.getTime() - Date.now();

  if (total <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      finished: true,
    };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    finished: false,
  };
}

function useChristmasCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(targetDate));

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(getTimeRemaining(targetDate));
    }, 1000);

    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

function CountdownCell({label, value}) {
  const padded = String(value ?? 0).padStart(2, '0');
  return (
    <div className="countdown-cell">
      <span className="countdown-value">{padded}</span>
      <span className="countdown-label-small">{label}</span>
    </div>
  );
}

function formatPrice(price) {
  if (!price) return '';
  const amount = Number(price.amount);
  if (Number.isNaN(amount)) {
    return `${price.amount} ${price.currencyCode}`;
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: price.currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/* ------------------------------------------------------------------ */
/* SIMPLE HIGH-PERFORMANCE SNOW – CANVAS ONLY                          */
/* ------------------------------------------------------------------ */

function SnowCanvas({enabled}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const ctxRef = useRef(null);

  const flakesRef = useRef([]);
  const sizeRef = useRef({w: 0, h: 0, dpr: 1});
  const runningRef = useRef(false);

  const lastFrameMsRef = useRef(0);
  const lastNowRef = useRef(0);

  function prefersReducedMotion() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  }

  function getDeviceTier() {
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    // 0 = low, 1 = mid, 2 = high
    if (cores <= 2 || mem <= 2) return 0;
    if (cores <= 4 || mem <= 4) return 1;
    return 2;
  }

  function getConfig(width) {
    const isMobile = width <= 768;
    const tier = getDeviceTier();

    // DPR is the biggest lever for canvas performance
    const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);

    // FPS caps
    const fps = isMobile ? 24 : 30;

    // Flake counts (kept intentionally low)
    let count = isMobile ? 28 : 60;
    if (tier === 0) count = isMobile ? 18 : 40;
    if (tier === 1) count = isMobile ? 24 : 50;

    return {dpr, fps, count};
  }

  function makeFlake(w, h, randomY = true) {
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : -Math.random() * h,
      r: 0.7 + Math.random() * 1.8,
      vy: 18 + Math.random() * 55,
      vx: -8 + Math.random() * 16,
      a: 0.12 + Math.random() * 0.45,
    };
  }

  function syncSizeAndFlakes() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const w = window.innerWidth || 0;
    const h = window.innerHeight || 0;
    if (!w || !h) return;

    const {dpr, fps, count} = getConfig(w);

    sizeRef.current = {w, h, dpr, fps};

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const arr = flakesRef.current;

    if (arr.length < count) {
      for (let i = arr.length; i < count; i++) arr.push(makeFlake(w, h, true));
    } else if (arr.length > count) {
      flakesRef.current = arr.slice(0, count);
    }
  }

  function clear() {
    const ctx = ctxRef.current;
    const {w, h} = sizeRef.current;
    if (!ctx || !w || !h) return;
    ctx.clearRect(0, 0, w, h);
  }

  function draw(now) {
    if (!runningRef.current) return;
    rafRef.current = requestAnimationFrame(draw);

    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const {w, h, fps} = sizeRef.current;
    if (!w || !h || !fps) return;

    const frameInterval = 1000 / fps;

    if (!lastNowRef.current) lastNowRef.current = now;
    if (!lastFrameMsRef.current) lastFrameMsRef.current = now;

    // FPS cap
    if (now - lastFrameMsRef.current < frameInterval) return;

    const dt = Math.min((now - lastNowRef.current) / 1000, 0.05);
    lastNowRef.current = now;
    lastFrameMsRef.current = now;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';

    const flakes = flakesRef.current;
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];

      f.y += f.vy * dt;
      f.x += f.vx * dt;

      if (f.y > h + 20) {
        f.y = -20;
        f.x = Math.random() * w;
      }
      if (f.x < -20) f.x = w + 20;
      if (f.x > w + 20) f.x = -20;

      ctx.globalAlpha = f.a;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {alpha: true, desynchronized: true});
    if (!ctx) return;

    ctxRef.current = ctx;

    function onResize() {
      syncSizeAndFlakes();
    }

    function onVisibility() {
      if (document.hidden) {
        runningRef.current = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      } else if (enabled) {
        syncSizeAndFlakes();
        lastNowRef.current = 0;
        lastFrameMsRef.current = 0;
        runningRef.current = true;
        rafRef.current = requestAnimationFrame(draw);
      }
    }

    window.addEventListener('resize', onResize, {passive: true});
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prefersReducedMotion()) return;

    if (!enabled) {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      clear();
      return;
    }

    syncSizeAndFlakes();
    lastNowRef.current = 0;
    lastFrameMsRef.current = 0;
    runningRef.current = true;
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  if (!enabled || prefersReducedMotion()) return null;

  return <canvas ref={canvasRef} className="snow-canvas" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/* PAGE COMPONENT                                                      */
/* ------------------------------------------------------------------ */

export default function ChristmasPage() {
  const {collection, christmasCollectionHandle} = useLoaderData();

  const now = new Date();
  const thisYearChristmas = new Date(now.getFullYear(), 11, 25, 0, 0, 0);
  const targetYear =
    thisYearChristmas.getTime() >= now.getTime()
      ? now.getFullYear()
      : now.getFullYear() + 1;

  const countdownTarget = useMemo(
    () => new Date(targetYear, 11, 25, 0, 0, 0),
    [targetYear],
  );

  const countdown = useChristmasCountdown(countdownTarget);
  const products = collection?.products?.nodes ?? [];

  const [snowOn, setSnowOn] = useState(true);
  const [orbitTilt, setOrbitTilt] = useState({x: 0, y: 0});

  function handleOrbitMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const rotateX = (0.5 - y) * 14;
    const rotateY = (x - 0.5) * 14;

    setOrbitTilt({x: rotateX, y: rotateY});
  }

  function resetOrbitTilt() {
    setOrbitTilt({x: 0, y: 0});
  }

  return (
    <main className={`christmas-page ${snowOn ? 'snow-on' : 'snow-off'}`}>
      {/* Simple canvas snow (no DOM flakes, no React per-frame renders) */}
      <SnowCanvas enabled={snowOn} />

      {/* HERO */}
      <section className="christmas-hero">
        <div className="christmas-hero-left">
          <p className="christmas-badge">Holiday {targetYear}</p>

          <h1 className="christmas-heading">
            <span>Christmas</span>
            <span className="christmas-highlight">Gifts &amp; Tech Deals</span>
          </h1>

          <p className="christmas-subtitle">
            Cozy lighting, fast gadgets, and gifts people actually smile about
            when they unwrap them.
          </p>

          <div className="christmas-countdown">
            {countdown.finished ? (
              <p className="countdown-finished">
                This year&apos;s Christmas campaign has ended, but you can still
                discover amazing tech all year round.
              </p>
            ) : (
              <>
                <p className="countdown-label">Christmas campaign ends in</p>
                <div className="countdown-grid">
                  <CountdownCell label="Days" value={countdown.days} />
                  <CountdownCell label="Hours" value={countdown.hours} />
                  <CountdownCell label="Minutes" value={countdown.minutes} />
                  <CountdownCell label="Seconds" value={countdown.seconds} />
                </div>
              </>
            )}
          </div>

          <div className="christmas-cta-row">
            <Link
              to={`/collections/${christmasCollectionHandle}`}
              className="cta-btn primary"
            >
              Shop Christmas collection
            </Link>
            <Link to="/collections/all" className="cta-btn ghost">
              Browse all products
            </Link>
          </div>

          <p className="christmas-small-print">
            Free gift wrapping on select items · Extended returns until
            mid-January
          </p>

          <div className="christmas-toggle-row">
            <button
              type="button"
              className={`snow-toggle ${
                snowOn ? 'snow-toggle-on' : 'snow-toggle-off'
              }`}
              onClick={() => setSnowOn((prev) => !prev)}
            >
              <span className="snow-toggle-icon" aria-hidden="true">
                {snowOn ? '❄️' : '🌙'}
              </span>
              <span className="snow-toggle-label">
                {snowOn ? 'Snowfall on' : 'Snowfall off'}
              </span>
            </button>
          </div>
        </div>

        <div className="christmas-hero-right">
          <div
            className="christmas-orbit"
            onMouseMove={handleOrbitMouseMove}
            onMouseLeave={resetOrbitTilt}
            style={{
              transform: `rotateX(${orbitTilt.x}deg) rotateY(${orbitTilt.y}deg)`,
            }}
          >
            <div className="orbit-center">
              <span className="orbit-center-text">Santa&apos;s Tech Bag</span>
            </div>

            <div className="orbit-ring orbit-ring-outer" />
            <div className="orbit-ring orbit-ring-inner" />

            <div className="orbit-track">
              <div className="orbit-product orbit-product-1">
                <div className="orbit-product-inner">
                  <span role="img" aria-label="Headphones">
                    🎧
                  </span>
                </div>
              </div>
              <div className="orbit-product orbit-product-2">
                <div className="orbit-product-inner">
                  <span role="img" aria-label="Game controller">
                    🎮
                  </span>
                </div>
              </div>
              <div className="orbit-product orbit-product-3">
                <div className="orbit-product-inner">
                  <span role="img" aria-label="Laptop">
                    💻
                  </span>
                </div>
              </div>
              <div className="orbit-product orbit-product-4">
                <div className="orbit-product-inner">
                  <span role="img" aria-label="Phone">
                    📱
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section className="christmas-grid-section">
        <div className="section-header">
          <h2>{collection?.title ?? 'Featured Christmas Picks'}</h2>
          {collection?.description && (
            <p className="section-description">{collection.description}</p>
          )}
        </div>

        {products.length === 0 ? (
          <p className="empty-state">
            The Christmas collection is getting stocked. Check back soon or
            explore other categories in the store.
          </p>
        ) : (
          <div className="christmas-product-grid">
            {products.map((product) => (
              <article key={product.id} className="christmas-product-card">
                <Link
                  to={`/products/${product.handle}`}
                  className="card-image-wrapper"
                >
                  {product.featuredImage ? (
                    <img
                      src={`${product.featuredImage.url}&width=300`}
                      alt={product.featuredImage.altText ?? product.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="card-image-placeholder">
                      <span>{product.title.charAt(0)}</span>
                    </div>
                  )}

                  <div className="card-hover-layer">
                    <span className="card-hover-label">View</span>
                  </div>

                  {!product.availableForSale && (
                    <span className="product-badge sold-out">Sold out</span>
                  )}
                  <span className="product-badge festive">🎄 Gift idea</span>
                </Link>

                <div className="card-body">
                  <h3 className="product-title">
                    <Link to={`/products/${product.handle}`}>
                      {product.title}
                    </Link>
                  </h3>
                  <p className="product-price">
                    {formatPrice(product.priceRange?.minVariantPrice)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
