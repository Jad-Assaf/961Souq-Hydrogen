// VideosGallery.jsx
import React, {useEffect, useRef} from 'react';

export default function VideosGallery({videos = [], scrollStep = 400}) {
  const sliderRef = useRef(null);
  const videoRefs = useRef([]);

  /* ------------ utilities -------------------------------------------- */
  const loadMeta = (vid) => {
    if (!vid || vid.dataset.loaded) return;
    vid.src = vid.dataset.src;
    vid.load();
    vid.dataset.loaded = 'true';
  };

  const pauseAllExcept = (keep) => {
    videoRefs.current.forEach((v) => {
      if (v && v !== keep) v.pause();
    });
  };

  const showFirstFrame = (vid) => {
    vid.pause();
    vid.currentTime = 0;
    vid.load();
  };

  const playNext = (idx) => {
    const next = videoRefs.current[idx + 1];
    if (!next) return;
    loadMeta(next);
    pauseAllExcept(next);
    next.play().catch(() => {});
  };

  /* ------------ mount ------------------------------------------------- */
  useEffect(() => {
    const init = () => {
      videoRefs.current.forEach((v, idx) => {
        if (!v) return;
        loadMeta(v);
        v.addEventListener('ended', () => {
          showFirstFrame(v);
          playNext(idx);
        });
      });

      const first = videoRefs.current[0];
      if (first) {
        first.muted = true;
        first.play().catch(() => {});
      }
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(init, {timeout: 3000});
    } else {
      setTimeout(init, 1000);
    }
  }, []);

  /* ------------ click toggles play/pause ----------------------------- */
  const handleVideoClick = (vid, e) => {
    e.stopPropagation(); // keep link overlay from firing
    loadMeta(vid);
    pauseAllExcept(vid);
    vid.paused ? vid.play().catch(() => {}) : vid.pause();
  };

  /* ------------ scroll helpers --------------------------------------- */
  const scroll = (dir) => {
    if (!sliderRef.current) return;
    const dx = dir === 'left' ? -scrollStep : scrollStep;
    sliderRef.current.scrollBy({left: dx, behavior: 'smooth'});
  };

  /* ------------ render ------------------------------------------------ */
  return (
    <div className="videos-wrapper">
      <div className="videos-slider" ref={sliderRef}>
        {videos.map(({src, poster, href}, i) => (
          <div key={i} className="video-box">
            <video
              ref={(el) => (videoRefs.current[i] = el)}
              data-src={src}
              preload="none"
              playsInline
              muted
              className="video-item"
              onClick={(e) => handleVideoClick(e.currentTarget, e)}
            />

            {/* optional overlay link */}
            {href && (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="video-link"
              >
                View Product
              </a>
            )}
          </div>
        ))}
      </div>

      <button
        className="home-prev-button showww left"
        onClick={() => scroll('left')}
      >
        <LeftArrowIcon />
      </button>
      <button
        className="home-next-button showww right"
        onClick={() => scroll('right')}
      >
        <RightArrowIcon />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------- */
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
