/* eslint-disable hydrogen/prefer-image-component */
import React from 'react';
import {Link} from '~/components/link';

function withWidth(url, width) {
  if (!url) return '';
  return `${url}${url.includes('?') ? '&' : '?'}width=${width}`;
}

export default function MosaicHero({collections}) {
  const getImagePriorityProps = (index) =>
    index < 3
      ? {loading: 'eager', fetchpriority: 'high'}
      : {loading: 'lazy'};

  const collectionImages = {
    apple:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Image_202602241158.jpg?v=1771928636',
    gaming:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241203.jpg?v=1771928636',
    gamingLaptops:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241207.jpg?v=1771928636',
    mobiles:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241201.jpg?v=1771928636',
    desktops:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241211.jpg?v=1771928636',
    monitors:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241215.jpg?v=1771928636',
    tablets:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241216.jpg?v=1771928636',
    networking:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241217.jpg?v=1771928636',
    accessories:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241221.jpg?v=1771928681',
    dyson:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Image_202602241312.jpg?v=1771931777',
    cosmetics:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Image_202602241315.jpg?v=1771931777',
  };
  const appleFeatureImage = {
    src: withWidth(collectionImages.apple, 700),
    alt: 'Apple',
  };
  const gamingImage = {
    src: withWidth(collectionImages.gaming, 400),
    alt: 'Gaming',
  };
  const mobilesImage = {
    src: withWidth(collectionImages.mobiles, 500),
    alt: 'Mobiles',
  };
  const gamingLaptopsImage = {
    src: withWidth(collectionImages.gamingLaptops, 400),
    alt: 'Gaming Laptops',
  };
  const desktopsImage = {
    src: withWidth(collectionImages.desktops, 400),
    alt: 'Desktops',
  };
  const monitorsImage = {
    src: withWidth(collectionImages.monitors, 400),
    alt: 'Monitors',
  };
  const tabletsImage = {
    src: withWidth(collectionImages.tablets, 400),
    alt: 'Tablets',
  };
  const networkingImage = {
    src: withWidth(collectionImages.networking, 400),
    alt: 'Networking',
  };
  const accessoriesImage = {
    src: withWidth(collectionImages.accessories, 400),
    alt: 'Accessories',
  };
  const dysonImage = {
    src: withWidth(collectionImages.dyson, 400),
    alt: 'Dyson',
  };
  const cosmeticsImage = {
    src: withWidth(collectionImages.cosmetics, 400),
    alt: 'Cosmetics',
  };
  const shouldShowCollection = (handle) => {
    if (!collections || typeof collections !== 'object') return true;
    if (!Object.prototype.hasOwnProperty.call(collections, handle)) return true;
    return Boolean(collections[handle]);
  };

  return (
    <section className="mosaic-hero" aria-label="Homepage hero">
      <div className="mosaic-wrap">
        {shouldShowCollection('apple') && (
          <Link className="tile tile--feature" to="/collections/apple">
            <div className="tile__content">
              <h2 className="tile__title">Apple</h2>
              <p className="tile__sub">iPhone, iPad, MacBook...</p>
            </div>

            <div className="tile__media" aria-hidden="true">
              <img
                src={appleFeatureImage.src}
                alt={appleFeatureImage.alt}
                width="900"
                height="300"
                {...getImagePriorityProps(0)}
              />
            </div>
            <span className="tile__arrow" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        )}

        {shouldShowCollection('mobiles') && (
          <Link className="tile tile--phones" to="/collections/mobiles">
            <div className="tile__content">
              <h3 className="tile__title tile__title--sm">Mobiles</h3>
              <p className="tile__sub">Android &amp; iPhone</p>
            </div>
            <div className="tile__media" aria-hidden="true">
              <img
                src={mobilesImage.src}
                alt={mobilesImage.alt}
                width="600"
                height="250"
                {...getImagePriorityProps(1)}
              />
            </div>
            <span className="tile__arrow" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        )}

        {shouldShowCollection('gaming') && (
          <Link className="tile tile--gaming" to="/collections/gaming">
            <div className="tile__content">
              <h3 className="tile__title tile__title--sm">Gaming</h3>
              <p className="tile__sub">Consoles &amp; Gear</p>
            </div>
            <div className="tile__media" aria-hidden="true">
              <img
                src={gamingImage.src}
                alt={gamingImage.alt}
                width="500"
                height="250"
                {...getImagePriorityProps(2)}
              />
            </div>
            <span className="tile__arrow" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        )}

        {shouldShowCollection('gaming-laptops') && (
          <Link className="tile tile--laptops" to="/collections/gaming-laptops">
            <div className="tile__content">
              <h3 className="tile__title tile__title--sm">Gaming Laptops</h3>
              <p className="tile__sub">RTX &amp; High FPS</p>
            </div>
            <div className="tile__media" aria-hidden="true">
              <img
                src={gamingLaptopsImage.src}
                alt={gamingLaptopsImage.alt}
                width="500"
                height="250"
                {...getImagePriorityProps(3)}
              />
            </div>
            <span className="tile__arrow" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        )}

        {shouldShowCollection('desktops') && (
          <Link className="tile tile--desktops" to="/collections/desktops">
            <div className="tile__content">
              <h3 className="tile__title tile__title--sm">Desktops</h3>
              <p className="tile__sub">Builds &amp; PCs</p>
            </div>
            <div className="tile__media" aria-hidden="true">
              <img
                src={desktopsImage.src}
                alt={desktopsImage.alt}
                width="500"
                height="250"
                {...getImagePriorityProps(4)}
              />
            </div>
            <span className="tile__arrow" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        )}

        {shouldShowCollection('monitors') && (
          <Link className="tile tile--monitors" to="/collections/monitors">
            <div className="tile__content">
              <h3 className="tile__title tile__title--sm">Monitors</h3>
              <p className="tile__sub">144Hz / 4K</p>
            </div>
            <div className="tile__media" aria-hidden="true">
              <img
                src={monitorsImage.src}
                alt={monitorsImage.alt}
                width="500"
                height="250"
                {...getImagePriorityProps(5)}
              />
            </div>
            <span className="tile__arrow" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        )}

        {shouldShowCollection('tablets') && (
          <Link className="tile tile--tablets" to="/collections/tablets">
            <div className="tile__content">
              <h3 className="tile__title tile__title--sm">Tablets</h3>
              <p className="tile__sub">Study &amp; Play</p>
            </div>
            <div className="tile__media" aria-hidden="true">
              <img
                src={tabletsImage.src}
                alt={tabletsImage.alt}
                width="500"
                height="250"
                {...getImagePriorityProps(6)}
              />
            </div>
            <span className="tile__arrow" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        )}

        {shouldShowCollection('networking') && (
          <Link className="tile tile--networking" to="/collections/networking">
            <div className="tile__content">
              <h3 className="tile__title tile__title--sm">Networking</h3>
              <p className="tile__sub">Routers &amp; Mesh</p>
            </div>
            <div className="tile__media" aria-hidden="true">
              <img
                src={networkingImage.src}
                alt={networkingImage.alt}
                width="500"
                height="250"
                {...getImagePriorityProps(7)}
              />
            </div>
            <span className="tile__arrow" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        )}

        {shouldShowCollection('dyson-products') && (
          <Link className="tile tile--dyson" to="/collections/dyson-products">
            <div className="tile__content">
              <h3 className="tile__title tile__title--sm">Dyson</h3>
              <p className="tile__sub">Home Tech &amp; Care</p>
            </div>
            <div className="tile__media" aria-hidden="true">
              <img
                src={dysonImage.src}
                alt={dysonImage.alt}
                width="500"
                height="250"
                {...getImagePriorityProps(8)}
              />
            </div>
            <span className="tile__arrow" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        )}

        {shouldShowCollection('cosmetics') && (
          <Link className="tile tile--cosmetics" to="/collections/cosmetics">
            <div className="tile__content">
              <h3 className="tile__title tile__title--sm">Cosmetics</h3>
              <p className="tile__sub">Beauty Essentials</p>
            </div>
            <div className="tile__media" aria-hidden="true">
              <img
                src={cosmeticsImage.src}
                alt={cosmeticsImage.alt}
                width="500"
                height="250"
                {...getImagePriorityProps(9)}
              />
            </div>
            <span className="tile__arrow" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        )}

        {shouldShowCollection('accessories') && (
          <Link
            className="tile tile--accessories"
            to="/collections/accessories"
          >
            <div className="tile__content">
              <h3 className="tile__title tile__title--sm">Accessories</h3>
              <p className="tile__sub">Chargers, Cables &amp; More</p>
            </div>
            <div className="tile__media" aria-hidden="true">
              <img
                src={accessoriesImage.src}
                alt={accessoriesImage.alt}
                width="500"
                height="250"
                {...getImagePriorityProps(10)}
              />
            </div>
            <span className="tile__arrow" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}

/* eslint-enable hydrogen/prefer-image-component */
