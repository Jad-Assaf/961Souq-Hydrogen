import React from 'react';
import {json} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {
  getTypesenseSearchClientFromEnv,
  TYPESENSE_PRODUCTS_COLLECTION,
} from '~/lib/typesense.server';

const PER_PAGE = 50;

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [
    {title: '961Souq | Search'},
    {name: 'robots', content: 'noindex, nofollow'},
  ];
};

/**
 * Loader for `/search`.
 * Adds pagination (50 products per page) using `?page=`.
 */
export async function loader({request, context}) {
  const url = new URL(request.url);
  const originalQ = (url.searchParams.get('q') || '').trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));

  function expandNumericTokens(original) {
    const trimmed = original.trim();
    if (!trimmed) return '';
    const terms = trimmed.split(/\s+/);
    const expanded = [];
    for (const term of terms) {
      if (/^\d+$/.test(term)) {
        expanded.push(term);
        expanded.push(`${term}gb`);
      } else {
        expanded.push(term);
      }
    }
    return expanded.join(' ');
  }

  const q = expandNumericTokens(originalQ);

  if (!q) {
    return json({query: '', hits: [], found: 0, page: 1, perPage: PER_PAGE});
  }

  const client = getTypesenseSearchClientFromEnv(context.env);

  const searchParams = {
    q,
    query_by: 'title,sku,handle,tags',
    query_by_weights: '10,10,5,2',
    per_page: PER_PAGE,
    page,
    prefix: true,
    infix: 'always,fallback,always,always',
    num_typos: '2,1,0,0',
    min_len_1typo: 5,
    min_len_2typo: 8,
    typo_tokens_threshold: 1,
    enable_typos_for_numerical_tokens: false,
    enable_typos_for_alpha_numerical_tokens: false,
    drop_tokens_threshold: 0,
    exhaustive_search: true,
    sort_by: '_text_match:desc,price:desc',
    prioritize_exact_match: true,
    prioritize_token_position: true,
    prioritize_num_matching_fields: true,
    text_match_type: 'max_score',
    highlight_full_fields: 'title',
    filter_by: 'status:=active',
  };

  try {
    const result = await client
      .collections(TYPESENSE_PRODUCTS_COLLECTION)
      .documents()
      .search(searchParams);

    // Supports normal + grouped responses (if group_by ever gets enabled)
    const rawHits =
      result.hits ||
      (result.grouped_hits
        ? result.grouped_hits.flatMap((g) => g.hits || [])
        : []);

    const hits =
      rawHits.map(({document}) => ({
        id: document.id,
        title: document.title,
        handle: document.handle,
        vendor: document.vendor,
        price: document.price,
        image: document.image,
        url: document.url,
        available: document.available,
      })) || [];

    return json({
      query: originalQ,
      hits,
      found: result.found ?? hits.length,
      page,
      perPage: PER_PAGE,
    });
  } catch (error) {
    console.error('Typesense search error:', error);
    throw json({error: 'Search failed'}, {status: 500});
  }
}

export default function SearchRoute() {
  const {query, hits, found, page, perPage} = useLoaderData();

  return (
    <div className="search-page">
      <style>{`
        .search-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 22px 0 8px;
          padding: 10px 0;
        }

        .search-pagination-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 110px;
          height: 40px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(64, 137, 255, 0.43);
          background: rgba(255, 255, 255, 1);
          color: #000;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.2px;
          transition: transform 140ms ease, background 140ms ease, border-color 140ms ease, opacity 140ms ease;
          user-select: none;
        }

        .search-pagination-link:hover {
          background: rgba(255, 255, 255, 0.10);
          border-color: rgba(255, 255, 255, 0.22);
          transform: translateY(-1px);
        }

        .search-pagination-link:active {
          transform: translateY(0px);
          background: rgba(255, 255, 255, 0.08);
        }

        .search-pagination-link--disabled {
          opacity: 0.45;
          cursor: not-allowed;
          pointer-events: none;
        }

        .search-pagination-status {
          font-size: 13px;
          color: #000;
          padding: 0 4px;
          text-align: center;
          white-space: nowrap;
        }

        @media (max-width: 480px) {
          .search-pagination {
            gap: 10px;
          }
          .search-pagination-link {
            min-width: 96px;
            height: 38px;
            padding: 0 12px;
            font-size: 13px;
          }
          .search-pagination-status {
            font-size: 12px;
          }
        }
      `}</style>

      <div className="search-header">
        <h1 className="search-title">Search Results</h1>
      </div>

      <SearchResultsGrid
        query={query}
        hits={hits}
        found={found}
        page={page}
        perPage={perPage}
      />
    </div>
  );
}

function SearchResultsGrid({query, hits, found, page, perPage}) {
  const trimmed = query?.trim();
  if (!trimmed) {
    return (
      <div className="search-empty-state">
        Start typing to see search results.
      </div>
    );
  }
  if (!hits.length) {
    return (
      <div className="search-results">
        <div className="search-empty-state">
          No products found for <strong>{query}</strong>.
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil((found || 0) / perPage));
  const makeHref = (p) => `/search?q=${encodeURIComponent(query)}&page=${p}`;

  return (
    <div className="search-results">
      <h2 className="search-results-heading">
        Products matching <span>"{query}"</span> ({found})
      </h2>

      <div className="search-results-grid">
        {hits.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="search-pagination">
          {page > 1 ? (
            <a className="search-pagination-link" href={makeHref(page - 1)}>
              Previous
            </a>
          ) : (
            <span className="search-pagination-link search-pagination-link--disabled">
              Previous
            </span>
          )}

          <span className="search-pagination-status">
            Page {page} of {totalPages}
          </span>

          {page < totalPages ? (
            <a className="search-pagination-link" href={makeHref(page + 1)}>
              Next
            </a>
          ) : (
            <span className="search-pagination-link search-pagination-link--disabled">
              Next
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ProductCard({product}) {
  return (
    <a
      href={product.url || `/products/${product.handle}`}
      className="search-result-card"
    >
      {product.image && (
        <div className="search-result-image-wrapper">
          <img
            src={`${product.image}&width=300`}
            alt={product.title}
            className="search-result-image"
            loading="lazy"
          />
        </div>
      )}
      <div className="search-result-info">
        <h3 className="search-result-title">{product.title}</h3>
        {(() => {
          const priceNum =
            typeof product.price === 'number'
              ? product.price
              : Number(product.price);

          if (!Number.isFinite(priceNum)) return null;

          if (priceNum === 0) {
            return <p className="search-result-price">Call for price</p>;
          }

          return <p className="search-result-price">${priceNum.toFixed(2)}</p>;
        })()}
      </div>
    </a>
  );
}
