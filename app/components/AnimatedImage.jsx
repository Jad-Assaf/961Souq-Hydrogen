import React, { useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import './AnimatedImage.css';

export function AnimatedImage({ src, alt, width, height, placeholder, ...props }) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div
            className="image-wrapper"
            style={{ width, height, position: 'relative' }}
        >
            {/* Placeholder until image loads */}
            {!isLoaded && (
                <div className="image-placeholder" style={{ width, height }}></div>
            )}

            <LazyLoadImage
                src={src}
                alt={alt}
                effect="blur" // Smooth blur effect
                afterLoad={() => setIsLoaded(true)} // Ensure proper state handling on load
                width={width}
                height={height}
                style={{
                    opacity: isLoaded ? 1 : 0,
                    transition: 'opacity 0.5s ease-in-out',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}
                {...props}
            />
        </div>
    );
}
