// app/components/MobileInstagramVideoBanner.jsx
import React from 'react';

/**
 * MobileInstagramVideoBanner
 * - Mobile-only top hero section (NOT an overlay over the page)
 * - Full width + viewport height
 * - Supports:
 *    1) mediaUrl (direct MP4) for clean "video-only"
 *    2) shortcode fallback (Instagram embed, may show UI)
 * - Adds:
 *    - subtle dark overlay
 *    - bottom-center content (text + button)
 */
export default function MobileInstagramVideoBanner({
  mediaUrl,
  shortcode,
  poster,
  objectFit = 'cover',
  loop = true,
  muted = true,
  autoPlay = true,
  playsInline = true,
  controls = false,
  preload = 'metadata',

  // Layout sizing (hero-style)
  height = '100dvh',
  minHeight = '100vh',

  // Overlay
  overlayOpacity = 0.22, // slight overlay
  overlayColor = '#000',

  // Content
  headline = 'Discover the latest',
  subtitle = '',
  buttonText = 'Shop now',
  buttonHref = '#',
  onButtonClick,
  showContent = true,

  className = '',
  style = {},
  title = 'Instagram video',
}) {
  if (!mediaUrl && !shortcode) return null;

  const useDirectVideo = Boolean(mediaUrl);

  const ButtonEl = ({children}) => {
    if (buttonHref && buttonHref !== '#') {
      return (
        <a className="mobile-ig-banner__button" href={buttonHref}>
          {children}
        </a>
      );
    }
    return (
      <button
        type="button"
        className="mobile-ig-banner__button"
        onClick={onButtonClick}
      >
        {children}
      </button>
    );
  };

  return (
    <section
      className={`mobile-ig-banner ${className}`}
      style={{
        height,
        minHeight,
        ...style,
        '--ig-overlay-opacity': overlayOpacity,
        '--ig-overlay-color': overlayColor,
      }}
    >
      {/* Media layer */}
      <div className="mobile-ig-banner__media-layer">
        {useDirectVideo ? (
          <video
            className="mobile-ig-banner__media"
            src={mediaUrl}
            poster={poster}
            loop={loop}
            muted={muted}
            autoPlay={autoPlay}
            playsInline={playsInline}
            controls={controls}
            preload={preload}
            style={{objectFit}}
          />
        ) : (
          <iframe
            className="mobile-ig-banner__iframe"
            title={title}
            src={`https://www.instagram.com/reel/${shortcode}/embed/`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Overlay */}
      <div className="mobile-ig-banner__overlay" />

      {/* Bottom-center content */}
      {showContent && (
        <div className="mobile-ig-banner__content">
          <div className="mobile-ig-banner__text">
            {headline ? (
              <h2 className="mobile-ig-banner__headline">{headline}</h2>
            ) : null}
            {subtitle ? (
              <p className="mobile-ig-banner__subtitle">{subtitle}</p>
            ) : null}
          </div>

          {buttonText ? <ButtonEl>{buttonText}</ButtonEl> : null}
        </div>
      )}
    </section>
  );
}
