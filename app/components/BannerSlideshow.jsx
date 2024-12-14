import React, { useState, useEffect, useMemo } from "react";
import { Image } from "@shopify/hydrogen";
import { motion, AnimatePresence } from "framer-motion";

export function BannerSlideshow({ banners, interval = 5000 }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === banners.length - 1 ? 0 : prevIndex + 1
            );
        }, interval);

        const progressTimer = setInterval(() => {
            setProgress((prev) => (prev >= 100 ? 0 : prev + 100 / (interval / 100)));
        }, 100);

        return () => {
            clearInterval(timer);
            clearInterval(progressTimer);
        };
    }, [banners.length, interval]);

    useEffect(() => {
        setProgress(0);
    }, [currentIndex]);

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
                        loading="eager"
                        decoding="sync"
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

            {/* Progress Bar */}
            <div className="progress-bar" style={styles.progressBar}>
                <div
                    className="progress"
                    style={{
                        ...styles.progress,
                        width: `${progress}%`,
                    }}
                ></div>
            </div>

            {/* Indicator Dots */}
            <div className="indicator-dots" style={styles.indicatorDots}>
                {banners.map((_, index) => (
                    <div
                        key={index}
                        className={`dot ${index === currentIndex ? "active" : ""}`}
                        style={{
                            ...styles.dot,
                            backgroundColor: index === currentIndex ? "#fff" : "#000",
                        }}
                        onClick={() => setCurrentIndex(index)}
                    ></div>
                ))}
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
        borderRadius: "20px",
    },
    link: {
        width: "100vw",
        height: "100%",
        display: "block",
    },
    progressBar: {
        position: "absolute",
        bottom: "20px",
        left: 0,
        width: "45%",
        height: "3px",
        backgroundColor: "#000",
        borderRadius: "20px",
    },
    progress: {
        height: "100%",
        backgroundColor: "#fff",
        transition: "width 0.1s linear",
    },
    indicatorDots: {
        position: "absolute",
        width: "100%",
        bottom: "2px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
    },
    dot: {
        width: "5px",
        height: "5px",
        borderRadius: "50%",
        cursor: "pointer",
    },
};
