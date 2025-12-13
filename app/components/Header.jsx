import {useEffect, useState, useRef, useMemo} from 'react';
import {Link, NavLink, useLocation} from '@remix-run/react';
import {useAside} from '~/components/Aside';
import {Image} from '@shopify/hydrogen-react';
import {SearchFormPredictive, SEARCH_ENDPOINT} from './SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';
import {trackSearch} from '~/lib/metaPixelEvents'; // Import the trackSearch function
import AlgoliaSearch from './StorefrontSearch';
import {useWishlist} from '~/lib/WishlistContext';
import { useOptimisticCart } from '@shopify/hydrogen';
import { InstantSearchBar } from './InstantSearchBar';
import { TypesenseSearch } from './TypesenseSearch';

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

function getMobileMenuPath(url) {
  if (!url) return '/';

  try {
    // Works for both absolute and relative URLs
    const pathname = new URL(url, 'https://dummy.base').pathname;

    if (pathname.startsWith('/collections/')) {
      const segments = pathname.split('/').filter(Boolean); // ["collections", "apple"]
      const handle = segments[segments.length - 1]; // "apple"
      return `/${handle}`; // → "/apple"
    }

    return pathname;
  } catch {
    return '/';
  }
}

export function Header({header, isLoggedIn, cart, publicStoreDomain}) {
  const {shop, menu} = header;
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [isSearchResultsVisible, setSearchResultsVisible] = useState(false);
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [placeholder, setPlaceholder] = useState('Search products');
  const searchContainerRef = useRef(null);
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
    setMobileMenuOpen((prev) => !prev);
    if (!isMobileMenuOpen) setActiveSubmenu(null);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setActiveSubmenu(null);
  };

  const openSubmenu = (itemId) => {
    setActiveSubmenu(itemId);
    requestAnimationFrame(() => {
      const drawer = document.querySelector(
        `.mobile-submenu-drawer[data-id="${itemId}"]`,
      );
      if (drawer) drawer.classList.add('active');
    });
  };

  const closeSubmenu = () => {
    const activeDrawer = document.querySelector(
      '.mobile-submenu-drawer.active',
    );
    if (activeDrawer) {
      activeDrawer.classList.remove('active');
      setTimeout(() => setActiveSubmenu(null), 300);
    }
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

  const location = useLocation();
  const isBlackNovember =
    location.pathname === '/black-november' ||
    location.pathname === '/black-november/';
  const isChristmas =
    location.pathname === '/christmas' || location.pathname === '/christmas/';

  const DEFAULT_LOGO =
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/961souqLogo-1_2.png?v=1709718912&width=400';
  const BLACK_NOVEMBER_LOGO =
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/961souqLogo-white_6a233cc8-9b7b-415c-b352-84aac4668966.png?v=1762774820';



  /* --------- AUTOMATIC PLACEHOLDER TYPING REMOVED --------- */

  return (
    <>
      <header className="header">
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
                stroke="#2172af"
                strokeWidth="2"
                strokeLinecap="round"
              ></path>
            </svg>
          </button>
          <NavLink prefetch="intent" to="/" className="logo-link" end>
            <img
              src={
                isBlackNovember || isChristmas
                  ? BLACK_NOVEMBER_LOGO
                  : DEFAULT_LOGO
              }
              alt={
                isBlackNovember
                  ? '961souq Black November logo'
                  : '961souq logo' || isChristmas
                  ? '961souq Black November logo'
                  : '961souq logo'
              }
              className="header-logo"
              width="100"
              height="50"
            />
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
                            fill="#2172af"
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

          <NavLink to="/" prefetch="intent" className={'desk-nav-logo'}>
            <img
              src={
                isBlackNovember || isChristmas
                  ? BLACK_NOVEMBER_LOGO
                  : DEFAULT_LOGO
              }
              alt={
                isBlackNovember
                  ? '961souq Black November logo'
                  : '961souq logo' || isChristmas
                  ? '961souq Black November logo'
                  : '961souq logo'
              }
              width="120"
              height="47"
            />
          </NavLink>
          <TypesenseSearch placeholder="Search Products" />
          {/* <InstantSearchBar action="/search" /> */}
          {/* <AlgoliaSearch /> */}
          <div className="header-ctas">
            <NavLink
              prefetch="intent"
              to="/account"
              className="sign-in-link mobile-user-icon"
              aria-label="Account"
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

        {/* Desktop navigation always visible */}
        <div className="header-bottom">
          <HeaderMenu
            menu={menu}
            viewport="desktop"
            primaryDomainUrl={header.shop.primaryDomain.url}
            publicStoreDomain={publicStoreDomain}
          />
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
              className={`mobile-menu-content ${activeSubmenu ? 'hidden' : ''}`}
            >
              {menu.items.map((item) => {
                const mobilePath = getMobileMenuPath(item.url);

                return (
                  <div key={item.id} className="mobile-menu-item">
                    <NavLink
                      to={mobilePath}
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
                      <span className="mobile-menu-arrow">
                        <svg
                          fill="#000"
                          height="14px"
                          width="14px"
                          viewBox="0 0 24 24"
                          stroke="#000"
                          strokeWidth="0.00024"
                        >
                          <polygon points="6.8,23.7 5.4,22.3 15.7,12 5.4,1.7 6.8,0.3 18.5,12"></polygon>
                        </svg>
                      </span>
                    </NavLink>
                  </div>
                );
              })}
            </div>

            {activeSubmenu && (
              <div className="mobile-submenu-drawer" data-id={activeSubmenu}>
                <button className="back-button" onClick={closeSubmenu}>
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
                  {menu.items
                    .find((item) => item.id === activeSubmenu)
                    ?.items.map((subItem) => (
                      <NavLink
                        key={subItem.id}
                        to={new URL(subItem.url).pathname}
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
                    ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export function HeaderMenu({menu, viewport}) {
  const {close} = useAside();

  useEffect(() => {
    const menuItems = document.querySelectorAll('.menu-item-level-1');

    const handleMouseEnter = (event) => {
      const submenus = event.currentTarget.querySelectorAll('.submenu');
      submenus.forEach((submenu) => {
        submenu.classList.add('show');
      });
    };

    const handleMouseLeave = (event) => {
      const submenus = event.currentTarget.querySelectorAll('.submenu');
      submenus.forEach((submenu) => {
        submenu.classList.remove('show');
      });
    };

    const handleLinkClick = () => {
      menuItems.forEach((item) => {
        const submenus = item.querySelectorAll('.submenu');
        submenus.forEach((submenu) => {
          submenu.classList.remove('show');
        });
      });
    };

    menuItems.forEach((item) => {
      item.addEventListener('mouseenter', handleMouseEnter);
      item.addEventListener('mouseleave', handleMouseLeave);

      const links = item.querySelectorAll('a');
      links.forEach((link) => {
        link.addEventListener('click', handleLinkClick);
      });
    });

    return () => {
      menuItems.forEach((item) => {
        item.removeEventListener('mouseenter', handleMouseEnter);
        item.removeEventListener('mouseleave', handleMouseLeave);

        const links = item.querySelectorAll('a');
        links.forEach((link) => {
          link.removeEventListener('click', handleLinkClick);
        });
      });
    };
  }, []);

  const renderMenuItems = (items = [], level = 1) =>
    items.map((item) => (
      <div key={item.id} className={`menu-item-level-${level}`}>
        <NavLink to={new URL(item.url).pathname}>{item.title}</NavLink>
        {item.items?.length > 0 && (
          <div className={`submenu submenu-level-${level}`}>
            {renderMenuItems(item.items, level + 1)}
          </div>
        )}
      </div>
    ));

  return (
    // <nav className={`header-menu-${viewport}`} role="navigation">
    //   {renderMenuItems(menu?.items)}
    // </nav>
    <div></div>
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
        stroke-linejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        {' '}
        <path
          d="M1.24264 8.24264L8 15L14.7574 8.24264C15.553 7.44699 16 6.36786 16 5.24264V5.05234C16 2.8143 14.1857 1 11.9477 1C10.7166 1 9.55233 1.55959 8.78331 2.52086L8 3.5L7.21669 2.52086C6.44767 1.55959 5.28338 1 4.05234 1C1.8143 1 0 2.8143 0 5.05234V5.24264C0 6.36786 0.44699 7.44699 1.24264 8.24264Z"
          fill="#2172af"
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
        stroke-linejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        {' '}
        <path
          d="M8 7C9.65685 7 11 5.65685 11 4C11 2.34315 9.65685 1 8 1C6.34315 1 5 2.34315 5 4C5 5.65685 6.34315 7 8 7Z"
          fill="#2172af"
        ></path>{' '}
        <path
          d="M14 12C14 10.3431 12.6569 9 11 9H5C3.34315 9 2 10.3431 2 12V15H14V12Z"
          fill="#2172af"
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

function CartIcon() {
  return (
    <svg
      width="64px"
      height="64px"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      fill="#2172af"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        stroke-linejoin="round"
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
