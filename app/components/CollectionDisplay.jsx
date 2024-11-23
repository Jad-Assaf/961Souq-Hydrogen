import React, { Suspense, lazy, useRef, useState } from 'react';
import { Link } from '@remix-run/react';
import { Money, Image } from '@shopify/hydrogen'; // Import Image from hydrogen
import { motion, useInView } from 'framer-motion';
import '../styles/CollectionSlider.css';
import { AddToCartButton } from './AddToCartButton';
import { useAside } from './Aside';

const CollectionRows = lazy(() => import('./CollectionRows')); // Lazy load the CollectionRows component

// Truncate text to fit within the given max word count
export function truncateText(text, maxWords) {
    if (!text || typeof text !== "string") {
        return ""; // Return an empty string if text is undefined or not a string
    }
    const words = text.split(' ');
    return words.length > maxWords
        ? words.slice(0, maxWords).join(' ') + '...'
        : text;
}

const CollectionDisplay = ({ collections, sliderCollections, images }) => {
    return (
        <div className="collections-container">
            {/* Slide container using 'new-main-menu' handles */}
            <div className="slide-con">
                <h3 className="cat-h3">Shop By Categories</h3>
                <div className="category-slider">
                    {sliderCollections.map((collection, index) => (
                        <CategoryItem key={collection.id} collection={collection} index={index} />
                    ))}
                </div>
            </div>

            {/* Product rows using hardcoded handles */}
            <>
                {/* Render "New Arrivals" and "Laptops" rows at the start */}
                {collections.find((collection) => collection.handle === "new-arrivals") && (
                    <div className="collection-section">
                        <div className="collection-header">
                            <h3>New Arrivals</h3>
                            <Link to="/collections/new-arrivals" className="view-all-link">
                                View All
                            </Link>
                        </div>
                        <ProductRow
                            products={collections.find((collection) => collection.handle === "new-arrivals").products.nodes}
                        />
                    </div>
                )}

                {collections.find((collection) => collection.handle === "laptops") && (
                    <div className="collection-section">
                        <div className="collection-header">
                            <h3>Laptops</h3>
                            <Link to="/collections/laptops" className="view-all-link">
                                View All
                            </Link>
                        </div>
                        <ProductRow
                            products={collections.find((collection) => collection.handle === "laptops")
                                .products.nodes}
                        />
                    </div>
                )}

                {/* Lazy load the rest of the collections */}
                <Suspense fallback={<div>Loading collections...</div>}>
                    <CollectionRows collections={ collections} images={images} />
                </Suspense>
            </>
        </div>
    );
};


function CategoryItem({ collection, index }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.01, duration: 0.5 }}
            className="category-container"
        >
            <Link to={`/collections/${collection.handle}`}>
                <motion.div
                    initial={{ filter: 'blur(10px)', opacity: 0 }}
                    animate={isInView ? { filter: 'blur(0px)', opacity: 1 } : {}}
                    transition={{ duration: 0.5 }}
                    width="150px"
                    height="150px"
                >
                    <Image
                        data={collection.image}
                        aspectRatio="1/1"
                        sizes="(min-width: 45em) 20vw, 40vw"
                        srcSet={`${collection.image?.url}?width=300&quality=30 300w,
                                 ${collection.image?.url}?width=600&quality=30 600w,
                                 ${collection.image?.url}?width=1200&quality=30 1200w`}
                        alt={collection.image?.altText || collection.title}
                        className="category-image"
                        width="150px"
                        height="150px"
                    />
                </motion.div>
                <div className="category-title">{collection.title}</div>
            </Link>
        </motion.div>
    );
}

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

function ProductItem({ product, index }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const { open } = useAside();

    // Check for available variants and set up selected variant
    const selectedVariant = product.variants.nodes.find(variant => variant.availableForSale) || product.variants.nodes[0];
    const hasVariants = product.variants.nodes.length > 1;

    // Determine if there's a discount by comparing the regular and discounted prices
    const hasDiscount = product.compareAtPriceRange &&
        product.compareAtPriceRange.minVariantPrice.amount >
        product.priceRange.minVariantPrice.amount;

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.01, duration: 0.5 }}
            className="product-item"
        >
            <motion.div
                initial={{ filter: 'blur(10px)', opacity: 0 }}
                animate={isInView ? { filter: 'blur(0px)', opacity: 1 } : {}}
                transition={{ duration: 0.5 }}
                className="product-card"
            >
                <Link to={`/products/${product.handle}`}>
                    <Image
                        data={product.images.nodes[0]}
                        aspectRatio="1/1"
                        sizes="(min-width: 45em) 20vw, 40vw"
                        srcSet={`${product.images.nodes[0].url}?width=300&quality=10 300w,
                                 ${product.images.nodes[0].url}?width=600&quality=10 600w,
                                 ${product.images.nodes[0].url}?width=1200&quality=10 1200w`}
                        alt={product.images.nodes[0].altText || 'Product Image'}
                        width="180px"
                        height="180px"
                    />
                    <h4 className="product-title">{truncateText(product.title, 50)}</h4>
                    <div className="product-price">
                        <Money data={selectedVariant.price} />
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
                        if (hasVariants) {
                            // Navigate to product page if multiple variants
                            window.location.href = `/products/${product.handle}`;
                        } else {
                            open('cart');
                        }
                    }}
                    lines={
                        selectedVariant && !hasVariants
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
                        ? 'Sold out'
                        : hasVariants
                            ? 'Select Options'
                            : 'Add to cart'}
                </AddToCartButton>
            </motion.div>
        </motion.div>
    );
}
