import React, { useEffect, useState } from 'react';
import { gql, useShopQuery } from '@shopify/hydrogen';

const RECENTLY_VIEWED_PRODUCTS_QUERY = gql`
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

function RecentlyViewedProducts() {
    const [recentlyViewedIds, setRecentlyViewedIds] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const storedIds = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
        setRecentlyViewedIds(storedIds);
    }, []);

    const { data } = useShopQuery({
        query: RECENTLY_VIEWED_PRODUCTS_QUERY,
        variables: { ids: recentlyViewedIds },
        skip: recentlyViewedIds.length === 0,
    });

    useEffect(() => {
        if (data?.nodes) {
            setProducts(data.nodes);
        }
    }, [data]);

    if (products.length === 0) return null;

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
