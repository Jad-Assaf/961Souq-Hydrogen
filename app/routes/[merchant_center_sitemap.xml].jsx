import {flattenConnection} from '@shopify/hydrogen';

const MERCHANT_CENTER_SETTINGS = {
  title: '961Souq',
  description: 'Product feed for Google Merchant Center',
  countryCode: 'LB',
  defaultBrand: '961Souq',
  itemsPerFeed: 3000,
  queryPageSize: 250,
};

/**
 * The main loader for the Merchant Center feed route.
 * @param {import('@shopify/remix-oxygen').LoaderFunctionArgs} args
 */
export async function loader({request, context: {storefront}}) {
  const url = new URL(request.url);
  let baseUrl = url.origin;

  // Remove "www." from the base URL if it exists
  baseUrl = baseUrl.replace(/\/\/www\./, '//');

  const page = parsePositiveInt(url.searchParams.get('page')) || 1;
  const startIndex = (page - 1) * MERCHANT_CENTER_SETTINGS.itemsPerFeed;

  // Fetch products for the requested feed page:
  const products = await fetchResourcePage({
    storefront,
    query: PRODUCTS_QUERY,
    field: 'products',
    startIndex,
    limit: MERCHANT_CENTER_SETTINGS.itemsPerFeed,
  });

  // Generate the Merchant Center feed (RSS)
  const feedXml = generateMerchantCenterFeed({products, baseUrl});

  const headers = new Headers({
    'Content-Type': 'application/xml',
    // Adjust caching as desired
    'Cache-Control': `max-age=${60 * 60}`, // 1 hour
  });

  const wantsGzip = url.searchParams.get('gzip') === '1';
  if (wantsGzip) {
    const gzippedBody = gzipEncode(feedXml);
    if (gzippedBody) {
      headers.set('Content-Encoding', 'gzip');
      return new Response(gzippedBody, {headers});
    }
  }

  return new Response(feedXml, {headers});
}

/**
 * Fetch one page of resources (offset + limit) by walking cursors.
 */
async function fetchResourcePage({
  storefront,
  query,
  field,
  startIndex,
  limit,
}) {
  const pageSize = MERCHANT_CENTER_SETTINGS.queryPageSize;
  const endIndex = startIndex + limit;
  let collected = [];
  let nextPageCursor = null;
  let seen = 0;

  do {
    const response = await storefront.query(query, {
      variables: {
        first: pageSize,
        after: nextPageCursor,
      },
      cache: storefront.CacheLong(),
    });

    const connection = response?.[field];
    if (!connection) break;

    const nodes = flattenConnection(connection);
    const nextSeen = seen + nodes.length;

    if (nextSeen > startIndex && collected.length < limit) {
      const sliceStart = Math.max(0, startIndex - seen);
      collected = collected.concat(nodes.slice(sliceStart));
    }

    seen = nextSeen;
    nextPageCursor = connection.pageInfo.hasNextPage
      ? connection.pageInfo.endCursor
      : null;
  } while (nextPageCursor && seen < endIndex && collected.length < limit);

  return collected.slice(0, limit);
}

/**
 * Generates the RSS feed for Google Merchant Center.
 * We create one <item> per variant, including all images in the product.
 */
function generateMerchantCenterFeed({products, baseUrl}) {
  // Flatten into a single list of items (product-variant pairs)
  const allItems = products.flatMap((product) => {
    if (!product?.variants?.nodes?.length) return [];
    return product.variants.nodes.map((variant) => ({
      product,
      variant,
    }));
  });

  return `<?xml version="1.0"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xmlEncode(MERCHANT_CENTER_SETTINGS.title)}</title>
    <link>${baseUrl}</link>
    <description>${xmlEncode(
      MERCHANT_CENTER_SETTINGS.description,
    )}</description>
    ${allItems
      .map(({product, variant}) =>
        renderProductVariantItem(product, variant, baseUrl),
      )
      .join('')}
  </channel>
</rss>`;
}

/**
 * Render a single <item> entry for each product-variant pair.
 */
function renderProductVariantItem(product, variant, baseUrl) {
  // Parse numeric IDs or just use the GraphQL GIDs
  const productId = parseGid(product.id); // e.g. 'gid://shopify/Product/12345' -> '12345'
  const variantId = parseGid(variant.id); // e.g. 'gid://shopify/ProductVariant/67890' -> '67890'
  const merchantCenterId = `shopify_${MERCHANT_CENTER_SETTINGS.countryCode}_${productId}_${variantId}`;
  const itemGroupId = `shopify_${MERCHANT_CENTER_SETTINGS.countryCode}_${productId}`;

  // Price from the variant
  const price = variant?.priceV2?.amount || '0.00';
  const currencyCode = variant?.priceV2?.currencyCode || 'USD';

  // Brand fallback (if your store uses 'vendor', use that; otherwise hardcode or fetch from Metafields)
  const brand = product.vendor || MERCHANT_CENTER_SETTINGS.defaultBrand;

  // Images: first one is <g:image_link>, additional are <g:additional_image_link>
  const allImages = product?.images?.nodes || [];
  const firstImageUrl = allImages[0]?.url ? xmlEncode(allImages[0].url) : '';
  const additionalImageTags = allImages
    .slice(1)
    .map((img) => {
      const url = xmlEncode(img.url);
      return `<g:additional_image_link>${url}</g:additional_image_link>`;
    })
    .join('');

  // Remove <img> tags from the product description if they exist
  const cleanDescription = stripImgTags(product.description || '');

  // COMBINED TITLE MODIFICATION: If the variant has a distinct title, append it.
  let combinedTitle = product.title;
  if (variant.title && variant.title !== product.title) {
    combinedTitle += ` - ${variant.title}`;
  }

  return `
    <item>
      <g:id>${xmlEncode(merchantCenterId)}</g:id>
      <g:item_group_id>${xmlEncode(itemGroupId)}</g:item_group_id>
      <g:title>${xmlEncode(combinedTitle)}</g:title>
      <g:description>${xmlEncode(cleanDescription)}</g:description>
      <g:link>${baseUrl}/products/${xmlEncode(
    product.handle,
  )}?variant=${xmlEncode(variantId)}</g:link>
      ${firstImageUrl ? `<g:image_link>${firstImageUrl}</g:image_link>` : ''}
      ${additionalImageTags}
      <g:condition>new</g:condition>
      <g:availability>${
        variant?.availableForSale ? 'in stock' : 'out of stock'
      }</g:availability>
      <g:price>${price} ${currencyCode}</g:price>
      <g:brand>${xmlEncode(brand)}</g:brand>
    </item>
  `;
}

/**
 * Extract the numeric part from the Shopify global ID, or just return the full ID if preferred.
 */
function parseGid(gid) {
  // e.g. 'gid://shopify/Product/1234567890'
  return gid?.split('/').pop();
}

/**
 * Simple XML encoding to avoid issues with special characters.
 */
function xmlEncode(string) {
  return String(string || '').replace(
    /[&<>'"]/g,
    (char) => `&#${char.charCodeAt(0)};`,
  );
}

/**
 * Ensure a positive integer from a query string.
 */
function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
}

/**
 * Gzip-encode text using the Web CompressionStream API.
 */
function gzipEncode(text) {
  if (typeof CompressionStream === 'undefined') return null;
  return new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
}

/**
 * Removes any <img> elements from a given HTML string.
 * @param {string} html - The HTML string to process.
 * @returns {string} - The HTML string without any <img> tags.
 */
function stripImgTags(html) {
  return html.replace(/<img\b[^>]*>/gi, '');
}

/**
 * A GraphQL query that fetches:
 *  - The product `id` and `handle`
 *  - `vendor` (optional brand field)
 *  - `description`
 *  - Up to 20 images
 *  - All variants (here, we request up to 100, but can paginate if you have more)
 */
const PRODUCTS_QUERY = `#graphql
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after, query: "published_status:'online_store:visible'") {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        title
        description
        vendor
        updatedAt
        images(first: 20) {
          nodes {
            url
            altText
          }
        }
        variants(first: 100) {
          nodes {
            id
            title
            availableForSale
            priceV2 {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;
