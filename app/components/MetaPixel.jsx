// src/components/MetaPixelManual.jsx
import {useEffect, useRef} from 'react';
import {useLocation} from 'react-router-dom';

// --- Constants ---
const SCRIPT_SRC = 'https://connect.facebook.net/en_US/fbevents.js';
const FB_SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js';

// --- Helpers ---
const generateEventId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const readCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop().split(';').shift() : '';
};

const setCookie = (name, value, days = 90) => {
  try {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
  } catch {}
};

const ensureFbp = () => {
  let fbp = readCookie('_fbp');
  if (!fbp) {
    const ts = Math.floor(Date.now() / 1000);
    const rand = Math.floor(Math.random() * 10 ** 10);
    fbp = `fb.1.${ts}.${rand}`;
    setCookie('_fbp', fbp);
  }
  return fbp;
};

const ensureFbc = () => {
  try {
    const url = new URL(window.location.href);
    const fbclid = url.searchParams.get('fbclid');
    let fbc = readCookie('_fbc');
    if (!fbc && fbclid) {
      const ts = Math.floor(Date.now() / 1000);
      fbc = `fb.1.${ts}.${fbclid}`;
      setCookie('_fbc', fbc);
    }
    return readCookie('_fbc');
  } catch {
    return readCookie('_fbc');
  }
};

const getExternalId = () => {
  if (window.__customerData?.id) return window.__customerData.id;
  let anonId = localStorage.getItem('anonExternalId');
  if (!anonId) {
    anonId = generateEventId();
    localStorage.setItem('anonExternalId', anonId);
  }
  return anonId;
};

const getCountry = () => {
  try {
    const c = window.__customerData || {};
    const addr =
      c.defaultAddress ||
      c.address ||
      c.shippingAddress ||
      c.billingAddress ||
      {};
    if (addr.countryCode && /^[A-Za-z]{2}$/.test(addr.countryCode))
      return String(addr.countryCode).toLowerCase();
    if (addr.country && /^[A-Za-z]{2}$/.test(addr.country))
      return String(addr.country).toLowerCase();
    const lang = document.documentElement?.lang || '';
    const m = lang.match(/[-_](?<r>[A-Za-z]{2})/);
    if (m?.groups?.r) return m.groups.r.toLowerCase();
  } catch {}
  return '';
};

// --- Facebook SDK (for fb_login_id) ---
const loadFacebookSDK = (appId) =>
  new Promise((resolve) => {
    if (window.FB) return resolve();
    window.fbAsyncInit = function () {
      window.FB.init({appId, cookie: true, xfbml: false, version: 'v20.0'});
      resolve();
    };
    if (!document.querySelector(`script[src="${FB_SDK_SRC}"]`)) {
      const s = document.createElement('script');
      s.async = true;
      s.defer = true;
      s.src = FB_SDK_SRC;
      document.head.appendChild(s);
    } else {
      // If script already present but fbAsyncInit already fired, resolve soon
      const wait = setInterval(() => {
        if (window.FB) {
          clearInterval(wait);
          resolve();
        }
      }, 50);
      setTimeout(() => clearInterval(wait), 5000);
    }
  });

const readFbLoginId = async () => {
  const cached =
    sessionStorage.getItem('fb_login_id') || window.__fb_login_id || '';
  if (cached) return cached;
  if (!window.FB) return '';
  return new Promise((resolve) => {
    window.FB.getLoginStatus((resp) => {
      const id =
        resp?.status === 'connected' ? resp.authResponse?.userID || '' : '';
      if (id) {
        sessionStorage.setItem('fb_login_id', id);
        window.__fb_login_id = id;
      }
      resolve(id || '');
    });
  });
};

const subscribeFbAuthChanges = () => {
  if (!window.FB?.Event) return;
  window.FB.Event.subscribe('auth.statusChange', (resp) => {
    const id =
      resp?.status === 'connected' ? resp.authResponse?.userID || '' : '';
    if (id) {
      sessionStorage.setItem('fb_login_id', id);
      window.__fb_login_id = id;
      console.log('[Meta FB SDK] fb_login_id updated →', id);
    }
  });
};

// --- CAPI PageView (server will add IP/UA) ---
const trackPageViewCAPI = async (eventId, extraData) => {
  const capiPayload = {
    action_source: 'website',
    event_name: 'PageView',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: extraData.URL,
    user_data: {
      client_user_agent: navigator.userAgent,
      fbp: extraData.fbp,
      fbc: extraData.fbc,
      external_id: extraData.external_id,
      fb_login_id: extraData.fb_login_id || '',
      country: extraData.country || '',
    },
    custom_data: {URL: extraData.URL, 'Event id': eventId},
  };

  console.log('[Meta CAPI][PageView] payload →', capiPayload);

  fetch('/facebookConversions', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(capiPayload),
  })
    .then((r) => r.json())
    .then((res) => console.log('[Meta CAPI][PageView] response ←', res))
    .catch((err) => console.warn('[Meta CAPI][PageView] error', err));
};

const MetaPixel = ({pixelId, facebookAppId}) => {
  const location = useLocation();
  const didInitRef = useRef(false);

  // Initialize fbq once, load FB SDK (optional), and send first PageView
  useEffect(() => {
    if (!pixelId || didInitRef.current) return;

    // Ensure the base script exists only once
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement('script');
      s.defer = true;
      s.src = SCRIPT_SRC;
      document.head.appendChild(s);
    }

    if (typeof fbq !== 'function') {
      // Create fbq stub; insert script only if not present
      !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod
            ? n.callMethod.apply(n, arguments)
            : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        if (!b.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
          t = b.createElement(e);
          t.defer = true;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        }
      })(window, document, 'script', SCRIPT_SRC);
    }

    (async () => {
      // Optional: load FB SDK to get fb_login_id (if App ID provided)
      const appId = facebookAppId || window.__facebookAppId || '';
      if (appId) {
        await loadFacebookSDK(appId);
        subscribeFbAuthChanges();
      }

      // Ensure cookies
      const fbp = ensureFbp();
      const fbc = ensureFbc();

      const external_id = getExternalId();
      const country = getCountry();

      // 🔒 Global guard to avoid duplicate init for the same Pixel ID
      window.__META_PIXELS_INITED = window.__META_PIXELS_INITED || new Set();
      if (!window.__META_PIXELS_INITED.has(pixelId)) {
        fbq('init', pixelId, {external_id, ...(country ? {country} : {})});
        window.__META_PIXELS_INITED.add(pixelId);
      } else {
        console.warn(
          '[Meta Pixel] init skipped; already initialized:',
          pixelId,
        );
      }

      // First browser PageView
      const eventId = generateEventId();
      const URL = window.location.href;
      console.log('[Meta Pixel][PageView] eventID=', eventId, {
        URL,
        fbp,
        fbc,
        external_id,
      });
      fbq(
        'track',
        'PageView',
        {URL, fbp, fbc, external_id},
        {eventID: eventId},
      );

      // CAPI PageView (include fb_login_id if available)
      const fb_login_id = await readFbLoginId();
      trackPageViewCAPI(eventId, {
        fbp,
        fbc,
        external_id,
        URL,
        fb_login_id,
        country,
      });

      didInitRef.current = true;
    })();
  }, [pixelId, facebookAppId]);

  // Track PageView on route changes (Pixel only, to avoid CAPI spam)
  useEffect(() => {
    if (typeof fbq !== 'function') return;

    const eventId = generateEventId();
    const fbp = ensureFbp();
    const fbc = ensureFbc();
    const external_id = getExternalId();
    const URL = window.location.href;

    console.log('[Meta Pixel][PageView@route] eventID=', eventId, {
      URL,
      fbp,
      fbc,
      external_id,
    });
    fbq('track', 'PageView', {URL, fbp, fbc, external_id}, {eventID: eventId});
  }, [location]);

  return null;
};

export default MetaPixel;
