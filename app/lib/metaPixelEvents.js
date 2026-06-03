// src/lib/metaPixelEvents.js

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

const META_CONTENT_TYPE = 'product';
const FBC_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

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
    if (result.errors) return null;
    return result.data.customer;
  } catch {
    return null;
  }
};

const generateEventId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 11)}`;
};

const parseGid = (gid) => {
  if (!gid) return '';
  return String(gid).split('/').filter(Boolean).pop() || '';
};

const readCookie = (name) => {
  if (typeof document === 'undefined') return '';

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`),
  );

  return match ? decodeURIComponent(match[1]) : '';
};

const getFbc = () => {
  const existingFbc = readCookie('_fbc');
  if (isFreshFbc(existingFbc)) return existingFbc;
  if (typeof window === 'undefined') return '';

  const fbclid = new URLSearchParams(window.location.search).get('fbclid');
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : '';
};

const getFbcTimestamp = (fbc) => {
  const timestamp = String(fbc || '').split('.')[2];
  const number = Number(timestamp);
  if (!Number.isFinite(number) || number <= 0) return 0;

  return number < 1000000000000 ? number * 1000 : number;
};

const isFreshFbc = (fbc) => {
  const value = String(fbc || '').trim();
  if (!value) return false;

  const timestamp = getFbcTimestamp(value);
  if (!timestamp) return false;

  return Date.now() - timestamp <= FBC_MAX_AGE_MS;
};

const getExternalId = (customerData = {}) => {
  return (
    firstNonEmpty(customerData.id, window.__customerData?.id) ||
    ''
  );
};

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (value == null) continue;
    const stringValue = String(value).trim();
    if (stringValue) return stringValue;
  }

  return '';
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const cleanObject = (value) => {
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
};

const getBrowserUserData = (customerData = {}) => {
  return cleanObject({
    fbp: readCookie('_fbp'),
    fbc: getFbc(),
    external_id: getExternalId(customerData),
    email: customerData.email || window.__customerData?.email,
    phone: customerData.phone || window.__customerData?.phone,
  });
};

const sendToServerCapi = (eventData) => {
  try {
    fetch('/facebookConversions', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(cleanObject(eventData)),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Tracking must never block storefront behavior.
  }
};

const getSelectedVariant = (product) => {
  return (
    product?.selectedVariant ||
    product?.selectedVariantForCart ||
    product?.variant ||
    null
  );
};

const getProductContentId = (product) => {
  return parseGid(getSelectedVariant(product)?.id);
};

const getProductPrice = (product) => {
  const selectedVariant = getSelectedVariant(product);
  return toNumber(
    firstNonEmpty(
      selectedVariant?.price?.amount,
      product?.priceRange?.minVariantPrice?.amount,
      product?.price?.amount,
    ),
  );
};

const getProductCurrency = (product) => {
  const selectedVariant = getSelectedVariant(product);
  return firstNonEmpty(
    selectedVariant?.price?.currencyCode,
    product?.priceRange?.minVariantPrice?.currencyCode,
    product?.price?.currencyCode,
    'USD',
  );
};

const buildProductCustomData = ({product, quantity = 1}) => {
  const contentId = getProductContentId(product);
  if (!contentId) return null;

  const safeQuantity = Math.max(toNumber(quantity, 1), 1);
  const itemPrice = getProductPrice(product);
  const value = itemPrice * safeQuantity;

  return cleanObject({
    value,
    currency: getProductCurrency(product),
    content_ids: [contentId],
    content_type: META_CONTENT_TYPE,
    contents: [
      {
        id: contentId,
        quantity: safeQuantity,
        item_price: itemPrice,
      },
    ],
    num_items: safeQuantity,
    content_name: product?.title,
    content_category: product?.productType,
  });
};

const normalizeCartLines = (cart) => {
  if (Array.isArray(cart?.lines?.nodes)) return cart.lines.nodes;
  if (Array.isArray(cart?.lines)) return cart.lines;
  if (Array.isArray(cart?.items)) return cart.items;
  return [];
};

const getLineVariantId = (line) => {
  return parseGid(
    line?.merchandise?.id ||
      line?.variantId ||
      line?.merchandiseId ||
      line?.variant?.id,
  );
};

const getLineQuantity = (line) => Math.max(toNumber(line?.quantity, 1), 1);

const getLineItemPrice = (line) => {
  const quantity = getLineQuantity(line);
  return toNumber(
    firstNonEmpty(
      line?.cost?.amountPerQuantity?.amount,
      line?.merchandise?.price?.amount,
      line?.price,
      quantity
        ? toNumber(line?.cost?.totalAmount?.amount) / quantity
        : undefined,
    ),
  );
};

const buildCartCustomData = (cart) => {
  const lines = normalizeCartLines(cart);
  const contents = lines
    .map((line) => {
      const id = getLineVariantId(line);
      if (!id) return null;

      return {
        id,
        quantity: getLineQuantity(line),
        item_price: getLineItemPrice(line),
      };
    })
    .filter(Boolean);

  const contentIds = contents.map((item) => item.id);
  const numItems =
    toNumber(cart?.totalQuantity) ||
    contents.reduce((total, item) => total + toNumber(item.quantity), 0);

  return cleanObject({
    value: toNumber(
      firstNonEmpty(
        cart?.cost?.totalAmount?.amount,
        cart?.cost?.subtotalAmount?.amount,
        cart?.total,
      ),
    ),
    currency: firstNonEmpty(
      cart?.cost?.totalAmount?.currencyCode,
      cart?.cost?.subtotalAmount?.currencyCode,
      cart?.currency,
      'USD',
    ),
    content_ids: contentIds,
    content_type: META_CONTENT_TYPE,
    contents,
    num_items: numItems,
  });
};

const trackMetaEvent = ({eventName, customData, customerData = {}}) => {
  if (typeof window === 'undefined' || !eventName || !customData) return '';

  const eventId = generateEventId();
  const eventSourceUrl = window.location.href;
  const userData = getBrowserUserData(customerData);
  const browserParams = cleanObject({
    event_source_url: eventSourceUrl,
    ...customData,
    fbp: userData.fbp,
    fbc: userData.fbc,
    external_id: userData.external_id,
  });

  try {
    if (typeof window.fbq === 'function') {
      window.fbq('track', eventName, browserParams, {eventID: eventId});
    }
  } catch {
    // noop
  }

  sendToServerCapi({
    event_name: eventName,
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: eventSourceUrl,
    user_data: userData,
    custom_data: customData,
  });

  return eventId;
};

export const trackViewContent = async (product, customerData = {}) => {
  if (typeof window === 'undefined' || !product?.id) return;

  const contentId = getProductContentId(product);
  if (!contentId) return;

  const viewKey = `${product.id}:${window.location.pathname}`;
  window.__metaViewContentTracked = window.__metaViewContentTracked || {};
  if (window.__metaViewContentTracked[viewKey]) return;
  window.__metaViewContentTracked[viewKey] = true;

  trackMetaEvent({
    eventName: 'ViewContent',
    customData: buildProductCustomData({product, quantity: 1}),
    customerData,
  });
};

export const trackAddToCart = async (
  product,
  customerData = {},
  options = {},
) => {
  const quantity = options.quantity || product?.quantity || 1;

  trackMetaEvent({
    eventName: 'AddToCart',
    customData: buildProductCustomData({product, quantity}),
    customerData,
  });
};

export const trackPurchase = async (order, customerData = {}) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  const contents = items
    .map((item) => {
      const id = parseGid(item.variantId || item.merchandiseId);
      if (!id) return null;

      return {
        id,
        quantity: Math.max(toNumber(item.quantity, 1), 1),
        item_price: toNumber(item.price),
      };
    })
    .filter(Boolean);

  trackMetaEvent({
    eventName: 'Purchase',
    customData: cleanObject({
      content_ids: contents.map((item) => item.id),
      content_type: META_CONTENT_TYPE,
      currency: order?.currency || 'USD',
      value: toNumber(order?.total),
      num_items: contents.reduce(
        (total, item) => total + toNumber(item.quantity),
        0,
      ),
      contents,
    }),
    customerData,
  });
};

export const trackSearch = async (query, customerData = {}) => {
  trackMetaEvent({
    eventName: 'Search',
    customData: cleanObject({
      search_string: query,
      content_category: 'Search',
    }),
    customerData,
  });
};

export const trackInitiateCheckout = async (cart, customerData = {}) => {
  trackMetaEvent({
    eventName: 'InitiateCheckout',
    customData: buildCartCustomData(cart),
    customerData: {
      ...customerData,
      email:
        customerData.email ||
        cart?.buyerIdentity?.email ||
        cart?.buyerIdentity?.customer?.email,
      phone: customerData.phone || cart?.buyerIdentity?.phone,
      id: customerData.id || cart?.buyerIdentity?.customer?.id,
    },
  });
};

export const trackAddPaymentInfo = async (order, customerData = {}) => {
  trackMetaEvent({
    eventName: 'AddPaymentInfo',
    customData: cleanObject({
      currency: order?.currency || 'USD',
      value: toNumber(order?.total),
    }),
    customerData,
  });
};
