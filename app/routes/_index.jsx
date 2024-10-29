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

async function loadCriticalData({ context }) {
  const menuHandle = 'new-main-menu';
  const { menu } = await context.storefront.query(GET_MENU_QUERY, {
    variables: { handle: menuHandle },
  });

  if (!menu) {
    throw new Response('Menu not found', { status: 404 });
  }

  // Extract handles from the menu items.
  const menuHandles = menu.items.map((item) =>
    item.title.toLowerCase().replace(/\s+/g, '-')
  );

  // Fetch collections for the slider using menu handles.
  const sliderCollections = await fetchCollectionsByHandles(context, menuHandles);

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

  return { collections, sliderCollections };
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

export default function Homepage() {
  const { collections, sliderCollections } = useLoaderData();

  const banners = [
    { imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/google-pixel-banner.jpg?v=1728123476' },
    { imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Garmin.jpg?v=1726321601' },
    { imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/remarkable-pro-banner_25c8cc9c-14de-4556-9e8f-5388ebc1eb1d.jpg?v=1729676718' },
  ];

  return (
    <div className="home">
      <BannerSlideshow banners={banners} />
      <CollectionDisplay collections={collections} sliderCollections={sliderCollections} />
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
