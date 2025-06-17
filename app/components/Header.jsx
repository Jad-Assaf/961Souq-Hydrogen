import {useEffect, useState, useRef} from 'react';
import {Link, NavLink} from '@remix-run/react';
import {useAside} from '~/components/Aside';
import {Image} from '@shopify/hydrogen-react';
import {SearchFormPredictive, SEARCH_ENDPOINT} from './SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';
import {trackSearch} from '~/lib/metaPixelEvents'; // Import the trackSearch function
// import { SearchForm } from '~/routes/search';

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
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/961souqLogo-1_2.png?v=1709718912&width=400"
              alt={`${shop.name} Logo`}
              className="header-logo"
              width="100"
              height="50"
            />
          </NavLink>

          <SearchFormPredictive className="header-search">
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
          </SearchFormPredictive>
          {/* <SearchForm /> */}

          <div className="header-ctas">
            <NavLink
              prefetch="intent"
              to="/account"
              className="sign-in-link mobile-user-icon"
              aria-label="Account"
            >
              <UserIcon />
            </NavLink>
            <CartToggle cart={cart} />
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
              {menu.items.map((item) => (
                <div key={item.id} className="mobile-menu-item">
                  <button onClick={() => openSubmenu(item.id)}>
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
                  </button>
                </div>
              ))}
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

function CartToggle({cart}) {
  const {open} = useAside();

  return (
    <button
      className="cart-button reset"
      onClick={() => open('cart')}
      aria-label="Open Cart"
    >
      <CartIcon />
    </button>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM15 9C15 10.6569 13.6569 12 12 12C10.3431 12 9 10.6569 9 9C9 7.34315 10.3431 6 12 6C13.6569 6 15 7.34315 15 9ZM12 20.5C13.784 20.5 15.4397 19.9504 16.8069 19.0112C17.4108 18.5964 17.6688 17.8062 17.3178 17.1632C16.59 15.8303 15.0902 15 11.9999 15C8.90969 15 7.40997 15.8302 6.68214 17.1632C6.33105 17.8062 6.5891 18.5963 7.19296 19.0111C8.56018 19.9503 10.2159 20.5 12 20.5Z"
          fill="#2172af"
        ></path>
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
      fill="#2172af"
      height="200px"
      width="200px"
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 300.005 300.005"
      xmlSpace="preserve"
      stroke="#2172af"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <g>
          <g>
            <g>
              <path d="M182.936,76.966h-0.002c0-18.516-15.066-33.58-33.58-33.58c-18.516,0-33.58,15.064-33.58,33.58v11.671h67.162V76.966z"></path>{' '}
              <path d="M206.585,104.199h-8.09v10.911c2.498,2.179,4.113,5.351,4.113,8.93c0,6.57-5.325,11.897-11.894,11.897 c-6.564,0-11.894-5.327-11.894-11.897c0-3.577,1.611-6.749,4.113-8.927v-10.914h-67.162v10.911c2.5,2.181,4.113,5.351,4.113,8.93 c0,6.57-5.327,11.897-11.894,11.897c-6.57,0-11.894-5.327-11.894-11.897c0-3.577,1.613-6.751,4.113-8.93v-10.911h-8.09 c-4.573,0-8.292,3.719-8.292,8.292v111.168c0,4.573,3.719,8.292,8.292,8.292h114.465c4.57,0,8.292-3.722,8.292-8.292V112.491 C214.877,107.918,211.155,104.199,206.585,104.199z"></path>{' '}
              <path d="M150,0C67.159,0,0.002,67.162,0.002,150S67.159,300.005,150,300.005S300.003,232.841,300.003,150S232.841,0,150,0z M230.439,223.659c0,13.152-10.704,23.854-23.854,23.854H92.121c-13.152,0-23.854-10.701-23.854-23.854V112.491 c0-13.152,10.701-23.854,23.854-23.854h8.09V76.966c0-27.098,22.046-49.142,49.142-49.142s49.142,22.046,49.142,49.142v11.671 h8.09c13.15,0,23.854,10.701,23.854,23.854V223.659z"></path>{' '}
            </g>
          </g>
        </g>
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
