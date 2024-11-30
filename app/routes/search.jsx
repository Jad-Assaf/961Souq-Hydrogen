import { json } from '@shopify/remix-oxygen';
import { useLoaderData } from '@remix-run/react';
import { getPaginationVariables, Analytics } from '@shopify/hydrogen';
import { SearchForm } from '~/components/SearchForm';
import { SearchResults } from '~/components/SearchResults';
import { getEmptyPredictiveSearchResult } from '~/lib/search';
import { useRef } from 'react';
import { useSearchParams, useNavigate } from '@remix-run/react';


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
  const url = new URL(request.url);
  const isPredictive = url.searchParams.has('predictive');

  // Extract filters from URL
  const filters = [];
  for (const [key, value] of url.searchParams.entries()) {
    if (key.startsWith('filter_')) {
      const filterKey = key.replace('filter_', '');
      filters.push({ [filterKey]: value });
    }
  }

  const searchPromise = isPredictive
    ? predictiveSearch({ request, context, filters })
    : regularSearch({ request, context, filters });

  searchPromise.catch((error) => {
    console.error(error);
    return { term: '', result: null, error: error.message };
  });

  return json(await searchPromise);
}

/**
 * Renders the /search route
 */
export default function SearchPage() {
  const { products, term } = useLoaderData();
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

  return (
    <div className="search">
      <h1>Search Results</h1>
      <SearchForm ref={formRef} onSubmit={handleFormSubmit} />

      {!term || !products.edges.length ? (
        <p>No results found</p>
      ) : (
        <div className="search-result">
          <Pagination connection={products}>
            {({ nodes = [], isLoading, NextLink, PreviousLink }) => {
              const ItemsMarkup = nodes.map((product) => {
                const productUrl = `/products/${product.handle}`;

                return (
                  <div className="search-results-item product-card" key={product.id}>
                    <Link
                      prefetch="intent"
                      to={productUrl}
                      className="collection-product-link"
                    >
                      {product.variants.nodes[0]?.image && (
                        <Image
                          data={product.variants.nodes[0].image}
                          alt={product.title}
                          width={150}
                        />
                      )}
                      <div className="search-result-txt">
                        <p className="product-description">{product.title}</p>
                        <small className="price-container">
                          <Money data={product.variants.nodes[0].price} />
                        </small>
                      </div>
                    </Link>
                  </div>
                );
              });

              return (
                <div>
                  <div className="view-more">
                    <PreviousLink
                      to={(params) => {
                        const newParams = new URLSearchParams(params);
                        newParams.set('after', products.pageInfo?.startCursor || '');
                        return `/search?${newParams.toString()}`;
                      }}
                    >
                      {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
                    </PreviousLink>
                  </div>
                  <div className="search-result-container">{ItemsMarkup}</div>
                  <div className="view-more">
                    <NextLink
                      to={(params) => {
                        const newParams = new URLSearchParams(params);
                        newParams.set('after', products.pageInfo?.endCursor || '');
                        return `/search?${newParams.toString()}`;
                      }}
                    >
                      {isLoading ? 'Loading...' : <span>Load more ↓</span>}
                    </NextLink>
                  </div>
                </div>
              );
            }}
          </Pagination>
        </div>
      )}
    </div>
  );
}

function FilterUI() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
  );
}

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
async function regularSearch({ request, context, filters }) {
  const { storefront } = context;
  const url = new URL(request.url);
  const term = url.searchParams.get('q') || '';

  // Build the filter query dynamically
  const filterQueryParts = filters.map(
    (filter) => `${Object.keys(filter)[0]}:${Object.values(filter)[0]}`
  );
  const query = `${term} ${filterQueryParts.join(' AND ')}`.trim();

  try {
    const variables = {
      term: query,
      first: 24, // Number of items per page
    };

    const { products } = await storefront.query(SEARCH_QUERY, { variables });

    // Ensure `products.edges` and `products.pageInfo` exist
    if (!products || !products.edges || !products.pageInfo) {
      throw new Error('Invalid products data structure');
    }

    return {
      term,
      result: { products },
    };
  } catch (error) {
    console.error('Error during regular search:', error);
    return { term, result: null, error: error.message };
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
