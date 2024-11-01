import { useLocation, useNavigate, useSearchParams } from '@remix-run/react';

export function FilterComponent({ availableFilters }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleFilterChange = (filterType, value) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set(`filter.${filterType}`, value);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  return (
    <div className="filters">
      {availableFilters.map((filter) => (
        <div key={filter.id} className="filter-group">
          <h4>{filter.label}</h4>
          {filter.values.map((option) => (
            <button
              key={option.id}
              onClick={() => handleFilterChange(filter.id, option.input)}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
