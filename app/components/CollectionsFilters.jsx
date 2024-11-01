import { useLocation, useNavigate } from '@remix-run/react';

export function FilterComponent({ availableFilters, appliedFilters = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const handleFilterChange = (filterType, value) => {
    searchParams.set(`filter.${filterType}`, value);
    navigate(`?${searchParams.toString()}`);
  };

  return (
    <div>
      <h4>Filter By</h4>
      <nav>
        {availableFilters.map((filter) => (
          <div key={filter.id}>
            <h5>{filter.label}</h5>
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
      </nav>
    </div>
  );
}
