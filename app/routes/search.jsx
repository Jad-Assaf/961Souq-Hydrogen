import {json} from '@shopify/remix-oxygen';
import {useLoaderData, useSearchParams, useNavigate} from '@remix-run/react';
import {useState} from 'react';
import {ProductItem} from '~/components/CollectionDisplay';
import {getEmptyPredictiveSearchResult} from '~/lib/search';
import '../styles/SearchPage.css';

/**
 * @type {import('@remix-run/react').MetaFunction}
 */
export const meta = () => {
  return [{title: `961Souq | Search`}];
};

/**
 * Helper: buildSearchQuery
 * - If `isPredictive = true`, do partial/wildcard matching for each word,
 *   but NOT in `description` anymore.
 * - Otherwise (regular), keep the original exact-phrase logic.
 */
function buildSearchQuery(rawTerm, isPredictive = false) {
  const trimmed = rawTerm.trim();
  if (!trimmed) return '';

  if (isPredictive) {
    // PARTIAL MATCHING FOR PREDICTIVE (no search in description)
    const words = trimmed.split(/\s+/);
    if (!words.length) return '';
    const subQueries = words.map((w) => {
      // Title or SKU
      return `(title:*${w}* OR variants.sku:*${w}*)`;
    });
    return subQueries.join(' AND ');
  } else {
    // ORIGINAL EXACT-PHRASE LOGIC FOR REGULAR SEARCH
    if (trimmed.includes(' ')) {
      return `"${trimmed}"`;
    }
    return trimmed;
  }
}

/**
 * Priority function:
 * - vendor = Apple or Samsung => better (add 0)
 * - else => add 1
 * - productType in [mobile phones, watches, laptops] => add 0, else 1
 * - has tag "accessories" => add 1
 * The lower the sum, the better (top of the list).
 */
function getPriority(product) {
  let priority = 0;

  // 1) Vendor
  const vendorLower = product.vendor?.toLowerCase() || '';
  if (vendorLower !== 'apple' && vendorLower !== 'samsung') {
    priority += 1;
  }

  // 2) Product Type
  const favoredTypes = new Set(['mobile phones', 'watches', 'laptops']);
  const typeLower = product.productType?.toLowerCase() || '';
  if (!favoredTypes.has(typeLower)) {
    priority += 1;
  }

  // 3) Tag "accessories" => de-prioritize
  const tagsLower = product.tags?.map((t) => t.toLowerCase()) || [];
  if (tagsLower.includes('accessories')) {
    priority += 1;
  }

  return priority;
}

/**
 * @param {import('@shopify/remix-oxygen').LoaderFunctionArgs} args
 */
export async function loader({request, context}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const rawTerm = searchParams.get('q') || '';

  // -----------------------------------------
  // Check if predictive search
  // -----------------------------------------
  const isPredictive = searchParams.has('predictive');
  if (isPredictive) {
    // Build partial-match query for predictive
    const query = buildSearchQuery(rawTerm, true);

    const result = await predictiveSearch({request, context, query}).catch(
      (error) => {
        console.error('Predictive Search Error:', error);
        return {
          type: 'predictive',
          term: '',
          result: null,
          error: error.message,
        };
      },
    );
    return json({
      ...result,
      vendors: [],
      productTypes: [],
      pageInfo: {},
    });
  }

  // -----------------------------------------
  // Otherwise: REGULAR search
  // -----------------------------------------
  const query = buildSearchQuery(rawTerm, false);
  const prefix = searchParams.get('prefix') || null;

  // Pagination
  const after = searchParams.get('after') || null;
  const before = searchParams.get('before') || null;

  // If after is set, we go forward => first=50
  // If before is set, we go backward => last=50, first=null
  let first = 50;
  let lastParam = null;
  if (after) {
    first = 50;
  } else if (before) {
    lastParam = 50;
    first = null;
  }

  // GraphQL query with $last so that backward pagination works
  const SEARCH_PRODUCTS_QUERY = `#graphql
    query SearchProducts(
      $query: String!,
      $first: Int,
      $last: Int,
      $after: String,
      $before: String,
      $prefix: SearchPrefixQueryType
    ) {
      search(
        query: $query,
        first: $first,
        last: $last,
        after: $after,
        before: $before,
        prefix: $prefix,
        types: PRODUCT
      ) {
        edges {
          node {
            ... on Product {
              id
              title
              handle
              vendor
              productType
              tags
              description
              images(first: 3) {
                nodes {
                  url
                  altText
                }
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              variants(first: 1) {
                nodes {
                  id
                  sku
                  price {
                    amount
                    currencyCode
                  }
                  image {
                    url
                    altText
                  }
                  availableForSale
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
      }
    }
  `;

  const variables = {
    query,
    first,
    last: lastParam,
    after,
    before,
    prefix,
  };

  let result;
  try {
    const data = await storefront.query(SEARCH_PRODUCTS_QUERY, {variables});
    result = {
      type: 'regular',
      term: query,
      result: data.search,
    };
  } catch (error) {
    console.error('Regular search error:', error);
    result = {
      type: 'regular',
      term: query,
      result: null,
      error: error.message,
    };
  }

  // Priority logic (Apple / Samsung first, certain product types next, accessories last)
  if (result.result && result.result.edges) {
    result.result.edges.sort((a, b) => {
      return getPriority(a.node) - getPriority(b.node);
    });
  }

  return json({
    ...result,
    vendors: [],
    productTypes: [],
  });
}

/* ------------------------------------------------------------------
   REACT COMPONENT - no filters, no user sorting
------------------------------------------------------------------- */
export default function SearchPage() {
  const {result} = useLoaderData();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Pagination
  const edges = result?.edges || [];
  if (!edges.length) {
    return (
      <div className="search">
        <h1>Search Results</h1>
        <p>No results found</p>
      </div>
    );
  }

  const pageInfo = result?.pageInfo || {};
  const hasNextPage = pageInfo.hasNextPage;
  const hasPreviousPage = pageInfo.hasPreviousPage;

  const goNext = () => {
    if (!hasNextPage) return;
    const params = new URLSearchParams(searchParams);
    params.set('after', pageInfo.endCursor);
    params.delete('before');
    navigate(`/search?${params.toString()}`);
  };

  const goPrev = () => {
    if (!hasPreviousPage) return;
    const params = new URLSearchParams(searchParams);
    params.set('before', pageInfo.startCursor);
    params.delete('after');
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="search">
      <h1>Search Results</h1>

      {/* Show the results */}
      <div className="search-results-grid">
        {edges.map(({node: product}, idx) => (
          <ProductItem product={product} index={idx} key={product.id} />
        ))}
      </div>

      {/* Pagination controls */}
      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '50px',
        }}
      >
        {hasPreviousPage && (
          <button
            onClick={goPrev}
            style={{
              backgroundColor: '#fff',
              cursor: 'pointer',
              padding: '5px 10px',
              border: '1px solid #d1d7db',
              borderRadius: '30px',
            }}
          >
            ← Previous Page
          </button>
        )}
        {hasNextPage && (
          <button
            onClick={goNext}
            style={{
              backgroundColor: '#fff',
              cursor: 'pointer',
              padding: '5px 10px',
              border: '1px solid #d1d7db',
              borderRadius: '30px',
            }}
          >
            Next Page →
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   STUB FOR REGULAR SEARCH (unchanged)
------------------------------------------------------------------- */
async function regularSearch({request, context, after = null, before = null}) {
  const {storefront} = context;
  let first = null;
  let last = null;
  if (after) {
    first = 50;
  } else if (before) {
    last = 50;
  } else {
    first = 50;
  }
  return {type: 'regular', result: null};
}

/* ------------------------------------------------------------------
   PREDICTIVE SEARCH – partial match, no filters, no user sorting
------------------------------------------------------------------- */
const PREDICTIVE_SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    blog {
      handle
    }
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
`;
const PREDICTIVE_SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
`;
const PREDICTIVE_SEARCH_PAGE_FRAGMENT = `#graphql
  fragment PredictivePage on Page {
    __typename
    id
    title
    handle
    trackingParameters
  }
`;
const PREDICTIVE_SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment PredictiveProduct on Product {
    __typename
    id
    title
    vendor
    productType
    tags
    description
    handle
    trackingParameters
    variants(first: 1) {
      nodes {
        id
        sku
        image {
          url
          altText
          width
          height
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
`;
const PREDICTIVE_SEARCH_QUERY_FRAGMENT = `#graphql
  fragment PredictiveQuery on SearchQuerySuggestion {
    __typename
    text
    styledText
    trackingParameters
  }
`;
const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limitScope: PredictiveSearchLimitScope!
    $term: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limitScope: $limitScope,
      query: $term,
      types: $types
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
  ${PREDICTIVE_SEARCH_ARTICLE_FRAGMENT}
  ${PREDICTIVE_SEARCH_COLLECTION_FRAGMENT}
  ${PREDICTIVE_SEARCH_PAGE_FRAGMENT}
  ${PREDICTIVE_SEARCH_PRODUCT_FRAGMENT}
  ${PREDICTIVE_SEARCH_QUERY_FRAGMENT}
`;

async function predictiveSearch({request, context, query}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const prefixParam = searchParams.get('prefix');
  let prefix = null;
  if (prefixParam === 'true') {
    prefix = 'LAST'; // or "ANY"
  } else if (
    prefixParam === 'LAST' ||
    prefixParam === 'ANY' ||
    prefixParam === 'NONE'
  ) {
    prefix = prefixParam;
  }

  // For predictive: same approach with $last so backward pagination works if needed
  const after = searchParams.get('after') || null;
  const before = searchParams.get('before') || null;
  let first = 24;
  let lastParam = null;
  if (after) {
    first = 50;
  } else if (before) {
    lastParam = 50;
    first = null;
  }

  const SEARCH_PRODUCTS_QUERY = `#graphql
    query SearchProducts(
      $query: String!,
      $first: Int,
      $last: Int,
      $after: String,
      $before: String,
      $prefix: SearchPrefixQueryType
    ) {
      search(
        query: $query,
        first: $first,
        last: $last,
        after: $after,
        before: $before,
        prefix: $prefix,
        types: PRODUCT
      ) {
        edges {
          node {
            ... on Product {
              id
              title
              handle
              vendor
              productType
              tags
              description
              images(first: 3) {
                nodes {
                  url
                  altText
                }
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              variants(first: 1) {
                nodes {
                  id
                  sku
                  price {
                    amount
                    currencyCode
                  }
                  image {
                    url
                    altText
                  }
                  availableForSale
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
      }
    }
  `;

  let data;
  let errorMessage;
  try {
    data = await storefront.query(SEARCH_PRODUCTS_QUERY, {
      variables: {
        query,
        prefix,
        after,
        before,
        first,
        last: lastParam,
      },
    });
  } catch (error) {
    console.error('Predictive Search Error:', error);
    errorMessage = error.message;
  }

  if (!data?.search || errorMessage) {
    return {
      type: 'predictive',
      term: query,
      result: {
        items: {
          products: [],
        },
        total: 0,
      },
      error: errorMessage || 'No data returned',
    };
  }

  const result = data.search;
  if (result.edges) {
    result.edges.sort((a, b) => getPriority(a.node) - getPriority(b.node));
  }

  const products = result.edges.map((edge) => edge.node);
  return {
    type: 'predictive',
    term: query,
    result: {
      items: {
        products,
      },
      total: products.length,
      pageInfo: result.pageInfo,
    },
  };
}

/**
 * @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs
 * @typedef {import('@shopify/remix-oxygen').ActionFunctionArgs} ActionFunctionArgs
 * @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction
 * @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn
 * @typedef {import('~/lib/search').PredictiveSearchReturn} PredictiveSearchReturn
 * @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData
**/