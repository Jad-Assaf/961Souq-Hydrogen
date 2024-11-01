import { useSearchParams } from '@remix-run/react';

export function FilterComponent({ availableFilters }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = (filterType, value) => {
    searchParams.set(filterType, value);
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
                checked={searchParams.get(filter.type) === value.id}
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
