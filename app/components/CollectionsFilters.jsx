import { useLocation, useNavigate } from '@remix-run/react';

export function FilterComponent({ availableFilters }) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const handleFilterChange = (filterType, value) => {
    // Set or update the filter in the search params
    searchParams.set(`filter.${filterType}`, value);

    // Trigger navigation to update the URL and trigger data reloading
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
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
