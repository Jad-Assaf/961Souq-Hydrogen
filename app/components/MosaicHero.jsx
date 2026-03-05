/* eslint-disable hydrogen/prefer-image-component */
import React from 'react';
import {Link} from '~/components/link';

function withImageParams(url, {width, quality = 85, format = 'webp'}) {
  if (!url) return '';
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}width=${width}&quality=${quality}&format=${format}`;
}

function buildSrcSet(url, widths) {
  return widths
    .map((width) => `${withImageParams(url, {width})} ${width}w`)
    .join(', ');
}

export default function MosaicHero({collections}) {
  const getImagePriorityProps = (index) => {
    if (index < 3) return {loading: 'eager', fetchpriority: 'high'};
    return {loading: 'lazy'};
  };

  const getImageProps = ({url, index, isFeature = false}) => {
    const widths = isFeature ? [750] : [500];
    const maxWidth = widths[widths.length - 1];

    return {
      src: withImageParams(url, {width: maxWidth}),
      srcSet: buildSrcSet(url, widths),
      sizes: isFeature
        ? '(max-width: 979px) 100vw, 66vw'
        : '(max-width: 979px) 100vw, 33vw',
      width: isFeature ? 900 : 500,
      height: isFeature ? 300 : 250,
      decoding: 'async',
      ...getImagePriorityProps(index),
    };
  };

  const collectionImages = {
    apple:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Image_202602241158.jpg?v=1771928636&format=webp',
    gaming:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241203.jpg?v=1771928636&format=webp',
    gamingLaptops:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241207.jpg?v=1771928636&format=webp',
    mobiles:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241201.jpg?v=1771928636&format=webp',
    desktops:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241211.jpg?v=1771928636&format=webp',
    monitors:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241215.jpg?v=1771928636&format=webp',
    tablets:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241216.jpg?v=1771928636&format=webp',
    networking:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241217.jpg?v=1771928636&format=webp',
    accessories:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Create_a_premium_202602241221.jpg?v=1771928681&format=webp',
    dyson:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Image_202602241312.jpg?v=1771931777&format=webp',
    cosmetics:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Image_202602241315.jpg?v=1771931777&format=webp',
  };
  const appleFeatureImage = {
    src: collectionImages.apple,
    alt: 'Apple',
  };
  const gamingImage = {
    src: collectionImages.gaming,
    alt: 'Gaming',
  };
  const mobilesImage = {
    src: collectionImages.mobiles,
    alt: 'Mobiles',
  };
  const gamingLaptopsImage = {
    src: collectionImages.gamingLaptops,
    alt: 'Gaming Laptops',
  };
  const desktopsImage = {
    src: collectionImages.desktops,
    alt: 'Desktops',
  };
  const monitorsImage = {
    src: collectionImages.monitors,
    alt: 'Monitors',
  };
  const tabletsImage = {
    src: collectionImages.tablets,
    alt: 'Tablets',
  };
  const networkingImage = {
    src: collectionImages.networking,
    alt: 'Networking',
  };
  const accessoriesImage = {
    src: collectionImages.accessories,
    alt: 'Accessories',
  };
  const dysonImage = {
    src: collectionImages.dyson,
    alt: 'Dyson',
  };
  const cosmeticsImage = {
    src: collectionImages.cosmetics,
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
                alt={appleFeatureImage.alt}
                {...getImageProps({
                  url: appleFeatureImage.src,
                  index: 0,
                  isFeature: true,
                })}
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
                alt={mobilesImage.alt}
                {...getImageProps({url: mobilesImage.src, index: 1})}
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
                alt={gamingImage.alt}
                {...getImageProps({url: gamingImage.src, index: 2})}
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
                alt={gamingLaptopsImage.alt}
                {...getImageProps({url: gamingLaptopsImage.src, index: 3})}
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
                alt={desktopsImage.alt}
                {...getImageProps({url: desktopsImage.src, index: 4})}
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
                alt={monitorsImage.alt}
                {...getImageProps({url: monitorsImage.src, index: 5})}
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
                alt={tabletsImage.alt}
                {...getImageProps({url: tabletsImage.src, index: 6})}
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
                alt={networkingImage.alt}
                {...getImageProps({url: networkingImage.src, index: 7})}
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
                alt={dysonImage.alt}
                {...getImageProps({url: dysonImage.src, index: 8})}
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
                alt={cosmeticsImage.alt}
                {...getImageProps({url: cosmeticsImage.src, index: 9})}
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
                alt={accessoriesImage.alt}
                {...getImageProps({url: accessoriesImage.src, index: 10})}
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
