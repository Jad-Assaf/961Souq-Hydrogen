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
  const handles = ['apple', 'gaming'];
  const collections = await fetchCollectionsByHandles(context, handles);

  console.log('Filtered collections:', collections);

  if (collections.length === 0) {
    throw new Response('No matching collections found.', { status: 404 });
  }

  return { collections };
}

/**
 * Fetch multiple collections using `collectionByHandle`.
 */
async function fetchCollectionsByHandles(context, handles) {
  const collections = [];

  for (const handle of handles) {
    const variables = { handle };
    const { collectionByHandle } = await context.storefront.query(
      GET_COLLECTION_BY_HANDLE_QUERY,
      { variables }
    );

    if (collectionByHandle) {
      collections.push(collectionByHandle);
    }
  }

  return collections;
}

export default function Homepage() {
  const data = useLoaderData();

  const banners = [
    { imageUrl: 'https://961souq.com/cdn/shop/files/google-pixel-banner.jpg?v=1728123476&width=2000' },
    { imageUrl: 'https://961souq.com/cdn/shop/files/remarkable-pro-banner_25c8cc9c-14de-4556-9e8f-5388ebc1eb1d.jpg?v=1729676718&width=2000' },
    { imageUrl: 'https://961souq.com/cdn/shop/files/samsung-flip-fold-6.jpg?v=1727957859&width=2000' },
  ];

  return (
    <div className="home">
      <BannerSlideshow banners={banners} />
      <CollectionDisplay collections={data.collections} />
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
      products(first: 14) {
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

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
