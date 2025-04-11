import React, {useEffect, useRef, useState} from 'react';
import {useSearchParams, useNavigate} from '@remix-run/react';

export function ShopifyFilterForm({filters}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // State to track which filter sections are expanded.
  // Each key is a filter id with a boolean value.
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (filterId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [filterId]: !prev[filterId],
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
   * Handle a filter checkbox change.
   * Accepts the filter id, the raw input value, and the checkbox checked state.
   */
  const handleFilterChange = (filterId, inputValue, checked) => {
    const newParams = new URLSearchParams(searchParams);
    const urlKey = getUrlKey(filterId);

    // For vendor filters, ensure the value is a plain string (wrapped in quotes)
    if (urlKey === 'productVendor') {
      if (
        typeof inputValue === 'string' &&
        inputValue.trim().startsWith('{') &&
        inputValue.trim().endsWith('}')
      ) {
        try {
          const parsed = JSON.parse(inputValue);
          if (parsed && parsed.productVendor) {
            inputValue = `"${parsed.productVendor}"`;
          }
        } catch (error) {
          console.error('Error parsing vendor filter input:', error);
        }
      } else {
        if (!inputValue.startsWith('"') || !inputValue.endsWith('"')) {
          inputValue = `"${inputValue}"`;
        }
      }
    }

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

    navigate(`?${newParams.toString()}`, {replace: true});
  };

  return (
    <div className="p-4">
      {filters.map((filter) => {
        const urlKey = getUrlKey(filter.id);
        // Get all current values for this filter key.
        const currentValues = searchParams.getAll(`filter.${urlKey}`) || [];
        // Check if this section is expanded; default is false (closed).
        const isExpanded = expandedSections[filter.id] || false;

        return (
          <div key={filter.id} className="mb-4 pb-2">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection(filter.id)}
            >
              <p className="filter-title font-bold">{filter.label}</p>
              <span>{isExpanded ? '-' : '+'}</span>
            </div>
            {/* Always render the container and animate max-height and opacity */}
            <div
              className={`overflow-auto transition-all duration-100 filters-div ${
                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="flex flex-wrap mt-2">
                {filter.values.map((value) => {
                  let normalizedValue = '';
                  if (urlKey === 'productVendor') {
                    // Extract the vendor value whether input is an object or JSON string.
                    if (typeof value.input === 'object') {
                      normalizedValue = value.input.productVendor;
                    } else if (
                      typeof value.input === 'string' &&
                      value.input.trim().startsWith('{') &&
                      value.input.trim().endsWith('}')
                    ) {
                      try {
                        const parsed = JSON.parse(value.input);
                        normalizedValue = parsed.productVendor;
                      } catch (error) {
                        console.error(
                          'Error parsing vendor filter input in render:',
                          error,
                        );
                        normalizedValue = value.input;
                      }
                    } else {
                      normalizedValue = value.input;
                    }
                    // In the URL, vendor filters are stored wrapped in quotes.
                    normalizedValue = `"${normalizedValue}"`;
                  } else {
                    normalizedValue = value.input;
                  }

                  // Check if the normalized value is in the array of current values.
                  const isActive = currentValues.includes(normalizedValue);

                  return (
                    <label
                      key={value.id}
                      className="filters-container mr-2 mb-2"
                    >
                      {value.label} <span className='value-count'>({value.count})</span>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) =>
                          handleFilterChange(
                            filter.id,
                            value.input,
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

export function FiltersDrawer({isOpen, onClose, filters}) {
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

  return (
    <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      {/* Prevent clicks on the drawer panel from closing the drawer */}
      <div
        ref={drawerPanelRef}
        className={`drawer-panel ${isOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="drawer-header"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onMouseMove={handleDragMove}
          onTouchMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onTouchEnd={handleDragEnd}
        >
          <div className="drawer-handle"></div>
        </div>
        <ShopifyFilterForm filters={filters} />
      </div>
    </div>
  );
}
