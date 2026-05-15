import {json} from '@shopify/remix-oxygen';
import {
  getComplementaryCategoryOptions,
  isAppleMobilePhone,
  isSamsungMobilePhone,
  isValidComplementaryCategory,
  productMatchesIphoneCoverModel,
  productMatchesSamsungPhoneModel,
} from '~/lib/complementaryCategories';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 20;
const MAX_FETCHED_PER_CATEGORY = 100;
const CATEGORY_COLLECTION_HANDLES = {
  'samsung-chargers-cables': 'samsung-chargers-cables',
  'samsung-charging-stations': 'samsung-charging-stations',
  'samsung-phone-covers': 'samsung-phone-covers',
  'samsung-phone-stands': 'samsung-phone-stands',
  'samsung-phone-holders': 'samsung-phone-holders',
  'samsung-screen-camera-protectors': 'samsung-screen-camera-protectors',
  'samsung-smarttag': 'samsung-smarttag',
  'iphone-covers': 'iphone-covers',
  'iphone-chargers': 'iphone-chargers',
  'iphone-charging-stations': 'iphone-charging-stations',
  'iphone-screen-camera-protectors': 'iphone-screen-camera-protectors',
  'iphone-holders': 'iphone-holders',
  'gaming-mice': 'gaming-mouse',
  'gaming-keyboards': 'gaming-keyboards',
  'gaming-headphones': 'gaming-headphones',
  mousepads: 'mousepads',
  'gaming-speakers': 'gaming-speakers',
  backpacks: 'backpacks',
  sleeves: 'laptop-sleeves',
  'adapters-hubs': 'external-hubs-docks',
  mouse: 'mice',
  keyboards: 'keyboards',
  'external-storage': 'external-storage',
  covers: 'covers',
  chargers: 'chargers',
  'charging-stations': 'charging-stations',
  'phone-holders': 'phone-holders',
  'screen-protectors': 'screen-protectors',
};

function shouldShowComplementaryProducts(product) {
  if (isSamsungMobilePhone(product)) return true;
  if (isAppleMobilePhone(product)) return true;

  const tags = Array.isArray(product?.tags) ? product.tags : [];

  return tags.some((tag) => {
    const normalizedTag = String(tag || '').trim().toLowerCase();
    return normalizedTag === 'mobile phones' || normalizedTag.includes('laptop');
  });
}

function filterComplementaryCollectionProducts(products, sourceProduct, category) {
  return products.filter((recommendedProduct) => {
    if (recommendedProduct.id === sourceProduct.id) return false;
    if (category === 'iphone-covers') {
      return productMatchesIphoneCoverModel(recommendedProduct, sourceProduct);
    }
    if (
      category === 'samsung-phone-covers' ||
      category === 'samsung-screen-camera-protectors'
    ) {
      return productMatchesSamsungPhoneModel(recommendedProduct, sourceProduct);
    }

    return true;
  });
}

function categoryNeedsStrictScan(category) {
  return [
    'iphone-covers',
    'samsung-phone-covers',
    'samsung-screen-camera-protectors',
  ].includes(category);
}

async function fetchCollectionCategoryProducts({
  storefront,
  product,
  category,
  first,
  after = null,
  stopAfterMatches = first,
}) {
  const collectionHandle = CATEGORY_COLLECTION_HANDLES[category] || category;
  let cursor = after;
  let collection = null;
  let collectionPageInfo = null;
  let fetchedCount = 0;
  const filteredProducts = [];

  do {
    const result = await storefront.query(
      COMPLEMENTARY_COLLECTION_PRODUCTS_QUERY,
      {
        variables: {
          handle: collectionHandle,
          first,
          after: cursor,
        },
      },
    );

    collection = result.collection;
    const nodes = collection?.products?.nodes || [];
    collectionPageInfo = collection?.products?.pageInfo || null;
    fetchedCount += nodes.length;

    filteredProducts.push(
      ...filterComplementaryCollectionProducts(nodes, product, category),
    );

    cursor = collectionPageInfo?.endCursor || null;
  } while (
    categoryNeedsStrictScan(category) &&
    collectionPageInfo?.hasNextPage &&
    filteredProducts.length < stopAfterMatches &&
    fetchedCount < MAX_FETCHED_PER_CATEGORY
  );

  return {
    collection,
    collectionHandle,
    fetchedCount,
    pageInfo: collectionPageInfo,
    products: filteredProducts,
  };
}

export async function loader({request, context}) {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle') || '';
  const selectedCategory = url.searchParams.get('category') || '';
  const cursor = url.searchParams.get('cursor') || null;
  const availabilityOnly = url.searchParams.get('availability') === '1';
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

  if (availabilityOnly) {
    const categories = getComplementaryCategoryOptions(product);
    const availabilityEntries = await Promise.all(
      categories.map(async (category) => {
        const result = await fetchCollectionCategoryProducts({
          storefront: context.storefront,
          product,
          category: category.key,
          first: categoryNeedsStrictScan(category.key) ? limit : 1,
          stopAfterMatches: 1,
        });

        return [
          category.key,
          {
            available: result.products.length > 0,
            collectionFound: Boolean(result.collection),
            fetchedCount: result.fetchedCount,
          },
        ];
      }),
    );

    const availability = Object.fromEntries(availabilityEntries);

    console.info('[complementary][api] availability-result', {
      handle,
      availability,
    });

    return json({availability});
  }

  const hasSelectedCategory = Boolean(selectedCategory);
  if (!hasSelectedCategory) {
    console.info('[complementary][api] skipped-missing-category', {
      handle,
      title: product.title,
    });

    return json({products: [], pageInfo: null, fetchedCount: 0});
  }

  if (
    !isValidComplementaryCategory(product, selectedCategory)
  ) {
    console.info('[complementary][api] skipped-invalid-category', {
      handle,
      title: product.title,
      selectedCategory,
    });

    return json({products: [], pageInfo: null, fetchedCount: 0});
  }

  const {
    collection,
    collectionHandle,
    fetchedCount,
    pageInfo: collectionPageInfo,
    products: filteredProducts,
  } = await fetchCollectionCategoryProducts({
    storefront: context.storefront,
    product,
    category: selectedCategory,
    first: limit,
    after: cursor,
  });

  const pageInfo = collectionPageInfo
    ? {
        ...collectionPageInfo,
        queryIndex: 0,
      }
    : null;

  console.info('[complementary][api] collection-category-result', {
    handle,
    selectedCategory,
    collectionHandle,
    collectionFound: Boolean(collection),
    fetchedTotal: fetchedCount,
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

const COMPLEMENTARY_COLLECTION_PRODUCTS_QUERY = `#graphql
  query ComplementaryCollectionProducts($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      products(first: $first, after: $after) {
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
              title
              image {
                url
                altText
              }
              selectedOptions {
                name
                value
              }
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
  }
`;
