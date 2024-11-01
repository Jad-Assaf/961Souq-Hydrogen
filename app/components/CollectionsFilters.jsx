// Inside FilterComponent.jsx
import { Link, useLocation } from '@remix-run/react';

export function FilterComponent({ availableFilters }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const handleFilterChange = (filterType, value) => {
    // Update search params based on filter change
    searchParams.set(`filter.${filterType}`, value);
    // Navigate with updated filters
    window.history.pushState({}, '', `${location.pathname}?${searchParams}`);
  };

  return (
    <div>
      {availableFilters.map((filter) => (
        <div key={filter.id}>
          <h4>{filter.label}</h4>
          <ul>
            {filter.values.map((value) => (
              <li key={value.id}>
                <button
                  onClick={() => handleFilterChange(filter.type, value.input)}
                >
                  {value.label} ({value.count})
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
