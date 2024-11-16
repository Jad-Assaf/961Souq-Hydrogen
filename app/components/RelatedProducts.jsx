import React, { useRef, useState } from 'react';
import { Link } from '@remix-run/react';
import { motion } from 'framer-motion';
import { Image, Money } from '@shopify/hydrogen';
import '../styles/CollectionSlider.css';

export default function RelatedProductsRow({ products }) {
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
        const walk = (x - startX) * 2; // Speed adjustment
        rowRef.current.scrollLeft = scrollLeft - walk;
    };

    const scrollRow = (distance) => {
        rowRef.current.scrollBy({ left: distance, behavior: 'smooth' });
    };

    if (!products.length) {
        return <p>No related products found.</p>;
    }

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
                    <RelatedProductItem key={product.id} product={product} index={index} />
                ))}
            </div>
            <button className="home-next-button" onClick={() => scrollRow(600)}>
                <RightArrowIcon />
            </button>
        </div>
    );
}

function RelatedProductItem({ product, index }) {
    const ref = useRef(null);

    const hasDiscount =
        product.compareAtPriceRange &&
        product.compareAtPriceRange.minVariantPrice.amount >
        product.priceRange.minVariantPrice.amount;

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.01, duration: 0.5 }}
            className="product-item"
        >
            <motion.div
                initial={{ filter: 'blur(10px)', opacity: 0 }}
                animate={{ filter: 'blur(0px)', opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="product-card"
            >
                <Link to={`/products/${product.handle}`}>
                    <Image
                        src={product.images.edges[0]?.node.url}
                        alt={product.images.edges[0]?.node.altText || 'Product Image'}
                        aspectRatio="1/1"
                        sizes="(min-width: 45em) 20vw, 40vw"
                        width="180px"
                        height="180px"
                    />
                    <h4 className="product-title">{product.title}</h4>
                    <div className="product-price">
                        <Money data={product.priceRange.minVariantPrice} />
                        {hasDiscount && (
                            <small className="discountedPrice">
                                <Money data={product.compareAtPriceRange.minVariantPrice} />
                            </small>
                        )}
                    </div>
                </Link>
            </motion.div>
        </motion.div>
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
