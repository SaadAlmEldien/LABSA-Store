'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import {
  Bell,
  Heart,
  PackageSearch,
  RefreshCw,
  ShoppingBag,
  Tag,
  User,
} from 'lucide-react';

export default function CustomerAccountHubPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { totalWishlistCount } = useWishlist();
  const { totalQuantity, appliedCouponCode } = useCart();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-10">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-labsa-surface text-labsa-terracotta-dark">
            <User className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-labsa-charcoal sm:text-3xl">
              {isAr
                ? 'خدمات العميل ومتابعة الطلبات'
                : 'Customer Care & Order Services'}
            </h1>
            <p className="mt-1 text-xs text-labsa-charcoal-muted sm:text-sm">
              {isAr
                ? 'وصول سريع إلى قائمة الأمنيات، تتبع الطلبات، سلة التسوق، وسياسات المتجر.'
                : 'Quick access to your saved wishlist, order lookup, shopping bag, and store policies.'}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* 1. Order & Status Lookup */}
          <div className="flex flex-col justify-between rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
            <div>
              <div className="flex items-center gap-2 text-base font-extrabold text-labsa-charcoal">
                <PackageSearch className="h-5 w-5 text-labsa-terracotta" />
                <h2>
                  {isAr
                    ? 'تتبع الطلبات وتحديثات الشحنة'
                    : 'Order Tracking & Delivery Updates'}
                </h2>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-labsa-charcoal-muted">
                {isAr
                  ? 'اعرض حالة طلبك، حالة الدفع، ورقم تتبع الشحنة باستخدام رقم الطلب ورقم الموبايل المسجلين.'
                  : 'Check your order status, payment confirmation, and shipment tracking reference using your Order Reference and Mobile Number.'}
              </p>
            </div>
            <div className="mt-4">
              <Link
                href="/orders/track"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-labsa-terracotta px-4 py-2.5 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-terracotta-dark"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isAr ? 'تتبع طلبك الآن' : 'Track Your Order'}
                </span>
              </Link>
            </div>
          </div>

          {/* 2. Wishlist */}
          <div className="flex flex-col justify-between rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-extrabold text-labsa-charcoal">
                  <Heart className="h-5 w-5 text-labsa-terracotta" />
                  <h2>
                    {isAr ? 'قائمة الأمنيات المحفوظة' : 'Saved Wishlist'}
                  </h2>
                </div>
                <span className="rounded-full border border-labsa-cream bg-labsa-white px-3 py-0.5 font-mono text-xs font-extrabold text-labsa-terracotta-dark">
                  {totalWishlistCount}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-labsa-charcoal-muted">
                {isAr
                  ? 'استعرض القطع المفضلة لديك، اختر المقاس واللون المتاحين، وانقلها مباشرة إلى سلة التسوق.'
                  : 'Review your saved items, choose an available size and color, and move them directly to your shopping bag.'}
              </p>
            </div>
            <div className="mt-4">
              <Link
                href="/wishlist"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-labsa-charcoal px-4 py-2.5 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-olive-dark"
              >
                <Heart className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isAr ? 'عرض قائمة الأمنيات' : 'View Wishlist'} (
                  {totalWishlistCount})
                </span>
              </Link>
            </div>
          </div>

          {/* 3. Shopping Cart & Active Coupon */}
          <div className="flex flex-col justify-between rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-extrabold text-labsa-charcoal">
                  <ShoppingBag className="h-5 w-5 text-labsa-olive-dark" />
                  <h2>
                    {isAr
                      ? 'سلة التسوق وأكواد الخصم'
                      : 'Shopping Bag & Promo Codes'}
                  </h2>
                </div>
                <span className="rounded-full border border-labsa-cream bg-labsa-white px-3 py-0.5 font-mono text-xs font-extrabold text-labsa-olive-dark">
                  {totalQuantity}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-labsa-charcoal-muted">
                {isAr
                  ? 'راجع القطع المختارة في سلة التسوق واستخدم كود الخصم المتاح لديك قبل إتمام الطلب.'
                  : 'Review the items in your bag and apply promotional discount codes before checkout.'}
              </p>
              {appliedCouponCode && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-labsa-olive-light px-2.5 py-1 font-mono text-xs font-bold text-labsa-olive-dark">
                  <Tag className="h-3.5 w-3.5" />
                  <span>{appliedCouponCode}</span>
                </p>
              )}
            </div>
            <div className="mt-4">
              <Link
                href="/cart"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-labsa-charcoal bg-labsa-white px-4 py-2.5 text-xs font-extrabold text-labsa-charcoal transition hover:bg-labsa-charcoal hover:text-labsa-white"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                <span>{isAr ? 'الانتقال إلى السلة' : 'Go to Cart'}</span>
              </Link>
            </div>
          </div>

          {/* 4. Store Policies & Returns Info */}
          <div className="flex flex-col justify-between rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
            <div>
              <div className="flex items-center gap-2 text-base font-extrabold text-labsa-charcoal">
                <RefreshCw className="h-5 w-5 text-labsa-olive-dark" />
                <h2>
                  {isAr
                    ? 'السياسات والشحن والاسترجاع'
                    : 'Shipping, Returns & Store Policies'}
                </h2>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-labsa-charcoal-muted">
                {isAr
                  ? 'اطلع على سياسة الاسترجاع (14 يوماً لتغيير الرأي / 30 يوماً للعيوب) وجدول شحن الـ 27 محافظة.'
                  : 'Read our 14-day preference return / 30-day defect policy and our 27-governorate shipping fee table.'}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/policies/returns-exchanges"
                className="rounded-xl border border-labsa-cream bg-labsa-white px-3.5 py-2 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-terracotta"
              >
                {isAr ? 'الاسترجاع والاستبدال' : 'Returns & Exchanges'}
              </Link>
              <Link
                href="/policies/shipping"
                className="rounded-xl border border-labsa-cream bg-labsa-white px-3.5 py-2 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-terracotta"
              >
                {isAr ? 'أسعار الشحن' : 'Shipping Fees'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
