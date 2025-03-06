import {useLoaderData, Link, useNavigate, useLocation} from '@remix-run/react';
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {Money, Image} from '@shopify/hydrogen';
import {debounce} from 'lodash';

// Helper: truncate text to a given length.
function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export function SearchBar({onResultSelect, closeSearch}) {
  const [query, setQuery] = useState('');
  const [instantResults, setInstantResults] = useState([]);
  const [error, setError] = useState(null);
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [isSearchResultsVisible, setSearchResultsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // new state for loading

  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate(); // Use Remix's navigation hook

  // Debounced fetch from the search endpoint with a limit of 10 products.
  const debouncedFetch = useCallback(
    debounce(async (q) => {
      if (!q) {
        setInstantResults([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://search-app-vert.vercel.app/api/search?q=${encodeURIComponent(
            q,
          )}&limit=10`,
        );
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setInstantResults(data.results || []);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    debouncedFetch(query);
    return () => debouncedFetch.cancel();
  }, [query, debouncedFetch]);

  // Handle focus: on small screens, add fixed positioning and show overlay.
  const handleFocus = () => {
    if (window.innerWidth < 1024) {
      searchContainerRef.current?.classList.add('fixed-search');
      setOverlayVisible(true);
    }
    setSearchResultsVisible(true);
  };

  // Handle blur: on small screens, if input is empty, remove fixed positioning and hide overlay.
  const handleBlur = () => {
    if (window.innerWidth < 1024) {
      const inputValue = inputRef.current?.value.trim();
      if (!inputValue) {
        searchContainerRef.current?.classList.remove('fixed-search');
        setOverlayVisible(false);
      }
    }
  };

  // Closes the search overlay and results.
  const handleCloseSearch = () => {
    searchContainerRef.current?.classList.remove('fixed-search');
    setOverlayVisible(false);
    setSearchResultsVisible(false);
  };

  // Handle Enter key to trigger search.
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default form submission
      handleSearch();
    }
  };

  // Trigger search – navigate to the search page with the query as a parameter.
  const handleSearch = () => {
    if (inputRef.current) {
      const rawTerm = inputRef.current.value.trim();
      if (rawTerm) {
        // Optionally: trackSearch(rawTerm);
        navigate(`/search?q=${rawTerm}`);
      }
    }
  };

  // Clear the search input and reset results.
  const handleClearSearch = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setQuery('');
    setSearchResultsVisible(false);
    setInstantResults([]);
  };

  // Manage scroll-lock when overlay is visible.
  useEffect(() => {
    if (isOverlayVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOverlayVisible]);

  return (
    <>
      {/* Fullscreen Overlay */}
      <div
        className={`search-overlay ${isOverlayVisible ? 'active' : ''}`}
        onClick={handleCloseSearch}
      ></div>

      {/* Main Search Form */}
      <div ref={searchContainerRef} className="main-search">
        <div className="search-container">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
              setSearchResultsVisible(true);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="search-bar"
          />
          {inputRef.current?.value && (
            <button
              className="clear-search-button"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <svg
                fill="#000"
                height="12px"
                width="12px"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 460.775 460.775"
              >
                <path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55 c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55 c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505 c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"></path>
              </svg>
            </button>
          )}
          <button
            onClick={handleSearch}
            className="search-bar-submit"
            aria-label="Search"
          >
            <SearchIcon />
          </button>
        </div>
        {isSearchResultsVisible && (
          <div className="search-results-container">
            {isLoading ? (
              <div className="predictive-search-result" key="skeleton">
                <h5>Products</h5>
                <ul>
                  {[...Array(5)].map((_, i) => (
                    <li
                      key={i}
                      className="predictive-search-result-item skeleton"
                    >
                      {/* Skeleton markup (use the improved skeleton structure with shimmer for each element) */}
                      <div className="search-result-txt">
                        <div className="search-result-titDesc skeleton-div">
                          <div className="skeleton skeleton-image"></div>
                          <div className="skeleten-tds">
                            <p className="skeleton skeleton-title"></p>
                            {/* <p className="skeleton skeleton-description"></p> */}
                            <p className="skeleton skeleton-sku"></p>
                          </div>
                        </div>
                        <small className="skeleton skeleton-price"></small>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              instantResults.length > 0 && (
                <div className="predictive-search-result" key="products">
                  <h5>Products</h5>
                  <ul>
                    {instantResults.slice(0, 10).map((product) => {
                      const productUrl = `/products/${encodeURIComponent(
                        product.handle,
                      )}`;
                      return (
                        <li
                          className="predictive-search-result-item"
                          key={product.product_id}
                        >
                          <Link
                            to={productUrl}
                            onClick={() => {
                              if (closeSearch) closeSearch();
                              onResultSelect(product);
                            }}
                          >
                            {product.image_url && (
                              <Image
                                alt={product.title}
                                src={`${product.image_url}&quality=50`}
                                width={50}
                                height={50}
                              />
                            )}
                            <div className="search-result-txt">
                              <div className="search-result-titDesc">
                                <p className="search-result-title">
                                  {truncateText(product.title, 75)}
                                </p>
                                <p className="search-result-description">
                                  {truncateText(product.description, 100)}
                                </p>
                                {product.sku && (
                                  <p className="search-result-description">
                                    SKU: {product.sku}
                                  </p>
                                )}
                              </div>
                              <small className="search-result-price">
                                {Number(product.price) === 0 ? (
                                  'Call for Price!'
                                ) : (
                                  <p>
                                    ${(Number(product.price) / 100).toFixed(2)}
                                  </p>
                                )}
                              </small>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="#000"
      width="30px"
      height="30px"
    >
      <path
        d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
        stroke="#000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
