// googleAnalyticsEvents.js
/**
 * Utility function to extract the numeric ID from Shopify's global ID (gid).
 */
export const parseGid = (gid) => {
  if (!gid) return '';
  const parts = gid.split('/');
  return parts[parts.length - 1];
};

/**
 * Helper function to generate a unique event ID.
 */
export const generateEventId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return (
    Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  );
};

/**
 * Tracks a ViewContent event for Google Analytics (GA4)
 */
export const trackViewContentGA = (product) => {
  const variantId = parseGid(product.selectedVariant?.id);
  const price = product.price?.amount || 0;
  const currency = product.price?.currencyCode || 'USD';
  const eventId = generateEventId();

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'view_item', {
      value: parseFloat(price),
      currency,
      items: [
        {
          item_id: variantId,
          price,
          quantity: 1,
          // Optionally include additional fields here
        },
      ],
      event_id: eventId,
    });
  }
};

/**
 * Tracks an AddToCart event for GA4.
 */
export const trackAddToCartGA = (product) => {
  const variantId = parseGid(product.selectedVariant?.id);
  const price = product.price?.amount || 0;
  const currency = product.price?.currencyCode || 'USD';

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'add_to_cart', {
      value: parseFloat(price),
      currency,
      items: [
        {
          item_id: variantId,
          price,
          quantity: 1,
        },
      ],
    });
  }
};

/**
 * Tracks a Purchase event for GA4.
 */
export const trackPurchaseGA = (order) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'purchase', {
      transaction_id: order.id,
      value: order.total,
      currency: 'USD',
      items: order.items.map((item) => ({
        item_id: parseGid(item.variantId),
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }
};

/**
 * Tracks a Search event for GA4.
 */
export const trackSearchGA = (query) => {
  const eventId = generateEventId();
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'search', {
      search_term: query,
      event_id: eventId,
    });
  }
};

/**
 * Tracks a BeginCheckout event for GA4.
 */
export const trackInitiateCheckoutGA = (cart) => {
  if (typeof window.gtag === 'function') {
    const items = cart.items?.map((item) => ({
      item_id: parseGid(item.variantId),
      price: item.price,
      quantity: item.quantity,
    })) || [];
    const value = parseFloat(cart.cost?.totalAmount?.amount) || 0;
    const currency = cart.cost?.totalAmount?.currencyCode || 'USD';

    window.gtag('event', 'begin_checkout', {
      value,
      currency,
      items,
    });
  }
};

/**
 * Tracks an AddPaymentInfo event for GA4.
 */
export const trackAddPaymentInfoGA = (order) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'add_payment_info', {
      value: order.total,
      currency: 'USD',
    });
  }
};
