// src/components/MetaPixelManual.jsx
import {useEffect} from 'react';
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

// --- Function to send PageView event via Conversions API (without real IP and fbclid)
const trackPageViewCAPI = async (eventId, extraData) => {
  const payload = {
    action_source: 'website',
    event_name: 'PageView',
    event_id: eventId, // This should match the Pixel eventID
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_user_agent: navigator.userAgent,
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
    .catch((error) => {});
};

const MetaPixel = ({pixelId}) => {
  const location = useLocation();

  useEffect(() => {
    if (!pixelId) return;

    // Insert the Meta Pixel script
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      'script',
      'https://connect.facebook.net/en_US/fbevents.js',
    );

    // Initialize the Pixel
    fbq('init', pixelId);

    // Get extra fields
    const fbp = getCookie('_fbp');
    const fbc = getCookie('_fbc');
    const external_id = getExternalId();
    const URL = window.location.href;

    // Generate one event ID for the initial PageView
    const eventId = generateEventId();

    // Track PageView via Pixel with additional fields
    fbq(
      'track',
      'PageView',
      {
        URL,
        'Event id': eventId,
        fbp,
        fbc,
        external_id,
      },
      {eventID: eventId},
    );

    // Also track PageView via Conversions API using the same event_id and extra fields
    trackPageViewCAPI(eventId, {fbp, fbc, external_id, URL});
  }, [pixelId]);

  // On route changes, track PageView events again (both Pixel & CAPI)
  useEffect(() => {
    if (typeof fbq === 'function') {
      const fbp = getCookie('_fbp');
      const fbc = getCookie('_fbc');
      const external_id = getExternalId();
      const URL = window.location.href;
      const eventId = generateEventId();
      fbq(
        'track',
        'PageView',
        {
          URL,
          'Event id': eventId,
          fbp,
          fbc,
          external_id,
        },
        {eventID: eventId},
      );
      trackPageViewCAPI(eventId, {fbp, fbc, external_id, URL});
    }
  }, [location]);

  return (
    <>
      {/* Meta Pixel NoScript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{display: 'none'}}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt="Meta Pixel"
        />
      </noscript>
    </>
  );
};

export default MetaPixel;
