import React from 'react';
import { Image } from '@shopify/hydrogen';
import '../styles/ResponsiveImageGrid.css';

/**
 * ResponsiveImageGrid Component
 * @param {{ images: Array<{ url: string, altText?: string }> }} props
 */
export function ResponsiveImageGrid({ images }) {
    if (!images || images.length === 0) {
        return <p>No images to display.</p>;
    }

    return (
        <div className="responsive-image-grid">
            {images.map((image, index) => (
                <div key={index} className="image-wrapper">
                    <Image
                        src={image.url}
                        alt={image.altText || `Image ${index + 1}`}
                        width="100%"
                        height="auto"
                    />
                </div>
            ))}
        </div>
    );
}
