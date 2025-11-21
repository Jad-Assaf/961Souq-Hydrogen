// app/routes/search-test.jsx
import React from 'react';
import {json} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
// import searchTestStyles from '~/styles/search-test.css?url';
import {InstantSearchBar} from '~/components/InstantSearchBar';

const SEARCH_AND_PREDICTIVE_QUERY = `#graphql
  query SearchAndPredictive(
    $query: String!
    $limit: Int!
    $country: CountryCode
    $language: LanguageCode
    $searchAfter: String
    $searchBefore: String
    $searchFirst: Int
    $searchLast: Int
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      query: $query
      limit: $limit
      limitScope: EACH
      searchableFields: [
        TITLE
        PRODUCT_TYPE
        VARIANTS_TITLE
        VENDOR
        VARIANTS_SKU
      ]
    ) {
      products {
        id
        handle
        title
        availableForSale
        featuredImage {
          url
          altText
          width
          height
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
      collections {
        id
        handle
        title
        image {
          url
          altText
          width
          height
        }
      }
      pages {
        id
        handle
        title
      }
      articles {
        id
        handle
        title
      }
      queries {
        text
      }
    }
    search(
      query: $query
      types: [PRODUCT]
      first: $searchFirst
      last: $searchLast
      after: $searchAfter
      before: $searchBefore
    ) {
      edges {
        cursor
        node {
          __typename
          ... on Product {
            id
            handle
            title
            availableForSale
            featuredImage {
              url
              altText
              width
              height
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export async function loader({request, context}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim();

  if (!query) {
    return json({
      query: '',
      predictive: null,
      searchResults: null,
      pagination: null,
    });
  }

  const cursor = url.searchParams.get('cursor') || null;
  const direction = url.searchParams.get('direction') || 'forward';

  const {language, country} = storefront.i18n;
  const pageSize = 24;

  let searchAfter = null;
  let searchBefore = null;
  let searchFirst = pageSize;
  let searchLast = null;

  if (!cursor) {
    searchAfter = null;
    searchBefore = null;
    searchFirst = pageSize;
    searchLast = null;
  } else if (direction === 'prev') {
    searchAfter = null;
    searchBefore = cursor;
    searchFirst = null;
    searchLast = pageSize;
  } else {
    searchAfter = cursor;
    searchBefore = null;
    searchFirst = pageSize;
    searchLast = null;
  }

  const variables = {
    query,
    limit: 10,
    language,
    country,
    searchAfter,
    searchBefore,
    searchFirst,
    searchLast,
  };

  const data = await storefront.query(SEARCH_AND_PREDICTIVE_QUERY, {
    variables,
  });

  const searchResults = data.search;
  const edges = searchResults?.edges ?? [];
  const pageInfo = searchResults?.pageInfo ?? {};

  const startCursor = edges[0]?.cursor || null;
  const endCursor = edges[edges.length - 1]?.cursor || null;

  const pagination = {
    hasNextPage: Boolean(pageInfo.hasNextPage),
    hasPreviousPage: Boolean(pageInfo.hasPreviousPage),
    nextCursor: pageInfo.hasNextPage ? endCursor : null,
    prevCursor: pageInfo.hasPreviousPage ? startCursor : null,
    pageSize,
  };

  return json({
    query,
    predictive: data.predictiveSearch,
    searchResults,
    pagination,
  });
}

export default function SearchTestRoute() {
  const {query, predictive, searchResults, pagination} = useLoaderData();

  return (
    <div className="search-page">
      <div className="search-header">
        <h1 className="search-title">Search Results</h1>
      </div>

      {/* If you want the bar on the results page too, uncomment: */}
      {/* <InstantSearchBar initialQuery={query} action="/search" /> */}

      <SearchResultsGrid
        query={query}
        searchResults={searchResults}
        searchTerm={query}
        predictive={predictive}
        pagination={pagination}
      />
    </div>
  );
}

function SearchResultsGrid({
  query,
  searchResults,
  searchTerm,
  predictive,
  pagination,
}) {
  if (!searchTerm.trim() && !query) {
    return (
      <div className="search-empty-state">
        Start typing to see search results.
      </div>
    );
  }

  const hasProducts = Boolean(searchResults?.edges?.length);

  if (!hasProducts && !predictive) {
    if (!query) return null;
    return (
      <div className="search-results">
        <div className="search-empty-state">
          No products found for <strong>{query}</strong>.
        </div>
      </div>
    );
  }

  return (
    <div className="search-results">
      <SearchPageSuggestions predictive={predictive} query={query} />

      {hasProducts ? (
        <>
          <h2 className="search-results-heading">
            Products matching <span>"{query}"</span>
          </h2>
          <div className="search-results-grid">
            {searchResults.edges.map((edge) => {
              const product = edge.node;
              if (!product || product.__typename !== 'Product') return null;
              return <ProductCard key={product.id} product={product} />;
            })}
          </div>
          <SearchResultsPagination query={query} pagination={pagination} />
        </>
      ) : (
        <div className="search-empty-state">
          No products found for <strong>{query}</strong>.
        </div>
      )}
    </div>
  );
}

function SearchPageSuggestions({predictive, query}) {
  if (!predictive) return null;

  const normalizedQuery = (query || '').trim().toLowerCase();
  const queries =
    predictive.queries?.filter(
      (item) => item.text.trim().toLowerCase() !== normalizedQuery,
    ) || [];

  const hasQueries = queries.length > 0;
  const hasCollections = predictive.collections?.length > 0;

  if (!hasQueries && !hasCollections) return null;

  return (
    <section className="search-page-suggestions">
      {hasQueries && (
        <div className="search-page-suggestions-row">
          <p className="search-page-suggestions-label">Suggestions</p>
          <ul className="suggestions-list suggestions-list--pills">
            {queries.map((item) => (
              <li key={item.text} className="suggestion-pill-item">
                <a
                  href={`/search?q=${encodeURIComponent(item.text)}`}
                  className="suggestion-pill-link"
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasCollections && (
        <div className="search-page-collections">
          <p className="search-page-collections-heading">
            Collections matching "{query}"
          </p>
          <ul className="suggestions-list suggestions-list--grid">
            {predictive.collections.map((collection) => (
              <li key={collection.id} className="suggestion-card">
                <a
                  href={`/collections/${collection.handle}`}
                  className="suggestion-card-link"
                >
                  {collection.image?.url && (
                    <img
                      src={`${collection.image.url}&width=200`}
                      alt={collection.image.altText || collection.title}
                      className="suggestion-card-image"
                      loading="lazy"
                    />
                  )}
                  <span className="suggestion-card-title">
                    {collection.title}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function SearchResultsPagination({query, pagination}) {
  if (!pagination) return null;

  const {hasNextPage, hasPreviousPage, nextCursor, prevCursor} = pagination;

  if (!hasNextPage && !hasPreviousPage) return null;

  const buildUrl = (cursor, direction) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (cursor) params.set('cursor', cursor);
    if (direction) params.set('direction', direction);
    return `/search?${params.toString()}`;
  };

  return (
    <div className="search-pagination">
      <div className="search-pagination-inner">
        {hasPreviousPage ? (
          <a
            href={buildUrl(prevCursor, 'prev')}
            className="search-pagination-button"
          >
            ← Previous
          </a>
        ) : (
          <span className="search-pagination-button search-pagination-button--disabled">
            ← Previous
          </span>
        )}

        {hasNextPage ? (
          <a
            href={buildUrl(nextCursor, 'next')}
            className="search-pagination-button"
          >
            Next →
          </a>
        ) : (
          <span className="search-pagination-button search-pagination-button--disabled">
            Next →
          </span>
        )}
      </div>
    </div>
  );
}

function ProductCard({product}) {
  const image = product.featuredImage;
  const minVariant = product.priceRange?.minVariantPrice;

  return (
    <a href={`/products/${product.handle}`} className="search-result-card">
      {image?.url && (
        <div className="search-result-image-wrapper">
          <img
            src={`${image.url}&width=300`}
            alt={image.altText || product.title}
            className="search-result-image"
            loading="lazy"
          />
        </div>
      )}
      <div className="search-result-info">
        <h3 className="search-result-title">{product.title}</h3>
        {minVariant && (
          <p className="search-result-price">{formatMoney(minVariant)}</p>
        )}
      </div>
    </a>
  );
}

/**
 * Formats money or returns "Call for price" when amount is 0 / invalid.
 */
function formatMoney(price) {
  if (!price) return 'Call for price';
  const {amount, currencyCode} = price;
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    return 'Call for price';
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode || 'USD',
  }).format(value);
}
