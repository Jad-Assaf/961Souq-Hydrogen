import React, { useState, useEffect } from "react";
import { Image } from "@shopify/hydrogen"; // Import Shopify Image component

/**
 * BannerSlideshow component that cycles through banners without titles.
 */
export function BannerSlideshow({ banners, interval = 3000 }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === banners.length - 1 ? 0 : prevIndex + 1
            );
        }, interval);

        return () => clearInterval(timer); // Cleanup on unmount
    }, [banners, interval]);

    return (
        <div className="banner-slideshow">
            {banners.map((banner, index) => (
                <div
                    key={index}
                    className={`banner-slide ${index === currentIndex ? 'active' : 'inactive'}`}
                >
                    {index === currentIndex && (
                        <Image
                            data={{
                                url: banner.imageUrl,
                                altText: `Banner ${index + 1}` // Add appropriate alt text for accessibility
                            }}
                            width="100vw" // Example width for full-width banners
                            height="auto" // Example height for full-width banners
                            aspectRatio="16/9" // Aspect ratio for widescreen banners
                            sizes="(max-width: 768px) 100vw, 1920px" // Responsive sizes
                            className="banner-image" // Add a class for custom styling if needed
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
