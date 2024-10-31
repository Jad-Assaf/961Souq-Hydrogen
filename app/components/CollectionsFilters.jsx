// ProductFilters.client.jsx
import React, { useState } from 'react';
import { useShopQuery, CacheLong } from '@shopify/hydrogen';

export function ProductFilters({ collectionHandle, onFilter }) {
  // Define the query to fetch filters
  const FACETS_QUERY =  `#graphql
    query Facets($handle: String!) {
      collection(handle: $handle) {
        products(first: 250) { 
          filters {
            id
            label
            type
            values {
              id
              label
              count
              input
            }
          }
        }
      }
    }
  `;

  const { data } = useShopQuery({
    query: FACETS_QUERY,
    variables: { handle: collectionHandle },
    cache: CacheLong(),
  });

  const filters = data?.collection?.products?.filters || [];
  const [selectedFilters, setSelectedFilters] = useState([]);

  const handleFilterChange = (filterId, valueId) => {
    const updatedFilters = selectedFilters.includes(valueId)
      ? selectedFilters.filter((id) => id !== valueId)
      : [...selectedFilters, valueId];

    setSelectedFilters(updatedFilters);
    onFilter(updatedFilters);  // Pass selected filters back to the parent component
  };

  return (
    <div className="product-filters">
      {filters.map((filter) => (
        <div key={filter.id} className="filter">
          <h3>{filter.label}</h3>
          {filter.type === 'LIST' && (
            <ul>
              {filter.values.map((value) => (
                <li key={value.id}>
                  <input
                    type="checkbox"
                    id={value.id}
                    checked={selectedFilters.includes(value.id)}
                    onChange={() => handleFilterChange(filter.id, value.id)}
                  />
                  <label htmlFor={value.id}>
                    {value.label} ({value.count})
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
