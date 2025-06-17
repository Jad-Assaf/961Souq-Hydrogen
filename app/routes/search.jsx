import {
  useLoaderData,
  useSearchParams,
  Link,
  useNavigate,
  data,
} from '@remix-run/react';
import {useState, useEffect, useCallback, useRef} from 'react';
import "../styles/SearchPage.css"

// ───────── Loader ─────────
export async function loader({request}) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  if (!q) return data({results: [], total: 0, facets: [], page, limit});

  const apiKey = '0G4C7L6r1R';
  const restrictParams = ['price', 'color']
    .map((attr) => {
      const val = url.searchParams.get(attr);
      return val ? `&restrictBy[${attr}]=${encodeURIComponent(val)}` : '';
    })
    .join('');

  const endpoint =
    `https://searchserverapi.com/getresults?apiKey=${apiKey}` +
    `&q=${encodeURIComponent(q)}` +
    `&output=json&facets=true` +
    `&suggestions=true&suggestionsMaxResults=50` +
    restrictParams +
    `&maxResults=${limit}` +
    `&startIndex=${offset}`;

  const res = await fetch(endpoint);
  if (!res.ok) throw new Response(await res.text(), {status: res.status});
  const dataa = await res.json();

  return data({
    results: dataa.items || [],
    total: dataa.totalItems || 0,
    facets: dataa.facets || [],
    page,
    limit,
  });
}

// ───────── SearchForm Component ─────────
export function SearchForm() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdown, setDropdown] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const searchContainerRef = useRef(null);
  const timeoutRef = useRef(null);
  const blinkIntervalRef = useRef(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const apiKey = '0G4C7L6r1R';
  const clickingRef = useRef(false);

  useEffect(() => {
    const onSlash = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current.focus();
      }
    };
    document.addEventListener('keydown', onSlash);
    return () => document.removeEventListener('keydown', onSlash);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        handleCloseSearch();
      }
    };
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        handleCloseSearch();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  useEffect(() => {
    window.__searchanise_cb = (data) => {
      const suggestions = data.suggestions || [];
      const products = data.items || [];
      setDropdown([
        ...suggestions.map((s) => ({ type: 'suggestion', value: s })),
        ...products.map((p) => ({ type: 'product', item: p })),
      ]);
      setOpen(true);
    };
    return () => delete window.__searchanise_cb;
  }, []);

  const fetchInstant = useCallback(
    (q) => {
      document.querySelectorAll('script[data-jsonp]').forEach((s) => s.remove());
      const url =
        `https://searchserverapi.com/getwidgets?apiKey=${apiKey}` +
        `&q=${encodeURIComponent(q)}` +
        `&output=jsonp&queryCorrection=true&maxResults=15&callback=__searchanise_cb`;
      const s = document.createElement('script');
      s.src = url;
      s.setAttribute('data-jsonp', 'true');
      document.body.appendChild(s);
    },
    [apiKey]
  );

  useEffect(() => {
    if (!searchTerm) {
      setOpen(false);
      return;
    }
    const timer = setTimeout(() => fetchInstant(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchInstant]);

  const handleSearch = () => {
    const raw = searchTerm.trim();
    if (raw) {
      const term = raw.replace(/\s+/g, '-');
      window.location.href = `/search?q=${term}&page=1&limit=50`;
    }
  };

  const handleFocus = () => {
    if (window.innerWidth < 1024) {
      searchContainerRef.current?.classList.add('fixed-search');
      setOverlayVisible(true);
    }
    clearTimeout(timeoutRef.current);
    clearInterval(blinkIntervalRef.current);
    setIsInputFocused(true);
    setOpen(true);
    if (searchTerm) {
      fetchInstant(searchTerm);
    }
  };

  const handleBlur = () => {
    setIsInputFocused(false);
    const inputValue = inputRef.current?.value.trim();
    if (window.innerWidth < 1024 && !inputValue) {
      searchContainerRef.current?.classList.remove('fixed-search');
      setOverlayVisible(false);
    }
  };

  const handleCloseSearch = () => {
    searchContainerRef.current?.classList.remove('fixed-search');
    setOverlayVisible(false);
    setOpen(false);
  };

  return (
    <>
      <div
        className={`search-overlay ${isOverlayVisible ? 'active' : ''}`}
        onClick={handleCloseSearch}
      ></div>

      <div ref={searchContainerRef} className="main-search">
        <div ref={containerRef} className="search-container">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Type to search…"
            className="search-bar"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setOpen(false);
                inputRef.current.focus();
              }}
              className="clear-search-button"
              aria-label="Clear search"
            >
              ×
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

        {open && (
          <div className="search-results-container">
            <div className="predictive-search-result">
              <h5>Products</h5>
              <ul>
                {dropdown.map((entry, i) =>
                  entry.type === 'suggestion' ? (
                    <li
                      key={`s-${i}`}
                      onClick={() => {
                        setSearchTerm(entry.value);
                        setOpen(false);
                      }}
                    >
                      🔍 {entry.value}
                    </li>
                  ) : (
                    <li
                      key={`p-${entry.item.product_id}`}
                      className="predictive-search-result-item"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur until after this
                        window.location.href = entry.item.link;
                      }}
                    >
                      <img
                        src={`${entry.item.image_link}&width=200`}
                        alt={entry.item.title}
                        width={75}
                        height={75}
                      />
                      <div className="search-result-txt">
                        <div className="search-result-title">
                          {entry.item.title}
                        </div>
                        <small className="search-result-price">
                          {parseFloat(entry.item.price) === 0
                            ? 'Call For Price!'
                            : `$${parseFloat(entry.item.price).toFixed(2)}`}
                        </small>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </>
  );
}


// ───────── SearchResults Component ─────────
export default function SearchResults() {
  const {results, total, page, limit, facets} = useLoaderData();
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const totalPages = Math.ceil(total / limit);
  const navigate = useNavigate();

  const handleFilterChange = (attr, value, type) => {
    const params = new URLSearchParams(searchParams);
    const existing = params.get(attr) || '';
    let updated;

    if (type === 'select') {
      const selected = new Set(existing.split('|').filter(Boolean));
      selected.has(value) ? selected.delete(value) : selected.add(value);
      updated = Array.from(selected).join('|');
    } else {
      updated = value; // for range
    }

    if (updated) {
      params.set(attr, updated);
    } else {
      params.delete(attr);
    }
    params.set('page', '1'); // Reset to first page on filter change
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="search">
      <h1>Search Results</h1>
      {/* <div className="search-sidebar">
        {facets.map((facet) => (
          <div key={facet.attribute} className="filter-group">
            <h4>{facet.title}</h4>

            {facet.type === 'select' &&
              facet.buckets.map((bucket) => {
                const isChecked = (searchParams.get(facet.attribute) || '')
                  .split('|')
                  .includes(bucket.value);
                return (
                  <label key={bucket.value} style={{display: 'block'}}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() =>
                        handleFilterChange(
                          facet.attribute,
                          bucket.value,
                          'select',
                        )
                      }
                    />
                    {bucket.value} ({bucket.count})
                  </label>
                );
              })}

            {facet.type === 'range' &&
              facet.buckets.map((bucket, i) => {
                const range = `${bucket.from},${bucket.to}`;
                const isActive = searchParams.get(facet.attribute) === range;
                return (
                  <label key={i} style={{display: 'block'}}>
                    <input
                      type="radio"
                      checked={isActive}
                      onChange={() =>
                        handleFilterChange(facet.attribute, range, 'range')
                      }
                    />
                    ${bucket.from} - ${bucket.to} ({bucket.count})
                  </label>
                );
              })}
          </div>
        ))}
      </div> */}

      {results.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <div className="search-results-grid">
          {results.map((p) => (
            <div key={p.product_id} className="product-card">
              <a
                href={p.link}
                // className="product-link-wrapper"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={p.image_link}
                  alt={p.title}
                  width={190}
                  height={190}
                />
                <p className="product-title">{p.title}</p>
                <p className="product-price">
                  {parseFloat(p.price) === 0
                    ? 'Call For Price!'
                    : `$${parseFloat(p.price).toFixed(2)}`}
                </p>
              </a>
            </div>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="pagination-with-buttons">
          {page > 1 && (
            <a
              href={`?q=${encodeURIComponent(q)}&page=${
                page - 1
              }&limit=${limit}`}
              className="page-btn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </a>
          )}
          <p className="page-number">
            Page {page} of {totalPages}
          </p>
          {page < totalPages && (
            <a
              href={`?q=${encodeURIComponent(q)}&page=${
                page + 1
              }&limit=${limit}`}
              className="page-btn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2172af"
      width="30px"
      height="30px"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
