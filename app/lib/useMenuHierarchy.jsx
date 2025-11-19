// app/hooks/useMenuHierarchy.jsx
import {useCallback, useEffect, useRef, useState} from 'react';
import {useFetcher} from '@remix-run/react';

/**
 * Dynamic hierarchical menu / collection logic
 *
 * - Level 0: topLevelCollections (from the page loader, e.g. Apple menu).
 * - When a collection at depth D is selected, we:
 *    → try to load a submenu from menu(handle = collection.handle)
 *    → if submenu exists → create depth D+1 with those collections
 *    → if no submenu → this collection is the leaf; show its products
 *
 * Supports unlimited depth until menus stop.
 * No layout / classnames here – routes render whatever they want.
 */
export function useMenuHierarchy(topLevelCollections, options) {
  const {submenuPath = '/api/menu-submenu'} = options || {};

  // levels = [{ collections, selectedIndex, parentHandle }, ...]
  const [levels, setLevels] = useState([]);
  const [leafCollection, setLeafCollection] = useState(null);

  const productsSectionRef = useRef(null);
  const scrollOnNextLeafRef = useRef(false);

  const fetcher = useFetcher();
  const pendingRef = useRef(null); // { depth, handle, parentCollection }

  const levelsRef = useRef(levels);
  useEffect(() => {
    levelsRef.current = levels;
  }, [levels]);

  // Keep level 0 in sync with topLevelCollections
  useEffect(() => {
    if (!topLevelCollections || topLevelCollections.length === 0) {
      setLevels([]);
      setLeafCollection(null);
      pendingRef.current = null;
      return;
    }

    setLevels((prev) => {
      const prevRoot = prev[0];
      let selectedIndex = null;

      // Try to preserve previous root selection if still valid
      if (prevRoot && prevRoot.selectedIndex != null) {
        const idx = prevRoot.selectedIndex;
        if (idx >= 0 && idx < topLevelCollections.length) {
          selectedIndex = idx;
        }
      }

      return [
        {
          collections: topLevelCollections,
          selectedIndex,
          parentHandle: null,
        },
      ];
    });
  }, [topLevelCollections]);

  const selectLevel = useCallback(
    (depth, index, {scrollToProducts = true} = {}) => {
      const currentLevels = levelsRef.current;
      if (depth < 0 || depth >= currentLevels.length) return;

      const level = currentLevels[depth];
      if (!level) return;
      if (index < 0 || index >= level.collections.length) return;

      const selected = level.collections[index];

      // ✅ Only change the selectedIndex at this depth.
      // Don’t drop deeper levels here – let the fetch result decide that.
      setLevels((prev) => {
        if (depth >= prev.length) return prev;
        return prev.map((lvl, lvlIndex) =>
          lvlIndex === depth ? {...lvl, selectedIndex: index} : lvl,
        );
      });

      scrollOnNextLeafRef.current = scrollToProducts;

      if (!selected?.handle) {
        // No handle => treat as leaf
        setLeafCollection(selected);
        pendingRef.current = null;
        return;
      }

      const handle = selected.handle;

      // Reuse existing submenu at depth+1 if it's for the same handle
      const existingNext = currentLevels[depth + 1];
      if (existingNext && existingNext.parentHandle === handle) {
        const hasSubmenu = existingNext.collections.length > 0;
        setLeafCollection(hasSubmenu ? null : selected);
        pendingRef.current = null;
        return;
      }

      // Otherwise, fetch submenu for this handle
      pendingRef.current = {depth, handle, parentCollection: selected};
      fetcher.load(`${submenuPath}?handle=${encodeURIComponent(handle)}`);
    },
    [fetcher, submenuPath],
  );

  // Handle submenu results
  useEffect(() => {
    const data = fetcher.data;
    if (!data || !data.handle) return;

    const pending = pendingRef.current;
    if (!pending || data.handle !== pending.handle) return;

    const {depth, handle, parentCollection} = pending;
    const subCols = data.collections || [];

    setLevels((prev) => {
      if (depth < 0 || depth >= prev.length) {
        return prev;
      }

      const before = prev.slice(0, depth + 1);
      const newLevels = [...before];

      if (subCols.length > 0) {
        const childLevel = {
          collections: subCols,
          selectedIndex: null,
          parentHandle: handle,
        };
        newLevels.push(childLevel);
      }

      return newLevels;
    });

    if (subCols.length === 0) {
      // No submenu → parent is leaf
      setLeafCollection(parentCollection);
    } else {
      setLeafCollection(null);
    }

    pendingRef.current = null;
  }, [fetcher.data]);

  // Scroll to products when a leaf is resolved (if requested)
  useEffect(() => {
    if (
      leafCollection &&
      scrollOnNextLeafRef.current &&
      productsSectionRef.current
    ) {
      productsSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      scrollOnNextLeafRef.current = false;
    }
  }, [leafCollection]);

  const activeCollection = leafCollection;
  const activeProducts = activeCollection?.products?.nodes || [];

  // Useful if you want breadcrumbs later
  const selectedPath = levels
    .map((lvl) =>
      lvl.selectedIndex != null && lvl.selectedIndex < lvl.collections.length
        ? lvl.collections[lvl.selectedIndex]
        : null,
    )
    .filter(Boolean);

  return {
    levels,
    activeCollection,
    activeProducts,
    selectedPath,
    selectLevel,
    productsSectionRef,
  };
}
