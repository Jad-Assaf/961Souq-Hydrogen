import { useLoaderData } from '@remix-run/react';
import { json } from '@shopify/remix-oxygen';
import { useState } from 'react';

// GraphQL query using #graphql
const GET_FILTERS_QUERY = `#graphql
  query AvailableFilters($collectionHandle: String!) {
    collection(handle: $collectionHandle) {
      products(first: 250) {
        filters {
          label
          type
          values {
            label
            value
          }
        }
      }
    }
  }
`;

// Loader function to fetch data server-side
export async function loader({ params, context }) {
  const collectionHandle = params.handle; // Adjust or pass handle as needed
  const { data } = await context.storefront.query(GET_FILTERS_QUERY, {
    variables: { collectionHandle },
  });

  return json(data.collection.products.filters);
}

// Main ProductFilter component
export default function ProductFilter() {
  const filters = useLoaderData(); // Access the filters data
  const [selectedFilters, setSelectedFilters] = useState({});

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
    // Here you would trigger the fetching of filtered products in the parent component or context
  };

  return (
    <div className="product-filter">
      {filters.map((filter) => (
        <div key={filter.label}>
          <label>{filter.label}</label>
          {filter.type === 'LIST' ? (
            <select
              onChange={(e) => handleFilterChange(filter.label, e.target.value)}
              defaultValue=""
            >
              <option value="">All</option>
              {filter.values.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : filter.type === 'PRICE_RANGE' ? (
            <input
              type="range"
              min={0}
              max={100} // Adjust as needed
              onChange={(e) => handleFilterChange(filter.label, e.target.value)}
              value={selectedFilters[filter.label] || ''}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
