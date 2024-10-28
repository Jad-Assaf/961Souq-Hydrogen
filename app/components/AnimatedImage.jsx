import React, { useState, useEffect, useRef } from 'react';

export function AnimatedImage({ src, alt, className = '', ...props }) {
    const [loaded, setLoaded] = useState(false);
    const imgRef = useRef(null);

    // Use IntersectionObserver to load the image only when it appears in the viewport
    useEffect(() => {
        const imgElement = imgRef.current;

        const onImageLoad = () => {
            setLoaded(true);
        };

        // If the image is already cached, trigger the load immediately
        if (imgElement.complete) {
            onImageLoad();
        } else {
            imgElement.addEventListener('load', onImageLoad);
            imgElement.addEventListener('error', () => setLoaded(true)); // Handle errors gracefully
        }

        // Lazy load using IntersectionObserver
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    imgElement.src = src; // Start loading the image
                    observer.unobserve(imgElement);
                }
            },
            { threshold: 0.1 } // Trigger loading when 10% of the image is visible
        );

        observer.observe(imgElement);

        return () => {
            imgElement.removeEventListener('load', onImageLoad);
            observer.disconnect();
        };
    }, [src]);

    return (
        <img
            ref={imgRef}
            className={`lazy-image ${loaded ? 'lazy-loaded' : ''} ${className}`}
            alt={alt}
            {...props}
        />
    );
}
