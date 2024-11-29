import { json } from '@shopify/remix-oxygen';
import { useLoaderData, useLocation, useNavigate, useSearchParams } from '@remix-run/react';
import { getPaginationVariables, Analytics } from '@shopify/hydrogen';
import { SearchForm } from '~/components/SearchForm';
import { SearchResults } from '~/components/SearchResults';
import { FiltersDrawer } from '~/modules/drawer-filter'; // Import FiltersDrawer
import { getAppliedFilterLink } from '~/lib/filter';
import { useState } from 'react';

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
  const term = url.searchParams.get('q') || '';
  const filters = [];

  // Parse filters
  for (const [key, value] of url.searchParams.entries()) {
    if (key.startsWith('filter_')) {
      try {
        filters.push({ [key.replace('filter_', '')]: JSON.parse(value) });
      } catch (err) {
        console.warn(`Invalid filter value for key "${key}":`, err);
      }
    }
  }

  try {
    const { errors, data } = await context.storefront.query(SEARCH_QUERY, {
      variables: { term, filters },
    });

    if (errors) {
      console.error('GraphQL Errors:', errors);
      throw new Error('Error fetching search results');
    }

    if (!data.products || !data.products.nodes.length) {
      return json({ term, result: null, error: 'No products found' });
    }

    return json({
      term,
      result: {
        products: data.products.nodes,
        filters: data.products.filters,
      },
    });
  } catch (error) {
    console.error('Loader Error:', error);
    return json({ term, result: null, error: error.message });
  }
}

/**
 * Renders the /search route
 */
export default function SearchPage() {
  const { term, result, error } = useLoaderData();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle layout responsiveness
  const [numberInRow, setNumberInRow] = useState(3);
  const handleLayoutChange = (number) => setNumberInRow(number);

  // Handle filter removal
  const handleFilterRemove = (filter) => {
    const newUrl = getAppliedFilterLink(filter, searchParams, location);
    navigate(newUrl);
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="search-page">
      <h1>Search Results for "{term}"</h1>

      <div className="flex flex-col lg:flex-row">
        {/* Filters Drawer */}
        <div className="w-[220px]">
          <FiltersDrawer
            filters={result?.filters || []} // Filters returned from loader
            appliedFilters={[]} // Use appropriate applied filters logic if needed
            onRemoveFilter={handleFilterRemove}
          />
        </div>

        {/* Search Results */}
        <div className="flex-1">
          {!term || !result?.products?.length ? (
            <SearchResults.Empty />
          ) : (
            <SearchResults result={result.products} term={term}>
              {({ products }) => (
                <div className={`products-grid grid-cols-${numberInRow}`}>
                  {products.map((product) => (
                    <SearchResults.Products key={product.id} product={product} />
                  ))}
                </div>
              )}
            </SearchResults>
          )}
        </div>
      </div>

      {/* Analytics */}
      <Analytics.SearchView data={{ searchTerm: term, searchResults: result }} />
    </div>
  );
}
/**
 * Regular search query and fragments
 * (adjust as needed)
 */
const SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment SearchProduct on Product {
    id
    title
    vendor
    featuredImage {
      url
      altText
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
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
const SEARCH_QUERY = `#graphql
  query SearchWithFilters(
    $term: String!,
    $filters: [ProductFilter!],
    $first: Int = 20
  ) {
    products(
      first: $first,
      query: $term,
      filters: $filters
    ) {
      nodes {
        id
        title
        vendor
        productType
        featuredImage {
          url
          altText
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
      filters {
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
