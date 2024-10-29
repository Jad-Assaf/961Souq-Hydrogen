// components/MenuCollectionDisplay.jsx
import { useEffect, useState } from 'react';
import '../styles/MenuCollectionDisplay.css'

export function MenuCollectionDisplay({ menu }) {
    if (!menu || menu.items.length === 0) return null;

    const collections = menu.items
        .map((item) => item.resource)
        .filter((resource) => resource?.__typename === 'Collection');

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Menu Collections</h3>
            <div className="category-slider">
                {collections.map((collection) => (
                    <div key={collection.id} className="category-container">
                        <img
                            src={collection.image?.url || 'https://via.placeholder.com/150'}
                            alt={collection.image?.altText || collection.title}
                            className="category-image"
                        />
                        <span className="category-title">{collection.title}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

