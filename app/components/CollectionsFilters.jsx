import { useState } from 'react';
import { useLoaderData, Form } from '@remix-run/react';

export default function CollectionFilters() {
  const { collection } = useLoaderData();
  const [selectedFilters, setSelectedFilters] = useState({});

  const handleFilterChange = (filterName, value) => {
    setSelectedFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: value,
    }));
  };

  return (
    <Form method="get">
      {collection.filters.map((filter) => (
        <details key={filter.label}>
          <summary>
            <div>
              <span>{filter.label}</span>
              {filter.active_values?.length > 0 && <span>({filter.active_values.length})</span>}
            </div>
          </summary>
          <div>
            <p>{filter.active_values?.length || 0} selected</p>
            {filter.active_values?.length > 0 && (
              <p>
                <a href={filter.url_to_remove}>Reset</a>
              </p>
            )}
            {filter.type === 'boolean' && (
              <ul>
                {[filter.true_value, filter.false_value].map((option, index) => (
                  <li key={index}>
                    <label>
                      <input
                        type="checkbox"
                        name={filter.param_name}
                        value={option.value}
                        checked={option.active}
                        onChange={() => handleFilterChange(filter.param_name, option.value)}
                      />
                      {option.label}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {filter.type === 'list' && (
              <ul>
                {filter.values.map((option, index) => (
                  <li key={index}>
                    <label>
                      <input
                        type="checkbox"
                        name={option.param_name}
                        value={option.value}
                        checked={option.active}
                        onChange={() => handleFilterChange(option.param_name, option.value)}
                      />
                      {option.label}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {filter.type === 'price_range' && (
              <div>
                <label>
                  From
                  <input
                    type="number"
                    name={filter.min_value.param_name}
                    value={selectedFilters[filter.min_value.param_name] || ''}
                    onChange={(e) =>
                      handleFilterChange(filter.min_value.param_name, e.target.value)
                    }
                  />
                </label>
                <label>
                  To
                  <input
                    type="number"
                    name={filter.max_value.param_name}
                    value={selectedFilters[filter.max_value.param_name] || ''}
                    onChange={(e) =>
                      handleFilterChange(filter.max_value.param_name, e.target.value)
                    }
                  />
                </label>
              </div>
            )}
          </div>
        </details>
      ))}
      <button type="submit">Apply Filters</button>
      <button type="reset" onClick={() => setSelectedFilters({})}>
        Clear all
      </button>
    </Form>
  );
}