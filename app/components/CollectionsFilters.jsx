import React, { useState, useEffect } from 'react';
import { useLoaderData } from '@remix-run/react';

export async function loader({ context, params }) {
  const { storefront } = context;
  const handle = params.handle || 'your-product-handle';

  // Fetch product price range and products
  const { data } = await storefront.query(PRODUCT_PRICE_QUERY, {
    variables: { handle },
  });

  const { productByHandle, products } = data;

  return {
    minPrice: parseFloat(productByHandle.priceRangeV2.minVariantPrice.amount),
    maxPrice: parseFloat(productByHandle.priceRangeV2.maxVariantPrice.amount),
    products: products.edges.map((edge) => ({
      id: edge.node.id,
      title: edge.node.title,
      price: parseFloat(edge.node.priceRange.minVariantPrice.amount),
    })),
  };
}

// GraphQL query to get product price range and a list of products
const PRODUCT_PRICE_QUERY = `#graphql
  query ProductPriceRange($handle: String!) {
    productByHandle(handle: $handle) {
      priceRangeV2 {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
    }
    products(first: 20) {
      edges {
        node {
          id
          title
          priceRange {
            minVariantPrice {
              amount
            }
          }
        }
      }
    }
  }
`;

export default function ProductFilter() {
  const { minPrice, maxPrice, products } = useLoaderData();
  const [selectedMinPrice, setSelectedMinPrice] = useState(minPrice);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(maxPrice);

  // Filter products based on the selected price range
  const filteredProducts = products.filter((product) => {
    return product.price >= selectedMinPrice && product.price <= selectedMaxPrice;
  });

  return (
    <div>
      <h2>Filter by Price</h2>
      <div>
        <label>
          Min Price:
          <input
            type="number"
            value={selectedMinPrice}
            min={minPrice}
            max={selectedMaxPrice}
            onChange={(e) => setSelectedMinPrice(Number(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          Max Price:
          <input
            type="number"
            value={selectedMaxPrice}
            min={selectedMinPrice}
            max={maxPrice}
            onChange={(e) => setSelectedMaxPrice(Number(e.target.value))}
          />
        </label>
      </div>
      <h3>Products within Price Range</h3>
      <ul>
        {filteredProducts.map((product) => (
          <li key={product.id}>
            {product.title} - ${product.price}
          </li>
        ))}
      </ul>
    </div>
  );
}