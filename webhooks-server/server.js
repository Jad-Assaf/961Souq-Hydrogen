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
const SHOPIFY_961SOUQ_SHOP_DOMAIN = process.env.SHOPIFY_961SOUQ_SHOP_DOMAIN;
const SHOPIFY_961SOUQ_ADMIN_API_TOKEN =
  process.env.SHOPIFY_961SOUQ_ADMIN_API_TOKEN;
const SHOPIFY_961SOUQ_ADMIN_API_VERSION =
  process.env.SHOPIFY_961SOUQ_ADMIN_API_VERSION || '2025-07';

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

if (!SHOPIFY_961SOUQ_SHOP_DOMAIN || !SHOPIFY_961SOUQ_ADMIN_API_TOKEN) {
  console.warn(
    '[Startup] SHOPIFY_961SOUQ_SHOP_DOMAIN or SHOPIFY_961SOUQ_ADMIN_API_TOKEN not set. Source enrichment will be skipped.',
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

function gidToNumericId(gid) {
  if (typeof gid !== 'string') return '';
  return gid.split('/').pop() || '';
}

function normalizeImageSrc(rawSrc) {
  if (typeof rawSrc !== 'string') return '';
  const [noQuery] = rawSrc.split('?');
  return noQuery
    .replace(/(_\d+x\d+)(?=\.[a-zA-Z]{2,5}$)/, '')
    .trim();
}

function buildVariantImageMapFromWebhook(product) {
  const images = Array.isArray(product?.images) ? product.images : [];
  const variants = Array.isArray(product?.variants) ? product.variants : [];

  const imageSrcById = new Map();
  for (const image of images) {
    const id = image?.id ?? image?.image_id;
    const src = normalizeImageSrc(image?.src);
    if (id && src) {
      imageSrcById.set(String(id), src);
    }
  }

  const map = {};
  for (const variant of variants) {
    const sku = variant?.sku;
    const imageId = variant?.image_id;
    if (!sku || !imageId) continue;
    const src = imageSrcById.get(String(imageId));
    if (src) map[sku] = src;
  }

  return map;
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

async function shopifyAdminGraphQL({
  shopDomain,
  adminToken,
  query,
  variables,
  apiVersion = MACARABIA_ADMIN_API_VERSION,
}) {
  const normalizedDomain = normalizeShopDomain(shopDomain);
  const res = await fetch(
    `https://${normalizedDomain}/admin/api/${apiVersion}/graphql.json`,
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

async function macarabiaAdminRest({path, method, body}) {
  const normalizedDomain = normalizeShopDomain(MACARABIA_SHOP_DOMAIN);
  const res = await fetch(
    `https://${normalizedDomain}/admin/api/${MACARABIA_ADMIN_API_VERSION}/${path}`,
    {
      method,
      headers: {
        'content-type': 'application/json',
        'x-shopify-access-token': MACARABIA_ADMIN_API_TOKEN,
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      data?.errors ||
      data?.error ||
      `Shopify REST API error (${res.status})`;
    throw new Error(
      typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2),
    );
  }

  return data;
}

function buildMacarabiaRestProductPayload(product, sourceDetails) {
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

  const seoTitle =
    product?.seo?.title ||
    product?.seo_title ||
    product?.metafields_global_title_tag ||
    sourceDetails?.seoTitle ||
    '';
  const seoDescription =
    product?.seo?.description ||
    product?.seo_description ||
    product?.metafields_global_description_tag ||
    sourceDetails?.seoDescription ||
    '';

  const variantImageMapFromWebhook = buildVariantImageMapFromWebhook(product);
  const variantImageMap = {
    ...variantImageMapFromWebhook,
    ...(sourceDetails?.variantImageMap || {}),
  };

  const productType =
    product.product_type || sourceDetails?.categoryFullName || '';

  const variantsPayload = variants.map((variant) => ({
    sku: variant.sku || undefined,
    price: variant.price != null ? String(variant.price) : undefined,
    compare_at_price:
      variant.compare_at_price != null
        ? String(variant.compare_at_price)
        : undefined,
    inventory_management: variant.inventory_management || undefined,
    inventory_policy: variant.inventory_policy || undefined,
    inventory_quantity:
      typeof variant.inventory_quantity === 'number'
        ? variant.inventory_quantity
        : undefined,
    weight: typeof variant.weight === 'number' ? variant.weight : undefined,
    weight_unit: variant.weight_unit || undefined,
    barcode: variant.barcode || undefined,
    title: variant.title || undefined,
    option1: variant.option1 || undefined,
    option2: variant.option2 || undefined,
    option3: variant.option3 || undefined,
  }));

  const imagesPayload = images
    .map((image) => ({
      src: image?.src,
      alt: image?.alt,
    }))
    .filter((image) => Boolean(image.src));

  const productPayload = {
    title: product.title || '',
    body_html: product.body_html || '',
    vendor: product.vendor || '',
    product_type: productType || '',
    tags,
    handle: product.handle || undefined,
    status: product.status || 'active',
    options: options.map((option) => ({
      name: option?.name,
      values: Array.isArray(option?.values) ? option.values : [],
    })),
    variants: variantsPayload,
    images: imagesPayload,
  };

  if (seoTitle) productPayload.metafields_global_title_tag = seoTitle;
  if (seoDescription)
    productPayload.metafields_global_description_tag = seoDescription;

  const inventoryCostsFromWebhook = variants
    .map((variant) => ({
      sku: variant?.sku,
      cost:
        variant?.cost ??
        variant?.cost_per_item ??
        variant?.cost_price ??
        null,
    }))
    .filter(
      (entry) =>
        typeof entry.sku === 'string' && entry.sku.trim() && entry.cost != null,
    );

  const inventoryCostsFromSource = Array.isArray(sourceDetails?.inventoryCosts)
    ? sourceDetails.inventoryCosts
    : [];

  return {
    productPayload,
    variantsPayload,
    imagesPayload,
    metafieldInputs,
    inventoryCosts:
      inventoryCostsFromWebhook.length > 0
        ? inventoryCostsFromWebhook
        : inventoryCostsFromSource,
    categoryId: sourceDetails?.categoryId || null,
    categoryFullName: sourceDetails?.categoryFullName || '',
    variantImageMap,
  };
}

async function fetchSourceProductDetails(productNumericId) {
  if (!SHOPIFY_961SOUQ_SHOP_DOMAIN || !SHOPIFY_961SOUQ_ADMIN_API_TOKEN) {
    return null;
  }
  if (!productNumericId) return null;

  const productGid = `gid://shopify/Product/${productNumericId}`;
  const query = `#graphql
    query SourceProductDetails($id: ID!) {
      product(id: $id) {
        id
        seo {
          title
          description
        }
        category {
          id
          fullName
        }
        images(first: 100) {
          nodes {
            id
            url
          }
        }
        variants(first: 100) {
          nodes {
            sku
            image {
              id
              url
            }
            inventoryItem {
              id
              unitCost {
                amount
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyAdminGraphQL({
    shopDomain: SHOPIFY_961SOUQ_SHOP_DOMAIN,
    adminToken: SHOPIFY_961SOUQ_ADMIN_API_TOKEN,
    apiVersion: SHOPIFY_961SOUQ_ADMIN_API_VERSION,
    query,
    variables: {id: productGid},
  });

  const product = data?.product;
  if (!product) return null;

  const sourceVariantImageMap = {};
  for (const variant of product?.variants?.nodes || []) {
    const sku = variant?.sku;
    const src = normalizeImageSrc(variant?.image?.url);
    if (sku && src) {
      sourceVariantImageMap[sku] = src;
    }
  }

  const inventoryCosts =
    product?.variants?.nodes
      ?.map((variant) => ({
        sku: variant?.sku,
        cost: variant?.inventoryItem?.unitCost?.amount ?? null,
      }))
      .filter(
        (entry) =>
          typeof entry.sku === 'string' &&
          entry.sku.trim() &&
          entry.cost != null,
      ) || [];

  return {
    seoTitle: product?.seo?.title || '',
    seoDescription: product?.seo?.description || '',
    categoryId: product?.category?.id || null,
    categoryFullName: product?.category?.fullName || '',
    inventoryCosts,
    variantImageMap: sourceVariantImageMap,
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

  let sourceDetails = null;
  if (SHOPIFY_961SOUQ_SHOP_DOMAIN && SHOPIFY_961SOUQ_ADMIN_API_TOKEN) {
    try {
      sourceDetails = await fetchSourceProductDetails(product?.id);
      if (sourceDetails) {
        console.log('[Source] Enriched product data for sync.');
      }
    } catch (error) {
      console.error('[Source] Enrichment failed:', error.message);
    }
  }

  const {
    productPayload,
    variantsPayload,
    imagesPayload,
    metafieldInputs,
    inventoryCosts,
    categoryId,
    categoryFullName,
    variantImageMap,
  } = buildMacarabiaRestProductPayload(product, sourceDetails);
  const existingId =
    (await findMacarabiaProductIdByHandle(handle)) ||
    (await findMacarabiaProductIdBySku(skus));

  if (existingId) {
    console.log('[Macarabia] Updating product:', existingId);
    const numericId = gidToNumericId(existingId);
    await macarabiaAdminRest({
      path: `products/${numericId}.json`,
      method: 'PUT',
      body: {
        product: {
          id: Number(numericId),
          ...productPayload,
          variants: undefined,
          images: undefined,
        },
      },
    });
    await syncMacarabiaVariants(numericId, variantsPayload);
    await syncMacarabiaImages(numericId, imagesPayload);
    await syncMacarabiaVariantImages(numericId, variantImageMap);
    await removeMacarabiaDefaultVariantIfNeeded(numericId);
    await syncMacarabiaMetafields(existingId, metafieldInputs);
    await syncMacarabiaCategory(existingId, categoryId, categoryFullName);
    await syncMacarabiaInventoryCosts(inventoryCosts);
    await syncMacarabiaInventoryQuantities(variantsPayload);
    console.log('[Macarabia] Updated product:', existingId);
    return;
  }

  console.log('[Macarabia] Creating product with handle:', handle);
  const created = await macarabiaAdminRest({
    path: 'products.json',
    method: 'POST',
    body: {product: productPayload},
  });
  const createdNumericId = created?.product?.id;
  const createdId = createdNumericId
    ? `gid://shopify/Product/${createdNumericId}`
    : null;
  await syncMacarabiaMetafields(createdId, metafieldInputs);
  await syncMacarabiaCategory(createdId, categoryId, categoryFullName);
  await syncMacarabiaInventoryCosts(inventoryCosts);
  await syncMacarabiaInventoryQuantities(variantsPayload);
  const createdNumericId = gidToNumericId(createdId);
  await syncMacarabiaVariantImages(createdNumericId, variantImageMap);
  await removeMacarabiaDefaultVariantIfNeeded(createdNumericId);
  await publishMacarabiaProductToAllChannels(createdId);
  console.log('[Macarabia] Created product:', createdId);
}

async function syncMacarabiaMetafields(productId, metafieldInputs) {
  if (!productId) return;
  if (!metafieldInputs.length) return;

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
      metafields: metafieldInputs.map((metafield) => ({
        ownerId: productId,
        ...metafield,
      })),
    },
  });

  const errors = data?.metafieldsSet?.userErrors || [];
  if (errors.length) {
    throw new Error(errors.map((e) => e.message).join('; '));
  }
  console.log('[Macarabia] Metafields synced:', metafieldInputs.length);
}

async function syncMacarabiaCategory(productId, categoryId, categoryFullName) {
  if (!productId || !categoryId) {
    if (!categoryId && categoryFullName) {
      console.log(
        '[Macarabia] Category ID missing; using product_type fallback.',
      );
    }
    return;
  }

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
    variables: {input: {id: productId, category: {id: categoryId}}},
  });
  const errors = data?.productUpdate?.userErrors || [];
  if (errors.length) {
    throw new Error(errors.map((e) => e.message).join('; '));
  }
  console.log('[Macarabia] Category synced:', categoryId);
}

async function removeMacarabiaDefaultVariantIfNeeded(productNumericId) {
  if (!productNumericId) return;
  const data = await macarabiaAdminRest({
    path: `products/${productNumericId}/variants.json`,
    method: 'GET',
  });
  const variants = Array.isArray(data?.variants) ? data.variants : [];
  if (variants.length <= 1) return;
  for (const variant of variants) {
    const title = variant?.title || '';
    const sku = variant?.sku || '';
    if (title === 'Default Title' && !sku) {
      try {
        await macarabiaAdminRest({
          path: `variants/${variant.id}.json`,
          method: 'DELETE',
        });
        console.log('[Macarabia] Removed Default Title variant:', variant.id);
      } catch (error) {
        console.error(
          '[Macarabia] Default Title removal failed:',
          error.message,
        );
      }
    }
  }
}

async function findMacarabiaVariantIdBySku(sku) {
  const query = `#graphql
    query VariantBySku($query: String!) {
      productVariants(first: 1, query: $query) {
        edges {
          node {
            id
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
  const variantGid = data?.productVariants?.edges?.[0]?.node?.id || '';
  return gidToNumericId(variantGid);
}

async function syncMacarabiaVariants(productNumericId, variantsPayload) {
  if (!Array.isArray(variantsPayload) || !variantsPayload.length) return;
  for (const variant of variantsPayload) {
    const sku = variant?.sku;
    if (!sku) continue;
    const variantId = await findMacarabiaVariantIdBySku(sku);
    try {
      if (variantId) {
        await macarabiaAdminRest({
          path: `variants/${variantId}.json`,
          method: 'PUT',
          body: {variant: {id: Number(variantId), ...variant}},
        });
        console.log('[Macarabia] Variant updated:', sku);
      } else {
        await macarabiaAdminRest({
          path: `products/${productNumericId}/variants.json`,
          method: 'POST',
          body: {variant},
        });
        console.log('[Macarabia] Variant created:', sku);
      }
    } catch (error) {
      console.error('[Macarabia] Variant sync failed:', sku, error.message);
    }
  }
}

async function syncMacarabiaImages(productNumericId, imagesPayload) {
  if (!Array.isArray(imagesPayload) || !imagesPayload.length) return;
  const existing = await macarabiaAdminRest({
    path: `products/${productNumericId}/images.json`,
    method: 'GET',
  });
  const existingSrcs =
    existing?.images?.map((image) => image?.src).filter(Boolean) || [];
  const existingSet = new Set(existingSrcs.map(normalizeImageSrc));

  for (const image of imagesPayload) {
    const normalized = normalizeImageSrc(image?.src);
    if (!normalized || existingSet.has(normalized)) continue;
    try {
      await macarabiaAdminRest({
        path: `products/${productNumericId}/images.json`,
        method: 'POST',
        body: {image},
      });
      existingSet.add(normalized);
      console.log('[Macarabia] Image added:', image.src);
    } catch (error) {
      console.error('[Macarabia] Image sync failed:', image.src, error.message);
    }
  }
}

async function syncMacarabiaVariantImages(productNumericId, variantImageMap) {
  if (!productNumericId) return;
  const entries = Object.entries(variantImageMap || {});
  if (!entries.length) return;

  const existingImages = await macarabiaAdminRest({
    path: `products/${productNumericId}/images.json`,
    method: 'GET',
  });
  const imageIdBySrc = new Map();
  for (const image of existingImages?.images || []) {
    const src = normalizeImageSrc(image?.src);
    if (src) imageIdBySrc.set(src, image?.id);
  }

  for (const [sku, src] of entries) {
    const normalized = normalizeImageSrc(src);
    const imageId = imageIdBySrc.get(normalized);
    if (!imageId) {
      console.warn('[Macarabia] Variant image not found for SKU:', sku);
      continue;
    }
    const variantId = await findMacarabiaVariantIdBySku(sku);
    if (!variantId) {
      console.warn('[Macarabia] Variant not found for image sync:', sku);
      continue;
    }
    try {
      await macarabiaAdminRest({
        path: `variants/${variantId}.json`,
        method: 'PUT',
        body: {variant: {id: Number(variantId), image_id: imageId}},
      });
      console.log('[Macarabia] Variant image synced:', sku);
    } catch (error) {
      console.error('[Macarabia] Variant image sync failed:', sku, error.message);
    }
  }
}

let macarabiaLocationId = null;

async function fetchMacarabiaLocationId() {
  if (macarabiaLocationId) return macarabiaLocationId;
  const data = await macarabiaAdminRest({
    path: 'locations.json',
    method: 'GET',
  });
  const locationId = data?.locations?.[0]?.id || null;
  macarabiaLocationId = locationId;
  console.log('[Macarabia] Using location:', locationId);
  return locationId;
}

async function syncMacarabiaInventoryQuantities(variantsPayload) {
  if (!Array.isArray(variantsPayload) || !variantsPayload.length) return;
  const locationId = await fetchMacarabiaLocationId();
  if (!locationId) return;

  for (const variant of variantsPayload) {
    if (typeof variant?.inventory_quantity !== 'number') continue;
    const sku = variant?.sku;
    if (!sku) continue;
    const inventoryItemId = await findMacarabiaInventoryItemIdBySku(sku);
    if (!inventoryItemId) {
      console.warn('[Macarabia] Inventory item not found for SKU:', sku);
      continue;
    }
    try {
      await macarabiaAdminRest({
        path: 'inventory_levels/set.json',
        method: 'POST',
        body: {
          location_id: Number(locationId),
          inventory_item_id: Number(inventoryItemId),
          available: variant.inventory_quantity,
        },
      });
      console.log('[Macarabia] Inventory updated for SKU:', sku);
    } catch (error) {
      console.error(
        '[Macarabia] Inventory update failed for SKU:',
        sku,
        error.message,
      );
    }
  }
}

async function syncMacarabiaInventoryCosts(inventoryCosts) {
  if (!Array.isArray(inventoryCosts) || !inventoryCosts.length) return;
  for (const entry of inventoryCosts) {
    const sku = entry?.sku;
    if (typeof sku !== 'string' || !sku.trim()) continue;
    const inventoryItemId = await findMacarabiaInventoryItemIdBySku(sku);
    if (!inventoryItemId) {
      console.warn('[Macarabia] Inventory item not found for SKU:', sku);
      continue;
    }
    try {
      await macarabiaAdminRest({
        path: `inventory_items/${inventoryItemId}.json`,
        method: 'PUT',
        body: {
          inventory_item: {
            id: Number(inventoryItemId),
            cost: String(entry.cost),
          },
        },
      });
      console.log('[Macarabia] Inventory cost updated for SKU:', sku);
    } catch (error) {
      console.error(
        '[Macarabia] Inventory cost update failed for SKU:',
        sku,
        error.message,
      );
    }
  }
}

async function findMacarabiaInventoryItemIdBySku(sku) {
  const query = `#graphql
    query InventoryItemBySku($query: String!) {
      productVariants(first: 1, query: $query) {
        edges {
          node {
            inventoryItem {
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
  const inventoryItemGid =
    data?.productVariants?.edges?.[0]?.node?.inventoryItem?.id || '';
  return gidToNumericId(inventoryItemGid);
}

let macarabiaPublicationIds = null;

async function fetchMacarabiaPublicationIds() {
  if (macarabiaPublicationIds) return macarabiaPublicationIds;
  const query = `#graphql
    query Publications {
      publications(first: 100) {
        nodes {
          id
          name
        }
      }
    }
  `;
  const data = await shopifyAdminGraphQL({
    shopDomain: MACARABIA_SHOP_DOMAIN,
    adminToken: MACARABIA_ADMIN_API_TOKEN,
    query,
  });
  macarabiaPublicationIds =
    data?.publications?.nodes?.map((node) => node.id).filter(Boolean) || [];
  console.log(
    '[Macarabia] Publications found:',
    macarabiaPublicationIds.length,
  );
  return macarabiaPublicationIds;
}

async function publishMacarabiaProductToAllChannels(productId) {
  if (!productId) return;
  const publicationIds = await fetchMacarabiaPublicationIds();
  if (!publicationIds.length) return;

  const mutation = `#graphql
    mutation Publish($id: ID!, $input: PublishablePublishInput!) {
      publishablePublish(id: $id, input: $input) {
        userErrors {
          field
          message
        }
      }
    }
  `;

  for (const publicationId of publicationIds) {
    const data = await shopifyAdminGraphQL({
      shopDomain: MACARABIA_SHOP_DOMAIN,
      adminToken: MACARABIA_ADMIN_API_TOKEN,
      query: mutation,
      variables: {
        id: productId,
        input: {publicationId},
      },
    });

    const errors = data?.publishablePublish?.userErrors || [];
    if (errors.length) {
      throw new Error(errors.map((e) => e.message).join('; '));
    }
  }
  console.log('[Macarabia] Published to all channels:', productId);
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
