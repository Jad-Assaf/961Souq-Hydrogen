import React, { useState } from 'react';

export default function CategorySlider({ categorySliderData }) {
    const { categoryCollections } = categorySliderData;
    const [subCollections, setSubCollections] = useState(null);
    const [selectedCollection, setSelectedCollection] = useState(null);

    async function fetchSubCollections(collectionHandle) {
        try {
            const response = await fetch(`/api/subcollections?handle=${collectionHandle}`);
            const data = await response.json();

            setSubCollections(data.subCollections);
            setSelectedCollection(data.collection);
        } catch (error) {
            console.error('Error fetching sub-collections:', error);
        }
    }

    return (
        <div className="category-slider">
            <h2>Categories</h2>
            <div className="slider-container">
                {categoryCollections.map((collection) => (
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
                    <div className="slider-container">
                        {subCollections.map((subCollection) => (
                            <div key={subCollection.id} className="slider-item">
                                <img
                                    src={subCollection.image?.url}
                                    alt={subCollection.image?.altText || subCollection.title}
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
