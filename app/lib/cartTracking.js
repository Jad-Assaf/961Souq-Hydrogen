const TRACKING_ATTRIBUTE_KEYS = [
  'country',
  'fbp',
  'host',
  'locale',
  'sh',
  'sw',
  'ttp',
  'vid',
  'source',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
];
const SHOPIFY_CART_TOKEN_NOTE_KEY = 'shopify-cart-token';
const SHOPIFY_CART_TOKEN_NOTE_PATTERN = /^shopify-cart-token:\s*.*$/im;
const ATTRIBUTION_COOKIE_KEY = 'storefront_attribution';
const VISITOR_ID_COOKIE_KEY = 'storefront_vid';
const NOTE_TRACKING_KEYS = [
  'source',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
];

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value == null) continue;

    const stringValue = String(value).trim();
    if (stringValue) {
      return stringValue;
    }
  }

  return null;
}

function parseCookieHeader(cookieHeader) {
  const cookies = {};

  for (const segment of String(cookieHeader || '').split(/;\s*/)) {
    if (!segment) continue;

    const separatorIndex = segment.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = decodeURIComponent(segment.slice(0, separatorIndex).trim());
    const value = decodeURIComponent(segment.slice(separatorIndex + 1).trim());
    if (key) {
      cookies[key] = value;
    }
  }

  return cookies;
}

function getPreferredLocale(request) {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return null;

  const [firstLanguage] = acceptLanguage.split(',');
  return firstNonEmpty(firstLanguage);
}

export function extractCartTrackingFromRequest({
  request,
  formData,
  countryCode,
}) {
  const url = new URL(request.url);
  const cookies = parseCookieHeader(request.headers.get('cookie'));

  return {
    country: firstNonEmpty(
      formData.get('country'),
      url.searchParams.get('country'),
      request.headers.get('cf-ipcountry'),
      request.headers.get('x-country-code'),
      countryCode,
    ),
    fbp: firstNonEmpty(
      formData.get('fbp'),
      url.searchParams.get('fbp'),
      cookies._fbp,
      cookies.fbp,
    ),
    host: firstNonEmpty(formData.get('host'), url.host),
    locale: firstNonEmpty(
      formData.get('locale'),
      url.searchParams.get('locale'),
      getPreferredLocale(request),
    ),
    sh: firstNonEmpty(formData.get('sh'), url.searchParams.get('sh')),
    sw: firstNonEmpty(formData.get('sw'), url.searchParams.get('sw')),
    ttp: firstNonEmpty(
      formData.get('ttp'),
      url.searchParams.get('ttp'),
      cookies._ttp,
      cookies.ttp,
    ),
    vid: firstNonEmpty(
      formData.get('vid'),
      url.searchParams.get('vid'),
      cookies[VISITOR_ID_COOKIE_KEY],
      cookies.vid,
    ),
    source: firstNonEmpty(
      formData.get('source'),
      url.searchParams.get('source'),
      (() => {
        try {
          const attributionCookie = cookies[ATTRIBUTION_COOKIE_KEY];
          if (!attributionCookie) return null;
          return JSON.parse(attributionCookie)?.source;
        } catch {
          return null;
        }
      })(),
      request.headers.get('referer'),
      request.headers.get('referrer'),
    ),
    utm_source: firstNonEmpty(
      formData.get('utm_source'),
      url.searchParams.get('utm_source'),
      (() => {
        try {
          const attributionCookie = cookies[ATTRIBUTION_COOKIE_KEY];
          if (!attributionCookie) return null;
          return JSON.parse(attributionCookie)?.utm_source;
        } catch {
          return null;
        }
      })(),
    ),
    utm_medium: firstNonEmpty(
      formData.get('utm_medium'),
      url.searchParams.get('utm_medium'),
      (() => {
        try {
          const attributionCookie = cookies[ATTRIBUTION_COOKIE_KEY];
          if (!attributionCookie) return null;
          return JSON.parse(attributionCookie)?.utm_medium;
        } catch {
          return null;
        }
      })(),
    ),
    utm_campaign: firstNonEmpty(
      formData.get('utm_campaign'),
      url.searchParams.get('utm_campaign'),
      (() => {
        try {
          const attributionCookie = cookies[ATTRIBUTION_COOKIE_KEY];
          if (!attributionCookie) return null;
          return JSON.parse(attributionCookie)?.utm_campaign;
        } catch {
          return null;
        }
      })(),
    ),
    utm_term: firstNonEmpty(
      formData.get('utm_term'),
      url.searchParams.get('utm_term'),
      (() => {
        try {
          const attributionCookie = cookies[ATTRIBUTION_COOKIE_KEY];
          if (!attributionCookie) return null;
          return JSON.parse(attributionCookie)?.utm_term;
        } catch {
          return null;
        }
      })(),
    ),
    utm_content: firstNonEmpty(
      formData.get('utm_content'),
      url.searchParams.get('utm_content'),
      (() => {
        try {
          const attributionCookie = cookies[ATTRIBUTION_COOKIE_KEY];
          if (!attributionCookie) return null;
          return JSON.parse(attributionCookie)?.utm_content;
        } catch {
          return null;
        }
      })(),
    ),
  };
}

function normalizeAttributes(attributes = []) {
  const attributeMap = new Map();

  for (const attribute of attributes) {
    const key = firstNonEmpty(attribute?.key);
    if (!key) continue;

    attributeMap.set(key, firstNonEmpty(attribute?.value) || '');
  }

  return attributeMap;
}

function attributesToArray(attributeMap) {
  return Array.from(attributeMap.entries()).map(([key, value]) => ({
    key,
    value,
  }));
}

function areAttributesEqual(left, right) {
  if (left.length !== right.length) return false;

  return left.every((attribute, index) => {
    const candidate = right[index];
    return (
      attribute?.key === candidate?.key && attribute?.value === candidate?.value
    );
  });
}

export function mergeTrackingAttributes(existingAttributes = [], tracking = {}) {
  const attributeMap = normalizeAttributes(existingAttributes);

  for (const key of TRACKING_ATTRIBUTE_KEYS) {
    const value = firstNonEmpty(tracking[key]);
    if (value) {
      attributeMap.set(key, value);
    }
  }

  return attributesToArray(attributeMap);
}

export function upsertShopifyCartTokenNote(note, cartId) {
  const rawCartId = firstNonEmpty(cartId);
  const token = rawCartId ? rawCartId.split('/').pop() || rawCartId : null;
  if (!token) {
    return firstNonEmpty(note) || '';
  }

  const nextLine = `${SHOPIFY_CART_TOKEN_NOTE_KEY}: ${token}`;
  const currentNote = String(note || '').trim();

  if (!currentNote) {
    return nextLine;
  }

  if (SHOPIFY_CART_TOKEN_NOTE_PATTERN.test(currentNote)) {
    return currentNote.replace(SHOPIFY_CART_TOKEN_NOTE_PATTERN, nextLine);
  }

  return `${currentNote}\n${nextLine}`;
}

function upsertTrackingNoteLines(note, tracking) {
  let nextNote = String(note || '').trim();

  for (const key of NOTE_TRACKING_KEYS) {
    const value = firstNonEmpty(tracking[key]);
    if (!value) continue;

    const line = `${key}: ${value}`;
    const pattern = new RegExp(`^${key}:\\s*.*$`, 'im');

    if (!nextNote) {
      nextNote = line;
      continue;
    }

    if (pattern.test(nextNote)) {
      nextNote = nextNote.replace(pattern, line);
      continue;
    }

    nextNote = `${nextNote}\n${line}`;
  }

  return nextNote;
}

export async function syncCartTracking({
  cartApi,
  cartData,
  cartId,
  request,
  formData,
  countryCode,
}) {
  if (!cartId) {
    return cartData;
  }

  const tracking = extractCartTrackingFromRequest({
    request,
    formData,
    countryCode,
  });
  let nextCart = cartData;

  const existingAttributes = Array.isArray(nextCart?.attributes)
    ? nextCart.attributes
    : [];
  const nextAttributes = mergeTrackingAttributes(existingAttributes, tracking);

  if (!areAttributesEqual(existingAttributes, nextAttributes)) {
    const attributesResult = await cartApi.updateAttributes(nextAttributes, {
      cartId,
    });
    nextCart = attributesResult?.cart || nextCart;
  }

  const nextNote = upsertTrackingNoteLines(
    upsertShopifyCartTokenNote(nextCart?.note, cartId),
    tracking,
  );
  if (nextNote !== String(nextCart?.note || '').trim()) {
    const noteResult = await cartApi.updateNote(nextNote, {cartId});
    nextCart = noteResult?.cart || nextCart;
  }

  return nextCart;
}
