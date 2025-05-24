// VideosGallery.jsx
import React, {useEffect, useRef} from 'react';
import {FullScreen, useFullScreenHandle} from 'react-full-screen';

export default function VideosGallery({videos = [], scrollStep = 400}) {
  const sliderRef = useRef(null);
  const videoRefs = useRef([]);
  const handleRefs = useRef([]); // one FullScreen handle per clip

  /* ---------------- utilities ---------------------------------------- */
  const loadMeta = (vid) => {
    if (!vid || vid.dataset.loaded) return;
    vid.src = vid.dataset.src;
    vid.load();
    vid.dataset.loaded = 'true';
  };

  const pauseAllExcept = (keep) => {
    videoRefs.current.forEach((v) => v && v !== keep && v.pause());
  };

  const resetFrame = (vid) => {
    vid.pause();
    vid.currentTime = 0;
    vid.load();
  };

  const playClip = (idx) => {
    const vid = videoRefs.current[idx];
    const handle = handleRefs.current[idx];
    if (!vid || !handle) return;

    loadMeta(vid);
    pauseAllExcept(vid);
    handle.enter(); // go full-screen
    vid.play().catch(() => {});
  };

  /* ---------------- swipe helpers ------------------------------------ */
  const swipeDetector = (idx) => {
    let startY = null;
    return {
      onTouchStart: (e) => {
        startY = e.touches?.[0]?.clientY ?? null;
      },
      onTouchEnd: (e) => {
        if (startY == null) return;
        const endY = e.changedTouches?.[0]?.clientY ?? startY;
        const delta = endY - startY;
        const TH = 60; // px threshold
        if (delta > TH) playClip(idx - 1); // swipe ↓ → previous
        if (delta < -TH) playClip(idx + 1); // swipe ↑ → next
        startY = null;
      },
      onWheel: (e) => {
        if (e.deltaY > 50) playClip(idx + 1); // wheel down
        if (e.deltaY < -50) playClip(idx - 1); // wheel up
      },
    };
  };

  /* ---------------- mount: listeners & first autoplay ---------------- */
  useEffect(() => {
    videoRefs.current.forEach((v, idx) => {
      if (!v) return;
      loadMeta(v);

      // ended → reset frame & play next
      v.addEventListener('ended', () => {
        resetFrame(v);
        playClip(idx + 1);
      });

      // leaving full-screen → reset frame
      v.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement !== v) resetFrame(v);
      });
    });

    // autoplay the first clip
    playClip(0);
  }, []);

  /* ---------------- click toggles full-screen & play ----------------- */
  const handleVideoClick = (idx, e) => {
    e.stopPropagation();
    const vid = videoRefs.current[idx];
    const handle = handleRefs.current[idx];
    if (!vid || !handle) return;

    if (!handle.active) {
      playClip(idx); // enter FS & play
    } else {
      vid.paused ? vid.play().catch(() => {}) : vid.pause();
    }
  };

  /* ---------------- horizontal arrows -------------------------------- */
  const scroll = (dir) => {
    if (!sliderRef.current) return;
    const dx = dir === 'left' ? -scrollStep : scrollStep;
    sliderRef.current.scrollBy({left: dx, behavior: 'smooth'});
  };

  /* ---------------- render ------------------------------------------- */
  return (
    <div className="videos-wrapper">
      <div className="videos-slider" ref={sliderRef}>
        {videos.map(({src, poster, href}, i) => {
          const handle = useFullScreenHandle();
          handleRefs.current[i] = handle;

          return (
            <div key={i} className="video-box">
              <FullScreen handle={handle}>
                <video
                  ref={(el) => (videoRefs.current[i] = el)}
                  data-src={src}
                  poster={poster || undefined}
                  preload="none"
                  playsInline
                  muted
                  className="video-item"
                  onClick={(e) => handleVideoClick(i, e)}
                  {...swipeDetector(i)}
                />
              </FullScreen>

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
          );
        })}
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

/* ---------------- icons --------------------------------------------- */
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
