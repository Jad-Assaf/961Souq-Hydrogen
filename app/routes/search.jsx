import React from 'react';
import {Analytics} from '@shopify/hydrogen';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import {WorkerSearchBox} from '~/components/WorkerSearchBox';
import {
  buildCustomSearchPath,
  createEmptySearchResponse,
  formatSearchPrice,
  normalizeSearchResponse,
  SEARCH_RESULTS_LIMIT,
} from '~/lib/customSearch';

function availabilityPillStyle(isAvailable) {
  return {
    display: 'inline-flex',
    width: 'fit-content',
    padding: '0.2rem 0.5rem',
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: 600,
    background: isAvailable
      ? 'rgba(22, 163, 74, 0.12)'
      : 'rgba(239, 68, 68, 0.1)',
    color: isAvailable ? '#166534' : '#b91c1c',
  };
}

export const meta = () => {
  return [
    {title: '961Souq | Search'},
    {name: 'robots', content: 'noindex, nofollow'},
  ];
};

export async function loader({request}) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim() ?? '';
  const page = Math.max(
    1,
    Number.parseInt(url.searchParams.get('page') || '1', 10) || 1,
  );

  if (!query) {
    return json({
      query: '',
      page: 1,
      result: createEmptySearchResponse(''),
    });
  }

  const proxyUrl = new URL(
    buildCustomSearchPath(query, {
      limit: SEARCH_RESULTS_LIMIT,
      page,
      available: true,
    }),
    request.url,
  );

  try {
    const response = await fetch(proxyUrl.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Search proxy responded with ${response.status}`);
    }

    const result = normalizeSearchResponse(await response.json(), query);

    return json({
      query,
      page,
      result,
    });
  } catch (error) {
    console.error('[search-route] loader error', {query, error});
    return json({
      query,
      page,
      result: createEmptySearchResponse(query),
    });
  }
}

export default function SearchRoute() {
  const {query, page, result} = useLoaderData();
  const trimmedQuery = query?.trim();
  const effectiveQuery = result?.query?.trim() || trimmedQuery;
  const wasCorrected =
    trimmedQuery &&
    effectiveQuery &&
    trimmedQuery.toLowerCase() !== effectiveQuery.toLowerCase();

  return (
    <div className="search-page">
      <div className="search-header">
        <h1 className="search-title">Search Results</h1>
      </div>

      {/* <WorkerSearchBox
        action="/search"
        initialQuery={trimmedQuery || ''}
        placeholder="Search products"
      /> */}

      {!trimmedQuery ? (
        <div className="search-empty-state">Start typing to see search results.</div>
      ) : result.products.length === 0 ? (
        <div className="search-results">
          <div className="search-empty-state">
            No products found for <strong>{effectiveQuery}</strong>.
            {wasCorrected ? (
              <>
                {' '}
                Corrected from <strong>{query}</strong>.
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <SearchResultsGrid
          query={effectiveQuery}
          originalQuery={wasCorrected ? query : ''}
          page={page}
          products={result.products}
        />
      )}

      {trimmedQuery ? (
        <Analytics.SearchView data={{searchTerm: effectiveQuery}} />
      ) : null}
    </div>
  );
}

function SearchResultsGrid({query, originalQuery, page, products}) {
  const hasNextPage = products.length === SEARCH_RESULTS_LIMIT;
  const previousPageHref =
    page > 1 ? `/search?q=${encodeURIComponent(query)}&page=${page - 1}` : null;
  const nextPageHref = `/search?q=${encodeURIComponent(query)}&page=${page + 1}`;

  return (
    <div className="search-results">
      <h2 className="search-results-heading">
        Products matching <span>"{query}"</span> on page {page}
      </h2>
      {originalQuery ? (
        <p className="search-correction-note">
          Corrected from "{originalQuery}".
        </p>
      ) : null}

      <div className="search-results-grid">
        {products.map((product) => {
          const price = formatSearchPrice(product.price);
          const href = product.url || `/products/${product.handle}`;
          const availabilityLabel =
            product.availableForSale === false
              ? 'Out of stock'
              : product.availableForSale === true
                ? 'In stock'
                : null;

          return (
            <Link key={product.id} to={href} className="search-result-card">
              <div className="search-result-image-wrapper">
                {product.image?.url ? (
                  <img
                    src={product.image.url}
                    alt={product.image.altText || product.title}
                    className="search-result-image"
                    loading="lazy"
                  />
                ) : (
                  <span className="search-result-image">No image</span>
                )}
              </div>

              <div className="search-result-info">
                <h3 className="search-result-title">{product.title}</h3>
                {product.vendor ? (
                  <p style={{margin: '0 0 0.35rem', color: '#64748b'}}>
                    {product.vendor}
                  </p>
                ) : null}
                {price ? <p className="search-result-price">{price}</p> : null}
                {availabilityLabel ? (
                  <span
                    style={availabilityPillStyle(
                      product.availableForSale !== false,
                    )}
                  >
                    {availabilityLabel}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="search-pagination">
        <div className="search-pagination-inner">
          {previousPageHref ? (
            <Link to={previousPageHref} className="search-pagination-button">
              Previous
            </Link>
          ) : (
            <span className="search-pagination-button search-pagination-button--disabled">
              Previous
            </span>
          )}
          <span className="search-page-number">Page {page}</span>
          {hasNextPage ? (
            <Link to={nextPageHref} className="search-pagination-button">
              Next
            </Link>
          ) : (
            <span className="search-pagination-button search-pagination-button--disabled">
              Next
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
