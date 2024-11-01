// CollectionFilter.jsx
import React, { useState, useEffect } from 'react';

function CollectionFilter({ products }) {
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);

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
