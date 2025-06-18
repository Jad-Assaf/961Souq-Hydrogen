import React, {useState, useEffect, useRef, useCallback} from 'react';

export function BannerSlideshow({banners, interval = 10000}) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const touchStartX = useRef(0);

  const next = useCallback(
    () => setCurrent((i) => (i + 1) % banners.length),
    [banners.length],
  );

  const prev = useCallback(
    () => setCurrent((i) => (i ? i - 1 : banners.length - 1)),
    [banners.length],
  );

  // autoplay
  useEffect(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, interval);
    return () => clearInterval(timerRef.current);
  }, [interval, next, current]);  

  // swipe
  const onTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 100) prev();
    if (diff < -100) next();
  };

  const slide = banners[current];

  return (
    <>
      <figure
        className="banner-slideshow"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <a href={slide.link} className="banner-link">
          <picture>
            <source
              media="(min-width:1025px)"
              srcSet={`${slide.desktopImageUrl}&width=1500`}
            />
            <img
              src={`${slide.mobileImageUrl}&width=900`}
              alt={slide.alt || `Banner ${current + 1}`}
              className="banner-image"
              loading="eager"
              decoding="async"
              fetchpriority="high"
              width={1500}
              height={300}
            />
          </picture>
        </a>

        {/* dots (non-interactive) */}
        <ol className="indicator-dots">
          {banners.map((_, i) => (
            <li key={i}>
              <span className={i === current ? 'dot active' : 'dot'} />
            </li>
          ))}
        </ol>

        {/* progress bar */}
        <span
          key={current}
          className="progress-bar"
          style={{'--interval': `${interval}ms`}}
        />
      </figure>
      <div className="arrow-buttons">
        <button
          type="button"
          aria-label="Scroll categories left"
          onClick={prev}
          className="home-prev-button"
        >
          <LeftArrowIcon />
        </button>
        <button
          type="button"
          aria-label="Scroll categories right"
          onClick={next}
          className="home-next-button"
        >
          <RightArrowIcon />
        </button>
      </div>
    </>
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

export default BannerSlideshow;
