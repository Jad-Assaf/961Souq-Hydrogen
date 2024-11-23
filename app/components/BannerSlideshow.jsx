import React, { useState, useEffect } from "react";
import { Image } from "@shopify/hydrogen";

/**
 * BannerSlideshow component that cycles through banners without titles.
 */
export function BannerSlideshow({ banners, interval = 5000 }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === banners.length - 1 ? 0 : prevIndex + 1
            );
        }, interval);

        return () => clearInterval(timer);
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
                                altText: `Banner ${index + 1}`
                            }}
                            width="100vw"
                            height="200px"
                            aspectRatio="16/9"
                            sizes="(max-width: 768px) 100vw, 1920px"
                            className="banner-image"
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
