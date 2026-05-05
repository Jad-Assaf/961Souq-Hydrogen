import React, {useEffect, useRef, useState} from 'react';
import {Form, Link, useNavigate} from '@remix-run/react';
import {
  createEmptySearchResponse,
  debounce,
  fetchCustomSearch,
  formatSearchPrice,
  SEARCH_RESULTS_LIMIT,
} from '~/lib/customSearch';

const SEARCH_DEBOUNCE_MS = 700;

function getSearchCacheKey(query) {
  return query.trim().toLowerCase();
}

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

export function WorkerSearchBox({
  action = '/search',
  initialQuery = '',
  placeholder = 'Search products',
  autoFocus = false,
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(Boolean(autoFocus));
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(() =>
    createEmptySearchResponse(initialQuery),
  );
  const wrapperRef = useRef(null);
  const activeRequestIdRef = useRef(0);
  const cacheRef = useRef(new Map());
  const debouncedSearchRef = useRef(null);
  const lastCorrectionRef = useRef({from: '', to: ''});

  useEffect(() => {
    setQuery(initialQuery);
    if (initialQuery.trim().length < 2) {
      setResults(createEmptySearchResponse(initialQuery));
    }
  }, [initialQuery]);

  useEffect(() => {
    debouncedSearchRef.current = debounce(async (nextQuery, requestId) => {
      const cacheKey = getSearchCacheKey(nextQuery);
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        if (activeRequestIdRef.current === requestId) {
          setResults(cached);
          setIsLoading(false);
        }
        return;
      }

      const response = await fetchCustomSearch(nextQuery, {
        limit: SEARCH_RESULTS_LIMIT,
        available: true,
      });
      const effectiveQuery = response.query?.trim() || nextQuery;
      cacheRef.current.set(cacheKey, response);
      cacheRef.current.set(getSearchCacheKey(effectiveQuery), response);

      if (activeRequestIdRef.current === requestId) {
        setResults(response);
        setIsLoading(false);

        if (
          effectiveQuery &&
          effectiveQuery.toLowerCase() !== nextQuery.trim().toLowerCase()
        ) {
          lastCorrectionRef.current = {
            from: nextQuery.trim().toLowerCase(),
            to: effectiveQuery.toLowerCase(),
          };
          setQuery(effectiveQuery);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      debouncedSearchRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      activeRequestIdRef.current += 1;
      debouncedSearchRef.current?.cancel();
      setResults(createEmptySearchResponse(trimmedQuery));
      setIsLoading(false);
      return;
    }

    if (
      lastCorrectionRef.current.to &&
      trimmedQuery.toLowerCase() === lastCorrectionRef.current.to
    ) {
      const cached = cacheRef.current.get(getSearchCacheKey(trimmedQuery));
      lastCorrectionRef.current = {from: '', to: ''};
      if (cached) {
        activeRequestIdRef.current += 1;
        debouncedSearchRef.current?.cancel();
        setResults(cached);
        setIsLoading(false);
        setIsOpen(true);
        return;
      }
    }

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    setIsLoading(true);
    setIsOpen(true);
    debouncedSearchRef.current?.(trimmedQuery, requestId);
  }, [query]);

  function submitSearch(nextQuery) {
    const value = (nextQuery ?? query).trim();
    if (!value) return;
    setIsOpen(false);
    navigate(`${action}?q=${encodeURIComponent(value)}`);
  }

  const trimmedQuery = query.trim();
  const showDropdown =
    isOpen &&
    trimmedQuery.length >= 2 &&
    (isLoading || results.products.length > 0 || results.query.length >= 2);

  return (
    <>
      {isOpen ? (
        <div
          className="search-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <div
        ref={wrapperRef}
        className={`search-bar-wrapper${
          isOpen ? ' search-bar-wrapper--open' : ''
        }`}
      >
        <Form
          method="get"
          action={action}
          className="search-form"
          onSubmit={() => setIsOpen(false)}
        >
          <div className="search-input-wrapper">
            <input
              type="search"
              name="q"
              value={query}
              autoFocus={autoFocus}
              autoComplete="off"
              placeholder={placeholder}
              className="search-input"
              onChange={(event) => {
                setQuery(event.target.value);
                if (event.target.value.trim().length >= 2) {
                  setIsOpen(true);
                }
              }}
              onFocus={() => {
                if (query.trim().length >= 2) {
                  setIsOpen(true);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setIsOpen(false);
                }
                if (event.key === 'Enter') {
                  event.preventDefault();
                  submitSearch();
                }
              }}
            />
          </div>
          <button type="submit" className="search-submit" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11 3C6.582 3 3 6.582 3 11s3.582 8 8 8c1.85 0 3.552-.628 4.906-1.682l3.387 3.387c.39.39 1.024.39 1.414 0 .39-.39.39-1.024 0-1.414l-3.387-3.387A7.938 7.938 0 0 0 19 11c0-4.418-3.582-8-8-8Zm-6 8a6 6 0 1 1 12 0 6 6 0 0 1-12 0Z"
                fill="#fff"
              />
            </svg>
          </button>
        </Form>

        {showDropdown ? (
          <div className="search-suggestions">
            {isLoading ? (
              <div className="search-suggestions-status">Searching...</div>
            ) : null}

            {results.products.length > 0 ? (
              <div className="suggestions-pro-col">
                <div className="suggestions-section">
                  <p className="suggestions-heading">Products</p>
                  <ul className="suggestions-list suggestions-list--products">
                    {results.products.map((product) => {
                      const price = formatSearchPrice(product.price);
                      const href = product.url || `/products/${product.handle}`;
                      const availabilityLabel =
                        product.availableForSale === false
                          ? 'Out of stock'
                          : product.availableForSale === true
                          ? 'In stock'
                          : null;

                      return (
                        <li key={product.id} className="suggestion-product-row">
                          <Link
                            to={href}
                            className="suggestion-product-link"
                            onClick={() => setIsOpen(false)}
                          >
                            {product.image?.url ? (
                              <img
                                src={product.image.url}
                                alt={product.image.altText || product.title}
                                className="suggestion-product-image"
                                loading="lazy"
                              />
                            ) : (
                              <span className="suggestion-product-image">
                                No image
                              </span>
                            )}
                            <div className="suggestion-product-info">
                              <span
                                className="suggestion-product-title"
                                style={{marginBottom: '5px'}}
                              >
                                {product.title}
                              </span>
                              {product.vendor ? (
                                <span
                                  style={{
                                    fontSize: '12px',
                                    color: '#555',
                                    marginBottom: '4px',
                                  }}
                                >
                                  {product.vendor}
                                </span>
                              ) : null}
                              {price ? (
                                <p
                                  className="search-result-price"
                                  style={{
                                    fontSize: '14px',
                                    fontWeight: '400',
                                    color: '#555',
                                    margin: 0,
                                  }}
                                >
                                  {price}
                                </p>
                              ) : null}
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
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ) : null}

            {!isLoading && results.products.length === 0 ? (
              <div className="search-suggestions-status">
                No products found for <strong>{trimmedQuery}</strong>.
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
