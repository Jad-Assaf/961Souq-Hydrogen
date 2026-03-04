// src/components/MetaPixelManual.jsx
import {useEffect, useRef} from 'react';
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
const PIXEL_DELAY_MS = 1500;
const PIXEL_IDLE_TIMEOUT_MS = 3000;

const ensureFbqStub = () => {
  if (typeof window.fbq === 'function') return window.fbq;

  const fbqStub = function () {
    fbqStub.callMethod
      ? fbqStub.callMethod.apply(fbqStub, arguments)
      : fbqStub.queue.push(arguments);
  };

  if (!window._fbq) window._fbq = fbqStub;
  fbqStub.push = fbqStub;
  fbqStub.loaded = true;
  fbqStub.version = '2.0';
  fbqStub.queue = [];
  window.fbq = fbqStub;
  return fbqStub;
};

const MetaPixel = ({pixelId}) => {
  const location = useLocation();
  const didInitRef = useRef(false);
  const scriptInjectedRef = useRef(false);
  const fallbackTimerRef = useRef(null);
  const idleCallbackRef = useRef(null);

  // 1) Load the pixel script only once
  useEffect(() => {
    if (!pixelId) return;
    if (scriptInjectedRef.current) return;
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      scriptInjectedRef.current = true;
      return;
    }

    const injectScript = () => {
      if (scriptInjectedRef.current) return;
      scriptInjectedRef.current = true;

      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (idleCallbackRef.current && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackRef.current);
        idleCallbackRef.current = null;
      }

      const s = document.createElement('script');
      s.defer = true;
      s.src = SCRIPT_SRC;
      document.head.appendChild(s);
    };

    const scheduleLoad = () => {
      if ('requestIdleCallback' in window) {
        idleCallbackRef.current = window.requestIdleCallback(injectScript, {
          timeout: PIXEL_IDLE_TIMEOUT_MS,
        });
        return;
      }

      fallbackTimerRef.current = window.setTimeout(
        injectScript,
        PIXEL_DELAY_MS,
      );
    };

    if (document.readyState === 'complete') {
      scheduleLoad();
    } else {
      window.addEventListener('load', scheduleLoad, {once: true});
    }

    return () => {
      window.removeEventListener('load', scheduleLoad);
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (idleCallbackRef.current && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackRef.current);
        idleCallbackRef.current = null;
      }
    };
  }, [pixelId]);

  // 2) Initialize fbq & send first PageView exactly once
  useEffect(() => {
    if (!pixelId || didInitRef.current) return;

    const fbq = ensureFbqStub();
    fbq('init', pixelId);

    const eventId = generateEventId();
    const fbp = getCookie('_fbp');
    const fbc = getCookie('_fbc');
    const external_id = getExternalId();
    const URL = window.location.href;

    fbq('track', 'PageView', {URL, fbp, fbc, external_id}, {eventID: eventId});
    trackPageViewCAPI(eventId, {fbp, fbc, external_id, URL});

    didInitRef.current = true;
  }, [pixelId]);

  // 3) Fire a PageView on every route change
  useEffect(() => {
    const fbq = window.fbq;
    if (typeof fbq !== 'function') return;

    const eventId = generateEventId();
    const fbp = getCookie('_fbp');
    const fbc = getCookie('_fbc');
    const external_id = getExternalId();
    const URL = window.location.href;

    fbq('track', 'PageView', {URL, fbp, fbc, external_id}, {eventID: eventId});
    trackPageViewCAPI(eventId, {fbp, fbc, external_id, URL});
  }, [location]);

  return null;
};

export default MetaPixel;
