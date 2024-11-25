// RecentlyViewed.jsx
import React, { useEffect, useState } from 'react';
import { Link } from '@remix-run/react';
import { Money } from '@shopify/hydrogen';

const RECENTLY_VIEWED_QUERY = `#graphql
  query RecentlyViewed($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        images(first: 1) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 1) {
          nodes {
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

const RecentlyViewedProducts = () => {
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [productData, setProductData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const products = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
        setRecentlyViewed(products);
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            if (recentlyViewed.length > 0) {
                const productIds = recentlyViewed.map(product => product.id);
                try {
                    const response = await fetch('/api/graphql', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            query: RECENTLY_VIEWED_QUERY,
                            variables: { ids: productIds },
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const { data } = await response.json();
                    setProductData(data.nodes);
                } catch (error) {
                    console.error('Error fetching recently viewed products:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [recentlyViewed]);

    if (loading) {
        return <p>Loading recently viewed products...</p>;
    }

    return (
        <div className="recently-viewed">
            <h2>Recently Viewed Products</h2>
            {productData.length === 0 ? (
                <p>No recently viewed products.</p>
            ) : (
                <ul>
                    {productData.map(product => (
                        <li key={product.id}>
                            <Link to={`/products/${product.handle}`}>
                                <img src={product.images[0]?.edges[0]?.node.url} alt={product.title} />
                                <h3>{product.title}</h3>
                                <p>
                                    <Money data={product.variants.nodes[0].price} />
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RecentlyViewedProducts;