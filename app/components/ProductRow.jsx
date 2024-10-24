// src/components/ProductRow.jsx

import { useShopQuery } from '@shopify/hydrogen';
import { Suspense } from 'react';
import '../styles/productRow.css';


const COLLECTION_QUERY = `#graphql
  query Collection($handle: String!) {
    collection(handle: $handle) {
      products(first: 10) {
        edges {
          node {
            id
            title
            description
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

function ProductRow({ handle }) {
    const { data } = useShopQuery({
        query: COLLECTION_QUERY,
        variables: { handle },
    });

    const products = data?.collection?.products?.edges || [];

    return (
        <div className="product-row">
            {products.map(({ node: product }) => (
                <div key={product.id} className="product-card">
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
                    <button>Add to Cart</button>
                </div>
            ))}
        </div>
    );
}

export default ProductRow;
