import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@remix-run/react';
import { Money, Image } from '@shopify/hydrogen'; // Import Image from hydrogen
import { motion, useInView } from 'framer-motion';

export default function RecentlyViewedProducts({ currentProductId }) {
    const [products, setProducts] = useState([]);
    const rowRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);


    useEffect(() => {
        // Update the viewed products list in localStorage
        if (typeof window !== 'undefined' && currentProductId) {
            let viewedProducts = JSON.parse(localStorage.getItem('viewedProducts')) || [];

            // Remove the current product ID if it's already in the array
            viewedProducts = viewedProducts.filter((id) => id !== currentProductId);

            // Add the current product ID to the beginning of the array
            viewedProducts.unshift(currentProductId);

            // Limit the array to the last 10 viewed products
            viewedProducts = viewedProducts.slice(0, 10);

            // Save back to localStorage
            localStorage.setItem('viewedProducts', JSON.stringify(viewedProducts));
        }
    }, [currentProductId]);

    useEffect(() => {
        // Get the viewed products from localStorage
        const viewedProducts = JSON.parse(localStorage.getItem('viewedProducts')) || [];

        // Remove the current product ID to avoid showing it in the list
        const productIds = viewedProducts.filter((id) => id !== currentProductId);

        // Fetch product data if there are any viewed products
        if (productIds.length > 0) {
            fetchProducts(productIds).then((fetchedProducts) => {
                setProducts(fetchedProducts);
            });
        }
    }, [currentProductId]);

    // Function to fetch products from the Shopify Storefront API
    async function fetchProducts(productIds) {
        const storefrontAccessToken = import.meta.env.VITE_PUBLIC_STOREFRONT_API_TOKEN;
        const shopDomain = import.meta.env.VITE_PUBLIC_SHOPIFY_STORE_DOMAIN;

        const query = `
      query getProductsByIds($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            title
            handle
            featuredImage {
              url
              altText
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    `;

        const response = await fetch(`https://961souqs.myshopify.com/api/2023-07/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': 'e00803cf918c262c99957f078d8b6d44',
            },
            body: JSON.stringify({
                query,
                variables: { ids: productIds },
            }),
        });

        const jsonResponse = await response.json();

        // Handle any errors returned by the API
        if (jsonResponse.errors) {
            console.error('Error fetching products:', jsonResponse.errors);
            return [];
        }

        const products = jsonResponse.data.nodes.filter((node) => node !== null);
        return products;
    }

    // Scroll handling for the product row
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

    if (products.length === 0) {
        return null; // Don't render the component if there are no recently viewed products
    }


    return (
        <div className="collection-section">
            <h3>Recently Viewed Products</h3>
            <div className="product-row-container">
                <button className="home-prev-button" onClick={() => scrollRow(-600)}>
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
                        <RecentlyViewedProductItem key={product.id} product={product} index={index} />
                    ))}
                </div>
                <button className="home-next-button" onClick={() => scrollRow(600)}>
                    <RightArrowIcon />
                </button>
            </div>
        </div>
    );
}

function RecentlyViewedProductItem({ product, index }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.01, duration: 0.5 }}
            className="product-item"
        >
            <motion.div
                initial={{ filter: 'blur(10px)', opacity: 0 }}
                animate={{ filter: 'blur(0px)', opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="product-card"
            >
                <Link to={`/products/${product.handle}`}>
                    <Image
                        data={product.featuredImage}
                        aspectRatio="1/1"
                        sizes="(min-width: 45em) 20vw, 40vw"
                        srcSet={`${product.featuredImage.url}?width=300&quality=30 300w,
                                 ${product.featuredImage.url}?width=600&quality=30 600w,
                                 ${product.featuredImage.url}?width=1200&quality=30 1200w`}
                        alt={product.featuredImage.altText || product.title}
                        width="150px"
                        height="150px"
                    />
                    <div className="product-title">{product.title}</div>
                    <div className="product-price">
                        {product.priceRange.minVariantPrice.amount}{' '}
                        {product.priceRange.minVariantPrice.currencyCode}
                    </div>
                </Link>
            </motion.div>
        </motion.div>
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
