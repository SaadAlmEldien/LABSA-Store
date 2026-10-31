import React from 'react';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { EGYPT_GOVERNORATES } from '@/data/shipping';
import { formatEGP } from '@/lib/utils';
import { Clock, MapPin, PackageSearch, Truck } from 'lucide-react';

export default async function ShippingPolicyPage() {
  const locale = await getLocale();
  const isAr = locale === 'ar';

  const tier1 = EGYPT_GOVERNORATES.filter((g) => g.feeEgp === 50);
  const tier2 = EGYPT_GOVERNORATES.filter((g) => g.feeEgp === 70);
  const tier3 = EGYPT_GOVERNORATES.filter((g) => g.feeEgp === 90);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-labsa-surface px-3.5 py-1 text-xs font-extrabold text-labsa-olive-dark">
          <Truck className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {isAr
              ? 'التوصيل لجميع محافظات مصر (27 محافظة)'
              : 'Delivery Across All 27 Egyptian Governorates'}
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-extrabold text-labsa-charcoal sm:text-4xl">
          {isAr
            ? 'سياسة الشحن والتوصيل وأسعار المحافظات'
            : 'Shipping & Delivery Information'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-labsa-charcoal-muted">
          {isAr
            ? 'نعتمد في لَبسة تسعيراً واضحاً وثابتاً للشحن حسب المحافظة بالجنيه المصري (50 أو 70 أو 90 ج.م). لا تقلل كوبونات الخصم من رسوم التوصيل لضمان شفافية حساب الشحن.'
            : 'LABSA uses transparent, flat-rate governorate shipping tiers in Egyptian Pounds (EGP 50, EGP 70, or EGP 90). Promotional product coupons do not alter delivery fees.'}
        </p>

        {/* Three Shipping Tiers Summary Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Tier 1: EGP 50 */}
          <div className="rounded-2xl border border-labsa-olive/50 bg-labsa-olive-light/20 p-5">
            <span className="font-mono text-2xl font-extrabold text-labsa-olive-dark">
              {formatEGP(50, locale)}
            </span>
            <h2 className="mt-2 text-base font-extrabold text-labsa-charcoal">
              {isAr
                ? 'النطاق الأول: القاهرة والإسكندرية'
                : 'Tier 1: Cairo & Alexandria'}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-labsa-charcoal-muted">
              <Clock className="h-3.5 w-3.5 text-labsa-olive-dark" />
              <span>
                {isAr
                  ? 'مدة التوصيل التقديرية: 1 – 3 أيام عمل'
                  : 'Estimated transit: 1–3 business days'}
              </span>
            </p>
            <p className="mt-3 text-xs leading-relaxed text-labsa-charcoal">
              {tier1
                .map((g) => (isAr ? g.name.ar : g.name.en))
                .join(isAr ? '، ' : ', ')}
            </p>
          </div>

          {/* Tier 2: EGP 70 */}
          <div className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
            <span className="font-mono text-2xl font-extrabold text-labsa-charcoal">
              {formatEGP(70, locale)}
            </span>
            <h2 className="mt-2 text-base font-extrabold text-labsa-charcoal">
              {isAr
                ? 'النطاق الثاني: الجيزة، المنيا، والدلتا والقناة وسيناء'
                : 'Tier 2: Giza, Minya, Delta, Canal & Coastal (20 Govs)'}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-labsa-charcoal-muted">
              <Clock className="h-3.5 w-3.5 text-labsa-terracotta" />
              <span>
                {isAr
                  ? 'مدة التوصيل التقديرية: 2 – 5 أيام عمل'
                  : 'Estimated transit: 2–5 business days'}
              </span>
            </p>
            <p className="mt-3 text-xs leading-relaxed text-labsa-charcoal">
              {tier2
                .map((g) => (isAr ? g.name.ar : g.name.en))
                .join(isAr ? '، ' : ', ')}
            </p>
          </div>

          {/* Tier 3: EGP 90 */}
          <div className="rounded-2xl border border-labsa-terracotta/50 bg-labsa-terracotta-light/25 p-5">
            <span className="font-mono text-2xl font-extrabold text-labsa-terracotta-dark">
              {formatEGP(90, locale)}
            </span>
            <h2 className="mt-2 text-base font-extrabold text-labsa-charcoal">
              {isAr
                ? 'النطاق الثالث: محافظات جنوب الصعيد'
                : 'Tier 3: Upper Egypt (Assiut to Aswan)'}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-labsa-charcoal-muted">
              <Clock className="h-3.5 w-3.5 text-labsa-terracotta-dark" />
              <span>
                {isAr
                  ? 'مدة التوصيل التقديرية: 3 – 6 أيام عمل'
                  : 'Estimated transit: 3–6 business days'}
              </span>
            </p>
            <p className="mt-3 text-xs leading-relaxed text-labsa-charcoal">
              {tier3
                .map((g) => (isAr ? g.name.ar : g.name.en))
                .join(isAr ? '، ' : ', ')}
            </p>
          </div>
        </div>

        {/* Complete 27-Governorate Reference Table */}
        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-labsa-charcoal">
            <MapPin className="h-5 w-5 text-labsa-terracotta" />
            <span>
              {isAr
                ? 'الجدول الكامل لرسوم الشحن حسب المحافظة (27 محافظة)'
                : 'Complete 27-Governorate Shipping Fee Schedule'}
            </span>
          </h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-labsa-cream">
            <table className="w-full text-start text-xs sm:text-sm">
              <thead className="border-b border-labsa-cream bg-labsa-surface text-labsa-charcoal">
                <tr>
                  <th className="px-4 py-3 text-start font-extrabold">
                    {isAr ? 'المحافظة' : 'Governorate'}
                  </th>
                  <th className="px-4 py-3 text-start font-extrabold">
                    {isAr ? 'رسوم التوصيل' : 'Delivery Fee'}
                  </th>
                  <th className="px-4 py-3 text-start font-extrabold">
                    {isAr ? 'المدة التقديرية للتوصيل' : 'Estimated Delivery'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-labsa-cream bg-labsa-white">
                {EGYPT_GOVERNORATES.map((gov) => (
                  <tr key={gov.code}>
                    <td className="px-4 py-2.5 font-bold text-labsa-charcoal">
                      {isAr ? gov.name.ar : gov.name.en}
                    </td>
                    <td className="px-4 py-2.5 font-mono font-extrabold text-labsa-olive-dark">
                      {formatEGP(gov.feeEgp, locale)}
                    </td>
                    <td className="px-4 py-2.5 text-labsa-charcoal-muted">
                      {isAr ? gov.estimatedDays.ar : gov.estimatedDays.en}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Tracking Explanation */}
        <div className="mt-8 rounded-2xl border border-labsa-cream bg-labsa-canvas p-5 text-xs leading-relaxed text-labsa-charcoal sm:text-sm">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-labsa-charcoal">
            <PackageSearch className="h-4 w-4 text-labsa-terracotta" />
            <span>
              {isAr
                ? 'متابعة حالة الطلب والشحنة'
                : 'Order Status & Shipment Tracking'}
            </span>
          </h3>
          <p className="mt-2 text-labsa-charcoal-muted">
            {isAr
              ? 'يمكنك متابعة مراحل تجهيز وشحن طلبك (قيد التغليف ← تم التسليم للمندوب ← في الطريق ← تم التوصيل) والاطلاع على شركة الشحن ورقم التتبع من خلال صفحة «تتبع الطلب» باستخدام رقم الطلب ورقم الموبايل.'
              : 'You can follow your order’s fulfillment milestones (Packing → Dispatched → In Transit → Delivered) and view carrier details on the Track Order page using your Order Reference and Mobile Number.'}
          </p>
          <div className="mt-4">
            <Link
              href="/orders/track"
              className="inline-flex items-center gap-2 rounded-xl bg-labsa-terracotta px-5 py-2.5 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-terracotta-dark"
            >
              <PackageSearch className="h-4 w-4" aria-hidden="true" />
              <span>
                {isAr ? 'الذهاب إلى تتبع الطلبات' : 'Go to Order Lookup'}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
