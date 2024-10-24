import React, { useState, useEffect } from 'react';

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
                    className={`banner-slide ${index === currentIndex ? 'active' : 'inactive'
                        }`}
                    style={{ backgroundImage: `url(${banner.imageUrl})` }}
                />
            ))}
        </div>
    );
}
