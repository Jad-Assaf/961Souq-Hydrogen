import React, {useState, useEffect} from 'react';
import {
  InstantSearch,
  Hits,
  Configure,
  Pagination,
  RefinementList,
  useSearchBox,
  useNumericMenu,
  SortBy,
} from 'react-instantsearch';
import {useLoaderData} from '@remix-run/react';
import { algoliasearch } from 'algoliasearch';

export async function loader({request}) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  return {query};
}

const searchClient = algoliasearch(
  '4AHYIG5H6V',
  'db1477d824985f7d0dab8891fa13a5bd'
);

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
        <img src={`${hit.image}&width=300`} alt={hit.name} className="as-hit-image" width={152} height={152} />
      )}
      <p className="product-title">
        {hit.title}
        {hit.variant_title && hit.variant_title !== 'Default Title'
          ? ` – ${hit.variant_title}`
          : ''}
      </p>
      <p className="search-result-description search-desc">SKU: {hit.sku}</p>
      <div className="product-price">
        {hit.price === 0 ? (
          <p>Call For Price!</p>
        ) : (
          hit.price && <p>${hit.price}</p>
        )}
        {hit.price !== 0 && hit.compare_at_price > 0 && (
          <p className="discountedPrice">${hit.compare_at_price}</p>
        )}
      </div>
    </a>
  );
}

// Optional: to debug query flow
function DebugQuery() {
  const {query} = useLoaderData();
  const {refine} = useSearchBox();
  useEffect(() => {
    refine(query);
  }, [query, refine]);
  return null;
}

export default function SearchPage() {
  const {query} = useLoaderData();

  return (
    <div className="search">
      <h1>Search Results for "{query}"</h1>
      <InstantSearch
        searchClient={searchClient}
        indexName="shopify_961_25products"
      >
        <Configure hitsPerPage={100} />
        <DebugQuery />
        {/* <RefinementList attribute="vendor" /> */}
        <Hits hitComponent={CustomHit} />
        <Pagination />
      </InstantSearch>
    </div>
  );
}
