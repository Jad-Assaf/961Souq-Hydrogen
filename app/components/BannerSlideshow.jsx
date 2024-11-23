import React, { useState, useEffect } from "react";
import { Image } from "@shopify/hydrogen";
import { motion } from "framer-motion";

/**
 * BannerSlideshow component that cycles through banners with animations.
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
                <motion.div
                    key={index}
                    className={`banner-slide ${index === currentIndex ? "active" : "inactive"}`}
                    initial={{ opacity: 0, x: 50 }} // Start with opacity 0 and slide in from the right
                    animate={index === currentIndex ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }} // Animate to visible or fade out
                    exit={{ opacity: 0, x: -50 }} // Exit animation for inactive slides
                    transition={{ duration: 0.8 }} // Smooth animation
                >
                    {index === currentIndex && (
                        <Image
                            data={{
                                url: banner.imageUrl,
                                altText: `Banner ${index + 1}`,
                            }}
                            width="100vw"
                            height="auto"
                            aspectRatio="16/9"
                            sizes="(max-width: 768px) 100vw, 1920px"
                            className="banner-image"
                        />
                    )}
                </motion.div>
            ))}
        </div>
    );
}
