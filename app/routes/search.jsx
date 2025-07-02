import React, {useState, useEffect} from 'react';
import {useLoaderData} from '@remix-run/react';
import {useSearch} from '../lib/searchContext.jsx';

export async function loader({request}) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  return {query};
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

function SearchResults() {
  const {searchResults, isLoading, currentQuery, searchInput, setInitialQuery} =
    useSearch();
  const {query} = useLoaderData();
  const trimmed = query.trim();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // initial‐load trigger
  useEffect(() => {
    if (trimmed && !currentQuery) {
      setInitialQuery(trimmed);
    }
  }, [trimmed, currentQuery, setInitialQuery]);

  // reset page on new search
  useEffect(() => {
    setCurrentPage(1);
  }, [currentQuery, searchResults]);

  // scroll to top on page change
  useEffect(() => {
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, [currentPage]);

  if (isLoading) {
    return <div>Loading search results...</div>;
  }
  if (!currentQuery && !trimmed) {
    return <p>Please enter a search term to see results.</p>;
  }
  if (searchResults.length === 0) {
    return <p>No results found for "{currentQuery || trimmed}".</p>;
  }

  // pagination logic
  const totalPages = Math.ceil(searchResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentResults = searchResults.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="search-results">
      <div className="ais-Hits-list">
        {currentResults.map((hit) => (
          <CustomHit key={hit.objectID} hit={hit} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="ais-Pagination-link"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="pagination-text">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="ais-Pagination-link"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  const {query} = useLoaderData();
  const trimmed = query.trim();
  const {currentQuery, searchInput} = useSearch();
  const displayQuery = searchInput || currentQuery || trimmed;

  return (
    <div className="search">
      <h1>Search Results {displayQuery ? `for "${displayQuery}"` : ''}</h1>
      <SearchResults />
    </div>
  );
}
