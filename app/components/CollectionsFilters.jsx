import { useLocation, useNavigate } from '@remix-run/react';

export function DynamicFilterComponent({ filters }) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const handleFilterChange = (filterType, value) => {
    if (value) {
      searchParams.set(`filter.${filterType}`, value);
    } else {
      searchParams.delete(`filter.${filterType}`);
    }
    navigate(`?${searchParams.toString()}`);
  };

  return (
    <div>
      {filters.map((filter) => (
        <div key={filter.id}>
          <h3>{filter.label}</h3>
          <button onClick={() => handleFilterChange(filter.type, null)}>All {filter.label}</button>
          {filter.values.map((option) => (
            <button
              key={option.id}
              onClick={() => handleFilterChange(filter.type, option.input)}
              style={{
                fontWeight: option.input === searchParams.get(`filter.${filter.type}`) ? 'bold' : 'normal',
              }}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
