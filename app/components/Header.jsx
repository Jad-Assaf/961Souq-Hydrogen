import React, { useState } from 'react';
import { NavLink } from '@remix-run/react';

/**
 * Main Header Component
 */
export function Header({ header, publicStoreDomain }) {
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
  const hasSubItems = Array.isArray(item.items) && item.items.length > 0;

  const url =
    item.url.includes('myshopify.com') ||
      item.url.includes(publicStoreDomain) ||
      item.url.includes(primaryDomainUrl)
      ? new URL(item.url).pathname
      : item.url;

  return (
    <li
      className={`nav-item ${hasSubItems ? 'has-submenu' : ''}`}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={onLeave}
    >
      <NavLink className="main-nav-link" prefetch="intent" to={url}>
        {item.title}
      </NavLink>

      {hasSubItems && hoveredItem === item.id && (
        <ul className="submenu">
          {item.items.map((subItem) => (
            <MenuItem
              key={subItem.id}
              item={subItem}
              hoveredItem={hoveredItem}
              onHover={onHover}
              onLeave={onLeave}
              primaryDomainUrl={primaryDomainUrl}
              publicStoreDomain={publicStoreDomain}
            />
          ))}
        </ul>
      )}
    </li>
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
