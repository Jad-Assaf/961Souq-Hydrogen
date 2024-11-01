import { useSearchParams } from "@remix-run/react";

export function FilterComponent({ availableFilters }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = (filterType, value) => {
    searchParams.set(filterType, value);
    setSearchParams(searchParams);
  };

  return (
    <div className="filters">
      {availableFilters.map((filter) => (
        <div key={filter.id}>
          <h4>{filter.label}</h4>
          {filter.values.map((value) => (
            <label key={value}>
              <input
                type="checkbox"
                checked={searchParams.get(filter.type) === value}
                onChange={() => handleFilterChange(filter.type, value)}
              />
              {value}
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
