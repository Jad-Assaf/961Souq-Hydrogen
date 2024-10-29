import React, { useRef, useState } from 'react';
import { Link } from '@remix-run/react';
import { Money } from '@shopify/hydrogen';
import { AnimatedImage } from './AnimatedImage';
import '../styles/CollectionSlider.css';

// Truncate text to fit within the given max word count
function truncateText(text, maxWords) {
    const words = text.split(' ');
    return words.length > maxWords
        ? words.slice(0, maxWords).join(' ') + '...'
        : text;
}

export function CollectionDisplay({ collections, sliderCollections }) {
    return (
        <div className="collections-container">
            {/* Slide container using 'new-main-menu' handles */}
            <div className="slide-con">
                <h3 className="cat-h3">Shop By Categories</h3>
                <div className="category-slider">
                    {sliderCollections.map((collection) => (
                        <Link
                            key={collection.id}
                            to={`/collections/${collection.handle}`}
                            className="category-container"
                        >
                            <img
                                src={collection.image?.url || 'https://via.placeholder.com/150'}
                                alt={collection.image?.altText || collection.title}
                                className="category-image"
                            />
                            <div className="category-title">{collection.title}</div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Product rows using hardcoded handles */}
            {collections.map((collection) => (
                <div key={collection.id} className="collection-section">
                    <h3>{collection.title}</h3>
                    <ProductRow products={collection.products.nodes} />
                </div>
            ))}
        </div>
    );
}

const LeftArrowIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const RightArrowIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

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
                {products.map((product) => (
                    <Link key={product.id} className="product-item" to={`/products/${product.handle}`}>
                        <div className="product-card">
                            <AnimatedImage
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
                            <h4 className="product-title">{truncateText(product.title, 20)}</h4>
                            <div className="product-price">
                                <Money data={product.priceRange.minVariantPrice} />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
            <button className="next-button" onClick={() => scrollRow(300)}>
                <RightArrowIcon />
            </button>
        </div>
    );
}
