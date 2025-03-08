import React, {Suspense, useState} from 'react';
import {defer} from '@shopify/remix-oxygen';
import {Await, useLoaderData} from '@remix-run/react';
import {BannerSlideshow} from '../components/BannerSlideshow';
import {CategorySlider} from '~/components/CollectionSlider';
import {TopProductSections} from '~/components/TopProductSections';
import BrandSection from '~/components/BrandsSection';
import {getSeoMeta} from '@shopify/hydrogen';
import {
  CollectionCircles,
  appleMenu,
  audioMenu,
  camerasMenu,
  fitnessMenu,
  gamingMenu,
  homeAppliancesMenu,
  laptopsMenu,
  mobilesMenu,
  monitorsMenu,
  tabletsMenu,
} from '~/components/CollectionCircles';
import MobileAppPopup from '~/components/MobileAppPopup';

const MANUAL_MENU_HANDLES = [
  'apple',
  'gaming',
  'laptops',
  'desktops',
  'pc-parts',
  'networking',
  'monitors',
  'mobiles',
  'tablets',
  'audio',
  'pioneer-equipment',
  'accessories',
  'fitness',
  'photography',
  'home-appliances',
];

/**
 * @type {MetaFunction}
 */
export const meta = ({data}) => {
  const truncate = (text, maxLength) =>
    text?.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
  return getSeoMeta({
    title: '961Souq',
    description: truncate(
      data?.description || 'Default description for this page.',
      150,
    ),
    url: data?.url || 'https://961souq.com',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: data?.title || 'Default Title',
        description: truncate(
          data?.description || 'Default description for this page.',
          150,
        ),
        url: data?.url || 'https://961souq.com',
      },
      {
        '@context': 'http://schema.org',
        '@type': 'WebSite',
        name: '961Souq',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://961souq.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
        url: 'https://961souq.com',
      },
    ],
  });
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Define banners (critical UI elements)
  const banners = [
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-banner-1.jpg?v=1740146682',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-mobile-banner-1.jpg?v=1740146682',
      link: '/collections/steelseries',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/rayban-banner-F1_98212271-ea73-4c38-b498-ba25125ddd74.jpg?v=1740054162',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/rayban-mobile-banner.jpg?v=1740053906',
      link: '/collections/ray-ban-smart-glasses',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/jbl-banner_895451dd-e1a6-41ac-ae3d-0aad653a89d3.jpg?v=1740045077',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/jbl-mobile-banner-2.jpg?v=1740045077',
      link: '/collections/jbl-collection',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/dyson-banner.jpg?v=1740063425',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/dyson-mobile-banner.jpg?v=1740063424',
      link: '/collections/dyson-products',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-banner_0e0f39d5-b1ba-421e-bdaa-d1d6549226cb.jpg?v=1740222975',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-mobile-banner_fa7314db-9154-4ae4-8abe-6c6772a34946.jpg?v=1740223327',
      link: '/collections/apple-products',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/google-pixel-banner.jpg?v=1728123476',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/google-pixel-mobilebanner.jpg?v=1728123476',
      link: '/collections/google-products',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/remarkable-pro-banner_25c8cc9c-14de-4556-9e8f-5388ebc1eb1d.jpg?v=1729676718',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/remarkable-pro-mobile-banner-1.jpg?v=1729678484',
      link: '/collections/remarkable-tablets',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lenovo-legion-pro-7-banner-2.jpg?v=1740491546',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lenovo-legion-pro-7-mobile-banner.jpg?v=1740491546',
      link: '/products/lenovo-legion-pro-7-83de0079in-16-core-i9-14900hx-32gb-ram-1tb-ssd-rtx-4090-16gb',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iphone-16-Pro_655c6ee7-a66c-4ed9-9976-99be3122e7b6.jpg?v=1726321897',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iphone-16-Pro-mobile.jpg?v=1726321600',
      link: '/collections/apple-iphone',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Garmin.jpg?v=1726321601',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Garmin-mobile-banner.jpg?v=1726321601',
      link: '/products/garmin-fenix-8-47-mm-amoled-sapphire-premium-multisport-gps-watch',
    },
  ];

  // Fire off critical queries concurrently so above‑the‑fold content is fast.
  const criticalDataPromise = loadCriticalData(args);
  const newArrivalsPromise = fetchCollectionByHandle(
    args.context,
    'new-arrivals',
  );
 
  const [criticalData, newArrivals] = await Promise.all([
    criticalDataPromise,
    newArrivalsPromise,
  ]);

  // Build a unique list of collection handles from your menus.
  const menuHandles = [
    ...appleMenu.map((item) => getHandleFromUrl(item.url)),
    ...gamingMenu.map((item) => getHandleFromUrl(item.url)),
    ...laptopsMenu.map((item) => getHandleFromUrl(item.url)),
    ...monitorsMenu.map((item) => getHandleFromUrl(item.url)),
    ...mobilesMenu.map((item) => getHandleFromUrl(item.url)),
    ...tabletsMenu.map((item) => getHandleFromUrl(item.url)),
    ...audioMenu.map((item) => getHandleFromUrl(item.url)),
    ...fitnessMenu.map((item) => getHandleFromUrl(item.url)),
    ...camerasMenu.map((item) => getHandleFromUrl(item.url)),
    ...homeAppliancesMenu.map((item) => getHandleFromUrl(item.url)),
  ];
  const uniqueMenuHandles = [...new Set(menuHandles)];

  // Exclude the critical Apple handle (already fetched).
  const nonCriticalHandles = uniqueMenuHandles

  // Fetch non‑critical collections concurrently.
  const deferredTopProductsPromise = Promise.all(
    nonCriticalHandles.map((handle) =>
      fetchCollectionByHandle(args.context, handle),
    ),
  ).then((results) => {
    const topProductsByHandle = {};
    nonCriticalHandles.forEach((handle, index) => {
      topProductsByHandle[handle] = results[index];
    });
    return topProductsByHandle;
  });

  // Prepare critical top products.
  const initialTopProducts = {};

  // Return critical data immediately and stream non‑critical data.
  return defer(
    {
      banners,
      sliderCollections: criticalData.sliderCollections,
      newArrivals,
      topProducts: initialTopProducts,
      restTopProducts: deferredTopProductsPromise,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    },
  );
}

export function shouldRevalidate({currentUrl, nextUrl}) {
  return currentUrl.pathname !== nextUrl.pathname;
}

async function fetchCollectionByHandle(context, handle) {
  const {collectionByHandle} = await context.storefront.query(
    GET_COLLECTION_BY_HANDLE_QUERY,
    { variables: { handle }, cache: context.storefront.CacheLong() }
  );
  return collectionByHandle || null;
}

async function fetchCollectionsByHandles(context, handles) {
  const collectionPromises = handles.map(async (handle) => {
    const {collectionByHandle} = await context.storefront.query(
      GET_SIMPLE_COLLECTION_QUERY,
      { variables: { handle }, cache: context.storefront.CacheLong() }
    );
    return collectionByHandle || null;
  });
  const collections = await Promise.all(collectionPromises);
  return collections.filter(Boolean);
}

async function loadCriticalData({context}) {
  const {storefront} = context;
  const menuHandles = MANUAL_MENU_HANDLES;
  const {shop} = await storefront.query(
    `#graphql
      query ShopDetails {
        shop {
          name
          description
        }
      }
    `,
    { cache: storefront.CacheLong() }
  );
  const [sliderCollections] = await Promise.all([
    fetchCollectionsByHandles(context, menuHandles),
  ]);
  return {
    sliderCollections,
    title: shop.name,
    description: shop.description,
    url: 'https://961souq.com',
  };
}

const brandsData = [
  {
    name: 'Apple',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-new.jpg?v=1733388855',
    link: '/collections/apple',
  },
  {
    name: 'HP',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/hp-new.jpg?v=1733388855',
    link: '/collections/hp-products',
  },
  {
    name: 'MSI',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/msi-new.jpg?v=1733388855',
    link: '/collections/msi-products',
  },
  {
    name: 'Marshall',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/marshall-new.jpg?v=1733388855',
    link: '/collections/marshall-collection',
  },
  {
    name: 'JBL',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/jbl-new.jpg?v=1733388856',
    link: '/collections/jbl-collection',
  },
  {
    name: 'Dell',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/dell-new.jpg?v=1733388855',
    link: '/collections/dell-products',
  },
  {
    name: 'Garmin',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/garmin-new.jpg?v=1733393801',
    link: '/collections/garmin-smart-watch',
  },
  {
    name: 'Asus',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/asus-new.jpg?v=1733388855',
    link: '/collections/asus-products',
  },
  {
    name: 'Samsung',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-new.jpg?v=1733388855',
    link: '/collections/samsung-products',
  },
  {
    name: 'Sony',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/sony-new.jpg?v=1733389303',
    link: '/collections/sony',
  },
  {
    name: 'Benq',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/benq-products.jpg?v=1733388855',
    link: '/collections/benq-products',
  },
  {
    name: 'Tp-link',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/tp-link.jpg?v=1733388855',
    link: '/collections/tp-link-products',
  },
  {
    name: 'Nothing',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/nothing-new.jpg?v=1733388855',
    link: '/collections/nothing-products',
  },
  {
    name: 'Xiaomi',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/mi-new.jpg?v=1733388855',
    link: '/collections/xiaomi-products',
  },
  {
    name: 'Microsoft',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/microsoft-new.jpg?v=1733388855',
    link: '/collections/microsoft-products',
  },
  {
    name: 'Nintendo',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/nintendo-new.jpg?v=1733388855',
    link: '/collections/nintendo-products',
  },
  {
    name: 'Lenovo',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lenovo-new.jpg?v=1733388855',
    link: '/collections/lenovo-products',
  },
  {
    name: 'LG',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lg-new.jpg?v=1733388855',
    link: '/collections/lg-products',
  },
  {
    name: 'Meta',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/meta-new.jpg?v=1733388855',
    link: '/collections/meta-products',
  },
  {
    name: 'Ubiquiti',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ubiquiti-new.jpg?v=1733388855',
    link: '/collections/ubiquiti-products',
  },
  {
    name: 'Philips',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Philips-new.jpg?v=1733388855',
    link: '/collections/philips-products',
  },
];

const getHandleFromUrl = (url) => {
  const parts = url.split('/collections/');
  if (parts.length < 2) return '';
  let handle = parts[1].toLowerCase();
  // Remove trailing slash if present
  if (handle.endsWith('/')) {
    handle = handle.slice(0, -1);
  }
  return handle;
};

export default function Homepage() {
  const {
    banners,
    sliderCollections,
    topProducts,
    newArrivals,
    restTopProducts,
  } = useLoaderData();

  // Keep existing state initialization for each menu group
  const [selectedApple, setSelectedApple] = useState(appleMenu[0]);
  const [selectedGaming, setSelectedGaming] = useState(gamingMenu[0]);
  const [selectedLaptops, setSelectedLaptops] = useState(laptopsMenu[0]);
  const [selectedMonitors, setSelectedMonitors] = useState(monitorsMenu[0]);
  const [selectedMobiles, setSelectedMobiles] = useState(mobilesMenu[0]);
  const [selectedTablets, setSelectedTablets] = useState(tabletsMenu[0]);
  const [selectedAudio, setSelectedAudio] = useState(audioMenu[0]);
  const [selectedFitness, setSelectedFitness] = useState(fitnessMenu[0]);
  const [selectedCameras, setSelectedCameras] = useState(camerasMenu[0]);
  const [selectedHomeAppliances, setSelectedHomeAppliances] = useState(
    homeAppliancesMenu[0],
  );

  const combinedTopProducts = {
    ...topProducts,
    // Note: restTopProducts will be merged in after it's resolved.
  };

  return (
    <div className="home">
      {/* <MobileAppPopup /> */}
      <BannerSlideshow banners={banners} />
      <CategorySlider sliderCollections={sliderCollections} />
      {newArrivals && <TopProductSections collection={newArrivals} />}

      <Suspense fallback={<p>Loading more products…</p>}>
        <Await resolve={restTopProducts}>
          {(deferredData) => {
            // Merge deferred top products with the initial ones.
            const fullTopProducts = {...combinedTopProducts, ...deferredData};

            return (
              <>
                {/* Gaming Group */}
                <CollectionCircles
                  collections={appleMenu}
                  onCollectionSelect={setSelectedApple}
                />
                {selectedApple &&
                  fullTopProducts[getHandleFromUrl(selectedApple.url)] && (
                    <TopProductSections
                      collection={
                        fullTopProducts[getHandleFromUrl(selectedApple.url)]
                      }
                    />
                  )}

                {/* Gaming Group */}
                <CollectionCircles
                  collections={gamingMenu}
                  onCollectionSelect={setSelectedGaming}
                />
                {selectedGaming &&
                  fullTopProducts[getHandleFromUrl(selectedGaming.url)] && (
                    <TopProductSections
                      collection={
                        fullTopProducts[getHandleFromUrl(selectedGaming.url)]
                      }
                    />
                  )}

                {/* Laptops Group */}
                <CollectionCircles
                  collections={laptopsMenu}
                  onCollectionSelect={setSelectedLaptops}
                />
                {selectedLaptops &&
                  fullTopProducts[getHandleFromUrl(selectedLaptops.url)] && (
                    <TopProductSections
                      collection={
                        fullTopProducts[getHandleFromUrl(selectedLaptops.url)]
                      }
                    />
                  )}

                {/* Monitors Group */}
                <CollectionCircles
                  collections={monitorsMenu}
                  onCollectionSelect={setSelectedMonitors}
                />
                {selectedMonitors &&
                  fullTopProducts[getHandleFromUrl(selectedMonitors.url)] && (
                    <TopProductSections
                      collection={
                        fullTopProducts[getHandleFromUrl(selectedMonitors.url)]
                      }
                    />
                  )}

                {/* Mobiles Group */}
                <CollectionCircles
                  collections={mobilesMenu}
                  onCollectionSelect={setSelectedMobiles}
                />
                {selectedMobiles &&
                  fullTopProducts[getHandleFromUrl(selectedMobiles.url)] && (
                    <TopProductSections
                      collection={
                        fullTopProducts[getHandleFromUrl(selectedMobiles.url)]
                      }
                    />
                  )}

                {/* Tablets Group */}
                <CollectionCircles
                  collections={tabletsMenu}
                  onCollectionSelect={setSelectedTablets}
                />
                {selectedTablets &&
                  fullTopProducts[getHandleFromUrl(selectedTablets.url)] && (
                    <TopProductSections
                      collection={
                        fullTopProducts[getHandleFromUrl(selectedTablets.url)]
                      }
                    />
                  )}

                {/* Audio Group */}
                <CollectionCircles
                  collections={audioMenu}
                  onCollectionSelect={setSelectedAudio}
                />
                {selectedAudio &&
                  fullTopProducts[getHandleFromUrl(selectedAudio.url)] && (
                    <TopProductSections
                      collection={
                        fullTopProducts[getHandleFromUrl(selectedAudio.url)]
                      }
                    />
                  )}

                {/* Fitness Group */}
                <CollectionCircles
                  collections={fitnessMenu}
                  onCollectionSelect={setSelectedFitness}
                />
                {selectedFitness &&
                  fullTopProducts[getHandleFromUrl(selectedFitness.url)] && (
                    <TopProductSections
                      collection={
                        fullTopProducts[getHandleFromUrl(selectedFitness.url)]
                      }
                    />
                  )}

                {/* Cameras Group */}
                <CollectionCircles
                  collections={camerasMenu}
                  onCollectionSelect={setSelectedCameras}
                />
                {selectedCameras &&
                  fullTopProducts[getHandleFromUrl(selectedCameras.url)] && (
                    <TopProductSections
                      collection={
                        fullTopProducts[getHandleFromUrl(selectedCameras.url)]
                      }
                    />
                  )}

                {/* Home Appliances Group */}
                <CollectionCircles
                  collections={homeAppliancesMenu}
                  onCollectionSelect={setSelectedHomeAppliances}
                />
                {selectedHomeAppliances &&
                  fullTopProducts[
                    getHandleFromUrl(selectedHomeAppliances.url)
                  ] && (
                    <TopProductSections
                      collection={
                        fullTopProducts[
                          getHandleFromUrl(selectedHomeAppliances.url)
                        ]
                      }
                    />
                  )}
              </>
            );
          }}
        </Await>
      </Suspense>

      <BrandSection brands={brandsData} />
    </div>
  );
}

const GET_COLLECTION_BY_HANDLE_QUERY = `#graphql
  query GetCollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      title
      handle
      image {
        url
        altText
      }
      products(first: 10) {
        nodes {
          id
          title
          handle
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 2) {
            nodes {
              url
              altText
            }
          }
          variants(first: 5) {
            nodes {
              id
              availableForSale
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  }
`;

const GET_SIMPLE_COLLECTION_QUERY = `#graphql
  query GetSimpleCollection($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      title
      handle
      image {
        url
        altText
      }
    }
  }
`;
