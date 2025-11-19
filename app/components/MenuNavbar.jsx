import React from 'react';
import {NavLink} from '@remix-run/react';

// Helper to safely extract a pathname from the menu URL
function getMenuPath(url, {stripCollectionsForTopLevel = false} = {}) {
  if (!url) return '/';

  let pathname = '/';

  try {
    // If url is absolute (https://domain/...):
    pathname = new URL(url).pathname;
  } catch {
    // Handle relative URLs like "/collections/apple"
    if (url.startsWith('/')) {
      pathname = url;
    } else {
      try {
        pathname = new URL(url, 'https://dummy.base').pathname;
      } catch {
        pathname = '/';
      }
    }
  }

  // For top-level items: /collections/apple → /apple
  if (stripCollectionsForTopLevel && pathname.startsWith('/collections/')) {
    const segments = pathname.split('/').filter(Boolean); // ["collections","apple"]
    const handle = segments[segments.length - 1]; // "apple"
    return `/${handle}`;
  }

  return pathname;
}

const MenuNavbar = ({menu}) => {
  // Measure & flip the submenu inline so it never overflows the viewport
  const handleMouseEnter = (e) => {
    const li = e.currentTarget;
    const submenu = li.querySelector('.nav-submenu-wrapper');
    if (!submenu) return;

    // Force into layout so we can measure
    submenu.style.display = 'block';
    const {right} = submenu.getBoundingClientRect();
    const width = submenu.offsetWidth;
    submenu.style.display = ''; // restore

    // Count depth: 0 = second-level, ≥1 = third-level+
    let depth = 0;
    let node = li.parentElement;
    while (node) {
      if (node.classList.contains('nav-submenu-wrapper')) depth++;
      node = node.parentElement;
    }

    if (right > window.innerWidth) {
      submenu.style.left = 'auto';
      // Second-level dropdown: align its right edge with the parent
      if (depth === 0) {
        submenu.style.right = '0px';
      } else {
        // Third-level or deeper: push it fully to the left of the parent panel
        submenu.style.right = `${li.offsetWidth}px`;
      }
    } else {
      // Normal positioning
      submenu.style.left = '';
      submenu.style.right = '';
    }
  };

  const handleMouseLeave = (e) => {
    const submenu = e.currentTarget.querySelector('.nav-submenu-wrapper');
    if (!submenu) return;
    submenu.style.left = '';
    submenu.style.right = '';
  };

  return (
    <div className="nav-bar-container">
      <nav className="nav-bar">
        <ul className="nav-list">
          {menu.items.map((item) => {
            const hasChildren =
              Array.isArray(item.items) && item.items.length > 0;

            // 🔥 TOP-LEVEL: strip "/collections/" prefix
            const path = getMenuPath(item.url, {
              stripCollectionsForTopLevel: true,
            });

            return (
              <li
                key={item.id}
                className={`nav-item ${hasChildren ? 'nav-has-submenu' : ''}`}
                onMouseEnter={hasChildren ? handleMouseEnter : null}
                onMouseLeave={hasChildren ? handleMouseLeave : null}
              >
                <NavLink
                  to={path}
                  end
                  className={({isActive}) =>
                    isActive ? 'nav-link nav-link-active' : 'nav-link'
                  }
                >
                  {item.title}
                </NavLink>

                {hasChildren && (
                  <div className="nav-submenu-wrapper">
                    <ul className="nav-submenu">
                      {item.items.map((sub) => {
                        const hasSubChildren =
                          Array.isArray(sub.items) && sub.items.length > 0;

                        // SUB-LEVEL: keep original /collections/... URL
                        const subPath = getMenuPath(sub.url);

                        return (
                          <li
                            key={sub.id}
                            className={`nav-item ${
                              hasSubChildren ? 'nav-has-submenu' : ''
                            }`}
                            onMouseEnter={
                              hasSubChildren ? handleMouseEnter : null
                            }
                            onMouseLeave={
                              hasSubChildren ? handleMouseLeave : null
                            }
                          >
                            <NavLink
                              to={subPath}
                              end
                              className={({isActive}) =>
                                isActive
                                  ? 'nav-submenu-link nav-submenu-link-active'
                                  : 'nav-submenu-link'
                              }
                            >
                              {sub.title}
                            </NavLink>

                            {hasSubChildren && (
                              <div className="nav-submenu-wrapper">
                                <ul className="nav-submenu">
                                  {sub.items.map((third) => {
                                    // THIRD-LEVEL: also keep original paths
                                    const thirdPath = getMenuPath(third.url);

                                    return (
                                      <li key={third.id} className="nav-item">
                                        <NavLink
                                          to={thirdPath}
                                          end
                                          className={({isActive}) =>
                                            isActive
                                              ? 'nav-submenu-link nav-submenu-link-active'
                                              : 'nav-submenu-link'
                                          }
                                        >
                                          {third.title}
                                        </NavLink>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default MenuNavbar;
