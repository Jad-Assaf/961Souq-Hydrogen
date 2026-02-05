import {Link} from '@remix-run/react';
import React, {useRef} from 'react';
// import '../styles/HomeSliderWithMoreHeight.css';

export const CategorySliderWithMoreHeight = ({sliderCollections}) => {
  const sliderRef = useRef(null);

  const scroll = (direction) => {
    if (!sliderRef.current) return;
    const {clientWidth} = sliderRef.current;
    const amount = direction === 'left' ? -clientWidth * 1 : clientWidth * 1;
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
          <LeftArrowIcon />
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
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-1.jpg?v=1747995659',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/gaming-1.jpg?v=1747995659',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/laptops-1.jpg?v=1747995659',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/dekstops.jpg?v=1747995659',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/pc-parts.jpg?v=1747995659',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/networking-1.jpg?v=1747995659',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/monitors_b9186522-836f-4ab7-9d48-41fbdb1e20ed.jpg?v=1747995659',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/phones_d5aded45-9b39-47c9-b69e-31b16aaef7aa.jpg?v=1747995659',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/tablets_191d3d41-0840-433d-ab84-644697a6c033.jpg?v=1747995659',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/earbuds.jpg?v=1747996340',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/pioneer.jpg?v=1747995659',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/accessories_79d5f32e-19db-453e-88ac-8cd3146d101d.jpg?v=1747995659',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/fitness.jpg?v=1747995659',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/photography.jpg?v=1747995659',
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/home-appliances.jpg?v=1747995659',
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
    <>
      <div className="category-container">
        {/* <div className="category-title">
              <h3>{collection.title}</h3>
              <p>{descriptions[index % descriptions.length]}</p>
          </div> */}
        <Link
          to={`/collections/${collection.handle}`}
          aria-label={collection.handle}
        >
          <img
            // src={imgs[index % imgs.length]}
            src={`${collection.image.url}&width=250`}
            alt={collection.title}
            className="category-imgg"
          />
        </Link>
        <div className="category-title">
          <h3>{collection.title}</h3>
          <p>{descriptions[index % descriptions.length]}</p>
        </div>
      </div>
    </>
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
