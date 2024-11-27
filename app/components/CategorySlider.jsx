import React, { useState } from 'react';

export default function CategorySlider({ collections, fetchSubCollections }) {
    const [subCollections, setSubCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);

    async function handleFetchSubCollections(handle) {
        try {
            const subCollectionsData = await fetchSubCollections(handle);
            setSubCollections(subCollectionsData);
            setSelectedCollection(
                collections.find((collection) => collection.handle === handle)
            );
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
                        onClick={() => handleFetchSubCollections([collection.handle])}
                    >
                        <img
                            src={collection.image?.src}
                            alt={collection.image?.altText || collection.title}
                        />
                        <p>{collection.title}</p>
                    </div>
                ))}
            </div>

            {subCollections.length > 0 && (
                <div className="sub-collections">
                    <h3>Sub-Collections of {selectedCollection.title}</h3>
                    <div className="slider-container">
                        {subCollections.map((subCollection) => (
                            <div key={subCollection.id} className="slider-item">
                                <img
                                    src={subCollection.image?.src}
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
