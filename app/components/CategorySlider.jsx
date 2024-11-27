// src/components/CategorySlider.jsx

import { Link } from '@remix-run/react';
import React from 'react';

export default function CategorySlider({ collections }) {
    return (
        <div>
            {collections.map((collection) => (
                <CollectionTree key={collection.id} collection={collection} />
            ))}
        </div>
    );
}

// Recursive component to render collection trees
function CollectionTree({ collection }) {
    return (
        <div>
            <CollectionCard collection={collection} />
            {collection.subCollections && collection.subCollections.length > 0 && (
                <div style={{ marginLeft: '20px' }}>
                    {collection.subCollections.map((subCollection) => (
                        <CollectionTree key={subCollection.id} collection={subCollection} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Component to render individual collection cards
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
