// metaPixelEvents.js

// Keep IP helper (used by Purchase ONLY; others will not call it)
export const getClientIP = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch {
    return '';
  }
};

// --- Utils / Helpers ---
const generateEventId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

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

const parseGid = (gid) => (gid ? gid.split('/').pop() : '');

const getExternalId = (customerData = {}) => {
  if (customerData?.id) return customerData.id;
  if (window.__customerData?.id) return window.__customerData.id;
  let anonId = localStorage.getItem('anonExternalId');
  if (!anonId) {
    anonId = generateEventId();
    localStorage.setItem('anonExternalId', anonId);
  }
  return anonId;
};

const getCountry = (customerData = {}) => {
  try {
    const c = customerData.id ? customerData : window.__customerData || {};
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

// --- fb_login_id accessor from SDK cache ---
const getFbLoginId = () =>
  sessionStorage.getItem('fb_login_id') || window.__fb_login_id || '';

// CAPI sender
const sendToServerCapi = async (eventData) => {
  console.log(`[Meta CAPI][${eventData?.event_name}] payload →`, eventData);
  fetch('/facebookConversions', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(eventData),
  })
    .then((res) => res.json())
    .then((res) =>
      console.log(`[Meta CAPI][${eventData?.event_name}] response ←`, res),
    )
    .catch((error) =>
      console.warn(`[Meta CAPI][${eventData?.event_name}] error`, error),
    );
};

// ---------------- Events ----------------

export const trackViewContent = async (product, customerData = {}) => {
  const variantId = parseGid(product.selectedVariant?.id);
  const key =
    variantId || `p:${parseGid(product.id)}` || window.location.pathname;
  window.__vcSeen = window.__vcSeen || new Set();
  if (window.__vcSeen.has(key)) return;
  window.__vcSeen.add(key);

  const price =
    product.selectedVariant?.price?.amount || product.price?.amount || 0;
  const currency = product.price?.currencyCode || 'USD';
  const eventId = generateEventId();

  const fbp = ensureFbp();
  const fbc = ensureFbc();
  const external_id = getExternalId(customerData);
  const country = getCountry(customerData);
  const fb_login_id = getFbLoginId();

  const URL = window.location.href;
  const content_name = product.title || '';
  const content_category = product.productType || '';
  const contents = [
    {id: variantId || '', quantity: 1, item_price: parseFloat(price) || 0},
  ];

  if (typeof fbq === 'function') {
    console.log('[Meta Pixel][ViewContent] eventID=', eventId, {
      URL,
      currency,
      price,
      variantId,
    });
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
        fb_login_id, // custom param for parity
      },
      {eventID: eventId},
    );
  }

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
  const external_id = getExternalId(customerData);
  const country = getCountry(customerData);
  const fb_login_id = getFbLoginId();

  const URL = window.location.href;
  const content_name = product.title || '';
  const content_category = product.productType || '';
  const contents = [{id: variantId || '', quantity, item_price: unitPrice}];

  if (typeof fbq === 'function') {
    console.log('[Meta Pixel][AddToCart] eventID=', eventId, {
      URL,
      value,
      currency,
      variantId,
      quantity,
    });
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
        fb_login_id,
      },
      {eventID: eventId},
    );
  }

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

// ❗ Purchase: left exactly as originally (no changes to server payload)
export const trackPurchase = async (order, customerData = {}) => {
  const eventId = generateEventId();
  const fbp = readCookie('_fbp');
  const fbc = readCookie('_fbc');
  const external_id = getExternalId(customerData);

  if (typeof fbq === 'function') {
    fbq(
      'track',
      'Purchase',
      {
        content_ids: order.items.map((i) => parseGid(i.variantId)),
        content_type: 'product_variant',
        currency: 'USD',
        value: order.total,
        num_items: order.items.length,
        contents: order.items.map((i) => ({
          id: parseGid(i.variantId),
          quantity: i.quantity,
          item_price: i.price,
        })),
        fbp,
        fbc,
        external_id,
        fb_login_id: getFbLoginId(), // custom param only; Pixel won’t use it for AM
      },
      {eventID: eventId},
    );
  }

  const clientIP = await getClientIP();
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
      // Purchase CAPI payload intentionally unchanged per your request
    },
    custom_data: {
      currency: 'USD',
      value: order.total,
      num_items: order.items.length,
      content_type: 'product_variant',
      content_ids: order.items.map((i) => parseGid(i.variantId)),
      contents: order.items.map((i) => ({
        id: parseGid(i.variantId),
        quantity: i.quantity,
        item_price: i.price,
      })),
    },
  });
};

export const trackSearch = async (query, customerData = {}) => {
  const eventId = generateEventId();
  const fbp = ensureFbp();
  const fbc = ensureFbc();
  const external_id = getExternalId(customerData);
  const country = getCountry(customerData);
  const fb_login_id = getFbLoginId();
  const URL = window.location.href;

  if (typeof fbq === 'function') {
    console.log('[Meta Pixel][Search] eventID=', eventId, {query});
    fbq(
      'track',
      'Search',
      {
        search_string: query,
        content_category: 'Search',
        fbp,
        fbc,
        external_id,
        fb_login_id,
      },
      {eventID: eventId},
    );
  }

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
      fb_login_id,
      country,
    },
    custom_data: {search_string: query},
  });
};

export const trackInitiateCheckout = async (cart, customerData = {}) => {
  const eventId = generateEventId();
  const variantIds = cart.items?.map((i) => parseGid(i.variantId)) || [];
  const contents = (cart.items || []).map((i) => ({
    id: parseGid(i.variantId),
    quantity: Number(i.quantity || 1),
    item_price: parseFloat(i.price || i?.cost?.amount || 0),
  }));
  const value =
    parseFloat(cart.cost?.totalAmount?.amount) ||
    contents.reduce((s, c) => s + c.item_price * c.quantity, 0);
  const currency = cart.cost?.totalAmount?.currencyCode || 'USD';
  const num_items = cart.items?.length || 0;
  const URL = window.location.href;

  const fbp = ensureFbp();
  const fbc = ensureFbc();
  const external_id = getExternalId(customerData);
  const country = getCountry(customerData);
  const fb_login_id = getFbLoginId();

  if (typeof fbq === 'function') {
    try {
      console.log('[Meta Pixel][InitiateCheckout] eventID=', eventId, {
        value,
        currency,
        num_items,
      });
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
          fb_login_id,
        },
        {eventID: eventId},
      );
    } catch {}
  }

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

export const trackAddPaymentInfo = async (order, customerData = {}) => {
  const eventId = generateEventId();
  const fbp = ensureFbp();
  const fbc = ensureFbc();
  const external_id = getExternalId(customerData);
  const country = getCountry(customerData);
  const fb_login_id = getFbLoginId();

  const currency = order.currency || 'USD';
  const value = order.total || 0;
  const contents = (order.items || []).map((i) => ({
    id: parseGid(i.variantId),
    quantity: Number(i.quantity || 1),
    item_price: parseFloat(i.price || 0),
  }));
  const content_ids = contents.map((c) => c.id);
  const URL = window.location.href;

  if (typeof fbq === 'function') {
    console.log('[Meta Pixel][AddPaymentInfo] eventID=', eventId, {
      value,
      currency,
    });
    fbq(
      'track',
      'AddPaymentInfo',
      {
        currency,
        value,
        fbp,
        fbc,
        external_id,
        fb_login_id,
      },
      {eventID: eventId},
    );
  }

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
