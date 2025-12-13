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
const sfDomain = process.env.SHOPIFY_STOREFRONT_DOMAIN;
const sfToken = process.env.SHOPIFY_STOREFRONT_TOKEN;
const sfVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION || '2025-01';

if (!sfDomain || !sfToken) {
  console.error(
    'Missing SHOPIFY_STOREFRONT_DOMAIN or SHOPIFY_STOREFRONT_TOKEN in .env',
  );
  process.exit(1);
}

const STOREFRONT_ENDPOINT = `https://${sfDomain}/api/${sfVersion}/graphql.json`;

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

/**
 * Map Shopify product → Typesense document structure according to our schema.
 */
function mapProductToTypesenseDoc(product) {
  const priceAmount =
    product.priceRange?.minVariantPrice?.amount != null
      ? parseFloat(product.priceRange.minVariantPrice.amount)
      : 0;

  const collections =
    product.collections?.edges?.map((edge) => edge.node.handle) || [];

  // NEW: collect all non-empty variant SKUs
  const skus =
    product.variants?.edges
      ?.map((edge) => edge.node?.sku)
      .filter((sku) => typeof sku === 'string' && sku.trim().length > 0) || [];

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
    collections,
    sku: skus, // NEW: sku field as string[]
    image: product.featuredImage?.url || '',
    url: product.onlineStoreUrl || `/products/${product.handle}`,
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
    const docs = products.map(mapProductToTypesenseDoc);

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
