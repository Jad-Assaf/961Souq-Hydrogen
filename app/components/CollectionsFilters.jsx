import { useSearchParams } from '@remix-run/react';

export function FilterComponent({ availableFilters }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = (filterType, value) => {
    const filterKey = `filter.${filterType}`;

    // Check if the current filter is already selected
    const isSelected = searchParams.get(filterKey) === value;

    if (isSelected) {
      // Remove the filter if it's already selected
      searchParams.delete(filterKey);
    } else {
      // Set the filter with the correct key-value pair
      searchParams.set(filterKey, value);
    }

    setSearchParams(searchParams);
  };

  return (
    <div className="filters">
      {availableFilters.map((filter) => (
        <div key={filter.id} className="filter-group">
          <h4>{filter.label}</h4>
          {filter.values.map((value) => (
            <label key={value.id}>
              <input
                type="checkbox"
                checked={searchParams.get(`filter.${filter.type}`) === value.id}
                onChange={() => handleFilterChange(filter.type, value.id)}
              />
              {value.label} ({value.count})
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
