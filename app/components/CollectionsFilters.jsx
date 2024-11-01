import React from 'react';

/**
 * FilterComponent renders available filters and calls onFilterChange when a filter is selected.
 * @param {Object} props
 * @param {Array} props.availableFilters - Filters available for the collection.
 * @param {Function} props.onFilterChange - Callback to handle filter changes.
 */
export function FilterComponent({ availableFilters, onFilterChange }) {
  if (!availableFilters || availableFilters.length === 0) {
    return null; // No filters available, return nothing
  }

  return (
    <div className="filter-component">
      <h2>Filter By</h2>
      {availableFilters.map((filter) => (
        <div key={filter.id} className="filter-group">
          <label htmlFor={filter.id}>{filter.label}</label>
          <select
            id={filter.id}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
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
