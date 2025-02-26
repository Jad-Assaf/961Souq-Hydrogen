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
   LOADER
------------------------------------------------------------------- */
export async function loader({request, context}) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const usePrefix = searchParams.get('prefix') === 'true';

  // Predictive search check
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

  // Filter building
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
  const normalizedTerm = rawTerm.replace(/-/g, ' ');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  // Expand synonyms for normal search
  const baseTerms = normalizedTerm
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

  const synonymsExpanded = expandSearchTerms(baseTerms);

  // If user chose prefix => "word*" else => "*word*"
  const terms = synonymsExpanded.map((word) =>
    usePrefix ? `${word}*` : `*${word}*`,
  );

  // Field-specific (title by default)
  let fieldSpecificTerms = terms
    .map(
      (word) =>
        `(title:${word} OR product_type:${word} OR description:${word} OR variants.sku:${word})`,
    )
    .join(' OR ');

  /*
  // If you want multiple fields:
  // fieldSpecificTerms = terms
  //   .map((w) => `(title:${w} OR description:${w} OR variants.sku:${w})`)
  //   .join(' AND ');
  */

  let filterQuery = fieldSpecificTerms;
  if (filterQueryParts.length > 0) {
    if (filterQuery) {
      filterQuery += ' AND ' + filterQueryParts.join(' AND ');
    } else {
      filterQuery = filterQueryParts.join(' AND ');
    }
  }

  console.log('Filter Query:', filterQuery);

  // Sorting
  const sortKeyMapping = {
    featured: 'RELEVANCE',
    'price-low-high': 'PRICE',
    'price-high-low': 'PRICE',
    'best-selling': 'BEST_SELLING',
    newest: 'CREATED_AT',
  };
  const reverseMapping = {
    'price-high-low': true,
  };
  const sortKey = sortKeyMapping[searchParams.get('sort')] || 'RELEVANCE';
  const reverse = reverseMapping[searchParams.get('sort')] || false;

  // Perform search
  const result = await regularSearch({
    request,
    context,
    filterQuery,
    sortKey,
    reverse,
    after,
    before,
  }).catch((error) => {
    console.error('Search Error:', error);
    return {term: '', result: null, error: error.message};
  });

  // Vendors & productTypes for filters
  const filteredVendors = [
    ...new Set(result?.result?.products?.edges.map(({node}) => node.vendor)),
  ].sort();
  const filteredProductTypes = [
    ...new Set(
      result?.result?.products?.edges.map(({node}) => node.productType),
    ),
  ].sort();

  return json({
    ...result,
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
          {/* Sorting */}
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

          {/* Product Grid */}
          <div className="search-results-grid">
            {edges.map(({node: product}, idx) => (
              <ProductItem product={product} index={idx} key={product.id} />
            ))}
          </div>

          {/* Pagination */}
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

      {/* Mobile Filters */}
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
    first = 50; // going forward
  } else if (before) {
    last = 50; // going backward
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

    return {
      type: 'regular',
      term: filterQuery,
      result: {products},
    };
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
   PREDICTIVE SEARCH (Important: OR synonyms within each word, AND across words)
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
    description
    productType
    tags
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

/**
 * For each typed word:
 *   1) Expand synonyms => [syn1, syn2, ...]
 *   2) OR them all together for that single word
 * Then AND across multiple typed words.
 */
async function predictiveSearch({request, context, usePrefix}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const rawTerm = String(url.searchParams.get('q') || '').trim();

  const normalizedTerm = rawTerm;
  const limit = Number(url.searchParams.get('limit') || 10000);
  const type = 'predictive';

  if (!normalizedTerm) {
    return {type, term: '', result: getEmptyPredictiveSearchResult()};
  }

  // Split the input into separate words
  const typedWords = normalizedTerm
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

  // For each typed word, build an OR group of synonyms
  const wordGroups = typedWords.map((baseWord) => {
    // Expand synonyms for THIS typed word
    const synonyms = expandSearchTerms([baseWord]);
    // For each synonym, build the triple check (variants.sku / title / description)
    // then OR them together
    const orSynonyms = synonyms.map((syn) => {
      const termWithWildcard = usePrefix ? `${syn}*` : `*${syn}*`;
      return `(title:${termWithWildcard} OR variants.sku:${termWithWildcard} OR description:${termWithWildcard} OR product_type:${termWithWildcard} OR tag:${termWithWildcard})`;
    });
    // Wrap this single word's synonyms in parentheses and join with OR
    return `(${orSynonyms.join(' OR ')})`;
  });

  // Now AND across multiple typed words
  // e.g. if user typed "horsepower car" => (all synonyms for "horsepower") AND (all synonyms for "car")
  const queryTerm = wordGroups.join(' AND ');

  // Query the Shopify predictiveSearch API
  const {predictiveSearch: items, errors} = await storefront.query(
    PREDICTIVE_SEARCH_QUERY,
    {
      variables: {
        limit,
        limitScope: 'EACH',
        term: queryTerm,
      },
    },
  );

  if (errors) {
    throw new Error(
      `Shopify API errors: ${errors.map(({message}) => message).join(', ')}`,
    );
  }
  if (!items) {
    throw new Error('No predictive search data returned from Shopify API');
  }

  const total = Object.values(items).reduce((acc, arr) => acc + arr.length, 0);
  return {type, term: normalizedTerm, result: {items, total}};
}

/**
 * @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs
 * @typedef {import('@shopify/remix-oxygen').ActionFunctionArgs} ActionFunctionArgs
 * @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction
 * @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn
 * @typedef {import('~/lib/search').PredictiveSearchReturn} PredictiveSearchReturn
 * @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData
 */
