// RecentlyViewedProducts.jsx

import React, { useEffect, useState } from 'react';
import { Link } from '@remix-run/react';

export default function RecentlyViewedProducts({ currentProductId }) {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        // Update the viewed products list in localStorage
        if (typeof window !== 'undefined' && currentProductId) {
            let viewedProducts = JSON.parse(localStorage.getItem('viewedProducts')) || [];

            // Remove the current product ID if it's already in the array
            viewedProducts = viewedProducts.filter((id) => id !== currentProductId);

            // Add the current product ID to the beginning of the array
            viewedProducts.unshift(currentProductId);

            // Limit the array to the last 5 viewed products
            viewedProducts = viewedProducts.slice(0, 5);

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
        const storefrontAccessToken = import.meta.env.PUBLIC_STOREFRONT_API_TOKEN;
        const shopDomain = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN;

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

        const response = await fetch(`https://${shopDomain}/api/2023-07/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
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

    if (products.length === 0) {
        return null; // Don't render the component if there are no recently viewed products
    }

    return (
        <div className="recently-viewed-products">
            <h2>Recently Viewed Products</h2>
            <div className="product-grid">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}

// Simple ProductCard component included in the same file
function ProductCard({ product }) {
    return (
        <div className="product-card">
            <Link to={`/products/${product.handle}`}>
                {product.featuredImage && (
                    <img
                        src={product.featuredImage.url}
                        alt={product.featuredImage.altText || product.title}
                    />
                )}
                <h3>{product.title}</h3>
                <p>
                    {product.priceRange.minVariantPrice.amount}{' '}
                    {product.priceRange.minVariantPrice.currencyCode}
                </p>
            </Link>
        </div>
    );
}
