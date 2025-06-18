// app/components/CategorySliderFromMenu.jsx
import React, {useRef} from 'react';
import {Link} from '@remix-run/react';
// import '../styles/HomeSliderWithMoreHeight.css';

/**
 * Display grouped category sliders:
 * ┌ Apple ───────────────────────────────────────┐
 * │ [child 1] [child 2] …                        │
 * └───────────────────────────────────────────────┘
 * ┌ Gaming ──────────────────────────────────────┐
 * │ [child 1] [child 2] …                        │
 * └───────────────────────────────────────────────┘
 */
export function CategorySliderFromMenuMobile({menu}) {
  if (!menu?.items?.length) return null;

  /* ---------- helpers ---------- */
  const imgSrc = (item) =>
    item?.resource?.image?.url || item?.resource?.image?.src || '';

  const itemTitle = (item) => item?.resource?.title || item?.title || '—';

  const itemPath = (item) =>
    item?.resource?.handle
      ? `/collections/${item.resource.handle}`
      : (() => {
          if (item?.url) {
            try {
              return new URL(item.url).pathname;
            } catch {
              return item.url;
            }
          }
          return '#';
        })();

  /* ---------- component ---------- */
  return (
    <>
      {/* <h3 className="cat-h3">Browse&nbsp;Categories</h3> */}

      {menu.items.map((parent) => {
        const children = parent.items || [];
        if (!children.length) return null;

        // ref per parent so each slider scrolls independently
        const sliderRef = useRef(null);
        const scroll = (dir) => {
          if (!sliderRef.current) return;
          const amt =
            dir === 'left'
              ? -sliderRef.current.clientWidth
              : sliderRef.current.clientWidth;
          sliderRef.current.scrollBy({left: amt, behavior: 'smooth'});
        };

        return (
          <section key={parent.id} className="category-group sliderWithMoreHeight">
            <div className="slide-con" style={{position: 'relative'}}>
              <p className="parent-title button-85">{parent.title}</p>
              <div
                ref={sliderRef}
                className="category-slider"
                style={{
                  overflowX: 'auto',
                  scrollBehavior: 'smooth',
                  display: 'flex',
                }}
              >
                {children.map((item) => {
                  const src = imgSrc(item);
                  if (!src) return null;

                  return (
                    <div className="category-container" key={item.id}>
                      <Link to={itemPath(item)} aria-label={itemTitle(item)}>
                        <img
                          src={`${src}${
                            src.includes('?') ? '&' : '?'
                          }width=300`}
                          alt={itemTitle(item)}
                          className="category-imgg"
                          loading="lazy"
                          width={200}
                          height={200}
                        />
                      </Link>
                      <div className="category-title">
                        <p>{itemTitle(item)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* nav buttons for this group */}
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scroll('left')}
                className="scroll-left-btn"
              >
                <LeftArrowIcon />
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scroll('right')}
                className="scroll-right-btn"
              >
                <RightArrowIcon />
              </button>
            </div>
          </section>
        );
      })}
    </>
  );
}

/* ---------- arrows ---------- */
const LeftArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const RightArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
