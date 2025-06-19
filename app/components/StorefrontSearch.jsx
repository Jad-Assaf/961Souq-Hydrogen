// src/components/AlgoliaSearch.jsx
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {algoliasearch} from 'algoliasearch';
import {
  InstantSearch,
  Hits,
  Configure,
  useSearchBox,
  Highlight,
  Pagination,
  RefinementList,
} from 'react-instantsearch';
import {useNavigate, useSearchParams} from '@remix-run/react';
import {truncateText} from './CollectionDisplay';
import {SearchIcon} from './Header';
import { debounce } from 'lodash';

export const searchClient = algoliasearch(
  '4AHYIG5H6V',
  'db1477d824985f7d0dab8891fa13a5bd',
);

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
      </div>
    </a>
  );
}

function CustomSearchInput({setShowHits}) {
  const {query, refine} = useSearchBox();
  const [inputValue, setInputValue] = useState(query || '');
  const navigate = useNavigate();

  // Debounce the refine function
  const debouncedRefine = useRef(
    debounce((value) => {
      refine(value);
    }, 700),
  ).current;

  useEffect(() => {
    return () => {
      debouncedRefine.cancel();
    };
  }, [debouncedRefine]);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.trim() === '') {
      setShowHits(false);
    } else {
      debouncedRefine(value);
      setShowHits(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = inputValue.trim();
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setShowHits(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        className="search-bar"
        type="search"
        name="query"
        placeholder="Search products…"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => {
          if (inputValue.trim()) {
            setShowHits(true);
          }
        }}
        autoComplete="off"
      />
      <button className="search-bar-submit">
        <SearchIcon />
      </button>
    </form>
  );
}

export default function AlgoliaSearch() {
  const [searchParams] = useSearchParams();
  const [showHits, setShowHits] = useState(false);
  const initialQuery = searchParams.get('q') || '';
  const containerRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setShowHits(false);
    }
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
      <InstantSearch
        searchClient={searchClient}
        indexName="shopify_961_25products"
        insights
        initialUiState={{
          shopify_961_25products: initialQuery ? {query: initialQuery} : {},
        }}
      >
        <Configure hitsPerPage={30} />

        <div className="search-container">
          <CustomSearchInput setShowHits={setShowHits} />
        </div>

        {showHits && (
          <div className="search-results-container">
            {/* <aside className="as-facet-panel">
              <RefinementList
                attribute="brand"
                classNames={{
                  list: 'as-refinement-list',
                  item: 'as-refinement-item',
                }}
              />
            </aside> */}
            <section className="predictive-search-result">
              <h3>Search Results</h3>
              <Hits hitComponent={Hit} />
              {/* You can render <Pagination /> here if you want */}
            </section>
          </div>
        )}
      </InstantSearch>
    </div>
  );
}
