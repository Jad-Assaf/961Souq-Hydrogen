/* eslint-disable no-console */
import Typesense from 'typesense';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 1. Setup Typesense client (admin key, same as you used to create the collection)
 */
const typesenseHost = process.env.TYPESENSE_HOST;
const typesensePort = Number(process.env.TYPESENSE_PORT || '443');
const typesenseProtocol = process.env.TYPESENSE_PROTOCOL || 'https';
const typesenseApiKey = process.env.TYPESENSE_ADMIN_API_KEY;

if (!typesenseHost || !typesenseApiKey) {
  console.error(
    'Missing TYPESENSE_HOST or TYPESENSE_ADMIN_API_KEY in .env for import script',
  );
  process.exit(1);
}

const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: typesenseHost,
      port: typesensePort,
      protocol: typesenseProtocol,
    },
  ],
  apiKey: typesenseApiKey,
  connectionTimeoutSeconds: 5,
});

const TYPESENSE_PRODUCTS_COLLECTION = 'products';

/**
 * 2. Setup Shopify Storefront API config
 */
const ADMIN_API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || '2025-07';
const sfDomain = process.env.SHOPIFY_STOREFRONT_DOMAIN;
const sfToken = process.env.SHOPIFY_STOREFRONT_TOKEN;
const sfVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION || '2025-01';
const adminToken = process.env.ADMIN_API_TOKEN;
const adminShopDomain = normalizeShopDomain(process.env.PUBLIC_STORE_DOMAIN);

if (!sfDomain || !sfToken) {
  console.error(
    'Missing SHOPIFY_STOREFRONT_DOMAIN or SHOPIFY_STOREFRONT_TOKEN in .env',
  );
  process.exit(1);
}

if (!adminShopDomain || !adminToken) {
  console.error(
    'Missing PUBLIC_STORE_DOMAIN or ADMIN_API_TOKEN in .env for Admin API status fetch',
  );
  process.exit(1);
}

const STOREFRONT_ENDPOINT = `https://${sfDomain}/api/${sfVersion}/graphql.json`;
const ADMIN_ENDPOINT = `https://${adminShopDomain}/admin/api/${ADMIN_API_VERSION}/graphql.json`;

function normalizeShopDomain(raw) {
  if (!raw) return '';
  return raw.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/**
 * 3. GraphQL query to fetch products in pages of 250
 */
const PRODUCTS_QUERY = `
  query ProductsForTypesense($cursor: String) {
    products(first: 250, after: $cursor) {
      edges {
        cursor
        node {
          id
          title
          handle
          description(truncateAt: 5000)
          vendor
          productType
          tags
          availableForSale
          collections(first: 10) {
            edges {
              node {
                handle
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          featuredImage {
            url
            altText
          }
          onlineStoreUrl
          variants(first: 100) {
            edges {
              node {
                sku
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

const ADMIN_PRODUCTS_STATUS_QUERY = `
  query ProductStatuses($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        status
      }
    }
  }
`;

/**
 * Helper to call the Storefront API
 */
async function fetchProductsPage(cursor) {
  const res = await fetch(STOREFRONT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': sfToken,
    },
    body: JSON.stringify({
      query: PRODUCTS_QUERY,
      variables: {cursor},
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Storefront API error: ${res.status} ${res.statusText} - ${text}`,
    );
  }

  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
    throw new Error('GraphQL errors from Storefront API');
  }

  const edges = json.data.products.edges || [];
  const pageInfo = json.data.products.pageInfo;

  return {
    edges,
    hasNextPage: pageInfo?.hasNextPage ?? false,
  };
}

async function fetchAdminStatuses(ids) {
  if (!ids.length) return {};

  const res = await fetch(ADMIN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken,
    },
    body: JSON.stringify({
      query: ADMIN_PRODUCTS_STATUS_QUERY,
      variables: {ids},
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const text = json ? JSON.stringify(json) : '(no response body)';
    throw new Error(
      `Admin API error: ${res.status} ${res.statusText} - ${text}`,
    );
  }

  if (json?.errors?.length) {
    throw new Error(json.errors[0].message || 'Admin API errors');
  }

  const nodes = json?.data?.nodes || [];
  const statusById = {};

  for (const node of nodes) {
    if (node?.id && node?.status) {
      statusById[node.id] = node.status;
    }
  }

  return statusById;
}

/**
 * Map Shopify product → Typesense document structure according to our schema.
 */
function mapProductToTypesenseDoc(product, statusById) {
  const priceAmount =
    product.priceRange?.minVariantPrice?.amount != null
      ? parseFloat(product.priceRange.minVariantPrice.amount)
      : 0;

  const collections =
    product.collections?.edges?.map((edge) => edge.node.handle) || [];

  // collect all non-empty variant SKUs
  const skus =
    product.variants?.edges
      ?.map((edge) => edge.node?.sku)
      .filter((sku) => typeof sku === 'string' && sku.trim().length > 0) || [];

  // normalize URL: remove "www." if present
  let url = product.onlineStoreUrl || `/products/${product.handle}`;
  if (typeof url === 'string') {
    // this turns https://www.961souq.com/... into https://961souq.com/...
    url = url.replace('://www.', '://');
  }

  const rawStatus = statusById?.[product.id];
  const normalizedStatus =
    typeof rawStatus === 'string' ? rawStatus.toLowerCase() : 'active';

  return {
    id: product.id, // GID is fine as a string ID (must match what you use in webhooks)
    title: product.title || '',
    handle: product.handle || '',
    description: product.description || '',
    vendor: product.vendor || '',
    product_type: product.productType || '',
    tags: product.tags || [],
    price: isNaN(priceAmount) ? 0 : priceAmount,
    available: Boolean(product.availableForSale),
    status: normalizedStatus,
    collections,
    sku: skus,
    image: product.featuredImage?.url || '',
    url,
  };
}

/**
 * 4. Main import flow: page through all products and upsert into Typesense.
 */
async function main() {
  console.log('Starting Shopify → Typesense products import...');
  let cursor = null;
  let page = 0;
  let totalImported = 0;

  while (true) {
    page += 1;
    console.log(`Fetching page ${page} from Storefront API...`);

    const {edges, hasNextPage} = await fetchProductsPage(cursor);
    if (edges.length === 0) {
      console.log('No more products in this page.');
      break;
    }

    const products = edges.map((e) => e.node);
    const productIds = products.map((product) => product.id).filter(Boolean);
    const statusById = await fetchAdminStatuses(productIds);
    const docs = products.map((product) =>
      mapProductToTypesenseDoc(product, statusById),
    );

    console.log(
      `Importing ${docs.length} products into Typesense (page ${page})...`,
    );

    const importResult = await typesenseClient
      .collections(TYPESENSE_PRODUCTS_COLLECTION)
      .documents()
      .import(docs, {action: 'upsert'});

    console.log(
      'Typesense import result (truncated):',
      String(importResult).slice(0, 200),
    );

    totalImported += docs.length;

    if (!hasNextPage) {
      break;
    }

    cursor = edges[edges.length - 1].cursor;
  }

  console.log(`Done. Total products imported: ${totalImported}`);
}

main().catch((err) => {
  console.error('Fatal error in import script:', err);
  process.exit(1);
});
