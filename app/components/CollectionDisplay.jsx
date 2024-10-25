import React from 'react';
import { Link } from '@remix-run/react';
import { Image, Money } from '@shopify/hydrogen';
import { ResponsiveImageGrid } from '../components/ResponsiveImageGrid'; // Import ResponsiveImageGrid

/**
 * CollectionDisplay component with drag-to-scroll functionality and inter-row image grids.
 */
export function CollectionDisplay({ collections, interRowImages }) {
    return (
        <div className="collections-container">
            {collections.map((collection, index) => (
                <div key={collection.id} className="collection-section">
                    <h3>{collection.title}</h3>
                    <ProductRow products={collection.products.nodes} />

                    {/* Insert the ResponsiveImageGrid to display inter-row images */}
                    {interRowImages && interRowImages[index] && (
                        <ResponsiveImageGrid
                            images={[interRowImages[index]]} // Pass one image in an array to the grid
                        />
                    )}
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
                            <Image
                                data={product.images.nodes[0]}
                                aspectRatio="1/1"
                                sizes="(min-width: 45em) 20vw, 40vw"
                                srcSet={`${product.images.nodes[0].url}?width=300&quality=30 300w,
                                         ${product.images.nodes[0].url}?width=600&quality=30 600w,
                                         ${product.images.nodes[0].url}?width=1200&quality=30 1200w`}
                                alt={product.images.nodes[0].altText || 'Product Image'}
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
