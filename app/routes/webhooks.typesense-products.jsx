// app/routes/webhooks.typesense-products.jsx
import {
  getTypesenseAdminClientFromEnv,
  TYPESENSE_PRODUCTS_COLLECTION,
} from '~/lib/typesense.server';

// Pick ONE of these variable names and set it in your env (Oxygen / Vercel)
function getWebhookSecret(env) {
  return (
    env.SHOPIFY_WEBHOOK_SECRET ||
    env.PRIVATE_SHOPIFY_WEBHOOK_SECRET ||
    env.SHOPIFY_API_SECRET
  );
}

// Helper: buffer → base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Verify Shopify webhook using Web Crypto (no Node 'crypto' import)
async function verifyShopifyWebhook(rawBody, hmacHeader, secret) {
  if (!hmacHeader || !secret) {
    console.error(
      '[Webhooks] Missing HMAC header or secret. hmacHeader=',
      !!hmacHeader,
      ' secret=',
      !!secret,
    );
    return false;
  }

  const encoder = new TextEncoder();

  // Import secret as an HMAC key
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );

  // Sign the body with HMAC-SHA256
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(rawBody),
  );

  const computedHmac = arrayBufferToBase64(signature);

  if (computedHmac !== hmacHeader) {
    console.error(
      '[Webhooks] HMAC mismatch. Expected from Shopify:',
      hmacHeader,
      ' Computed:',
      computedHmac,
    );
    return false;
  }

  return true;
}

// Map Shopify product JSON (Admin REST webhook payload) → Typesense document
function mapProductToTypesenseDoc(product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];

  const prices = variants
    .map((v) => Number(v.price))
    .filter((v) => Number.isFinite(v) && v >= 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;

  const skus = variants
    .map((v) => v.sku)
    .filter((sku) => typeof sku === 'string' && sku.trim().length > 0);

  const tags =
    typeof product.tags === 'string'
      ? product.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : Array.isArray(product.tags)
      ? product.tags
      : [];

  const firstImage = Array.isArray(product.images)
    ? product.images[0]
    : product.image || null;
  const imageUrl = firstImage?.src || null;

  const gid = `gid://shopify/Product/${product.id}`;

  return {
    id: gid,
    title: product.title || '',
    handle: product.handle || '',
    description: product.body_html || '',
    vendor: product.vendor || '',
    product_type: product.product_type || '',
    tags,
    sku: skus,
    price: minPrice,
    available: product.status === 'active',
    collections: [],
    image: imageUrl,
    url: product.handle ? `/products/${product.handle}` : '',
  };
}

export async function action({request, context}) {
  const topic = request.headers.get('X-Shopify-Topic') || '';
  const shopDomain = request.headers.get('X-Shopify-Shop-Domain') || '';
  const hmacHeader = request.headers.get('X-Shopify-Hmac-Sha256') || '';

  console.log('[Webhooks] Incoming webhook:', topic, 'from shop:', shopDomain);

  const secret = getWebhookSecret(context.env);
  const rawBody = await request.text();

  let isValid = false;
  try {
    isValid = await verifyShopifyWebhook(rawBody, hmacHeader, secret);
  } catch (err) {
    console.error('[Webhooks] Error during HMAC verification:', err);
    return new Response('Verification error', {status: 500});
  }

  if (!isValid) {
    console.error('[Webhooks] Invalid Shopify webhook signature. Rejecting.');
    return new Response('Invalid signature', {status: 401});
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error('[Webhooks] Invalid JSON in Shopify webhook:', error);
    return new Response('Bad request', {status: 400});
  }

  console.log('[Webhooks] Payload parsed OK. Topic:', topic, 'ID:', payload.id);

  const client = getTypesenseAdminClientFromEnv(context.env);
  const collection = client.collections(TYPESENSE_PRODUCTS_COLLECTION);

  try {
    if (topic === 'products/create' || topic === 'products/update') {
      const doc = mapProductToTypesenseDoc(payload);
      console.log(
        '[Webhooks] Upserting product into Typesense:',
        doc.id,
        doc.title,
      );
      await collection.documents().upsert(doc);
      console.log(
        '[Webhooks] Successfully upserted product in Typesense:',
        doc.id,
      );
    } else if (topic === 'products/delete') {
      const gid = `gid://shopify/Product/${payload.id}`;
      console.log('[Webhooks] Deleting product from Typesense:', gid);
      await collection.documents(gid).delete();
      console.log(
        '[Webhooks] Successfully deleted product from Typesense:',
        gid,
      );
    } else if (topic === 'orders/create') {
      console.log(
        '[Webhooks] orders/create received (no Typesense update):',
        payload.id,
      );
    } else {
      console.log('[Webhooks] Ignored webhook topic:', topic);
    }
  } catch (error) {
    console.error('[Webhooks] Error handling Typesense webhook:', error);
    return new Response('Webhook handling error', {status: 500});
  }

  console.log('[Webhooks] Completed OK for topic:', topic, 'ID:', payload.id);
  return new Response('OK', {status: 200});
}
