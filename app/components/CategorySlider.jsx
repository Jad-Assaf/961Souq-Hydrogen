import React, { useState } from 'react';
import '../styles/CollectionSlider.css'

export default function CategorySlider({ collections }) {
  const [subCollections, setSubCollections] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);

  async function fetchSubCollections(handle) {
    try {
      const response = await fetch(`/api/subcollections?handle=${handle}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sub-collections');
      }

      const collection = await response.json();
      setSelectedCollection({
        title: collection.title,
        image: collection.image,
      });

      const subCollectionsData = collection.products.nodes.map((product) => ({
        id: product.id,
        title: product.title,
        image: product.images[0]?.url,
        altText: product.images[0]?.altText || product.title,
      }));
      setSubCollections(subCollectionsData);
    } catch (error) {
      console.error('Error fetching sub-collections:', error);
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
            onClick={() => fetchSubCollections(collection.handle)}
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
