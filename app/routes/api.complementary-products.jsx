import {json} from '@shopify/remix-oxygen';
import {
  isAppleMobilePhone,
  isValidComplementaryCategory,
  productMatchesIphoneCoverModel,
} from '~/lib/complementaryCategories';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 20;
const MAX_FETCHED_PER_CATEGORY = 100;
const CATEGORY_COLLECTION_HANDLES = {
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

    return true;
  });
}

export async function loader({request, context}) {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle') || '';
  const selectedCategory = url.searchParams.get('category') || '';
  const cursor = url.searchParams.get('cursor') || null;
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

  const collectionHandle =
    CATEGORY_COLLECTION_HANDLES[selectedCategory] || selectedCategory;
  let after = cursor;
  let collection = null;
  let collectionPageInfo = null;
  let fetchedCount = 0;
  const filteredProducts = [];

  do {
    const result = await context.storefront.query(
      COMPLEMENTARY_COLLECTION_PRODUCTS_QUERY,
      {
        variables: {
          handle: collectionHandle,
          first: limit,
          after,
        },
      },
    );

    collection = result.collection;
    const nodes = collection?.products?.nodes || [];
    collectionPageInfo = collection?.products?.pageInfo || null;
    fetchedCount += nodes.length;

    filteredProducts.push(
      ...filterComplementaryCollectionProducts(
        nodes,
        product,
        selectedCategory,
      ),
    );

    after = collectionPageInfo?.endCursor || null;
  } while (
    selectedCategory === 'iphone-covers' &&
    collectionPageInfo?.hasNextPage &&
    filteredProducts.length < limit &&
    fetchedCount < MAX_FETCHED_PER_CATEGORY
  );

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
