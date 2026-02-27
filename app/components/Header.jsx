import {useEffect, useState, useRef, useId, useMemo} from 'react';
import {Link, NavLink, useLocation} from '@remix-run/react';
import {useAside} from '~/components/Aside';
import {useWishlist} from '~/lib/WishlistContext';
import {useOptimisticCart} from '@shopify/hydrogen';
import defaultLogoSvgRaw from '~/assets/961_Souq.svg?raw';

// import StorefrontSearch from './StorefrontSearch';

function getCartCount(cart) {
  if (!cart) return 0;

  // 1) direct totalQuantity if your loader provides it
  if (typeof cart.totalQuantity === 'number') return cart.totalQuantity;

  // 2) GraphQL nodes shape
  if (Array.isArray(cart.lines?.nodes)) {
    return cart.lines.nodes.reduce((sum, n) => sum + (n?.quantity ?? 0), 0);
  }

  // 3) Relay edges shape
  if (Array.isArray(cart.lines?.edges)) {
    return cart.lines.edges.reduce(
      (sum, e) => sum + (e?.node?.quantity ?? 0),
      0,
    );
  }

  // 4) Flat array fallback
  if (Array.isArray(cart.lines)) {
    return cart.lines.reduce((sum, l) => sum + (l?.quantity ?? 0), 0);
  }

  return 0;
}

function LazyTypesenseSearch({
  placeholder = 'Search Products',
  action = '/search',
}) {
  const [SearchComponent, setSearchComponent] = useState(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [pendingQuery, setPendingQuery] = useState('');
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);

  useEffect(() => {
    if (!shouldLoad || SearchComponent) return;
    let cancelled = false;

    import('./TypesenseSearch')
      .then((mod) => {
        if (cancelled) return;
        setSearchComponent(() => mod.TypesenseSearch);
      })
      .catch((error) => {
        console.error('Failed to load search', error);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, SearchComponent]);

  const handleActivate = () => {
    if (!shouldLoad) {
      setShouldAutoFocus(true);
      setShouldLoad(true);
    }
  };

  if (SearchComponent) {
    return (
      <SearchComponent
        initialQuery={pendingQuery}
        action={action}
        placeholder={placeholder}
        autoFocus={shouldAutoFocus}
      />
    );
  }

  return (
    <div
      className={`search-bar-wrapper${
        shouldLoad ? ' search-bar-wrapper--open' : ''
      }`}
    >
      <form method="get" action={action} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="search"
            name="q"
            value={pendingQuery}
            autoComplete="off"
            onChange={(e) => setPendingQuery(e.target.value)}
            onFocus={handleActivate}
            onClick={handleActivate}
            placeholder={placeholder}
            className="search-input"
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
      </form>
    </div>
  );
}

function getMenuPath(url) {
  if (!url) return '/';

  try {
    const pathname = new URL(url, 'https://dummy.base').pathname;
    return pathname;
  } catch {
    return '/';
  }
}

function SearchGlassFilterDefs() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      className="search-glass-filter-defs"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          id="search-glass-distortion"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          filterUnits="objectBoundingBox"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.00 0.000"
            numOctaves="1"
            seed="1"
            result=""
          />
          <feComponentTransfer in="turbulence" result="mapped">
            <feFuncR type="gamma" amplitude="0" exponent="0" offset="0.5" />
            <feFuncG type="gamma" amplitude="0" exponent="0" offset="0" />
            <feFuncB type="gamma" amplitude="0" exponent="0" offset="0" />
          </feComponentTransfer>
          <feGaussianBlur in="mapped" stdDeviation="3" result="softMap" />
          <feSpecularLighting
            in="softMap"
            surfaceScale="5"
            specularConstant="1"
            specularExponent="100"
            lightingColor="white"
            result="specLight"
          >
            <fePointLight x="-200" y="-200" z="300" />
          </feSpecularLighting>
          <feComposite
            in="specLight"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
            result="litImage"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softMap"
            scale="30"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

function HeaderGlassFilterDefs() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      className="header-glass-filter-defs"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          id="header-glass-distortion"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          filterUnits="objectBoundingBox"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.001 0.005"
            numOctaves="1"
            seed="17"
            result="turbulence"
          />
          <feComponentTransfer in="turbulence" result="mapped">
            <feFuncR type="gamma" amplitude="0" exponent="1" offset="0.55" />
            <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
            <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
          </feComponentTransfer>
          <feGaussianBlur in="mapped" stdDeviation="3" result="softMap" />
          <feSpecularLighting
            in="softMap"
            surfaceScale="5"
            specularConstant="1"
            specularExponent="100"
            lightingColor="white"
            result="specLight"
          >
            <fePointLight x="-200" y="-200" z="300" />
          </feSpecularLighting>
          <feComposite
            in="specLight"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
            result="litImage"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softMap"
            scale="200"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

const DEFAULT_LOGO_VIEWBOX = '0 0 595.28 358.51';
const DEFAULT_LOGO_GRADIENT_TOKEN = '__SOUQ_LOGO_GRADIENT__';
const DEFAULT_LOGO_TEMPLATE = defaultLogoSvgRaw
  .replace(/<\?xml[\s\S]*?\?>\s*/, '')
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/<style>[\s\S]*?<\/style>/, '')
  .replace(/class="st0"/g, 'fill="#fff"')
  .replace(/class="st1"/g, `fill="url(#${DEFAULT_LOGO_GRADIENT_TOKEN})"`)
  .replace(
    /id="linear-gradient"/g,
    `id="${DEFAULT_LOGO_GRADIENT_TOKEN}"`,
  )
  .replace(
    /url\(#linear-gradient\)/g,
    `url(#${DEFAULT_LOGO_GRADIENT_TOKEN})`,
  )
  .trim();

function InlineDefaultLogo({className, ariaLabel, width, height}) {
  const gradientId = useId().replace(/:/g, '');
  const logoMarkup = useMemo(
    () =>
      DEFAULT_LOGO_TEMPLATE.replaceAll(DEFAULT_LOGO_GRADIENT_TOKEN, gradientId),
    [gradientId],
  );

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={DEFAULT_LOGO_VIEWBOX}
      role="img"
      aria-label={ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{__html: logoMarkup}}
    />
  );
}

export function Header({header, isLoggedIn, cart, publicStoreDomain}) {
  const {shop, menu} = header;
  const menuItems = Array.isArray(menu?.items) ? menu.items : [];
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [mobileMenuPath, setMobileMenuPath] = useState([]);
  const [isSearchResultsVisible, setSearchResultsVisible] = useState(false);
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [placeholder, setPlaceholder] = useState('Search products');
  const searchContainerRef = useRef(null);
  const desktopMenuRef = useRef(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const timeoutRef = useRef(null);
  const blinkIntervalRef = useRef(null);
  const {items} = useWishlist();
  const wishCount = items.length;

  const optimisticCart = useOptimisticCart(cart);
  const cartCount =
    optimisticCart?.totalQuantity ??
    (Array.isArray(optimisticCart?.lines?.edges)
      ? optimisticCart.lines.edges.reduce(
          (n, e) => n + (e?.node?.quantity ?? 0),
          0,
        )
      : 0);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        setMobileMenuPath([]);
      }
      return next;
    });
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileMenuPath([]);
  };

  const toggleDesktopMenu = () => {
    setDesktopMenuOpen((prev) => !prev);
  };

  const closeDesktopMenu = () => {
    setDesktopMenuOpen(false);
  };

  const currentMobileMenu =
    mobileMenuPath.length > 0
      ? mobileMenuPath[mobileMenuPath.length - 1]
      : null;

  const openMobileSubmenu = (item) => {
    setMobileMenuPath((prev) => [...prev, item]);
  };

  const closeMobileSubmenu = () => {
    setMobileMenuPath((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setSearchResultsVisible(false);
        setOverlayVisible(false);
        searchContainerRef.current?.classList.remove('fixed-search');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.documentElement.classList.add('no-scroll');
    } else {
      document.documentElement.classList.remove('no-scroll');
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isDesktopMenuOpen) return;

    const handleClickOutside = (event) => {
      if (
        desktopMenuRef.current &&
        !desktopMenuRef.current.contains(event.target)
      ) {
        closeDesktopMenu();
      }
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        closeDesktopMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isDesktopMenuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      setIsHeaderScrolled(window.scrollY > 0);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, {passive: true});

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const location = useLocation();

  useEffect(() => {
    closeDesktopMenu();
  }, [location.pathname]);

  const logoAlt = '961souq logo';

  /* --------- AUTOMATIC PLACEHOLDER TYPING REMOVED --------- */

  return (
    <>
      <SearchGlassFilterDefs />
      <HeaderGlassFilterDefs />
      <header className={`header ${isHeaderScrolled ? 'is-scrolled' : ''}`}>
        <div className="header-top-background" aria-hidden="true"></div>
        <div className="header-top">
          <button
            className="mobile-menu-toggle"
            name="Mobile Menu Button"
            aria-label="Mobile Menu Button"
            onClick={toggleMobileMenu}
          >
            <svg
              width="30px"
              height="30px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="#000"
            >
              <path
                d="M5 6H12H19M5 12H19M5 18H19"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
              ></path>
            </svg>
          </button>
          <NavLink prefetch="intent" to="/" className="logo-link" end>
            <InlineDefaultLogo className="header-logo" ariaLabel={logoAlt} />
          </NavLink>
          {/* <SearchFormPredictive className="header-search">
            {({inputRef, fetchResults, goToSearch, fetcher}) => {
              useFocusOnSlash(inputRef);

              const handleFocus = () => {
                if (window.innerWidth < 1024) {
                  searchContainerRef.current?.classList.add('fixed-search');
                  setOverlayVisible(true);
                }
                clearTimeout(timeoutRef.current);
                clearInterval(blinkIntervalRef.current);
                setIsInputFocused(true);
                setSearchResultsVisible(true);
              };

              const handleBlur = () => {
                setIsInputFocused(false);
                if (window.innerWidth < 1024) {
                  const inputValue = inputRef.current?.value.trim();
                  if (!inputValue) {
                    searchContainerRef.current?.classList.remove(
                      'fixed-search',
                    );
                    setOverlayVisible(false);
                  }
                }
                setPlaceholder('Search products');
              };

              const handleCloseSearch = () => {
                searchContainerRef.current?.classList.remove('fixed-search');
                setOverlayVisible(false);
                setSearchResultsVisible(false);
              };

              const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCloseSearch();
                  if (inputRef.current) {
                    inputRef.current.value = '';
                    fetchResults({target: {value: ''}});
                  }
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              };

              const handleSearch = () => {
                if (inputRef.current) {
                  const rawTerm = inputRef.current.value.trim();
                  const term = rawTerm.replace(/\s+/g, '-');
                  if (rawTerm) {
                    trackSearch(rawTerm);
                    window.location.href = `${SEARCH_ENDPOINT}?q=${term}`;
                  }
                }
              };

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
                  <div
                    className={`search-overlay ${
                      isOverlayVisible ? 'active' : ''
                    }`}
                    onClick={handleCloseSearch}
                  ></div>

                  <div ref={searchContainerRef} className="main-search">
                    <div className="search-container">
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder={isInputFocused ? '' : placeholder}
                        onChange={(e) => {
                          fetchResults(e);
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
                          onClick={() => {
                            inputRef.current.value = '';
                            setSearchResultsVisible(false);
                            fetchResults({target: {value: ''}});
                          }}
                          aria-label="Clear search"
                        >
                          <svg
                            fill="#03072c"
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
                        data-tt-event="Search"
                        className="search-bar-submit"
                        aria-label="Search"
                      >
                        <SearchIcon />
                      </button>
                    </div>
                    {isSearchResultsVisible && (
                      <div className="search-results-container">
                        {fetcher.state === 'loading' || !fetcher.data ? null : (
                          <SearchResultsPredictive>
                            {({items, total, term, state, closeSearch}) => {
                              const {products} = items;
                              if (!total) {
                                return (
                                  <SearchResultsPredictive.Empty term={term} />
                                );
                              }
                              return (
                                <>
                                  <SearchResultsPredictive.Products
                                    products={products}
                                    closeSearch={() => {
                                      closeSearch();
                                      handleCloseSearch();
                                    }}
                                    term={term}
                                  />
                                  {term.current && total ? (
                                    <Link
                                      onClick={() => {
                                        closeSearch();
                                        handleCloseSearch();
                                      }}
                                      to={`${SEARCH_ENDPOINT}?q=${term.current.replace(
                                        /\s+/g,
                                        '-',
                                      )}`}
                                      className="view-all-results"
                                    >
                                      <p>
                                        View all results for{' '}
                                        <q>{term.current}</q> &nbsp; →
                                      </p>
                                    </Link>
                                  ) : null}
                                </>
                              );
                            }}
                          </SearchResultsPredictive>
                        )}
                      </div>
                    )}
                  </div>
                </>
              );
            }}
          </SearchFormPredictive> */}
          {/* <SearchForm /> */}

          <div className="desktop-logo-nav" ref={desktopMenuRef}>
            <button
              type="button"
              className={`desktop-menu-toggle ${
                isDesktopMenuOpen ? 'is-open' : ''
              }`}
              aria-label="Open desktop menu"
              aria-expanded={isDesktopMenuOpen}
              onClick={toggleDesktopMenu}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <NavLink to="/" prefetch="intent" className={'desk-nav-logo'}>
              <InlineDefaultLogo
                className="desktop-header-logo"
                ariaLabel={logoAlt}
                width={120}
                height={70}
              />
            </NavLink>

            <div
              className={`desktop-menu-dropdown ${
                isDesktopMenuOpen ? 'is-open' : 'is-closed'
              }`}
            >
              <HeaderMenu
                menu={{items: menuItems}}
                viewport="desktop-hamburger"
                onNavigate={closeDesktopMenu}
                isOpen={isDesktopMenuOpen}
              />
            </div>
          </div>
          <LazyTypesenseSearch placeholder="Search Products" />
          {/* <InstantSearchBar action="/search" /> */}
          {/* <AlgoliaSearch /> */}
          <div className="header-ctas">
            <NavLink
              prefetch="intent"
              to="/account"
              className="sign-in-link mobile-user-icon"
              aria-label="Account"
              target="_blank"
              rel="noreferrer noopener"
            >
              <UserIcon />
            </NavLink>
            <NavLink
              prefetch="intent"
              to="/wishlist"
              className="wishlist-icon"
              aria-label={`Wishlist${wishCount ? ` (${wishCount})` : ''}`}
            >
              <div className="wishlist-icon-wrap">
                <WishListIcon />
                {wishCount > 0 && (
                  <span className="wishlist-count-badge">{wishCount}</span>
                )}
              </div>
            </NavLink>

            <CartToggle count={cartCount} />
          </div>
        </div>
      </header>

      {/* Mobile menu overlay/backdrop rendered solely on open */}
      {isMobileMenuOpen && (
        <>
          <div className="mobile-menu-backdrop" onClick={closeMobileMenu}></div>

          <div className="mobile-menu-overlay">
            <button className="mobile-menu-close" onClick={closeMobileMenu}>
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
            <h3>Menu</h3>
            <div
              className={`mobile-menu-content ${
                currentMobileMenu ? 'hidden' : ''
              }`}
            >
              {menuItems.map((item) => {
                const path = getMenuPath(item.url);
                const hasChildren =
                  Array.isArray(item.items) && item.items.length > 0;

                return (
                  <div key={item.id} className="mobile-menu-item">
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => openMobileSubmenu(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 0',
                          width: '100%',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {item.imageUrl && (
                          <div
                            style={{
                              width: '50px',
                              height: '50px',
                              filter: 'blur(0px)',
                              opacity: 1,
                              transition: 'filter 0.3s, opacity 0.3s',
                            }}
                          >
                            <img
                              sizes="(min-width: 45em) 20vw, 40vw"
                              srcSet={`${item.imageUrl}&width=150 300w,
                         ${item.imageUrl}&width=150 600w,
                         ${item.imageUrl}&width=150 1200w`}
                              alt={item.altText || item.title}
                              width="50px"
                              height="50px"
                            />
                          </div>
                        )}
                        {item.title}
                        <span className="mobile-menu-arrow">
                          <svg
                            fill="#000"
                            height="18px"
                            width="18px"
                            viewBox="0 0 24 24"
                            stroke="#000"
                            strokeWidth="0.00024"
                          >
                            <polygon points="6.8,23.7 5.4,22.3 15.7,12 5.4,1.7 6.8,0.3 18.5,12"></polygon>
                          </svg>
                        </span>
                      </button>
                    ) : (
                      <NavLink
                        to={path}
                        onClick={closeMobileMenu}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 0',
                          width: '100%',
                        }}
                      >
                        {item.imageUrl && (
                          <div
                            style={{
                              width: '50px',
                              height: '50px',
                              filter: 'blur(0px)',
                              opacity: 1,
                              transition: 'filter 0.3s, opacity 0.3s',
                            }}
                          >
                            <img
                              sizes="(min-width: 45em) 20vw, 40vw"
                              srcSet={`${item.imageUrl}&width=150 300w,
                         ${item.imageUrl}&width=150 600w,
                         ${item.imageUrl}&width=150 1200w`}
                              alt={item.altText || item.title}
                              width="50px"
                              height="50px"
                            />
                          </div>
                        )}
                        {item.title}
                      </NavLink>
                    )}
                  </div>
                );
              })}
            </div>

            {currentMobileMenu && (
              <div
                className="mobile-submenu-drawer active"
                data-id={currentMobileMenu.id}
              >
                <button className="back-button" onClick={closeMobileSubmenu}>
                  <svg
                    fill="#000"
                    height="14px"
                    width="14px"
                    viewBox="0 0 24 24"
                    transform="matrix(-1,0,0,1,0,0)"
                  >
                    <polygon points="6.8,23.7 5.4,22.3 15.7,12 5.4,1.7 6.8,0.3 18.5,12"></polygon>
                  </svg>
                  Back
                </button>
                <div className="submenu-list">
                  <NavLink
                    to={getMenuPath(currentMobileMenu.url)}
                    onClick={closeMobileMenu}
                    className="mobile-main-collection-link"
                  >
                    View all in {currentMobileMenu.title}
                  </NavLink>
                  {currentMobileMenu.items?.map((subItem) => {
                    const path = getMenuPath(subItem.url);
                    const hasChildren =
                      Array.isArray(subItem.items) && subItem.items.length > 0;

                    return hasChildren ? (
                      <div key={subItem.id} className="mobile-menu-item">
                        <button
                          type="button"
                          onClick={() => openMobileSubmenu(subItem)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 0',
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {subItem.imageUrl && (
                            <div
                              style={{
                                width: '50px',
                                height: '50px',
                                filter: 'blur(0px)',
                                opacity: 1,
                                transition: 'filter 0.3s, opacity 0.3s',
                              }}
                            >
                              <img
                                sizes="(min-width: 45em) 20vw, 40vw"
                                srcSet={`${subItem.imageUrl}&width=150 300w,
                                       ${subItem.imageUrl}&width=150 600w,
                                       ${subItem.imageUrl}&width=150 1200w`}
                                alt={subItem.altText || subItem.title}
                                className="submenu-item-image"
                                width="50px"
                                height="50px"
                              />
                            </div>
                          )}
                          {subItem.title}
                          <span className="mobile-menu-arrow">
                            <svg
                              fill="#000"
                              height="18px"
                              width="18px"
                              viewBox="0 0 24 24"
                              stroke="#000"
                              strokeWidth="0.00024"
                            >
                              <polygon points="6.8,23.7 5.4,22.3 15.7,12 5.4,1.7 6.8,0.3 18.5,12"></polygon>
                            </svg>
                          </span>
                        </button>
                      </div>
                    ) : (
                      <NavLink
                        key={subItem.id}
                        to={path}
                        onClick={closeMobileMenu}
                      >
                        {subItem.imageUrl && (
                          <div
                            style={{
                              width: '50px',
                              height: '50px',
                              filter: 'blur(0px)',
                              opacity: 1,
                              transition: 'filter 0.3s, opacity 0.3s',
                            }}
                          >
                            <img
                              sizes="(min-width: 45em) 20vw, 40vw"
                              srcSet={`${subItem.imageUrl}&width=150 300w,
                                       ${subItem.imageUrl}&width=150 600w,
                                       ${subItem.imageUrl}&width=150 1200w`}
                              alt={subItem.altText || subItem.title}
                              className="submenu-item-image"
                              width="50px"
                              height="50px"
                            />
                          </div>
                        )}
                        {subItem.title}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export function HeaderMenu({menu, viewport, onNavigate, isOpen = false}) {
  const [expandedByLevel, setExpandedByLevel] = useState({});
  const hasDesktopMenu =
    viewport === 'desktop-hamburger' && menu?.items?.length;

  if (!hasDesktopMenu) {
    return null;
  }

  useEffect(() => {
    if (!isOpen) {
      setExpandedByLevel({});
    }
  }, [isOpen]);

  const toggleItem = (itemId, level) => {
    setExpandedByLevel((prev) => {
      const next = {...prev};
      const levelKey = String(level);
      const isSameItemOpen = next[levelKey] === itemId;

      Object.keys(next).forEach((key) => {
        if (Number(key) >= level) {
          delete next[key];
        }
      });

      if (!isSameItemOpen) {
        next[levelKey] = itemId;
      }

      return next;
    });
  };

  const renderMenuItems = (items = [], level = 1) => (
    <ul className={`desktop-menu-level desktop-menu-level-${level}`}>
      {items.map((item) => {
        const hasChildren = Array.isArray(item.items) && item.items.length > 0;
        const path = getMenuPath(item.url);
        const isExpanded = expandedByLevel[String(level)] === item.id;

        return (
          <li
            key={item.id}
            className={`desktop-menu-item desktop-menu-item-level-${level}${
              hasChildren ? ' desktop-menu-item-has-children' : ''
            }${isExpanded ? ' is-expanded' : ''}`}
          >
            <div
              className="desktop-menu-row"
              onClick={
                hasChildren ? () => toggleItem(item.id, level) : undefined
              }
            >
              {hasChildren ? (
                <button
                  type="button"
                  className="desktop-menu-link desktop-menu-link-button"
                  aria-expanded={isExpanded}
                  aria-controls={`desktop-submenu-${item.id}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleItem(item.id, level);
                  }}
                >
                  {item.title}
                </button>
              ) : (
                <NavLink
                  to={path}
                  onClick={onNavigate}
                  className={({isActive}) =>
                    isActive
                      ? 'desktop-menu-link desktop-menu-link-active'
                      : 'desktop-menu-link'
                  }
                >
                  {item.title}
                </NavLink>
              )}

              {hasChildren ? (
                <button
                  type="button"
                  className={`desktop-submenu-toggle ${
                    isExpanded ? 'is-open' : ''
                  }`}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${
                    item.title
                  } submenu`}
                  aria-expanded={isExpanded}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleItem(item.id, level);
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 8L14 12L10 16"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ) : null}
            </div>

            {hasChildren ? (
              <div
                id={`desktop-submenu-${item.id}`}
                className={`desktop-submenu-panel desktop-submenu-panel-level-${
                  level + 1
                } ${isExpanded ? 'is-open' : 'is-closed'}`}
                aria-hidden={!isExpanded}
              >
                <NavLink
                  to={path}
                  className="desktop-main-collection-link"
                  onClick={onNavigate}
                >
                  View all in {item.title}
                </NavLink>
                {renderMenuItems(item.items, level + 1)}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav
      className="desktop-menu-nav"
      role="navigation"
      aria-label="Desktop menu"
    >
      {renderMenuItems(menu.items)}
    </nav>
  );
}

function CartToggle({count = 0}) {
  const {open} = useAside();

  return (
    <button
      className="cart-button reset"
      onClick={() => open('cart')}
      aria-label={`Open Cart${count ? ` (${count})` : ''}`}
    >
      <div style={{position: 'relative', display: 'inline-block'}}>
        <CartIcon />
        <span
          className="cart-count-badge"
          aria-hidden="true"
          data-count={count}
          style={{
            opacity: count > 0 ? 1 : 0, // always in DOM
          }}
        >
          {count}
        </span>
      </div>
    </button>
  );
}

function WishListIcon() {
  return (
    <svg
      width="64px"
      height="64px"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        {' '}
        <path
          d="M1.24264 8.24264L8 15L14.7574 8.24264C15.553 7.44699 16 6.36786 16 5.24264V5.05234C16 2.8143 14.1857 1 11.9477 1C10.7166 1 9.55233 1.55959 8.78331 2.52086L8 3.5L7.21669 2.52086C6.44767 1.55959 5.28338 1 4.05234 1C1.8143 1 0 2.8143 0 5.05234V5.24264C0 6.36786 0.44699 7.44699 1.24264 8.24264Z"
          fill="#fff"
        ></path>{' '}
      </g>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="64px"
      height="64px"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="#"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        {' '}
        <path
          d="M8 7C9.65685 7 11 5.65685 11 4C11 2.34315 9.65685 1 8 1C6.34315 1 5 2.34315 5 4C5 5.65685 6.34315 7 8 7Z"
          fill="#fff"
        ></path>{' '}
        <path
          d="M14 12C14 10.3431 12.6569 9 11 9H5C3.34315 9 2 10.3431 2 12V15H14V12Z"
          fill="#fff"
        ></path>{' '}
      </g>
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
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

function CartIcon() {
  return (
    <svg
      width="64px"
      height="64px"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      fill="#fff"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        {' '}
        <title>cart-shopping-solid</title>{' '}
        <g id="Layer_2" data-name="Layer 2">
          {' '}
          <g id="invisible_box" data-name="invisible box">
            {' '}
            <rect width="48" height="48" fill="none"></rect>{' '}
          </g>{' '}
          <g id="icons_Q2" data-name="icons Q2">
            {' '}
            <path d="M44.3,10A3.3,3.3,0,0,0,42,9H11.5l-.4-3.4A3,3,0,0,0,8.1,3H5A2,2,0,0,0,5,7H7.2l3.2,26.9A5.9,5.9,0,0,0,7.5,39a6,6,0,0,0,6,6,6.2,6.2,0,0,0,5.7-4H29.8a6.2,6.2,0,0,0,5.7,4,6,6,0,0,0,0-12,6.2,6.2,0,0,0-5.7,4H19.2a6,6,0,0,0-4.9-3.9L14.1,31H39.4a3,3,0,0,0,2.9-2.6L45,12.6A3.6,3.6,0,0,0,44.3,10ZM37.5,39a2,2,0,1,1-2-2A2,2,0,0,1,37.5,39Zm-22,0a2,2,0,1,1-2-2A2,2,0,0,1,15.5,39Z"></path>{' '}
          </g>{' '}
        </g>{' '}
      </g>
    </svg>
  );
}

export function useFocusOnSlash(inputRef) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === '/') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        inputRef.current?.blur();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inputRef]);
}
