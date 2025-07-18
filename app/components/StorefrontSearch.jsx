import React, {useState, useEffect, useRef, useCallback} from 'react';
import {useNavigate, useSearchParams} from '@remix-run/react';
import {truncateText} from './CollectionDisplay';
import {SearchIcon} from './Header';
// import {debounce} from 'lodash';
import {useSearch} from '../lib/searchContext.jsx';

// Custom debounce function that works in SSR
function debounce(func, wait) {
  let timeout;
  const debounced = function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
  
  // Add cancel method like lodash debounce
  debounced.cancel = function() {
    clearTimeout(timeout);
  };
  
  return debounced;
}

export function Hit({hit}) {
  return (
    <a
      className="predictive-search-result-item"
      href={`/products/${hit.handle}`}
    >
      {hit.image && (
        <img
          src={`${hit.image}&width=150`}
          alt={hit.name}
          className="as-hit-image"
          width={58}
          height={58}
        />
      )}
      <div className="search-result-txt">
        <div className="search-result-titDesc">
          <p className="search-result-title">
            {hit.title}
            {hit.variant_title && hit.variant_title !== 'Default Title'
              ? ` – ${hit.variant_title}`
              : ''}
          </p>
          <p className="search-result-description search-desc">
            {truncateText(hit.body_html_safe, 30)}
          </p>
          <p className="search-result-description search-desc">
            SKU: {hit.sku}
          </p>
        </div>
        <div className="as-price-container">
          {hit.price === 0 ? (
            <p className="search-result-price">Call For Price!</p>
          ) : (
            hit.price && <p className="search-result-price">${hit.price}</p>
          )}
          {hit.price !== 0 && hit.compare_at_price > 0 && (
            <p className="search-result-compare-price">
              ${hit.compare_at_price}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

function CustomSearchInput({setShowHits}) {
  const navigate = useNavigate();
  const {performSearch, currentQuery, searchInput, setSearchInput} = useSearch();

  // debounce the search calls
  const debouncedSearch = useRef(
    debounce((value) => performSearch(value), 700),
  ).current;

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (value.trim() === '') {
      setShowHits(false);
    } else {
      debouncedSearch(value);
      setShowHits(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = searchInput.trim();

    // if there's a query, navigate to the search page
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }

    // HIDE predictive hits, CLEAR the input
    setShowHits(false);
    setSearchInput('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        className="search-bar"
        type="search"
        name="query"
        placeholder="Search products…"
        value={searchInput}
        onChange={handleChange}
        onFocus={() => {
          if (searchInput.trim()) {
            setShowHits(true);
          }
        }}
        autoComplete="off"
      />
      <button className="search-bar-submit" aria-label="Search Products">
        <SearchIcon />
      </button>
    </form>
  );
}

export default function AlgoliaSearch() {
  const [searchParams] = useSearchParams();
  const [showHits, setShowHits] = useState(false);
  const containerRef = useRef(null);
  const {searchResults, isLoading} = useSearch();

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setShowHits(false);
  }, []);

  const handleClickOutside = useCallback(
    (e) => {
      if (
        showHits &&
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setShowHits(false);
      }
    },
    [showHits],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleKeyDown, handleClickOutside]);

  return (
    <div className="main-search" ref={containerRef}>
      <div className="search-container">
        <CustomSearchInput setShowHits={setShowHits} />
      </div>

      {showHits && searchResults.length > 0 && (
        <div className="search-results-container">
          <section className="predictive-search-result">
            <h3>Search Results</h3>
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              <div>
                {searchResults.slice(0, 30).map((hit) => (
                  <Hit key={hit.objectID} hit={hit} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
