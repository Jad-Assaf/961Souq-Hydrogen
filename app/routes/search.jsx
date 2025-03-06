import {json} from '@shopify/remix-oxygen';
import {useLoaderData, Link, useNavigate, useLocation} from '@remix-run/react';
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {Money, Image} from '@shopify/hydrogen';
import {debounce} from 'lodash';
import '../styles/SearchPage.css';

/**
 * @type {import('@remix-run/react').MetaFunction}
 */
export const meta = () => {
  return [{title: `961Souq | Search`}];
};

// ----------------------
// Main SearchTest Component
// ----------------------
export async function loader({request}) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';

  // Call your external API
  const externalResponse = await fetch(
    `https://search-app-vert.vercel.app/api/search?q=${encodeURIComponent(q)}`,
  );
  const data = await externalResponse.json();

  return json({
    result: {
      items: data.results || [],
      total: data.total || 0,
    },
  });
}

export default function SearchTest() {
  const {initialMessage} = useLoaderData();

  // We use `inputQuery` for the text input, and `searchQuery` for the term we actually fetch with.
  const [inputQuery, setInputQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);

  // For data/results
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Local cache object where each key is like "q=watch&page=0&limit=20"
  const [cache, setCache] = useState({});

  const location = useLocation();
  const navigate = useNavigate();
  const [hasMounted, setHasMounted] = useState(false);

  // 1) On mount, parse URL & load cache from localStorage
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    let urlQuery = searchParams.get('q') || '';
    let urlPage = parseInt(searchParams.get('page') || '0', 10);
    let urlLimit = parseInt(searchParams.get('limit') || '20', 10);

    if (isNaN(urlPage) || urlPage < 0) urlPage = 0;
    if (isNaN(urlLimit) || urlLimit < 1) urlLimit = 20;

    const storedCache = localStorage.getItem('searchCache');
    if (storedCache) {
      try {
        const parsed = JSON.parse(storedCache);
        setCache(parsed);
      } catch {
        // ignore parse errors
      }
    }

    setInputQuery(urlQuery);
    setSearchQuery(urlQuery);
    setPage(urlPage);
    setLimit(urlLimit);
    setHasMounted(true);
  }, [location.search]);

  // 2) Update URL & fetch when searchQuery/page/limit change
  useEffect(() => {
    if (!hasMounted) return;

    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (page > 0) params.set('page', String(page));
    if (limit !== 20) params.set('limit', String(limit));
    navigate(`?${params.toString()}`, {replace: true});

    if (!searchQuery) {
      setResults([]);
      setTotal(0);
      return;
    }

    const key = params.toString();
    if (cache[key]) {
      const {results: cachedResults, total: cachedTotal} = cache[key];
      setResults(cachedResults);
      setTotal(cachedTotal);
      setLoading(false);
      setError('');
    } else {
      fetchResults(searchQuery, page, limit).catch(() => {});
    }
  }, [searchQuery, page, limit, hasMounted]);

  // 3) Sync cache to localStorage
  useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem('searchCache', JSON.stringify(cache));
  }, [cache, hasMounted]);

  // 4) Fetch function to update state and cache
  async function fetchResults(term, pageNum, limitNum) {
    setLoading(true);
    setError('');
    try {
      const url = new URL('https://search-app-vert.vercel.app/api/search');
      url.searchParams.set('q', term);
      url.searchParams.set('page', pageNum);
      url.searchParams.set('limit', limitNum);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Request failed, status: ${response.status}`);
      }
      const data = await response.json();
      setResults(data.results || []);
      setTotal(data.total || 0);

      const key = `q=${term}&page=${pageNum}&limit=${limitNum}`;
      setCache((prev) => ({
        ...prev,
        [key]: {
          results: data.results || [],
          total: data.total || 0,
        },
      }));
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // 5) On submit, update searchQuery to trigger fetch
  function handleSubmit(e) {
    e.preventDefault();
    setPage(0);
    setResults([]);
    setTotal(0);
    setError('');
    setSearchQuery(inputQuery.trim());
  }

  function handleNextPage() {
    if ((page + 1) * limit < total) {
      setPage((prev) => prev + 1);
    }
  }

  function handlePrevPage() {
    if (page > 0) {
      setPage((prev) => prev - 1);
    }
  }

  // Callback when an instant search result is selected.
  function handleInstantResultSelect(item) {
    setInputQuery(item.title);
    setSearchQuery(item.title);
  }

  // Transform results for rendering
  const edges = results.map((product) => ({
    node: {
      ...product,
      id: product.product_id,
    },
  }));

  // Helper function to get page numbers with ellipsis
  function getPageNumbers(currentPage, totalPages, maxPages = 3) {
    let pages = [];
    if (totalPages <= maxPages) {
      // If total pages is less than max, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // If current page is near the start
      if (currentPage <= Math.floor(maxPages / 2) + 1) {
        for (let i = 1; i <= maxPages; i++) {
          pages.push(i);
        }
        pages.push('...');
      } else if (currentPage >= totalPages - Math.floor(maxPages / 2)) {
        // If current page is near the end
        pages.push('...');
        for (let i = totalPages - maxPages + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Otherwise, show ellipsis on both sides
        pages.push('...');
        const start = currentPage - Math.floor(maxPages / 2);
        const end = currentPage + Math.floor(maxPages / 2);
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        pages.push('...');
      }
    }
    return pages;
  }

  const totalPages = Math.ceil(total / limit);
  const pageNumbers = getPageNumbers(page + 1, totalPages);

  return (
    <div className="search">
      <h1>Search Results</h1>

      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          placeholder="Search..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">
          Search
        </button>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(0);
            setResults([]);
            setTotal(0);
          }}
          className="search-select"
        >
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>
      </form>

      {loading ? (
        <div className="search-results-grid">
          {Array.from({length: 20}).map((_, i) => (
            <div key={i} className="product-card skeleton">
              <div
                className="product-slideshow skeleton"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  width: '180px',
                  height: '180px',
                }}
              ></div>
              <h4
                className="product-title skeleton"
                style={{width: '70%', height: '20px', margin: '10px auto'}}
              ></h4>
              <div
                className="product-price skeleton"
                style={{width: '30%', height: '20px', margin: 'auto'}}
              ></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {error && <p className="error">{error}</p>}
          {edges.length > 0 && (
            <>
              <p className="results-count">
                Showing {edges.length} results on page {page + 1} of{' '}
                {Math.ceil(total / limit)} (total {total})
              </p>
              <div className="search-results-grid">
                {edges.map(({node: product}) => (
                  <div key={product.id} className="product-card">
                    <Link
                      to={`/products/${encodeURIComponent(product.handle)}`}
                    >
                      {product.image_url && (
                        <div
                          className="product-slideshow"
                          style={{position: 'relative', overflow: 'hidden'}}
                        >
                          <img
                            src={`${product.image_url}&quality=10`}
                            alt={product.title}
                            className="product-slideshow-image"
                            style={{
                              width: '100%',
                              height: 'auto',
                              objectFit: 'cover',
                            }}
                          />
                        </div>
                      )}
                      <h4 className="product-title">{product.title}</h4>
                      <div className="product-price">
                        {product.price != null ? (
                          <p>${(Number(product.price) / 100).toFixed(2)}</p>
                        ) : (
                          <span>No Price</span>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
              <div className="results-pages">
                <button onClick={handlePrevPage} disabled={page <= 0}>
                  Previous
                </button>
                <div className="pages-btns">
                  {pageNumbers.map((p, index) =>
                    p === '...' ? (
                      <span key={index} style={{margin: '0 5px'}}>
                        ...
                      </span>
                    ) : (
                      <button
                        key={index}
                        onClick={() => setPage(p - 1)}
                        className={page + 1 === p ? 'active' : ''}
                        style={{margin: '0 2px'}}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={(page + 1) * limit >= total}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
