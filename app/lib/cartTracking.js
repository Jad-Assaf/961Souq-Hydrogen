import {
  ATTRIBUTION_COOKIE_KEY,
  CHECKOUT_TRACKING_ATTRIBUTE_KEYS,
  CHECKOUT_URL_TRACKING_KEYS,
  NOTE_TRACKING_KEYS,
  SHOPIFY_CART_TOKEN_ATTRIBUTE_KEY,
  VISITOR_ID_COOKIE_KEY,
} from './trackingKeys';

export const CUSTOM_CHECKOUT_STAMP_ACTION = 'CustomCheckoutStamp';
const SHOPIFY_CART_TOKEN_NOTE_KEY = 'shopify-cart-token';
const SHOPIFY_CART_TOKEN_NOTE_PATTERN = /^shopify-cart-token:\s*.*$/im;

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

function readAttributionCookieValue(cookies, key) {
  try {
    const attributionCookie = cookies[ATTRIBUTION_COOKIE_KEY];
    if (!attributionCookie) return null;

    return JSON.parse(attributionCookie)?.[key] ?? null;
  } catch {
    return null;
  }
}

function getPreferredLocale(request) {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return null;

  const [firstLanguage] = acceptLanguage.split(',');
  return firstNonEmpty(firstLanguage);
}

function pickTrackedValue({formData, url, request, cookies, key, countryCode}) {
  switch (key) {
    case 'country':
      return firstNonEmpty(
        formData.get(key),
        url.searchParams.get(key),
        request.headers.get('cf-ipcountry'),
        request.headers.get('x-country-code'),
        countryCode,
      );
    case 'fbp':
      return firstNonEmpty(
        formData.get(key),
        url.searchParams.get(key),
        readAttributionCookieValue(cookies, key),
        cookies._fbp,
        cookies.fbp,
      );
    case 'host':
      return firstNonEmpty(formData.get(key), url.host);
    case 'locale':
      return firstNonEmpty(
        formData.get(key),
        url.searchParams.get(key),
        getPreferredLocale(request),
      );
    case 'sh':
    case 'sw':
    case '_kx':
    case 'epik':
    case 'fbclid':
    case 'gbraid':
    case 'gclid':
    case 'msclkid':
    case 'rdt_cid':
    case 'ScCid':
    case 'ttclid':
    case 'twclid':
    case 'wbraid':
    case 'utm_id':
    case 'utm_source':
    case 'utm_medium':
    case 'utm_campaign':
    case 'utm_term':
    case 'utm_content':
      return firstNonEmpty(
        formData.get(key),
        url.searchParams.get(key),
        readAttributionCookieValue(cookies, key),
      );
    case 'ttp':
      return firstNonEmpty(
        formData.get(key),
        url.searchParams.get(key),
        readAttributionCookieValue(cookies, key),
        cookies._ttp,
        cookies.ttp,
      );
    case 'vid':
      return firstNonEmpty(
        formData.get(key),
        url.searchParams.get(key),
        readAttributionCookieValue(cookies, key),
        cookies._shopify_y,
        cookies[VISITOR_ID_COOKIE_KEY],
        cookies.vid,
      );
    case 'fbc':
      return firstNonEmpty(
        formData.get(key),
        url.searchParams.get(key),
        readAttributionCookieValue(cookies, key),
        cookies._fbc,
        cookies.fbc,
      );
    case 'source':
      return firstNonEmpty(
        formData.get(key),
        url.searchParams.get(key),
        readAttributionCookieValue(cookies, key),
        request.headers.get('referer'),
        request.headers.get('referrer'),
      );
    default:
      return firstNonEmpty(
        formData.get(key),
        url.searchParams.get(key),
        readAttributionCookieValue(cookies, key),
      );
  }
}

export function extractCartTrackingFromRequest({
  request,
  formData,
  countryCode,
}) {
  const url = new URL(request.url);
  const cookies = parseCookieHeader(request.headers.get('cookie'));
  const tracking = {};

  for (const key of CHECKOUT_TRACKING_ATTRIBUTE_KEYS) {
    tracking[key] = pickTrackedValue({
      formData,
      url,
      request,
      cookies,
      key,
      countryCode,
    });
  }

  return tracking;
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

export function mergeTrackingAttributes(
  existingAttributes = [],
  tracking = {},
  extraAttributes = {},
) {
  const attributeMap = normalizeAttributes(existingAttributes);

  for (const key of CHECKOUT_TRACKING_ATTRIBUTE_KEYS) {
    const value = firstNonEmpty(tracking[key]);
    if (value) {
      attributeMap.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(extraAttributes)) {
    const nextValue = firstNonEmpty(value);
    if (nextValue) {
      attributeMap.set(key, nextValue);
    }
  }

  return attributesToArray(attributeMap);
}

export function extractShopifyCartToken(cartId) {
  const rawCartId = firstNonEmpty(cartId);
  return rawCartId ? rawCartId.split('/').pop() || rawCartId : null;
}

export function upsertShopifyCartTokenNote(note, cartId) {
  const token = extractShopifyCartToken(cartId);
  if (!token) {
    return firstNonEmpty(note) || '';
  }

  const nextLine = `${SHOPIFY_CART_TOKEN_NOTE_KEY}:${token}`;
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
  const cartToken = extractShopifyCartToken(cartId);
  let nextCart = cartData;

  const existingAttributes = Array.isArray(nextCart?.attributes)
    ? nextCart.attributes
    : [];
  const nextAttributes = mergeTrackingAttributes(existingAttributes, tracking, {
    [SHOPIFY_CART_TOKEN_ATTRIBUTE_KEY]: cartToken,
  });

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

export function buildStampedCheckoutUrl(checkoutUrl, tracking = {}, cartToken) {
  const rawCheckoutUrl = firstNonEmpty(checkoutUrl);
  if (!rawCheckoutUrl) return null;

  const url = new URL(rawCheckoutUrl);

  for (const key of CHECKOUT_URL_TRACKING_KEYS) {
    const value =
      key === SHOPIFY_CART_TOKEN_ATTRIBUTE_KEY
        ? firstNonEmpty(cartToken)
        : firstNonEmpty(tracking[key]);

    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

export async function stampCartForCheckout({
  cartApi,
  cartData,
  cartId,
  request,
  formData,
  countryCode,
}) {
  const cart = await syncCartTracking({
    cartApi,
    cartData,
    cartId,
    request,
    formData,
    countryCode,
  });
  const tracking = extractCartTrackingFromRequest({
    request,
    formData,
    countryCode,
  });
  const cartToken = extractShopifyCartToken(cartId);
  const checkoutUrl = buildStampedCheckoutUrl(
    cart?.checkoutUrl,
    tracking,
    cartToken,
  );

  return {
    cart,
    cartToken,
    checkoutUrl,
    tracking,
  };
}
