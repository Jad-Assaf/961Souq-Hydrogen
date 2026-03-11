// ClarityTracker.js
import {useEffect} from 'react';
import {clarity} from 'react-microsoft-clarity';

// module‐scope flag prevents any double‐init
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

      clarity.init(clarityId);
      clarity.consent();
      if (userId) {
        clarity.identify(userId, userProperties);
      }
      clarity.start();
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
      if (didInitClarity) {
        clarity.stop();
      }
    };
  }, [clarityId, userId, userProperties]);

  return null;
};

export default ClarityTracker;
