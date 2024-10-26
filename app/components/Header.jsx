import React, { useState, useEffect } from 'react';
import { NavLink } from '@remix-run/react';
import { fetchMenuByHandle } from './fetchMenu'; // Assume this function sends the GraphQL query

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
