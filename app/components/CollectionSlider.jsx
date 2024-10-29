import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { defer } from '@shopify/remix-oxygen';

// Loader function exported for both route and component use
export async function fetchCollectionsLoader({ context }) {
    const handles = [
        'apple', 'gaming', 'gaming-laptops',
        'laptops', 'mobiles', 'samsung', 'monitors'
    ];

    const collections = await getCollectionsByHandle(context, handles);
    return defer({ collections });
}

// Helper function to fetch collections by handle
async function getCollectionsByHandle(context, handles) {
    const collections = [];
    for (const handle of handles) {
        const { collectionByHandle } = await context.storefront.query(
            FETCH_COLLECTION_QUERY,
            { variables: { handle } }
        );
        if (collectionByHandle) collections.push(collectionByHandle);
    }
    return collections;
}

// GraphQL query to fetch collections by handle
const FETCH_COLLECTION_QUERY = `#graphql
  query FetchCollection($handle: String!) {
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

// Component definition
export default function CollectionSlider({ context }) {
    const [collections, setCollections] = useState([]);

    // Fetch data with useEffect when the component mounts
    useEffect(() => {
        async function fetchData() {
            const data = await fetchCollectionsLoader({ context });
            setCollections(data.collections);
        }
        fetchData();
    }, [context]); // Run only when context changes

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Shop By Categories</h3>
            <div className="category-slider">
                {collections.length > 0 ? (
                    collections.map((collection) => (
                        <Link
                            key={collection.id}
                            to={`/collections/${collection.handle}`}
                            className="category-container"
                        >
                            <img
                                srcSet={collection.image?.url}
                                alt={collection.image?.altText || collection.title}
                                className="category-image"
                                loading="lazy"
                                width="175"
                                height="175"
                            />
                            <div className="category-title">{collection.title}</div>
                        </Link>
                    ))
                ) : (
                    <div>No collections found.</div>
                )}
            </div>
        </div>
    );
}
