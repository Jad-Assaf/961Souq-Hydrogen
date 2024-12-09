import React, { useState, useEffect, useMemo } from "react";
import { Image } from "@shopify/hydrogen";
import { motion, AnimatePresence } from "framer-motion";

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const updateIsMobile = () => setIsMobile(window.innerWidth <= 1024);
        updateIsMobile(); // Check on initial render
        window.addEventListener("resize", updateIsMobile);

        return () => window.removeEventListener("resize", updateIsMobile);
    }, []);

    return isMobile;
}

export function BannerSlideshow({ banners, interval = 10000 }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const isMobile = useIsMobile();

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

    const renderedBanners = useMemo(
        () =>
            banners.map((banner, index) => (
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
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                                url: isMobile
                                    ? banner.mobileImageUrl
                                    : banner.desktopImageUrl,
                            }}
                            width="100vw"
                            height="auto"
                            aspectRatio="16/9"
                            className="banner-image"
                            style={styles.bannerImage}
                        />
                    </a>
                </motion.div>
            )),
        [banners, currentIndex, isMobile]
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
