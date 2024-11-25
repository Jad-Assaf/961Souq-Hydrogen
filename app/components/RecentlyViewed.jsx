import React, { useState, useEffect } from 'react';

function RecentlyViewedProducts() {
    const [recentlyViewed, setRecentlyViewed] = useState(() => {
        // Get the initial state from localStorage
        const saved = localStorage.getItem('recentlyViewed');
        return saved ? JSON.parse(saved) : [];
    });

    const [productData, setProductData] = useState([]);

    // Fetch product details for recently viewed products
    useEffect(() => {
        async function fetchProducts() {
            if (recentlyViewed.length > 0) {
                const promises = recentlyViewed.map(async (id) => {
                    const response = await fetch(`/api/graphql`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            query: `
                query GetProductDetails($id: ID!) {
                  product(id: $id) {
                    id
                    title
                    description
                    images(first: 1) {
                      edges {
                        node {
                          src
                        }
                      }
                    }
                  }
                }
              `,
                            variables: { id },
                        }),
                    });

                    const result = await response.json();
                    return result.data.product;
                });

                const products = await Promise.all(promises);
                setProductData(products);
            }
        }

        fetchProducts();
    }, [recentlyViewed]);

    useEffect(() => {
        // Save the state to localStorage whenever it changes
        localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    }, [recentlyViewed]);

    return (
        <div>
            <h2>Recently Viewed Products</h2>
            {productData.length > 0 ? (
                <div style={{ display: 'flex', gap: '16px' }}>
                    {productData.map((product) => (
                        <div key={product.id} style={{ border: '1px solid #ddd', padding: '8px' }}>
                            <img
                                src={product.images.edges[0]?.node.src}
                                alt={product.title}
                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                            />
                            <h3>{product.title}</h3>
                            <p>{product.description}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No recently viewed products.</p>
            )}
        </div>
    );
}

export default RecentlyViewedProducts;
