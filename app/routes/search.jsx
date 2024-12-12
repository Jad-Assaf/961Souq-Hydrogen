import { json } from '@shopify/remix-oxygen';
import { useLoaderData, useSearchParams, useNavigate, Link } from '@remix-run/react';
import { getPaginationVariables, Analytics, Money, Image } from '@shopify/hydrogen';
import { getEmptyPredictiveSearchResult } from '~/lib/search';
import { useRef, useState } from 'react';
import '../styles/SearchPage.css'
import { ProductItem } from '~/components/CollectionDisplay';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{ title: `Hydrogen | Search` }];
};

/**
 * @param {LoaderFunctionArgs}
 */
// loader function
// loader function
export async function loader({ request, context }) {
  const { storefront } = context;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // Extract filters
  const filterQueryParts = [];
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('filter_')) {
      const filterKey = key.replace('filter_', '');
      filterQueryParts.push(`${filterKey}:${value}`);
    }
  }

  const term = searchParams.get('q') || '';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  // Add price conditions to filterQuery
  if (minPrice) {
    filterQueryParts.push(`variants.price:>${minPrice}`);
  }
  if (maxPrice) {
    filterQueryParts.push(`variants.price:<${maxPrice}`);
  }

  const filterQuery = `${term} ${filterQueryParts.join(' AND ')}`;

  // Handle sorting
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

  // Fetch products based on filters and sorting
  const isPredictive = searchParams.has('predictive');
  const searchPromise = isPredictive
    ? predictiveSearch({ request, context })
    : regularSearch({ request, context, filterQuery, sortKey, reverse });

  const result = await searchPromise.catch((error) => {
    console.error('Search Error:', error);
    return { term: '', result: null, error: error.message };
  });

  // Extract vendors and product types from filtered products
  const filteredVendors = [
    ...new Set(
      result?.result?.products?.edges.map(({ node }) => node.vendor)
    ),
  ].sort();

  const filteredProductTypes = [
    ...new Set(
      result?.result?.products?.edges.map(({ node }) => node.productType)
    ),
  ].sort();

  return json({
    ...result,
    vendors: filteredVendors,
    productTypes: filteredProductTypes,
  });
}

export default function SearchPage() {
  const { type, term, result, vendors = [], productTypes = [], error } = useLoaderData();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Local state for price range
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  // State for collapsible filters
  const [showVendors, setShowVendors] = useState(false);
  const [showProductTypes, setShowProductTypes] = useState(false);
  const [showPriceRange, setShowPriceRange] = useState(false);

  // State for mobile filters
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileShowVendors, setMobileShowVendors] = useState(false);
  const [mobileShowProductTypes, setMobileShowProductTypes] = useState(false);
  const [mobileShowPriceRange, setMobileShowPriceRange] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // New state for closing animation

  const closeMobileFilters = () => {
    setIsClosing(true); // Trigger closing animation
    setTimeout(() => {
      setIsMobileFiltersOpen(false);
      setIsClosing(false); // Reset closing state after animation ends
    }, 300); // Duration matches the animation timing
  };

  const handleFilterChange = (filterKey, value, checked) => {
    const params = new URLSearchParams(searchParams);

    if (checked) {
      params.append(`filter_${filterKey}`, value);
    } else {
      const currentFilters = params.getAll(`filter_${filterKey}`);
      const updatedFilters = currentFilters.filter((item) => item !== value);
      params.delete(`filter_${filterKey}`);
      updatedFilters.forEach((item) => params.append(`filter_${filterKey}`, item));
    }

    navigate(`/search?${params.toString()}`);
  };

  const handleSortChange = (e) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', e.target.value);
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
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="search">
      <h1>Search Results</h1>
      <div className="search-filters-container" style={{ display: 'flex' }}>
        {/* Filters */}
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
                  const isChecked = searchParams.getAll('filter_vendor').includes(vendor);
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
                      <label className="filter-label" htmlFor={`vendor-${vendor}`}>{vendor}</label>
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
                {productTypes.map((productType) => {
                  const isChecked = searchParams.getAll('filter_productType').includes(productType);
                  return (
                    <div key={productType} className="filter-option">
                      <input
                        type="checkbox"
                        id={`productType-${productType}`}
                        value={productType}
                        checked={isChecked}
                        onChange={(e) =>
                          handleFilterChange('productType', productType, e.target.checked)
                        }
                      />
                      <label className="filter-label" htmlFor={`productType-${productType}`}>{productType}</label>
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
                <button className="price-filter-apply" onClick={applyPriceFilter}>
                  Apply
                </button>
              </div>
            )}
          </fieldset>
        </div>

        {result?.products?.edges?.length > 0 ? (
          <div className="search-results">
            <div>
              <label htmlFor="sort-select">Sort by:</label>
              <select id="sort-select" onChange={handleSortChange} value={searchParams.get('sort') || 'featured'}>
                <option value="featured">Featured</option>
                <option value="price-low-high">Price: Low - High</option>
                <option value="price-high-low">Price: High - Low</option>
                <option value="best-selling">Best Selling</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            <div className="search-results-grid">
              {result.products.edges.map(({ node: product }, index) => (
                <ProductItem product={product} index={index} key={product.id} />
              ))}
            </div>
          </div>
        ) : (
          <p>No results found</p>
        )}
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
          <div
            className={`mobile-filters-panel ${isClosing ? 'closing' : ''
              }`}
          >
            <hr className='mobile-filters-hr' />
            <button
              className="close-mobile-filters"
              onClick={closeMobileFilters}
            >
              <svg fill="#2172af" height="30px" width="30px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 460.775 460.775" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55 c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55 c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505 c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55 l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719 c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"></path> </g></svg>
            </button>
            <fieldset>
              <button
                type="button"
                onClick={() => setMobileShowVendors(!mobileShowVendors)}
              >
                Vendors <span>{mobileShowVendors ? '-' : '+'}</span>
              </button>
              {mobileShowVendors && (
                <div className='filter-options-container'>
                  {vendors.map((vendor) => {
                    const isChecked = searchParams.getAll('filter_vendor').includes(vendor);
                    return (
                      <div key={vendor} className='filter-option'>
                        <input
                          type="checkbox"
                          id={`mobile-vendor-${vendor}`}
                          value={vendor}
                          checked={isChecked}
                          onChange={(e) =>
                            handleFilterChange('vendor', vendor, e.target.checked)
                          }
                        />
                        <label htmlFor={`mobile-vendor-${vendor}`}>{vendor}</label>
                      </div>
                    );
                  })}
                </div>
              )}
            </fieldset>

            <fieldset>
              <button
                type="button"
                onClick={() => setMobileShowProductTypes(!mobileShowProductTypes)}
              >
                Product Types <span>{mobileShowProductTypes ? '-' : '+'}</span>
              </button>
              {mobileShowProductTypes && (
                <div className='filter-options-container'>
                  {productTypes.map((productType) => {
                    const isChecked = searchParams.getAll('filter_productType').includes(productType);
                    return (
                      <div key={productType} className='filter-option'>
                        <input
                          type="checkbox"
                          id={`mobile-productType-${productType}`}
                          value={productType}
                          checked={isChecked}
                          onChange={(e) =>
                            handleFilterChange('productType', productType, e.target.checked)
                          }
                        />
                        <label htmlFor={`mobile-productType-${productType}`}>{productType}</label>
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
                <div className='mobile-price-filter-container'>
                  <div className='mobile-min-price-filter'>
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
                  <div className='mobile-max-price-filter'>
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

const FILTERED_PRODUCTS_QUERY = `
    query FilteredProducts($filterQuery: String!, $sortKey: ProductSortKeys, $reverse: Boolean) {
    products(
      first: 250,
      query: $filterQuery,
      sortKey: $sortKey,
      reverse: $reverse
    ) {
      edges {
        node {
          vendor
          id
          title
          handle
          productType
          description
          images(first: 1) {
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
              price {
                amount
                currencyCode
              }
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
  }
`;

/**
 * Regular search query and fragments
 * (adjust as needed)
 */
const SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment SearchProduct on Product {
    __typename
    handle
    id
    publishedAt
    title
    trackingParameters
    vendor
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
        selectedOptions {
          name
          value
        }
        product {
          handle
          title
          vendor
        }
      }
    }
  }
`;

const SEARCH_PAGE_FRAGMENT = `#graphql
  fragment SearchPage on Page {
     __typename
     handle
    id
    title
    trackingParameters
  }
`;

const SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment SearchArticle on Article {
    __typename
    handle
    id
    title
    trackingParameters
  }
`;

const PAGE_INFO_FRAGMENT = `#graphql
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/search
export const SEARCH_QUERY = `#graphql
  query RegularSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $term: String!
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    articles: search(
      query: $term,
      types: [ARTICLE],
      first: $first,
    ) {
      nodes {
        ...on Article {
          ...SearchArticle
        }
      }
    }
    pages: search(
      query: $term,
      types: [PAGE],
      first: $first,
    ) {
      nodes {
        ...on Page {
          ...SearchPage
        }
      }
    }
    products: search(
      after: $endCursor,
      before: $startCursor,
      first: $first,
      last: $last,
      query: $term,
      sortKey: RELEVANCE,
      types: [PRODUCT],
      unavailableProducts: HIDE,
    ) {
      nodes {
        ...on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
  ${SEARCH_PAGE_FRAGMENT}
  ${SEARCH_ARTICLE_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
`;

/**
 * Regular search fetcher
 * @param {Pick<
 *   LoaderFunctionArgs,
 *   'request' | 'context'
 * >}
 * @return {Promise<RegularSearchReturn>}
 */
async function regularSearch({ request, context, filterQuery, sortKey, reverse, minPrice, maxPrice }) {
  const { storefront } = context;

  try {
    const variables = {
      filterQuery,
      sortKey,
      reverse,
      minPrice,
      maxPrice,
    };

    console.log('Query Variables:', variables); // Debugging

    const { products } = await storefront.query(FILTERED_PRODUCTS_QUERY, {
      variables,
    });

    if (!products?.edges?.length) {
      console.error('No products found in response:', products); // Debugging
      return { term: filterQuery, result: { products: { edges: [] }, total: 0 } };
    }

    return {
      term: filterQuery,
      result: {
        products,
        total: products.edges.length,
      },
    };
  } catch (error) {
    console.error('Error during regular search:', error);
    return { term: filterQuery, result: null, error: error.message };
  }
}

/**
 * Predictive search query and fragments
 * (adjust as needed)
 */
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

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/predictiveSearch
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
      types: $types,
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
 * Predictive search fetcher
 * @param {Pick<
 *   ActionFunctionArgs,
 *   'request' | 'context'
 * >}
 * @return {Promise<PredictiveSearchReturn>}
 */
async function predictiveSearch({ request, context }) {
  const { storefront } = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '').trim();
  const limit = Number(url.searchParams.get('limit') || 10000);
  const type = 'predictive';

  if (!term) return { type, term, result: getEmptyPredictiveSearchResult() };

  // Prepare the search term for partial matching
  const modifiedTerm = term.toLowerCase();

  // Use Shopify's `prefix` for partial matching on the last term
  const queryTerm = `(title:*${modifiedTerm}* OR description:*${modifiedTerm}* OR variants.sku:*${modifiedTerm}*)`;

  console.log("Constructed Query:", queryTerm); // Debugging

  try {
    const { predictiveSearch: items, errors } = await storefront.query(
      PREDICTIVE_SEARCH_QUERY,
      {
        variables: {
          limit,
          limitScope: 'EACH',
          term: queryTerm,
          types: ['PRODUCT'], // Search within products only
          prefix: 'LAST', // Adds support for partial matching
          searchableFields: ['TITLE', 'DESCRIPTION', 'VARIANT_SKU'], // Ensure we search relevant fields
        },
      },
    );

    if (errors) {
      throw new Error(
        `Shopify API errors: ${errors.map(({ message }) => message).join(', ')}`,
      );
    }

    if (!items) {
      throw new Error('No predictive search data returned from Shopify API');
    }

    const total = Object.values(items).reduce(
      (acc, item) => acc + item.length,
      0,
    );

    return { type, term, result: { items, total } };
  } catch (error) {
    console.error('Error during predictive search:', error);
    return { type, term, result: null, error: error.message };
  }
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').ActionFunctionArgs} ActionFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn */
/** @typedef {import('~/lib/search').PredictiveSearchReturn} PredictiveSearchReturn */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
