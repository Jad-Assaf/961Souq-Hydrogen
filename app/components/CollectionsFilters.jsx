import { useSearchParams } from '@remix-run/react';

export function FilterComponent({ availableFilters }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = (filterType, value) => {
    const filterKey = `filter.${filterType}`;

    // Manage multiple filters for the same type
    const currentValues = searchParams.getAll(filterKey);
    const isSelected = currentValues.includes(value);

    if (isSelected) {
      searchParams.delete(filterKey);
      currentValues.filter((v) => v !== value).forEach((v) => searchParams.append(filterKey, v));
    } else {
      searchParams.append(filterKey, value);
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
                checked={searchParams.getAll(`filter.${filter.type}`).includes(value.id)}
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
