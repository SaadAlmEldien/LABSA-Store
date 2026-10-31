'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  type LocalizedText,
  type ProductColor,
  getAllCatalogProducts,
} from '@/data/catalog';
import {
  type CouponValidationResult,
  normalizeCouponCode,
  validateAndCalculateCoupon,
} from '@/data/coupons';
import { getLiveVariantStock } from '@/data/orders';

export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  sku: string;
  title: LocalizedText;
  colorKey: ProductColor['key'];
  colorName: LocalizedText;
  colorHex: string;
  size: string;
  priceEgp: number;
  quantity: number;
  maxStock: number;
  imageUrl: string;
}

export type AddToCartInput = Omit<CartItem, 'quantity'>;

export type AddToCartResult =
  | { ok: true; addedQuantity: number; newVariantQuantity: number }
  | {
      ok: false;
      reason: 'out_of_stock' | 'exceeds_stock';
      availableToAdd: number;
    };

export type UpdateCartQuantityResult =
  | { ok: true; newQuantity: number }
  | {
      ok: false;
      reason: 'discontinued' | 'out_of_stock' | 'exceeds_stock';
      availableStock: number;
    };

export interface CartItemHealth {
  isValid: boolean;
  liveStock: number;
  currentPriceEgp: number;
  issue?: 'discontinued' | 'out_of_stock' | 'exceeds_stock';
}

interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  subtotalEgp: number;
  appliedCouponCode: string | null;
  couponValidation: CouponValidationResult | null;
  discountEgp: number;
  discountedSubtotalEgp: number;
  applyCoupon: (rawCode: string) => CouponValidationResult;
  removeCoupon: () => void;
  isHydrated: boolean;
  selectedGovernorateCode: string;
  setSelectedGovernorateCode: (code: string) => void;
  addItem: (item: AddToCartInput, quantity: number) => AddToCartResult;
  updateItemQuantity: (
    variantId: string,
    newQuantity: number
  ) => UpdateCartQuantityResult;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  getVariantCartQuantity: (variantId: string) => number;
  inspectItemHealth: (item: CartItem) => CartItemHealth;
}

const STORAGE_KEY = 'labsa_demo_cart_v1';
const GOV_STORAGE_KEY = 'labsa_demo_selected_gov_v1';
const COUPON_STORAGE_KEY = 'labsa_demo_applied_coupon_v1';

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedGovernorateCode, setSelectedGovernorateCodeState] =
    useState<string>('');
  const [appliedCouponCode, setAppliedCouponCodeState] = useState<
    string | null
  >(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawCart = window.localStorage.getItem(STORAGE_KEY);
      if (rawCart) {
        const parsed = JSON.parse(rawCart);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
      const rawGov = window.localStorage.getItem(GOV_STORAGE_KEY);
      if (rawGov) {
        setSelectedGovernorateCodeState(rawGov);
      }
      const rawCoupon = window.localStorage.getItem(COUPON_STORAGE_KEY);
      if (rawCoupon) {
        setAppliedCouponCodeState(rawCoupon);
      }
    } catch {
      // Ignore storage access errors in private/restricted browsers
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage write errors
    }
  }, [items, isHydrated]);

  const setSelectedGovernorateCode = useCallback((code: string) => {
    setSelectedGovernorateCodeState(code);
    try {
      if (code) {
        window.localStorage.setItem(GOV_STORAGE_KEY, code);
      } else {
        window.localStorage.removeItem(GOV_STORAGE_KEY);
      }
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const inspectItemHealth = useCallback((item: CartItem): CartItemHealth => {
    const allProducts = getAllCatalogProducts();
    const product = allProducts.find(
      (p) => p.id === item.productId && p.status !== 'draft'
    );
    if (!product) {
      return {
        isValid: false,
        liveStock: 0,
        currentPriceEgp: item.priceEgp,
        issue: 'discontinued',
      };
    }

    const variant = product.variants.find((v) => v.id === item.variantId);
    if (!variant) {
      return {
        isValid: false,
        liveStock: 0,
        currentPriceEgp: product.priceEgp,
        issue: 'discontinued',
      };
    }

    const liveStock = getLiveVariantStock(variant.id, variant.stock);
    if (product.status === 'out_of_stock' || liveStock <= 0) {
      return {
        isValid: false,
        liveStock: 0,
        currentPriceEgp: product.priceEgp,
        issue: 'out_of_stock',
      };
    }

    if (item.quantity > liveStock) {
      return {
        isValid: false,
        liveStock,
        currentPriceEgp: product.priceEgp,
        issue: 'exceeds_stock',
      };
    }

    return {
      isValid: true,
      liveStock,
      currentPriceEgp: product.priceEgp,
    };
  }, []);

  const getVariantCartQuantity = useCallback(
    (variantId: string): number => {
      const existing = items.find((i) => i.variantId === variantId);
      return existing ? existing.quantity : 0;
    },
    [items]
  );

  const addItem = useCallback(
    (input: AddToCartInput, requestedQty: number): AddToCartResult => {
      const allProducts = getAllCatalogProducts();
      const product = allProducts.find((p) => p.id === input.productId);
      const variant = product?.variants.find((v) => v.id === input.variantId);
      const liveStock = variant
        ? getLiveVariantStock(variant.id, variant.stock)
        : input.maxStock;

      if (liveStock <= 0 || requestedQty <= 0) {
        return { ok: false, reason: 'out_of_stock', availableToAdd: 0 };
      }

      const existing = items.find((i) => i.variantId === input.variantId);
      const currentQty = existing ? existing.quantity : 0;
      const availableToAdd = Math.max(0, liveStock - currentQty);

      if (requestedQty > availableToAdd) {
        return {
          ok: false,
          reason: 'exceeds_stock',
          availableToAdd,
        };
      }

      const newVariantQuantity = currentQty + requestedQty;

      setItems((prev) => {
        const idx = prev.findIndex((i) => i.variantId === input.variantId);
        if (idx === -1) {
          return [
            ...prev,
            { ...input, maxStock: liveStock, quantity: requestedQty },
          ];
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + requestedQty,
          maxStock: liveStock,
          priceEgp: product ? product.priceEgp : input.priceEgp,
        };
        return updated;
      });

      return {
        ok: true,
        addedQuantity: requestedQty,
        newVariantQuantity,
      };
    },
    [items]
  );

  const updateItemQuantity = useCallback(
    (variantId: string, newQuantity: number): UpdateCartQuantityResult => {
      const existing = items.find((i) => i.variantId === variantId);
      if (!existing) {
        return { ok: false, reason: 'discontinued', availableStock: 0 };
      }

      const allProducts = getAllCatalogProducts();
      const product = allProducts.find(
        (p) => p.id === existing.productId && p.status !== 'draft'
      );
      const variant = product?.variants.find((v) => v.id === variantId);

      if (!product || !variant) {
        return { ok: false, reason: 'discontinued', availableStock: 0 };
      }

      const liveStock = getLiveVariantStock(variant.id, variant.stock);
      if (product.status === 'out_of_stock' || liveStock <= 0) {
        return { ok: false, reason: 'out_of_stock', availableStock: 0 };
      }

      if (newQuantity > liveStock) {
        return {
          ok: false,
          reason: 'exceeds_stock',
          availableStock: liveStock,
        };
      }

      const clampedQty = Math.max(1, newQuantity);
      setItems((prev) =>
        prev.map((item) =>
          item.variantId === variantId
            ? {
                ...item,
                quantity: clampedQty,
                maxStock: liveStock,
                priceEgp: product.priceEgp,
              }
            : item
        )
      );

      return { ok: true, newQuantity: clampedQty };
    },
    [items]
  );

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((item) => item.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCouponCodeState(null);
    try {
      window.localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotalEgp = useMemo(
    () =>
      items.reduce((sum, item) => {
        const health = inspectItemHealth(item);
        return sum + health.currentPriceEgp * item.quantity;
      }, 0),
    [items, inspectItemHealth]
  );

  const couponValidation = useMemo<CouponValidationResult | null>(() => {
    if (!appliedCouponCode) return null;
    return validateAndCalculateCoupon(appliedCouponCode, subtotalEgp);
  }, [appliedCouponCode, subtotalEgp]);

  const discountEgp = useMemo(
    () => (couponValidation?.valid ? couponValidation.discountEgp : 0),
    [couponValidation]
  );

  const discountedSubtotalEgp = useMemo(
    () => Math.max(0, subtotalEgp - discountEgp),
    [subtotalEgp, discountEgp]
  );

  const applyCoupon = useCallback(
    (rawCode: string): CouponValidationResult => {
      const result = validateAndCalculateCoupon(rawCode, subtotalEgp);
      if (result.valid) {
        const normalized = normalizeCouponCode(rawCode);
        setAppliedCouponCodeState(normalized);
        try {
          window.localStorage.setItem(COUPON_STORAGE_KEY, normalized);
        } catch {
          // Ignore storage write errors
        }
      }
      return result;
    },
    [subtotalEgp]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCouponCodeState(null);
    try {
      window.localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {
      // Ignore storage write errors
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        totalQuantity,
        subtotalEgp,
        appliedCouponCode,
        couponValidation,
        discountEgp,
        discountedSubtotalEgp,
        applyCoupon,
        removeCoupon,
        isHydrated,
        selectedGovernorateCode,
        setSelectedGovernorateCode,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
        getVariantCartQuantity,
        inspectItemHealth,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
