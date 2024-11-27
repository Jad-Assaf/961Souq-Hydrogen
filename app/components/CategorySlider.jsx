// src/components/CategorySlider.jsx

import { Link } from '@remix-run/react';
import React from 'react';

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
