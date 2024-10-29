import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Helper function to fetch collections (now local to this component)
async function fetchCollections(context, handles) {
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

// GraphQL query to fetch collection by handle
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

export default function CollectionSlider({ context }) {
    const [collections, setCollections] = useState([]);

    useEffect(() => {
        if (!context || !context.storefront) {
            console.error("Context or storefront missing in CollectionSlider!");
            return; // Exit early if context is missing
        }

        async function loadCollections() {
            try {
                const handles = ['apple', 'gaming', 'laptops'];
                const data = await fetchCollections(context, handles);
                setCollections(data);
            } catch (error) {
                console.error("Error fetching collections:", error);
            }
        }

        loadCollections();
    }, [context]);

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
                                src={collection.image?.url}
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
