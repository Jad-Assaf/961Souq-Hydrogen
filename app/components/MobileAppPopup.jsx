import React, {useCallback, useEffect, useRef, useState} from 'react';

const ANIM_MS = 140; // keep in sync with CSS --appPopupDur
const DISMISS_DAYS = 1; // set to 0 if you want it to show every time

function isLikelyMobile() {
  if (typeof window === 'undefined') return false;

  // Most reliable modern signal
  const coarsePointer =
    window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  // Useful fallback for older browsers
  const ua = (navigator.userAgent || '').toLowerCase();
  const uaMobile = /mobi|android|iphone|ipod|ipad/.test(ua);

  // Layout-based fallback (helps on some tablets)
  const smallViewport = window.matchMedia
    ? window.matchMedia('(max-width: 900px)').matches
    : window.innerWidth <= 900;

  return coarsePointer || uaMobile || smallViewport;
}

function getStoreLink() {
  if (typeof navigator === 'undefined') return '';

  const ua = (navigator.userAgent || navigator.vendor || '').toLowerCase();

  // iOS / iPadOS (iPadOS can appear as Mac with touch)
  const isIOS =
    /iphone|ipod|ipad/.test(ua) ||
    (ua.includes('mac') &&
      typeof navigator.maxTouchPoints === 'number' &&
      navigator.maxTouchPoints > 1);

  if (isIOS) {
    return 'https://apps.apple.com/lb/app/souq-961/id6504404642';
  }

  if (ua.includes('android')) {
    return 'https://play.google.com/store/apps/details?id=com.souq961.app&pcampaignid=web_share';
  }

  return '';
}

function daysToMs(days) {
  return Math.max(0, Number(days) || 0) * 24 * 60 * 60 * 1000;
}

const MobileAppPopup = ({enabled = true}) => {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  const closeBtnRef = useRef(null);
  const timersRef = useRef([]);

  const lockScroll = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Prevent background scroll without forcing any scroll position restore.
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }, []);

  const unlockScroll = useCallback(() => {
    if (typeof window === 'undefined') return;

    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }, []);

  const closePopup = useCallback(() => {
    if (typeof window !== 'undefined' && DISMISS_DAYS > 0) {
      try {
        window.localStorage.setItem(
          'mobileAppPopupDismissedAt',
          String(Date.now()),
        );
      } catch {
        // ignore storage failures (private mode, etc.)
      }
    }

    setOpen(false);

    const t = window.setTimeout(() => {
      setMounted(false);
      unlockScroll();
    }, ANIM_MS);

    timersRef.current.push(t);
  }, [unlockScroll]);

  const handleDownloadClick = useCallback(() => {
    if (typeof window === 'undefined') return;

    const link = getStoreLink();
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!enabled) return;
    if (!isLikelyMobile()) return;

    // Optional: don’t show again for DISMISS_DAYS
    if (DISMISS_DAYS > 0) {
      try {
        const dismissedAt = Number(
          window.localStorage.getItem('mobileAppPopupDismissedAt') || '0',
        );
        if (dismissedAt && Date.now() - dismissedAt < daysToMs(DISMISS_DAYS)) {
          return;
        }
      } catch {
        // ignore
      }
    }

    setMounted(true);
    lockScroll();

    // Keep open transition async so "mounted" renders before "open" toggles.
    const t = window.setTimeout(() => setOpen(true), 0);
    timersRef.current.push(t);

    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    };
  }, [enabled, lockScroll]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!open) return;

    // Focus close button for accessibility
    closeBtnRef.current?.focus?.();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closePopup();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closePopup]);

  if (!mounted) return null;

  return (
    <div className={`appPopupRoot ${open ? 'is-open' : 'is-closed'}`}>
      <div className="appPopupOverlay" onClick={closePopup} />

      <div
        className="appPopupDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appPopupTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeBtnRef}
          type="button"
          className="appPopupClose"
          onClick={closePopup}
          aria-label="Close popup"
        >
          ×
        </button>

        <div className="appPopupContent">
          <img
            className="appPopupLogo"
            src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/logo-photo.jpg?v=1772628583&format=webp&width=250"
            alt="961Souq"
            loading="lazy"
            decoding="async"
          />

          <div className="appPopupDivider" />

          <p id="appPopupTitle" className="appPopupTitle">
            Try our New and Updated <br />{' '}
            <span style={{display: 'block', marginTop: '10px'}}>
              Mobile App!
            </span>
          </p>

          <button
            type="button"
            className="appPopupCta"
            onClick={handleDownloadClick}
          >
            Download
          </button>

          {/* <p className="appPopupSub">Opens the right store for your device.</p> */}
        </div>
      </div>
    </div>
  );
};

export default MobileAppPopup;
