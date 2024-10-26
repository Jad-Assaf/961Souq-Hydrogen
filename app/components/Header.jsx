import React, { Suspense, useState } from 'react';
import {Await, NavLink, useAsyncValue} from '@remix-run/react';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';

/**
 * @param {HeaderProps}
 */
export function Header({ header, isLoggedIn, cart, publicStoreDomain }) {
  const { menu } = header;
  const logoUrl = 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/961-Souq-Logo.jpg?v=1684251396'; // Logo URL

  return (
    <header className="header">
      <NavLink prefetch="intent" to="/" style={activeLinkStyle} end>
        <img 
          src={logoUrl} 
          alt="961 Souq Logo" 
          className="header-logo" 
          style={{ height: '50px', width: 'auto' }} 
        />
      </NavLink>
      <HeaderMenu
        menu={menu}
        viewport="desktop"
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
      />
      <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
    </header>
  );
}


/**
 * @param {{
 *   menu: HeaderProps['header']['menu'];
 *   primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
 *   viewport: Viewport;
 *   publicStoreDomain: HeaderProps['publicStoreDomain'];
 * }}
 */

export function HeaderMenu({ menu, primaryDomainUrl, publicStoreDomain }) {
  const [hoveredItem, setHoveredItem] = useState(null); // Track hovered menu item

  const handleMouseEnter = (id) => setHoveredItem(id);
  const handleMouseLeave = () => setHoveredItem(null);

  return (
    <nav className="site-nav" role="navigation">
      <ul className="main-menu">
        {(menu || FALLBACK_HEADER_MENU).items.map((item) => (
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
function MenuItem({
  item,
  hoveredItem,
  onHover,
  onLeave,
  primaryDomainUrl,
  publicStoreDomain,
}) {
  const hasSubItems = item.items && item.items.length > 0;
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
            <li key={subItem.id}>
              <NavLink className="submenu-link" to={subItem.url}>
                {subItem.title}
              </NavLink>

              {subItem.items && subItem.items.length > 0 && (
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

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

/**
 * @param {{
 *   isActive: boolean;
 *   isPending: boolean;
 * }}
 */
function activeLinkStyle({isActive, isPending}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'black',
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
