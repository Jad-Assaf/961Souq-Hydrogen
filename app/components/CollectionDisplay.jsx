import React, { Suspense, useRef, useState } from 'react';
import { Link } from '@remix-run/react';
import { Money, Image, useOptimisticVariant } from '@shopify/hydrogen';
import { motion, useInView } from 'framer-motion';
import { AddToCartButton } from './AddToCartButton';
import { useAside } from './Aside';
import CollectionRows from './CollectionRows'; // Standard import for CollectionRows
import { ProductForm } from './ProductForm';

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

    // Ensure variants are properly initialized
    const variants = product.variants?.nodes || [];
    const selectedVariant = useOptimisticVariant(product.selectedVariant, variants);

    const [quantity, setQuantity] = useState(1);
    const incrementQuantity = () => setQuantity((prev) => prev + 1);
    const decrementQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

    const hasDiscount =
        selectedVariant?.compareAtPrice &&
        selectedVariant.compareAtPrice.amount > selectedVariant.price.amount;

    // Debugging
    console.log('Product:', product);
    console.log('Variants:', variants);
    console.log('Selected Variant:', selectedVariant);

    return (
        <motion.div
            ref={ref}
            initial={{ filter: 'blur(20px)', opacity: 0, x: -20 }}
            animate={isInView ? { filter: 'blur(0px)', opacity: 1, x: 0 } : {}}
            transition={{
                x: { type: 'spring', stiffness: 100, damping: 20 },
                opacity: { duration: 0.3 },
                filter: { duration: 0.5 },
                delay: index * 0.1,
            }}
            className="product-card"
        >
            <Link to={`/products/${product.handle}`}>
                {product.images?.nodes?.[0] && (
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
                        loading="lazy"
                    />
                )}
                <h4 className="product-title">{product.title}</h4>
            </Link>

            <div className="product-price">
                {selectedVariant?.price && <Money data={selectedVariant.price} />}
                {hasDiscount && (
                    <small className="discountedPrice">
                        <Money data={selectedVariant.compareAtPrice} />
                    </small>
                )}
            </div>

            <div className="quantity-selector">
                <button onClick={decrementQuantity} disabled={quantity <= 1}>
                    -
                </button>
                <span>{quantity}</span>
                <button onClick={incrementQuantity}>+</button>
            </div>

            <ProductForm
                product={product}
                selectedVariant={selectedVariant}
                variants={variants}
                quantity={quantity}
            />
        </motion.div>
    );
}
