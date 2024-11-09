import React, { useRef, useState } from 'react';
import { Link } from '@remix-run/react';
import { Money, Image } from '@shopify/hydrogen'; // Import Image from hydrogen
import { motion, useInView } from 'framer-motion';
import '../styles/CollectionSlider.css';

// Truncate text to fit within the given max word count
export function truncateText(text, maxWords) {
    const words = text.split(' ');
    return words.length > maxWords
        ? words.slice(0, maxWords).join(' ') + '...'
        : text;
}

export function CollectionDisplay({ collections, sliderCollections, images }) {
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
            {collections.map((collection, index) => (
                <div key={collection.id}>
                    <div className="collection-section">
                        <h3>{collection.title}</h3>
                        <ProductRow products={collection.products.nodes} />
                    </div>

                    {/* Inter-row images */}
                    <div className="image-row">
                        {images.slice(index * 2, index * 2 + 2).map((image, i) => (
                            <motion.div
                                key={`${collection.id}-${i}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 + 0.2 }}
                                className="row-image"
                            >
                                <Image
                                    data={image}
                                    aspectRatio="1/1"
                                    sizes="(min-width: 45em) 20vw, 40vw"
                                    srcSet={`${image}?width=300&quality=30 300w,
                                             ${image}?width=600&quality=30 600w,
                                             ${image}?width=1200&quality=30 1200w`}
                                    alt={`Collection ${index + 1} Image ${i + 1}`}
                                    width="100%"
                                    height="100%"
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function CategoryItem({ collection, index }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="category-container"
        >
            <Link to={`/collections/${collection.handle}`}>
                <motion.div
                    initial={{ filter: 'blur(10px)', opacity: 0 }}
                    animate={isInView ? { filter: 'blur(0px)', opacity: 1 } : {}}
                    transition={{ duration: 0.5 }}
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
                    />
                </motion.div>
                <div className="category-title">{collection.title}</div>
            </Link>
        </motion.div>
    );
}

function ProductRow({ products }) {
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
            <button className="prev-button" onClick={() => scrollRow(-300)}>
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
            <button className="next-button" onClick={() => scrollRow(300)}>
                <RightArrowIcon />
            </button>
        </div>
    );
}

function ProductItem({ product, index }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="product-item"
        >
            <Link to={`/products/${product.handle}`}>
                <motion.div
                    initial={{ filter: 'blur(10px)', opacity: 0 }}
                    animate={isInView ? { filter: 'blur(0px)', opacity: 1 } : {}}
                    transition={{ duration: 0.5 }}
                    className="product-card"
                >
                    <Image
                        data={product.images.nodes[0]}
                        aspectRatio="1/1"
                        sizes="(min-width: 45em) 20vw, 40vw"
                        srcSet={`${product.images.nodes[0].url}?width=300&quality=30 300w,
                                 ${product.images.nodes[0].url}?width=600&quality=30 600w,
                                 ${product.images.nodes[0].url}?width=1200&quality=30 1200w`}
                        alt={product.images.nodes[0].altText || 'Product Image'}
                        width="180px"
                        height="180px"
                    />
                    <h4 className="product-title">{truncateText(product.title, 50)}</h4>
                    <div className="product-price">
                        <Money data={product.priceRange.minVariantPrice} />
                    </div>
                </motion.div>
            </Link>
        </motion.div>
    );
}