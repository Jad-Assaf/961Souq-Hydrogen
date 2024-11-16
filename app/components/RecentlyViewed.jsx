import React, { useEffect, useState } from 'react';

function RecentlyViewedProducts({ storefront, recentlyViewedIds }) {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        if (recentlyViewedIds.length > 0) {
            const fetchProducts = async () => {
                const query = `#graphql
          query getRecentlyViewedProducts($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on Product {
                id
                title
                handle
                images(first: 1) {
                  edges {
                    node {
                      src
                      altText
                    }
                  }
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

                const response = await storefront.query(query, {
                    variables: { ids: recentlyViewedIds },
                });

                setProducts(response.nodes || []);
            };

            fetchProducts();
        }
    }, [recentlyViewedIds, storefront]);

    if (!products || products.length === 0) return null;

    return (
        <div className="recently-viewed-products">
            <h2>Recently Viewed Products</h2>
            <div className="products-grid">
                {products.map((product) => (
                    <div key={product.id} className="product-card">
                        <img
                            src={product.images.edges[0]?.node.src}
                            alt={product.images.edges[0]?.node.altText || product.title}
                        />
                        <h3>{product.title}</h3>
                        <p>
                            {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: product.priceRange.minVariantPrice.currencyCode,
                            }).format(product.priceRange.minVariantPrice.amount)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RecentlyViewedProducts;
