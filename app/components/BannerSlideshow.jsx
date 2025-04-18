import React, { useState, useEffect } from 'react';

export function BannerSlideshow({ banners, interval = 10000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [animationStyle, setAnimationStyle] = useState({});
  const [startX, setStartX] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1,
      );
    }, interval);

    const progressTimer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 100 / (interval / 100)));
    }, 100);

    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, [banners.length, interval]);

  useEffect(() => {
    // Reset progress whenever the image changes
    setProgress(0);

    // Trigger a brief fade/slide in
    setAnimationStyle({
      opacity: 1,
      transform: 'translateX(0)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    });

    const timer = setTimeout(() => {
      setAnimationStyle({});
    }, 500);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    const touchDiff = e.touches[0].clientX - startX;
    setAnimationStyle({
      transform: `translateX(${touchDiff}px)`,
      transition: 'none',
    });
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const touchDiff = endX - startX;

    if (touchDiff > 100) {
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? banners.length - 1 : prevIndex - 1,
      );
    } else if (touchDiff < -100) {
      setCurrentIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1,
      );
    } else {
      // Snap back if the user didn't swipe far enough
      setAnimationStyle({
        transform: 'translateX(0)',
        transition: 'transform 0.3s ease',
      });
    }
  };

  // Only render the current banner slide (conditional rendering)
  const currentBanner = banners[currentIndex];

  return (
    <div
      className="banner-slideshow"
      style={styles.bannerSlideshow}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="banner-slide active"
        style={{
          ...styles.bannerSlide,
          ...animationStyle,
          opacity: 1,
          transform: 'translateX(0)',
        }}
      >
        <a
          href={currentBanner.link}
          target="_self"
          rel="noopener noreferrer"
          style={styles.link}
        >
          <picture>
            <source
              media="(min-width: 1025px)"
              srcSet={`
                ${currentBanner.desktopImageUrl}?quality=100
              `}
              sizes="(min-width: 1025px) 100vw"
            />

            <source
              media="(max-width: 1024px)"
              srcSet={`
                ${currentBanner.mobileImageUrl}?quality=100
              `}
              sizes="(max-width: 1024px) 100vw"
            />

            {/* Fallback image */}
            <img
              src={`${currentBanner.mobileImageUrl}`}
              alt={`Banner ${currentIndex + 1}`}
              style={styles.bannerImage}
              loading="eager"
              decoding="sync"
              fetchpriority="high"
            />
          </picture>
        </a>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar" style={styles.progressBar}>
        <div
          className="progress"
          style={{
            ...styles.progress,
            width: `${progress}%`,
          }}
        ></div>
      </div>

      {/* Indicator Dots */}
      <div className="indicator-dots" style={styles.indicatorDots}>
        {banners.map((_, index) => (
          <div
            key={index}
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            style={{
              ...styles.dot,
              backgroundColor: index === currentIndex ? '#fff' : '#2172af',
            }}
            onClick={() => setCurrentIndex(index)}
          ></div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  bannerSlideshow: {
    position: 'relative',
    width: '100vw',
    overflow: 'hidden',
    maxWidth: '1500px',
    margin: 'auto',
  },
  bannerSlide: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'start',
  },
  bannerImage: {
    width: '100vw',
    height: '100%',
    margin: 'auto',
    objectFit: 'contain',
    maxWidth: '1500px',
    borderRadius: '5px',
  },
  link: {
    width: '100vw',
    height: '100%',
    display: 'block',
  },
  progressBar: {
    position: 'absolute',
    bottom: '18px',
    left: '45%',
    width: '10%',
    height: '3px',
    backgroundColor: '#2172af',
    borderRadius: '40px',
  },
  progress: {
    height: '100%',
    backgroundColor: '#fff',
    transition: 'width 0.1s linear',
    borderRadius: '30px',
  },
  indicatorDots: {
    position: 'absolute',
    width: '100%',
    bottom: '5px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
  },
  dot: {
    borderRadius: '50%',
    cursor: 'pointer',
    padding: '3px',
  },
};

export default BannerSlideshow;
