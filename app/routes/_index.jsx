import { defer } from '@shopify/remix-oxygen';
import { Await, useLoaderData, Link } from '@remix-run/react';
import { Suspense } from 'react';
import { CollectionDisplay } from '../components/CollectionDisplay';
import { Image, Money } from '@shopify/hydrogen';

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
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return defer({ ...deferredData, ...criticalData });
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
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
