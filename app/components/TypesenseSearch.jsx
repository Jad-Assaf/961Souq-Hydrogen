import React, {useEffect, useRef, useState} from 'react';
import {Form, useFetcher, useLocation} from '@remix-run/react';

export function TypesenseSearch({
  initialQuery = '',
  action = '/search',
  placeholder = 'Search products...',
}) {
  const fetcher = useFetcher();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef(null);
  const lastTermRef = useRef(initialQuery.trim());

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

  // Debounced predictive search
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setIsOpen(false);
      return;
    }
    if (term === lastTermRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      lastTermRef.current = term;
      const params = new URLSearchParams();
      params.set('q', term);
      params.set('perPage', '20');
      fetcher.load(`/api/typesensesearch?${params.toString()}`);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, fetcher]);

  const products = fetcher.data?.hits || [];
  const isLoading = fetcher.state === 'loading';

  function handleFocus() {
    const term = searchTerm.trim();
    if (!term) return;
    setIsOpen(true);
    if (!products.length || lastTermRef.current !== term) {
      lastTermRef.current = term;
      const params = new URLSearchParams();
      params.set('q', term);
      params.set('perPage', '10');
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
          <input
            type="search"
            name="q"
            value={searchTerm}
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
          isLoading={isLoading}
          isOpen={isOpen}
        />
      </div>
    </>
  );
}

function TypesenseSuggestions({searchTerm, products, isLoading, isOpen}) {
  const trimmed = searchTerm.trim();
  const hasProducts = products && products.length > 0;
  if (!isOpen || !trimmed || !hasProducts) return null;
  return (
    <div className="search-suggestions">
      {isLoading && <div className="search-suggestions-status">Searching…</div>}
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
                      <span className="suggestion-product-title">
                        {product.title}
                      </span>
                      {typeof product.price === 'number' && (
                        <span className="suggestion-product-price">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
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
