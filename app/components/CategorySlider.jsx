import React, { useState } from 'react';
import { useLoaderData } from '@remix-run/react';
import '../styles/CollectionSlider.css'
/**
 * Component to display categories in a slider, with sub-collections loading on click.
 */
export default function CategorySlider() {
    const { collections } = useLoaderData();
    const [subCollections, setSubCollections] = useState(null);
    const [selectedCollection, setSelectedCollection] = useState(null);

    const GET_SUB_COLLECTIONS_QUERY = `#graphql
      query GetSubCollections($handle: String!) {
        collectionByHandle(handle: $handle) {
          id
          title
          handle
          image {
            url
            altText
          }
          products(first: 10) {
            nodes {
              id
              title
              handle
              images(first: 1) {
                nodes {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    `;

    async function fetchSubCollections(context, collectionHandle) {
        const { collectionByHandle } = await context.storefront.query(
            GET_SUB_COLLECTIONS_QUERY,
            { variables: { handle: collectionHandle } },
        );

        if (collectionByHandle) {
            // Extract both the collection image and the associated products
            const subCollectionsData = collectionByHandle.products.nodes.map((product) => ({
                id: product.id,
                title: product.title,
                handle: product.handle,
                image: product.images[0]?.url,
                altText: product.images[0]?.altText || product.title,
            }));
            setSubCollections(subCollectionsData);
            setSelectedCollection({
                title: collectionByHandle.title,
                image: collectionByHandle.image,
            });
        }
    }

    return (
        <div className="category-slider">
            <h2>Categories</h2>
            <div className="slider-container">
                {collections.map((collection) => (
                    <div
                        key={collection.id}
                        className="slider-item"
                        onClick={() => fetchSubCollections(context, collection.handle)}
                    >
                        <img
                            src={collection.image?.url}
                            alt={collection.image?.altText || collection.title}
                        />
                        <p>{collection.title}</p>
                    </div>
                ))}
            </div>

            {subCollections && (
                <div className="sub-collections">
                    <h3>Sub-Collections of {selectedCollection.title}</h3>
                    {selectedCollection.image && (
                        <img
                            className="selected-collection-image"
                            src={selectedCollection.image.url}
                            alt={selectedCollection.image.altText || selectedCollection.title}
                        />
                    )}
                    <div className="slider-container">
                        {subCollections.map((subCollection) => (
                            <div key={subCollection.id} className="slider-item">
                                <img
                                    src={subCollection.image}
                                    alt={subCollection.altText || subCollection.title}
                                />
                                <p>{subCollection.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
