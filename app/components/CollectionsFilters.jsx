import React, { useState, useEffect } from 'react';
import { useShopQuery } from '@shopify/hydrogen';
import { COLLECTION_BY_HANDLE_QUERY } from './CoolectionQuery';

function CollectionFilter({ collectionHandle }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);

  // Fetch products when the component mounts
  const { data } = useShopQuery({
    query: COLLECTION_BY_HANDLE_QUERY,
    variables: { handle: collectionHandle },
  });

  useEffect(() => {
    if (data?.collectionByHandle?.products) {
      const fetchedProducts = data.collectionByHandle.products.edges.map(edge => edge.node);
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts); // Initialize filteredProducts with the fetched list
    }
  }, [data]);

  useEffect(() => {
    const filtered = products.filter((product) => {
      const minVariantPrice = parseFloat(product.priceRangeV2.minVariantPrice.amount);
      return minVariantPrice >= minPrice && minVariantPrice <= maxPrice;
    });
    setFilteredProducts(filtered);
  }, [products, minPrice, maxPrice]);

  return (
    <div>
      <h2>Filter Products by Price</h2>
      <label>
        Min Price:
        <input
          type="number"
          value={minPrice}
          onChange={(e) => setMinPrice(Number(e.target.value))}
          placeholder="Min Price"
        />
      </label>
      <label>
        Max Price:
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          placeholder="Max Price"
        />
      </label>
      <ul>
        {filteredProducts.map((product) => (
          <li key={product.id}>
            {product.title} - {product.priceRangeV2.minVariantPrice.amount} {product.priceRangeV2.minVariantPrice.currencyCode}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CollectionFilter;
