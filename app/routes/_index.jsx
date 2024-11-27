import React, { Suspense } from 'react';
import { defer } from '@shopify/remix-oxygen';
import { useLoaderData } from '@remix-run/react';
import { BannerSlideshow } from '../components/BannerSlideshow';
import { TopProductSections } from '~/components/TopProductSections';
import { CollectionDisplay } from '~/components/CollectionDisplay';
import { BrandSection } from '~/components/BrandsSection';
import CategorySlider from '~/components/CategorySlider';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{ title: 'Hydrogen | Home' }];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  const banners = [
    {
      imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/google-pixel-banner.jpg?v=1728123476',
      link: '/collections/google-pixel',
    },
    {
      imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Garmin.jpg?v=1726321601',
      link: '/collections/garmin',
    },
    {
      imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/remarkable-pro-banner_25c8cc9c-14de-4556-9e8f-5388ebc1eb1d.jpg?v=1729676718',
      link: '/collections/remarkable',
    },
  ];

  // Fetch data in parallel
  const [criticalData, categorySliderData] = await Promise.all([
    loadCriticalData(args),
    loadCategorySliderData(args),
  ]);

  return defer({
    ...criticalData,
    banners,
    categorySliderData,
  });
}

// Load main page data
async function loadCriticalData({ context }) {
  const menuHandle = 'new-main-menu';
  const { menu } = await context.storefront.query(GET_MENU_QUERY, {
    variables: { handle: menuHandle },
  });

  if (!menu) {
    throw new Response('Menu not found', { status: 404 });
  }

  const hardcodedHandles = [
    'new-arrivals', 'laptops', 'apple-macbook', 'apple-iphone', 'apple-accessories',
    'gaming-laptops', 'gaming-consoles', 'console-games', 'samsung-mobile-phones',
    'google-pixel-phones', 'mobile-accessories', 'garmin-smart-watch', 'samsung-watches',
    'fitness-bands', 'earbuds', 'speakers', 'surround-systems', 'desktops', 'pc-parts',
    'business-monitors', 'action-cameras', 'cameras', 'surveillance-cameras',
    'kitchen-appliances', 'cleaning-devices', 'lighting', 'streaming-devices',
    'smart-devices', 'health-beauty',
  ];

  const collections = await fetchCollectionsByHandles(context, hardcodedHandles);
  return { collections, menu };
}

// Load data specifically for CategorySlider
async function loadCategorySliderData({ context }) {
  const categoryMenuHandle = 'categories-menu';
  const { menu } = await context.storefront.query(CATEGORY_SLIDER_MENU_QUERY, {
    variables: { handle: categoryMenuHandle },
  });

  if (!menu) {
    throw new Response('Category menu not found', { status: 404 });
  }

  const categoryHandles = menu.items.map((item) => item.title);
  const categoryCollections = await fetchCategoryCollections(context, categoryHandles);

  return { categoryCollections, categoryMenu: menu };
}

// Fetch collections for CategorySlider
async function fetchCategoryCollections(context, handles) {
  const collections = [];
  for (const handle of handles) {
    const { collectionByHandle } = await context.storefront.query(
      CATEGORY_SLIDER_COLLECTION_QUERY,
      { variables: { handle } },
    );
    if (collectionByHandle) {
      collections.push(collectionByHandle);
    }
  }
  return collections;
}

async function fetchCollectionsByHandles(context, handles) {
  const collections = [];
  for (const handle of handles) {
    const { collectionByHandle } = await context.storefront.query(
      GET_COLLECTION_BY_HANDLE_QUERY,
      { variables: { handle } }
    );
    if (collectionByHandle) collections.push(collectionByHandle);
  }
  return collections;
}

// CategorySlider-specific GraphQL queries
const CATEGORY_SLIDER_MENU_QUERY = `#graphql
  query GetCategorySliderMenu($handle: String!) {
    menu(handle: $handle) {
      items {
        title
        url
        id
        resourceId
        items {
          title
          url
          id
        }
      }
    }
  }
`;

const CATEGORY_SLIDER_COLLECTION_QUERY = `#graphql
  query GetCategorySliderCollection($handle: String!) {
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

export default function Homepage() {
  const { banners, collections, menu, categorySliderData } = useLoaderData();

  const images = [
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-products_29a11658-9601-44a9-b13a-9a52c10013be.jpg?v=1728311525',
      link: '/collections/apple', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/APPLE-IPHONE-16-wh.jpg?v=1728307748',
      link: '/collections/apple-iphone', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ps5-banner.jpg?v=1728289818',
      link: '/collections/sony-playstation', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ps-studios.jpg?v=1728486402',
      link: '/collections/console-games', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/cmf-phone-1-banner-1.jpg?v=1727944715',
      link: '/collections/nothing-phones', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-s24.jpg?v=1732281967',
      link: '/collections/samsung-mobile-phones', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-watch-ultra.jpg?v=1732281967',
      link: '/products/samsung-galaxy-watch-ultra', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/garmin-banner.jpg?v=1727943839',
      link: '/collections/garmin-smart-watch', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/jbl-eaubuds.jpg?v=1732284726',
      link: '/collections/earbuds', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
      link: '/collections/gaming-speakers', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/gaming-desktops.jpg?v=1732287092',
      link: '/collections/gaming-desktops', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/gaming-monitors_6069e5a5-45c8-4ff2-8543-67de7c8ee0f4.jpg?v=1732287093',
      link: '/collections/gaming-monitors', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lenses.jpg?v=1732289718',
      link: '/collections/camera-lenses', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/action.jpg?v=1732289718',
      link: '/collections/action-cameras', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/govee-rgb.jpg?v=1732288379',
      link: '/collections/lighting', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/dyson-vacuums.jpg?v=1732288379',
      link: '/collections/vacuum-cleaners', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/streaming.jpg?v=1732289074',
      link: '/collections/streaming-devices', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/smart-home.jpg?v=1732289074',
      link: '/collections/smart-devices', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-products_29a11658-9601-44a9-b13a-9a52c10013be.jpg?v=1728311525',
      link: '/collections/apple-products', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/APPLE-IPHONE-16-wh.jpg?v=1728307748',
      link: '/collections/apple-iphone', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ps5-banner.jpg?v=1728289818',
      link: '/collections/playstation', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-products_29a11658-9601-44a9-b13a-9a52c10013be.jpg?v=1728311525',
      link: '/collections/apple-products', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/APPLE-IPHONE-16-wh.jpg?v=1728307748',
      link: '/collections/apple-iphone', // Add link
    },
    {
      src: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ps5-banner.jpg?v=1728289818',
      link: '/collections/playstation', // Add link
    },
    
  ];

  const newArrivalsCollection = collections.find((collection) => collection.handle === "new-arrivals");

  return (
    <div className="home">
      <BannerSlideshow banners={banners} />
      <Suspense fallback={<div>Loading category slider...</div>}>
        <CategorySlider categorySliderData={categorySliderData} />
      </Suspense>
      <div className="collections-container">
        <>
          {/* Render "New Arrivals" and "Laptops" rows at the start */}
          {newArrivalsCollection && <TopProductSections collection={newArrivalsCollection} />}
        </>
      </div>
      {/* Defer these sections */}
      <Suspense fallback={<div>Loading collections...</div>}>
        <DeferredCollectionDisplay collections={collections} images={images} />
      </Suspense>

      <Suspense fallback={<div>Loading brands...</div>}>
        <DeferredBrandSection brands={brandsData} />
      </Suspense>
    </div>
  );
}

// Create deferred versions of components
function DeferredCollectionDisplay({ collections, images }) {
  return <CollectionDisplay collections={collections} images={images} />;
}

function DeferredBrandSection({ brands }) {
  return <BrandSection brands={brands} />;
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
      products(first: 15) {
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
          images(first: 1) {
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
        items {
          id
          title
          url
          items {
            id
            title
            url
          }
        }
      }
    }
  }
`;