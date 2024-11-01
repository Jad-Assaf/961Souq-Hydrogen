import React from 'react';

export function FilterComponent({ availableFilters, onFilterChange }) {
  return (
    <div className="filter-panel">
      <h3>Filter By</h3>
      {availableFilters.map((filter) => (
        <div key={filter.id} className="filter-group">
          <label>{filter.label}</label>
          <select
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
            defaultValue=""
          >
            <option value="">All</option>
            {filter.values.map((value) => (
              <option key={value.id} value={value.input}>
                {value.label} ({value.count})
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
