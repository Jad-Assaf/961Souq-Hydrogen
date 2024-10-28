import React, { useRef, useState, Suspense } from 'react';
import { Link, Await } from '@remix-run/react';
import { Image, Money } from '@shopify/hydrogen';
import { AnimatedImage } from './AnimatedImage';
import { ProductForm } from '~/components/ProductForm';
import { defer, useLoaderData } from '@shopify/remix-oxygen';

export function CollectionDisplay({ collections, images }) {
    return (
        <div className="collections-container">
            {collections.map((collection, index) => (
                <div key={collection.id}>
                    <div className="collection-section">
                        <h3>{collection.title}</h3>
                        <ProductRow products={collection.products.nodes} />
                    </div>
                    <div className="image-row">
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
                {'<'}
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
                    <div key={product.id} className="product-item">
                        <Link to={`/products/${product.handle}`}>
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
                                <h4 className="product-title">
                                    {truncateText(product.title, 20)}
                                </h4>
                                <div className="product-price">
                                    <Money data={product.priceRange.minVariantPrice} />
                                </div>
                            </div>
                        </Link>
                        {/* ProductForm integrated here */}
                        <Suspense fallback={<div>Loading...</div>}>
                            <Await resolve={product}>
                                {(resolvedProduct) => (
                                    <ProductForm
                                        product={resolvedProduct}
                                        selectedVariant={resolvedProduct.variants.nodes[0]}
                                    />
                                )}
                            </Await>
                        </Suspense>
                    </div>
                ))}
            </div>
            <button className="next-button" onClick={() => scrollRow(300)}>
                {'>'}
            </button>
        </div>
    );
}
