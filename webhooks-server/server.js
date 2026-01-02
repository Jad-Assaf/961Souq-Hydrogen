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
const MACARABIA_SHOP_DOMAIN = process.env.MACARABIA_SHOP_DOMAIN;
const MACARABIA_ADMIN_API_TOKEN = process.env.MACARABIA_ADMIN_API_TOKEN;
const MACARABIA_ADMIN_API_VERSION =
  process.env.MACARABIA_ADMIN_API_VERSION || '2025-07';

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

if (!MACARABIA_SHOP_DOMAIN || !MACARABIA_ADMIN_API_TOKEN) {
  console.warn(
    '[Startup] MACARABIA_SHOP_DOMAIN or MACARABIA_ADMIN_API_TOKEN not set. Product sync will be skipped.',
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
function normalizeShopDomain(raw) {
  if (!raw) return '';
  return raw.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

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

async function shopifyAdminGraphQL({shopDomain, adminToken, query, variables}) {
  const normalizedDomain = normalizeShopDomain(shopDomain);
  const res = await fetch(
    `https://${normalizedDomain}/admin/api/${MACARABIA_ADMIN_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-shopify-access-token': adminToken,
      },
      body: JSON.stringify({query, variables}),
    },
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      data?.errors?.[0]?.message ||
      data?.error ||
      `Shopify Admin API error (${res.status})`;
    throw new Error(msg);
  }

  if (data?.errors?.length) {
    throw new Error(data.errors[0].message || 'Shopify Admin API error');
  }

  return data.data;
}

function normalizeStatus(status) {
  const raw = typeof status === 'string' ? status.trim().toUpperCase() : '';
  if (raw === 'ACTIVE' || raw === 'ARCHIVED' || raw === 'DRAFT') return raw;
  return 'ACTIVE';
}

function buildMacarabiaProductInput(product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const images = Array.isArray(product.images) ? product.images : [];
  const options = Array.isArray(product.options) ? product.options : [];
  const metafields = Array.isArray(product.metafields)
    ? product.metafields
    : [];

  const tags =
    typeof product.tags === 'string'
      ? product.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : Array.isArray(product.tags)
      ? product.tags
      : [];

  const optionNames = options
    .map((option) => option?.name)
    .filter((name) => typeof name === 'string' && name.trim().length > 0);

  const metafieldInputs = metafields
    .map((metafield) => ({
      namespace: metafield?.namespace,
      key: metafield?.key,
      type: metafield?.type,
      value: metafield?.value,
    }))
    .filter(
      (metafield) =>
        typeof metafield.namespace === 'string' &&
        typeof metafield.key === 'string' &&
        typeof metafield.type === 'string' &&
        metafield.value != null,
    );

  return {
    productInput: {
      title: product.title || '',
      descriptionHtml: product.body_html || '',
      vendor: product.vendor || '',
      productType: product.product_type || '',
      tags,
      handle: product.handle || undefined,
      status: normalizeStatus(product.status),
    },
    meta: {
      optionNames,
      metafieldInputs,
      variants,
      images,
    },
  };
}

async function findMacarabiaProductIdByHandle(handle) {
  if (!handle) return null;
  const query = `#graphql
    query ProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        id
      }
    }
  `;
  const data = await shopifyAdminGraphQL({
    shopDomain: MACARABIA_SHOP_DOMAIN,
    adminToken: MACARABIA_ADMIN_API_TOKEN,
    query,
    variables: {handle},
  });
  return data?.productByHandle?.id || null;
}

async function findMacarabiaProductIdBySku(skus) {
  const usableSkus = Array.isArray(skus)
    ? skus.filter((sku) => typeof sku === 'string' && sku.trim())
    : [];
  for (const sku of usableSkus) {
    const query = `#graphql
      query ProductBySku($query: String!) {
        productVariants(first: 1, query: $query) {
          edges {
            node {
              id
              product {
                id
              }
            }
          }
        }
      }
    `;
    const data = await shopifyAdminGraphQL({
      shopDomain: MACARABIA_SHOP_DOMAIN,
      adminToken: MACARABIA_ADMIN_API_TOKEN,
      query,
      variables: {query: `sku:${sku}`},
    });
    const productId =
      data?.productVariants?.edges?.[0]?.node?.product?.id || null;
    if (productId) return productId;
  }
  return null;
}

async function syncProductToMacarabia(product, topic) {
  if (!MACARABIA_SHOP_DOMAIN || !MACARABIA_ADMIN_API_TOKEN) {
    console.warn('[Macarabia] Missing env, skipping sync.');
    return;
  }

  const handle = product?.handle || '';
  const skus = Array.isArray(product?.variants)
    ? product.variants.map((variant) => variant?.sku).filter(Boolean)
    : [];
  console.log('[Macarabia] Sync start:', {
    topic,
    handle,
    skusCount: skus.length,
  });

  if (topic === 'products/delete') {
    const deleteId =
      (await findMacarabiaProductIdByHandle(handle)) ||
      (await findMacarabiaProductIdBySku(skus));
    if (!deleteId) {
      console.log('[Macarabia] No matching product to delete.');
      return;
    }
    console.log('[Macarabia] Deleting product:', deleteId);

    const mutation = `#graphql
      mutation ProductDelete($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors {
            field
            message
          }
        }
      }
    `;
    const data = await shopifyAdminGraphQL({
      shopDomain: MACARABIA_SHOP_DOMAIN,
      adminToken: MACARABIA_ADMIN_API_TOKEN,
      query: mutation,
      variables: {input: {id: deleteId}},
    });
    const errors = data?.productDelete?.userErrors || [];
    if (errors.length) {
      throw new Error(errors.map((e) => e.message).join('; '));
    }
    console.log('[Macarabia] Deleted product:', deleteId);
    return;
  }

  const {productInput, meta} = buildMacarabiaProductInput(product);
  const existingId =
    (await findMacarabiaProductIdByHandle(handle)) ||
    (await findMacarabiaProductIdBySku(skus));

  if (existingId) {
    console.log('[Macarabia] Updating product:', existingId);
    const mutation = `#graphql
      mutation ProductUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    const data = await shopifyAdminGraphQL({
      shopDomain: MACARABIA_SHOP_DOMAIN,
      adminToken: MACARABIA_ADMIN_API_TOKEN,
      query: mutation,
      variables: {input: {id: existingId, ...productInput}},
    });
    const errors = data?.productUpdate?.userErrors || [];
    if (errors.length) {
      throw new Error(errors.map((e) => e.message).join('; '));
    }
    await syncMacarabiaMetafields(existingId, meta);
    console.log('[Macarabia] Updated product:', existingId);
    return;
  }

  console.log('[Macarabia] Creating product with handle:', handle);
  const mutation = `#graphql
    mutation ProductCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const data = await shopifyAdminGraphQL({
    shopDomain: MACARABIA_SHOP_DOMAIN,
    adminToken: MACARABIA_ADMIN_API_TOKEN,
    query: mutation,
    variables: {input: productInput},
  });
  const errors = data?.productCreate?.userErrors || [];
  if (errors.length) {
    throw new Error(errors.map((e) => e.message).join('; '));
  }
  const createdId = data?.productCreate?.product?.id;
  await syncMacarabiaMetafields(createdId, meta);
  console.log('[Macarabia] Created product:', createdId);
}

async function syncMacarabiaMetafields(productId, meta) {
  if (!productId) return;
  const metafields = meta?.metafieldInputs || [];
  if (!metafields.length) return;

  const mutation = `#graphql
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyAdminGraphQL({
    shopDomain: MACARABIA_SHOP_DOMAIN,
    adminToken: MACARABIA_ADMIN_API_TOKEN,
    query: mutation,
    variables: {
      metafields: metafields.map((metafield) => ({
        ownerId: productId,
        ...metafield,
      })),
    },
  });

  const errors = data?.metafieldsSet?.userErrors || [];
  if (errors.length) {
    throw new Error(errors.map((e) => e.message).join('; '));
  }
  console.log('[Macarabia] Metafields synced:', metafields.length);
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
    status: typeof product.status === 'string' ? product.status : 'active',
    collections: [], // Admin payload doesn’t include collections by default
    image: imageUrl,
    url: product.handle ? `/products/${product.handle}` : '',
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
        try {
          await syncProductToMacarabia(payload, topic);
        } catch (syncErr) {
          console.error('[Macarabia] Sync error:', syncErr.message);
        }
      } else if (topic === 'products/delete') {
        const gid = `gid://shopify/Product/${payload.id}`;
        console.log('[Webhooks] Deleting product from Typesense:', gid);
        await collection.documents(gid).delete();
        console.log('[Webhooks] Delete success:', gid);
        try {
          await syncProductToMacarabia(payload, topic);
        } catch (syncErr) {
          console.error('[Macarabia] Sync error:', syncErr.message);
        }
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
