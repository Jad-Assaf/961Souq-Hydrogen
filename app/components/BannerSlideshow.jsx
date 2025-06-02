import React, {useState, useEffect, useRef, useCallback} from 'react';
import '../styles/BannerSlideshow.css';

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
  }, [interval, next]);

  // swipe
  const onTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 100) prev();
    if (diff < -100) next();
  };

  const slide = banners[current];

  return (
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
          />
        </picture>
      </a>

      {/* dots */}
      <ol className="indicator-dots">
        {banners.map((_, i) => (
          <li key={i}>
            <button
              aria-label={`Slide ${i + 1}`}
              className={i === current ? 'dot active' : 'dot'}
              onClick={() => setCurrent(i)}
            />
          </li>
        ))}
      </ol>

      {/* progress (CSS animation restarts because of key change) */}
      <span
        key={current}
        className="progress-bar"
        style={{'--interval': `${interval}ms`}}
      />
    </figure>
  );
}

export default BannerSlideshow;
