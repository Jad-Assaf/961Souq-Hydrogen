import {json} from '@shopify/remix-oxygen';
import {useLoaderData, useSearchParams, useNavigate} from '@remix-run/react';
import {useState, useEffect} from 'react';
import {ProductItem} from '~/components/CollectionDisplay';
import {getEmptyPredictiveSearchResult} from '~/lib/search';
import {trackSearch} from '~/lib/metaPixelEvents';
import '../styles/SearchPage.css';
import customDictionary from '~/lib/customDictionary.json';

/**
 * @type {import('@remix-run/react').MetaFunction}
 */
export const meta = () => {
  return [{title: `961Souq | Search`}];
};

/* ------------------------------------------------------------------
   TWO-WAY DICTIONARY
------------------------------------------------------------------- */
function buildSynonymMap(dictionary) {
  const map = {};
  for (const [key, synonyms] of Object.entries(dictionary)) {
    const allForms = new Set([
      key.toLowerCase(),
      ...synonyms.map((s) => s.toLowerCase()),
    ]);
    const uniqueGroup = Array.from(new Set([key, ...synonyms]));
    for (const form of allForms) {
      map[form] = uniqueGroup;
    }
  }
  return map;
}

const dictionaryMap = buildSynonymMap(customDictionary);

function expandSearchTerms(terms) {
  const expanded = [];
  for (const t of terms) {
    const lower = t.toLowerCase();
    if (dictionaryMap[lower]) {
      expanded.push(...dictionaryMap[lower]);
    } else {
      expanded.push(t);
    }
  }
  // Remove duplicates
  return [...new Set(expanded)];
}

/* ------------------------------------------------------------------
   NEW HELPER FUNCTION: getSearchTerms
      - Returns both the normalized term (with spaces) and its concatenated version.
------------------------------------------------------------------- */
function getSearchTerms(term) {
  const normalized = term.replace(/-/g, ' ').trim();
  const concatenated = normalized.replace(/\s+/g, '');
  return {normalized, concatenated};
}

/* ------------------------------------------------------------------
   Helper: buildExpandedClause
      - For normalized term: split into words, expand each using the dictionary,
        and build a clause that ORs synonyms for each word and ANDs across words.
------------------------------------------------------------------- */
function buildExpandedClause(normalized, usePrefix) {
  const baseWords = normalized.split(/\s+/).filter(Boolean);
  const expandedSynonymClauses = baseWords.map((word) => {
    const synonyms = expandSearchTerms([word]);
    const clauses = synonyms.map((syn) => {
      const termQuery = usePrefix ? `${syn}*` : `*${syn}*`;
      return `(title:${termQuery} OR variants.sku:${termQuery} OR description:${termQuery} OR product_type:${termQuery} OR tag:${termQuery})`;
    });
    return `(${clauses.join(' OR ')})`;
  });
  return expandedSynonymClauses.join(' AND ');
}

/* ------------------------------------------------------------------
   Helper functions for sorting
------------------------------------------------------------------- */
function getSortKey(searchParams) {
  const sortKeyMapping = {
    featured: 'RELEVANCE',
    'price-low-high': 'PRICE',
    'price-high-low': 'PRICE',
    'best-selling': 'BEST_SELLING',
    newest: 'CREATED_AT',
  };
  return sortKeyMapping[searchParams.get('sort')] || 'RELEVANCE';
}
function getReverse(searchParams) {
  const reverseMapping = {
    'price-high-low': true,
  };
  return reverseMapping[searchParams.get('sort')] || false;
}

/* ------------------------------------------------------------------
   LOADER (Regular Search)
------------------------------------------------------------------- */
export async function loader({request, context}) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const usePrefix = searchParams.get('prefix') === 'true';

  // Predictive search check (unchanged)
  const isPredictive = searchParams.has('predictive');
  if (isPredictive) {
    const result = await predictiveSearch({request, context, usePrefix}).catch(
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

  // Cursor-based pagination
  const after = searchParams.get('after') || null;
  const before = searchParams.get('before') || null;

  // Filter building (for vendor, product type, etc.)
  const shopifyKeyMap = {
    vendor: 'vendor',
    productType: 'product_type',
  };
  const filterMap = new Map();
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('filter_')) {
      const rawKey = key.replace('filter_', '');
      if (!filterMap.has(rawKey)) {
        filterMap.set(rawKey, []);
      }
      filterMap.get(rawKey).push(value);
    }
  }
  const filterQueryParts = [];
  for (const [rawKey, values] of filterMap.entries()) {
    const shopifyKey = shopifyKeyMap[rawKey] || rawKey;
    if (values.length === 1) {
      filterQueryParts.push(`${shopifyKey}:"${values[0]}"`);
    } else {
      const orGroup = values.map((v) => `${shopifyKey}:"${v}"`).join(' OR ');
      filterQueryParts.push(`(${orGroup})`);
    }
  }

  // Price range & text search
  const rawTerm = searchParams.get('q') || '';
  const {normalized, concatenated} = getSearchTerms(rawTerm);

  // --- Build query clauses ---
  // For concatenated term, use a simple clause
  const termQueryConcat = usePrefix ? `${concatenated}*` : `*${concatenated}*`;
  const wholeClauseConcat = `(title:${termQueryConcat} OR variants.sku:${termQueryConcat} OR description:${termQueryConcat} OR product_type:${termQueryConcat} OR tag:${termQueryConcat})`;
  let filterQueryConcat = wholeClauseConcat;
  if (filterQueryParts.length > 0) {
    filterQueryConcat += ' AND ' + filterQueryParts.join(' AND ');
  }

  // For normalized term, use dictionary expansion (checking the word first)
  const expandedClause = buildExpandedClause(normalized, usePrefix);
  let filterQueryNormal = expandedClause;
  if (filterQueryParts.length > 0) {
    filterQueryNormal += ' AND ' + filterQueryParts.join(' AND ');
  }

  // --- Execute both searches ---
  const sortKey = getSortKey(searchParams);
  const reverse = getReverse(searchParams);

  const resultConcat = await regularSearch({
    request,
    context,
    filterQuery: filterQueryConcat,
    sortKey,
    reverse,
    after,
    before,
  }).catch((error) => {
    console.error('Search Error (concat):', error);
    return {term: '', result: null, error: error.message};
  });

  const resultNormal = await regularSearch({
    request,
    context,
    filterQuery: filterQueryNormal,
    sortKey,
    reverse,
    after,
    before,
  }).catch((error) => {
    console.error('Search Error (normal):', error);
    return {term: '', result: null, error: error.message};
  });

  // --- Combine results: concatenated results come first ---
  const concatEdges = resultConcat?.result?.products?.edges || [];
  const normalEdges = resultNormal?.result?.products?.edges || [];
  const combinedEdges = [];
  const seen = new Set();
  for (const edge of concatEdges) {
    if (!seen.has(edge.node.id)) {
      combinedEdges.push(edge);
      seen.add(edge.node.id);
    }
  }
  for (const edge of normalEdges) {
    if (!seen.has(edge.node.id)) {
      combinedEdges.push(edge);
      seen.add(edge.node.id);
    }
  }

  // --- Prioritize vendors "apple" and "samsung" ---
  const priorityVendors = new Set(['apple', 'samsung']);
  const finalEdges = combinedEdges.sort((a, b) => {
    const aVendor = a.node.vendor.toLowerCase();
    const bVendor = b.node.vendor.toLowerCase();
    const aPriority = priorityVendors.has(aVendor) ? 0 : 1;
    const bPriority = priorityVendors.has(bVendor) ? 0 : 1;
    return aPriority - bPriority;
  });

  // Simple pagination info (can be refined as needed)
  const {hasNextPage, hasPreviousPage, startCursor, endCursor} =
    resultConcat.result.products.pageInfo;

  const pageInfo = {
    hasNextPage,
    hasPreviousPage,
    startCursor,
    endCursor,
  };

  // Vendors & productTypes for filters
  const filteredVendors = [
    ...new Set(finalEdges.map(({node}) => node.vendor)),
  ].sort();
  const filteredProductTypes = [
    ...new Set(finalEdges.map(({node}) => node.productType)),
  ].sort();

  return json({
    type: 'regular',
    term: rawTerm,
    result: {products: {edges: finalEdges, pageInfo}},
    vendors: filteredVendors,
    productTypes: filteredProductTypes,
  });
}

/* ------------------------------------------------------------------
   REACT COMPONENT
------------------------------------------------------------------- */
export default function SearchPage() {
  const {
    type,
    term,
    result,
    vendors = [],
    productTypes = [],
    error,
  } = useLoaderData();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  const [showVendors, setShowVendors] = useState(false);
  const [showProductTypes, setShowProductTypes] = useState(false);
  const [showPriceRange, setShowPriceRange] = useState(false);

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileShowVendors, setMobileShowVendors] = useState(false);
  const [mobileShowProductTypes, setMobileShowProductTypes] = useState(false);
  const [mobileShowPriceRange, setMobileShowPriceRange] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const closeMobileFilters = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMobileFiltersOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const handleFilterChange = (filterKey, value, checked) => {
    const params = new URLSearchParams(searchParams);
    if (checked) {
      params.append(`filter_${filterKey}`, value);
    } else {
      const currentFilters = params.getAll(`filter_${filterKey}`);
      const updatedFilters = currentFilters.filter((item) => item !== value);
      params.delete(`filter_${filterKey}`);
      updatedFilters.forEach((item) =>
        params.append(`filter_${filterKey}`, item),
      );
    }
    params.delete('after');
    params.delete('before');
    navigate(`/search?${params.toString()}`);
  };

  const handleSortChange = (e) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', e.target.value);
    params.delete('after');
    params.delete('before');
    navigate(`/search?${params.toString()}`);
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams);
    if (minPrice) {
      params.set('minPrice', minPrice);
    } else {
      params.delete('minPrice');
    }
    if (maxPrice) {
      params.set('maxPrice', maxPrice);
    } else {
      params.delete('maxPrice');
    }
    params.delete('after');
    params.delete('before');
    navigate(`/search?${params.toString()}`);
  };

  useEffect(() => {
    if (term) {
      trackSearch(term);
    }
  }, [term]);

  const edges = result?.products?.edges || [];
  if (!edges.length) {
    return (
      <div className="search">
        <h1>Search Results</h1>
        <p>No results found</p>
      </div>
    );
  }

  const pageInfo = result?.products?.pageInfo || {};
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
      <div className="search-filters-container" style={{display: 'flex'}}>
        {/* Sidebar (Desktop) */}
        <div className="filters">
          <fieldset>
            <button
              type="button"
              onClick={() => setShowVendors(!showVendors)}
              className="filter-toggle"
              aria-expanded={showVendors}
            >
              Vendors <span>{showVendors ? '-' : '+'}</span>
            </button>
            {showVendors && (
              <div>
                {vendors.map((vendor) => {
                  const isChecked = searchParams
                    .getAll('filter_vendor')
                    .includes(vendor);
                  return (
                    <div key={vendor} className="filter-option">
                      <input
                        type="checkbox"
                        id={`vendor-${vendor}`}
                        value={vendor}
                        checked={isChecked}
                        onChange={(e) =>
                          handleFilterChange('vendor', vendor, e.target.checked)
                        }
                      />
                      <label
                        className="filter-label"
                        htmlFor={`vendor-${vendor}`}
                      >
                        {vendor}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </fieldset>
          <fieldset>
            <button
              type="button"
              onClick={() => setShowProductTypes(!showProductTypes)}
              className="filter-toggle"
              aria-expanded={showProductTypes}
            >
              Product Types <span>{showProductTypes ? '-' : '+'}</span>
            </button>
            {showProductTypes && (
              <div>
                {productTypes.map((ptype) => {
                  const isChecked = searchParams
                    .getAll('filter_productType')
                    .includes(ptype);
                  return (
                    <div key={ptype} className="filter-option">
                      <input
                        type="checkbox"
                        id={`productType-${ptype}`}
                        value={ptype}
                        checked={isChecked}
                        onChange={(e) =>
                          handleFilterChange(
                            'productType',
                            ptype,
                            e.target.checked,
                          )
                        }
                      />
                      <label
                        className="filter-label"
                        htmlFor={`productType-${ptype}`}
                      >
                        {ptype}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </fieldset>
          <fieldset>
            <button
              type="button"
              onClick={() => setShowPriceRange(!showPriceRange)}
              className="filter-toggle"
              aria-expanded={showPriceRange}
            >
              Price Range <span>{showPriceRange ? '-' : '+'}</span>
            </button>
            {showPriceRange && (
              <div>
                <div>
                  <label>
                    Min Price:
                    <input
                      type="number"
                      name="minPrice"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="price-filter-btn"
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Max Price:
                    <input
                      type="number"
                      name="maxPrice"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="price-filter-btn"
                    />
                  </label>
                </div>
                <button
                  className="price-filter-apply"
                  onClick={applyPriceFilter}
                >
                  Apply
                </button>
              </div>
            )}
          </fieldset>
        </div>
        {/* Main Search Results */}
        <div className="search-results">
          <div>
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              onChange={handleSortChange}
              value={searchParams.get('sort') || 'featured'}
            >
              <option value="featured">Featured</option>
              <option value="price-low-high">Price: Low - High</option>
              <option value="price-high-low">Price: High - Low</option>
              <option value="best-selling">Best Selling</option>
              <option value="newest">Newest</option>
            </select>
          </div>
          <div className="search-results-grid">
            {edges.map(({node: product}, idx) => (
              <ProductItem product={product} index={idx} key={product.id} />
            ))}
          </div>
          <div
            style={{
              marginTop: '1rem',
              display: 'flex',
              justifyContent: 'center',
              gap: '50px',
            }}
          >
            {pageInfo.hasPreviousPage && (
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
            {pageInfo.hasNextPage && (
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
      <button
        className="mobile-filters-toggle"
        onClick={() => setIsMobileFiltersOpen(true)}
      >
        Filter
      </button>
      {isMobileFiltersOpen && (
        <div className="mobile-filters-overlay">
          <div className={`mobile-filters-panel ${isClosing ? 'closing' : ''}`}>
            <hr className="mobile-filters-hr" />
            <button
              className="close-mobile-filters"
              onClick={closeMobileFilters}
            >
              <svg
                fill="#000"
                height="30px"
                width="30px"
                viewBox="0 0 460.775 460.775"
              >
                <g>
                  <path
                    d="M285.08,230.397L456.218,59.27
                      c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565
                      c-2.913-2.911-6.866-4.55-10.992-4.55
                      c-4.127,0-8.08,1.639-10.993,4.55L285.08,171.705
                      L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55
                      c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284
                      c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128
                      L4.575,401.505c-6.074,6.077-6.074,15.911,0,21.986
                      l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55
                      c4.127,0,8.08-1.639,10.994-4.55l171.117-171.12
                      l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55
                      c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719
                      c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"
                  />
                </g>
              </svg>
            </button>
            <fieldset>
              <button
                type="button"
                onClick={() => setMobileShowVendors(!mobileShowVendors)}
              >
                Vendors <span>{mobileShowVendors ? '-' : '+'}</span>
              </button>
              {mobileShowVendors && (
                <div className="filter-options-container">
                  {vendors.map((vendor) => {
                    const isChecked = searchParams
                      .getAll('filter_vendor')
                      .includes(vendor);
                    return (
                      <div key={vendor} className="filter-option">
                        <input
                          type="checkbox"
                          id={`mobile-vendor-${vendor}`}
                          value={vendor}
                          checked={isChecked}
                          onChange={(e) =>
                            handleFilterChange(
                              'vendor',
                              vendor,
                              e.target.checked,
                            )
                          }
                        />
                        <label htmlFor={`mobile-vendor-${vendor}`}>
                          {vendor}
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </fieldset>
            <fieldset>
              <button
                type="button"
                onClick={() =>
                  setMobileShowProductTypes(!mobileShowProductTypes)
                }
              >
                Product Types <span>{mobileShowProductTypes ? '-' : '+'}</span>
              </button>
              {mobileShowProductTypes && (
                <div className="filter-options-container">
                  {productTypes.map((type) => {
                    const isChecked = searchParams
                      .getAll('filter_productType')
                      .includes(type);
                    return (
                      <div key={type} className="filter-option">
                        <input
                          type="checkbox"
                          id={`mobile-productType-${type}`}
                          value={type}
                          checked={isChecked}
                          onChange={(e) =>
                            handleFilterChange(
                              'productType',
                              type,
                              e.target.checked,
                            )
                          }
                        />
                        <label htmlFor={`mobile-productType-${type}`}>
                          {type}
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </fieldset>
            <fieldset>
              <button
                type="button"
                onClick={() => setMobileShowPriceRange(!mobileShowPriceRange)}
              >
                Price Range <span>{mobileShowPriceRange ? '-' : '+'}</span>
              </button>
              {mobileShowPriceRange && (
                <div className="mobile-price-filter-container">
                  <div className="mobile-min-price-filter">
                    <label>
                      Min Price:
                      <input
                        type="number"
                        name="minPrice"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="mobile-max-price-filter">
                    <label>
                      Max Price:
                      <input
                        type="number"
                        name="maxPrice"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                      />
                    </label>
                  </div>
                  <button onClick={applyPriceFilter}>Apply</button>
                </div>
              )}
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   GRAPHQL + REGULAR SEARCH
------------------------------------------------------------------- */
const FILTERED_PRODUCTS_QUERY = `#graphql
  query FilteredProducts(
    $filterQuery: String,
    $sortKey: ProductSortKeys,
    $reverse: Boolean,
    $after: String,
    $before: String,
    $first: Int,
    $last: Int
  ) {
    products(
      query: $filterQuery,
      sortKey: $sortKey,
      reverse: $reverse,
      after: $after,
      before: $before,
      first: $first,
      last: $last
    ) {
      edges {
        node {
          vendor
          id
          title
          handle
          productType
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
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

async function regularSearch({
  request,
  context,
  filterQuery,
  sortKey,
  reverse,
  after = null,
  before = null,
}) {
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
  const variables = {
    filterQuery,
    sortKey,
    reverse,
    after,
    before,
    first,
    last,
  };
  try {
    const {products} = await storefront.query(FILTERED_PRODUCTS_QUERY, {
      variables,
    });
    if (!products?.edges) {
      return {
        type: 'regular',
        term: filterQuery,
        result: {products: {edges: []}},
      };
    }
    return {type: 'regular', term: filterQuery, result: {products}};
  } catch (error) {
    console.error('Regular search error:', error);
    return {
      type: 'regular',
      term: filterQuery,
      result: null,
      error: error.message,
    };
  }
}

/* ------------------------------------------------------------------
   PREDICTIVE SEARCH (Combined Results with Dictionary)
------------------------------------------------------------------- */
const PREDICTIVE_SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    blog { handle }
    image { url altText width height }
    trackingParameters
  }
`;
const PREDICTIVE_SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image { url altText width height }
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
    description
    productType
    tags
    handle
    trackingParameters
    variants(first: 1) {
      nodes {
        id
        sku
        image { url altText width height }
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
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
    $country: CountryCode,
    $language: LanguageCode,
    $limitScope: PredictiveSearchLimitScope!,
    $term: String!,
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limitScope: $limitScope,
      query: $term,
      types: $types
    ) {
      articles { ...PredictiveArticle }
      collections { ...PredictiveCollection }
      pages { ...PredictivePage }
      products { ...PredictiveProduct }
      queries { ...PredictiveQuery }
    }
  }
  ${PREDICTIVE_SEARCH_ARTICLE_FRAGMENT}
  ${PREDICTIVE_SEARCH_COLLECTION_FRAGMENT}
  ${PREDICTIVE_SEARCH_PAGE_FRAGMENT}
  ${PREDICTIVE_SEARCH_PRODUCT_FRAGMENT}
  ${PREDICTIVE_SEARCH_QUERY_FRAGMENT}
`;

/**
 * In predictive search we build a clause for the concatenated term (simple)
 * and for the normalized term (using dictionary expansion). Both queries are executed,
 * then their results are combined with duplicates removed.
 * For the products category, we then re-sort to prioritize vendors "apple" and "samsung".
 */
async function predictiveSearch({request, context, usePrefix}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const rawTerm = String(url.searchParams.get('q') || '').trim();
  const {normalized, concatenated} = getSearchTerms(rawTerm);
  const limit = Number(url.searchParams.get('limit') || 10000);
  const type = 'predictive';
  if (!normalized) {
    return {type, term: '', result: getEmptyPredictiveSearchResult()};
  }
  // Build clause for concatenated term (simple)
  const termQueryConcat = usePrefix ? `${concatenated}*` : `*${concatenated}*`;
  const clauseConcat = `(title:${termQueryConcat} OR variants.sku:${termQueryConcat} OR description:${termQueryConcat} OR product_type:${termQueryConcat} OR tag:${termQueryConcat})`;
  // Build clause for normalized term using dictionary expansion
  const expandedClauseNormal = buildExpandedClause(normalized, usePrefix);
  // Execute both queries
  const responseConcat = await storefront.query(PREDICTIVE_SEARCH_QUERY, {
    variables: {
      limit,
      limitScope: 'EACH',
      term: clauseConcat,
    },
  });
  if (responseConcat.errors) {
    throw new Error(
      `Shopify API errors: ${responseConcat.errors
        .map(({message}) => message)
        .join(', ')}`,
    );
  }
  const itemsConcat = responseConcat.predictiveSearch;
  const responseNormal = await storefront.query(PREDICTIVE_SEARCH_QUERY, {
    variables: {
      limit,
      limitScope: 'EACH',
      term: expandedClauseNormal,
    },
  });
  if (responseNormal.errors) {
    throw new Error(
      `Shopify API errors: ${responseNormal.errors
        .map(({message}) => message)
        .join(', ')}`,
    );
  }
  const itemsNormal = responseNormal.predictiveSearch;
  // Combine results for each category
  const combinedItems = {};
  const categories = [
    'articles',
    'collections',
    'pages',
    'products',
    'queries',
  ];
  for (const category of categories) {
    const concatArray = itemsConcat[category] || [];
    const normalArray = itemsNormal[category] || [];
    const combinedArray = [];
    const seen = new Set();
    const keyField = category === 'queries' ? 'text' : 'id';
    for (const item of concatArray) {
      if (item[keyField] && !seen.has(item[keyField])) {
        combinedArray.push(item);
        seen.add(item[keyField]);
      }
    }
    for (const item of normalArray) {
      if (item[keyField] && !seen.has(item[keyField])) {
        combinedArray.push(item);
        seen.add(item[keyField]);
      }
    }
    combinedItems[category] = combinedArray;
  }
  // For products, prioritize vendors "apple" and "samsung"
  if (combinedItems.products) {
    const priorityVendors = new Set(['apple', 'samsung']);
    combinedItems.products = combinedItems.products.sort((a, b) => {
      const aVendor = a.vendor.toLowerCase();
      const bVendor = b.vendor.toLowerCase();
      const aPriority = priorityVendors.has(aVendor) ? 0 : 1;
      const bPriority = priorityVendors.has(bVendor) ? 0 : 1;
      return aPriority - bPriority;
    });
  }
  const totalCombined = categories.reduce(
    (acc, cat) => acc + combinedItems[cat].length,
    0,
  );
  return {
    type,
    term: rawTerm,
    result: {items: combinedItems, total: totalCombined},
  };
}

/**
 * @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs
 * @typedef {import('@shopify/remix-oxygen').ActionFunctionArgs} ActionFunctionArgs
 * @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction
 * @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn
 * @typedef {import('~/lib/search').PredictiveSearchReturn} PredictiveSearchReturn
 * @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData
 */
