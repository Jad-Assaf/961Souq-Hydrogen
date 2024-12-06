import React, { Suspense, lazy, useRef, useState, useEffect } from 'react';
import { Link } from '@remix-run/react';
import { Money, Image } from '@shopify/hydrogen';
import { motion, useInView } from 'framer-motion';
import { AddToCartButton } from './AddToCartButton';
import { useAside } from './Aside';

const CollectionRows = lazy(() => import('./CollectionRows'));

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

export const CollectionDisplay = React.memo(({ collections, images, productSliderCollections = [] }) => {
    return (
        <div className="collections-container">
            <Suspense fallback={<div>Loading collections...</div>}>
                <CollectionRows
                    collections={collections}
                    images={images}
                    productSliderCollections={productSliderCollections}
                />
            </Suspense>
        </div>
    );
});


export function ProductRow({ products, productSliderCollections = [] }) {
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

    const combinedData = products.reduce((acc, product, index) => {
        if (index % 3 === 0 && productSliderCollections.length > 0) {
            const sliderIndex = Math.floor(index / 3) % productSliderCollections.length;
            acc.push({ type: 'slider', data: productSliderCollections[sliderIndex] });
        }
        acc.push({ type: 'product', data: product });
        return acc;
    }, []);

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
                {combinedData.map((item, index) => {
                    if (item.type === 'product') {
                        return <ProductItem key={item.data.id} product={item.data} index={index} />;
                    } else if (item.type === 'slider') {
                        return (
                            <div key={`slider-${index}`} className="slider-collection">
                                <Link to={`/collections/${item.data.handle}`}>
                                    {item.data.image && (
                                        <img
                                            src={item.data.image.url}
                                            alt={item.data.image.altText || item.data.title}
                                            className="slider-image"
                                            width={150}
                                            height={150}
                                        />
                                    )}
                                    <div className="slider-title">{item.data.title}</div>
                                </Link>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
            <button className="home-next-button" onClick={() => scrollRow(600)}>
                <RightArrowIcon />
            </button>
        </div>
    );
}

// Arrow Icons
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

// ProductItem Component remains the same
function ProductItem({ product, index }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const { open } = useAside();

    const selectedVariant = product.variants.nodes.find(variant => variant.availableForSale) || product.variants.nodes[0];
    const hasVariants = product.variants.nodes.length > 1;
    const hasDiscount =
        product.compareAtPriceRange &&
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

                <AddToCartButton
                    disabled={!selectedVariant || !selectedVariant.availableForSale}
                    onClick={() => {
                        if (hasVariants) {
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
