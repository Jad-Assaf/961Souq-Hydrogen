import React from 'react';
import {Analytics} from '@shopify/hydrogen';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import '~/styles/worker-search.css';
import {WorkerSearchBox} from '~/components/WorkerSearchBox';
import {
  buildCustomSearchPath,
  createEmptySearchResponse,
  formatSearchPrice,
  normalizeSearchResponse,
  SEARCH_RESULTS_LIMIT,
  withSearchImageWidth,
} from '~/lib/customSearch';

export const meta = () => {
  return [
    {title: '961Souq | Test Search'},
    {name: 'robots', content: 'noindex, nofollow'},
  ];
};

export async function loader({request}) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim() ?? '';

  if (!query) {
    return json({
      query: '',
      result: createEmptySearchResponse(''),
    });
  }

  const proxyUrl = new URL(
    buildCustomSearchPath(query, {
      limit: SEARCH_RESULTS_LIMIT,
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

    return json({
      query,
      result: normalizeSearchResponse(await response.json(), query),
    });
  } catch (error) {
    console.error('Test search route error', error);
    return json({
      query,
      result: createEmptySearchResponse(query),
    });
  }
}

export default function TestSearchRoute() {
  const {query, result} = useLoaderData();
  const trimmedQuery = query?.trim();
  const effectiveQuery = result?.query?.trim() || trimmedQuery;
  const wasCorrected =
    trimmedQuery &&
    effectiveQuery &&
    trimmedQuery.toLowerCase() !== effectiveQuery.toLowerCase();

  return (
    <div className="worker-search-page">
      <div className="worker-search-page__inner">
        <header className="worker-search-page__header">
          <p className="worker-search-page__eyebrow">
            Cloudflare Worker Search
          </p>
          <h1 className="worker-search-page__title">Test Search</h1>
          <p className="worker-search-page__subtitle">
            Isolated search page using the server-side `/api/custom-search`
            proxy.
          </p>
        </header>

        <WorkerSearchBox
          action="/test-search"
          initialQuery={trimmedQuery || ''}
          placeholder="Search products"
        />

        {!trimmedQuery ? (
          <EmptyState />
        ) : result.products.length === 0 ? (
          <NoResultsState
            query={effectiveQuery}
            originalQuery={wasCorrected ? trimmedQuery : ''}
            suggestions={result.suggestions}
          />
        ) : (
          <ResultsGrid
            query={effectiveQuery}
            originalQuery={wasCorrected ? trimmedQuery : ''}
            result={result}
          />
        )}

        {trimmedQuery ? (
          <Analytics.SearchView data={{searchTerm: effectiveQuery}} />
        ) : null}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="worker-search-page__empty">
      <h2>Start with at least 2 characters</h2>
      <p>
        Try a model name, brand, or product family such as iPhone or AirPods.
      </p>
    </section>
  );
}

function NoResultsState({query, originalQuery, suggestions}) {
  return (
    <section className="worker-search-page__empty">
      <h2>No products found for "{query}"</h2>
      {originalQuery ? <p>Corrected from "{originalQuery}".</p> : null}
      <p>
        Check spelling, shorten the phrase, or try a related product family.
      </p>
      {suggestions?.length ? (
        <div className="worker-search-page__suggestions">
          {suggestions.map((suggestion) => (
            <Link
              key={suggestion}
              to={`/test-search?q=${encodeURIComponent(suggestion)}`}
              className="worker-search-page__suggestion-link"
            >
              {suggestion}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ResultsGrid({query, originalQuery, result}) {
  return (
    <section className="worker-search-page__results">
      <div className="worker-search-page__results-head">
        <h2>
          {result.total} result{result.total === 1 ? '' : 's'} for "{query}"
        </h2>
        {originalQuery ? <p>Corrected from "{originalQuery}".</p> : null}
        {result.tookMs ? <p>Response time: {result.tookMs} ms</p> : null}
      </div>

      <div className="worker-search-page__grid">
        {result.products.map((product) => {
          const price = formatSearchPrice(product.price);
          const href = product.url || `/products/${product.handle}`;
          const availabilityLabel =
            product.availableForSale === false
              ? 'Out of stock'
              : product.availableForSale === true
              ? 'In stock'
              : null;

          return (
            <Link
              key={product.id}
              to={href}
              className="worker-search-page__card"
            >
              <div className="worker-search-page__card-media">
                {product.image?.url ? (
                  <img
                    src={withSearchImageWidth(product.image.url, 300)}
                    alt={product.image.altText || product.title}
                    className="worker-search-page__card-image"
                    loading="lazy"
                  />
                ) : (
                  <span className="worker-search-page__card-fallback">
                    No image
                  </span>
                )}
              </div>

              <div className="worker-search-page__card-body">
                <h3>{product.title}</h3>
                {product.vendor ? (
                  <p className="worker-search-page__vendor">{product.vendor}</p>
                ) : null}
                {price ? (
                  <p className="worker-search-page__price">{price}</p>
                ) : null}
                {availabilityLabel ? (
                  <span
                    className={`worker-search-page__availability ${
                      product.availableForSale === false ? 'is-out' : 'is-in'
                    }`}
                  >
                    {availabilityLabel}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
