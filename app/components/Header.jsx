import { Suspense, useEffect, useState, useRef } from 'react';
import { Await, Link, NavLink } from '@remix-run/react';
import { useAside } from '~/components/Aside';
import { Image } from '@shopify/hydrogen-react';
import { SearchFormPredictive, SEARCH_ENDPOINT } from './SearchFormPredictive';
import { SearchResultsPredictive } from '~/components/SearchResultsPredictive';

export function Header({ header, isLoggedIn, cart, publicStoreDomain }) {
  const { shop, menu } = header;
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [isSearchResultsVisible, setSearchResultsVisible] = useState(false);
  const searchContainerRef = useRef(null);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
    if (!isMobileMenuOpen) setActiveSubmenu(null); // Reset submenu when closing
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setActiveSubmenu(null); // Close all submenus when menu is closed
  };

  const openSubmenu = (itemId) => {
    setActiveSubmenu(itemId);
    requestAnimationFrame(() => {
      const drawer = document.querySelector(
        `.mobile-submenu-drawer[data-id="${itemId}"]`
      );
      if (drawer) drawer.classList.add('active');
    });
  };

  const closeSubmenu = () => {
    const activeDrawer = document.querySelector('.mobile-submenu-drawer.active');
    if (activeDrawer) {
      activeDrawer.classList.remove('active');
      setTimeout(() => setActiveSubmenu(null), 300); // Wait for animation
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchResultsVisible(false);
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

  return (
    <>
      <header className="header">
        <div className="header-top">
          <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            ☰
          </button>

          <NavLink prefetch="intent" to="/" className="logo-link" end>
            <Image
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/logonew_1c8474b8-d0a3-4a90-a3fa-494ce9ca846f.jpg?v=1619452140"
              alt={`${shop.name} Logo`}
              className="header-logo"
              width="150px"
              height="79px"
            />
          </NavLink>

          <SearchFormPredictive className="header-search">
            {({ inputRef, fetchResults, goToSearch, fetcher }) => (
              <div ref={searchContainerRef} className="main-search">
                <div className="search-container">
                  <input
                    ref={inputRef}
                    type="search"
                    placeholder="Search products"
                    onChange={(e) => {
                      fetchResults(e);
                      setSearchResultsVisible(true);
                    }}
                    onFocus={() => setSearchResultsVisible(true)}
                    className="search-bar"
                  />
                  <button onClick={goToSearch} className="search-bar-submit">
                    <SearchIcon />
                  </button>
                </div>
                {isSearchResultsVisible && (
                  <div className="search-results-container">
                    <SearchResultsPredictive>
                      {({ items, total, term, state, closeSearch }) => {
                        const { products /* , collections, pages, articles, queries */ } = items;

                        if (state === 'loading' && term.current) {
                          return <div>Loading...</div>;
                        }

                        if (!total) {
                          return <SearchResultsPredictive.Empty term={term} />;
                        }

                        return (
                          <>
                            <SearchResultsPredictive.Products
                              products={products}
                              closeSearch={() => {
                                closeSearch();
                                setSearchResultsVisible(false);
                              }}
                              term={term}
                            />
                            {term.current && total ? (
                              <Link
                                onClick={() => {
                                  closeSearch();
                                  setSearchResultsVisible(false);
                                }}
                                to={`${SEARCH_ENDPOINT}?q=${term.current}`}
                                className="view-all-results"
                              >
                                <p>
                                  View all results for <q>{term.current}</q> &nbsp; →
                                </p>
                              </Link>
                            ) : null}
                          </>
                        );
                      }}
                    </SearchResultsPredictive>
                  </div>
                )}
              </div>
            )}
          </SearchFormPredictive>

          <div className="header-ctas">
            <NavLink
              prefetch="intent"
              to="/account"
              className="sign-in-link mobile-user-icon"
            >
              <Suspense fallback={<UserIcon />}>
                <Await resolve={isLoggedIn} errorElement={<UserIcon />}>
                  {() => <UserIcon />}
                </Await>
              </Suspense>
            </NavLink>
            {/* <SearchToggle /> */}
            <CartToggle cart={cart} />
          </div>
        </div>

        <div className="header-bottom">
          <HeaderMenu
            menu={menu}
            viewport="desktop"
            primaryDomainUrl={header.shop.primaryDomain.url}
            publicStoreDomain={publicStoreDomain}
          />
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <button className="mobile-menu-close" onClick={closeMobileMenu}>
            ✕
          </button>

          <div className={`mobile-menu-content ${activeSubmenu ? 'hidden' : ''}`}>
            {menu.items.map((item) => (
              <div key={item.id} className="mobile-menu-item">
                <button onClick={() => openSubmenu(item.id)}>
                  {item.title} <span className="mobile-menu-arrow">›</span>
                </button>
              </div>
            ))}
          </div>

          {activeSubmenu && (
            <div className="mobile-submenu-drawer" data-id={activeSubmenu}>
              <button className="back-button" onClick={closeSubmenu}>
                ‹ Back
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
                      {subItem.title}
                    </NavLink>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function HeaderMenu({ menu, viewport }) {
  const { close } = useAside();

  useEffect(() => {
    const menuItems = document.querySelectorAll('.menu-item-level-1');

    const handleMouseEnter = (event) => {
      const submenus = event.currentTarget.querySelectorAll('.submenu');
      submenus.forEach((submenu) => {
        submenu.style.display = 'flex'; // Ensure the submenu is visible
        submenu.style.opacity = '1'; // Fade in
        submenu.style.transform = 'translateY(0)'; // Reset animation offset
      });
    };

    const handleMouseLeave = (event) => {
      const submenus = event.currentTarget.querySelectorAll('.submenu');
      submenus.forEach((submenu) => {
        submenu.style.display = 'none'; // Hide submenu
        submenu.style.opacity = '0'; // Fade out
        submenu.style.transform = 'translateY(-10px)'; // Offset animation
      });
    };

    const handleLinkClick = () => {
      menuItems.forEach((item) => {
        const submenus = item.querySelectorAll('.submenu');
        submenus.forEach((submenu) => {
          submenu.style.display = 'none';
          submenu.style.opacity = '0';
          submenu.style.transform = 'translateY(-10px)';
        });
      });
    };

    menuItems.forEach((item) => {
      item.addEventListener('mouseenter', handleMouseEnter);
      item.addEventListener('mouseleave', handleMouseLeave);

      const links = item.querySelectorAll('a'); // Ensure `links` is within `menuItems.forEach`
      links.forEach((link) => {
        link.addEventListener('click', handleLinkClick);
      });
    });

    return () => {
      menuItems.forEach((item) => {
        item.removeEventListener('mouseenter', handleMouseEnter);
        item.removeEventListener('mouseleave', handleMouseLeave);

        const links = item.querySelectorAll('a'); // Clean up properly
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
      {renderMenuItems(menu?.items || FALLBACK_HEADER_MENU.items)}
    </nav>
  );
}

function HeaderMenuMobileToggle({ toggleMobileMenu }) {
  return (
    <button
      className="header-menu-mobile-toggle reset"
      onClick={toggleMobileMenu}
    >
      <h3>☰</h3>
    </button>
  );
}

// function SearchToggle() {
//   const { open } = useAside();
//   return (
//     <button className="search-toggle reset" onClick={() => open('search')}>
//       <SearchIcon />
//     </button>
//   );
// }

function CartToggle({ cart }) {
  const { open } = useAside();

  return (
    <button
      className="cart-button reset"
      onClick={() => open('cart')}
      aria-label="Open Cart"
    >
      <Suspense fallback={<CartIcon />}>
        <Await resolve={cart}>
          {() => <CartIcon />}
        </Await>
      </Suspense>
    </button>
  );
}

function UserIcon() {
  return (
    <svg fill="#2172af" width="30px" height="30px" viewBox="-8 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#2172af" width="30px" height="30px">
      <path d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" stroke="#2172af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M1.28869 2.76279C1.41968 2.36983 1.84442 2.15746 2.23737 2.28845L2.50229 2.37675C2.51549 2.38115 2.52864 2.38554 2.54176 2.38991C3.16813 2.59867 3.69746 2.7751 4.11369 2.96873C4.55613 3.17456 4.94002 3.42965 5.23112 3.83352C5.52221 4.2374 5.64282 4.68226 5.69817 5.16708C5.75025 5.62318 5.75023 6.18114 5.7502 6.84139L5.7502 9.49996C5.7502 10.9354 5.7518 11.9365 5.85335 12.6918C5.952 13.4256 6.13245 13.8142 6.40921 14.091C6.68598 14.3677 7.07455 14.5482 7.80832 14.6468C8.56367 14.7484 9.56479 14.75 11.0002 14.75H18.0002C18.4144 14.75 18.7502 15.0857 18.7502 15.5C18.7502 15.9142 18.4144 16.25 18.0002 16.25H10.9453C9.57774 16.25 8.47542 16.25 7.60845 16.1334C6.70834 16.0124 5.95047 15.7535 5.34855 15.1516C4.74664 14.5497 4.48774 13.7918 4.36673 12.8917C4.25017 12.0247 4.25018 10.9224 4.2502 9.55484L4.2502 6.883C4.2502 6.17 4.24907 5.69823 4.20785 5.33722C4.16883 4.99538 4.10068 4.83049 4.01426 4.71059C3.92784 4.59069 3.79296 4.47389 3.481 4.32877C3.15155 4.17551 2.70435 4.02524 2.02794 3.79978L1.76303 3.71147C1.37008 3.58049 1.15771 3.15575 1.28869 2.76279Z" fill="#2172af"></path> <path opacity="0.5" d="M5.74512 6C5.75008 6.25912 5.75008 6.53957 5.75007 6.8414L5.75006 9.5C5.75006 10.9354 5.75166 11.9365 5.85321 12.6919C5.86803 12.8021 5.8847 12.9046 5.90326 13H16.0221C16.9815 13 17.4612 13 17.8369 12.7523C18.2126 12.5045 18.4016 12.0636 18.7795 11.1818L19.2081 10.1818C20.0176 8.29294 20.4223 7.34853 19.9777 6.67426C19.5331 6 18.5056 6 16.4507 6H5.74512Z" fill="#2172af"></path> <path d="M7.5 18C8.32843 18 9 18.6716 9 19.5C9 20.3284 8.32843 21 7.5 21C6.67157 21 6 20.3284 6 19.5C6 18.6716 6.67157 18 7.5 18Z" fill="#2172af"></path> <path d="M18 19.5001C18 18.6716 17.3284 18.0001 16.5 18.0001C15.6716 18.0001 15 18.6716 15 19.5001C15 20.3285 15.6716 21.0001 16.5 21.0001C17.3284 21.0001 18 20.3285 18 19.5001Z" fill="#2172af"></path> </g></svg>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      title: 'Collections',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      title: 'Blog',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      title: 'Policies',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      title: 'About',
      url: '/pages/about',
      items: [],
    },
  ],
};

function activeLinkStyle({ isActive, isPending }) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? '#fff' : '#fff',
  };
}

/** @typedef {'desktop' | 'mobile'} Viewport */
/**
 * @typedef {Object} HeaderProps
 * @property {HeaderQuery} header
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 */

/** @typedef {import('@shopify/hydrogen').CartViewPayload} CartViewPayload */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
