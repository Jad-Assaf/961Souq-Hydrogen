import {json} from '@shopify/remix-oxygen';
import {sha256} from 'js-sha256';

const ALLOWED_EVENT_NAMES = new Set([
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'Purchase',
  'Search',
  'AddPaymentInfo',
]);
const FBC_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

function sha256Hash(value) {
  if (!value) return '';
  return sha256(String(value));
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value == null) continue;

    const stringValue = String(value).trim();
    if (stringValue) return stringValue;
  }

  return '';
}

function firstIp(value) {
  return String(value || '')
    .split(',')[0]
    .trim();
}

function getClientIpFromHeaders(request) {
  return firstIp(
    firstNonEmpty(
      request.headers.get('cf-connecting-ip'),
      request.headers.get('x-forwarded-for'),
      request.headers.get('x-real-ip'),
    ),
  );
}

function parseCookieHeader(cookieHeader) {
  const cookies = {};

  for (const segment of String(cookieHeader || '').split(/;\s*/)) {
    if (!segment) continue;

    const separatorIndex = segment.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = decodeURIComponent(segment.slice(0, separatorIndex).trim());
    const value = decodeURIComponent(segment.slice(separatorIndex + 1).trim());
    if (key) cookies[key] = value;
  }

  return cookies;
}

function buildFbcFromUrl(eventSourceUrl) {
  try {
    const url = new URL(eventSourceUrl);
    const fbclid = url.searchParams.get('fbclid');
    return fbclid ? `fb.1.${Date.now()}.${fbclid}` : '';
  } catch {
    return '';
  }
}

function getFbcTimestamp(fbc) {
  const timestamp = String(fbc || '').split('.')[2];
  const number = Number(timestamp);
  if (!Number.isFinite(number) || number <= 0) return 0;

  return number < 1000000000000 ? number * 1000 : number;
}

function isFreshFbc(fbc) {
  const value = String(fbc || '').trim();
  if (!value) return false;

  const timestamp = getFbcTimestamp(value);
  if (!timestamp) return false;

  return Date.now() - timestamp <= FBC_MAX_AGE_MS;
}

function firstFreshFbc(...values) {
  for (const value of values) {
    const stringValue = String(value || '').trim();
    if (isFreshFbc(stringValue)) return stringValue;
  }

  return '';
}

function cleanObject(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanObject(item))
      .filter((item) => {
        if (item == null) return false;
        if (typeof item === 'string') return item.trim() !== '';
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === 'object') return Object.keys(item).length > 0;
        return true;
      });
  }

  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key, cleanObject(item)])
      .filter(([, item]) => {
        if (item == null) return false;
        if (typeof item === 'string') return item.trim() !== '';
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === 'object') return Object.keys(item).length > 0;
        return true;
      }),
  );
}

function buildUserData({eventData, request}) {
  const cookies = parseCookieHeader(request.headers.get('cookie'));
  const incomingUserData = eventData.user_data || {};
  const userData = {
    ...incomingUserData,
    fbp: firstNonEmpty(incomingUserData.fbp, cookies._fbp, cookies.fbp),
    fbc: firstFreshFbc(
      incomingUserData.fbc,
      cookies._fbc,
      cookies.fbc,
      buildFbcFromUrl(eventData.event_source_url),
    ),
  };

  const email = normalizeEmail(userData.email || userData.em);
  if (email) userData.em = sha256Hash(email);
  delete userData.email;

  const phone = normalizePhone(userData.phone || userData.ph);
  if (phone) userData.ph = sha256Hash(phone);
  delete userData.phone;

  if (userData.external_id) {
    userData.external_id = sha256Hash(String(userData.external_id).trim());
  }

  const clientIp = getClientIpFromHeaders(request);
  if (clientIp) userData.client_ip_address = clientIp;

  const userAgent = request.headers.get('user-agent');
  if (userAgent) userData.client_user_agent = userAgent;

  return cleanObject(userData);
}

function buildMetaEvent({eventData, request}) {
  const eventName = String(eventData.event_name || '').trim();
  const eventId = String(eventData.event_id || '').trim();

  if (!ALLOWED_EVENT_NAMES.has(eventName)) {
    throw new Error(`Unsupported Meta event: ${eventName || '(missing)'}`);
  }

  if (!eventId) {
    throw new Error('Missing Meta event_id');
  }

  return cleanObject({
    event_name: eventName,
    event_time:
      Number(eventData.event_time) || Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: 'website',
    event_source_url: eventData.event_source_url,
    user_data: buildUserData({eventData, request}),
    custom_data: eventData.custom_data || {},
  });
}

export async function action({request, context}) {
  if (request.method !== 'POST') {
    return json({success: false, error: 'Method Not Allowed'}, {status: 405});
  }

  try {
    const eventData = await request.json();
    const metaEvent = buildMetaEvent({eventData, request});
    const pixelId = context.env.META_PIXEL_ID;
    const accessToken = context.env.META_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      throw new Error('Missing Meta Pixel credentials in environment variables');
    }

    const payload = cleanObject({
      data: [metaEvent],
      test_event_code: context.env.META_TEST_EVENT_CODE,
    });

    const metaResponse = await fetch(
      `https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      },
    );

    const metaResult = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error('[Meta CAPI] Meta response error:', metaResult);
      return json(
        {success: false, result: metaResult},
        {status: metaResponse.status},
      );
    }

    return json({success: true, result: metaResult});
  } catch (error) {
    console.error('[Meta CAPI] Error:', error);
    return json(
      {success: false, error: error?.message || 'Meta tracking failed'},
      {status: 500},
    );
  }
}
