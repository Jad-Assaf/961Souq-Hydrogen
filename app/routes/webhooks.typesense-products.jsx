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
  if (!hmacHeader || !secret) return false;

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

  // Compare the computed HMAC with Shopify header
  return computedHmac === hmacHeader;
}

// Map Shopify product JSON (Admin REST webhook payload) → Typesense document
function mapProductToTypesenseDoc(product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];

  // Collect variant prices (if you want min price from variants)
  const prices = variants
    .map((v) => Number(v.price))
    .filter((v) => Number.isFinite(v) && v >= 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;

  // Collect variant SKUs
  const skus = variants
    .map((v) => v.sku)
    .filter((sku) => typeof sku === 'string' && sku.trim().length > 0);

  // Tags in Admin REST webhook come as comma-separated string
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

  // IMPORTANT: make id format match your import script (Storefront API GID)
  // Storefront product.id is "gid://shopify/Product/123456789"
  // Admin webhook product.id is numeric (123456789)
  const gid = `gid://shopify/Product/${product.id}`;

  return {
    id: gid,
    title: product.title || '',
    handle: product.handle || '',
    description: product.body_html || '',
    vendor: product.vendor || '',
    product_type: product.product_type || '',
    tags,
    sku: skus, // new sku field (string[])
    price: minPrice,
    available: product.status === 'active',
    collections: [], // cannot get collections from this webhook; keep empty or handle separately
    image: imageUrl,
    url: product.handle ? `/products/${product.handle}` : '',
  };
}

export async function action({request, context}) {
  const topic = request.headers.get('X-Shopify-Topic') || '';
  const shopDomain = request.headers.get('X-Shopify-Shop-Domain') || '';
  const hmacHeader = request.headers.get('X-Shopify-Hmac-Sha256') || '';

  const secret = getWebhookSecret(context.env);
  const rawBody = await request.text();

  // Verify HMAC
  const isValid = await verifyShopifyWebhook(rawBody, hmacHeader, secret);
  if (!isValid) {
    console.error('Invalid Shopify webhook signature');
    return new Response('Invalid signature', {status: 401});
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error('Invalid JSON in Shopify webhook', error);
    return new Response('Bad request', {status: 400});
  }

  const client = getTypesenseAdminClientFromEnv(context.env);
  const collection = client.collections(TYPESENSE_PRODUCTS_COLLECTION);

  try {
    if (topic === 'products/create' || topic === 'products/update') {
      const doc = mapProductToTypesenseDoc(payload);
      await collection.documents().upsert(doc);
      console.log(
        `[Typesense] Upserted product ${doc.id} from ${topic} (${shopDomain})`,
      );
    } else if (topic === 'products/delete') {
      // Admin product delete webhook: payload.id is numeric
      const gid = `gid://shopify/Product/${payload.id}`;
      await collection.documents(gid).delete();
      console.log(
        `[Typesense] Deleted product ${gid} from ${topic} (${shopDomain})`,
      );
    } else if (topic === 'orders/create') {
      // You mentioned you created an orders webhook – we just log it for now.
      console.log(
        `[Typesense] Received orders/create webhook from ${shopDomain}, no Typesense update.`,
      );
    } else {
      console.log(`[Typesense] Ignored webhook topic: ${topic}`);
    }
  } catch (error) {
    console.error('Error handling Typesense webhook:', error);
    return new Response('Webhook handling error', {status: 500});
  }

  return new Response('OK', {status: 200});
}
