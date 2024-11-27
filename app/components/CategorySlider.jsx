// src/components/CategorySlider.jsx

import React from 'react';
import { Link } from '@shopify/hydrogen';

export default function CategorySlider({ collections }) {
    return (
        <div>
            {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
            ))}
        </div>
    );
}

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
