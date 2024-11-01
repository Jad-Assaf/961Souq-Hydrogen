import { useLocation, useNavigate } from '@remix-run/react';

export function FilterComponent({ availableFilters }) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const handleFilterChange = (filterType, value) => {
    // Toggle filter selection
    const current = searchParams.get(`filter.${filterType}`);
    if (current === value) {
      searchParams.delete(`filter.${filterType}`); // Remove if already selected
    } else {
      searchParams.set(`filter.${filterType}`, value); // Add new filter
    }

    // Update URL to trigger re-fetching of filtered data
    navigate(`${location.pathname}?${searchParams.toString()}`);
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
                  style={{
                    backgroundColor: searchParams.get(`filter.${filter.type}`) === value.input ? 'blue' : 'gray',
                  }}
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
