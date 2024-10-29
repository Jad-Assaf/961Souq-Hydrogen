// components/MenuCollectionDisplay.jsx
import { useEffect, useState } from 'react';
import '../styles/MenuCollectionDisplay.css'

export function MenuCollectionDisplay({ context }) {
    const [collections, setCollections] = useState([]);

    useEffect(() => {
        async function fetchMenuCollections() {
            try {
                const response = await context.storefront.query(GET_MENU_COLLECTIONS_QUERY, {
                    variables: { handle: 'new-main-menu' },
                });

                if (response?.menu?.items) {
                    const menuCollections = response.menu.items
                        .map((item) => item.resource)
                        .filter((resource) => resource?.__typename === 'Collection');
                    setCollections(menuCollections);
                }
            } catch (error) {
                console.error('Failed to fetch menu collections:', error);
            }
        }

        fetchMenuCollections();
    }, [context]);

    if (collections.length === 0) return null;

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Menu Collections</h3>
            <div className="category-slider">
                {collections.map((collection) => (
                    <div key={collection.id} className="category-container">
                        <img
                            src={collection.image?.url || 'https://via.placeholder.com/150'}
                            alt={collection.image?.altText || collection.title}
                            className="category-image"
                        />
                        <span className="category-title">{collection.title}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const GET_MENU_COLLECTIONS_QUERY = `#graphql
  query GetMenuCollections($handle: String!) {
    menu(handle: $handle) {
      items {
        id
        title
        url
        resource {
          __typename
          ... on Collection {
            id
            title
            handle
            image {
              url
              altText
            }
          }
        }
      }
    }
  }
`;
