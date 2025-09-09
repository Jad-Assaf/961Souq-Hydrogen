// metaPixelEvents.js

// Keep IP helper (used by Purchase ONLY; others will not call it)
export const getClientIP = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip; // e.g. "123.45.67.89"
  } catch (error) {
    return '';
  }
};

// --- Utils / Helpers ---
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

// Ensure FBP coverage (create if missing)
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

// Ensure FBC coverage (synthesize from fbclid if cookie missing)
const parseFbc = (fbc) => {
  const m = /^fb\.1\.(\d+)\.(.+)$/.exec(fbc || '');
  return m ? {ts: parseInt(m[1], 10), fbclid: m[2]} : null;
};
const isFbcExpired = (ts) => {
  const now = Math.floor(Date.now() / 1000);
  return now - ts > 90 * 24 * 60 * 60;
};

const ensureFbc = () => {
  try {
    const url = new URL(window.location.href);
    const fbclid = url.searchParams.get('fbclid');
    let fbc = readCookie('_fbc');

    if (fbclid) {
      const ts = Math.floor(Date.now() / 1000);
      fbc = `fb.1.${ts}.${fbclid}`;
      setCookie('_fbc', fbc);
      return fbc;
    }

    if (fbc) {
      const parsed = parseFbc(fbc);
      if (!parsed || isFbcExpired(parsed.ts)) {
        setCookie('_fbc', '', -1);
        return '';
      }
    }
    return fbc || '';
  } catch {
    return readCookie('_fbc') || '';
  }
};

const parseGid = (gid) => {
  if (!gid) return '';
  const parts = gid.split('/');
  return parts[parts.length - 1];
};

const getExternalId = (customerData = {}) => {
  if (customerData && customerData.id) return customerData.id;
  if (window.__customerData && window.__customerData.id)
    return window.__customerData.id;
  let anonId = localStorage.getItem('anonExternalId');
  if (!anonId) {
    anonId = generateEventId();
    localStorage.setItem('anonExternalId', anonId);
  }
  return anonId;
};

// Country from customer address only; 2-letter ISO
const getCountry = (customerData = {}) => {
  try {
    const c = customerData.id ? customerData : window.__customerData || {};
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

const sendToServerCapi = async (eventData) => {
  fetch('/facebookConversions', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(eventData),
  }).catch(() => {});
};

// ---------------- Events ----------------

/**
 * ViewContent (per-PDP, no global lockout)
 */
export const trackViewContent = async (product, customerData = {}) => {
  const variantId = parseGid(product.selectedVariant?.id);
  const dedupeKey =
    variantId || `p:${parseGid(product.id)}` || window.location.pathname;
  window.__vcSeen = window.__vcSeen || new Set();
  if (window.__vcSeen.has(dedupeKey)) return;
  window.__vcSeen.add(dedupeKey);

  const price =
    product.selectedVariant?.price?.amount || product.price?.amount || 0;
  const currency = product.price?.currencyCode || 'USD';
  const eventId = generateEventId();

  const fbp = ensureFbp();
  const fbc = ensureFbc();

  const {email = '', phone = '', fb_login_id = ''} = customerData;
  const external_id = getExternalId(customerData);
  const country = getCountry(customerData);

  const URL = window.location.href;
  const content_name = product.title || '';
  const content_category = product.productType || '';
  const contents = [
    {
      id: variantId || '',
      quantity: 1,
      item_price: parseFloat(price) || 0,
    },
  ];

  if (typeof fbq === 'function') {
    fbq(
      'track',
      'ViewContent',
      {
        URL,
        'Event id': eventId,
        value: parseFloat(price),
        currency,
        content_ids: [variantId],
        content_type: 'product_variant',
        content_name,
        content_category,
        contents,
        fbp,
        fbc,
        external_id,
        email,
        phone,
        fb_login_id,
      },
      {eventID: eventId},
    );
  }

  // CAPI
  sendToServerCapi({
    action_source: 'website',
    event_name: 'ViewContent',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: URL,
    user_data: {
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
      email,
      phone,
      fb_login_id,
      country,
    },
    custom_data: {
      URL,
      'Event id': eventId,
      value: parseFloat(price),
      currency,
      content_ids: [variantId],
      content_type: 'product_variant',
      content_name,
      content_category,
      contents,
    },
  });
};

/**
 * AddToCart
 */
export const trackAddToCart = async (product, customerData = {}) => {
  const variantId = parseGid(product.selectedVariant?.id);
  const unitPrice = parseFloat(
    product.selectedVariant?.price?.amount || product.price?.amount || 0,
  );
  const currency = product.price?.currencyCode || 'USD';
  const quantity = Number(product.quantity || 1);
  const value = unitPrice * quantity;
  const eventId = generateEventId();

  const fbp = ensureFbp();
  const fbc = ensureFbc();
  const {email = '', phone = '', fb_login_id = ''} = customerData;
  const external_id = getExternalId(customerData);
  const country = getCountry(customerData);

  const URL = window.location.href;
  const content_name = product.title || '';
  const content_category = product.productType || '';
  const contents = [
    {
      id: variantId || '',
      quantity,
      item_price: unitPrice,
    },
  ];

  if (typeof fbq === 'function') {
    fbq(
      'track',
      'AddToCart',
      {
        URL,
        'Event id': eventId,
        value,
        currency,
        content_ids: [variantId],
        content_type: 'product_variant',
        content_name,
        content_category,
        num_items: quantity,
        contents,
        fbp,
        fbc,
        external_id,
        email,
        phone,
        fb_login_id,
      },
      {eventID: eventId},
    );
  }

  // CAPI
  sendToServerCapi({
    action_source: 'website',
    event_name: 'AddToCart',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: URL,
    user_data: {
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
      email,
      phone,
      fb_login_id,
      country,
    },
    custom_data: {
      URL,
      'Event id': eventId,
      value,
      currency,
      content_ids: [variantId],
      content_type: 'product_variant',
      content_name,
      content_category,
      num_items: quantity,
      contents,
    },
  });
};

/**
 * Purchase  ❗️DO NOT EDIT (kept exactly as provided before)
 */
export const trackPurchase = async (order, customerData = {}) => {
  const eventId = generateEventId();

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  };
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');
  const {email = '', phone = '', fb_login_id = ''} = customerData;
  const external_id = getExternalId(customerData);

  // Meta Pixel call
  if (typeof fbq === 'function') {
    fbq(
      'track',
      'Purchase',
      {
        content_ids: order.items.map((item) => parseGid(item.variantId)),
        content_type: 'product_variant',
        currency: 'USD',
        value: order.total,
        num_items: order.items.length,
        contents: order.items.map((item) => ({
          id: parseGid(item.variantId),
          quantity: item.quantity,
          item_price: item.price,
        })),
        fbp,
        fbc,
        external_id,
        email,
        phone,
        fb_login_id,
      },
      {eventID: eventId},
    );
  }

  const clientIP = await getClientIP();
  // Server-to-Server CAPI
  sendToServerCapi({
    action_source: 'website',
    event_name: 'Purchase',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_user_agent: navigator.userAgent,
      client_ip_address: clientIP,
      fbp,
      fbc,
      external_id,
    },
    custom_data: {
      currency: 'USD',
      value: order.total,
      num_items: order.items.length,
      content_type: 'product_variant',
      content_ids: order.items.map((item) => parseGid(item.variantId)),
      contents: order.items.map((item) => ({
        id: parseGid(item.variantId),
        quantity: item.quantity,
        item_price: item.price,
      })),
    },
  });
};

/**
 * Search
 */
export const trackSearch = async (query, customerData = {}) => {
  const eventId = generateEventId();
  const fbp = ensureFbp();
  const fbc = ensureFbc();

  const {email = '', phone = '', fb_login_id = ''} = customerData;
  const external_id = getExternalId(customerData);
  const country = getCountry(customerData);
  const URL = window.location.href;

  if (typeof fbq === 'function') {
    fbq(
      'track',
      'Search',
      {
        search_string: query,
        content_category: 'Search',
        fbp,
        fbc,
        external_id,
        email,
        phone,
        fb_login_id,
      },
      {eventID: eventId},
    );
  }

  // CAPI
  sendToServerCapi({
    action_source: 'website',
    event_name: 'Search',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: URL,
    user_data: {
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
      email,
      phone,
      fb_login_id,
      country,
    },
    custom_data: {
      search_string: query,
    },
  });
};

/**
 * InitiateCheckout
 */
export const trackInitiateCheckout = async (cart, customerData = {}) => {
  const eventId = generateEventId();
  const variantIds = cart.items?.map((item) => parseGid(item.variantId)) || [];
  const contents = (cart.items || []).map((item) => ({
    id: parseGid(item.variantId),
    quantity: Number(item.quantity || 1),
    item_price: parseFloat(item.price || item?.cost?.amount || 0),
  }));
  const value =
    parseFloat(cart.cost?.totalAmount?.amount) ||
    contents.reduce((sum, c) => sum + c.item_price * c.quantity, 0);
  const currency = cart.cost?.totalAmount?.currencyCode || 'USD';
  const num_items = cart.items?.length || 0;
  const URL = window.location.href;

  const fbp = ensureFbp();
  const fbc = ensureFbc();
  const {email = '', phone = '', fb_login_id = ''} = customerData;
  const external_id = getExternalId(customerData);
  const country = getCountry(customerData);

  if (typeof fbq === 'function') {
    try {
      fbq(
        'track',
        'InitiateCheckout',
        {
          URL,
          'Event id': eventId,
          value,
          currency,
          content_ids: variantIds,
          content_type: 'product_variant',
          num_items,
          contents,
          fbp,
          fbc,
          external_id,
          email,
          phone,
          fb_login_id,
        },
        {eventID: eventId},
      );
    } catch (error) {}
  }

  // CAPI
  sendToServerCapi({
    action_source: 'website',
    event_name: 'InitiateCheckout',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: URL,
    user_data: {
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
      email,
      phone,
      fb_login_id,
      country,
    },
    custom_data: {
      URL,
      'Event id': eventId,
      value,
      currency,
      content_ids: variantIds,
      content_type: 'product_variant',
      num_items,
      contents,
    },
  });
};

/**
 * AddPaymentInfo
 */
export const trackAddPaymentInfo = async (order, customerData = {}) => {
  const eventId = generateEventId();

  const fbp = ensureFbp();
  const fbc = ensureFbc();
  const {email = '', phone = '', fb_login_id = ''} = customerData;
  const external_id = getExternalId(customerData);
  const country = getCountry(customerData);

  const currency = order.currency || 'USD';
  const value = order.total || 0;
  const contents = (order.items || []).map((item) => ({
    id: parseGid(item.variantId),
    quantity: Number(item.quantity || 1),
    item_price: parseFloat(item.price || 0),
  }));
  const content_ids = contents.map((c) => c.id);
  const URL = window.location.href;

  if (typeof fbq === 'function') {
    fbq(
      'track',
      'AddPaymentInfo',
      {
        currency,
        value,
        fbp,
        fbc,
        external_id,
        email,
        phone,
        fb_login_id,
      },
      {eventID: eventId},
    );
  }

  // CAPI
  sendToServerCapi({
    action_source: 'website',
    event_name: 'AddPaymentInfo',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: URL,
    user_data: {
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
      email,
      phone,
      fb_login_id,
      country,
    },
    custom_data: {
      currency,
      value,
      content_type: 'product_variant',
      content_ids,
      contents,
    },
  });
};
