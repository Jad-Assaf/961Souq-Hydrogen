import React, { useRef, useState } from 'react';
import { Link } from '@remix-run/react';
import { Image, Money } from '@shopify/hydrogen';
import { AnimatedImage } from './AnimatedImage';
import { ProductForm } from './ProductForm';

function truncateText(text, maxWords) {
    const words = text.split(' ');
    return words.length > maxWords
        ? words.slice(0, maxWords).join(' ') + '...'
        : text;
}

export function CollectionDisplay({ collections, images }) {
    return (
        <div className="collections-container">
            {collections.map((collection, index) => (
                <div>
                    <div key={collection.id} className="collection-section">
                        <h3>{collection.title}</h3>
                        <ProductRow products={collection.products.nodes} />
                    </div>
                    <div className="image-row">
                        {/* Display two images per row */}
                        {images.slice(index * 2, index * 2 + 2).map((image, i) => (
                            <div key={`${collection.id}-${i}`} className="row-image">
                                <AnimatedImage
                                    src={image}
                                    alt={`Collection ${index + 1} Image ${i + 1}`}
                                    loading="lazy"
                                    width="100%"
                                    height="100%"
                                />
                            </div>
                        ))}
                    </div>
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

function ProductRow({ products, image }) {
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
                            {/* Add ProductForm Below the Price */}
                            <ProductForm
                                product={product}
                                selectedVariant={product.variants.nodes[0]}
                                variants={product.variants.nodes}
                            />
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
