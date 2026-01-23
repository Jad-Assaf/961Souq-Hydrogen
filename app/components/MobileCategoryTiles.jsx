import React, {useMemo, useState, useRef, useEffect} from 'react';
import {Link} from '@remix-run/react';
import {CategorySliderFromMenuMobile} from './CategorySliderFromMenuMobile';

/**
 * PNGs location: app/assets/
 * We resolve URLs via Vite's import.meta.glob.
 */
const files = import.meta.glob('../assets/*.{png,PNG}', {
  eager: true,
  as: 'url',
});
const assetUrlsBySlug = Object.fromEntries(
  Object.entries(files).map(([path, url]) => {
    const file = (path.split('/').pop() || '').toLowerCase();
    const slug = file.replace(/\.png$/i, '');
    return [slug, url];
  }),
);

/* ----- helpers to match a parent menu item ----- */
function slugifyTitle(t = '') {
  return t
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function findParentInMenu(menu, slug, label) {
  if (!menu?.items?.length) return null;
  const byHandle = menu.items.find((p) => p?.resource?.handle === slug);
  if (byHandle) return byHandle;
  const want = slug || slugifyTitle(label);
  return menu.items.find(
    (p) =>
      slugifyTitle(p?.title || '') === want ||
      slugifyTitle(p?.resource?.title || '') === want,
  );
}

export default function MobileCategoryTiles({
  title = 'Shop by Category',
  menu, // <-- pass header.menu
}) {
  // Allow multiple open: sets of slugs
  const [openSlugs, setOpenSlugs] = useState(() => new Set());
  const [closingSlugs, setClosingSlugs] = useState(() => new Set()); // per-tile fade-out

  // Build once; used to validate restored slugs
  const items = useMemo(
    () => [
      // Your requested gradient pairs:
      {label: 'Apple', slug: 'apple', start: '#8BD5E6', end: '#818FDD'},
      {label: 'Gaming', slug: 'gaming', start: '#80AEFE', end: '#9E79FD'},
      {label: 'Laptops', slug: 'laptops', start: '#88A9EB', end: '#475EB6'},
      {label: 'Desktops', slug: 'desktops', start: '#F6B2FE', end: '#7947DA'},
      {label: 'PC Parts', slug: 'pc-parts', start: '#F4BD40', end: '#F4BD40'},
      {
        label: 'Networking',
        slug: 'networking',
        start: '#7BD2F4',
        end: '#2C75E5',
      },
      {label: 'Monitors', slug: 'monitors', start: '#F7B7E0', end: '#8666B7'},
      {label: 'Mobiles', slug: 'mobiles', start: '#4CC8E9', end: '#1273BB'},

      // Others unchanged:
      {label: 'Tablets', slug: 'tablets', start: '#8dbb97', end: '#6f9274'},
      {label: 'Audio', slug: 'audio', start: '#ffd866', end: '#f67b3b'},
      {
        label: 'Accessories',
        slug: 'accessories',
        start: '#71cbf5',
        end: '#1593e3',
      },
      {label: 'Fitness', slug: 'fitness', start: '#bbe204', end: '#6db300'},
      {
        label: 'Photography',
        slug: 'photography',
        start: '#e08332',
        end: '#f29759',
      },
      {
        label: 'Home Appliances',
        slug: 'home-appliances',
        start: '#38a8eeff',
        end: '#107ac6ff',
      },
    ],
    [],
  );

  // ---- Persist & restore openSlugs (per path, per tab) ----
  const allowedSlugs = useMemo(
    () => new Set(items.map((i) => i.slug)),
    [items],
  );
  const storageKey =
    typeof window !== 'undefined'
      ? `mct_open:${window.location.pathname}`
      : 'mct_open';

  // Restore on mount (client only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return;
      const valid = arr.filter((s) => allowedSlugs.has(s));
      if (valid.length) setOpenSlugs(new Set(valid));
    } catch {}
  }, [storageKey, allowedSlugs]);

  // Persist whenever openSlugs changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify([...openSlugs]));
    } catch {}
  }, [openSlugs, storageKey]);

  return (
    <section className="catSection" aria-labelledby="catTitle">
      <h2 id="catTitle" className="catTitle">
        {title}
      </h2>

      <div className="catList">
        {items.map((item) => {
          const handle = item.slug;
          const modelUrl = assetUrlsBySlug[item.slug] || '';
          const isOpen = openSlugs.has(item.slug);
          const isClosing = closingSlugs.has(item.slug);

          const onTileClick = (e) => {
            e.preventDefault(); // never navigate on tile tap

            if (isOpen) {
              // Start fade-out for this tile only
              setClosingSlugs((prev) => {
                const next = new Set(prev);
                next.add(item.slug);
                return next;
              });
              setOpenSlugs((prev) => {
                const next = new Set(prev);
                next.delete(item.slug);
                return next;
              });
            } else {
              // Open this tile; do NOT close others
              setOpenSlugs((prev) => {
                const next = new Set(prev);
                next.add(item.slug);
                return next;
              });
              // if it was in closing (quick re-open), clear closing state
              setClosingSlugs((prev) => {
                if (!prev.has(item.slug)) return prev;
                const next = new Set(prev);
                next.delete(item.slug);
                return next;
              });
            }
          };

          const matchedParent = findParentInMenu(menu, item.slug, item.label);
          const filteredMenu = matchedParent ? {items: [matchedParent]} : null;
          const shouldRenderSubmenu = (isOpen || isClosing) && filteredMenu;

          return (
            <div key={item.slug} className="tileBlock">
              <Link
                to={`/collections/${handle}`}
                className="catCard"
                aria-label={`Browse ${item.label}`}
                style={{
                  '--start': item.start,
                  '--end': item.end,
                }}
                onClick={onTileClick}
                prefetch="intent"
              >
                <span className="catLabel">{item.label}</span>

                <span
                  className="catModel"
                  aria-hidden="true"
                  style={{'--model': modelUrl ? `url("${modelUrl}")` : 'none'}}
                >
                  {modelUrl ? (
                    <img
                      className="catImg"
                      src={modelUrl}
                      alt=""
                      decoding="async"
                      loading="lazy"
                    />
                  ) : null}
                </span>
              </Link>

              {/* Submenu with fade in/out */}
              <div
                className={`submenuWrap ${isOpen ? 'is-open' : ''} ${
                  isClosing ? 'is-closing' : ''
                }`}
                onTransitionEnd={(e) => {
                  // clear closing state after opacity transition finishes
                  if (
                    e.propertyName === 'opacity' &&
                    closingSlugs.has(item.slug)
                  ) {
                    setClosingSlugs((prev) => {
                      const next = new Set(prev);
                      next.delete(item.slug);
                      return next;
                    });
                  }
                }}
                aria-hidden={!isOpen}
              >
                {shouldRenderSubmenu && (
                  <CategorySliderFromMenuMobile menu={filteredMenu} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .catSection { margin: 20px 16px 30px; }
        .catTitle { margin: 0 4px 16px; font-size: 20px; font-weight: 700; color: #0F172A; letter-spacing: -0.02em; }

        .catList {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
          overflow: visible;
        }
          .slide-con {
            margin-bottom: 0 !important;
          }

        .tileBlock { overflow: visible; }

        .catCard {
          position: relative;
          display: flex;
          align-items: end;
          height: 95px;
          padding: 0 18px 10px;
          border-radius: 10px;
          background: linear-gradient(170deg, var(--start), var(--end));
          color: #fff;
          text-decoration: none;
          box-shadow: 0 10px 28px rgba(0, 0, 0, .10);
          overflow: visible;
          isolation: isolate;
          -webkit-tap-highlight-color: transparent;
          transition: transform .15s ease, box-shadow .15s ease;
          will-change: transform;
        }
        .catCard:active { transform: translateY(1px) scale(0.995); }
        @media (hover:hover){ .catCard:hover { box-shadow: 0 14px 34px rgba(0,0,0,.14); } }

        .catLabel {
          font-size: 20px;
          font-weight: 500;
          letter-spacing: -0.01em;
          text-shadow: 0 1px 1px rgba(0,0,0,.18);
          z-index: 2;
        }

        .catCard::before {
          content:"";
          position:absolute; inset:0; border-radius:10px; pointer-events:none;
          background:
            radial-gradient(120% 120% at 12% -10%, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 38%),
            linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,.18) 100%);
        }

        .catModel {
          position: absolute;
          right: 30px;
          bottom: 5px;
          width: 100px;
          height: 100px;
          pointer-events: none;
          z-index: 1;
          background: transparent;
          backdrop-filter: blur(20px);
          border-radius: 20px;
          border: 1px solid transparent;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .catImg {
          position: absolute;
          width: 80px;
          height: 80px;
          filter: drop-shadow(3px 2px 2px rgb(from var(--start) r g b / 0.6));
        }

        /* Fade in/out submenu */
        .submenuWrap {
          margin-top: 10px;
          opacity: 0;
          max-height: 0;
          transform: translateY(-4px);
          overflow: hidden;
          transition:
            opacity .18s ease,
            transform .18s ease,
            max-height .24s ease;
        }
        .submenuWrap.is-open {
          opacity: 1;
          max-height: 100%; /* enough space for the slider */
          transform: translateY(0);
        }
        .submenuWrap.is-closing {
          opacity: 0;
          max-height: 0;
          transform: translateY(-4px);
        }

        @media (min-width: 640px){ .catList { grid-template-columns: 1fr 1fr; } }
        @media (prefers-reduced-motion: reduce){
          .catCard, .catCard:active { transition: none; }
          .submenuWrap { transition: none; }
        }
      `}</style>
    </section>
  );
}
