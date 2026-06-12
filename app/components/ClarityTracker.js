// ClarityTracker.js
import {useEffect} from 'react';

// Module-scope flag prevents any double init.
let didInitClarity = false;
const START_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];

const ClarityTracker = ({clarityId, userId, userProperties}) => {
  useEffect(() => {
    if (!clarityId || didInitClarity) return;
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let timeoutId = null;
    let idleId = null;

    const cleanupListeners = () => {
      START_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, scheduleStart);
      });
    };

    const startClarity = () => {
      if (cancelled || didInitClarity) return;

      window.clarity =
        window.clarity ||
        function clarityQueue() {
          window.clarity.q = window.clarity.q || [];
          window.clarity.q.push(arguments);
        };

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.clarity.ms/tag/${encodeURIComponent(
        clarityId,
      )}`;
      document.head.appendChild(script);

      window.clarity('consent');
      if (userId) {
        window.clarity('identify', userId);
      }
      if (userProperties && typeof userProperties === 'object') {
        Object.entries(userProperties).forEach(([key, value]) => {
          if (value != null) {
            window.clarity('set', key, String(value));
          }
        });
      }
      didInitClarity = true;
    };

    const scheduleStart = () => {
      cleanupListeners();
      if (idleId !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      startClarity();
    };

    START_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, scheduleStart, {
        passive: true,
        once: true,
      });
    });

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(scheduleStart, {timeout: 5000});
    } else {
      timeoutId = window.setTimeout(scheduleStart, 2500);
    }

    return () => {
      cancelled = true;
      cleanupListeners();
      if (idleId !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [clarityId, userId, userProperties]);

  return null;
};

export default ClarityTracker;
