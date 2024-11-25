import { defer, redirect, json } from '@shopify/remix-oxygen';
import { useLoaderData, Link, useSearchParams, useLocation, useNavigate } from '@remix-run/react';
import {
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import { FiltersDrawer } from '../modules/drawer-filter'; // Assuming you have this component
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection'; // Your existing component
import { Analytics } from '@shopify/hydrogen';
import React, { useEffect, useState } from 'react';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{ title: `Hydrogen | Search` }];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader({ request, context }) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const paginationVariables = getPaginationVariables(request, { pageBy: 50 });

  // Extract filters and sorting parameters from the URL
  const sort = url.searchParams.get('sort') || 'newest';
  const filters = []; // Initialize with empty filters

  // Fetch search results
  const searchResults = await context.storefront.query(SEARCH_QUERY, {
    variables: {
      query,
      filters,
      sortKey: getSortKey(sort),
      reverse: isReverseSort(sort),
      ...paginationVariables,
    },
  });

  if (!searchResults || !searchResults.products) {
    throw redirect('/search');
  }

  return defer({ searchResults: searchResults.products });
}

/**
 * Renders the /search route
 */
export default function SearchPage() {
  const { searchResults } = useLoaderData();
  const [filters, setFilters] = useState([]);
  const [numberInRow, setNumberInRow] = useState(5);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const newUrl = getAppliedFilterLink(newFilters, searchParams, location);
    navigate(newUrl);
  };

  // Ensure searchResults.nodes is defined before filtering
  const filteredProducts = (searchResults.nodes || []).filter(product => {
    return filters.every(filter => {
      // Example filter logic; adjust according to your filter structure
      return product.variants.some(variant => variant.availableForSale); // Example: check if any variant is available
    });
  });

  // Sort products
  const sortedProducts = React.useMemo(() => {
    return filteredProducts.sort((a, b) => {
      // Implement sorting logic based on your requirements
      const aPrice = a.variants[0]?.price.amount || 0;
      const bPrice = b.variants[0]?.price.amount || 0;
      return aPrice - bPrice; // Sort by price low to high
    });
  }, [filteredProducts]);

  return (
    <div className="search">
      <h1>Search Results</h1>

      <FiltersDrawer
        filters={[]} // Pass your filter options here
        appliedFilters={filters}
        onRemoveFilter={handleFilterChange}
      />

      <div className="flex-1 mt-[116px]">
        <PaginatedResourceSection
          connection={{
            nodes: sortedProducts,
            // Add pagination info here if necessary
          }}
          resourcesClassName="products-grid"
        >
          {({ node: product }) => (
            <div key={product.id}>
              <Link to={`/products/${product.handle}`}>
                <Image src={product.images[0]?.url} alt={product.images[0]?.altText} />
                <h4>{product.title}</h4>
                <p>
                  <Money money={product.variants[0].price} />
                </p>
              </Link>
            </div>
          )}
        </PaginatedResourceSection>
      </div>

      <Analytics.SearchView data={{ searchTerm: searchParams.get('q'), searchResults }} />
    </div>
  );
}

/**
 * Function to get the applied filter link
 * @param {Array} filters
 * @param {URLSearchParams} searchParams
 * @param {Location} location
 * @returns {string} New URL with applied filters
 */
function getAppliedFilterLink(filters, searchParams, location) {
  const newParams = new URLSearchParams(searchParams);
  // Update the filters in the URL
  // Add logic to handle filter parameters
  return `${location.pathname}?${newParams.toString()}`;
}

/**
 * Function to determine sort key
 * @param {string} sort
 * @returns {string} Sort key for GraphQL query
 */
function getSortKey(sort) {
  switch (sort) {
    case 'price':
      return 'PRICE';
    case 'newest':
    default:
      return 'CREATED_AT';
  }
}

/**
 * Function to determine if sort should be reversed
 * @param {string} sort
 * @returns {boolean} True if sort should be reversed
 */
function isReverseSort(sort) {
  return sort === 'price-desc';
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

const SEARCH_QUERY = `#graphql
  query RegularSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $term: String!
    $startCursor: String
    $filters: [ProductFilter!],
    $sortKey: ProductSortKeys,
    $reverse: Boolean,
    $after: String,
  ) @inContext(country: $country, language: $language) {
    products(first: $first, after: $after, query: $term, filters: $filters, sortKey: $sortKey, reverse: $reverse) {
      nodes {
        id
        title
        handle
        images {
          url
          altText
        }
        variants {
          id
          price {
            amount
            currencyCode
          }
          availableForSale
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
`;

/**
 * Regular search fetcher
 * @param {Pick<
 *   LoaderFunctionArgs,
 *   'request' | 'context'
 * >}
 * @return {Promise<RegularSearchReturn>}
 */
async function regularSearch({ request, context }) {
  const { storefront } = context;
  const url = new URL(request.url);
  const variables = getPaginationVariables(request, { pageBy: 24 });
  const term = String(url.searchParams.get('q') || '');

  // Search articles, pages, and products for the `q` term
  const { errors, ...items } = await storefront.query(SEARCH_QUERY, {
    variables: { ...variables, term },
  });

  if (!items) {
    throw new Error('No search data returned from Shopify API');
  }

  const total = Object.values(items).reduce(
    (acc, { nodes }) => acc + nodes.length,
    0,
  );

  const error = errors
    ? errors.map(({ message }) => message).join(', ')
    : undefined;

  return { type: 'regular', term, error, result: { total, items } };
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
