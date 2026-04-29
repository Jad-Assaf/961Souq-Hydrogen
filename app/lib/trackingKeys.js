export const SHOPIFY_CART_TOKEN_ATTRIBUTE_KEY = 'shopify-cart-token';

export const CHECKOUT_TRACKING_ATTRIBUTE_KEYS = [
  'country',
  'fbp',
  'host',
  'locale',
  'sh',
  'sw',
  'ttp',
  'vid',
  '_kx',
  'epik',
  'fbc',
  'fbclid',
  'gbraid',
  'gclid',
  'msclkid',
  'rdt_cid',
  'ScCid',
  'ttclid',
  'twclid',
  'wbraid',
  'utm_id',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'source',
];

export const NOTE_TRACKING_KEYS = [
  'source',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
];

export const CHECKOUT_URL_TRACKING_KEYS = [
  ...CHECKOUT_TRACKING_ATTRIBUTE_KEYS,
];

export const ATTRIBUTION_COOKIE_KEY = 'storefront_attribution';
export const VISITOR_ID_COOKIE_KEY = 'storefront_vid';
