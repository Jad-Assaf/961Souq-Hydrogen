// app/components/CategorySliderFromMenu.jsx
import React, {useRef} from 'react';
import {Link} from '@remix-run/react';
import '../styles/HomeSliderWithMoreHeight.css';

export  function CategorySliderFromMenu({menu}) {
  if (!menu?.items?.length) return null;

  /* ---------------------------------------------
     Gather *second-level* items (children of each
     top-level menu entry)
  ----------------------------------------------*/
  const secondLevel = menu.items.flatMap((parent) => parent.items || []);
  if (!secondLevel.length) return null; // nothing to show

  const sliderRef = useRef(null);

  const scroll = (dir) => {
    if (!sliderRef.current) return;
    const amt =
      dir === 'left'
        ? -sliderRef.current.clientWidth
        : sliderRef.current.clientWidth;
    sliderRef.current.scrollBy({left: amt, behavior: 'smooth'});
  };

  /* ------------ helpers ------------- */
  const imgSrc = (item) =>
    item?.resource?.image?.url || item?.resource?.image?.src || '';
  const title = (item) => item?.resource?.title || item?.title || '—';
  const path = (item) =>
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

  return (
    <>
      <h3 className="cat-h3">Browse Categories</h3>

      <div className="slide-con" style={{position: 'relative'}}>
        <div
          className="category-slider"
          ref={sliderRef}
          style={{
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            display: 'flex',
          }}
        >
          {secondLevel.map((item, idx) => {
            const src = imgSrc(item);
            if (!src) return null;

            return (
              <div className="category-container" key={item.id}>
                <Link to={path(item)} aria-label={title(item)}>
                  <img
                    src={`${src}${src.includes('?') ? '&' : '?'}width=300`}
                    alt={title(item)}
                    className="category-imgg"
                  />
                </Link>
                <div className="category-title">
                  <h3>{title(item)}</h3>
                  {/* <p>{descriptions[idx % descriptions.length]}</p> */}
                </div>
              </div>
            );
          })}
        </div>

        {/* nav buttons */}
        <button
          type="button"
          aria-label="Scroll categories left"
          onClick={() => scroll('left')}
          className="scroll-left-btn"
        >
          <LeftArrowIcon />
        </button>
        <button
          type="button"
          aria-label="Scroll categories right"
          onClick={() => scroll('right')}
          className="scroll-right-btn"
        >
          <RightArrowIcon />
        </button>
      </div>
    </>
  );
}

/* ------ filler descriptions ------ */
// const descriptions = [
//   'iPhones, Macs, and extras that just work.',
//   'Gear built for smooth, lag-free play.',
//   'Reliable machines for everyday office tasks.',
//   'Stationary powerhouses for home or work.',
//   'Components to build or upgrade your rig.',
//   'Routers and switches to keep you connected.',
//   'Clear, vibrant displays for work or fun.',
//   'The latest handsets to keep you in touch.',
//   'Portable screens for browsing, streaming, and work.',
//   'Audio gear for crisp sound.',
//   'Club-ready mixers and controllers.',
//   'Cables, cases, and add-ons to simplify life.',
//   'Smart wearables to track workouts.',
//   'Cameras and lenses to capture moments.',
//   'Everyday helpers that make chores easier.',
// ];

/* ------ icons ------ */
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
