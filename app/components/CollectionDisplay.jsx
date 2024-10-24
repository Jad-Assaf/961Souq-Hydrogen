import React, { useRef, useState } from 'react';
import { Link } from '@remix-run/react';
import { Image, Money } from '@shopify/hydrogen';

/**
 * @param {{
 *   collections: Array<{
 *     id: string;
 *     title: string;
 *     handle: string;
 *     products: { nodes: Array<ProductFragment> };
 *   }>
 * }}
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
 * Product row with drag-to-scroll functionality.
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
                <Link
                    key={product.id}
                    className="product-item"
                    to={`/products/${product.handle}`}
                >
                    <Image
                        data={product.images.nodes[0]}
                        aspectRatio="1/1"
                        sizes="(min-width: 45em) 20vw, 50vw"
                    />
                    <h4>{product.title}</h4>
                    <Money data={product.priceRange.minVariantPrice} />
                </Link>
            ))}
        </div>
    );
}
