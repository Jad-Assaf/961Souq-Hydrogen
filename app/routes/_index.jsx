import { defer } from '@shopify/remix-oxygen';
import { useLoaderData } from '@remix-run/react';
import { Suspense } from 'react';
import { CollectionDisplay } from '../components/CollectionDisplay';
import { BannerSlideshow } from '../components/BannerSlideshow';
import BrandSection from '~/components/BrandsSection';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{ title: 'Hydrogen | Home' }];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader({ context }) {
  const menuHandle = 'new-main-menu';

  // Fetch critical data: Menu and banners
  const { menu } = await context.storefront.query(GET_MENU_QUERY, {
    variables: { handle: menuHandle },
  });

  if (!menu) {
    throw new Response('Menu not found', { status: 404 });
  }

  const banners = [
    { imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/google-pixel-banner.jpg?v=1728123476' },
    { imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Garmin.jpg?v=1726321601' },
    { imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/remarkable-pro-banner_25c8cc9c-14de-4556-9e8f-5388ebc1eb1d.jpg?v=1729676718' },
  ];

  // Defer non-critical data: collections and brands
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

  return defer({
    menu,
    banners,
    collections: fetchCollectionsByHandles(context, hardcodedHandles),
    brands: brandsData,
  });
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

const brandsData = [
  { name: "Apple", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple.png?v=1648112715", link: "/collections/apple" },
  { name: "HP", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/hp.png?v=1648112715", link: "/collections/hp-products" },
  // Add other brands...
];

export default function Homepage() {
  const { menu, banners, collections, brands } = useLoaderData();

  const images = [
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-products_29a11658-9601-44a9-b13a-9a52c10013be.jpg?v=1728311525',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/APPLE-IPHONE-16-wh.jpg?v=1728307748',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ps5-banner.jpg?v=1728289818',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ps-studios.jpg?v=1728486402',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/cmf-phone-1-banner-1.jpg?v=1727944715',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-s24.jpg?v=1732281967',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-watch-ultra.jpg?v=1732281967',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/garmin-banner.jpg?v=1727943839',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/jbl-eaubuds.jpg?v=1732284726',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/gaming-desktops.jpg?v=1732287092',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/gaming-monitors_6069e5a5-45c8-4ff2-8543-67de7c8ee0f4.jpg?v=1732287093',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lenses.jpg?v=1732289718',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/action.jpg?v=1732289718',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/govee-rgb.jpg?v=1732288379',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/dyson-vacuums.jpg?v=1732288379',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/streaming.jpg?v=1732289074',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/smart-home.jpg?v=1732289074',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
  ];

  return (
    <div className="home">
      <BannerSlideshow banners={banners} />
      <Suspense fallback={<div>Loading collections...</div>}>
        <CollectionsWithSuspense collections={collections} images={images} />
      </Suspense>
      <Suspense fallback={<div>Loading brands...</div>}>
        <BrandSection brands={brands} />
      </Suspense>
    </div>
  );
}

function CollectionsWithSuspense({ collections, images }) {
  const resolvedCollections = useLoaderData();

  return (
    <CollectionDisplay collections={resolvedCollections.collections} images={images} sliderCollections={[]} />
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
        }
      }
    }
  }
`;

const GET_MENU_QUERY = `#graphql
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