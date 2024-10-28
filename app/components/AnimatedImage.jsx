import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

export function AnimatedImage({ src, alt, placeholder, ...props }) {
    return (
        <LazyLoadImage
            src={src}
            alt={alt}
            placeholderSrc={placeholder}
            effect="blur" // You can also try 'opacity' effect
            width="100%"
            height="auto"
            {...props}
        />
    );
}
