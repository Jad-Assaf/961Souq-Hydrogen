// webhooks-server/server.js
import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Typesense from 'typesense';

dotenv.config();

// ----- ENV -----
const PORT = process.env.PORT || 4000;
const TYPESENSE_HOST = process.env.TYPESENSE_HOST;
const TYPESENSE_PORT = Number(process.env.TYPESENSE_PORT || 443);
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'https';
const TYPESENSE_ADMIN_API_KEY = process.env.TYPESENSE_ADMIN_API_KEY;
const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

if (!TYPESENSE_HOST || !TYPESENSE_ADMIN_API_KEY) {
  console.error(
    '[Startup] Missing TYPESENSE_HOST or TYPESENSE_ADMIN_API_KEY in env',
  );
  process.exit(1);
}

if (!SHOPIFY_WEBHOOK_SECRET) {
  console.warn(
    '[Startup] WARNING: SHOPIFY_WEBHOOK_SECRET not set, HMAC checks will still run but will always fail.',
  );
}

// ----- Typesense client -----
const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: TYPESENSE_HOST,
      port: TYPESENSE_PORT,
      protocol: TYPESENSE_PROTOCOL,
    },
  ],
  apiKey: TYPESENSE_ADMIN_API_KEY,
  connectionTimeoutSeconds: 10,
});

const TYPESENSE_PRODUCTS_COLLECTION = 'products';

// ----- Helpers -----
// Verify Shopify HMAC
function verifyShopifyHmac(rawBody, hmacHeader) {
  if (!SHOPIFY_WEBHOOK_SECRET) {
    console.warn(
      '[Webhooks] No SHOPIFY_WEBHOOK_SECRET configured. Skipping HMAC (INSECURE for prod).',
    );
    return true;
  }

  if (!hmacHeader) {
    console.warn(
      '[Webhooks] Missing X-Shopify-Hmac-Sha256 header. Skipping HMAC (INSECURE for prod).',
    );
    return true;
  }

  const digest = crypto
    .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('base64');

  let valid = false;
  try {
    valid = crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(hmacHeader),
    );
  } catch (e) {
    console.error('[Webhooks] Error in timingSafeEqual:', e);
    return false;
  }

  if (!valid) {
    console.error(
      '[Webhooks] HMAC mismatch.\n  Shopify:',
      hmacHeader,
      '\n  Computed:',
      digest,
    );
  }

  return valid;
}

// Map Shopify Admin product JSON → Typesense doc (matches your existing schema)
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

  // IMPORTANT: use GID format to match your import script
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
    collections: [], // Admin payload doesn’t include collections by default
    image: imageUrl,
    url: product.handle ? `/products/${product.handle}` : '',
    status: typeof product.status === 'string' ? product.status : 'active',
  };
}

// ----- Express app -----
const app = express();

// Health check
app.get('/', (req, res) => {
  res.status(200).send('Typesense webhook server is running.');
});

// GET for quick manual check
app.get('/webhooks/typesense-products', (req, res) => {
  console.log('[Webhooks] GET /webhooks/typesense-products');
  res
    .status(200)
    .send(
      'Typesense products webhook endpoint. Use POST JSON webhooks from Shopify.',
    );
});

// IMPORTANT: use express.raw for this route so we have the raw body for HMAC
app.post(
  '/webhooks/typesense-products',
  express.raw({type: 'application/json'}),
  async (req, res) => {
    const topic = req.get('X-Shopify-Topic') || '';
    const shopDomain = req.get('X-Shopify-Shop-Domain') || '';
    const hmacHeader = req.get('X-Shopify-Hmac-Sha256') || '';

    const rawBody = req.body.toString('utf8');

    console.log(
      '[Webhooks] Incoming webhook:',
      topic || '(no topic)',
      'from shop:',
      shopDomain || '(no shop)',
      'body length:',
      rawBody.length,
    );

    // HMAC
    const ok = verifyShopifyHmac(rawBody, hmacHeader);
    if (!ok) {
      return res.status(401).send('Invalid signature');
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      console.error('[Webhooks] Invalid JSON payload:', err);
      return res.status(400).send('Invalid JSON');
    }

    console.log(
      '[Webhooks] Payload OK. Topic:',
      topic,
      'Product ID:',
      payload.id,
    );

    const collection = typesenseClient.collections(
      TYPESENSE_PRODUCTS_COLLECTION,
    );

    try {
      if (topic === 'products/create' || topic === 'products/update') {
        const doc = mapProductToTypesenseDoc(payload);
        console.log(
          '[Webhooks] Upserting product in Typesense:',
          doc.id,
          '-',
          doc.title,
        );
        await collection.documents().upsert(doc);
        console.log('[Webhooks] Upsert success:', doc.id);
      } else if (topic === 'products/delete') {
        const gid = `gid://shopify/Product/${payload.id}`;
        console.log('[Webhooks] Deleting product from Typesense:', gid);
        await collection.documents(gid).delete();
        console.log('[Webhooks] Delete success:', gid);
      } else {
        console.log('[Webhooks] Ignored topic:', topic);
      }
    } catch (err) {
      console.error('[Webhooks] Error talking to Typesense:', err);
      return res.status(500).send('Typesense error');
    }

    res.status(200).send('OK');
  },
);

// Start server
app.listen(PORT, () => {
  console.log(
    `[Startup] Typesense webhook server listening on port ${PORT}. Path: /webhooks/typesense-products`,
  );
});
