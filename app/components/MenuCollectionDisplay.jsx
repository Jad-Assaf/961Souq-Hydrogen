import { useLoaderData } from '@remix-run/react';
import { defer } from '@shopify/remix-oxygen';
import '../styles/MenuCollectionDisplay.css';

export async function loader({ context }) {
    const handles = ['apple-products', 'gaming-consoles', 'fitness-watches'];

    const { collections } = await context.storefront.query(GET_COLLECTION_IMAGES_QUERY, {
        variables: { handles },
    });

    const enrichedCollections = collections.edges.map(({ node }) => ({
        id: node.id,
        title: node.handle.replace('-', ' ').toUpperCase(),
        image: node.image || { url: 'https://via.placeholder.com/150', altText: 'Placeholder Image' },
    }));

    return defer({ enrichedCollections });
}

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

export function MenuCollectionDisplay() {
    const { enrichedCollections } = useLoaderData();

    if (!enrichedCollections || enrichedCollections.length === 0) {
        return <p>No collections available.</p>;
    }

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Menu Collections</h3>
            <div className="category-slider">
                {enrichedCollections.map((collection) => (
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
