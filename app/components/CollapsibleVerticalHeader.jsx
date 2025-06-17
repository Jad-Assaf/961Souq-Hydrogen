/********************************************************************
 *  src/components/CollapsibleVerticalHeader.jsx
 *
 *  •  Hover inside → header-expanded added to <body>
 *  •  Pointer leaves header, or user taps / clicks outside it →
 *     header-expanded removed + drawers closed
 *  •  Every <NavLink> (even top-level parents) navigates normally
 *  •  Only the ± button toggles a submenu
 *  •  We do NOT auto-collapse on route change; we only guarantee
 *     the header is collapsed once on mount so you never land on
 *     a page with “header-expanded” still stuck on <body>.
 ********************************************************************/

import React, {useEffect, useRef, useState} from 'react';
import {NavLink} from '@remix-run/react';

export function CollapsibleVerticalHeader({header}) {
  const {shop, menu} = header;
  const [openSubs, setOpenSubs] = useState({});
  const headerRef = useRef(null);

  /* ───── helpers ───── */
  const img = (item) => item.imageUrl || item?.items?.[0]?.imageUrl || '';
  const kids = (item) => Boolean(item.items?.length);

  const toggle = (lvl, id) =>
    setOpenSubs((prev) => {
      const next = {...prev};
      next[lvl] = prev[lvl] === id ? undefined : id;
      Object.keys(next).forEach((k) => {
        if (+k > lvl) delete next[k];
      });
      return next;
    });

  const expand = () => document.body.classList.add('header-expanded');
  const collapse = () => {
    document.body.classList.remove('header-expanded');
    setOpenSubs({});
  };

  /* ───── 1-time effects ───── */

  /* Mark body so your global CSS adds margin-left and reset any
     stale 'header-expanded' class from a previous page view.      */
  useEffect(() => {
    document.body.classList.add('with-vertical-header');
    document.body.classList.remove('header-expanded');
    return () => {
      document.body.classList.remove('with-vertical-header');
      document.body.classList.remove('header-expanded');
    };
  }, []);

  /* Collapse if user clicks / taps outside the header */
  useEffect(() => {
    const outside = (e) => !headerRef.current?.contains(e.target) && collapse();
    document.addEventListener('mousedown', outside);
    document.addEventListener('touchstart', outside);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('touchstart', outside);
    };
  }, []);

  /* ───── renderer ───── */

  const render = (items, lvl = 1) =>
    items.map((item) => {
      const open = openSubs[lvl] === item.id;
      const parent = kids(item);

      return (
        <div key={item.id} className={`vh-item vh-level-${lvl}`}>
          <div className="vh-link">
            <span className="vh-icon">
              {img(item) && (
                <img
                  src={`${img(item)}&width=100`}
                  alt={item.altText || item.title}
                  width="40"
                  height="40"
                  loading='lazy'
                />
              )}
            </span>

            {/* link always navigates */}
            <NavLink to={new URL(item.url).pathname} className="vh-navlink">
              <p>{item.title}</p>
            </NavLink>

            {parent && (
              <button
                type="button"
                className="vh-toggle-btn"
                aria-label={open ? 'Collapse submenu' : 'Expand submenu'}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(lvl, item.id);
                }}
              >
                {open ? (
                  <svg
                    fill="#2172af"
                    height="40px"
                    width="40px"
                    version="1.1"
                    id="Layer_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    viewBox="0 0 425 425"
                    xmlSpace="preserve"
                    transform="matrix(1, 0, 0, 1, 0, 0)"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      {' '}
                      <g>
                        {' '}
                        <polygon points="212.5,0 19.371,192.5 405.629,192.5 "></polygon>{' '}
                      </g>{' '}
                    </g>
                  </svg>
                ) : (
                  <svg
                    fill="#2172af"
                    height="40px"
                    width="40px"
                    version="1.1"
                    id="Layer_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    viewBox="0 0 386.257 386.257"
                    xmlSpace="preserve"
                    stroke="#2172af"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      {' '}
                      <polygon points="0,96.879 193.129,289.379 386.257,96.879 "></polygon>{' '}
                    </g>
                  </svg>
                )}
              </button>
            )}
          </div>

          {parent && (
            <div className={`vh-submenu ${open ? 'open' : ''}`}>
              {render(item.items, lvl + 1)}
            </div>
          )}
        </div>
      );
    });

  /* ───── layout ───── */

  return (
    <div
      ref={headerRef}
      className="vertical-header"
      onMouseEnter={expand}
      onMouseLeave={collapse}
    >
      <div className="vh-logo">
        <NavLink to="/" className="vh-logo-link">
          {/* logo for collapsed (60 px) state */}
          <img
            src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/961souqLogo_Cart_19e9e372-5859-44c9-8915-11b81ed78213.png?v=1719486376"
            alt={shop.name}
            className="logo-collapsed"
            width="50"
            height="50"
          />

          {/* logo for expanded state */}
          <img
            src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/961souqLogo-1_2.png?v=1709718912&width=400"
            alt={shop.name}
            className="logo-expanded"
            width="120"
            height="50"
          />
        </NavLink>
      </div>

      <nav className="vertical-menu">{render(menu.items)}</nav>
    </div>
  );
}


