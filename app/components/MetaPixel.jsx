// src/components/MetaPixelManual.jsx
import {useEffect, useRef, useState} from 'react';
import {useLocation} from 'react-router-dom';

// --- Helper: Generate a unique event ID
const generateEventId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  } else {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
};

// --- Helper: Get cookie value
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop().split(';').shift() : '';
};

// --- Helper: Get external id from global customer data or generate an anonymous one
const getExternalId = () => {
  if (window.__customerData && window.__customerData.id) {
    return window.__customerData.id;
  }
  let anonId = localStorage.getItem('anonExternalId');
  if (!anonId) {
    anonId = generateEventId();
    localStorage.setItem('anonExternalId', anonId);
  }
  return anonId;
};

// --- Function to send PageView event via Conversions API
// IMPORTANT: We no longer fetch IP client-side.
// Your server should infer IP from the request and inject it into user_data.
const trackPageViewCAPI = (eventId, extraData) => {
  const payload = {
    action_source: 'website',
    event_name: 'PageView',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    // Meta supports event_source_url at top-level for web events
    event_source_url: extraData.URL,
    user_data: {
      client_user_agent: navigator.userAgent,
      // client_ip_address intentionally omitted here
      fbp: extraData.fbp,
      fbc: extraData.fbc,
      external_id: extraData.external_id,
    },
    custom_data: {
      URL: extraData.URL,
      'Event id': eventId,
    },
  };

  fetch('/facebookConversions', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .catch(() => {});
};

const SCRIPT_SRC = 'https://connect.facebook.net/en_US/fbevents.js';
const START_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];

const ensureFbq = () => {
  if (typeof window === 'undefined') return null;
  if (typeof window.fbq === 'function') return window.fbq;

  const fbq = function () {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, arguments);
    } else {
      fbq.queue.push(arguments);
    }
  };

  window.fbq = fbq;
  window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];

  if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = SCRIPT_SRC;
    document.head.appendChild(script);
  }

  return window.fbq;
};

const MetaPixel = ({pixelId}) => {
  const location = useLocation();
  const [isActivated, setIsActivated] = useState(false);
  const didInitRef = useRef(false);
  const lastTrackedUrlRef = useRef('');

  useEffect(() => {
    if (!pixelId || isActivated) return;
    if (typeof window === 'undefined') return;

    let timeoutId = null;
    let idleId = null;

    const cleanupListeners = () => {
      START_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, activate);
      });
    };

    const activate = () => {
      cleanupListeners();
      if (idleId !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      setIsActivated(true);
    };

    START_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, activate, {passive: true, once: true});
    });

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(activate, {timeout: 5000});
    } else {
      timeoutId = window.setTimeout(activate, 2500);
    }

    return () => {
      cleanupListeners();
      if (idleId !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [pixelId, isActivated]);

  // 1) Load the pixel script only once
  useEffect(() => {
    if (!pixelId || !isActivated) return;
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;

    const s = document.createElement('script');
    s.defer = true;
    s.src = SCRIPT_SRC;
    document.head.appendChild(s);
  }, [pixelId, isActivated]);

  // 2) Initialize fbq & send first PageView exactly once
  useEffect(() => {
    if (!pixelId || !isActivated || didInitRef.current) return;

    const fbq = ensureFbq();
    if (typeof fbq !== 'function') return;

    fbq('init', pixelId);

    const eventId = generateEventId();
    const fbp = getCookie('_fbp');
    const fbc = getCookie('_fbc');
    const external_id = getExternalId();
    const URL = window.location.href;

    fbq('track', 'PageView', {URL, fbp, fbc, external_id}, {eventID: eventId});
    trackPageViewCAPI(eventId, {fbp, fbc, external_id, URL});

    lastTrackedUrlRef.current = URL;
    didInitRef.current = true;
  }, [pixelId, isActivated]);

  // 3) Fire a PageView on every route change
  useEffect(() => {
    if (!didInitRef.current) return;
    if (typeof window.fbq !== 'function') return;

    const URL = window.location.href;
    if (lastTrackedUrlRef.current === URL) return;

    const eventId = generateEventId();
    const fbp = getCookie('_fbp');
    const fbc = getCookie('_fbc');
    const external_id = getExternalId();

    window.fbq(
      'track',
      'PageView',
      {URL, fbp, fbc, external_id},
      {eventID: eventId},
    );
    trackPageViewCAPI(eventId, {fbp, fbc, external_id, URL});
    lastTrackedUrlRef.current = URL;
  }, [location.pathname, location.search, location.hash]);

  return null;
};

export default MetaPixel;
