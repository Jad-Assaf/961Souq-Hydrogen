import React, { Suspense } from 'react';
import { defer } from '@shopify/remix-oxygen';
import { useLoaderData } from '@remix-run/react';

/**
 * Loader function to fetch data for CategorySlider
 */
export async function loader({ context }) {
    // Define the menu handle for top-level categories
    const menuHandle = 'categories-menu'; // Replace with your actual menu handle

    const criticalData = await loadCategoryData(context, menuHandle);
    return defer(criticalData);
}

// Fetch top-level categories and their images
async function loadCategoryData(context, menuHandle) {
    const { menu } = await context.storefront.query(GET_MENU_QUERY, {
        variables: { handle: menuHandle },
    });

    if (!menu) {
        throw new Response('Menu not found', { status: 404 });
    }

    // Extract collection handles from the menu
    const collectionHandles = menu.items.map((item) => item.title); // Adjust if necessary
    const collections = await fetchCollectionsByHandles(context, collectionHandles);

    return { collections, menu };
}

// Fetch collections by their handles
async function fetchCollectionsByHandles(context, handles) {
    const collections = [];
    for (const handle of handles) {
        const { collectionByHandle } = await context.storefront.query(
            GET_COLLECTION_BY_HANDLE_QUERY,
            { variables: { handle } },
        );
        if (collectionByHandle) {
            collections.push(collectionByHandle);
        }
    }
    return collections;
}

const GET_MENU_QUERY = `#graphql
  query GetMenu($handle: String!) {
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
    }
  }
`;

// Component to display categories in a slider
export default function CategorySlider() {
    const { collections } = useLoaderData();

    return (
        <div className="category-slider">
            <h2>Categories</h2>
            <div className="slider-container">
                {collections.map((collection) => (
                    <div key={collection.id} className="slider-item">
                        <img
                            src={collection.image?.url}
                            alt={collection.image?.altText || collection.title}
                        />
                        <p>{collection.title}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
