import React, { useRef, useState } from 'react';
import { Link } from '@remix-run/react';
import { Image, Money } from '@shopify/hydrogen';
import { AnimatedImage } from './AnimatedImage';
import { gql, useMutation } from '@apollo/client'; // Make sure to install Apollo Client

const CREATE_CART = gql`
  mutation CreateCart($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        lines(first: 10) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                }
              }
            }
          }
        }
      }
    }
  }
`;


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
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [createCart] = useMutation(CREATE_CART);  // Apollo mutation hook
    const [isAdding, setIsAdding] = useState(false);

    const handleAddToCart = async (variantId) => {
        setIsAdding(true);
        try {
            await createCart({
                variables: {
                    lines: [{ merchandiseId: variantId, quantity: 1 }],
                },
            });
            alert('Item added to cart!');
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            setIsAdding(false);
        }
    };

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
                            <h4 className="product-title">
                                {truncateText(product.title, 20)}
                            </h4>
                            <div className="product-price">
                                <Money data={product.priceRange.minVariantPrice} />
                            </div>
                            {/* Add to Cart Button Below Price */}
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
            <button className="next-button" onClick={() => scrollRow(300)}>
                <RightArrowIcon />
            </button>
        </div>
    );
}
