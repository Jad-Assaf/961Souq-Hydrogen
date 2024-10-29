import { useLoaderData } from '@remix-run/react';
import { defer } from '@shopify/remix-oxygen';
import '../styles/CollectionSlider.css';

/**
 * Loader function to fetch the collections
 */
export async function loader({ context }) {
    const handles = [
        'new-arrivals', 'apple', 'gaming', 'gaming-laptops',
        'laptops', 'mobiles', 'apple-iphone', 'samsung',
        'monitors', 'fitness watches'
    ];

    const collections = await fetchCollectionsByHandles(context, handles);
    return defer({ collections });
}

/**
 * Reuse the fetch function from the existing code
 */
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

/**
 * GraphQL query to fetch the collection by handle
 */
const GET_COLLECTION_BY_HANDLE_QUERY = `#graphql
  query GetCollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      title
      image {
        src
        altText
      }
    }
  }
`;

/**
 * CollectionSlider Component
 */
export default function CollectionSlider() {
    const { collections } = useLoaderData();

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Featured Categories</h3>
            <div className="category-slider">
                {collections.map((collection) => (
                    <div key={collection.id} className="category-container">
                        <img
                            src={collection.image?.src || 'https://via.placeholder.com/150'}
                            alt={collection.image?.altText || collection.title}
                            className="category-image"
                        />
                        <div className="category-title">{collection.title}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}