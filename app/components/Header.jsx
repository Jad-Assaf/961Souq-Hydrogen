import { Suspense, useEffect, useState } from 'react';
import { Await, NavLink } from '@remix-run/react';
import { useAside } from '~/components/Aside';
import { AnimatedImage } from './AnimatedImage';

export function Header({ header, isLoggedIn, cart, publicStoreDomain }) {
  const { shop, menu } = header;
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null); // Track active submenu

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setActiveSubmenu(null); // Close any open submenu when menu is closed
  };

  const openSubmenu = (itemId) => setActiveSubmenu(itemId); // Open the submenu drawer
  const closeSubmenu = () => setActiveSubmenu(null); // Close the submenu drawer

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
          <button
            className="header-menu-mobile-toggle"
            onClick={toggleMobileMenu}
          >
            ☰
          </button>

          <NavLink prefetch="intent" to="/" className="logo-link" end>
            <AnimatedImage
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/logonew_1c8474b8-d0a3-4a90-a3fa-494ce9ca846f.jpg?v=1619452140"
              alt={`${shop.name} Logo`}
              className="header-logo"
              width="150px"
              height="auto"
            />
          </NavLink>

          <div className="header-ctas">
            <NavLink
              prefetch="intent"
              to="/account"
              className="sign-in-link user-icon-header"
            >
              <Suspense fallback={<UserIcon />}>
                <Await resolve={isLoggedIn} errorElement={<UserIcon />}>
                  {() => <UserIcon />}
                </Await>
              </Suspense>
            </NavLink>
            <SearchToggle />
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
          <button className="close-mobile-menu" onClick={closeMobileMenu}>
            ✕
          </button>

          <div className={`mobile-menu-list ${activeSubmenu ? 'hidden' : ''}`}>
            {menu.items.map((item) => (
              <div key={item.id} className="menu-item">
                <button onClick={() => openSubmenu(item.id)}>
                  {item.title} <span className="menu-item-arrow">›</span>
                </button>
              </div>
            ))}
          </div>

          {activeSubmenu && (
            <div className="submenu-drawer">
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
    const menuItems = document.querySelectorAll('.menu-item');

    const handleMouseEnter = (event) => {
      const submenu = event.currentTarget.querySelector('.submenu');
      if (submenu) submenu.style.display = 'block';
    };

    const handleMouseLeave = (event) => {
      const submenu = event.currentTarget.querySelector('.submenu');
      if (submenu) submenu.style.display = 'none';
    };

    menuItems.forEach((item) => {
      item.addEventListener('mouseenter', handleMouseEnter);
      item.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      menuItems.forEach((item) => {
        item.removeEventListener('mouseenter', handleMouseEnter);
        item.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  const renderMenuItems = (items) =>
    items.map((item) => (
      <div key={item.id} className="menu-item">
        <NavLink to={new URL(item.url).pathname}>
          {item.title}
        </NavLink>
        {item.items?.length > 0 && (
          <div className="submenu">{renderMenuItems(item.items)}</div>
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

function SearchToggle() {
  const { open } = useAside();
  return (
    <button className="search-toggle reset" onClick={() => open('search')}>
      <SearchIcon />
    </button>
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
    <svg fill="#2172af" height="30px" width="30px" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 482.854 482.854">
      <path d="M439.927,148.655h-21.5h-0.1h-9.5l-130.2-144.7c-4.4-4.9-12-5.3-16.9-0.9s-5.3,12-0.9,16.9l115.8,128.7h-269.9 l115.4-128.7c4.4-4.9,4-12.5-0.9-16.9s-12.5-4-16.9,0.9l-129.9,144.7h-9.6l0,0h-21.9c-6.6,0-12,5.4-12,12s5.4,12,12,12h12.3 l34.6,161.3c5.5,27.7,30,47.8,58.3,47.8h131.1c6.6,0,12-5.4,12-12s-5.4-12-12-12h-131.1c-16.9,0-31.5-12-34.8-28.6 c0-0.1,0-0.1,0-0.2l-33.5-156.3h323.9l-13.8,67.6c-1.3,6.5,2.9,12.8,9.4,14.2c0.8,0.2,1.6,0.2,2.4,0.2c5.6,0,10.6-3.9,11.7-9.6 l14.8-72.4h11.7c6.6,0,12-5.4,12-12S446.527,148.655,439.927,148.655z" />
    </svg>
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
