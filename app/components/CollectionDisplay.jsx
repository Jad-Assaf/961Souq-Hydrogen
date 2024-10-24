import React, { useRef, useState } from 'react';
import { Link } from '@remix-run/react';
import { Image, Money } from '@shopify/hydrogen';

/**
 * Truncate text to a specific word limit.
 */
function truncateText(text, maxWords) {
    const words = text.split(' ');
    return words.length > maxWords
        ? words.slice(0, maxWords).join(' ') + '...'
        : text;
}

/**
 * CollectionDisplay component with drag-to-scroll functionality.
 */
export function CollectionDisplay({ collections }) {
    return (
        <div className="collections-container">
            {collections.map((collection) => (
                <div key={collection.id} className="collection-section">
                    <h3>{collection.title}</h3>
                    <ProductRow products={collection.products.nodes} />
                </div>
            ))}
        </div>
    );
}

/**
 * ProductRow component with drag-to-scroll.
 */
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
        const walk = (x - startX) * 2; // Adjust scroll speed
        rowRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
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
                        <Image
                            data={product.images.nodes[0]}
                            aspectRatio="1/1"
                            sizes="(min-width: 45em) 20vw, 50vw"
                        />
                        <h4 className="product-title">{truncateText(product.title, 20)}</h4>
                        <div className="product-price">
                            <Money data={product.priceRange.minVariantPrice} />
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
