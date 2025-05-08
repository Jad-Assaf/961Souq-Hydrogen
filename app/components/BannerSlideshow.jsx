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

  useEffect(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, interval);
    return () => clearInterval(timerRef.current);
  }, [interval, next]);

  const onTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 100) prev();
    if (diff < -100) next();
  };

  const slide = banners[current];

  // define the widths you want to support
  const desktopWidths = [600, 1000, 1200]; // can be any set of breakpoints :contentReference[oaicite:0]{index=0}
  const mobileWidths = [400, 800]; // example mobile sizes :contentReference[oaicite:1]{index=1}

  // helper to build a srcset string
  const makeSrcSet = (url, widths) =>
    widths.map((w) => `${url}&width=${w} ${w}w`).join(', ');

  return (
    <figure
      className="banner-slideshow"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <a href={slide.link} className="banner-link">
        <picture>
          {/* desktop sources */}
          <source
            media="(min-width:1025px)"
            srcSet={makeSrcSet(slide.desktopImageUrl, desktopWidths)}
            sizes="100vw"
          />
          {/* mobile fallback */}
          <img
            src={`${slide.mobileImageUrl}&width=${mobileWidths[0]}`}
            srcSet={makeSrcSet(slide.mobileImageUrl, mobileWidths)}
            sizes="100vw"
            alt={slide.alt || `Banner ${current + 1}`}
            className="banner-image"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
      </a>

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

      <span
        key={current}
        className="progress-bar"
        style={{'--interval': `${interval}ms`}}
      />
    </figure>
  );
}

export default BannerSlideshow;
