import { defer } from '@shopify/remix-oxygen';
import { useLoaderData } from '@remix-run/react';
import { CollectionDisplay } from '../components/CollectionDisplay';
import { BannerSlideshow } from '../components/BannerSlideshow';

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
  const criticalData = await loadCriticalData(args);
  return defer({ ...criticalData });
}

/**
 * Load critical collections data by their handles.
 */
async function loadCriticalData({ context }) {
  const menuHandle = 'new-main-menu';
  const { menu } = await context.storefront.query(GET_MENU_QUERY, {
    variables: { handle: menuHandle },
  });

  if (!menu) {
    throw new Response('Menu not found', { status: 404 });
  }

  // Extract handles from the new-main-menu items for the slider.
  const menuHandles = menu.items.map((item) =>
    item.title.toLowerCase().replace(/\s+/g, '-')
  );

  // Hardcoded handles for product rows.
  const hardcodedHandles = [
    'new-arrivals', 'apple', 'gaming', 'gaming-laptops',
    'laptops', 'apple-iphone', 'samsung', 'monitors',
    'car-accessories', 'fitness watches', 'garmin-smart-watch',
    'apple-watch', 'samsung-watches', 'kitchen-appliances',
    'cleaning-devices'
  ];

  // Fetch collections for product rows.
  const collections = await fetchCollectionsByHandles(context, hardcodedHandles);

  if (collections.length === 0) {
    throw new Response('No matching collections found.', { status: 404 });
  }

  // Prepare header data
  const header = {
    menu,
    shop: { primaryDomain: { url: 'https://example.com' } }
  };

  return { collections, menuHandles, header };
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
  const { collections, menuHandles } = useLoaderData();

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
      <CollectionDisplay collections={collections} images={images} menuHandles={menuHandles} />
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
        }
      }
    }
  }
`;
