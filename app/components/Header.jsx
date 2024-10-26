import React, { useState } from 'react';
import { NavLink } from '@remix-run/react';
import { fetchMenuByHandle } from '../routes/_index'; // Assume this function sends the GraphQL query

/**
 * Main Header Component
 */
export function Header({ header, isLoggedIn, cart, publicStoreDomain }) {
  const { menu } = header;
  return (
    <header className="header">
      <HeaderMenu 
        menu={menu} 
        primaryDomainUrl={header.shop.primaryDomain.url} 
        publicStoreDomain={publicStoreDomain} 
      />
    </header>
  );
}

/**
 * HeaderMenu Component with Recursive Menu Rendering
 */
export function HeaderMenu({ menu, primaryDomainUrl, publicStoreDomain }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleMouseEnter = (id) => setHoveredItem(id);
  const handleMouseLeave = () => setHoveredItem(null);

  return (
    <nav className="site-nav" role="navigation">
      <ul className="main-menu">
        {(menu?.items || FALLBACK_HEADER_MENU.items).map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            hoveredItem={hoveredItem}
            onHover={handleMouseEnter}
            onLeave={handleMouseLeave}
            primaryDomainUrl={primaryDomainUrl}
            publicStoreDomain={publicStoreDomain}
          />
        ))}
      </ul>
    </nav>
  );
}

/**
 * MenuItem Component: Handles individual menu items and renders submenus recursively.
 */
function MenuItem({ item, hoveredItem, onHover, onLeave, primaryDomainUrl, publicStoreDomain }) {
  const [subItems, setSubItems] = useState(item.items || []);
  const [isLoading, setIsLoading] = useState(false);

  const hasSubItems = Array.isArray(subItems) && subItems.length > 0;
  const url = item.url.includes('myshopify.com') || item.url.includes(publicStoreDomain) ||
    item.url.includes(primaryDomainUrl)
    ? new URL(item.url).pathname
    : item.url;

  // Fetch submenu on hover if needed
  const handleMouseEnter = async () => {
    onHover(item.id);
    if (subItems.length === 0 && item.handle) { // Only fetch if not already loaded
      setIsLoading(true);
      const menuData = await fetchMenuByHandle(item.handle); // Fetch submenu by handle
      setSubItems(menuData?.items || []);
      setIsLoading(false);
    }
  };

  return (
    <li
      className={`nav-item ${hasSubItems ? 'has-submenu' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
    >
      <NavLink className="main-nav-link" prefetch="intent" to={url}>
        {item.title}
      </NavLink>

      {isLoading && <div>Loading...</div>} {/* Display loading indicator */}

      {hasSubItems && hoveredItem === item.id && (
        <ul className="submenu">
          {subItems.map((subItem) => (
            <li key={subItem.id}>
              <NavLink className="submenu-link" to={subItem.url}>
                {subItem.title}
              </NavLink>

              {Array.isArray(subItem.items) && subItem.items.length > 0 && (
                <ul className="sub-submenu">
                  {subItem.items.map((subSubItem) => (
                    <li key={subSubItem.id}>
                      <NavLink className="submenu-link" to={subSubItem.url}>
                        {subSubItem.title}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default MenuItem;


const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};


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
