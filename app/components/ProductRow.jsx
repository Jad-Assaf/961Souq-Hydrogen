// src/components/ProductRow.jsx

import React from 'react';
import { Link, useShopQuery, gql } from '@shopify/hydrogen';
import '../styles/productRow.css'

const PRODUCT_ROW_QUERY = gql`
  query CollectionProducts($handle: String!) {
    collection(handle: $handle) {
      title
      products(first: 10) {
        edges {
          node {
            id
            title
            description(truncateAt: 30)
            images(first: 1) {
              edges {
                node {
                  url
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
    }
  }
`;

export default function ProductRow({ collectionHandle }) {
    const { data, loading, error } = useShopQuery({
        query: PRODUCT_ROW_QUERY,
        variables: { handle: collectionHandle },
    });

    if (loading) return <p>Loading products...</p>;
    if (error) return <p>Error loading products: {error.message}</p>;
    if (!data.collection) return <p>No collection found with handle "{collectionHandle}".</p>;

    const products = data.collection.products.edges;

    return (
        <div className="product-row">
            {products.length === 0 ? (
                <p>No products available in this collection.</p>
            ) : (
                products.map(({ node: product }) => (
                    <div key={product.id} className="product-card">
                        <Link to={`/products/${product.id}`}>
                            <img
                                src={product.images.edges[0]?.node.url}
                                alt={product.images.edges[0]?.node.altText || 'Product Image'}
                            />
                            <h2>{product.title}</h2>
                            <p>{product.description}</p>
                            <p>
                                {product.priceRange.minVariantPrice.amount}{' '}
                                {product.priceRange.minVariantPrice.currencyCode}
                            </p>
                        </Link>
                    </div>
                ))
            )}
        </div>
    );
}
