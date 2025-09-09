// metaPixelEvents.js

// Keep IP helper (used by Purchase ONLY; others will not call it)
export const getClientIP = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching client IP:', error);
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

// ✅ Only return a valid 2-letter country code; never language codes like "en"
const getCountry = (customerData = {}) => {
  try {
    const c = customerData.id ? customerData : window.__customerData || {};
    const addr =
      c.defaultAddress ||
      c.address ||
      c.shippingAddress ||
      c.billingAddress ||
      {};

    const codeFromAddr =
      addr.countryCode || addr.country_code || addr.countryCodeV2;
    if (codeFromAddr && /^[A-Za-z]{2}$/.test(String(codeFromAddr))) {
      return String(codeFromAddr).toLowerCase();
    }
    if (addr.country && /^[A-Za-z]{2}$/.test(String(addr.country))) {
      return String(addr.country).toLowerCase();
    }

    const htmlLang = document.documentElement?.lang || '';
    if (/-|_/.test(htmlLang)) {
      const part = htmlLang.split(/-|_/)[1];
      if (part && /^[A-Za-z]{2}$/.test(part)) return part.toLowerCase();
    }
    const navLang =
      navigator.language ||
      (Array.isArray(navigator.languages) && navigator.languages[0]) ||
      '';
    if (/-|_/.test(navLang)) {
      const part = navLang.split(/-|_/)[1];
      if (part && /^[A-Za-z]{2}$/.test(part)) return part.toLowerCase();
    }
  } catch {}
  return '';
};

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

// --- Customer lookup (unchanged) ---
const CUSTOMER_QUERY = `
  query getCustomer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      email
      firstName
      lastName
      phone
    }
  }
`;

export const fetchCustomerData = async (customerAccessToken) => {
  try {
    const response = await fetch(
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2024-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token':
            process.env.PUBLIC_STOREFRONT_API_TOKEN,
        },
        body: JSON.stringify({
          query: CUSTOMER_QUERY,
          variables: {customerAccessToken},
        }),
      },
    );
    const result = await response.json();
    if (result.errors) {
      return null;
    }
    return result.data.customer;
  } catch (error) {
    return null;
  }
};

// ---------------- Events ----------------

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
        email,
        phone,
        fb_login_id,
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
      email,
      phone,
      fb_login_id,
      country, // ✅ CAPI country
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
  const {email = '', phone = '', fb_login_id = ''} = customerData;
  const external_id = getExternalId(customerData);
  const country = getCountry(customerData);

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
        email,
        phone,
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
      email,
      phone,
      fb_login_id,
      country, // ✅ CAPI country
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

// ❗️Purchase left exactly as-is per your earlier instruction
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

export const trackSearch = async (query, customerData = {}) => {
  const eventId = generateEventId();
  const fbp = ensureFbp();
  const fbc = ensureFbc();

  const {email = '', phone = '', fb_login_id = ''} = customerData;
  const external_id = getExternalId(customerData);
  const country = getCountry(customerData);
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
        email,
        phone,
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
      email,
      phone,
      fb_login_id,
      country, // ✅ CAPI country
    },
    custom_data: {
      search_string: query,
    },
  });
};

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
          email,
          phone,
          fb_login_id,
        },
        {eventID: eventId},
      );
    } catch (error) {}
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
      email,
      phone,
      fb_login_id,
      country, // ✅ CAPI country
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
        email,
        phone,
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
      email,
      phone,
      fb_login_id,
      country, // ✅ CAPI country
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
