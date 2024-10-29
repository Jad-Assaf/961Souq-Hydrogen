import React, { useRef, useState } from 'react';
import { Link } from '@remix-run/react';
import { Image, Money } from '@shopify/hydrogen';
import { AnimatedImage } from './AnimatedImage';

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

function ProductRow({ products }) {
    const rowRef = useRef(null);
    const [isAdding, setIsAdding] = useState(false);

    const handleAddToCart = async (variantId) => {
        setIsAdding(true);
        try {
            const response = await fetch('/cart/add.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: [{ id: variantId, quantity: 1 }],
                }),
            });

            const data = await response.json();
            if (response.ok) {
                alert('Item added to cart!');
            } else {
                console.error('Error:', data);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="product-row-container">
            {products.map((product) => {
                const firstVariant = product.variants?.nodes[0];
                return (
                    <div key={product.id} className="product-card">
                        <img
                            src={product.images.nodes[0].url}
                            alt={product.images.nodes[0].altText || 'Product Image'}
                            width="180px"
                            height="180px"
                        />
                        <h4 className="product-title">{product.title}</h4>
                        <div className="product-price">
                            <Money data={product.priceRange.minVariantPrice} />
                        </div>
                        <button
                            onClick={() => handleAddToCart(firstVariant.id)}
                            disabled={isAdding}
                        >
                            {isAdding ? 'Adding...' : 'Add to Cart'}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

