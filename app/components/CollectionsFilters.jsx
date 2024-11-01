import { useSearchParams } from '@remix-run/react';

export function FilterComponent({ availableFilters }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = (filterType, value) => {
    const filterKey = `filter.${filterType}`;
    const currentValue = searchParams.get(filterKey);

    if (currentValue === value) {
      // Remove filter if already selected
      searchParams.delete(filterKey);
    } else {
      // Set the correct key-value pair for the filter
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
