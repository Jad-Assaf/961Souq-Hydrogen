import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  CollectionCircles,
  appleMenu,
  audioMenu,
  camerasMenu,
  fitnessMenu,
  gamingMenu,
  homeAppliancesMenu,
  laptopsMenu,
  mobilesMenu,
  monitorsMenu,
  tabletsMenu,
} from '~/components/CollectionCircles';
import {CategorySliderFromMenu} from '~/components/CategorySliderFromMenu';
import {TopProductSections} from '~/components/TopProductSections';

const DESKTOP_GROUPS = [
  {key: 'apple', menu: appleMenu, fallbackTitle: 'Apple'},
  {key: 'gaming', menu: gamingMenu, fallbackTitle: 'Gaming'},
  {key: 'laptops', menu: laptopsMenu, fallbackTitle: 'Laptops'},
  {key: 'monitors', menu: monitorsMenu, fallbackTitle: 'Monitors'},
  {key: 'mobiles', menu: mobilesMenu, fallbackTitle: 'Mobiles'},
  {key: 'tablets', menu: tabletsMenu, fallbackTitle: 'Tablets'},
  {key: 'audio', menu: audioMenu, fallbackTitle: 'Audio'},
  {key: 'fitness', menu: fitnessMenu, fallbackTitle: 'Fitness'},
  {key: 'cameras', menu: camerasMenu, fallbackTitle: 'Cameras'},
  {
    key: 'homeAppliances',
    menu: homeAppliancesMenu,
    fallbackTitle: 'Home Appliances',
  },
];

const getHandleFromUrl = (url) => {
  const parts = String(url || '').split('/collections/');
  if (parts.length < 2) return '';
  let handle = parts[1].toLowerCase();
  if (handle.endsWith('/')) {
    handle = handle.slice(0, -1);
  }
  return handle;
};

function runWhenIdle(task, timeout = 2500) {
  if (typeof window === 'undefined') return () => {};

  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(task, {timeout});
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(task, 250);
  return () => window.clearTimeout(id);
}

function TopProductPlaceholder({title, handle, count = 6}) {
  return (
    <div className="collection-section">
      <div className="collection-header">
        <p className="home-colleciton-title">{title}</p>
        <div className="collection-header-right">
          {handle ? (
            <a className="view-all-link" href={`/collections/${handle}`}>
              View All
            </a>
          ) : null}
        </div>
      </div>

      <div className="collection-products-row">
        {Array.from({length: count}).map((_, index) => (
          <div key={index} className="product-item">
            <div className="product-card skeleton product-card--placeholder">
              <div className="skeleton-img skeleton-img--card" />
              <div className="skeleton-block skeleton-block--title" />
              <div className="skeleton-block skeleton-block--price" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomeDesktopCollections({
  header,
  fullTopProducts,
  loadingHandles,
  hasLoadedHandle,
  ensureCollectionLoaded,
}) {
  const [selectedItems, setSelectedItems] = useState(() => ({
    apple: appleMenu[0],
    gaming: gamingMenu[0],
    laptops: laptopsMenu[0],
    monitors: monitorsMenu[0],
    mobiles: mobilesMenu[0],
    tablets: tabletsMenu[0],
    audio: audioMenu[0],
    fitness: fitnessMenu[0],
    cameras: camerasMenu[0],
    homeAppliances: homeAppliancesMenu[0],
  }));

  const desktopMenuHandles = useMemo(() => {
    return [
      ...new Set(
        DESKTOP_GROUPS.flatMap(({menu}) =>
          menu.map((item) => getHandleFromUrl(item?.url || '')).filter(Boolean),
        ),
      ),
    ];
  }, []);

  useEffect(() => {
    if (!desktopMenuHandles.length) return;

    const cancelIdle = runWhenIdle(() => {
      desktopMenuHandles.forEach((handle) => {
        if (!hasLoadedHandle(handle)) {
          ensureCollectionLoaded(handle);
        }
      });
    });

    return cancelIdle;
  }, [desktopMenuHandles, hasLoadedHandle, ensureCollectionLoaded]);

  const buildSelectHandler = useCallback(
    (groupKey) => (item) => {
      setSelectedItems((prev) => ({...prev, [groupKey]: item}));
      ensureCollectionLoaded(getHandleFromUrl(item?.url || ''));
    },
    [ensureCollectionLoaded],
  );

  const renderCollectionSection = useCallback(
    ({menu, selectedItem, onSelect, fallbackTitle}) => {
      const visibleMenu = menu.filter((item) => {
        const menuHandle = getHandleFromUrl(item?.url || '');
        if (!menuHandle) return false;
        if (!hasLoadedHandle(menuHandle)) return true;
        return Boolean(fullTopProducts[menuHandle]);
      });
      if (!visibleMenu.length) return null;

      const selectedHandle = getHandleFromUrl(selectedItem?.url || '');
      const resolvedSelectedItem =
        visibleMenu.find(
          (item) => getHandleFromUrl(item?.url || '') === selectedHandle,
        ) || visibleMenu[0];
      const handle = getHandleFromUrl(resolvedSelectedItem?.url || '');
      const collection = handle ? fullTopProducts[handle] : null;
      const isLoading = handle ? !!loadingHandles[handle] : false;
      const title =
        resolvedSelectedItem?.title || fallbackTitle || 'Collection';

      return (
        <React.Fragment key={`${fallbackTitle}-${handle || 'empty'}`}>
          <CollectionCircles
            collections={visibleMenu}
            selectedCollection={resolvedSelectedItem}
            onCollectionSelect={onSelect}
          />
          {resolvedSelectedItem && collection ? (
            <TopProductSections key={handle} collection={collection} />
          ) : isLoading ? (
            <TopProductPlaceholder
              key={`${handle}-placeholder`}
              title={title}
              handle={handle}
            />
          ) : null}
        </React.Fragment>
      );
    },
    [fullTopProducts, hasLoadedHandle, loadingHandles],
  );

  return (
    <>
      {header ? <CategorySliderFromMenu menu={header.menu} /> : null}
      {DESKTOP_GROUPS.map(({key, menu, fallbackTitle}) =>
        renderCollectionSection({
          menu,
          selectedItem: selectedItems[key],
          onSelect: buildSelectHandler(key),
          fallbackTitle,
        }),
      )}
    </>
  );
}
