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
    // Fallback to a simple unique ID generator
    return (
      Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
    );
  }
};

/**
 * Tracks a ViewContent event when a product is viewed.
 * @param {Object} product - The product details.
 */
export const trackViewContent = (product) => {
  const variantId = parseGid(product.selectedVariant?.id); // Extract Variant ID
  const price = product.price?.amount || 0;
  const currency = product.price?.currencyCode || 'USD';
  const eventId = generateEventId();

  if (typeof fbq === 'function') {
    fbq('track', 'ViewContent', {
      value: parseFloat(price),
      currency: currency,
      content_ids: [variantId], // Use Variant ID directly
      content_type: 'product_variant',
      event_id: eventId,
    });
  }
};

/**
 * Tracks an AddToCart event when a product is added to the cart.
 * @param {Object} product - The product details.
 */
export const trackAddToCart = (product) => {
  const variantId = parseGid(product.selectedVariant?.id); // Extract Variant ID
  const price = product.price?.amount || 0;
  const currency = product.price?.currencyCode || 'USD';

  if (typeof fbq === 'function') {
    fbq('track', 'AddToCart', {
      value: parseFloat(price),
      currency: currency,
      content_ids: [variantId], // Use Variant ID directly
      content_type: 'product_variant',
    });
  }
};

/**
 * Tracks a Purchase event after a successful purchase.
 * @param {Object} order - The order details.
 */
export const trackPurchase = (order) => {
  if (typeof fbq === 'function') {
    fbq('track', 'Purchase', {
      content_ids: order.items.map((item) => parseGid(item.variantId)), // Use Variant ID directly
      content_type: 'product_variant',
      currency: 'USD',
      value: order.total,
      num_items: order.items.length,
      contents: order.items.map((item) => ({
        id: parseGid(item.variantId), // Use Variant ID directly
        quantity: item.quantity,
        item_price: item.price,
      })),
    });
  }
};

/**
 * Tracks a Search event when a user performs a search.
 * @param {string} query - The search query.
 */
export const trackSearch = (query) => {
  const eventId = generateEventId();

  if (typeof fbq === 'function') {
    fbq('track', 'Search', {
      search_string: query,
      content_category: 'Search',
      event_id: eventId,
    });
  }
};

/**
 * Tracks an InitiateCheckout event when a user starts the checkout process.
 * @param {Object} cart - The cart details.
 */
export const trackInitiateCheckout = (cart) => {
  if (typeof fbq === 'function') {
    try {
      const variantIds = cart.items?.map((item) => parseGid(item.variantId)) || []; // Use Variant IDs directly
      const value = parseFloat(cart.cost?.totalAmount?.amount) || 0;
      const currency = cart.cost?.totalAmount?.currencyCode || 'USD';
      const numItems = cart.items?.length || 0;

      fbq('track', 'InitiateCheckout', {
        content_ids: variantIds, // Use Variant IDs directly
        content_type: 'product_variant',
        value: value,
        currency: currency,
        num_items: numItems,
      });
    } catch (error) {
      console.error('Error tracking InitiateCheckout:', error);
    }
  }
};

/**
 * Tracks an AddPaymentInfo event when a user adds payment information.
 * @param {Object} order - The order details.
 */
export const trackAddPaymentInfo = (order) => {
  if (typeof fbq === 'function') {
    fbq('track', 'AddPaymentInfo', {
      currency: 'USD',
      value: order.total,
    });
  }
};
