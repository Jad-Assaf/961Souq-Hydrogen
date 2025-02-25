import React from 'react';
import {defer} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {BannerSlideshow} from '../components/BannerSlideshow';
import {CategorySlider} from '~/components/CollectionSlider';
import {TopProductSections} from '~/components/TopProductSections';
import BrandSection from '~/components/BrandsSection';
import {getSeoMeta} from '@shopify/hydrogen';
import {
  CollectionCircles,
  accessoriesMenu,
  appleMenu,
  audioMenu,
  camerasMenu,
  fitnessMenu,
  gamingMenu,
  homeAppliancesMenu,
  laptopsMenu,
  mobilesMenu,
  monitorsMenu,
  networkingMenu,
  partsMenu,
  tabletsMenu,
} from '~/components/CollectionCircles';
import MobileAppPopup from '~/components/MobileAppPopup';

const cache = new Map();

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
  const cacheKey = 'homepage-data';
  const cacheTTL = 86400 * 1000; // 24 hours in milliseconds
  const now = Date.now();

  // Check if data is in cache
  const cachedData = cache.get(cacheKey);
  if (cachedData && cachedData.expiry > now) {
    const newArrivals = await fetchCollectionByHandle(
      args.context,
      'new-arrivals',
    );

    return defer(
      {
        ...cachedData.value,
        newArrivals, // Attach the fresh new-arrivals
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
        },
      },
    );
  }

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
    // {
    //   desktopImageUrl:
    //     'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-flip-fold-6.jpg?v=1727957859',
    //   mobileImageUrl:
    //     'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-flip-fold6.jpg?v=1727957858',
    //   link: '/collections/samsung-mobile-phones',
    // },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iphone-16-banner.jpg?v=1726322159',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iphone-16-Mobile.jpg?v=1726321600',
      link: '/collections/apple-iphone',
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
    // {
    //   desktopImageUrl:
    //     'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ipad-banner-2_a2c3f993-278f-48c1-82de-ac42ceb6f3fc.jpg?v=1716031887',
    //   mobileImageUrl:
    //     'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ipad_3a178a79-4428-4aac-b5bd-41ad3f04e33a.jpg?v=1716031354',
    //   link: '/collections/apple-ipad',
    // },
  ];

  const criticalData = await loadCriticalData(args);

  // Define all collection handles you want to display using TopProductSections
  const TOP_PRODUCT_HANDLES = [
    'new-arrivals',
    'apple-accessories',
    'apple-macbook',
    'apple-imac',
    'gaming-laptops',
    'gaming-desktops',
    'gaming-accessories',
    'console-games',
    'laptops',
    'computer-accessories',
    // 'microsoft-surface-accessories',
    // 'motherboards',
    // 'cpus',
    // 'cpu-coolers',
    // 'gpu',
    // 'wifi-routers',
    // 'wifi-range-extenders',
    // 'switches',
    'samsung-monitors',
    'msi-monitors',
    'dell-monitors',
    'apple-iphone',
    'samsung-mobile-phones',
    'mobile-accessories',
    'apple-ipad',
    'samsung-tablets',
    'kindle-tablets',
    'tablet-accessories',
    'earbuds',
    'headphones',
    'speakers',
    'computer-accessories',
    'electric-screwdrivers',
    'car-accessories',
    'fitness-bands',
    'garmin-smart-watch',
    'samsung-watches',
    'apple-watch',
    'action-cameras',
    'action-cameras-accessories',
    'cameras',
    // 'drones',
    'dyson-products',
    'kitchen-appliances',
    'cleaning-devices',
    'lighting',
  ];

  // Fetch all TopProductSections collections based on TOP_PRODUCT_HANDLES
  const fetchedTopProducts = await Promise.all(
    TOP_PRODUCT_HANDLES.map((handle) =>
      fetchCollectionByHandle(args.context, handle),
    ),
  );

  const newArrivals = await fetchCollectionByHandle(
    args.context,
    'new-arrivals',
  );

  // Organize TopProductSections collections into an object with keys corresponding to their handles
  const topProductsByHandle = {};
  TOP_PRODUCT_HANDLES.forEach((handle, index) => {
    topProductsByHandle[handle] = fetchedTopProducts[index];
  });

  const newData = {
    banners,
    title: criticalData.title,
    description: criticalData.description,
    url: criticalData.url,
    sliderCollections: criticalData.sliderCollections,
    topProducts: topProductsByHandle, // Add fetched TopProductSections collections here
  };

  // Cache the new data
  cache.set(cacheKey, {value: newData, expiry: now + cacheTTL});

  return defer(
    {
      ...newData,
      newArrivals, // This is always fresh
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    },
  );
}

export function shouldRevalidate({currentUrl, nextUrl}) {
  return currentUrl.pathname !== nextUrl.pathname;
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

// Fetch a single collection by handle
async function fetchCollectionByHandle(context, handle) {
  const {collectionByHandle} = await context.storefront.query(
    GET_COLLECTION_BY_HANDLE_QUERY,
    {variables: {handle}},
  );
  return collectionByHandle || null;
}

// REMOVED: The entire fetchMenuCollections function
// async function fetchMenuCollections(context, menuHandles) {
//   ...
// }

// Fetch collections by handles for sliders
async function fetchCollectionsByHandles(context, handles) {
  const collectionPromises = handles.map(async (handle) => {
    const {collectionByHandle} = await context.storefront.query(
      GET_SIMPLE_COLLECTION_QUERY,
      {variables: {handle}},
    );
    return collectionByHandle || null;
  });

  const collections = await Promise.all(collectionPromises);
  return collections.filter(Boolean);
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
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/benq.jpg?v=1733388855',
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

export default function Homepage() {
  const {banners, sliderCollections, topProducts, newArrivals} =
    useLoaderData();

  return (
    <div className="home">
      <MobileAppPopup />
      <BannerSlideshow banners={banners} />
      <CategorySlider sliderCollections={sliderCollections} />
      {newArrivals && <TopProductSections collection={newArrivals} />}

      <CollectionCircles collections={appleMenu} />
      {topProducts['apple-macbook'] && (
        <TopProductSections collection={topProducts['apple-macbook']} />
      )}
      {topProducts['apple-imac'] && (
        <TopProductSections collection={topProducts['apple-imac']} />
      )}
      {topProducts['apple-accessories'] && (
        <TopProductSections collection={topProducts['apple-accessories']} />
      )}

      <CollectionCircles collections={gamingMenu} />
      {topProducts['gaming-laptops'] && (
        <TopProductSections collection={topProducts['gaming-laptops']} />
      )}
      {topProducts['gaming-desktops'] && (
        <TopProductSections collection={topProducts['gaming-desktops']} />
      )}
      {topProducts['gaming-accessories'] && (
        <TopProductSections collection={topProducts['gaming-accessories']} />
      )}
      {topProducts['console-games'] && (
        <TopProductSections collection={topProducts['console-games']} />
      )}

      <CollectionCircles collections={laptopsMenu} />
      {topProducts['laptops'] && (
        <TopProductSections collection={topProducts['laptops']} />
      )}
      {topProducts['computer-accessories'] && (
        <TopProductSections collection={topProducts['computer-accessories']} />
      )}

      {/* <CollectionCircles collections={partsMenu} />
      {topProducts['motherboards'] && (
        <TopProductSections collection={topProducts['motherboards']} />
      )}
      {topProducts['cpus'] && (
        <TopProductSections collection={topProducts['cpus']} />
      )}
      {topProducts['cpu-coolers'] && (
        <TopProductSections collection={topProducts['cpu-coolers']} />
      )}
      {topProducts['gpu'] && (
        <TopProductSections collection={topProducts['gpu']} />
      )} */}

      {/* <CollectionCircles collections={networkingMenu} />
      {topProducts['wifi-routers'] && (
        <TopProductSections collection={topProducts['wifi-routers']} />
      )}
      {topProducts['wifi-range-extenders'] && (
        <TopProductSections collection={topProducts['wifi-range-extenders']} />
      )}
      {topProducts['switches'] && (
        <TopProductSections collection={topProducts['switches']} />
      )} */}

      <CollectionCircles collections={monitorsMenu} />
      {topProducts['samsung-monitors'] && (
        <TopProductSections collection={topProducts['samsung-monitors']} />
      )}
      {topProducts['msi-monitors'] && (
        <TopProductSections collection={topProducts['msi-monitors']} />
      )}
      {topProducts['dell-monitors'] && (
        <TopProductSections collection={topProducts['dell-monitors']} />
      )}

      <CollectionCircles collections={mobilesMenu} />
      {topProducts['apple-iphone'] && (
        <TopProductSections collection={topProducts['apple-iphone']} />
      )}
      {topProducts['samsung-mobile-phones'] && (
        <TopProductSections collection={topProducts['samsung-mobile-phones']} />
      )}
      {topProducts['mobile-accessories'] && (
        <TopProductSections collection={topProducts['mobile-accessories']} />
      )}

      <CollectionCircles collections={tabletsMenu} />
      {topProducts['apple-ipad'] && (
        <TopProductSections collection={topProducts['apple-ipad']} />
      )}
      {topProducts['samsung-tablets'] && (
        <TopProductSections collection={topProducts['samsung-tablets']} />
      )}
      {topProducts['kindle-tablets'] && (
        <TopProductSections collection={topProducts['kindle-tablets']} />
      )}
      {topProducts['tablet-accessories'] && (
        <TopProductSections collection={topProducts['tablet-accessories']} />
      )}

      <CollectionCircles collections={audioMenu} />
      {topProducts['headphones'] && (
        <TopProductSections collection={topProducts['headphones']} />
      )}
      {topProducts['earbuds'] && (
        <TopProductSections collection={topProducts['earbuds']} />
      )}
      {topProducts['speakers'] && (
        <TopProductSections collection={topProducts['speakers']} />
      )}

      {/* <CollectionCircles collections={accessoriesMenu} />
      {topProducts['computer-accessories'] && (
        <TopProductSections collection={topProducts['computer-accessories']} />
      )}
      {topProducts['electric-screwdrivers'] && (
        <TopProductSections collection={topProducts['electric-screwdrivers']} />
      )}
      {topProducts['car-accessories'] && (
        <TopProductSections collection={topProducts['car-accessories']} />
      )} */}

      <CollectionCircles collections={fitnessMenu} />
      {topProducts['apple-watch'] && (
        <TopProductSections collection={topProducts['apple-watch']} />
      )}
      {topProducts['garmin-smart-watch'] && (
        <TopProductSections collection={topProducts['garmin-smart-watch']} />
      )}
      {topProducts['samsung-watches'] && (
        <TopProductSections collection={topProducts['samsung-watches']} />
      )}
      {topProducts['fitness-bands'] && (
        <TopProductSections collection={topProducts['fitness-bands']} />
      )}

      <CollectionCircles collections={camerasMenu} />
      {topProducts['action-cameras'] && (
        <TopProductSections collection={topProducts['action-cameras']} />
      )}
      {topProducts['action-cameras-accessories'] && (
        <TopProductSections
          collection={topProducts['action-cameras-accessories']}
        />
      )}
      {topProducts['cameras'] && (
        <TopProductSections collection={topProducts['cameras']} />
      )}
      {/* {topProducts['drones'] && (
        <TopProductSections collection={topProducts['drones']} />
      )} */}

      <CollectionCircles collections={homeAppliancesMenu} />
      {topProducts['dyson-products'] && (
        <TopProductSections collection={topProducts['dyson-products']} />
      )}
      {topProducts['kitchen-appliances'] && (
        <TopProductSections collection={topProducts['kitchen-appliances']} />
      )}
      {topProducts['cleaning-devices'] && (
        <TopProductSections collection={topProducts['cleaning-devices']} />
      )}
      {topProducts['lighting'] && (
        <TopProductSections collection={topProducts['lighting']} />
      )}

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
          images(first: 4) {
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

export const GET_MENU_QUERY = `#graphql
  query GetMenu($handle: String!) {
    menu(handle: $handle) {
      items {
        id
        title
        url
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
