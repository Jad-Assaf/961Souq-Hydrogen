import { useEffect, useState } from 'react';
import '../styles/MenuCollectionDisplay.css';

/**
 * Component to fetch and display collections with images.
 */
export function MenuCollectionDisplay({ context }) {
    const [collections, setCollections] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchCollections() {
            try {
                const handles = ['apple-products', 'gaming-consoles', 'fitness-watches'];

                const { collections } = await context.storefront.query(
                    GET_COLLECTION_IMAGES_QUERY,
                    { variables: { handles } }
                );

                const formattedCollections = collections.edges.map(({ node }) => ({
                    id: node.id,
                    title: node.handle.replace('-', ' ').toUpperCase(),
                    image: node.image || {
                        url: 'https://via.placeholder.com/150',
                        altText: 'Placeholder Image'
                    },
                }));

                setCollections(formattedCollections);
            } catch (err) {
                console.error('Failed to fetch collections:', err);
                setError('Could not load collections.');
            }
        }

        fetchCollections();
    }, [context]);

    if (error) return <p>{error}</p>;
    if (collections.length === 0) return <p>Loading collections...</p>;

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Featured Collections</h3>
            <div className="category-slider">
                {collections.map((collection) => (
                    <div key={collection.id} className="category-container">
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

/**
 * GraphQL query to fetch collections by handle.
 */
const GET_COLLECTION_IMAGES_QUERY = `#graphql
  query GetCollectionImages($handles: [String!]) {
    collections(first: 10, query: $handles) {
      edges {
        node {
          id
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
