import React, { useState } from 'react';
import '../styles/AnimatedImage.css'

export function AnimatedImage({ src, alt, className = '', ...props }) {
    const [loaded, setLoaded] = useState(false);

    return (
        <img
            src={src}
            alt={alt}
            className={`lazy-image ${loaded ? 'lazy-loaded' : ''} ${className}`}
            onLoad={() => setLoaded(true)}
            {...props}
        />
    );
}
