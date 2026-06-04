// googleAnalyticsEvents.js
/**
 * Utility function to extract the numeric ID from Shopify's global ID (gid).
 */
export const parseGid = (gid) => {
  if (!gid) return '';
  const parts = String(gid).split('/');
  return parts[parts.length - 1];
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

const getSelectedVariant = (product) => {
  return product?.selectedVariant || product?.variant || null;
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

const buildProductItem = (product, quantity = 1) => {
  const selectedVariant = getSelectedVariant(product);
  const itemId = parseGid(selectedVariant?.id);
  const safeQuantity = Math.max(toNumber(quantity, 1), 1);
  const price = getProductPrice(product);

  return {
    item_id: itemId,
    item_name: product?.title,
    item_variant: selectedVariant?.title,
    price,
    quantity: safeQuantity,
  };
};

const normalizeCartLines = (cart) => {
  if (Array.isArray(cart?.lines?.nodes)) return cart.lines.nodes;
  if (Array.isArray(cart?.lines)) return cart.lines;
  if (Array.isArray(cart?.items)) return cart.items;
  return [];
};

const buildCartItems = (cart) => {
  return normalizeCartLines(cart)
    .map((line) => {
      const variant = line?.merchandise || line?.variant || {};
      const quantity = Math.max(toNumber(line?.quantity, 1), 1);
      const total = toNumber(line?.cost?.totalAmount?.amount);
      const itemPrice = toNumber(
        firstNonEmpty(
          line?.cost?.amountPerQuantity?.amount,
          variant?.price?.amount,
          line?.price,
          quantity ? total / quantity : undefined,
        ),
      );
      const itemId = parseGid(
        variant?.id || line?.variantId || line?.merchandiseId,
      );

      if (!itemId) return null;

      return {
        item_id: itemId,
        item_name: variant?.product?.title,
        item_variant: variant?.title,
        price: itemPrice,
        quantity,
      };
    })
    .filter(Boolean);
};

/**
 * Helper function to generate a unique event ID.
 */
export const generateEventId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

/**
 * Tracks a ViewContent event for Google Analytics (GA4)
 */
export const trackViewContentGA = (product) => {
  const price = getProductPrice(product);
  const currency = getProductCurrency(product);
  const eventId = generateEventId();

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'view_item', {
      value: price,
      currency,
      items: [buildProductItem(product, 1)],
      event_id: eventId,
    });
  }
};

/**
 * Tracks an AddToCart event for GA4.
 */
export const trackAddToCartGA = (product) => {
  const quantity = Math.max(toNumber(product?.quantity, 1), 1);
  const price = getProductPrice(product);
  const currency = getProductCurrency(product);

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'add_to_cart', {
      value: price * quantity,
      currency,
      items: [buildProductItem(product, quantity)],
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
    const items = buildCartItems(cart);
    const value = toNumber(
      firstNonEmpty(
        cart?.cost?.totalAmount?.amount,
        cart?.cost?.subtotalAmount?.amount,
      ),
    );
    const currency = firstNonEmpty(
      cart?.cost?.totalAmount?.currencyCode,
      cart?.cost?.subtotalAmount?.currencyCode,
      'USD',
    );

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
