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
  const flakesRef = useRef([]);
  const ctxRef = useRef(null);
  const spriteRef = useRef(null);
  const sizeRef = useRef({w: 0, h: 0, dpr: 1});
  const runningRef = useRef(false);
  const lastTimeRef = useRef(0);
  const lastRenderRef = useRef(0);
  const fpsRef = useRef(45);

  function prefersReducedMotion() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  }

  function getPerfMultiplier() {
    if (typeof navigator === 'undefined') return 1;
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;

    // lower multiplier on modest devices
    if (cores <= 4 || mem <= 4) return 0.75;
    if (cores <= 2 || mem <= 2) return 0.6;
    return 1;
  }

  function getFlakeCount(width) {
    // base counts by viewport
    let base = 110;
    if (width <= 1024) base = 80;
    if (width <= 768) base = 55;
    if (width <= 480) base = 40;

    const m = getPerfMultiplier();
    return Math.max(24, Math.round(base * m));
  }

  function getTargetFps(width) {
    // cap FPS more aggressively on small screens
    if (width <= 768) return 30;
    return 45;
  }

  function makeSprite() {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const g = c.getContext('2d');
    if (!g) return null;

    const cx = 16;
    const cy = 16;
    const r = 10;

    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');

    g.fillStyle = grad;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();

    return c;
  }

  function createFlake(w, h, randomY = true) {
    const r = 0.9 + Math.random() * 2.8; // size factor
    const size = r * 8; // pixels when drawn
    const vy = 28 + Math.random() * 70; // fall speed
    const vx = -10 + Math.random() * 20; // drift
    const alpha = 0.18 + Math.random() * 0.6;

    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : -Math.random() * h,
      size,
      vy,
      vx,
      alpha,
    };
  }

  function resizeAndSync() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = ctxRef.current;
    if (!ctx) return;

    const w = window.innerWidth || 0;
    const h = window.innerHeight || 0;
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    sizeRef.current = {w, h, dpr};

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    // scale drawing to CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    fpsRef.current = getTargetFps(w);

    const targetCount = getFlakeCount(w);
    const current = flakesRef.current;

    if (current.length < targetCount) {
      const add = targetCount - current.length;
      for (let i = 0; i < add; i++) current.push(createFlake(w, h, true));
    } else if (current.length > targetCount) {
      flakesRef.current = current.slice(0, targetCount);
    }
  }

  function clearCanvas() {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const {w, h} = sizeRef.current;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
  }

  function step(now) {
    if (!runningRef.current) return;

    rafRef.current = requestAnimationFrame(step);

    const {w, h} = sizeRef.current;
    const ctx = ctxRef.current;
    const sprite = spriteRef.current;
    if (!ctx || !sprite || !w || !h) return;

    const targetFps = fpsRef.current || 45;
    const frameInterval = 1000 / targetFps;

    if (!lastTimeRef.current) lastTimeRef.current = now;
    if (!lastRenderRef.current) lastRenderRef.current = now;

    // render at capped FPS
    if (now - lastRenderRef.current < frameInterval) return;

    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = now;
    lastRenderRef.current = now;

    ctx.clearRect(0, 0, w, h);

    const flakes = flakesRef.current;
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];

      f.y += f.vy * dt;
      f.x += f.vx * dt;

      // soft wrap / respawn
      if (f.y > h + 24) {
        f.y = -24;
        f.x = Math.random() * w;
      }
      if (f.x < -30) f.x = w + 30;
      if (f.x > w + 30) f.x = -30;

      ctx.globalAlpha = f.alpha;
      ctx.drawImage(sprite, f.x, f.y, f.size, f.size);
    }

    ctx.globalAlpha = 1;
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Respect reduced motion
    if (prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {alpha: true, desynchronized: true});
    if (!ctx) return;

    ctxRef.current = ctx;
    spriteRef.current = makeSprite();

    function onResize() {
      resizeAndSync();
    }

    function onVisibility() {
      if (document.hidden) {
        // pause
        runningRef.current = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      } else {
        // resume (only if enabled)
        if (enabled) {
          resizeAndSync();
          lastTimeRef.current = 0;
          lastRenderRef.current = 0;
          runningRef.current = true;
          rafRef.current = requestAnimationFrame(step);
        }
      }
    }

    window.addEventListener('resize', onResize, {passive: true});
    document.addEventListener('visibilitychange', onVisibility);

    // initial sizing
    resizeAndSync();

    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      clearCanvas();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prefersReducedMotion()) return;

    // toggle behavior
    if (!enabled) {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      clearCanvas();
      return;
    }

    resizeAndSync();
    lastTimeRef.current = 0;
    lastRenderRef.current = 0;
    runningRef.current = true;
    rafRef.current = requestAnimationFrame(step);

    return () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  if (!enabled) return null;

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
