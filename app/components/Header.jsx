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
            <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#2172af"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5 6H12H19M5 12H19M5 18H19" stroke="#2172af" stroke-width="2" stroke-linecap="round"></path> </g></svg>
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
            {({ inputRef, fetchResults, goToSearch, fetcher }) => {
              useFocusOnCmdK(inputRef);

              const [isOverlayVisible, setOverlayVisible] = useState(false);
              const [isSearchResultsVisible, setSearchResultsVisible] = useState(false);

              const handleFocus = () => {
                if (window.innerWidth < 1024) {
                  searchContainerRef.current?.classList.add("fixed-search");
                  setOverlayVisible(true);
                }
                setSearchResultsVisible(true);
              };

              const handleBlur = () => {
                if (window.innerWidth < 1024) {
                  const inputValue = inputRef.current?.value.trim();
                  if (!inputValue) {
                    searchContainerRef.current?.classList.remove("fixed-search");
                    setOverlayVisible(false);
                  }
                }
              };

              const handleCloseSearch = () => {
                searchContainerRef.current?.classList.remove("fixed-search");
                setOverlayVisible(false);
                setSearchResultsVisible(false);
              };

              const handleKeyDown = (e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // Prevent default form submission
                  handleSearch();
                }
              };

              const handleSearch = () => {
                if (inputRef.current) {
                  const term = inputRef.current.value.trim().replace(/\s+/g, "-");
                  if (term) {
                    window.location.href = `${SEARCH_ENDPOINT}?q=${term}`;
                  }
                }
              };

              // Manage scroll-lock when overlay is visible
              useEffect(() => {
                if (isOverlayVisible) {
                  document.body.style.overflow = "hidden";
                } else {
                  document.body.style.overflow = "";
                }

                return () => {
                  document.body.style.overflow = ""; // Ensure cleanup
                };
              }, [isOverlayVisible]);

              return (
                <>
                  {/* Fullscreen Overlay */}
                  <div
                    className={`search-overlay ${isOverlayVisible ? "active" : ""}`}
                    onClick={handleCloseSearch}
                  ></div>

                  {/* Main Search Form */}
                  <div ref={searchContainerRef} className="main-search">
                    <div className="search-container">
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search products"
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
                            inputRef.current.value = "";
                            setSearchResultsVisible(false);
                            fetchResults({ target: { value: "" } }); // Reset search results
                          }}
                        >
                          <svg
                            fill="#2172af"
                            height="12px"
                            width="12px"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 460.775 460.775"
                          >
                            <path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55 c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55 c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505 c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55 l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719 c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"></path>
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={handleSearch}
                        className="search-bar-submit"
                      >
                        <SearchIcon />
                      </button>
                    </div>
                    {isSearchResultsVisible && (
                      <div className="search-results-container">
                        <SearchResultsPredictive>
                          {({ items, total, term, state, closeSearch }) => {
                            const { products } = items;

                            if (!total) {
                              return <SearchResultsPredictive.Empty term={term} />;
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
                                    to={`${SEARCH_ENDPOINT}?q=${term.current.replace(/\s+/g, "-")}`}
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
                </>
              );
            }}
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

      <>
        {/* Background overlay */}
        {isMobileMenuOpen && (
          <div
            className="mobile-menu-backdrop"
            onClick={closeMobileMenu} // Close menu when backdrop is clicked
          ></div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-overlay">
            <button className="mobile-menu-close" onClick={closeMobileMenu}>
              <svg
                fill="#2172af"
                height="12px"
                width="12px"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 460.775 460.775"
              >
                <path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55 c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55 c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505 c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55 l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719 c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"></path>
              </svg>
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
                      {item.title} <span className="mobile-menu-arrow"><svg fill="#2172af" height="16px" width="16px" version="1.1" id="XMLID_287_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24.00 24.00" xml:space="preserve" stroke="#2172af" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.096"></g><g id="SVGRepo_iconCarrier"> <g id="next"> <g> <polygon points="6.8,23.7 5.4,22.3 15.7,12 5.4,1.7 6.8,0.3 18.5,12 "></polygon> </g> </g> </g></svg></span>
                    </button>
                  </div>
                );
              })}
            </div>

            {activeSubmenu && (
              <div className="mobile-submenu-drawer" data-id={activeSubmenu}>
                <button className="back-button" onClick={closeSubmenu}>
                  <svg fill="#2172af" height="18px" width="18px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 384.97 384.97" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g id="Chevron_Left_Circle"> <path d="M192.485,0C86.185,0,0,86.185,0,192.485C0,298.797,86.173,384.97,192.485,384.97S384.97,298.797,384.97,192.485 C384.97,86.185,298.797,0,192.485,0z M192.485,361.282c-92.874,0-168.424-75.923-168.424-168.797S99.611,24.061,192.485,24.061 s168.424,75.55,168.424,168.424S285.359,361.282,192.485,361.282z"></path> <path d="M235.878,99.876c-4.704-4.74-12.319-4.74-17.011,0l-83.009,84.2c-4.572,4.62-4.584,12.56,0,17.191l82.997,84.2 c4.704,4.74,12.319,4.74,17.011,0c4.704-4.752,4.704-12.439,0-17.191l-74.528-75.61l74.54-75.61 C240.57,112.315,240.57,104.628,235.878,99.876z"></path> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> </g> </g></svg>
                   Back
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
      {renderMenuItems(menu?.items)}
    </nav>
  );
}

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

function activeLinkStyle({ isActive, isPending }) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? '#fff' : '#fff',
  };
}

export function useFocusOnCmdK(inputRef) {
  // focus the input when cmd+k is pressed
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'k' && event.metaKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (event.key === 'Escape') {
        inputRef.current?.blur();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputRef]);
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
