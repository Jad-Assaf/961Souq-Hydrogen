import {Link} from '@remix-run/react';
import React, {useRef} from 'react'; // ⬅️ add useRef
import '../styles/HomeSliderWithMoreHeight.css';

export const CategorySliderWithMoreHeight = ({sliderCollections}) => {
  const sliderRef = useRef(null);

  const scroll = (direction) => {
    if (!sliderRef.current) return;
    const {clientWidth} = sliderRef.current;
    const amount =
      direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
    sliderRef.current.scrollBy({left: amount, behavior: 'smooth'});
  };

  return (
    <>
      <h3 className="cat-h3">Shop By Categories</h3>

      {/* make this container the positioning context for the buttons */}
      <div className="slide-con" style={{position: 'relative'}}>
        <div
          className="category-slider"
          ref={sliderRef}
          style={{overflowX: 'auto', scrollBehavior: 'smooth'}}
        >
          {sliderCollections.map((collection, index) => (
            <CategoryItem
              key={collection.id}
              collection={collection}
              index={index}
            />
          ))}
        </div>

        {/* scroll-left button */}
        <button
          type="button"
          aria-label="Scroll categories left"
          onClick={() => scroll('left')}
          className="scroll-left-btn"
        >
          <LeftArrowIcon/>
        </button>

        {/* scroll-right button */}
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
};

const imgs = [
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/store-card-40-refurb-202408_GEO_SG_FMT_WHH.jpg?v=1747908907',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Razer-BlackWidow-Kraken-Basilisk-Essential-Press-Size.webp?v=1747909645',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/SUR24_COMMR_Family_Attract_D3_13_01_Expanded_BloomTaskbar_1920.jpg?v=1747910052',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/kv-bg-xs.jpg?v=1747910586',
];

const descriptions = [
  'iPhones, Macs, and extras that just work.',
  'Gear built for smooth, lag-free play.',
  'Reliable machines for everyday office tasks.',
  'Stationary powerhouses for home or work.',
  'Components to build or upgrade your rig.',
  'Routers and switches to keep you connected.',
  'Clear, vibrant displays for work or fun.',
  'The latest handsets to keep you in touch.',
  'Portable screens for browsing, streaming, and work.',
  'Earbuds, Speakers, mixers, and mics for great sound.',
  'Club-ready mixers, controllers, and speakers for seamless sets.',
  'Cables, cases, and add-ons that simplify life.',
  'Smart gear to track and improve workouts.',
  'Cameras and lenses to capture every moment.',
  'Everyday helpers that make chores easier.',
];

function CategoryItem({collection, index}) {
  return (
    <div className="category-container">
      <div className="category-title">
        <h3>{collection.title}</h3>
        <p>{descriptions[index % descriptions.length]}</p>
      </div>
      <Link
        to={`/collections/${collection.handle}`}
        aria-label={collection.handle}
      >
        <img
          src={collection.image.url}
          alt={collection.title}
          className="category-imgg"
        />
      </Link>
    </div>
  );
}



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