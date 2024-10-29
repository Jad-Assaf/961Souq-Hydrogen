import { defer } from '@shopify/remix-oxygen';
import { useLoaderData } from '@remix-run/react';
import { CollectionDisplay } from '../components/CollectionDisplay';
import { BannerSlideshow } from '../components/BannerSlideshow';
import CollectionSlider from '~/components/CollectionSlider';

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
  if (!context || !context.storefront) {
    console.error("Context or storefront missing!");
    throw new Response("Context is not properly initialized.", { status: 500 });
  }

  const criticalData = await loadCriticalData({ context });
  return defer({ ...criticalData, context });
}


/**
 * Load critical collections data by their handles.
 */
async function loadCriticalData({ context }) {
  const handles = [
    'new-arrivals', 'apple', 'gaming', 'gaming-laptops',
    'laptops', 'mobiles', 'apple-iphone', 'samsung',
    'monitors', 'fitness watches'
  ];
  const collections = await fetchCollectionsByHandles(context, handles);

  if (collections.length === 0) {
    throw new Response('No matching collections found.', { status: 404 });
  }

  const menuHandle = 'new-main-menu';
  const { menu } = await context.storefront.query(GET_MENU_QUERY, {
    variables: { handle: menuHandle },
  });

  if (!menu) {
    throw new Response('Menu not found', { status: 404 });
  }

  const header = { menu, shop: { primaryDomain: { url: 'https://example.com' } } };

  return { collections, header };
}

/**
 * Fetch multiple collections using `collectionByHandle`.
 */
async function fetchCollectionsByHandles(context, handles) {
  const collections = [];
  for (const handle of handles) {
    const { collectionByHandle } = await context.storefront.query(
      GET_COLLECTION_BY_HANDLE_QUERY,
      { variables: { handle } }
    );

    if (collectionByHandle) {
      collections.push(collectionByHandle);
    }
  }
  return collections;
}

export default function Homepage() {
  const loaderData = useLoaderData(); // Destructure later to avoid TypeErrors
  const { collections, context } = loaderData;

  if (!context || !context.storefront) {
    console.error("Context or storefront missing in Homepage!");
    return <div>Error loading context or collections.</div>;
  }
  
  const banners = [
    { imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/google-pixel-banner.jpg?v=1728123476' },
    { imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Garmin.jpg?v=1726321601' },
    { imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/remarkable-pro-banner_25c8cc9c-14de-4556-9e8f-5388ebc1eb1d.jpg?v=1729676718' },
  ];

  const images = [
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-products_29a11658-9601-44a9-b13a-9a52c10013be.jpg?v=1728311525',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/APPLE-IPHONE-16-wh.jpg?v=1728307748',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ps5-banner.jpg?v=1728289818',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ps-studios.jpg?v=1728486402',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/cmf-phone-1-banner-1.jpg?v=1727944715',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/cmf-watch-pro-2_2d876c17-c2e4-4e15-9a6f-731e5e85049b.jpg?v=1728297311',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/garmin-banner.jpg?v=1727943839',
  ];

  return (
    <div className="home">
      <BannerSlideshow banners={banners} />
      <CollectionSlider context={context} />
      <CollectionDisplay collections={collections} images={images} />
    </div>
  );
}

/**
 * GraphQL query to fetch a single collection by handle.
 */
const GET_COLLECTION_BY_HANDLE_QUERY = `#graphql
  query GetCollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      title
      handle
      products(first: 30) {
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

/**
 * GraphQL query to fetch the menu by handle.
 */
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

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
