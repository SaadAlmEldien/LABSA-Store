'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

export interface WishlistEntry {
  productId: string;
  slug: string;
  addedAt: string;
}

interface WishlistContextValue {
  entries: WishlistEntry[];
  totalWishlistCount: number;
  isHydrated: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string, slug: string) => boolean;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

export const WISHLIST_STORAGE_KEY = 'labsa_demo_wishlist_v1';

const WishlistContext = createContext<WishlistContextValue | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setEntries(parsed);
        }
      }
    } catch {
      // Ignore storage read errors in restricted browsers
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        JSON.stringify(entries)
      );
    } catch {
      // Ignore storage write errors
    }
  }, [entries, isHydrated]);

  const isInWishlist = useCallback(
    (productId: string): boolean => {
      return entries.some((e) => e.productId === productId);
    },
    [entries]
  );

  const toggleWishlist = useCallback(
    (productId: string, slug: string): boolean => {
      const exists = entries.some((e) => e.productId === productId);
      if (exists) {
        setEntries((prev) => prev.filter((e) => e.productId !== productId));
        return false;
      } else {
        setEntries((prev) => [
          { productId, slug, addedAt: new Date().toISOString() },
          ...prev,
        ]);
        return true;
      }
    },
    [entries]
  );

  const removeFromWishlist = useCallback((productId: string) => {
    setEntries((prev) => prev.filter((e) => e.productId !== productId));
  }, []);

  const clearWishlist = useCallback(() => {
    setEntries([]);
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      entries,
      totalWishlistCount: entries.length,
      isHydrated,
      isInWishlist,
      toggleWishlist,
      removeFromWishlist,
      clearWishlist,
    }),
    [
      entries,
      isHydrated,
      isInWishlist,
      toggleWishlist,
      removeFromWishlist,
      clearWishlist,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
}
