import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useSearchParams, useNavigate} from '@remix-run/react';

export function ShopifyFilterForm({filters}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // State to track which filter sections are expanded.
  // Each key is a filter id with a boolean value.
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (filterId, currentState) => {
    setExpandedSections((prev) => ({
      ...prev,
      [filterId]: !currentState,
    }));
  };

  /**
   * Convert filter id into URL key.
   *  - "filter.vendor"      -> "productVendor"
   *  - "filter.p.m.xxx"     -> "productMetafield"
   *  - anything else        -> the substring after "filter."
   */
  const getUrlKey = (filterId) => {
    let key = filterId.replace(/^filter\./, '');
    if (key.toLowerCase().includes('vendor')) {
      return 'productVendor';
    }
    if (key.includes('p.m.')) {
      return 'productMetafield';
    }
    return key;
  };

  /**
   * Normalize filter value to the exact string stored in URLSearchParams.
   * Keeps render path cheap and avoids repeated JSON parsing for each rerender.
   */
  const normalizeFilterInput = (urlKey, inputValue) => {
    if (urlKey === 'productVendor') {
      if (
        typeof inputValue === 'string' &&
        inputValue.trim().startsWith('{') &&
        inputValue.trim().endsWith('}')
      ) {
        try {
          const parsed = JSON.parse(inputValue);
          return `"${parsed?.productVendor || ''}"`;
        } catch {
          return inputValue;
        }
      }

      if (typeof inputValue === 'object' && inputValue !== null) {
        return `"${inputValue.productVendor || ''}"`;
      }

      if (typeof inputValue === 'string') {
        return inputValue.startsWith('"') && inputValue.endsWith('"')
          ? inputValue
          : `"${inputValue}"`;
      }
    }

    if (typeof inputValue === 'string') return inputValue;
    if (inputValue == null) return '';
    return JSON.stringify(inputValue);
  };

  const normalizedFilterValues = useMemo(() => {
    const valuesByFilterId = new Map();

    for (const filter of filters || []) {
      const urlKey = getUrlKey(filter.id);
      const valueMap = new Map();

      for (const value of filter.values || []) {
        valueMap.set(value.id, normalizeFilterInput(urlKey, value.input));
      }

      valuesByFilterId.set(filter.id, valueMap);
    }

    return valuesByFilterId;
  }, [filters]);

  /**
   * Handle a filter checkbox change.
   * Accepts the filter id, normalized input value, and checked state.
   */
  const handleFilterChange = (filterId, inputValue, checked) => {
    const newParams = new URLSearchParams(searchParams);
    const urlKey = getUrlKey(filterId);

    // For the "All" (blank) option, clear all values for the key.
    if (inputValue === '') {
      newParams.delete(`filter.${urlKey}`);
    } else {
      // Get all current values for this filter key.
      const existingValues = newParams.getAll(`filter.${urlKey}`);
      if (checked) {
        // If the value is not already present, add it.
        if (!existingValues.includes(inputValue)) {
          newParams.append(`filter.${urlKey}`, inputValue);
        }
      } else {
        // Remove the value from the list.
        newParams.delete(`filter.${urlKey}`);
        const updatedValues = existingValues.filter(
          (val) => val !== inputValue,
        );
        updatedValues.forEach((val) =>
          newParams.append(`filter.${urlKey}`, val),
        );
      }
    }

    // Clear pagination parameters when filters change.
    newParams.delete('direction');
    newParams.delete('cursor');

    navigate(`?${newParams.toString()}`, {
      replace: true,
      preventScrollReset: true,
    });
  };

  const selectedFilterCount = useMemo(() => {
    const uniqueFilterKeys = Array.from(
      new Set(
        [...searchParams.keys()].filter((key) => key.startsWith('filter.')),
      ),
    );

    return uniqueFilterKeys.reduce(
      (count, key) => count + searchParams.getAll(key).length,
      0,
    );
  }, [searchParams]);

  const handleClearAllFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    const keysToDelete = Array.from(
      new Set([...newParams.keys()].filter((key) => key.startsWith('filter.'))),
    );

    keysToDelete.forEach((key) => newParams.delete(key));
    newParams.delete('direction');
    newParams.delete('cursor');

    navigate(`?${newParams.toString()}`, {
      replace: true,
      preventScrollReset: true,
    });
  };

  return (
    <div className="p-4 side-filter">
      <div className="filters-panel-header">
        <div className="filters-panel-header-text">
          <h3>Filters</h3>
          <p>
            {selectedFilterCount > 0
              ? `${selectedFilterCount} selected`
              : 'Choose filters'}
          </p>
        </div>
        {selectedFilterCount > 0 ? (
          <button
            type="button"
            className="filters-clear-btn"
            onClick={handleClearAllFilters}
          >
            Clear all
          </button>
        ) : null}
      </div>

      {filters.map((filter) => {
        const urlKey = getUrlKey(filter.id);
        const sectionId = `filter-section-${filter.id.replace(
          /[^a-zA-Z0-9_-]/g,
          '-',
        )}`;
        // Get all current values for this filter key.
        const currentValues = new Set(
          searchParams.getAll(`filter.${urlKey}`) || [],
        );
        const activeValuesCount = currentValues.size;
        // Check if this section is expanded; default is false (closed).
        const isExpanded = expandedSections[filter.id] ?? activeValuesCount > 0;

        return (
          <div key={filter.id} className="mb-4 pb-2 collection-filter-section">
            <button
              type="button"
              className="collection-filter-trigger"
              onClick={() => toggleSection(filter.id, isExpanded)}
              aria-expanded={isExpanded}
              aria-controls={sectionId}
            >
              <span className="filter-title font-bold">{filter.label}</span>
              <span className="collection-filter-meta">
                {activeValuesCount > 0 ? (
                  <span className="collection-filter-selected-count">
                    {activeValuesCount}
                  </span>
                ) : null}
                <span
                  className={`collection-filter-chevron ${
                    isExpanded ? 'is-open' : ''
                  }`}
                >
                  ›
                </span>
              </span>
            </button>
            {/* Always render the container and animate max-height and opacity */}
            <div
              id={sectionId}
              className={`overflow-auto transition-all duration-100 filters-div collection-filter-values-wrap ${
                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="flex flex-wrap mt-2 collection-filter-values">
                {filter.values.map((value) => {
                  const normalizedValue =
                    normalizedFilterValues.get(filter.id)?.get(value.id) ??
                    normalizeFilterInput(urlKey, value.input);

                  // Check if the normalized value is in the array of current values.
                  const isActive = currentValues.has(normalizedValue);

                  return (
                    <label
                      key={value.id}
                      className={`filters-container mr-2 mb-2 ${
                        isActive ? 'is-active' : ''
                      }`}
                    >
                      {value.label}{' '}
                      <span className="value-count">({value.count})</span>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) =>
                          handleFilterChange(
                            filter.id,
                            normalizedValue,
                            e.target.checked,
                          )
                        }
                      />
                      <span className="checkmark"></span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FiltersDrawer({
  isOpen,
  onClose,
  filters,
  activeFiltersCount = 0,
}) {
  const drawerPanelRef = useRef(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const dragThreshold = 80; // pixels to pull down to close

  // Disable background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset transform when the drawer is opened
      if (drawerPanelRef.current) {
        drawerPanelRef.current.style.transform = 'translateY(0)';
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handlers for dragging the drawer handle
  const handleDragStart = (e) => {
    setDragging(true);
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
  };

  const handleDragMove = (e) => {
    if (!dragging) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    currentYRef.current = clientY;
    const deltaY = clientY - startYRef.current;
    if (drawerPanelRef.current && deltaY > 0) {
      // Only allow dragging downward
      drawerPanelRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleDragEnd = () => {
    setDragging(false);
    const deltaY = currentYRef.current - startYRef.current;
    if (deltaY > dragThreshold) {
      // Close the drawer if dragged down beyond the threshold
      onClose();
    } else {
      // Reset to fully open if not dragged enough
      if (drawerPanelRef.current) {
        drawerPanelRef.current.style.transform = 'translateY(0)';
      }
    }
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleOverlayKeyDown = (event) => {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className={`drawer-overlay ${isOpen ? 'open' : ''}`}
      onClick={handleOverlayClick}
      onKeyDown={handleOverlayKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Close filters drawer"
    >
      {/* Prevent clicks on the drawer panel from closing the drawer */}
      <div
        ref={drawerPanelRef}
        className={`drawer-panel ${isOpen ? 'open' : ''}`}
      >
        <div className="drawer-header-row">
          <h3>
            Filters
            {activeFiltersCount > 0 ? (
              <span className="drawer-active-count">{activeFiltersCount}</span>
            ) : null}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="drawer-close-btn"
            aria-label="Close filters"
          >
            ×
          </button>
        </div>
        <button
          type="button"
          className="drawer-header"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onMouseMove={handleDragMove}
          onTouchMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onTouchEnd={handleDragEnd}
          aria-label="Drag down to close filters drawer"
        >
          <div className="drawer-handle"></div>
        </button>
        <ShopifyFilterForm filters={filters} />
      </div>
    </div>
  );
}
