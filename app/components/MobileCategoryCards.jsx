// app/components/MobileCategoryTimeline.jsx
import React, {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate} from '@remix-run/react';

const PIN_STORAGE_KEY = '961souq:pinnedCategories:urls';
const PIN_LEGACY_KEYS = [
  '961souq:pinnedCategories:v2',
  '961souq:pinnedCategories:v1',
  '961souq:pinnedCategories',
];

// Ensure Remix treats menu links as internal routes
function normalizePath(url) {
  if (!url) return '#';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const u = new URL(url);
      return u.pathname + u.search + u.hash;
    } catch (_e) {
      return url;
    }
  }

  return url;
}

/**
 * Build:
 * - entries: top-level category cards (id = normalized URL)
 * - subLevelMap: map from subcategory URL -> array of sub-sub categories
 */
function buildCategoryModel(menu) {
  if (!menu || !menu.items) {
    return {entries: [], subLevelMap: {}};
  }

  const entries = [];
  const subLevelMap = {};

  menu.items.forEach((topItem) => {
    if (!topItem) return;

    const rawChildren = topItem.items || [];
    const children = rawChildren.filter(
      (child) =>
        child && child.url && child.url.indexOf('/collections/') !== -1,
    );

    const isTopCollection =
      topItem.url && topItem.url.indexOf('/collections/') !== -1;

    // For each child, capture its sub-sub categories (child.items)
    children.forEach((child) => {
      const childUrl = normalizePath(child.url);
      const rawSubSubs = child.items || [];
      const subSubs = rawSubSubs
        .filter(
          (sub) => sub && sub.url && sub.url.indexOf('/collections/') !== -1,
        )
        .map((sub) => {
          const normalized = normalizePath(sub.url);
          return {
            id: normalized,
            title: sub.title || 'Subcategory',
            url: normalized,
          };
        });

      if (subSubs.length) {
        subLevelMap[childUrl] = subSubs;
      }
    });

    const entryChildren = children.map((child) => {
      const normalized = normalizePath(child.url);
      return {
        id: normalized,
        title: child.title || 'Subcategory',
        url: normalized,
      };
    });

    const primaryUrlRaw = isTopCollection
      ? topItem.url
      : entryChildren[0]
      ? entryChildren[0].url
      : null;

    const primaryUrl = normalizePath(primaryUrlRaw || '');

    if (!primaryUrl || primaryUrl === '#') return;

    const entry = {
      id: primaryUrl, // stable ID = normalized URL
      title: topItem.title || 'Category',
      url: primaryUrl,
      children: entryChildren,
    };

    entries.push(entry);
  });

  // Deduplicate by url
  const seen = new Set();
  const deduped = [];
  for (const entry of entries) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    deduped.push(entry);
  }

  return {entries: deduped, subLevelMap};
}

export default function MobileCategoryTimeline({menu}) {
  const navigate = useNavigate();
  const {entries: items, subLevelMap} = useMemo(
    () => buildCategoryModel(menu),
    [menu],
  );

  const [query, setQuery] = useState('');
  const [pinnedIds, setPinnedIds] = useState([]);
  const [expandedSub, setExpandedSub] = useState(null); // {parentId, childUrl, childTitle}
  const [closingSub, setClosingSub] = useState(null); // same shape, used for close animation

  // Load pinned categories from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      let loaded = null;

      // Prefer new key, fall back to legacy keys
      const keysToCheck = [PIN_STORAGE_KEY, ...PIN_LEGACY_KEYS];
      for (const key of keysToCheck) {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            loaded = parsed.map((v) => String(v));
            break;
          }
        }
      }

      if (loaded) {
        const unique = Array.from(new Set(loaded));
        setPinnedIds(unique);
      }
    } catch (_e) {
      // ignore
    }
  }, []);

  // Persist pinned categories
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const unique = Array.from(new Set(pinnedIds.map((v) => String(v))));
      window.localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(unique));
    } catch (_e) {
      // ignore
    }
  }, [pinnedIds]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();

    return items.filter((entry) => {
      if (entry.title && entry.title.toLowerCase().includes(q)) return true;

      if (
        entry.children &&
        entry.children.some(
          (child) => child.title && child.title.toLowerCase().includes(q),
        )
      ) {
        return true;
      }

      return false;
    });
  }, [items, query]);

  const pinnedEntries = useMemo(
    () => items.filter((entry) => pinnedIds.includes(entry.id)),
    [items, pinnedIds],
  );

  const togglePinned = (id) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.concat(id),
    );
  };

  const handleSubClick = (entry, child) => {
    const childUrl = child.url;
    const parentId = entry.id;
    const subSubs = subLevelMap[childUrl] || [];

    // 2) If no sub-sub categories -> navigate immediately
    if (!subSubs.length) {
      navigate(childUrl);
      return;
    }

    const isCurrentlyExpanded =
      expandedSub &&
      expandedSub.parentId === parentId &&
      expandedSub.childUrl === childUrl;

    if (isCurrentlyExpanded) {
      // Start close animation
      setClosingSub(expandedSub);
      setExpandedSub(null);

      setTimeout(() => {
        setClosingSub(null);
      }, 220); // match CSS transition
      return;
    }

    // Open a new subcategory (replace any previous)
    setExpandedSub({
      parentId,
      childUrl,
      childTitle: child.title,
    });
    setClosingSub(null);
  };

  if (!items.length) return null;

  return (
    <section className="mcat-timeline">
      <header className="mcat-timeline__header">
        <div>
          <h2 className="mcat-timeline__title">Shop by category</h2>
          <p className="mcat-timeline__subtitle">
            Search, pin, and drill down into sections
          </p>
        </div>
        {filteredItems.length !== items.length && (
          <span className="mcat-timeline__counter">
            {filteredItems.length}/{items.length}
          </span>
        )}
      </header>

      {/* Search / filter */}
      <div className="mcat-timeline__search">
        <div className="mcat-timeline__search-inner">
          <span className="mcat-timeline__search-icon">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter categories…"
            className="mcat-timeline__search-input"
          />
          {query && (
            <button
              type="button"
              className="mcat-timeline__search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear category filter"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Pinned shortcuts */}
      {pinnedEntries.length > 0 && (
        <div className="mcat-timeline__pinned">
          <div className="mcat-timeline__pinned-labelRow">
            <span className="mcat-timeline__pinned-label">Pinned</span>
            {pinnedEntries.length > 1 && (
              <button
                type="button"
                className="mcat-timeline__pinned-clear"
                onClick={() => setPinnedIds([])}
              >
                Clear
              </button>
            )}
          </div>
          <div className="mcat-timeline__pinned-row">
            {pinnedEntries.map((entry) => (
              <Link
                key={`pinned-${entry.id}`}
                to={entry.url}
                prefetch="intent"
                className="mcat-timeline__pinned-chip"
              >
                <span className="mcat-timeline__pinned-dot" />
                <span className="mcat-timeline__pinned-text">
                  {entry.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stacked cards */}
      <div className="mcat-timeline__track">
        {filteredItems.map((entry, idx) => {
          const indexLabel = String(idx + 1).padStart(2, '0');
          const isPinned = pinnedIds.includes(entry.id);
          const totalSubs = entry.children?.length || 0;

          const isExpandedHere =
            expandedSub && expandedSub.parentId === entry.id;
          const isClosingHere = closingSub && closingSub.parentId === entry.id;

          const currentSubModel = isExpandedHere
            ? expandedSub
            : isClosingHere
            ? closingSub
            : null;

          const currentChildUrl = currentSubModel
            ? currentSubModel.childUrl
            : null;

          const nestedItems = currentChildUrl
            ? subLevelMap[currentChildUrl] || []
            : [];

          const shouldRenderNested = currentSubModel && nestedItems.length > 0;

          return (
            <div
              key={entry.id || entry.url || idx}
              className="mcat-timeline__row"
            >
              <div className="mcat-timeline__card">
                <div className="mcat-timeline__cardMain">
                  <div className="mcat-timeline__marker">
                    <span className="mcat-timeline__index">{indexLabel}</span>
                  </div>

                  <Link
                    to={entry.url}
                    prefetch="intent"
                    className="mcat-timeline__itemMain"
                  >
                    <div className="mcat-timeline__body">
                      <div className="mcat-timeline__name">{entry.title}</div>

                      {entry.children && entry.children.length > 0 && (
                        <>
                          <div className="mcat-timeline__sublabel">
                            {entry.children
                              .map((child) => child.title)
                              .slice(0, 3)
                              .join(' • ')}
                            {entry.children.length > 3 ? ' …' : ''}
                          </div>
                          <div className="mcat-timeline__meta">
                            {totalSubs} subcategories
                          </div>
                        </>
                      )}
                    </div>
                    <div className="mcat-timeline__arrow">
                      <span>↗</span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    className={
                      'mcat-timeline__pin' +
                      (isPinned ? ' mcat-timeline__pin--active' : '')
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      togglePinned(entry.id);
                    }}
                    aria-label={isPinned ? 'Unpin category' : 'Pin category'}
                  >
                    {isPinned ? '★' : '☆'}
                  </button>
                </div>

                {/* First-level subcategories (chips) */}
                {entry.children && entry.children.length > 0 && (
                  <div className="mcat-timeline__subchips">
                    {entry.children.slice(0, 20).map((child) => {
                      const isActive =
                        isExpandedHere &&
                        expandedSub &&
                        expandedSub.childUrl === child.url;

                      return (
                        <button
                          key={child.id}
                          type="button"
                          className={
                            'mcat-timeline__subchip' +
                            (isActive ? ' mcat-timeline__subchip--active' : '')
                          }
                          onClick={() => handleSubClick(entry, child)}
                        >
                          {child.title}
                        </button>
                      );
                    })}

                    {entry.children.length > 20 && (
                      <span className="mcat-timeline__subchip mcat-timeline__subchip--more">
                        +{entry.children.length - 20} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Nested row wrapper with animation */}
              {shouldRenderNested && (
                <div
                  className={
                    'mcat-timeline__nestedWrap ' +
                    (isExpandedHere ? 'mcat-timeline__nestedWrap--open ' : '') +
                    (isClosingHere ? 'mcat-timeline__nestedWrap--closing' : '')
                  }
                >
                  <div className="mcat-timeline__row mcat-timeline__row--nested">
                    <div className="mcat-timeline__card mcat-timeline__card--nested">
                      <div className="mcat-timeline__cardMain mcat-timeline__cardMain--nested">
                        <div className="mcat-timeline__marker mcat-timeline__marker--nested">
                          <span className="mcat-timeline__index">→</span>
                        </div>
                        <div className="mcat-timeline__body">
                          <div className="mcat-timeline__name">
                            {currentSubModel.childTitle}
                          </div>
                          <div className="mcat-timeline__meta">
                            {nestedItems.length} sub-sub categories
                          </div>
                        </div>
                        <Link
                          to={currentChildUrl}
                          prefetch="intent"
                          className="mcat-timeline__arrow mcat-timeline__arrow--nestedLink"
                        >
                          <span>↗</span>
                        </Link>
                      </div>

                      <div className="mcat-timeline__subchips mcat-timeline__subchips--nested">
                        {nestedItems.slice(0, 20).map((sub) => (
                          <Link
                            key={sub.id}
                            to={sub.url}
                            prefetch="intent"
                            className="mcat-timeline__subchip mcat-timeline__subchip--nested"
                          >
                            {sub.title}
                          </Link>
                        ))}

                        {nestedItems.length > 20 && (
                          <span className="mcat-timeline__subchip mcat-timeline__subchip--more">
                            +{nestedItems.length - 20} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
