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

    const renderedDesktopBanners = useMemo(() => {
        return banners.map((banner, index) => (
            <motion.div
                key={index}
                className={`banner-slide ${
                    index === currentIndex ? "active" : "inactive"
                }`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={
                    index === currentIndex
                        ? { scale: 1, opacity: 1 }
                        : { scale: 0.9, opacity: 0 }
                }
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            >
                <a href={banner.link} target="_self" rel="noopener noreferrer">
                    <Image
                        data={{
                            altText: `Banner ${index + 1}`,
                            url: banner.desktopImageUrl,
                        }}
                        width="100%"
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
                className={`banner-slide ${
                    index === currentIndex ? "active" : "inactive"
                }`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={
                    index === currentIndex
                        ? { scale: 1, opacity: 1 }
                        : { scale: 0.9, opacity: 0 }
                }
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            >
                <a href={banner.link} target="_self" rel="noopener noreferrer">
                    <Image
                        data={{
                            altText: `Banner ${index + 1}`,
                            url: banner.mobileImageUrl,
                        }}
                        width="100%"
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
