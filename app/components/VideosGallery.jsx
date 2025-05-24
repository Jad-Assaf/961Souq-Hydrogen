// VideosGallery.jsx
import React, {useEffect, useRef} from 'react';

export default function VideosGallery({videos = [], scrollStep = 400}) {
  const sliderRef = useRef(null);
  const videoRefs = useRef([]);

  /* ---------- helpers -------------------------------------------------- */
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

  const resetFrame = (vid) => {
    vid.pause();
    vid.currentTime = 0;
    vid.load();
  };

  const playClip = (vid) => {
    if (!vid) return;
    loadMeta(vid);
    pauseAllExcept(vid);
    vid.requestFullscreen?.().catch(() => {});
    vid.play().catch(() => {});
  };

  const playNext = (idx) => playClip(videoRefs.current[idx + 1]);
  const playPrev = (idx) => playClip(videoRefs.current[idx - 1]);

  /* ---------- mount: src attach, events, first autoplay --------------- */
  useEffect(() => {
    const init = () => {
      videoRefs.current.forEach((v, idx) => {
        if (!v) return;

        loadMeta(v);

        /* sequential playback (up-next) */
        v.addEventListener('ended', () => {
          resetFrame(v);
          playNext(idx);
        });

        /* leave fullscreen → reset */
        v.addEventListener('fullscreenchange', () => {
          if (!document.fullscreenElement) resetFrame(v);
        });

        /* swipe up / down for next / prev */
        let startY = null;
        v.addEventListener('touchstart', (e) => {
          startY = e.touches?.[0]?.clientY ?? null;
        });
        v.addEventListener('touchend', (e) => {
          if (startY == null) return;
          const endY = e.changedTouches?.[0]?.clientY ?? startY;
          const delta = endY - startY;
          const THRESHOLD = 60; // px
          if (delta > THRESHOLD) playPrev(idx); // swipe ↓
          else if (delta < -THRESHOLD) playNext(idx); // swipe ↑
          startY = null;
        });
      });

      /* autoplay first video fullscreen */
      const first = videoRefs.current[0];
      if (first) {
        first.muted = true;
        playClip(first);
      }
    };

    'requestIdleCallback' in window
      ? window.requestIdleCallback(init, {timeout: 3000})
      : setTimeout(init, 1000);
  }, []);

  /* ---------- click: toggle fs & play/pause --------------------------- */
  const handleVideoClick = (vid, e) => {
    e.stopPropagation(); // ignore overlay link
    if (!vid) return;

    if (document.fullscreenElement !== vid) {
      playClip(vid); // enter FS + play
    } else {
      vid.paused ? vid.play().catch(() => {}) : vid.pause();
    }
  };

  /* ---------- horizontal scroll arrows -------------------------------- */
  const scroll = (dir) => {
    if (!sliderRef.current) return;
    const dx = dir === 'left' ? -scrollStep : scrollStep;
    sliderRef.current.scrollBy({left: dx, behavior: 'smooth'});
  };

  /* ---------- render --------------------------------------------------- */
  return (
    <div className="videos-wrapper">
      <div className="videos-slider" ref={sliderRef}>
        {videos.map(({src, poster, href}, i) => (
          <div key={i} className="video-box">
            <video
              ref={(el) => (videoRefs.current[i] = el)}
              data-src={src}
              poster={poster || undefined}
              preload="none"
              playsInline /* no native controls */
              muted
              className="video-item"
              onClick={(e) => handleVideoClick(e.currentTarget, e)}
            />

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
