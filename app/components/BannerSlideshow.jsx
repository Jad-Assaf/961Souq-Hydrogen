import React, { useState, useEffect, useMemo } from "react";
import { Image } from "@shopify/hydrogen";
import { motion, AnimatePresence } from "framer-motion";

export function BannerSlideshow({ banners, interval = 300000 }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === banners.length - 1 ? 0 : prevIndex + 1
            );
        }, interval);

        return () => clearInterval(timer);
    }, [banners.length, interval]);

    const handleDragEnd = (event, info) => {
        const { offset } = info;
        const swipeThreshold = 100; // Minimum distance to trigger a swipe

        if (offset.x > swipeThreshold) {
            // Swipe to the right (previous image)
            setCurrentIndex((prevIndex) =>
                prevIndex === 0 ? banners.length - 1 : prevIndex - 1
            );
        } else if (offset.x < -swipeThreshold) {
            // Swipe to the left (next image)
            setCurrentIndex((prevIndex) =>
                prevIndex === banners.length - 1 ? 0 : prevIndex + 1
            );
        }
    };

    const renderedDesktopBanners = useMemo(() => {
        return banners.map((banner, index) => (
            <motion.div
                key={index}
                className={`banner-slide ${index === currentIndex ? "active" : "inactive"
                    }`}
                initial={{ x: index === currentIndex ? 0 : 300, opacity: 0 }}
                animate={
                    index === currentIndex
                        ? { x: 0, opacity: 1 }
                        : { x: -300, opacity: 0 }
                }
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                drag="x"
                dragElastic={0.2}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd} // Handle swipe logic
                style={{ position: "absolute", top: 0, left: 0, width: "100%" }}
            >
                <a href={banner.link} target="_self" rel="noopener noreferrer">
                    <Image
                        data={{
                            altText: `Banner ${index + 1}`,
                            url: banner.desktopImageUrl,
                        }}
                        width="100vw"
                        height="auto"
                        className="banner-image"
                    />
                </a>
            </motion.div>
        ));
    }, [banners, currentIndex]);

    const renderedMobileBanners = useMemo(() => {
        return banners.map((banner, index) => (
            <motion.div
                key={index}
                className={`banner-slide ${index === currentIndex ? "active" : "inactive"
                    }`}
                initial={{ x: index === currentIndex ? 0 : 300, opacity: 0 }}
                animate={
                    index === currentIndex
                        ? { x: 0, opacity: 1 }
                        : { x: -300, opacity: 0 }
                }
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                drag="x"
                dragElastic={0.2}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd} // Handle swipe logic
                style={{ position: "absolute", top: 0, left: 0, width: "100%" }}
            >
                <a href={banner.link} target="_self" rel="noopener noreferrer">
                    <Image
                        data={{
                            altText: `Banner ${index + 1}`,
                            url: banner.mobileImageUrl,
                        }}
                        width="100vw"
                        height="auto"
                        className="banner-image"
                    />
                </a>
            </motion.div>
        ));
    }, [banners, currentIndex]);

    return (
        <div className="banner-slideshow">
            {/* Desktop Banners */}
            <div className="desktop-banners">
                <AnimatePresence initial={false}>
                    {renderedDesktopBanners[currentIndex]}
                </AnimatePresence>
            </div>

            {/* Mobile Banners */}
            <div className="mobile-banners">
                <AnimatePresence initial={false}>
                    {renderedMobileBanners[currentIndex]}
                </AnimatePresence>
            </div>
        </div>
    );
}
