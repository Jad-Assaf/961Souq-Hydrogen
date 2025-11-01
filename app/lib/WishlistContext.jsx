// app/lib/WishlistContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'wishlist:v1';

function safeRead() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function safeWrite(items) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // Do NOT construct/dispatch StorageEvent manually — it’s not supported consistently
  } catch {}
}

export function WishlistProvider({children}) {
  // Stable hook order; no conditional returns
  const [items, setItems] = useState(() => safeRead());

  // Sync from other tabs only (native `storage` event works cross-tab)
  useEffect(() => {
    function onStorage(e) {
      if (e.key === STORAGE_KEY) {
        // Re-read whole list
        setItems(safeRead());
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }
  }, []);

  const contains = useCallback(
    (productId) => items.some((i) => i.productId === productId),
    [items],
  );

  const add = useCallback((entry) => {
    if (!entry?.productId) return;
    setItems((prev) => {
      if (prev.some((i) => i.productId === entry.productId)) return prev;
      const next = [{...entry, addedAt: Date.now()}, ...prev];
      safeWrite(next);
      return next;
    });
  }, []);

  const remove = useCallback((productId) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      safeWrite(next);
      return next;
    });
  }, []);

  const toggle = useCallback(
    (entry) =>
      contains(entry.productId) ? remove(entry.productId) : add(entry),
    [contains, add, remove],
  );

  const clear = useCallback(() => {
    safeWrite([]);
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({items, add, remove, toggle, contains, clear}),
    [items, add, remove, toggle, contains, clear],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx)
    throw new Error('useWishlist must be used within <WishlistProvider>');
  return ctx;
}
