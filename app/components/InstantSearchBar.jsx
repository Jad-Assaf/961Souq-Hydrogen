// app/components/InstantSearchBar.jsx
import React, {useEffect, useRef, useState} from 'react';
import {Form, useFetcher, useLocation} from '@remix-run/react';

export function InstantSearchBar({
  initialQuery = '',
  action = '/search-test',
  placeholder = 'Search products & collections...',
}) {
  const fetcher = useFetcher();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);

  const debounceRef = useRef(null);
  const lastTermRef = useRef(initialQuery.trim());
  const wrapperRef = useRef(null);

  // For scroll lock
  const bodyOverflowRef = useRef('');
  const bodyLockedRef = useRef(false);

  // Keep input in sync with URL query (when you navigate / paginate)
  useEffect(() => {
    setSearchTerm(initialQuery);
    lastTermRef.current = initialQuery.trim();
  }, [initialQuery]);

  // Close suggestions on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location.key]);

  // 🔒 Lock body scroll when instant search is open
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (isOpen && !bodyLockedRef.current) {
      bodyOverflowRef.current = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
      bodyLockedRef.current = true;
    } else if (!isOpen && bodyLockedRef.current) {
      document.body.style.overflow = bodyOverflowRef.current || '';
      bodyLockedRef.current = false;
    }
  }, [isOpen]);

  // Restore scroll if the component unmounts while open
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined' && bodyLockedRef.current) {
        document.body.style.overflow = bodyOverflowRef.current || '';
        bodyLockedRef.current = false;
      }
    };
  }, []);

  // Debounced predictive requests
  useEffect(() => {
    const term = searchTerm.trim();

    if (!term) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      return;
    }

    // If we already fetched this term, don't refetch
    if (term === lastTermRef.current) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      lastTermRef.current = term;
      const params = new URLSearchParams();
      params.set('q', term);
      fetcher.load(`${action}?${params.toString()}`);
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, fetcher, action]);

  const predictive = fetcher.data?.predictive;
  const isLoading = fetcher.state === 'loading';

  // When clicking/focusing the bar with existing text → open instant results
  function handleFocus() {
    const term = searchTerm.trim();
    if (!term) return;

    setIsOpen(true);

    // If we don't have predictive for this term, fetch immediately (no debounce)
    const current = lastTermRef.current;
    if (!predictive || current !== term) {
      lastTermRef.current = term;
      const params = new URLSearchParams();
      params.set('q', term);
      fetcher.load(`${action}?${params.toString()}`);
    }
  }

  return (
    <>
      {/* Dark blurred overlay behind instant search */}
      {isOpen && (
        <div
          className="search-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={
          'search-bar-wrapper' + (isOpen ? ' search-bar-wrapper--open' : '')
        }
        ref={wrapperRef}
      >
        <Form method="get" action={action} className="search-form">
          <input
            type="search"
            name="q"
            value={searchTerm}
            autoComplete="off"
            onChange={(event) => {
              const value = event.target.value;
              setSearchTerm(value);
              setIsOpen(!!value.trim());
            }}
            onFocus={handleFocus}
            placeholder={placeholder}
            className="search-input"
          />
          <button type="submit" className="search-submit">
            <svg
              width="20px"
              height="20px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0" />
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <g id="SVGRepo_iconCarrier">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C12.8487 19 14.551 18.3729 15.9056 17.3199L19.2929 20.7071C19.6834 21.0976 20.3166 21.0976 20.7071 20.7071C21.0976 20.3166 21.0976 19.6834 20.7071 19.2929L17.3199 15.9056C18.3729 14.551 19 12.8487 19 11C19 6.58172 15.4183 3 11 3ZM5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11Z"
                  fill="#fff"
                />
              </g>
            </svg>
          </button>
        </Form>

        <InstantSuggestions
          searchTerm={searchTerm}
          predictive={predictive}
          isLoading={isLoading}
          isOpen={isOpen}
          action={action}
        />
      </div>
    </>
  );
}

function InstantSuggestions({
  searchTerm,
  predictive,
  isLoading,
  isOpen,
  action,
}) {
  const trimmed = searchTerm.trim();
  const normalizedTerm = trimmed.toLowerCase();

  const queries =
    predictive?.queries?.filter(
      (item) => item.text.trim().toLowerCase() !== normalizedTerm,
    ) || [];

  const hasResults =
    predictive &&
    (predictive.products?.length ||
      predictive.collections?.length ||
      queries.length ||
      predictive.pages?.length ||
      predictive.articles?.length);

  if (!isOpen || !trimmed || !predictive || !hasResults) {
    return null;
  }

  return (
    <div className="search-suggestions">
      {isLoading && <div className="search-suggestions-status">Searching…</div>}

      {/* Query suggestions as pills */}
      {queries.length > 0 && (
        <div className="suggestions-section suggestions-section--pills">
          <p className="suggestions-heading">Suggestions</p>
          <ul className="suggestions-list suggestions-list--pills">
            {queries.map((item) => (
              <li key={item.text} className="suggestion-pill-item">
                <a
                  href={`${action}?q=${encodeURIComponent(item.text)}`}
                  className="suggestion-pill-link"
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="suggestions-pro-col">
        {/* Products – one per row */}
        {predictive.products?.length > 0 && (
          <div className="suggestions-section">
            <p className="suggestions-heading">Products</p>
            <ul className="suggestions-list suggestions-list--products">
              {predictive.products.map((product) => (
                <li key={product.id} className="suggestion-product-row">
                  <a
                    href={`/products/${product.handle}`}
                    className="suggestion-product-link"
                  >
                    {product.featuredImage?.url && (
                      <img
                        src={product.featuredImage.url}
                        alt={product.featuredImage.altText || product.title}
                        className="suggestion-product-image"
                        loading="lazy"
                      />
                    )}
                    <div className="suggestion-product-info">
                      <span className="suggestion-product-title">
                        {product.title}
                      </span>
                      {product.priceRange?.minVariantPrice && (
                        <span className="suggestion-product-price">
                          {formatMoney(product.priceRange.minVariantPrice)}
                        </span>
                      )}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Collections */}
        {predictive.collections?.length > 0 && (
          <div className="suggestions-section">
            <p className="suggestions-heading">Collections</p>
            <ul className="suggestions-list suggestions-list--grid">
              {predictive.collections.map((collection) => (
                <li key={collection.id} className="suggestion-card">
                  <a
                    href={`/collections/${collection.handle}`}
                    className="suggestion-card-link"
                  >
                    {collection.image?.url && (
                      <img
                        src={collection.image.url}
                        alt={collection.image.altText || collection.title}
                        className="suggestion-card-image"
                        loading="lazy"
                      />
                    )}
                    <span className="suggestion-card-title">
                      {collection.title}
                    </span>
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

function formatMoney(price) {
  if (!price) return '';
  const {amount, currencyCode} = price;
  const value = Number(amount);
  if (Number.isNaN(value)) return `${amount} ${currencyCode}`;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode || 'USD',
  }).format(value);
}
