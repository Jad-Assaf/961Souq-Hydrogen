import {useEffect, useState} from 'react';

const VISITOR_ID_STORAGE_KEY = 'storefront-visitor-id';
const ATTRIBUTION_STORAGE_KEY = 'storefront-attribution-v1';
const ATTRIBUTION_COOKIE_KEY = 'storefront_attribution';
const VISITOR_ID_COOKIE_KEY = 'storefront_vid';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const COOKIE_DOMAIN = '.961souq.com';

function readCookie(name) {
  if (typeof document === 'undefined') return null;

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`),
  );

  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name, value, maxAge = COOKIE_MAX_AGE) {
  if (typeof document === 'undefined') return;

  const encodedValue = encodeURIComponent(String(value || ''));
  document.cookie = `${name}=${encodedValue}; path=/; domain=${COOKIE_DOMAIN}; max-age=${maxAge}; SameSite=Lax`;
}

function getOrCreateVisitorId() {
  if (typeof window === 'undefined') return null;

  const storedVisitorId =
    window.localStorage.getItem(VISITOR_ID_STORAGE_KEY) ||
    readCookie(VISITOR_ID_COOKIE_KEY);
  if (storedVisitorId) {
    writeCookie(VISITOR_ID_COOKIE_KEY, storedVisitorId);
    return storedVisitorId;
  }

  const generatedVisitorId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `vid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, generatedVisitorId);
  writeCookie(VISITOR_ID_COOKIE_KEY, generatedVisitorId);
  return generatedVisitorId;
}

function getReferrerSource() {
  if (typeof document === 'undefined') return '';

  const referrer = String(document.referrer || '').trim();
  if (!referrer) return 'direct';

  try {
    return new URL(referrer).host || referrer;
  } catch {
    return referrer;
  }
}

function readStoredAttribution() {
  if (typeof window === 'undefined') return {};

  try {
    const storedValue = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (storedValue) {
      return JSON.parse(storedValue);
    }
  } catch {
    // noop
  }

  try {
    const cookieValue = readCookie(ATTRIBUTION_COOKIE_KEY);
    return cookieValue ? JSON.parse(cookieValue) : {};
  } catch {
    return {};
  }
}

function storeAttribution(attribution) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify(attribution),
    );
  } catch {}

  try {
    writeCookie(ATTRIBUTION_COOKIE_KEY, JSON.stringify(attribution));
  } catch {}
}

function collectTrackingFields() {
  if (typeof window === 'undefined') {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  const language = document.documentElement.lang || window.navigator.language;
  const storedAttribution = readStoredAttribution();
  const attribution = {
    source: params.get('source') || storedAttribution.source || getReferrerSource(),
    utm_source: params.get('utm_source') || storedAttribution.utm_source || '',
    utm_medium: params.get('utm_medium') || storedAttribution.utm_medium || '',
    utm_campaign:
      params.get('utm_campaign') || storedAttribution.utm_campaign || '',
    utm_term: params.get('utm_term') || storedAttribution.utm_term || '',
    utm_content: params.get('utm_content') || storedAttribution.utm_content || '',
  };

  storeAttribution(attribution);

  return {
    country: params.get('country') || '',
    fbp: params.get('fbp') || readCookie('_fbp') || readCookie('fbp') || '',
    host: window.location.host || '',
    locale: params.get('locale') || language || '',
    sh: String(window.screen?.height || ''),
    sw: String(window.screen?.width || ''),
    ttp: params.get('ttp') || readCookie('_ttp') || readCookie('ttp') || '',
    vid: params.get('vid') || readCookie('vid') || getOrCreateVisitorId() || '',
    ...attribution,
  };
}

export function CartTrackingFields() {
  const [fields, setFields] = useState(() => collectTrackingFields());

  useEffect(() => {
    setFields(collectTrackingFields());
  }, []);

  return (
    <>
      <input type="hidden" name="country" value={fields.country || ''} />
      <input type="hidden" name="fbp" value={fields.fbp || ''} />
      <input type="hidden" name="host" value={fields.host || ''} />
      <input type="hidden" name="locale" value={fields.locale || ''} />
      <input type="hidden" name="sh" value={fields.sh || ''} />
      <input type="hidden" name="sw" value={fields.sw || ''} />
      <input type="hidden" name="ttp" value={fields.ttp || ''} />
      <input type="hidden" name="vid" value={fields.vid || ''} />
      <input type="hidden" name="source" value={fields.source || ''} />
      <input type="hidden" name="utm_source" value={fields.utm_source || ''} />
      <input type="hidden" name="utm_medium" value={fields.utm_medium || ''} />
      <input
        type="hidden"
        name="utm_campaign"
        value={fields.utm_campaign || ''}
      />
      <input type="hidden" name="utm_term" value={fields.utm_term || ''} />
      <input
        type="hidden"
        name="utm_content"
        value={fields.utm_content || ''}
      />
    </>
  );
}
