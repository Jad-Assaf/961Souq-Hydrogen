import React, { Suspense, lazy } from 'react';
import { defer } from '@shopify/remix-oxygen';
import { useLoaderData } from '@remix-run/react';
import { BannerSlideshow } from '../components/BannerSlideshow';
import { CategorySlider } from '~/components/CollectionSlider';
import { TopProductSections } from '~/components/TopProductSections';
import { CollectionDisplay } from '~/components/CollectionDisplay';
import { BrandSection } from '~/components/BrandsSection';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{ title: 'Hydrogen | Home' }];
};
const GET_COLLECTIONS_WITH_SUBCOLLECTIONS_QUERY = `#graphql
  query GetCollectionsWithSubcollections($handles: [String!]!) {
    collectionsByHandles(handles: $handles) {
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
          images(first: 1) {
            nodes {
              url
              altText
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

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

  const criticalData = await loadCriticalData(args);
  return defer({ ...criticalData, banners });
}

async function loadCriticalData({ context }) {
  const menuHandle = 'new-main-menu';
  const { menu } = await context.storefront.query(GET_MENU_QUERY, {
    variables: { handle: menuHandle },
  });

  if (!menu) {
    throw new Response('Menu not found', { status: 404 });
  }

  // Extract handles from menu items
  const menuHandles = menu.items.map((item) =>
    item.title.toLowerCase().replace(/\s+/g, '-')
  );

  // Fetch collections and subcollections for the slider
  const sliderCollections = await fetchCollectionsWithSubcollections(context, menuHandles);

  // Fetch product collections using hardcoded handles
  const hardcodedHandles = [
    'new-arrivals', 'laptops',
    'apple-macbook', 'apple-iphone', 'apple-accessories',
    'gaming-laptops', 'gaming-consoles', 'console-games',
    'samsung-mobile-phones', 'google-pixel-phones', 'mobile-accessories',
    'garmin-smart-watch', 'samsung-watches', 'fitness-bands',
    'earbuds', 'speakers', 'surround-systems',
    'desktops', 'pc-parts', 'business-monitors',
    'action-cameras', 'cameras', 'surveillance-cameras',
    'kitchen-appliances', 'cleaning-devices', 'lighting', 'streaming-devices', 'smart-devices', 'health-beauty',
  ];

  const collections = await fetchCollectionsByHandles(context, hardcodedHandles);

  return { collections, sliderCollections, menu };
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

async function fetchCollectionsWithSubcollections(context, handles) {
  if (!handles || handles.length === 0) return [];

  const { collectionsByHandles } = await context.storefront.query(
    GET_COLLECTIONS_WITH_SUBCOLLECTIONS_QUERY,
    { variables: { handles } }
  );
  return collectionsByHandles || [];
}

const brandsData = [
  { name: "Apple", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple.png?v=1648112715", link: "/collections/apple" },
  { name: "HP", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/hp.png?v=1648112715", link: "/collections/hp-products" },
  { name: "MSI", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/msi-logo.jpg?v=1712761894", link: "/collections/msi-products" },
  { name: "Marshall", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/marshall-logo.jpg?v=1683620097", link: "/collections/marshall-collection" },
  { name: "JBL", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/jbl-logo_08932e54-a973-4e07-b192-b8ea378744a4.jpg?v=1683619917", link: "/collections/jbl-collection" },
  { name: "Dell", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/dell.png?v=1648112715", link: "/collections/dell-products" },
  { name: "Garmin", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/garmin-logo.jpg?v=1712761787", link: "/collections/garmin-smart-watch" },
  { name: "Asus", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/asus-logo.jpg?v=1712761801", link: "/collections/asus-products" },
  { name: "Samsung", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-Logo.jpg?v=1712761812", link: "/collections/samsung-products" },
  { name: "Sony", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/sony-logo.jpg?v=1712761825", link: "/collections/sony" },
  { name: "Benq", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/benq-logo.jpg?v=1712762620", link: "/collections/benq-products" },
  { name: "Tp-link", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/tp-link-logo.jpg?v=1712761852", link: "/collections/tp-link-products" },
  { name: "Nothing", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/nothing-logo.jpg?v=1712761865", link: "/collections/nothing-products" },
  { name: "Xiaomi", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/xiaomi-logo.jpg?v=1712761880", link: "/collections/xiaomi-products" },
  { name: "Microsoft", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/microsoft-logo.jpg?v=1712762506", link: "/collections/microsoft-products" },
  { name: "Nintendo", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/nintendo-logo.jpg?v=1712762532", link: "/collections/nintendo-products" },
  { name: "Lenovo", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lenovo-logo.jpg?v=1712762549", link: "/collections/lenovo-products" },
  { name: "LG", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lg-logo.jpg?v=1712762606", link: "/collections/lg-products" },
  { name: "Meta", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/meta-logo.jpg?v=1712762516", link: "/collections/meta-products" },
  { name: "Ubiquiti", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ubuquiti-logo.jpg?v=1712761841", link: "/collections/ubiquiti-products" },
  { name: "Philips", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/philips-logo.jpg?v=1712762630", link: "/collections/philips-products" },
];

export default function Homepage() {
  const { banners, collections, sliderCollections, menu } = useLoaderData();

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
      <CategorySlider menu={menu} sliderCollections={sliderCollections} /> {/* Pass sliderCollections */}
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