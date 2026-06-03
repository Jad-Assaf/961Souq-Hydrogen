import {getAnalyticsCookieDomain, normalizeHostname} from './shopifyAnalytics';
import {
  ATTRIBUTION_COOKIE_KEY,
  CHECKOUT_TRACKING_ATTRIBUTE_KEYS,
  getTrackingCookieKey,
  VISITOR_ID_COOKIE_KEY,
} from './trackingKeys';

const VISITOR_ID_STORAGE_KEY = 'storefront-visitor-id';
const ATTRIBUTION_STORAGE_KEY = 'storefront-attribution-v1';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value == null) continue;

    const stringValue = String(value).trim();
    if (stringValue) {
      return stringValue;
    }
  }

  return '';
}

function readCookie(name) {
  if (typeof document === 'undefined') return '';

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`),
  );

  return match ? decodeURIComponent(match[1]) : '';
}

function writeCookie(name, value, options = {}) {
  if (typeof document === 'undefined') return;

  const cookieParts = [`${name}=${encodeURIComponent(String(value || ''))}`];
  cookieParts.push('path=/');
  cookieParts.push(`max-age=${options.maxAge || COOKIE_MAX_AGE}`);
  cookieParts.push('SameSite=Lax');

  if (options.domain) {
    cookieParts.push(`domain=${options.domain}`);
  }

  document.cookie = cookieParts.join('; ');
}

function getCookieDomain(rootData) {
  if (typeof window === 'undefined') return undefined;

  return getAnalyticsCookieDomain(
    rootData?.storefrontHost,
    rootData?.publicStoreDomain,
    window.location.hostname,
  );
}

function parseStoredJson(rawValue) {
  if (!rawValue) return {};

  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
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

function deriveCountryFromLocale(locale) {
  const value = String(locale || '').trim();
  if (!value) return '';

  const parts = value.split(/[-_]/).filter(Boolean);
  if (parts.length < 2) return '';

  return String(parts[parts.length - 1] || '')
    .trim()
    .toUpperCase();
}

function getPreferredLocale(rootData) {
  const language = firstNonEmpty(
    rootData?.consent?.language,
    document.documentElement.lang,
    window.navigator.language,
  );
  const country = firstNonEmpty(
    rootData?.consent?.country,
    deriveCountryFromLocale(language),
  );

  return language && country && !/[-_]/.test(language)
    ? `${language}-${country}`
    : language;
}

function readStoredAttribution() {
  if (typeof window === 'undefined') return {};

  const sessionValue = parseStoredJson(
    window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY),
  );
  if (Object.keys(sessionValue).length > 0) {
    return sessionValue;
  }

  const cookieValue = parseStoredJson(readCookie(ATTRIBUTION_COOKIE_KEY));
  if (Object.keys(cookieValue).length > 0) {
    return cookieValue;
  }

  const attributeCookies = {};
  for (const key of CHECKOUT_TRACKING_ATTRIBUTE_KEYS) {
    const value = readCookie(getTrackingCookieKey(key));
    if (value) {
      attributeCookies[key] = value;
    }
  }

  return attributeCookies;
}

function storeAttribution(attribution, cookieDomain) {
  if (typeof window === 'undefined') return;

  const serialized = JSON.stringify(attribution);

  try {
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, serialized);
  } catch {
    // noop
  }

  writeCookie(ATTRIBUTION_COOKIE_KEY, serialized, {domain: cookieDomain});

  for (const [key, value] of Object.entries(attribution)) {
    if (!firstNonEmpty(value)) continue;
    writeCookie(getTrackingCookieKey(key), value, {domain: cookieDomain});
  }
}

function getOrCreateVisitorId(cookieDomain) {
  if (typeof window === 'undefined') return '';

  const visitorId = firstNonEmpty(
    readCookie('_shopify_y'),
    readCookie(VISITOR_ID_COOKIE_KEY),
    window.localStorage.getItem(VISITOR_ID_STORAGE_KEY),
  );

  if (visitorId) {
    try {
      window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
    } catch {
      // noop
    }
    writeCookie(VISITOR_ID_COOKIE_KEY, visitorId, {domain: cookieDomain});
    return visitorId;
  }

  const generatedVisitorId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `vid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, generatedVisitorId);
  } catch {
    // noop
  }
  writeCookie(VISITOR_ID_COOKIE_KEY, generatedVisitorId, {
    domain: cookieDomain,
  });

  return generatedVisitorId;
}

function pickAttributionValue(key, params, storedAttribution) {
  switch (key) {
    case 'fbp':
      return firstNonEmpty(
        params.get(key),
        storedAttribution[key],
        readCookie('_fbp'),
        readCookie('fbp'),
      );
    case 'fbc':
      return firstNonEmpty(
        params.get(key),
        storedAttribution[key],
        readCookie('_fbc'),
        readCookie('fbc'),
      );
    case 'ttp':
      return firstNonEmpty(
        params.get(key),
        storedAttribution[key],
        readCookie('_ttp'),
        readCookie('ttp'),
      );
    default:
      return firstNonEmpty(
        params.get(key),
        storedAttribution[key],
        readCookie(getTrackingCookieKey(key)),
      );
  }
}

function inferSource(params, storedAttribution) {
  const explicitSource = firstNonEmpty(
    params.get('source'),
    params.get('utm_source'),
    storedAttribution.source,
    storedAttribution.utm_source,
  );
  if (explicitSource) {
    return explicitSource;
  }

  if (
    params.get('fbclid') ||
    storedAttribution.fbclid ||
    params.get('fbc') ||
    storedAttribution.fbc
  ) {
    return 'meta';
  }

  if (
    params.get('gclid') ||
    storedAttribution.gclid ||
    params.get('gbraid') ||
    storedAttribution.gbraid ||
    params.get('wbraid') ||
    storedAttribution.wbraid
  ) {
    return 'google';
  }

  if (params.get('ttclid') || storedAttribution.ttclid) {
    return 'tiktok';
  }

  if (params.get('msclkid') || storedAttribution.msclkid) {
    return 'microsoft';
  }

  if (params.get('twclid') || storedAttribution.twclid) {
    return 'twitter';
  }

  if (params.get('rdt_cid') || storedAttribution.rdt_cid) {
    return 'reddit';
  }

  return getReferrerSource();
}

export function collectBrowserCartTracking(rootData) {
  if (typeof window === 'undefined') {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  const storedAttribution = readStoredAttribution();
  const cookieDomain = getCookieDomain(rootData);
  const locale = firstNonEmpty(
    params.get('locale'),
    rootData?.consent?.locale,
    getPreferredLocale(rootData),
  );
  const tracking = {
    country: firstNonEmpty(
      params.get('country'),
      rootData?.consent?.country,
      deriveCountryFromLocale(locale),
    ),
    fbp: pickAttributionValue('fbp', params, storedAttribution),
    host: firstNonEmpty(
      rootData?.storefrontHost,
      normalizeHostname(rootData?.publicStoreDomain),
      window.location.host,
    ),
    locale,
    sh: String(window.screen?.height || ''),
    sw: String(window.screen?.width || ''),
    ttp: pickAttributionValue('ttp', params, storedAttribution),
    vid: firstNonEmpty(
      params.get('vid'),
      storedAttribution.vid,
      readCookie('_shopify_y'),
      getOrCreateVisitorId(cookieDomain),
    ),
    source: inferSource(params, storedAttribution),
  };

  for (const key of CHECKOUT_TRACKING_ATTRIBUTE_KEYS) {
    if (tracking[key]) continue;
    tracking[key] = pickAttributionValue(key, params, storedAttribution);
  }

  if (!tracking.utm_source && tracking.source && tracking.source !== 'direct') {
    tracking.utm_source = tracking.source;
  }

  const storedPayload = Object.fromEntries(
    Object.entries(tracking).filter(([, value]) => firstNonEmpty(value)),
  );
  storeAttribution(storedPayload, cookieDomain);

  return tracking;
}
