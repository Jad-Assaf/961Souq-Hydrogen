// src/components/CategorySlider.jsx

import React from 'react';
import { Link } from '@shopify/hydrogen';

export default async function CategorySlider({ handles = [] }, { storefront }) {
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

    // Fetch data using the storefront.query function
    const { data, errors } = await storefront.query(query, {
        variables: { handles },
    });

    if (errors && errors.length > 0) {
        return <div>Error loading collections: {errors[0].message}</div>;
    }

    const collections =
        data?.collections?.edges?.map((edge) => edge.node) || [];

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
