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

  const menuImages = [
    { id: "item1", url: "https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/d9be8a2496eb547df3ff8f98aa4f95ad.jpg?v=1712759458", alt: "Apple Products" },
    { id: "item2", url: "https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/Gaming-Devices.jpg?v=1714467789", alt: "Gaming" },
    { id: "item3", url: "https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/img_proxy_997bd251-f559-46a5-878b-02ffed1f1de3.jpg?v=1711637450", alt: "Laptops" },
    { id: "item3", url: "https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/hp-victus-desktop_80818ad8-f8ea-4ac1-93c9-f16b5924765f.jpg?v=1684332622", alt: "Desktops" },
    { id: "item3", url: "https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/computer-components.jpg?v=1712759555", alt: "PC Parts" },
    { id: "item3", url: "https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/bf6ff9dcfae258049d4cc08fc220169b.jpg?v=1711623551", alt: "Networking Devices" },
    { id: "item3", url: "https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/monitors_cc32b522-52d2-478f-9237-6ab0e493b8d8.jpg?v=1730888129", alt: "Monitors" },
    { id: "item3", url: "https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/img_proxy.jpg?v=1712759701", alt: "Mobiles" },
    { id: "item3", url: "https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/42032952eabd9ed13e4183a3a5b19fc5.jpg?v=1711642519", alt: "Tablets" },
    { id: "item3", url: "https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/audio-equipement.jpg?v=1711623037", alt: "Audio" },
    { id: "item3", url: "https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/6f077fae6887e771883c237901912b4a.jpg?v=1711623140", alt: "Accessories" },
    { id: "item3", url: "https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/img_proxy_c8148b75-3d0f-45f0-a28c-8fb83f6ecd40.jpg?v=1711623339", alt: "Fitness" },
    { id: "item3", url: "https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/camera.jpg?v=1711623025", alt: "Photography" },
    { id: "item3", url: "https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/SMART-HOME-DEVICES.jpg?v=1711623085", alt: "Home Appliances" },
  ];

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
          <h3>Menu</h3>
          <div className={`mobile-menu-content ${activeSubmenu ? 'hidden' : ''}`}>
            {menu.items.map((item) => {
              const image = menuImages.find((img) => img.id === item.id);
              return (
                <div key={item.id} className="mobile-menu-item">
                  <button onClick={() => openSubmenu(item.id)}>
                    {image && (
                      <img
                        src={image.url}
                        alt={image.alt || item.title}
                        className="menu-item-image"
                      />
                    )}
                    {item.title} <span className="mobile-menu-arrow">›</span>
                  </button>
                </div>
              );
            })}
          </div>

          {activeSubmenu && (
            <div className="mobile-submenu-drawer" data-id={activeSubmenu}>
              <button className="back-button" onClick={closeSubmenu}>
                ‹ Back
              </button>
              <div className="submenu-list">
                {menu.items
                  .find((item) => item.id === activeSubmenu)
                  ?.items.map((subItem) => {
                    const image = menuImages.find((img) => img.id === subItem.id);
                    return (
                      <NavLink
                        key={subItem.id}
                        to={new URL(subItem.url).pathname}
                        onClick={closeMobileMenu}
                      >
                        {image && (
                          <img
                            src={image.url}
                            alt={image.alt || subItem.title}
                            className="submenu-item-image"
                          />
                        )}
                        {subItem.title}
                      </NavLink>
                    );
                  })}
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
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="icon icon-account" viewBox="0 0 1024 1024" width="100%" height="100%"><path class="path1" d="M486.4 563.2c-155.275 0-281.6-126.325-281.6-281.6s126.325-281.6 281.6-281.6 281.6 126.325 281.6 281.6-126.325 281.6-281.6 281.6zM486.4 51.2c-127.043 0-230.4 103.357-230.4 230.4s103.357 230.4 230.4 230.4c127.042 0 230.4-103.357 230.4-230.4s-103.358-230.4-230.4-230.4z"></path><path class="path2" d="M896 1024h-819.2c-42.347 0-76.8-34.451-76.8-76.8 0-3.485 0.712-86.285 62.72-168.96 36.094-48.126 85.514-86.36 146.883-113.634 74.957-33.314 168.085-50.206 276.797-50.206 108.71 0 201.838 16.893 276.797 50.206 61.37 27.275 110.789 65.507 146.883 113.634 62.008 82.675 62.72 165.475 62.72 168.96 0 42.349-34.451 76.8-76.8 76.8zM486.4 665.6c-178.52 0-310.267 48.789-381 141.093-53.011 69.174-54.195 139.904-54.2 140.61 0 14.013 11.485 25.498 25.6 25.498h819.2c14.115 0 25.6-11.485 25.6-25.6-0.006-0.603-1.189-71.333-54.198-140.507-70.734-92.304-202.483-141.093-381.002-141.093z"></path></svg>
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
    <svg viewBox="0 0 1024 1024" class="icon icon-cart  stroke-w-5" xmlns="http://www.w3.org/2000/svg"><path class="path1" d="M409.6 1024c-56.464 0-102.4-45.936-102.4-102.4s45.936-102.4 102.4-102.4S512 865.136 512 921.6 466.064 1024 409.6 1024zm0-153.6c-28.232 0-51.2 22.968-51.2 51.2s22.968 51.2 51.2 51.2 51.2-22.968 51.2-51.2-22.968-51.2-51.2-51.2z"></path><path class="path2" d="M768 1024c-56.464 0-102.4-45.936-102.4-102.4S711.536 819.2 768 819.2s102.4 45.936 102.4 102.4S824.464 1024 768 1024zm0-153.6c-28.232 0-51.2 22.968-51.2 51.2s22.968 51.2 51.2 51.2 51.2-22.968 51.2-51.2-22.968-51.2-51.2-51.2z"></path><path class="path3" d="M898.021 228.688C885.162 213.507 865.763 204.8 844.8 204.8H217.954l-5.085-30.506C206.149 133.979 168.871 102.4 128 102.4H76.8c-14.138 0-25.6 11.462-25.6 25.6s11.462 25.6 25.6 25.6H128c15.722 0 31.781 13.603 34.366 29.112l85.566 513.395C254.65 736.421 291.929 768 332.799 768h512c14.139 0 25.6-11.461 25.6-25.6s-11.461-25.6-25.6-25.6h-512c-15.722 0-31.781-13.603-34.366-29.11l-12.63-75.784 510.206-44.366c39.69-3.451 75.907-36.938 82.458-76.234l34.366-206.194c3.448-20.677-1.952-41.243-14.813-56.424zm-35.69 48.006l-34.366 206.194c-2.699 16.186-20.043 32.221-36.39 33.645l-514.214 44.714-50.874-305.246h618.314c5.968 0 10.995 2.054 14.155 5.782 3.157 3.73 4.357 9.024 3.376 14.912z"></path></svg>
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
