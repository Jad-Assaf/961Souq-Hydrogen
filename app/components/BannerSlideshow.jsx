import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {useLoaderData} from '@remix-run/react';

/**
 * BannerSlideshow
 * -----------------------------------------
 * • Detects the visitor’s device once.
 *   ─ Server side: looks for `isMobile` in loader data
 *     (generated with `const isMobile = /mobile/i.test(userAgent)`).
 *   ─ Client side: re-checks `navigator.userAgent` after hydration.
 * • Renders one <img> variant per slide:
 *   ─ Mobile visitors → mobile banners only
 *   ─ Desktop visitors → desktop banners only
 * • Keeps all existing autoplay, swipe, arrows, dots, progress bar.
 */

export  function BannerSlideshow({banners, interval = 10000}) {
  /* -------------------------------------------------------------
   * 1)  DEVICE DETECTION
   * ----------------------------------------------------------- */
  const loaderData = useLoaderData() || {};
  const ssrIsMobile = !!loaderData.isMobile; // may be undefined if loader omitted
  const [isMobile, setIsMobile] = useState(ssrIsMobile);

  /* After hydration, double-check on the client */
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMobile(/mobile/i.test(navigator.userAgent));
    }
  }, []);

  /* Filter banners so we only iterate the ones we’ll really show */
  const deviceBanners = useMemo(
    () =>
      isMobile
        ? banners.filter((b) => b.mobileImageUrl)
        : banners.filter((b) => b.desktopImageUrl),
    [banners, isMobile],
  );

  /* -------------------------------------------------------------
   * 2)  SLIDESHOW STATE
   * ----------------------------------------------------------- */
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const touchStartX = useRef(0);

  const next = useCallback(
    () => setCurrent((i) => (i + 1) % deviceBanners.length),
    [deviceBanners.length],
  );

  const prev = useCallback(
    () => setCurrent((i) => (i ? i - 1 : deviceBanners.length - 1)),
    [deviceBanners.length],
  );

  /* Autoplay */
  useEffect(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, interval);
    return () => clearInterval(timerRef.current);
  }, [interval, next, current]);

  /* Swipe handlers */
  const onTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 100) prev();
    if (diff < -100) next();
  };

  /* No banners for this device? – gracefully abort */
  if (!deviceBanners.length) return null;

  const slide = deviceBanners[current];

  /* -------------------------------------------------------------
   * 3)  RENDER
   * ----------------------------------------------------------- */
  return (
    <>
      <figure
        className="banner-slideshow"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <a href={slide.link} className="banner-link">
          {isMobile ? (
            /* Mobile image only */
            <img
              srcSet={`${slide.mobileImageUrl}&width=320 320w, ${slide.mobileImageUrl}&width=480 480w, ${slide.mobileImageUrl}&width=640 640w, ${slide.mobileImageUrl}&width=900 900w`}
              sizes="(max-width:640px) 100vw, (max-width:1024px) 100vw, 1024px"
              src={`${slide.mobileImageUrl}&width=640`}
              alt={slide.alt || `Banner ${current + 1}`}
              className="banner-image"
              loading="eager"
              decoding="async"
              fetchpriority="high"
              width={900}
              height={300}
            />
          ) : (
            /* Desktop image only */
            <img
              srcSet={`${slide.desktopImageUrl}&width=1024 1024w, ${slide.desktopImageUrl}&width=1200 1200w, ${slide.desktopImageUrl}&width=1500 1500w, ${slide.desktopImageUrl}&width=2000 2000w`}
              sizes="(min-width:1025px) 1500px, 100vw"
              src={`${slide.desktopImageUrl}&width=1500`}
              alt={slide.alt || `Banner ${current + 1}`}
              className="banner-image"
              loading="eager"
              decoding="async"
              fetchpriority="high"
              width={1500}
              height={300}
            />
          )}
        </a>

        {/* Indicator dots */}
        <ol className="indicator-dots">
          {deviceBanners.map((_, i) => (
            <li key={i}>
              <span className={i === current ? 'dot active' : 'dot'} />
            </li>
          ))}
        </ol>

        {/* Progress bar */}
        <span
          key={current}
          className="progress-bar"
          style={{'--interval': `${interval}ms`}}
        />
      </figure>

      {/* Arrow buttons */}
      <div className="arrow-buttons">
        <button
          type="button"
          aria-label="Scroll banners left"
          onClick={prev}
          className="home-prev-button"
        >
          <LeftArrowIcon />
        </button>
        <button
          type="button"
          aria-label="Scroll banners right"
          onClick={next}
          className="home-next-button"
        >
          <RightArrowIcon />
        </button>
      </div>
    </>
  );
}

/* SVG icons – unchanged */
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
