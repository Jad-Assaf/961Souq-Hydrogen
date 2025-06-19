import React, {useState, useEffect} from 'react';
import {
  InstantSearch,
  Hits,
  Configure,
  Pagination,
  useSearchBox,
  useNumericMenu,
} from 'react-instantsearch';
import {useLoaderData} from '@remix-run/react';
import {searchClient} from '~/components/StorefrontSearch';

export async function loader({request}) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  return {query};
}

function PriceFilter() {
  const {items, refine} = useNumericMenu({
    attribute: 'price',
    items: [
      {label: '$0–$50', start: 0, end: 50},
      {label: '$50–$100', start: 50, end: 100},
      {label: '$100+', start: 100},
    ],
  });

  return (
    <ul className="price-filter">
      {items.map((item) => (
        <li key={item.value}>
          <label>
            <input
              type="radio"
              name="price"
              onChange={() => refine(item.value)}
              checked={item.isRefined}
            />
            {item.label} ({item.count})
          </label>
        </li>
      ))}
    </ul>
  );
}

function CustomHit({hit}) {
  return (
    <a href={`/products/${hit.handle}`} className="product-card">
      {hit.image && (
        <img
          src={`${hit.image}&width=300`}
          alt={hit.name}
          className="as-hit-image"
          width={152}
          height={152}
        />
      )}
      <p className="product-title">
        {hit.title}
        {hit.variant_title &&
          hit.variant_title !== 'Default Title' &&
          ` – ${hit.variant_title}`}
      </p>
      <p className="search-result-description search-desc">SKU: {hit.sku}</p>
      <div className="product-price">
        {hit.price === 0 ? <p>Call For Price!</p> : <p>${hit.price}</p>}
        {hit.price !== 0 && hit.compare_at_price > 0 && (
          <p className="discountedPrice">${hit.compare_at_price}</p>
        )}
      </div>
    </a>
  );
}

function DebugQuery() {
  const {query} = useLoaderData();
  const {refine} = useSearchBox();

  useEffect(() => {
    if (query.trim() !== '') {
      refine(query);
    }
  }, [query, refine]);

  return null;
}

export default function SearchPage() {
  const {query} = useLoaderData();
  const trimmed = query.trim();

  return (
    <div className="search">
      <h1>Search Results {trimmed ? `for "${trimmed}"` : ''}</h1>

      {trimmed ? (
        <InstantSearch
          searchClient={searchClient}
          indexName="shopify_961_25products"
          // prevent any search until DebugQuery calls refine
          searchFunction={(helper) => {
            if (helper.state.query.trim()) {
              helper.search();
            }
          }}
        >
          <Configure hitsPerPage={100} />
          <DebugQuery />
          <Hits hitComponent={CustomHit} />
          <Pagination />
        </InstantSearch>
      ) : (
        <p>Please enter a search term to see results.</p>
      )}
    </div>
  );
}
