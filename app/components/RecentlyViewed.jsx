import React, { useState, useEffect } from 'react';

function RecentlyViewedProducts() {
    const [recentlyViewed, setRecentlyViewed] = useState(() => {
        const saved = localStorage.getItem('recentlyViewed');
        return saved ? JSON.parse(saved) : [];
    });

    const [productData, setProductData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchProducts() {
            try {
                if (recentlyViewed.length > 0) {
                    setLoading(true);
                    const unfetchedIds = recentlyViewed.filter(
                        (id) => !productData.find((product) => product.id === id)
                    );

                    if (unfetchedIds.length === 0) {
                        setLoading(false);
                        return;
                    }

                    const promises = unfetchedIds.map(async (id) => {
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

                        if (!response.ok) {
                            console.error(`Failed to fetch product ${id}: ${response.statusText}`);
                            return null;
                        }

                        const result = await response.json();
                        return result.data.product;
                    });

                    const products = await Promise.all(promises);
                    setProductData((prev) => [...prev, ...products.filter((p) => p)]);
                }
            } catch (error) {
                console.error('Error fetching recently viewed products:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, [recentlyViewed]);

    return (
        <div>
            <h2>Recently Viewed Products</h2>
            {loading ? (
                <p>Loading recently viewed products...</p>
            ) : productData.length > 0 ? (
                <div style={{ display: 'flex', gap: '16px' }}>
                    {productData.map((product) =>
                        product ? (
                            <div key={product.id} style={{ border: '1px solid #ddd', padding: '8px' }}>
                                <img
                                    src={product.images?.edges[0]?.node?.src || ''}
                                    alt={product.title || 'Product Image'}
                                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                />
                                <h3>{product.title || 'Untitled Product'}</h3>
                                <p>{product.description || 'No description available.'}</p>
                            </div>
                        ) : null
                    )}
                </div>
            ) : (
                <p>No recently viewed products.</p>
            )}
        </div>
    );
}

export default RecentlyViewedProducts;
