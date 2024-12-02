import { json } from '@shopify/remix-oxygen';
import { useLoaderData, useSearchParams, useNavigate, Link } from '@remix-run/react';
import { getPaginationVariables, Analytics, Money, Image } from '@shopify/hydrogen';
import { getEmptyPredictiveSearchResult } from '~/lib/search';
import { useRef } from 'react';

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
  const filterQuery = `${term} ${filterQueryParts.join(' AND ')}`;

  // Determine the type of search
  const isPredictive = searchParams.has('predictive');
  const searchPromise = isPredictive
    ? predictiveSearch({ request, context })
    : regularSearch({ request, context, filterQuery });

  const result = await searchPromise.catch((error) => {
    console.error('Search Error:', error);
    return { term: '', result: null, error: error.message };
  });

  // Debug: Log the structure of products
  console.log('Search Result:', result);

  // Extract vendors based on structure
  const products = isPredictive ? result?.products || [] : result?.products?.edges || [];
  const vendors = [
    ...new Set(
      products.map((item) => (item.node ? item.node.vendor : item.vendor)).filter(Boolean)
    ),
  ].sort();

  console.log('Extracted Vendors:', vendors);

  return json({
    ...result,
    vendors, // Vendors based on the current search results
  });
}

export default function SearchPage() {
  const { type, term, result, vendors = [], error } = useLoaderData();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleFilterChange = (filterKey, value, checked) => {
    const params = new URLSearchParams(searchParams);
    const currentFilters = params.getAll(`filter_${filterKey}`);

    if (checked) {
      // Add the selected filter
      params.append(`filter_${filterKey}`, value);
    } else {
      // Remove the unselected filter
      currentFilters
        .filter((item) => item !== value)
        .forEach((item) => params.append(`filter_${filterKey}`, item));
      params.delete(`filter_${filterKey}`);
    }

    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="search">
      <h1>Search Results</h1>

      {/* Filters */}
      <div className="filters">
        <fieldset>
          <legend>Vendors</legend>
          {vendors.map((vendor) => {
            const isChecked = searchParams.getAll('filter_vendor').includes(vendor);
            return (
              <div key={vendor}>
                <input
                  type="checkbox"
                  id={`vendor-${vendor}`}
                  value={vendor}
                  checked={isChecked}
                  onChange={(e) =>
                    handleFilterChange('vendor', vendor, e.target.checked)
                  }
                />
                <label htmlFor={`vendor-${vendor}`}>{vendor}</label>
              </div>
            );
          })}
        </fieldset>
        <fieldset>
          <legend>Price</legend>
          <select
            onChange={(e) => handleFilterChange('price', e.target.value, true)}
          >
            <option value="">All</option>
            <option value=">100">Over $100</option>
            <option value="<100">Under $100</option>
          </select>
        </fieldset>
      </div>

      {result?.products?.edges?.length > 0 ? (
        <div className="search-results">
          {result.products.edges.map(({ node: product }) => (
            <div className="product-card" key={product.id}>
              <a href={`/products/${product.handle}`} className="product-link">
                {product.variants.nodes[0]?.image && (
                  <Image
                    data={product.variants.nodes[0].image}
                    alt={product.title}
                    width={150}
                  />
                )}
                <div className="product-details">
                  <h2 className="product-title">{product.title}</h2>
                  <p className="product-price">
                    <Money data={product.variants.nodes[0].price} />
                  </p>
                </div>
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p>No results found</p>
      )}
    </div>
  );
}

const FILTERED_PRODUCTS_QUERY = `
  query FilteredProducts($filterQuery: String!) {
    products(first: 50, query: $filterQuery, sortKey: RELEVANCE) {
      edges {
        node {
          vendor
          id
          title
          handle
          priceRange {
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
              image {
                url
                altText
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
async function regularSearch({ request, context, filterQuery }) {
  const { storefront } = context;

  try {
    const variables = {
      filterQuery,
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
    vendor
    id
    title
    description
    handle
    trackingParameters
    variants(first: 1) {
      nodes {
        id
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
    $limit: Int!
    $limitScope: PredictiveSearchLimitScope!
    $term: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit,
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
  const limit = Number(url.searchParams.get('limit') || 1000);
  const type = 'predictive';

  if (!term) return { type, term, result: getEmptyPredictiveSearchResult() };

  // Predictively search articles, collections, pages, products, and queries (suggestions)
  const { predictiveSearch: items, errors } = await storefront.query(
    PREDICTIVE_SEARCH_QUERY,
    {
      variables: {
        // customize search options as needed
        limit,
        limitScope: 'EACH',
        term,
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
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').ActionFunctionArgs} ActionFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn */
/** @typedef {import('~/lib/search').PredictiveSearchReturn} PredictiveSearchReturn */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
