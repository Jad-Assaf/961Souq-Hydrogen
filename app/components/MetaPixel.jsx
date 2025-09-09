import {useEffect, useRef} from 'react';
import {useLocation} from 'react-router-dom';

// --- Helpers ---
const generateEventId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
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

// fbc parsing/validation (90 days)
const parseFbc = (fbc) => {
  const m = /^fb\.1\.(\d+)\.(.+)$/.exec(fbc || '');
  return m ? {ts: parseInt(m[1], 10), fbclid: m[2]} : null;
};
const isFbcExpired = (ts) => {
  const now = Math.floor(Date.now() / 1000);
  return now - ts > 90 * 24 * 60 * 60; // 90 days
};

const ensureFbc = () => {
  try {
    const url = new URL(window.location.href);
    const fbclid = url.searchParams.get('fbclid');
    let fbc = readCookie('_fbc');

    // Create/refresh only when a fresh fbclid is present
    if (fbclid) {
      const ts = Math.floor(Date.now() / 1000);
      fbc = `fb.1.${ts}.${fbclid}`;
      setCookie('_fbc', fbc);
      return fbc;
    }

    if (fbc) {
      const parsed = parseFbc(fbc);
      if (!parsed || isFbcExpired(parsed.ts)) {
        setCookie('_fbc', '', -1); // drop stale cookie
        return '';
      }
    }
    return fbc || '';
  } catch {
    return readCookie('_fbc') || '';
  }
};

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

// Country from customer address only (2-letter ISO). No language fallback.
const getCountry = () => {
  try {
    const c = window.__customerData || {};
    const addr =
      c.defaultAddress ||
      c.address ||
      c.shippingAddress ||
      c.billingAddress ||
      {};
    const raw =
      addr.countryCodeV2 ||
      addr.countryCode ||
      addr.country_code ||
      addr.country;
    if (raw && /^[A-Za-z]{2}$/.test(String(raw))) {
      return String(raw).toLowerCase();
    }
  } catch {}
  return '';
};

// Hash helpers (Pixel hashes AM itself; server hashes CAPI)
const sha256Hex = async (value) => {
  if (!value) return '';
  const enc = new TextEncoder().encode(String(value).trim().toLowerCase());
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};
const normalizePhone = (p) => (p || '').replace(/\D+/g, '');

// --- CAPI: send PageView once (server will add IP & enforce country) ---
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
      email: extraData.email || '',
      phone: extraData.phone || '',
      fb_login_id: extraData.fb_login_id || '',
      country: extraData.country || '', // server hashes & filters
    },
    custom_data: {
      URL: extraData.URL,
      'Event id': eventId,
    },
  };

  fetch('/facebookConversions', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(capiPayload),
  }).catch(() => {});
};

const SCRIPT_SRC = 'https://connect.facebook.net/en_US/fbevents.js';

const MetaPixel = ({pixelId}) => {
  const location = useLocation();
  const didInitRef = useRef(false);

  useEffect(() => {
    if (!pixelId || didInitRef.current) return;

    if (typeof fbq !== 'function') {
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
        t = b.createElement(e);
        t.defer = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', SCRIPT_SRC);
    }

    (async () => {
      const fbp = ensureFbp();
      const fbc = ensureFbc();

      const external_id = getExternalId();
      const rawEmail = window.__customerData?.email || '';
      const rawPhone = window.__customerData?.phone || '';
      const country = getCountry();

      const am = {external_id};
      if (rawEmail) am.em = await sha256Hex(rawEmail);
      if (rawPhone) am.ph = await sha256Hex(normalizePhone(rawPhone));
      if (country) am.country = country;

      fbq('init', pixelId, am);

      const eventId = generateEventId();
      const URL = window.location.href;
      fbq(
        'track',
        'PageView',
        {URL, fbp, fbc, external_id},
        {eventID: eventId},
      );

      const fb_login_id = window.__customerData?.fb_login_id || '';
      trackPageViewCAPI(eventId, {
        fbp,
        fbc,
        external_id,
        URL,
        email: rawEmail,
        phone: rawPhone,
        fb_login_id,
        country,
      });

      didInitRef.current = true;
    })();
  }, [pixelId]);

  useEffect(() => {
    if (typeof fbq !== 'function') return;

    const eventId = generateEventId();
    const fbp = ensureFbp();
    const fbc = ensureFbc();
    const external_id = getExternalId();
    const URL = window.location.href;

    fbq('track', 'PageView', {URL, fbp, fbc, external_id}, {eventID: eventId});
  }, [location]);

  return null;
};

export default MetaPixel;
