import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Link } from '@remix-run/react';
import { Money, Image } from '@shopify/hydrogen';
import { motion, useInView } from 'framer-motion';
import { AddToCartButton } from './AddToCartButton';
import { useAside } from './Aside';
import CollectionRows from './CollectionRows'; // Standard import for CollectionRows

// Truncate text to fit within the given max word count
export function truncateText(text, maxWords) {
    if (!text || typeof text !== 'string') {
        return ''; // Return an empty string if text is undefined or not a string
    }
    const words = text.split(' ');
    return words.length > maxWords
        ? words.slice(0, maxWords).join(' ') + '...'
        : text;
}

// Simplified CollectionDisplay
export const CollectionDisplay = React.memo(({ menuCollections }) => {
    return (
        <div className="collections-container">
            <CollectionRows menuCollections={menuCollections} />
        </div>
    );
});

export function ProductRow({ products }) {
    const rowRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - rowRef.current.offsetLeft);
        setScrollLeft(rowRef.current.scrollLeft);
    };

    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - rowRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        rowRef.current.scrollLeft = scrollLeft - walk;
    };

    const scrollRow = (distance) => {
        rowRef.current.scrollBy({ left: distance, behavior: 'smooth' });
    };

    return (
        <div className="product-row-container">
            <button className="home-prev-button" onClick={() => scrollRow(-600)}>
                <LeftArrowIcon />
            </button>
            <div
                className="collection-products-row"
                ref={rowRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                {products.map((product, index) => (
                    <ProductItem key={product.id} product={product} index={index} />
                ))}
            </div>
            <button className="home-next-button" onClick={() => scrollRow(600)}>
                <RightArrowIcon />
            </button>
        </div>
    );
}

const LeftArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const RightArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

export function ProductItem({ product, index }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const slideshowInterval = 3000; // Time for each slide

    const images = product.images?.nodes || [];

    useEffect(() => {
        let imageTimer, progressTimer;

        if (isHovered) {
            // Image slideshow timer
            imageTimer = setInterval(() => {
                setCurrentImageIndex((prevIndex) =>
                    prevIndex === images.length - 1 ? 0 : prevIndex + 1
                );
            }, slideshowInterval);

            // Progress bar timer
            progressTimer = setInterval(() => {
                setProgress((prev) => (prev >= 100 ? 0 : prev + 100 / (slideshowInterval / 100)));
            }, 100);
        } else {
            setProgress(0); // Reset progress when not hovered
        }

        return () => {
            clearInterval(imageTimer);
            clearInterval(progressTimer);
        };
    }, [isHovered, images.length]);

    useEffect(() => {
        setProgress(0); // Reset progress when the current image changes
    }, [currentImageIndex]);

    const selectedVariant =
        product.variants?.nodes?.find((variant) => variant.availableForSale) ||
        product.variants?.nodes?.[0] ||
        null;

    const hasDiscount =
        selectedVariant?.compareAtPrice &&
        selectedVariant.compareAtPrice.amount > selectedVariant.price.amount;

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{
                x: { type: "spring", stiffness: 100, damping: 20 },
                opacity: { duration: 0.3 },
                delay: index * 0.1,
            }}
            className="product-card"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link to={`/products/${product.handle}`}>
                {images.length > 0 && (
                    <div className="product-slideshow" style={styles.slideshow}>
                        <img
                            src={images[currentImageIndex]?.url}
                            alt={images[currentImageIndex]?.altText || "Product Image"}
                            style={styles.image}
                            loading="lazy"
                            className="product-slideshow-image"
                        />
                        <div className="product-slideshow-progress-bar" style={styles.progressBar}>
                            <div
                                className="product-slideshow-progress"
                                style={{
                                    ...styles.progress,
                                    width: `${progress}%`,
                                }}
                            ></div>
                        </div>
                    </div>
                )}
                <h4 className="product-title">{product.title}</h4>
                <div className="product-price">
                    {selectedVariant?.price && <Money data={selectedVariant.price} />}
                    {hasDiscount && (
                        <small className="discountedPrice">
                            <Money data={selectedVariant.compareAtPrice} />
                        </small>
                    )}
                </div>
            </Link>

            {/* Add to Cart Button */}
            <AddToCartButton
                disabled={!selectedVariant || !selectedVariant.availableForSale}
                onClick={() => {
                    if (product.variants?.nodes?.length > 1) {
                        window.location.href = `/products/${product.handle}`;
                    } else {
                        // Trigger cart logic
                    }
                }}
                lines={
                    selectedVariant
                        ? [
                            {
                                merchandiseId: selectedVariant.id,
                                quantity: 1,
                                product: {
                                    ...product,
                                    selectedVariant,
                                    handle: product.handle,
                                },
                            },
                        ]
                        : []
                }
            >
                {!selectedVariant?.availableForSale
                    ? "Sold out"
                    : product.variants?.nodes?.length > 1
                        ? "Select Options"
                        : "Add to cart"}
            </AddToCartButton>
        </motion.div>
    );
}

const styles = {
    slideshow: {
        position: "relative",
        width: "180px",
        height: "180px",
        overflow: "hidden",
    },
    image: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    progressBar: {
        position: "absolute",
        bottom: "5px",
        left: "0",
        width: "100%",
        height: "5px",
        backgroundColor: "#e0e0e0",
    },
    progress: {
        height: "100%",
        backgroundColor: "#000",
        transition: "width 0.1s linear",
    },
};
