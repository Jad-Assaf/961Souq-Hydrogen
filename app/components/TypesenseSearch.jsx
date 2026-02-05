import React, {useEffect, useRef, useState} from 'react';
import {Form, useFetcher, useLocation} from '@remix-run/react';

export function TypesenseSearch({
  initialQuery = '',
  action = '/search',
  placeholder = 'Search products...',
  autoFocus = false,
}) {
  const fetcher = useFetcher();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const lastTermRef = useRef(initialQuery.trim());
  const cachedDataRef = useRef({}); // Cache results to prevent duplicate requests

  // Keep input in sync with URL query
  useEffect(() => {
    setSearchTerm(initialQuery);
    lastTermRef.current = initialQuery.trim();
  }, [initialQuery]);

  // Close suggestions on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location.key]);

  // Scroll lock while open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Predictive search without debounce
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setIsOpen(false);
      return;
    }

    // CRITICAL: Don't refetch if we already have data for this exact term
    if (term === lastTermRef.current && cachedDataRef.current[term]) {
      return; // Already have data, STOP HERE
    }

    // CRITICAL: Don't refetch if fetcher is already loading this term
    if (fetcher.state === 'loading' && lastTermRef.current === term) {
      return; // Already loading, STOP HERE
    }

    // FINAL CHECK: Don't make request if we have data
    if (cachedDataRef.current[term]) {
      lastTermRef.current = term;
      return;
    }
    lastTermRef.current = term;
    const params = new URLSearchParams();
    params.set('q', term);
    params.set('perPage', '20');
    fetcher.load(`/api/typesensesearch?${params.toString()}`);
  }, [searchTerm]); // REMOVED fetcher from dependencies - this was causing the loop!

  // Cache fetcher data when it arrives
  useEffect(() => {
    if (
      fetcher.data &&
      lastTermRef.current &&
      !cachedDataRef.current[lastTermRef.current]
    ) {
      cachedDataRef.current[lastTermRef.current] = fetcher.data;
    }
  }, [fetcher.data]);

  // Use cached data if available, otherwise use fetcher data
  const currentTerm = searchTerm.trim();
  const cachedData = cachedDataRef.current[currentTerm];
  const data = cachedData || fetcher.data || {};

  const products = data.hits || [];
  const suggestions = data.suggestions || [];
  const isLoading = fetcher.state === 'loading' && !cachedData;

  function handleFocus() {
    const term = searchTerm.trim();
    if (!term) return;
    setIsOpen(true);

    // CRITICAL: Check cache first - NEVER refetch if we have data
    if (cachedDataRef.current[term]) {
      return; // STOP - we have data
    }

    // CRITICAL: Don't fetch if already loading
    if (fetcher.state === 'loading' && lastTermRef.current === term) {
      return; // STOP - already loading
    }

    // Only fetch if we truly don't have data and aren't loading
    if (lastTermRef.current !== term && !cachedDataRef.current[term]) {
      lastTermRef.current = term;
      const params = new URLSearchParams();
      params.set('q', term);
      params.set('perPage', '20');
      fetcher.load(`/api/typesensesearch?${params.toString()}`);
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="search-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={`search-bar-wrapper${
          isOpen ? ' search-bar-wrapper--open' : ''
        }`}
      >
        <Form method="get" action={action} className="search-form">
          <div className="search-input-wrapper">
            <input
              type="search"
              name="q"
              value={searchTerm}
              autoFocus={autoFocus}
              autoComplete="off"
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                setIsOpen(!!value.trim());
              }}
              onFocus={handleFocus}
              placeholder={placeholder}
              className="search-input"
            />
            {/* <span className="search-ai-badge" title="AI-Powered Search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span className="search-ai-text">AI</span>
            </span> */}
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
        <TypesenseSuggestions
          searchTerm={searchTerm}
          products={products}
          suggestions={suggestions}
          isLoading={isLoading}
          isOpen={isOpen}
          onSuggestionClick={(suggestion) => {
            setSearchTerm(suggestion);
            setIsOpen(true);
            lastTermRef.current = '';
            // Trigger search with new suggestion
            const params = new URLSearchParams();
            params.set('q', suggestion);
            params.set('perPage', '20');
            fetcher.load(`/api/typesensesearch?${params.toString()}`);
          }}
        />
      </div>
    </>
  );
}

function TypesenseSuggestions({
  searchTerm,
  products,
  suggestions,
  isLoading,
  isOpen,
  onSuggestionClick,
}) {
  const trimmed = searchTerm.trim();
  const hasProducts = products && products.length > 0;
  const hasSuggestions = Array.isArray(suggestions) && suggestions.length > 0;

  if (!isOpen || !trimmed) return null;

  // Show suggestions even if no products (when 0 results)
  const shouldShow = hasProducts || hasSuggestions || isLoading;

  if (!shouldShow) return null;

  return (
    <div className="search-suggestions">
      {isLoading && <div className="search-suggestions-status">Searching…</div>}

      {/* Did you mean section - always shown when suggestions are available */}
      {hasSuggestions && (
        <div className="suggestions-section suggestions-section--did-you-mean">
          <p className="suggestions-heading">AI Suggestions</p>
          <ul className="suggestions-list suggestions-list--queries">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="suggestion-query-item">
                <button
                  type="button"
                  className="suggestion-query-link"
                  onClick={() => onSuggestionClick?.(suggestion)}
                  onMouseDown={(e) => {
                    // Prevent input blur when clicking
                    e.preventDefault();
                  }}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Products section */}
      <div className="suggestions-pro-col">
        {hasProducts && (
          <div className="suggestions-section">
            <p className="suggestions-heading">Products</p>
            <ul className="suggestions-list suggestions-list--products">
              {products.map((product) => (
                <li key={product.id} className="suggestion-product-row">
                  <a
                    href={product.url || `/products/${product.handle}`}
                    className="suggestion-product-link"
                  >
                    {product.image && (
                      <img
                        src={`${product.image}&width=200`}
                        alt={product.title}
                        className="suggestion-product-image"
                        loading="lazy"
                      />
                    )}
                    <div className="suggestion-product-info">
                      <span
                        className="suggestion-product-title"
                        style={{marginBottom: '5px'}}
                      >
                        {product.title}
                      </span>
                      {(() => {
                        const priceNum =
                          typeof product.price === 'number'
                            ? product.price
                            : Number(product.price);

                        if (!Number.isFinite(priceNum)) return null;

                        if (priceNum === 0) {
                          return (
                            <p
                              className="search-result-price"
                              style={{
                                fontSize: '14px',
                                fontWeight: '400',
                                color: '#555',
                              }}
                            >
                              Call for price
                            </p>
                          );
                        }

                        return (
                          <p
                            className="search-result-price"
                            style={{
                              fontSize: '14px',
                              fontWeight: '400',
                              color: '#555',
                            }}
                          >
                            ${priceNum.toFixed(2)}
                          </p>
                        );
                      })()}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
