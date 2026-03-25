/* eslint-disable hydrogen/prefer-image-component */
import React from 'react';
import {Link} from '~/components/link';

export const MOSAIC_IMAGE_QUALITY = 70;
export const MOSAIC_FEATURE_WIDTHS = [320, 480, 640, 900, 1200];
export const MOSAIC_TILE_WIDTHS = [240, 320, 400, 500, 640];
export const MOSAIC_FEATURE_SIZES = '(max-width: 979px) 100vw, 66vw';
export const MOSAIC_TILE_SIZES = '(max-width: 979px) 100vw, 33vw';

export function withMosaicImageParams(
  url,
  {width, quality = MOSAIC_IMAGE_QUALITY, format = 'webp'},
) {
  if (!url) return '';
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}width=${width}&quality=${quality}&format=${format}`;
}

function buildSrcSet(url, widths) {
  return widths
    .map((width) => `${withMosaicImageParams(url, {width})} ${width}w`)
    .join(', ');
}

export default function MosaicHero({collections}) {
  const isVideoSource = (url) =>
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(String(url || ''));

  const getImagePriorityProps = (index) => {
    if (index <= 1) return {loading: 'eager', fetchpriority: 'high'};
    return {loading: 'lazy', fetchpriority: 'low'};
  };

  const getImageProps = ({url, index, isFeature = false}) => {
    const widths = isFeature ? MOSAIC_FEATURE_WIDTHS : MOSAIC_TILE_WIDTHS;
    const maxWidth = widths[widths.length - 1];

    return {
      src: withMosaicImageParams(url, {width: maxWidth}),
      srcSet: buildSrcSet(url, widths),
      sizes: isFeature ? MOSAIC_FEATURE_SIZES : MOSAIC_TILE_SIZES,
      width: isFeature ? 900 : 500,
      height: isFeature ? 300 : 250,
      decoding: 'async',
      ...getImagePriorityProps(index),
    };
  };

  const collectionImages = {
    apple:
      'https://cdn.shopify.com/videos/c/o/v/12194bcc13cb4092afaa0bb3df6fae08.mp4',
    gaming:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/gaming.jpg?v=1773672306&format=webp',
    gamingLaptops:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/gaming_laptops.jpg?v=1773672306&format=webp',
    mobiles:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/mobiles_9fdbec20-948c-4738-9fb2-c0629f406d7a.jpg?v=1773672307&format=webp',
    desktops:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/desktops.jpg?v=1773672306&format=webp',
    monitors:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/monitors_f301f500-0563-4eab-a6d8-5321da5812a4.jpg?v=1773672306&format=webp',
    tablets:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/tablets_80cf58eb-958e-43ab-b270-542d43d810c0.jpg?v=1773672306&format=webp',
    networking:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/networking_32150fc5-127d-4ad6-aca5-baf9060230e4.jpg?v=1773672306&format=webp',
    accessories:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/accessories_792b1223-1b2f-4517-8c87-ba116e3cfd1e.jpg?v=1773672306&format=webp',
    dyson:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/home_appliances.jpg?v=1773672307&format=webp',
    cosmetics:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/beauty.jpg?v=1773672306&format=webp',
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
              <p className="tile__sub">
                All New MacBook NEO and M5 Chips now Available...
              </p>
            </div>

            <div className="tile__media" aria-hidden="true">
              {isVideoSource(appleFeatureImage.src) ? (
                <video
                  src={appleFeatureImage.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-label={appleFeatureImage.alt}
                />
              ) : (
                <img
                  alt={appleFeatureImage.alt}
                  {...getImageProps({
                    url: appleFeatureImage.src,
                    index: 0,
                    isFeature: true,
                  })}
                />
              )}
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
