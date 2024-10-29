import { useEffect, useState } from 'react';
import '../styles/MenuCollectionDisplay.css';

const manualCollections = [
    { handle: 'apple-products', title: 'Apple Products' },
    { handle: 'gaming', title: 'Gaming' },
    { handle: 'fitness-watches', title: 'Fitness Watches' },
];

export function MenuCollectionDisplay({ context }) {
    const [collectionsWithImages, setCollectionsWithImages] = useState([]);

    useEffect(() => {
        async function fetchCollectionImages() {
            try {
                const { collections } = await context.storefront.query(
                    GET_COLLECTION_IMAGES_QUERY,
                    {
                        variables: { handles: manualCollections.map((c) => c.handle) },
                    }
                );

                const enrichedCollections = manualCollections.map((collection) => {
                    const fetchedCollection = collections.edges.find(
                        (edge) => edge.node.handle === collection.handle
                    );

                    return {
                        ...collection,
                        image: fetchedCollection?.node.image || {
                            url: 'https://via.placeholder.com/150',
                            altText: 'Placeholder Image',
                        },
                    };
                });

                setCollectionsWithImages(enrichedCollections);
            } catch (error) {
                console.error('Failed to fetch collection images:', error);
            }
        }

        fetchCollectionImages();
    }, [context]);

    if (collectionsWithImages.length === 0) {
        return <p>No collections available.</p>;
    }

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Menu Collections</h3>
            <div className="category-slider">
                {collectionsWithImages.map((collection) => (
                    <div key={collection.handle} className="category-container">
                        <img
                            src={collection.image.url}
                            alt={collection.image.altText}
                            className="category-image"
                        />
                        <span className="category-title">{collection.title}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const GET_COLLECTION_IMAGES_QUERY = `#graphql
  query GetCollectionImages($handles: [String!]) {
    collections(first: 10, query: $handles) {
      edges {
        node {
          handle
          image {
            url
            altText
          }
        }
      }
    }
  }
`;
