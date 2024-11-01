import React from 'react';

export function ProductFilter({ filters, selectedFilters, onFilterChange }) {
  return (
    <div className="product-filters">
      {filters.map((filter) => (
        <div key={filter.id} className="filter-group">
          <h4>{filter.label}</h4>
          {filter.values.map((value) => (
            <label key={value.id}>
              <input
                type={filter.type === 'PRICE_RANGE' ? 'range' : 'checkbox'}
                checked={selectedFilters[filter.id] === value.input}
                onChange={() => onFilterChange(filter.id, value.input)}
              />
              {value.label} ({value.count})
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
