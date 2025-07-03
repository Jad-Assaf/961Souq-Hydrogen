// InstagramReelsCarousel.jsx
import React, { useState, useEffect, useRef } from 'react';

export default function InstagramReelsCarousel({ reelIds = [], productUrls = [] }) {
  const [current, setCurrent] = useState(0);
  const scriptLoaded = useRef(false);
  const carouselRef = useRef(null);

  // Load Instagram's embed.js once on mount
  useEffect(() => {
    const loadScript = () => {
      const s = document.createElement('script');
      s.src = 'https://www.instagram.com/embed.js';
      s.async = true;
      s.defer = true;
      s.onload = () => window.instgrm?.Embeds.process();
      document.body.appendChild(s);
    };
    if (!scriptLoaded.current) {
      loadScript();
      scriptLoaded.current = true;
    }
  }, []);

  // Process all embeds after first render and whenever reelIds or current changes
  useEffect(() => {
    if (window.instgrm) window.instgrm.Embeds.process();
  }, [reelIds, current]);

  // Handlers
  const prev = () => setCurrent((i) => (i - 1 + reelIds.length) % reelIds.length);
  const next = () => setCurrent((i) => (i + 1) % reelIds.length);

  return (
    <>
      {/* Slide style for demo; move to CSS file in production */}
      {/* <style>{slideStyle}</style> */}
      <div className="carousel-wrapper">
        <button onClick={prev} className="home-prev-button">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div className="carousel-outer">
          <div
            className="carousel-inner"
            ref={carouselRef}
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {reelIds.map((id, idx) => (
              <div key={id + '-' + (productUrls[idx] || idx)} className="carousel-item">
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
        <button onClick={next} className="home-next-button">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
        {/* View Product link for the current reel, outside the embed and carousel-inner */}
        {productUrls[current] && (
          <a className="ig-product-link" href={productUrls[current]}>
            View Product
          </a>
        )}
      </div>
    </>
  );
}
