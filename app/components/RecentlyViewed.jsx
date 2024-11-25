import React, { useEffect, useState } from 'react';
import { Link, useFetcher } from '@remix-run/react';
import { useShop } from '@shopify/hydrogen';
import { json } from '@shopify/remix-oxygen';

export default function RecentlyViewedProducts({ currentProductId }) {
    const [products, setProducts] = useState([]);
    const { storeDomain, storefrontApiVersion } = useShop();
    const fetcher = useFetcher();

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
            fetcher.load(`/products/${currentProductId}?index&ids=${productIds.join(',')}`);
        }
    }, [currentProductId]);

    useEffect(() => {
        if (fetcher.data && fetcher.data.products) {
            setProducts(fetcher.data.products);
        }
    }, [fetcher.data]);

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

// API Route Handler
export async function action({ request, context }) {
    const { storefront } = context;
    const url = new URL(request.url);
    const idsParam = url.searchParams.get('ids');

    if (!idsParam) {
        return json({ products: [] });
    }

    const ids = idsParam.split(',');

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

    const data = await storefront.query(query, { variables: { ids } });

    // Extract products from the data
    const products = data.nodes.filter((node) => node !== null);

    return json({ products });
}
