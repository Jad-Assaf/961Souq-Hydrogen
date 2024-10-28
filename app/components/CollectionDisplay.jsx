import React, { useRef, useState, useEffect } from 'react';
import { Link, useLoaderData } from '@remix-run/react';
import { Money } from '@shopify/hydrogen';
import { AnimatedImage } from './AnimatedImage';
import { AddToCartButton } from './AddToCartButton';

function truncateText(text, maxWords) {
    const words = text.split(' ');
    return words.length > maxWords
        ? words.slice(0, maxWords).join(' ') + '...'
        : text;
}

// GraphQL Query to Fetch Products and Variants
const PRODUCT_QUERY = `
  query getProduct($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      images(first: 1) {
        nodes {
          url
          altText
        }
      }
      variants(first: 5) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

export const loader = async ({ params }) => {
    const { handle } = params;

    const { data } = await storefrontClient.query({
        query: PRODUCT_QUERY,
        variables: { handle },
    });

    return data.product;
};

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
                {products.map((product) => {
                    const variants = product.variants?.nodes || [];
                    const hasMultipleVariants = variants.length > 1;
                    const selectedVariant = variants[0]; // Default to the first variant

                    console.log('Product:', product);
                    console.log('Variants:', variants);
                    console.log('Selected Variant:', selectedVariant);

                    const isAvailable = selectedVariant?.availableForSale;

                    return (
                        <div key={product.id} className="product-item">
                            <div className="product-card">
                                {product.images?.nodes?.[0] && (
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
                                )}
                                <h4 className="product-title">
                                    {truncateText(product.title, 20)}
                                </h4>
                                <div className="product-price">
                                    <Money data={product.priceRange.minVariantPrice} />
                                </div>

                                {hasMultipleVariants ? (
                                    <Link
                                        to={`/products/${product.handle}`}
                                        className="select-option-button"
                                    >
                                        Select Option
                                    </Link>
                                ) : isAvailable ? (
                                    <AddToCartButton
                                        disabled={!isAvailable}
                                        onClick={() => open('cart')}
                                        lines={[
                                            {
                                                merchandiseId: selectedVariant.id,
                                                quantity: 1,
                                            },
                                        ]}
                                    >
                                        Add to Cart
                                    </AddToCartButton>
                                ) : (
                                    <button className="sold-out-button" disabled>
                                        Sold Out
                                    </button>
                                )}
                            </div>
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
