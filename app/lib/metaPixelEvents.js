// --- Added Helpers for Customer Data ---

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

/**
 * Fetch customer data from Shopify using the Storefront API.
 * @param {string} customerAccessToken - The access token for the logged-in customer.
 * @returns {Promise<Object|null>} - The customer data or null if not found.
 */
export const fetchCustomerData = async (customerAccessToken) => {
  try {
    const response = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': process.env.PUBLIC_STOREFRONT_API_TOKEN,
      },
      body: JSON.stringify({
        query: CUSTOMER_QUERY,
        variables: { customerAccessToken },
      }),
    });
    const result = await response.json();
    if (result.errors) {
      return null;
    }
    return result.data.customer;
  } catch (error) {
    return null;
  }
};

/**
 * Helper function to get the external_id.
 * It checks the provided customerData first, then a global variable.
 * If no customer id is available, it generates a persistent anonymous id using localStorage.
 * @param {Object} customerData
 * @returns {string} The external id.
 */
const getExternalId = (customerData = {}) => {
  if (customerData && customerData.id) return customerData.id;
  if (window.__customerData && window.__customerData.id) return window.__customerData.id;
  let anonId = localStorage.getItem('anonExternalId');
  if (!anonId) {
    anonId = generateEventId();
    localStorage.setItem('anonExternalId', anonId);
  }
  return anonId;
};

// --- Existing Tracking Code ---

/**
 * Utility function to extract the numeric ID from Shopify's global ID (gid).
 * Example: "gid://shopify/Product/123456789" => "123456789"
 * @param {string} gid - The global ID from Shopify.
 * @returns {string} - The extracted numeric ID.
 */
const parseGid = (gid) => {
  if (!gid) return '';
  const parts = gid.split('/');
  return parts[parts.length - 1];
};

/**
 * Helper function to generate unique event IDs.
 * Uses crypto.randomUUID if available, otherwise falls back to a custom method.
 * @returns {string} - A unique event ID.
 */
const generateEventId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  } else {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
};

/**
 * Sends event data to our /facebookConversions endpoint (server-side).
 * @param {Object} eventData - The event data payload.
 */
const sendToServerCapi = async (eventData) => {
  fetch('/facebookConversions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  })
    .then((res) => res.json())
    .catch((error) => {});
};

/**
 * Tracks a ViewContent event when a product is viewed.
 * @param {Object} product - The product details.
 * @param {Object} customerData - (Optional) Customer data with fields such as id, email, fb_login_id, etc.
 */
export const trackViewContent = (product, customerData = {}) => {
  if (window.__viewContentTracked) return;
  window.__viewContentTracked = true;

  const variantId = parseGid(product.selectedVariant?.id);
  const price = product.selectedVariant?.price?.amount || product.price?.amount || 0;
  const currency = product.price?.currencyCode || 'USD';
  const eventId = generateEventId();

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  };
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');

  const { email = '', phone = '', fb_login_id = '' } = customerData;
  const external_id = getExternalId(customerData);

  const URL = window.location.href;
  const content_name = product.title || '';
  const content_category = product.productType || '';

  if (typeof fbq === 'function') {
    fbq(
      'track',
      'ViewContent',
      {
        URL,
        "Event id": eventId,
        value: parseFloat(price),
        currency: currency,
        content_ids: [variantId],
        content_type: 'product_variant',
        content_name,
        content_category,
        fbp,
        fbc,
        external_id,
        email,
        phone,
        fb_login_id,
      },
      { eventID: eventId }
    );
  }

  sendToServerCapi({
    action_source: 'website',
    event_name: 'ViewContent',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
    },
    custom_data: {
      URL,
      "Event id": eventId,
      value: parseFloat(price),
      currency: currency,
      content_ids: [variantId],
      content_type: 'product_variant',
      content_name,
      content_category,
    },
  });
};

/**
 * Tracks an AddToCart event when a product is added to the cart.
 * @param {Object} product - The product details.
 * @param {Object} customerData - (Optional) Customer data.
 */
export const trackAddToCart = (product, customerData = {}) => {
  const variantId = parseGid(product.selectedVariant?.id);
  const price = product.selectedVariant?.price?.amount || product.price?.amount || 0;
  const currency = product.price?.currencyCode || 'USD';
  const eventId = generateEventId();

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  };
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');
  const { email = '', phone = '', fb_login_id = '' } = customerData;
  const external_id = getExternalId(customerData);

  const URL = window.location.href;
  const content_name = product.title || '';
  const content_category = product.productType || '';
  const num_items = product.quantity || 1;

  if (typeof fbq === 'function') {
    fbq(
      'track',
      'AddToCart',
      {
        URL,
        "Event id": eventId,
        value: parseFloat(price),
        currency: currency,
        content_ids: [variantId],
        content_type: 'product_variant',
        content_name,
        content_category,
        num_items,
        fbp,
        fbc,
        external_id,
        email,
        phone,
        fb_login_id,
      },
      { eventID: eventId }
    );
  }

  sendToServerCapi({
    action_source: 'website',
    event_name: 'AddToCart',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
    },
    custom_data: {
      URL,
      "Event id": eventId,
      value: parseFloat(price),
      currency: currency,
      content_ids: [variantId],
      content_type: 'product_variant',
      content_name,
      content_category,
      num_items,
    },
  });
};

/**
 * Tracks a Purchase event after a successful purchase.
 * @param {Object} order - The order details.
 * @param {Object} customerData - (Optional) Customer data.
 */
export const trackPurchase = (order, customerData = {}) => {
  const eventId = generateEventId();

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  };
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');
  const { email = '', phone = '', fb_login_id = '' } = customerData;
  const external_id = getExternalId(customerData);

  if (typeof fbq === 'function') {
    fbq('track', 'Purchase', {
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
    }, { eventID: eventId });
  }

  sendToServerCapi({
    action_source: 'website',
    event_name: 'Purchase',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_user_agent: navigator.userAgent,
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
 * Tracks a Search event when a user performs a search.
 * @param {string} query - The search query.
 * @param {Object} customerData - (Optional) Customer data.
 */
export const trackSearch = (query, customerData = {}) => {
  const eventId = generateEventId();

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  };
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');
  const { email = '', fb_login_id = '' } = customerData;
  const external_id = getExternalId(customerData);

  if (typeof fbq === 'function') {
    fbq('track', 'Search', {
      search_string: query,
      content_category: 'Search',
      fbp,
      fbc,
      external_id,
      email,
      fb_login_id,
    }, { eventID: eventId });
  }

  sendToServerCapi({
    action_source: 'website',
    event_name: 'Search',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
    },
    custom_data: {
      search_string: query,
    },
  });
};

/**
 * Tracks an InitiateCheckout event when a user starts the checkout process.
 * @param {Object} cart - The cart details.
 * @param {Object} customerData - (Optional) Customer data.
 */
export const trackInitiateCheckout = (cart, customerData = {}) => {
  const eventId = generateEventId();
  const variantIds = cart.items?.map((item) => parseGid(item.variantId)) || [];
  const value = parseFloat(cart.cost?.totalAmount?.amount) || 0;
  const currency = cart.cost?.totalAmount?.currencyCode || 'USD';
  const num_items = cart.items?.length || 0;
  const URL = window.location.href;

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  };
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');
  const { email = '', fb_login_id = '' } = customerData;
  const external_id = getExternalId(customerData);

  if (typeof fbq === 'function') {
    try {
      fbq(
        'track',
        'InitiateCheckout',
        {
          URL,
          "Event id": eventId,
          value,
          currency,
          content_ids: variantIds,
          content_type: 'product_variant',
          num_items,
          fbp,
          fbc,
          external_id,
          email,
          fb_login_id,
        },
        { eventID: eventId }
      );
    } catch (error) {}
  }

  sendToServerCapi({
    action_source: 'website',
    event_name: 'InitiateCheckout',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
    },
    custom_data: {
      URL,
      "Event id": eventId,
      value,
      currency,
      content_ids: variantIds,
      content_type: 'product_variant',
      num_items,
    },
  });
};

/**
 * Tracks an AddPaymentInfo event when a user adds payment information.
 * @param {Object} order - The order details.
 * @param {Object} customerData - (Optional) Customer data.
 */
export const trackAddPaymentInfo = (order, customerData = {}) => {
  const eventId = generateEventId();

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  };
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');
  const { email = '', fb_login_id = '' } = customerData;
  const external_id = getExternalId(customerData);

  if (typeof fbq === 'function') {
    fbq('track', 'AddPaymentInfo', {
      currency: 'USD',
      value: order.total,
      fbp,
      fbc,
      external_id,
      email,
      fb_login_id,
    }, { eventID: eventId });
  }

  sendToServerCapi({
    action_source: 'website',
    event_name: 'AddPaymentInfo',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
    },
    custom_data: {
      currency: 'USD',
      value: order.total,
    },
  });
};
