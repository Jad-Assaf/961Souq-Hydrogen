import { useState } from 'react';

export function FilterComponent({ availableFilters, onApplyFilters }) {
  const [selectedFilters, setSelectedFilters] = useState({});

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters((prevFilters) => {
      // Toggle filter selection
      const updatedFilters = { ...prevFilters };
      if (updatedFilters[filterType] === value) {
        delete updatedFilters[filterType];
      } else {
        updatedFilters[filterType] = value;
      }
      return updatedFilters;
    });
  };

  const applyFilters = () => {
    onApplyFilters(selectedFilters);
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
                    backgroundColor: selectedFilters[filter.type] === value.input ? 'blue' : 'gray',
                  }}
                >
                  {value.label} ({value.count})
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <button onClick={applyFilters}>Apply Filters</button>
    </div>
  );
}
