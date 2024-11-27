// src/components/CategorySlider.jsx

import React from 'react';
import { Link, useShop, Image } from '@shopify/hydrogen';

export default async function CategorySlider({ handles = [] }) {
    // Define the GraphQL query using #graphql without importing gql
    const query = `#graphql
    query GetCollections($handles: [String!]) {
      collections(first: 10, query: $handles) {
        edges {
          node {
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
  `;

    // Use the storefront client provided by Hydrogen
    const { storefront } = useShop();

    // Fetch data using storefront.query without specifying the access token
    const { data, errors } = await storefront.query(query, {
        variables: { handles },
    });

    if (errors) {
        return <div>Error loading collections: {errors[0].message}</div>;
    }

    const collections = data?.collections?.edges?.map((edge) => edge.node) || [];

    return (
        <div>
            {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
            ))}
        </div>
    );
}

// Define the CollectionCard component within the same file
function CollectionCard({ collection }) {
    const { handle, title, image } = collection;

    return (
        <div>
            <Link to={`/collections/${handle}`}>
                {image ? (
                    <img
                        src={image.url}
                        alt={image.altText || title}
                        width="300"
                        height="300"
                    />
                ) : (
                    <div>No image available</div>
                )}
                <h2>{title}</h2>
            </Link>
        </div>
    );
}
