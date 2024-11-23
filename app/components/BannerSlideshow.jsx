import React, { useState, useEffect } from "react";
import { Image } from "@shopify/hydrogen";
import { motion } from "framer-motion";

/**
 * BannerSlideshow component that cycles through banners with animations and swipe support.
 */
export function BannerSlideshow({ banners, interval = 10000 }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === banners.length - 1 ? 0 : prevIndex + 1
            );
        }, interval);

        return () => clearInterval(timer);
    }, [banners, interval]);

    const handleDragEnd = (event, info) => {
        const { offset } = info;
        const swipeThreshold = 100; // Minimum swipe distance to trigger a change

        if (offset.x > swipeThreshold) {
            // Swipe right (previous banner)
            setCurrentIndex((prevIndex) =>
                prevIndex === 0 ? banners.length - 1 : prevIndex - 1
            );
        } else if (offset.x < -swipeThreshold) {
            // Swipe left (next banner)
            setCurrentIndex((prevIndex) =>
                prevIndex === banners.length - 1 ? 0 : prevIndex + 1
            );
        }
    };

    return (
        <div className="banner-slideshow" style={styles.bannerSlideshow}>
            {banners.map((banner, index) => (
                <motion.div
                    key={index}
                    className={`banner-slide ${index === currentIndex ? "active" : "inactive"}`}
                    initial={{ opacity: 0, x: 50 }} // Start with opacity 0 and slide in from the right
                    animate={index === currentIndex ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }} // Animate to visible or fade out
                    exit={{ opacity: 0, x: -50 }} // Exit animation for inactive slides
                    transition={{ duration: 0.8 }} // Smooth animation
                    drag="x" // Enable horizontal dragging
                    dragConstraints={{ left: 0, right: 0 }} // Constrain drag to horizontal direction
                    onDragEnd={handleDragEnd} // Handle swipe gesture
                    style={styles.bannerSlide}
                >
                    {index === currentIndex && (
                        <a href={banner.link} target="_self" rel="noopener noreferrer">
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
                                style={styles.bannerImage}
                            />
                        </a>
                    )}
                </motion.div>
            ))}
        </div>
    );
}

const styles = {
    bannerSlideshow: {
        position: 'relative',
        width: '100vw',
        height: '300px',
        overflow: 'hidden',
    },
    bannerSlide: {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: '0',
        transition: 'opacity 1s ease-in-out',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
    },
};
