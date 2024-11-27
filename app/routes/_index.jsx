import React, { Suspense } from 'react';
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

/**
 * Loader function to fetch necessary data
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

/**
 * Function to load critical data including menu and collections
 * @param {LoaderFunctionArgs} args
 */
async function loadCriticalData({ context }) {
  const menuHandle = 'new-main-menu';
  const { menu, collections } = await context.storefront.query(GET_MENU_WITH_COLLECTIONS_QUERY, {
    variables: { handle: menuHandle },
  });

  if (!menu) {
    throw new Response('Menu not found', { status: 404 });
  }

  // Extract handles from the menu items.
  const menuHandles = menu.items
    .map((item) => extractHandleFromUrl(item.url))
    .filter((handle) => handle); // Remove nulls

  // Fetch collections for the slider using menu handles.
  const sliderCollections = await fetchCollectionsByHandles(context, menuHandles);

  // Hardcoded handles for product rows.
  const hardcodedHandles = [
    'new-arrivals', 'laptops',
    'apple-macbook', 'apple-iphone', 'apple-accessories',
    'gaming-laptops', 'gaming-consoles', 'console-games',
    'samsung-mobile-phones', 'google-pixel-phones', 'mobile-accessories',
    'garmin-smart-watch', 'samsung-watches', 'fitness-bands',
    'earbuds', 'speakers', 'surround-systems',
    'desktops', 'pc-parts', 'business-monitors',
    'action-cameras', 'cameras', 'surveillance-cameras',
    'kitchen-appliances', 'cleaning-devices', 'lighting', 'streaming-devices', 'smart-devices', 'health-beauty'
  ];

  // Fetch collections for product rows.
  const collectionsData = await fetchCollectionsByHandles(context, hardcodedHandles);

  // Return menu along with other data
  return { collections: collectionsData, sliderCollections, menu };
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

/**
 * GraphQL Query to fetch Menu and Collections by Handles
 */
const GET_MENU_WITH_COLLECTIONS_QUERY = `#graphql
  query GetMenuWithCollections($handle: String!, $collectionHandles: [ID!]) {
    menu(handle: $handle) {
      id
      title
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
    nodes(ids: $collectionHandles) {
      ... on Collection {
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
  }
`;

/**
 * Helper function to extract collection handle from URL
 * @param {string} url
 * @returns {string|null}
 */
function extractHandleFromUrl(url) {
  const match = url.match(/\/collections\/([a-zA-Z0-9\-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Fetch multiple collections by their handles
 * @param {object} context
 * @param {string[]} handles
 * @returns {Promise<object[]>}
 */
async function fetchCollectionsByHandles(context, handles) {
  if (handles.length === 0) return [];

  // Convert handles to global IDs
  const collectionIds = handles.map((handle) => `gid://shopify/Collection/${handle}`);

  const { nodes } = await context.storefront.query(GET_MENU_WITH_COLLECTIONS_QUERY, {
    variables: {
      handle: 'new-main-menu', // This variable is required but already fetched
      collectionHandles: collectionIds,
    },
  });

  if (!nodes) return [];

  return nodes;
}

export default function Homepage() {
  const { banners, collections, sliderCollections, menu } = useLoaderData();

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

// const GET_COLLECTION_BY_HANDLE_QUERY = `#graphql
//   query GetCollectionByHandle($handle: String!) {
//     collectionByHandle(handle: $handle) {
//       id
//       title
//       handle
//       image {
//         url
//         altText
//       }
//       products(first: 15) {
//         nodes {
//           id
//           title
//           handle
//           priceRange {
//             minVariantPrice {
//               amount
//               currencyCode
//             }
//           }
//           compareAtPriceRange {
//             minVariantPrice {
//               amount
//               currencyCode
//             }
//           }
//           images(first: 1) {
//             nodes {
//               url
//               altText
//             }
//           }
//           variants(first: 5) {
//             nodes {
//               id
//               availableForSale
//               price {
//                 amount
//                 currencyCode
//               }
//               compareAtPrice {
//                 amount
//                 currencyCode
//               }
//               selectedOptions {
//                 name
//                 value
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// `;

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