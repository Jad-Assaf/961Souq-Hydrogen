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
        const swipeThreshold = 100;

        if (offset.x > swipeThreshold) {
            setCurrentIndex((prevIndex) =>
                prevIndex === 0 ? banners.length - 1 : prevIndex - 1
            );
        } else if (offset.x < -swipeThreshold) {
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
                initial={{ opacity: 0, x: index > currentIndex ? 50 : -50 }}
                animate={
                    index === currentIndex
                        ? { opacity: 1, x: 0 }
                        : { opacity: 0, x: index > currentIndex ? -50 : 50 }
                }
                exit={{ opacity: 0, x: -50 }}
                transition={{ type: "spring", stiffness: 100, damping: 10 }}
                drag="x"
                dragElastic={0.2}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                style={styles.bannerSlide}
            >
                <a
                    href={banner.link}
                    target="_self"
                    rel="noopener noreferrer"
                    style={styles.link}
                >
                    <Image
                        data={{
                            altText: `Banner ${index + 1}`,
                            url: banner.desktopImageUrl,
                        }}
                        width="100vw"
                        height="auto"
                        className="banner-image"
                        style={styles.bannerImage}
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
                initial={{ opacity: 0, x: index > currentIndex ? 50 : -50 }}
                animate={
                    index === currentIndex
                        ? { opacity: 1, x: 0 }
                        : { opacity: 0, x: index > currentIndex ? -50 : 50 }
                }
                exit={{ opacity: 0, x: -50 }}
                transition={{ type: "spring", stiffness: 100, damping: 10 }}
                drag="x"
                dragElastic={0.2}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                style={styles.bannerSlide}
            >
                <a
                    href={banner.link}
                    target="_self"
                    rel="noopener noreferrer"
                    style={styles.link}
                >
                    <Image
                        data={{
                            altText: `Banner ${index + 1}`,
                            url: banner.mobileImageUrl,
                        }}
                        width="100vw"
                        height="auto"
                        className="banner-image"
                        style={styles.bannerImage}
                    />
                </a>
            </motion.div>
        ));
    }, [banners, currentIndex]);

    return (
        <div className="banner-slideshow" style={styles.bannerSlideshow}>
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

const styles = {
    bannerSlideshow: {
        position: "relative",
        width: "100vw",
        overflow: "hidden",
    },
    bannerSlide: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "start",
    },
    bannerImage: {
        width: "100vw",
        height: "100%",
        objectFit: "contain",
        maxWidth: "1500px",
        margin: "auto",
    },
    link: {
        width: "100vw",
        height: "100%",
        display: "block",
    },
};
