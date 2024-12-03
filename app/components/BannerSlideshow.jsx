import React, { useState, useEffect, useMemo } from "react";
import { Image } from "@shopify/hydrogen";
import { motion, AnimatePresence } from "framer-motion";

export function BannerSlideshow({ banners, interval = 10000 }) {
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

    // Memoize banners to avoid unnecessary re-renders
    const renderedBanners = useMemo(
        () =>
            banners.map((banner, index) => (
                <motion.div
                    key={index}
                    className={`banner-slide ${index === currentIndex ? "active" : "inactive"
                        }`}
                    initial={{ opacity: 0, x: index > currentIndex ? 50 : -50 }} // Direction-aware animation
                    animate={
                        index === currentIndex
                            ? { opacity: 1, x: 0 }
                            : { opacity: 0, x: index > currentIndex ? -50 : 50 }
                    }
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    drag="x"
                    dragElastic={0.2} // Allow slight elasticity for a smoother drag
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
                </motion.div>
            )),
        [banners, currentIndex]
    );

    return (
        <div className="banner-slideshow" style={styles.bannerSlideshow}>
            <AnimatePresence initial={false}>{renderedBanners[currentIndex]}</AnimatePresence>
        </div>
    );
}

const styles = {
    bannerSlideshow: {
        position: "relative",
        width: "100vw",
        height: "300px",
        overflow: "hidden",
    },
    bannerSlide: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    bannerImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    link: {
        width: "100%",
        height: "100%",
        display: "block",
    },
};
