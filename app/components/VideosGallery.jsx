// VideosGallery.jsx
import React, {useEffect, useRef, useState} from 'react';
import '@sayings/react-reels/dist/index.css'; // just the library styles

export default function VideosGallery({videos = [], scrollStep = 400}) {
  /* ------------------------------------------------------------------ */
  /*  desktop refs & helpers (unchanged)                                */
  /* ------------------------------------------------------------------ */
  const sliderRef = useRef(null);
  const videoRefs = useRef([]);

  const loadMeta = (vid) => {
    if (!vid || vid.dataset.loaded) return;
    vid.src = vid.dataset.src;
    vid.load();
    vid.dataset.loaded = 'true';
  };
  const pauseAllExcept = (keep) =>
    videoRefs.current.forEach((v) => v && v !== keep && v.pause());
  const resetFrame = (vid) => {
    vid.pause();
    vid.currentTime = 0;
    vid.load();
  };
  const playNext = (idx) => {
    const nxt = videoRefs.current[idx + 1];
    if (!nxt) return;
    loadMeta(nxt);
    pauseAllExcept(nxt);
    nxt.play().catch(() => {});
  };

  useEffect(() => {
    const init = () => {
      videoRefs.current.forEach((v, idx) => {
        if (!v) return;
        loadMeta(v);
        v.addEventListener('ended', () => {
          resetFrame(v);
          playNext(idx);
        });
      });
      videoRefs.current[0]?.play().catch(() => {});
    };
    'requestIdleCallback' in window
      ? window.requestIdleCallback(init, {timeout: 3000})
      : setTimeout(init, 1000);
  }, []);

  const handleDesktopClick = (vid, e) => {
    e.stopPropagation();
    loadMeta(vid);
    pauseAllExcept(vid);
    vid.paused ? vid.play().catch(() => {}) : vid.pause();
  };
  const scroll = (dir) =>
    sliderRef.current?.scrollBy({
      left: dir === 'left' ? -scrollStep : scrollStep,
      behavior: 'smooth',
    });

  /* ------------------------------------------------------------------ */
  /*  mobile reels viewer state                                         */
  /* ------------------------------------------------------------------ */
  const [ReelsComp, setReelsComp] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  /* dynamic import once on client */
  useEffect(() => {
    import('@sayings/react-reels').then((m) =>
      setReelsComp(() => m.Reels || m.default),
    );
  }, []);

  /* tap handler decides mobile vs desktop */
  const handleClipTap = (idx, e) => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile && ReelsComp) {
      setStartIndex(idx);
      setViewerOpen(true);
    } else {
      handleDesktopClick(e.currentTarget, e);
    }
  };

  /* map videos → reels data */
  const reelsData = videos.map(({src, poster, href}, i) => ({
    id: i + 1,
    reelInfo: {url: src, type: 'video/mp4'},
    rightMenu: {options: []},
    bottomSection: href
      ? {
          component: (
            <a
              className="video-link"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Product
            </a>
          ),
        }
      : undefined,
    poster,
  }));

  /* ------------------------------------------------------------------ */
  /*  render                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <>
      {/* desktop carousel */}
      <div className="videos-wrapper">
        <div className="videos-slider" ref={sliderRef}>
          {videos.map(({src, href}, i) => (
            <div key={i} className="video-box">
              <video
                ref={(el) => (videoRefs.current[i] = el)}
                data-src={src}
                preload="none"
                playsInline
                muted
                className="video-item"
                onClick={(e) => handleClipTap(i, e)}
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

        {/* horizontal arrows */}
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

      {/* mobile full-screen overlay */}
      {viewerOpen && ReelsComp && (
        <div className="reels-overlay">
          <button className="reels-close" onClick={() => setViewerOpen(false)}>
            ✕
          </button>
          <ReelsComp
            reels={reelsData}
            startIndex={startIndex}
            autoPlay
            loop={false}
            hideControls
            height="100vh"
            width="100%"
          />
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
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
