import React, { useState } from "react";

export default function CategorySlider({ mainCollections, fetchSubCollections }) {
    const [subCollections, setSubCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);

    async function handleCollectionClick(handle) {
        const subCollectionsData = await fetchSubCollections(handle);
        setSelectedCollection(handle);
        setSubCollections(subCollectionsData);
    }

    return (
        <div className="category-slider">
            <h2>Categories</h2>
            <div className="slider-container">
                {mainCollections.map((collection) => (
                    <div
                        key={collection.id}
                        className="slider-item"
                        onClick={() => handleCollectionClick(collection.handle)}
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
                    <h3>Sub-Collections of {selectedCollection}</h3>
                    <div className="slider-container">
                        {subCollections.map((sub) => (
                            <div key={sub.id} className="slider-item">
                                <img src={sub.image?.src} alt={sub.image?.altText || sub.title} />
                                <p>{sub.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
