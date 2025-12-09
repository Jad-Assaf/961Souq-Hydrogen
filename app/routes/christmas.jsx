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
/* SNOW SYSTEM – mouse/touch wave + flake–flake interaction only      */
/* ------------------------------------------------------------------ */

function createFlake(viewport) {
  const width = viewport.width || 0;
  const height = viewport.height || 0;
  const size = 3 + Math.random() * 7; // 3–10px

  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    x: Math.random() * width,
    y: -Math.random() * height * 0.7,
    // slower drift and fall
    vx: (Math.random() - 0.5) * 18,
    vy: 18 + Math.random() * 26,
    size,
    settled: false,
    variant: 1 + Math.floor(Math.random() * 3), // 1, 2, or 3
    rotation: Math.random() * 60 - 30, // -30..30 degrees
    opacity: 0.6 + Math.random() * 0.4, // 0.6..1
  };
}

// Slightly fewer flakes by default; mobile "lite" mode handled in loop
function SnowField({enabled, maxFlakes = 100, initialCount = 40}) {
  const [flakes, setFlakes] = useState([]);
  const viewportRef = useRef({width: 0, height: 0});
  const frameRef = useRef();
  const lastTimeRef = useRef();
  const pointerRef = useRef({
    x: 0,
    y: 0,
    active: false,
    type: 'mouse', // 'mouse' | 'touch'
  });

  // Track viewport size
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function updateViewport() {
      viewportRef.current = {
        width: window.innerWidth || 0,
        height: window.innerHeight || 0,
      };
    }

    updateViewport();
    window.addEventListener('resize', updateViewport, {passive: true});

    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  // Mouse + touch pointer (wave source)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!enabled) return;

    function handleMouseMove(event) {
      pointerRef.current = {
        x: event.clientX,
        y: event.clientY,
        active: true,
        type: 'mouse',
      };
    }

    function handleMouseLeave() {
      pointerRef.current = {
        ...pointerRef.current,
        active: false,
      };
    }

    function handleTouchMove(event) {
      if (event.touches && event.touches.length > 0) {
        const t = event.touches[0];
        pointerRef.current = {
          x: t.clientX,
          y: t.clientY,
          active: true,
          type: 'touch',
        };
      }
    }

    function handleTouchEnd() {
      pointerRef.current = {
        ...pointerRef.current,
        active: false,
      };
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchstart', handleTouchMove, {passive: true});
    window.addEventListener('touchmove', handleTouchMove, {passive: true});
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchstart', handleTouchMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [enabled]);

  // Animation loop
  useEffect(() => {
    if (!enabled) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = undefined;
      lastTimeRef.current = undefined;
      setFlakes([]);
      return;
    }

    function ensureInitialFlakes(current, viewport) {
      if (current.length > 0) return current;
      if (!viewport.width || !viewport.height) return current;

      const arr = [];
      for (let i = 0; i < initialCount; i++) {
        arr.push(createFlake(viewport));
      }
      return arr;
    }

    function loop(timestamp) {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const viewport = viewportRef.current;
      const {width, height} = viewport;
      if (!width || !height) {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      const isMobileViewport = width <= 768; // "lite" mode trigger

      setFlakes((current) => {
        let next = ensureInitialFlakes(current, viewport);
        if (next.length === 0) {
          const arr = [];
          for (let i = 0; i < initialCount; i++) {
            arr.push(createFlake(viewport));
          }
          next = arr;
        }

        const pointer = pointerRef.current;
        const updated = [];

        // 1) Integrate motion + mouse/touch wave + floor
        for (const flake of next) {
          const size = flake.size;
          const radius = size * 0.5;

          if (flake.settled) {
            updated.push(flake);
            continue;
          }

          let x = flake.x;
          let y = flake.y;
          let vx = flake.vx;
          let vy = flake.vy;

          // Base motion: fall + drift (slower)
          y += vy * dt;
          x += vx * dt;

          // Small jitter for organic paths (reduced for smoother anim)
          const jitter = 4;
          vx += (Math.random() - 0.5) * jitter * dt;
          const maxVx = 25;
          if (vx > maxVx) vx = maxVx;
          if (vx < -maxVx) vx = -maxVx;

          // Pointer wave effect
          if (pointer.active) {
            const centerX = x + radius;
            const centerY = y + radius;
            const dx = centerX - pointer.x;
            const dy = centerY - pointer.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > 0) {
              const isTouch = pointer.type === 'touch';
              const influenceRadius = isTouch ? 190 : 130;
              const influenceRadiusSq = influenceRadius * influenceRadius;

              if (distSq < influenceRadiusSq) {
                const dist = Math.sqrt(distSq) || 0.0001;
                const strength = (influenceRadius - dist) / influenceRadius; // 0..1
                const pushBase = isTouch ? 260 : 180;
                const push = pushBase * strength * dt;
                const nx = dx / dist;
                const ny = dy / dist;

                // Radial push away from pointer (wave)
                x += nx * push;
                y += ny * push * 0.5;
                vx += nx * push * 0.9;
                vy += ny * push * 0.4;
              }
            }
          }

          // Horizontal wrap
          if (x < -20) x += width + 40;
          if (x > width + 20) x -= width + 40;

          // Floor: settle at bottom of viewport
          if (y >= height - size) {
            const settledFlake = {
              ...flake,
              x,
              y: height - size,
              vx,
              vy,
              settled: true,
            };
            updated.push(settledFlake);

            // Spawn new flake from above
            updated.push(createFlake(viewport));
            continue;
          }

          updated.push({
            ...flake,
            x,
            y,
            vx,
            vy,
            settled: false,
          });
        }

        // 2) Flake–flake soft separation (desktop / larger viewports only)
        if (!isMobileViewport) {
          const len = updated.length;
          for (let i = 0; i < len; i++) {
            for (let j = i + 1; j < len; j++) {
              const a = updated[i];
              const b = updated[j];

              const ra = a.size * 0.5;
              const rb = b.size * 0.5;
              const ax = a.x + ra;
              const ay = a.y + ra;
              const bx = b.x + rb;
              const by = b.y + rb;

              const dx = bx - ax;
              const dy = by - ay;
              const minDist = ra + rb;
              const distSq = dx * dx + dy * dy;

              if (distSq > 0 && distSq < minDist * minDist) {
                const dist = Math.sqrt(distSq) || 0.0001;
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                const moveA = !a.settled;
                const moveB = !b.settled;

                if (moveA && moveB) {
                  a.x -= nx * overlap * 0.5;
                  b.x += nx * overlap * 0.5;
                  a.y -= ny * overlap * 0.2;
                  b.y += ny * overlap * 0.2;
                } else if (moveA && !moveB) {
                  a.x -= nx * overlap;
                  a.y -= ny * overlap * 0.3;
                } else if (!moveA && moveB) {
                  b.x += nx * overlap;
                  b.y += ny * overlap * 0.3;
                }
              }
            }
          }
        }

        // 3) Clamp to floor after separation & trim count
        for (const flake of updated) {
          if (flake.y > height - flake.size) {
            flake.y = height - flake.size;
          }
        }

        if (updated.length > maxFlakes) {
          let excess = updated.length - maxFlakes;
          const pruned = [];
          for (const flake of updated) {
            if (excess > 0 && flake.settled) {
              excess -= 1;
              continue;
            }
            pruned.push(flake);
          }
          return pruned;
        }

        return updated;
      });

      frameRef.current = requestAnimationFrame(loop);
    }

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = undefined;
      lastTimeRef.current = undefined;
    };
  }, [enabled, initialCount, maxFlakes]);

  if (!enabled) return null;

  return (
    <div className="snow-layer" aria-hidden="true">
      {flakes.map((flake) => {
        const baseStyle = flake.settled
          ? {
              left: `${flake.x}px`,
              bottom: 0,
            }
          : {
              left: `${flake.x}px`,
              top: `${flake.y}px`,
            };

        const style = {
          ...baseStyle,
          width: `${flake.size}px`,
          height: `${flake.size}px`,
          opacity: flake.opacity,
          transform: `rotate(${flake.rotation}deg)`,
        };

        return (
          <div
            key={flake.id}
            className={`snowflake snowflake-v${flake.variant}${
              flake.settled ? ' snowflake-settled' : ''
            }`}
            style={style}
          />
        );
      })}
    </div>
  );
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
      {/* Snowfield – behind content, interactive with pointer/touch */}
      <SnowField enabled={snowOn} />

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

            {/* rotating track, icons stay upright */}
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
