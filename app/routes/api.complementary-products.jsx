import {json} from '@shopify/remix-oxygen';
import {
  productMatchesComplementaryRules,
  resolveComplementarySearchPlan,
  sortComplementaryProducts,
} from '~/lib/complementaryProducts';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 20;
const MAX_FETCH_PER_REQUEST = 100;
const MAX_PRODUCTS_PER_BUCKET_ROUND = 5;

function shouldShowComplementaryProducts(product) {
  const tags = Array.isArray(product?.tags) ? product.tags : [];

  return tags.some((tag) => {
    const normalizedTag = String(tag || '').trim().toLowerCase();
    return normalizedTag === 'mobile phones' || normalizedTag.includes('laptop');
  });
}

function normalizeTag(tag) {
  return String(tag || '')
    .trim()
    .toLowerCase();
}

function getProductText(product) {
  return [
    product?.title,
    product?.productType,
    product?.vendor,
    ...(product?.tags || []),
  ]
    .map((value) => String(value || '').toLowerCase())
    .join(' ');
}

function getSourceComplementaryMode(product) {
  const text = getProductText(product);
  const tags = (product?.tags || []).map(normalizeTag);

  if (tags.some((tag) => tag === 'mobile phones')) return 'mobile';
  if (tags.some((tag) => tag.includes('gaming laptop'))) {
    return 'gaming-laptop';
  }
  if (tags.some((tag) => tag.includes('laptop'))) return 'laptop';
  if (text.includes('gaming laptop')) return 'gaming-laptop';
  if (text.includes('laptop')) return 'laptop';

  return 'other';
}

function hasTag(product, matcher) {
  return (product?.tags || []).map(normalizeTag).some(matcher);
}

function getMobileBucket(product) {
  const text = getProductText(product);

  if (hasTag(product, (tag) => tag.includes('covers'))) return 'covers';
  if (hasTag(product, (tag) => tag.includes('charging cable'))) {
    return 'charging-cables';
  }
  if (
    hasTag(product, (tag) => tag.includes('adapter')) ||
    text.includes('adapter')
  ) {
    return 'adapters';
  }
  if (
    text.includes('charging cable') ||
    text.includes('lightning cable') ||
    text.includes('usb-c cable') ||
    text.includes('usb c cable')
  ) {
    return 'charging-cables';
  }
  if (hasTag(product, (tag) => tag === 'mobile accessories')) {
    return 'mobile-accessories';
  }

  return null;
}

function getLaptopBucket(product, isGamingLaptop) {
  const text = getProductText(product);

  if (text.includes('backpack')) return 'backpacks';
  if (!isGamingLaptop && (text.includes('sleeve') || text.includes('bag'))) {
    return 'sleeves';
  }
  if (isGamingLaptop && text.includes('cooler')) return 'laptop-cooler';
  if (
    text.includes('hub') ||
    text.includes('adapter') ||
    text.includes('adaptor')
  ) {
    return 'hubs-adapters';
  }
  if (text.includes('mousepad') || text.includes('mouse pad')) {
    return 'mousepads';
  }
  if (text.includes('keyboard')) {
    if (!isGamingLaptop || text.includes('gaming')) return 'keyboards';
    return null;
  }
  if (text.includes('mouse')) {
    if (!isGamingLaptop || text.includes('gaming')) return 'mouse';
    return null;
  }

  return null;
}

function getBucketOrder(mode) {
  if (mode === 'mobile') {
    return ['covers', 'charging-cables', 'adapters', 'mobile-accessories'];
  }

  if (mode === 'gaming-laptop') {
    return [
      'mouse',
      'keyboards',
      'mousepads',
      'hubs-adapters',
      'backpacks',
      'laptop-cooler',
    ];
  }

  if (mode === 'laptop') {
    return [
      'backpacks',
      'sleeves',
      'mouse',
      'keyboards',
      'mousepads',
      'hubs-adapters',
    ];
  }

  return [];
}

function getComplementaryBucket(product, mode) {
  if (mode === 'mobile') return getMobileBucket(product);
  if (mode === 'gaming-laptop') return getLaptopBucket(product, true);
  if (mode === 'laptop') return getLaptopBucket(product, false);
  return null;
}

function arrangeProductsByBuckets(products, sourceProduct, limit) {
  const mode = getSourceComplementaryMode(sourceProduct);
  const bucketOrder = getBucketOrder(mode);
  if (!bucketOrder.length) return products.slice(0, limit);

  const buckets = new Map(bucketOrder.map((bucket) => [bucket, []]));

  for (const product of products) {
    const bucket = getComplementaryBucket(product, mode);
    if (!bucket || !buckets.has(bucket)) continue;
    buckets.get(bucket).push(product);
  }

  const arrangedProducts = [];
  let offset = 0;

  while (arrangedProducts.length < limit) {
    let addedInRound = 0;

    for (const bucket of bucketOrder) {
      const productsInBucket = buckets.get(bucket) || [];
      const batch = productsInBucket.slice(
        offset,
        offset + MAX_PRODUCTS_PER_BUCKET_ROUND,
      );

      for (const product of batch) {
        arrangedProducts.push(product);
        addedInRound += 1;
        if (arrangedProducts.length >= limit) break;
      }

      if (arrangedProducts.length >= limit) break;
    }

    if (!addedInRound) break;
    offset += MAX_PRODUCTS_PER_BUCKET_ROUND;
  }

  return arrangedProducts.length ? arrangedProducts : products.slice(0, limit);
}

export async function loader({request, context}) {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle') || '';
  const cursor = url.searchParams.get('cursor') || null;
  const initialQueryIndex = Math.max(
    0,
    Number(url.searchParams.get('queryIndex') || 0) || 0,
  );
  const requestedLimit = Number(url.searchParams.get('limit') || DEFAULT_LIMIT);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, requestedLimit || DEFAULT_LIMIT),
  );

  if (!handle) {
    return json({error: 'Missing handle'}, {status: 400});
  }

  const {product} = await context.storefront.query(PRODUCT_TAGS_QUERY, {
    variables: {handle},
  });

  if (!product) {
    return json({error: 'Product not found'}, {status: 404});
  }

  if (!shouldShowComplementaryProducts(product)) {
    console.info('[complementary][api] skipped-by-tag-gate', {
      handle,
      title: product.title,
      tags: product.tags,
    });

    return json({products: [], pageInfo: null, fetchedCount: 0});
  }

  const complementarySearchPlan = await resolveComplementarySearchPlan(
    product,
    context,
  );
  const complementaryQueries = complementarySearchPlan.queries;
  console.info('[complementary][api] source', {
    handle,
    cursor,
    initialQueryIndex,
    limit,
    title: product.title,
    tags: product.tags,
    productType: product.productType,
    planSource: complementarySearchPlan.source,
    category: complementarySearchPlan.category,
    mustInclude: complementarySearchPlan.mustInclude,
    avoid: complementarySearchPlan.avoid,
    queries: complementaryQueries,
  });

  if (!complementaryQueries.length || initialQueryIndex >= complementaryQueries.length) {
    console.info('[complementary][api] skipped-empty-query', {
      handle,
      title: product.title,
    });
    return json({products: [], pageInfo: null});
  }

  let nextCursor = cursor;
  let pageInfo = null;
  let queryIndex = initialQueryIndex;
  let fetchedCount = 0;
  const collectedProducts = [];
  const fallbackProducts = [];

  while (
    queryIndex < complementaryQueries.length &&
    fetchedCount < MAX_FETCH_PER_REQUEST &&
    collectedProducts.length < limit
  ) {
    const query = complementaryQueries[queryIndex];
    const {products} = await context.storefront.query(
      COMPLEMENTARY_PRODUCTS_BY_TAG_QUERY,
      {
        variables: {
          query,
          first: limit,
          after: nextCursor,
        },
      },
    );

    const nodes = products?.nodes || [];
    const storefrontPageInfo = products?.pageInfo || null;
    const hasNextPage = Boolean(storefrontPageInfo?.hasNextPage);
    fetchedCount += nodes.length;
    nextCursor = hasNextPage ? storefrontPageInfo?.endCursor || null : null;
    pageInfo = {
      ...(storefrontPageInfo || {}),
      endCursor: nextCursor,
      hasNextPage: hasNextPage || queryIndex + 1 < complementaryQueries.length,
      queryIndex: hasNextPage ? queryIndex : queryIndex + 1,
    };

    console.info('[complementary][api] page', {
      handle,
      queryIndex,
      query,
      fetchedOnPage: nodes.length,
      fetchedTotal: fetchedCount,
      hasNextPage,
      collectedBeforeFilter: collectedProducts.length,
      returnedTitles: nodes.map((node) => node.title),
    });

    collectedProducts.push(
      ...nodes
        .filter((recommendedProduct) => recommendedProduct.id !== product.id)
        .filter((recommendedProduct) => recommendedProduct.availableForSale)
        .filter((recommendedProduct) =>
          productMatchesComplementaryRules(
            recommendedProduct,
            product,
            complementarySearchPlan,
          ),
        ),
    );

    fallbackProducts.push(
      ...nodes
        .filter((recommendedProduct) => recommendedProduct.id !== product.id)
        .filter((recommendedProduct) => recommendedProduct.availableForSale),
    );

    if (!hasNextPage) {
      queryIndex += 1;
    }
  }

  let filteredProducts = sortComplementaryProducts(
    collectedProducts.length ? collectedProducts : fallbackProducts,
    product,
  );
  filteredProducts = arrangeProductsByBuckets(filteredProducts, product, limit);

  if (!filteredProducts.length) {
    const {products: fallbackProductConnection} = await context.storefront.query(
      COMPLEMENTARY_FALLBACK_PRODUCTS_QUERY,
      {
        variables: {
          first: limit,
        },
      },
    );

    filteredProducts = arrangeProductsByBuckets(
      (fallbackProductConnection?.nodes || [])
        .filter((recommendedProduct) => recommendedProduct.id !== product.id)
        .filter((recommendedProduct) => recommendedProduct.availableForSale),
      product,
      limit,
    );

    console.info('[complementary][api] broad-fallback', {
      handle,
      returnedCount: filteredProducts.length,
      returnedTitles: filteredProducts.map((node) => node.title),
    });
  }

  console.info('[complementary][api] result', {
    handle,
    fetchedTotal: fetchedCount,
    strictMatches: collectedProducts.length,
    fallbackMatches: fallbackProducts.length,
    returnedCount: filteredProducts.length,
    returnedTitles: filteredProducts.map((node) => node.title),
    pageInfo,
  });

  return json({
    products: filteredProducts,
    pageInfo,
    fetchedCount,
  });
}

const PRODUCT_TAGS_QUERY = `#graphql
  query ComplementarySourceProduct($handle: String!) {
    product(handle: $handle) {
      id
      title
      vendor
      productType
      tags
    }
  }
`;

const COMPLEMENTARY_PRODUCTS_BY_TAG_QUERY = `#graphql
  query ComplementaryProductsPage($first: Int!, $after: String, $query: String!) {
    products(first: $first, after: $after, query: $query) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        handle
        availableForSale
        tags
        images(first: 1) {
          edges {
            node {
              url
              altText
            }
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 1) {
          nodes {
            id
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

const COMPLEMENTARY_FALLBACK_PRODUCTS_QUERY = `#graphql
  query ComplementaryFallbackProducts($first: Int!) {
    products(first: $first) {
      nodes {
        id
        title
        handle
        availableForSale
        tags
        images(first: 1) {
          edges {
            node {
              url
              altText
            }
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 1) {
          nodes {
            id
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;
