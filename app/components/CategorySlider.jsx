import React, { useState } from 'react';
import { Image } from '@shopify/hydrogen-react';

export const CategorySlider = ({ menu }) => {
    const [activeCollection, setActiveCollection] = useState(null);

    // Handles the click on a parent collection
    const handleCollectionClick = (collection) => {
        if (activeCollection?.id === collection.id) {
            setActiveCollection(null); // Collapse if already active
        } else {
            setActiveCollection(collection); // Set as active to show sub-collections
        }
    };

    return (
        <div className="category-slider">
            <h3 className="slider-title">Shop By Categories</h3>
            <div className="slider-container">
                {menu?.items?.map((collection) => (
                    <div key={collection.id} className="collection-card">
                        <button
                            className="collection-header"
                            onClick={() => handleCollectionClick(collection)}
                        >
                            {collection.image && (
                                <Image
                                    src={collection.image.src}
                                    alt={collection.image.altText || collection.title}
                                    className="collection-image"
                                />
                            )}
                            <h4 className="collection-title">{collection.title}</h4>
                        </button>
                        {/* Render sub-collections if this collection is active */}
                        {activeCollection?.id === collection.id && (
                            <div className="sub-collections">
                                {collection.items?.map((subCollection) => (
                                    <div key={subCollection.id} className="sub-collection-card">
                                        <a href={subCollection.url} className="sub-collection-link">
                                            {subCollection.image && (
                                                <Image
                                                    src={subCollection.image.src}
                                                    alt={subCollection.image.altText || subCollection.title}
                                                    className="sub-collection-image"
                                                />
                                            )}
                                            <p className="sub-collection-title">{subCollection.title}</p>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
