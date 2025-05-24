// VideosGallery.jsx
import React, {useEffect, useRef, useState} from 'react';
import '@sayings/react-reels/dist/index.css';

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */
export default function VideosGallery({videos = [], scrollStep = 400}) {
  /* ===== desktop refs & helpers  ==================================== */
  const sliderRef = useRef(null);
  const videoRefs = useRef([]);

  const loadMeta = (v) => {
    if (!v || v.dataset.loaded) return;
    v.src = v.dataset.src;
    v.load();
    v.dataset.loaded = 'true';
  };
  const pauseAllExcept = (keep) =>
    videoRefs.current.forEach((v) => v && v !== keep && v.pause());
  const resetFrame = (v) => {
    v.pause();
    v.currentTime = 0;
    v.load();
  };
  const playNext = (i) => {
    const n = videoRefs.current[i + 1];
    if (!n) return;
    loadMeta(n);
    pauseAllExcept(n);
    n.play().catch(() => {});
  };

  useEffect(() => {
    const init = () => {
      videoRefs.current.forEach((v, i) => {
        if (!v) return;
        loadMeta(v);
        v.addEventListener('ended', () => {
          resetFrame(v);
          playNext(i);
        });
      });
      videoRefs.current[0]?.play().catch(() => {});
    };
    'requestIdleCallback' in window
      ? window.requestIdleCallback(init, {timeout: 3_000})
      : setTimeout(init, 1_000);
  }, []);

  const handleDesktopClick = (v, e) => {
    e.stopPropagation();
    loadMeta(v);
    pauseAllExcept(v);
    v.paused ? v.play().catch(() => {}) : v.pause();
  };
  const scroll = (dir) =>
    sliderRef.current?.scrollBy({
      left: dir === 'left' ? -scrollStep : scrollStep,
      behavior: 'smooth',
    });

  /* ===== mobile-viewer state  ======================================= */
  const [ReelsComp, setReelsComp] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [clickedIdx, setClickedIdx] = useState(0);

  /* client-only import */
  useEffect(() => {
    import('@sayings/react-reels').then((m) =>
      setReelsComp(() => m.Reels || m.default),
    );
  }, []);

  /* tap handler decides mobile vs desktop */
  const handleClipTap = (idx, e) => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile && ReelsComp) {
      setClickedIdx(idx);
      setViewerOpen(true);
    } else {
      handleDesktopClick(e.currentTarget, e);
    }
  };

  /* ===== map → reelsData (unique ids & rightMenu) =================== */
  const reelsData = videos.map(({src, poster, href}, i) => ({
    id: i + 1, // unique reel id
    reelInfo: {url: src, type: 'video/mp4'},
    poster,
    rightMenu: href
      ? {
          options: [
            {
              id: i + 1, // unique key for li
              label: 'View Product',
              value: href, // we read it back
            },
          ],
        }
      : {options: []},
  }));

  /* ===== helper: rotate array so clicked reel shows first =========== */
  const reorderedReels = [
    ...reelsData.slice(clickedIdx),
    ...reelsData.slice(0, clickedIdx),
  ];

  /* ===== menu-click handler ======================================== */
  const handleMenuItem = ({value}) => window.open(value, '_blank');

  /* ===================  RENDER  ===================================== */
  return (
    <>
      {/* ---------- desktop slider ---------- */}
      <div className="videos-wrapper">
        <div className="videos-slider" ref={sliderRef}>
          {videos.map(({src, href}, i) => (
            <div key={`box-${i}`} className="video-box">
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

      {/* ---------- mobile full-screen viewer ---------- */}
      {viewerOpen && ReelsComp && (
        <div className="reels-overlay">
          <button className="reels-close" onClick={() => setViewerOpen(false)}>
            ✕
          </button>
          <ReelsComp
            reels={reorderedReels}
            autoPlay
            loop={false}
            hideControls
            height="100%"
            width="100%"
            onMenuItemClicked={handleMenuItem}
          />
        </div>
      )}
    </>
  );
}

/* ---------------- icons ---------------- */
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
