import {useEffect, useState, useRef} from 'react';
import {Link, NavLink} from '@remix-run/react';
import {useAside} from '~/components/Aside';
import {Image} from '@shopify/hydrogen-react';
import {SearchFormPredictive, SEARCH_ENDPOINT} from './SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';
import {trackSearch} from '~/lib/metaPixelEvents'; // Import the trackSearch function

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

  useEffect(() => {
    if (isInputFocused) {
      clearTimeout(timeoutRef.current);
      clearInterval(blinkIntervalRef.current);
      return;
    }

    const texts =
      window.innerWidth > 1024
        ? ['Press /', 'Search products', 'Find items', 'Type something']
        : ['Search products', 'Find items', 'Type something'];

    let textIndex = 0;
    let currentText = texts[textIndex];
    let charIndex = 0;
    let deleting = false;
    let showCursor = true;

    const blinkCursor = () => {
      showCursor = !showCursor;
      if (!deleting && charIndex === currentText.length) {
        setPlaceholder(currentText + (showCursor ? '|' : ''));
      }
    };

    const updatePlaceholder = () => {
      if (deleting) {
        if (charIndex > 0) {
          charIndex--;
          setPlaceholder(currentText.substring(0, charIndex) + '|');
          timeoutRef.current = setTimeout(updatePlaceholder, 100);
        } else {
          deleting = false;
          textIndex = (textIndex + 1) % texts.length;
          currentText = texts[textIndex];
          timeoutRef.current = setTimeout(updatePlaceholder, 500);
        }
      } else {
        if (charIndex < currentText.length) {
          charIndex++;
          setPlaceholder(currentText.substring(0, charIndex) + '|');
          timeoutRef.current = setTimeout(updatePlaceholder, 100);
        } else {
          blinkIntervalRef.current = setInterval(blinkCursor, 500);
          timeoutRef.current = setTimeout(() => {
            clearInterval(blinkIntervalRef.current);
            deleting = true;
            timeoutRef.current = setTimeout(updatePlaceholder, 500);
          }, 2000);
        }
      }
    };

    timeoutRef.current = setTimeout(updatePlaceholder, 2000);
    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(blinkIntervalRef.current);
    };
  }, [isInputFocused]);

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
                if (e.key === 'Enter') {
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
                        className="search-bar-submit"
                        aria-label="Search"
                      >
                        <SearchIcon />
                      </button>
                    </div>
                    {isSearchResultsVisible && (
                      <div className="search-results-container">
                        {fetcher.state === 'loading' || !fetcher.data ? (
                          <div
                            className="predictive-search-result"
                            key="skeleton"
                          >
                            <h5>Products</h5>
                            <ul>
                              {[...Array(8)].map((_, i) => (
                                <li
                                  key={i}
                                  className="predictive-search-result-item skeleton"
                                >
                                  <div className="search-result-txt">
                                    <div className="search-result-titDesc skeleton-div">
                                      <div className="skeleton skeleton-image"></div>
                                      <div className="skeleten-tds">
                                        <p className="skeleton skeleton-title"></p>
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
                          srcSet={`${item.imageUrl}?width=300&quality=1 300w,
                                   ${item.imageUrl}?width=600&quality=1 600w,
                                   ${item.imageUrl}?width=1200&quality=1 1200w`}
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
                              srcSet={`${subItem.imageUrl}?width=300&quality=1 300w,
                                       ${subItem.imageUrl}?width=600&quality=1 600w,
                                       ${subItem.imageUrl}?width=1200&quality=1 1200w`}
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
    <nav className={`header-menu-${viewport}`} role="navigation">
      {renderMenuItems(menu?.items)}
    </nav>
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      width="100%"
      height="100%"
    >
      <path d="M486.4 563.2c-155.275 0-281.6-126.325-281.6-281.6s126.325-281.6 281.6-281.6 281.6 126.325 281.6 281.6-126.325 281.6-281.6 281.6zM486.4 51.2c-127.043 0-230.4 103.357-230.4 230.4s103.357 230.4 230.4 230.4c127.042 0 230.4-103.357 230.4-230.4s-103.358-230.4-230.4-230.4z" />
      <path d="M896 1024h-819.2c-42.347 0-76.8-34.451-76.8-76.8 0-3.485 0.712-86.285 62.72-168.96 36.094-48.126 85.514-86.36 146.883-113.634 74.957-33.314 168.085-50.206 276.797-50.206 108.71 0 201.838 16.893 276.797 50.206 61.37 27.275 110.789 65.507 146.883 113.634 62.008 82.675 62.72 165.475 62.72 168.96 0 42.349-34.451 76.8-76.8 76.8zM486.4 665.6c-178.52 0-310.267 48.789-381 141.093-53.011 69.174-54.195 139.904-54.2 140.61 0 14.013 11.485 25.498 25.6 25.498h819.2c14.115 0 25.6-11.485 25.6-25.6-0.006-0.603-1.189-71.333-54.198-140.507-70.734-92.304-202.483-141.093-381.002-141.093z" />
    </svg>
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

function CartIcon() {
  return (
    <svg
      viewBox="0 0 1024 1024"
      className="icon icon-cart stroke-w-5"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M409.6 1024c-56.464 0-102.4-45.936-102.4-102.4s45.936-102.4 102.4-102.4S512 865.136 512 921.6 466.064 1024 409.6 1024zm0-153.6c-28.232 0-51.2 22.968-51.2 51.2s22.968 51.2 51.2 51.2 51.2-22.968 51.2-51.2-22.968-51.2-51.2-51.2z" />
      <path d="M768 1024c-56.464 0-102.4-45.936-102.4-102.4S711.536 819.2 768 819.2s102.4 45.936 102.4 102.4S824.464 1024 768 1024zm0-153.6c-28.232 0-51.2 22.968-51.2 51.2s22.968 51.2 51.2 51.2 51.2-22.968 51.2-51.2-22.968-51.2-51.2-51.2z" />
      <path d="M898.021 228.688C885.162 213.507 865.763 204.8 844.8 204.8H217.954l-5.085-30.506C206.149 133.979 168.871 102.4 128 102.4H76.8c-14.138 0-25.6 11.462-25.6 25.6s11.462 25.6 25.6 25.6H128c15.722 0 31.781 13.603 34.366 29.112l85.566 513.395C254.65 736.421 291.929 768 332.799 768h512c14.139 0 25.6-11.461 25.6-25.6s-11.461-25.6-25.6-25.6h-512c-15.722 0-31.781-13.603-34.366-29.11l-12.63-75.784 510.206-44.366c39.69-3.451 75.907-36.938 82.458-76.234l34.366-206.194c3.448-20.677-1.952-41.243-14.813-56.424zm-35.69 48.006l-34.366 206.194c-2.699 16.186-20.043 32.221-36.39 33.645l-514.214 44.714-50.874-305.246h618.314c5.968 0 10.995 2.054 14.155 5.782 3.157 3.73 4.357 9.024 3.376 14.912z" />
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
