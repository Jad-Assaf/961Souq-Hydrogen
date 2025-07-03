import React, { useState, useEffect, useRef } from 'react';

export default function InstagramReelsCarousel({ reelIds = [], productUrls = [] }) {
  const [current, setCurrent] = useState(0);
  const scriptLoaded = useRef(false);
  const outerRef = useRef(null);   // <— scrollable element

  /* 1 ▸ load Instagram embed.js once */
  useEffect(() => {
    if (scriptLoaded.current) return;
    const s = document.createElement('script');
    s.src = 'https://www.instagram.com/embed.js';
    s.async = true;
    s.onload = () => window.instgrm?.Embeds.process();
    document.body.appendChild(s);
    scriptLoaded.current = true;
  }, []);

  /* 2 ▸ re-process embeds when slide or list changes */
  useEffect(() => {
    if (window.instgrm) window.instgrm.Embeds.process();
  }, [reelIds, current]);

  /* 3 ▸ scroll to the active slide (smooth on supported browsers) */
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    outer.scrollTo({
      left: outer.clientWidth * current,
      behavior: 'smooth',
    });
  }, [current]);

  /* Handlers */
  const prev = () => setCurrent(i => (i - 1 + reelIds.length) % reelIds.length);
  const next = () => setCurrent(i => (i + 1) % reelIds.length);

  return (
    <div className="carousel-wrapper">
      <button onClick={prev} className="home-prev-button" aria-label="Previous reel">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="carousel-outer" ref={outerRef}>
        <div className="carousel-inner">
          {reelIds.map((id, idx) => (
            <div key={`${id}-${idx}`} className="carousel-item">
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={`https://www.instagram.com/reel/${id}/`}
                data-instgrm-version="14"
              >
                <div>Loading…</div>
              </blockquote>
            </div>
          ))}
        </div>
      </div>

      <button onClick={next} className="home-next-button" aria-label="Next reel">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {productUrls[current] && (
        <a className="ig-product-link" href={productUrls[current]}>
          View Product
        </a>
      )}
    </div>
  );
}
