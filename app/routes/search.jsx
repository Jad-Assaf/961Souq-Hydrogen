import {json} from '@shopify/remix-oxygen';
import {
  useLoaderData,
  useSearchParams,
  useNavigate,
  Link,
} from '@remix-run/react';
import {useState} from 'react';
import {ProductItem} from '~/components/CollectionDisplay';
import {getEmptyPredictiveSearchResult} from '~/lib/search';
import '../styles/SearchPage.css';

// IMPORT your existing Filter components from the same location as in collections
import {FiltersDrawer, ShopifyFilterForm} from '~/components/FiltersDrawer';

/**
 * @type {import('@remix-run/react').MetaFunction}
 */
export const meta = () => {
  return [{title: `961Souq | Search`}];
};

/**
 * Helper: buildSearchQuery
 * - If `isPredictive = true`, partial/wildcard in title or sku, ignoring description.
 * - Else keep original exact-phrase logic for multi-word input.
 */
function buildSearchQuery(rawTerm, isPredictive = false) {
  const trimmed = rawTerm.trim();
  if (!trimmed) return '';

  if (isPredictive) {
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (!words.length) return '';
    const subQueries = words.map(
      (w) => `(title:*${w}* OR variants.sku:*${w}*)`,
    );
    return subQueries.join(' AND ');
  } else {
    // Original exact phrase logic
    if (trimmed.includes(' ')) {
      return `"${trimmed}"`;
    }
    return trimmed;
  }
}

/**
 * Priority logic:
 * - vendor=Apple|Samsung => +0
 * - else => +1
 * - productType in [phones, watches, laptops] => +0, else +1
 * - tag=accessories => +1
 */
function getPriority(product) {
  let priority = 0;

  const vendorLower = product.vendor?.toLowerCase() || '';
  if (vendorLower !== 'apple' && vendorLower !== 'samsung') {
    priority += 1;
  }
  const favoredTypes = new Set(['mobile phones', 'watches', 'laptops']);
  const typeLower = product.productType?.toLowerCase() || '';
  if (!favoredTypes.has(typeLower)) {
    priority += 1;
  }
  const tagsLower = product.tags?.map((t) => t.toLowerCase()) || [];
  if (tagsLower.includes('accessories')) {
    priority += 1;
  }
  return priority;
}

/**
 * Loader
 */
export async function loader({request, context}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const rawTerm = searchParams.get('q') || '';

  // Check if predictive
  const isPredictive = searchParams.has('predictive');
  if (isPredictive) {
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
    return json({...result, vendors: [], productTypes: [], pageInfo: {}});
  }

  // Otherwise: REGULAR search
  const query = buildSearchQuery(rawTerm, false);
  const prefix = searchParams.get('prefix') || null;

  const after = searchParams.get('after') || null;
  const before = searchParams.get('before') || null;

  let first = 50;
  let lastParam = null;
  if (after) {
    first = 50;
  } else if (before) {
    lastParam = 50;
    first = null;
  }

  // ADD: If you want filter logic from ?filter.*
  // parse them into productFilters
  const productFilters = parseFilters(searchParams);

  // ADD: If you want sort logic from ?sort=...
  const {sortKey, reverse} = parseSort(searchParams);

  // EXTEND the GraphQL query to retrieve productFilters {...} from the "search"
  const SEARCH_PRODUCTS_QUERY = `#graphql
    query SearchProducts(
      $query: String!,
      $first: Int,
      $last: Int,
      $after: String,
      $before: String,
      $prefix: SearchPrefixQueryType,
      $productFilters: [ProductFilter!],
      $sortKey: SearchSortKeys,
      $reverse: Boolean
    ) {
      search(
        query: $query,
        first: $first,
        last: $last,
        after: $after,
        before: $before,
        prefix: $prefix,
        productFilters: $productFilters,
        sortKey: $sortKey,
        reverse: $reverse,
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
        # THIS is the new part that includes "productFilters", so we can build a filter UI
        productFilters {
          id
          label
          type
          values {
            id
            label
            count
            input
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
    productFilters,
    sortKey,
    reverse,
  };

  let result;
  try {
    const data = await storefront.query(SEARCH_PRODUCTS_QUERY, {variables});
    result = {type: 'regular', term: query, result: data.search};
  } catch (error) {
    console.error('Regular search error:', error);
    result = {type: 'regular', term: query, result: null, error: error.message};
  }

  // Priority logic
  if (result.result && result.result.edges) {
    result.result.edges.sort(
      (a, b) => getPriority(a.node) - getPriority(b.node),
    );
  }

  return json({...result, vendors: [], productTypes: []});
}

/* ------------------------------------------------------------------
   REACT COMPONENT with Filter UI
------------------------------------------------------------------- */
export default function SearchPage() {
  const {result} = useLoaderData();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // If no results
  const edges = result?.edges || [];
  if (!edges.length) {
    return (
      <div className="search">
        <h1>Search Results</h1>
        <p>No results found</p>
      </div>
    );
  }

  // We'll read the filters from result.productFilters
  // so we can pass them to <FiltersDrawer> or <ShopifyFilterForm>
  const filters = result?.productFilters || [];
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // pagination
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

      {/* Example: Sort By dropdown if desired */}
      <SortDropdown />

      {/* MOBILE: Filter Drawer button */}
      <div className="lg:hidden mobile-filter-container">
        <div className="my-4">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="mobile-filter-btn"
          >
            Filters
          </button>
        </div>
        <FiltersDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          filters={filters}
        />
      </div>

      {/* DESKTOP: Show filter form in a sidebar */}
      <div style={{display: 'flex', gap: '1rem'}}>
        <div className="hidden lg:block w-[15%]">
          <ShopifyFilterForm filters={filters} />
        </div>

        {/* MAIN AREA */}
        <div className='w-[85%]'>
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
      </div>
    </div>
  );
}

/**
 * A simple "Sort By" dropdown – if you want sorting in the UI
 */
function SortDropdown() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentSort = searchParams.get('sort') || 'default';

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    // reset pagination
    params.delete('after');
    params.delete('before');
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div style={{marginBottom: '1rem'}}>
      <label htmlFor="sort-select">Sort By: </label>
      <select id="sort-select" value={currentSort} onChange={handleSortChange}>
        <option value="default">Newest</option>
        <option value="priceLowToHigh">Price: Low to High</option>
        <option value="priceHighToLow">Price: High to Low</option>
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------
   parseFilters & parseSort 
   (just like your collections code)
------------------------------------------------------------------- */
function parseFilters(searchParams) {
  const filters = [];
  for (const [key, val] of searchParams.entries()) {
    if (key.startsWith('filter.')) {
      const field = key.replace('filter.', '');
      let parsed;
      try {
        parsed = JSON.parse(val);
      } catch {
        parsed = val;
      }
      filters.push({[field]: parsed});
    }
  }
  return filters;
}

function parseSort(searchParams) {
  const sortOption = searchParams.get('sort') || 'default';
  // Adjust to match "search" sort keys
  const sortMapping = {
    default: {sortKey: 'RELEVANCE', reverse: false},
    priceLowToHigh: {sortKey: 'PRICE', reverse: false},
    priceHighToLow: {sortKey: 'PRICE', reverse: true},
    alphabetical: {sortKey: 'TITLE', reverse: false},
  };
  return sortMapping[sortOption] || sortMapping.default;
}

/* ------------------------------------------------------------------
   REGULAR SEARCH STUB (unchanged)
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
   PREDICTIVE SEARCH (unchanged)
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
  } else if (['LAST', 'ANY', 'NONE'].includes(prefixParam)) {
    prefix = prefixParam;
  }

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
        items: {products: []},
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
      items: {products},
      total: products.length,
      pageInfo: result.pageInfo,
    },
  };
}

/* ------------------------------------------------------------------
   TYPEDEFS
------------------------------------------------------------------- */
/**
 * @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs
 * @typedef {import('@shopify/remix-oxygen').ActionFunctionArgs} ActionFunctionArgs
 * @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction
 * @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn
 * @typedef {import('~/lib/search').PredictiveSearchReturn} PredictiveSearchReturn
 * @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData
 */