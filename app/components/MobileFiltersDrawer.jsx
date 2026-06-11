import React, {useEffect, useRef, useState} from 'react';
import {ShopifyFilterForm} from './FiltersDrawer';

export default function MobileFiltersDrawer({
  isOpen,
  onClose,
  filters,
  activeFiltersCount = 0,
}) {
  const drawerPanelRef = useRef(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const dragThreshold = 80;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
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

  const handleDragStart = (event) => {
    setDragging(true);
    const clientY = event.touches
      ? event.touches[0].clientY
      : event.clientY;
    startYRef.current = clientY;
  };

  const handleDragMove = (event) => {
    if (!dragging) return;

    const clientY = event.touches
      ? event.touches[0].clientY
      : event.clientY;
    currentYRef.current = clientY;
    const deltaY = clientY - startYRef.current;

    if (drawerPanelRef.current && deltaY > 0) {
      drawerPanelRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleDragEnd = () => {
    setDragging(false);
    const deltaY = currentYRef.current - startYRef.current;

    if (deltaY > dragThreshold) {
      onClose();
      return;
    }

    if (drawerPanelRef.current) {
      drawerPanelRef.current.style.transform = 'translateY(0)';
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
