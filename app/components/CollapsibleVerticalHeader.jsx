// src/components/CollapsibleVerticalHeader.jsx
import React, {useState} from 'react';
import {NavLink} from '@remix-run/react';

export function CollapsibleVerticalHeader({header, svgs}) {
  const {shop, menu} = header;
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const renderItems = (items, level = 1, svgIndex = 0) =>
    items.map((item, i) => {
      const hasChildren = item.items && item.items.length > 0;
      const isOpen = openSubmenu === item.id;
      const svgMarkup = svgs[svgIndex + i] || '';

      return (
        <div key={item.id} className={`vh-item vh-level-${level}`}>
          <div
            className="vh-link"
            onClick={() =>
              hasChildren ? setOpenSubmenu(isOpen ? null : item.id) : undefined
            }
          >
            {/* icon always visible */}
            <span
              className="vh-icon"
              dangerouslySetInnerHTML={{__html: svgMarkup}}
            />
            {/* title only visible when expanded */}
            <NavLink to={new URL(item.url).pathname} className="vh-navlink">
              {item.title}
            </NavLink>
            {hasChildren && (
              <button
                aria-label="Toggle submenu"
                className="vh-toggle-btn"
                onClick={() => setOpenSubmenu(isOpen ? null : item.id)}
              >
                {isOpen ? '−' : '+'}
              </button>
            )}
          </div>
          {hasChildren && isOpen && (
            <div className="vh-submenu">
              {renderItems(item.items, level + 1)}
            </div>
          )}
        </div>
      );
    });

  return (
    <div className="vertical-header">
      <div className="vh-logo">
        <NavLink to="/" className="vh-logo-link">
          <img
            src={
              'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/961souqLogo-1_2.png?v=1709718912&width=400'
            }
            alt={`${shop.name}`}
            className="vh-logo-img"
          />
        </NavLink>
      </div>
      <nav className="vertical-menu">{renderItems(menu.items, 1, 0)}</nav>
    </div>
  );
}
