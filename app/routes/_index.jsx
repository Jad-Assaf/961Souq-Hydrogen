import React, { Suspense, lazy, startTransition } from 'react';
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

  return defer({
    banners,
    sliderCollections: criticalData.sliderCollections, // Sliders for menu sliders
    deferredData: {
      menuCollections: criticalData.menuCollections, // Rows below sliders
    },
  });
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

  // Fetch collections for menu items and sliders in bulk
  const [menuCollections, sliderCollections] = await Promise.all([
    fetchCollectionsGroupedByMenu(context, menuHandles),
    fetchCollectionsByHandles(context, menuHandles),
  ]);

  return {
    sliderCollections, // Slider data
    menuCollections, // Menu data grouped by collections
  };
}

// Fetch collections grouped by menu handles
async function fetchCollectionsGroupedByMenu(context, menuHandles) {
  const menuData = await fetchMenusByHandles(context, menuHandles);

  // Extract unique collection handles
  const collectionHandles = menuData
    .flatMap((menu) => menu.items.map((item) => item.title.toLowerCase().replace(/\s+/g, '-')))
    .filter(Boolean);

  // Fetch collections for those handles
  return await fetchCollectionsByHandles(context, collectionHandles);
}

// Fetch menus by handles in bulk
async function fetchMenusByHandles(context, handles) {
  const menuQueries = handles.map((handle) =>
    context.storefront.query(GET_MENU_QUERY, { variables: { handle } })
  );
  return await Promise.all(menuQueries);
}

// Fetch collections by a list of handles
async function fetchCollectionsByHandles(context, handles) {
  if (handles.length === 0) return [];

  const { collectionsByHandles } = await context.storefront.query(
    GET_COLLECTIONS_BY_HANDLES_QUERY,
    { variables: { handles } }
  );

  return collectionsByHandles || [];
}

const brandsData = [
  { name: "Apple", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-new.jpg?v=1733388855", link: "/collections/apple" },
  { name: "HP", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/hp-new.jpg?v=1733388855", link: "/collections/hp-products" },
  { name: "MSI", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/msi-new.jpg?v=1733388855", link: "/collections/msi-products" },
  { name: "Marshall", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/marshall-new.jpg?v=1733388855", link: "/collections/marshall-collection" },
  { name: "JBL", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/jbl-new.jpg?v=1733388856", link: "/collections/jbl-collection" },
  { name: "Dell", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/dell-new.jpg?v=1733388855", link: "/collections/dell-products" },
  { name: "Garmin", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/garmin-new.jpg?v=1733393801", link: "/collections/garmin-smart-watch" },
  { name: "Asus", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/asus-new.jpg?v=1733388855", link: "/collections/asus-products" },
  { name: "Samsung", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-new.jpg?v=1733388855", link: "/collections/samsung-products" },
  { name: "Sony", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/sony-new.jpg?v=1733389303", link: "/collections/sony" },
  { name: "Benq", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/benq.jpg?v=1733388855", link: "/collections/benq-products" },
  { name: "Tp-link", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/tp-link.jpg?v=1733388855", link: "/collections/tp-link-products" },
  { name: "Nothing", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/nothing-new.jpg?v=1733388855", link: "/collections/nothing-products" },
  { name: "Xiaomi", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/mi-new.jpg?v=1733388855", link: "/collections/xiaomi-products" },
  { name: "Microsoft", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/microsoft-new.jpg?v=1733388855", link: "/collections/microsoft-products" },
  { name: "Nintendo", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/nintendo-new.jpg?v=1733388855", link: "/collections/nintendo-products" },
  { name: "Lenovo", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lenovo-new.jpg?v=1733388855", link: "/collections/lenovo-products" },
  { name: "LG", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lg-new.jpg?v=1733388855", link: "/collections/lg-products" },
  { name: "Meta", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/meta-new.jpg?v=1733388855", link: "/collections/meta-products" },
  { name: "Ubiquiti", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ubiquiti-new.jpg?v=1733388855", link: "/collections/ubiquiti-products" },
  { name: "Philips", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Philips-new.jpg?v=1733388855", link: "/collections/philips-products" },
];

export default function Homepage() {
  const { banners, sliderCollections, deferredData } = useLoaderData();

  const menuCollections = deferredData?.menuCollections || [];

  const newArrivalsCollection = menuCollections
    .flat()
    .find((collection) => collection.handle === 'new-arrivals');

  return (
    <div className="home">
      {/* Critical components */}
      <BannerSlideshow banners={banners} />
      <CategorySlider sliderCollections={sliderCollections} />

      <div className="collections-container">
        {newArrivalsCollection && (
          <TopProductSections collection={newArrivalsCollection} />
        )}
      </div>

      <CollectionDisplay menuCollections={menuCollections} />

      <BrandSection brands={brandsData} />
    </div>
  );
}

const GET_COLLECTIONS_BY_HANDLES_QUERY = `#graphql
  query GetCollectionsByHandles($handles: [String!]!) {
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
      }
    }
  }
`;