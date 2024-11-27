import React, { useState } from 'react';
import { Image } from '@shopify/hydrogen-react';

export const CategorySlider = ({ categoryCollections }) => {
    const [activeParent, setActiveParent] = useState(null);

    const handleParentClick = (parentId) => {
        setActiveParent((prev) => (prev === parentId ? null : parentId));
    };

    return (
        <div className="category-slider">
            <h3 className="slider-title">Shop By Categories</h3>
            <div className="slider-container">
                {categoryCollections.map((parent) => (
                    <div key={parent.id} className="parent-collection">
                        <button
                            className="parent-button"
                            onClick={() => handleParentClick(parent.id)}
                        >
                            {parent.image && (
                                <Image
                                    src={parent.image.src}
                                    alt={parent.image.altText || parent.title}
                                    className="parent-image"
                                />
                            )}
                            <h4 className="parent-title">{parent.title}</h4>
                        </button>
                        {activeParent === parent.id && parent.items?.length > 0 && (
                            <div className="sub-collections">
                                {parent.items.map((child) => (
                                    <a
                                        key={child.id}
                                        href={child.url}
                                        className="sub-collection"
                                    >
                                        {child.image && (
                                            <Image
                                                src={child.image.src}
                                                alt={child.image.altText || child.title}
                                                className="sub-collection-image"
                                            />
                                        )}
                                        <p className="sub-collection-title">{child.title}</p>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
