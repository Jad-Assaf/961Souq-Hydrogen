import { json } from '@shopify/remix-oxygen';
import { useLoaderData, useSearchParams, useNavigate, Link } from '@remix-run/react';
import { getPaginationVariables, Analytics, Money, Image } from '@shopify/hydrogen';
import { SearchForm } from '~/components/SearchForm';
import { SearchResults } from '~/components/SearchResults';
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
  console.log('Filter Query:', filterQuery); // Debugging

  const isPredictive = searchParams.has('predictive');
  const searchPromise = isPredictive
    ? predictiveSearch({ request, context })
    : regularSearch({ request, context, filterQuery });

  searchPromise.catch((error) => {
    console.error('Search Error:', error);
    return { term: '', result: null, error: error.message };
  });

  const result = await searchPromise;
  console.log('Search Result:', result); // Debugging
  return json(result);
}

/**
 * Renders the /search route
 */
export default function SearchPage() {
  const { type, term, result, error } = useLoaderData();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const searchInput = formRef.current.querySelector('input[name="q"]');
    if (searchInput) {
      const query = searchInput.value;
      const modifiedQuery = query.split(' ').map((word) => word + '*').join(' ');
      window.location.href = `/search?q=${encodeURIComponent(modifiedQuery)}`;
    }
  };

  const handleFilterChange = (filterKey, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(`filter_${filterKey}`, value);
    } else {
      params.delete(`filter_${filterKey}`);
    }
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="search">
      <h1>Search Results</h1>
      <SearchForm ref={formRef} onSubmit={handleFormSubmit} />

      {/* Filters */}
      <div className="filters">
        <label>
          Vendor:
          <select onChange={(e) => handleFilterChange('vendor', e.target.value)}>
            <option value="">All</option>
            <option value="apple">Apple</option>
            <option value="samsung">Samsung</option>
          </select>
        </label>
        <label>
          Price:
          <select onChange={(e) => handleFilterChange('price', e.target.value)}>
            <option value="">All</option>
            <option value=">100">Over $100</option>
            <option value="<100">Under $100</option>
          </select>
        </label>
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
    products(first: 10, query: $filterQuery) {
      edges {
        node {
          id
          title
          vendor
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
      sortKey: RELEVANCE,
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
  const limit = Number(url.searchParams.get('limit') || 10);
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
