import React from 'react';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Scale,
  Truck,
} from 'lucide-react';

export default async function ReturnsExchangesPolicyPage() {
  const locale = await getLocale();
  const isAr = locale === 'ar';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-labsa-surface px-3.5 py-1 text-xs font-extrabold text-labsa-terracotta-dark">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {isAr ? 'سياسة الاسترجاع والاستبدال' : 'Return & Exchange Policy'}
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-extrabold text-labsa-charcoal sm:text-4xl">
          {isAr
            ? 'سياسة الاسترجاع والاستبدال (14 يوماً / 30 يوماً للعيوب)'
            : 'Return & Exchange Policy (14-Day / 30-Day Defect Coverage)'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-labsa-charcoal-muted">
          {isAr
            ? 'في لَبسة (LABSA)، نصمم ملابس الرجال والأطفال بعناية. توضح هذه الصفحة قواعد الاسترجاع والاستبدال للطلبات داخل جمهورية مصر العربية.'
            : 'At LABSA, we craft men’s and children’s apparel with care. This page outlines our return and exchange policy for orders delivered within Egypt.'}
        </p>

        {/* Two Core Windows Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 1. 14-Day Preference / Size Return or Exchange */}
          <section className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
            <span className="inline-block rounded-lg bg-labsa-charcoal px-3 py-1 font-mono text-xs font-extrabold text-labsa-white">
              {isAr ? 'خلال 14 يوماً من الاستلام' : '14 DAYS FROM DELIVERY'}
            </span>
            <h2 className="mt-3 text-lg font-extrabold text-labsa-charcoal">
              {isAr
                ? '1. الاسترجاع أو الاستبدال لتغيير الرأي أو المقاس'
                : '1. Preference or Size Return & Exchange (14 Days)'}
            </h2>
            <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-labsa-charcoal sm:text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-labsa-olive-dark" />
                <span>
                  {isAr
                    ? 'يحق للعميل طلب استرجاع أو استبدال القطعة خلال 14 يوماً من تاريخ التسليم في حال الرغبة في تغيير المقاس أو اللون أو العدول عن الشراء.'
                    : 'Customers may request a return or size/color exchange within 14 days of delivery for preference or fit changes.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-labsa-olive-dark" />
                <span>
                  {isAr
                    ? 'يشترط أن تكون القطعة غير ملبوسة وغير مغسولة وفي حالتها الأصلية مع كامل البطاقات (Tags) والتغليف الأصلي.'
                    : 'Items must be unused, unwashed, and in original condition with all brand tags and packaging attached.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-labsa-terracotta" />
                <span>
                  {isAr
                    ? 'يتحمل العميل رسوم شحن الاسترجاع أو الاستبدال في حالات تغيير الرأي أو المقاس (ما لم يكن الخطأ من جانب المتجر).'
                    : 'The customer bears return/exchange shipping fees for preference or size changes (unless LABSA is at fault).'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-labsa-olive-dark" />
                <span>
                  {isAr
                    ? 'تخضع طلبات الاستبدال لتوافر المقاس أو اللون المطلوب في المخزون وقت المراجعة.'
                    : 'Product exchanges are subject to variant stock availability at the time of processing.'}
                </span>
              </li>
            </ul>
          </section>

          {/* 2. 30-Day Defective / Damaged / Incorrect Item Target Window */}
          <section className="rounded-2xl border border-labsa-olive/60 bg-labsa-olive-light/20 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-lg bg-labsa-olive-dark px-3 py-1 font-mono text-xs font-extrabold text-labsa-white">
                {isAr
                  ? 'خلال 30 يوماً من الاستلام'
                  : '30 DAYS FROM DELIVERY'}
              </span>
            </div>
            <h2 className="mt-3 text-lg font-extrabold text-labsa-charcoal">
              {isAr
                ? '2. القطع المعيبة أو التالفة أو غير المطابقة للطلب'
                : '2. Defective, Damaged, or Incorrect Items (30 Days)'}
            </h2>
            <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-labsa-charcoal sm:text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-labsa-olive-dark" />
                <span>
                  {isAr
                    ? 'يوفر المتجر نافذة مدتها 30 يوماً من تاريخ التسليم للإبلاغ عن أي عيب صناعة أو تلف أثناء الشحن أو استلام صنف/مقاس مختلف عما تم طلبه.'
                    : 'LABSA provides a 30-day window from delivery for reporting manufacturing defects, transit damage, or incorrect items shipped.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-labsa-olive-dark" />
                <span>
                  {isAr
                    ? 'يتحمل متجر لَبسة كامل رسوم الشحن للاسترجاع أو الاستبدال في حالات العيوب المصنعية أو الخطأ في تجهيز الطلب.'
                    : 'LABSA bears 100% of return and replacement shipping fees in cases of defects, damage, or store fulfillment errors.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Scale className="mt-0.5 h-4 w-4 shrink-0 text-labsa-terracotta-dark" />
                <span className="font-bold text-labsa-charcoal">
                  {isAr
                    ? 'حقوق المستهلك القانونية: لا تُقيّد فترة الـ 30 يوماً أو تنتقص بأي شكل من أي حق قانوني أطول أو أقوى مكفول للمستهلك بموجب القانون المصري الساري.'
                    : 'Statutory Rights Notice: This 30-day window does not limit or override any longer or stronger statutory consumer right under applicable Egyptian law.'}
                </span>
              </li>
            </ul>
          </section>
        </div>

        {/* 3. Hygiene Note */}
        <section className="mt-6 rounded-2xl border border-labsa-cream bg-labsa-canvas p-5 text-xs leading-relaxed text-labsa-charcoal sm:text-sm">
          <div className="flex items-center gap-2 font-extrabold text-labsa-charcoal">
            <AlertTriangle
              className="h-4 w-4 text-labsa-terracotta-dark"
              aria-hidden="true"
            />
            <h3>
              {isAr
                ? 'ملاحظة الصحة العامة للملابس الداخلية المغلفة'
                : 'Hygiene Note for Sealed Undergarments'}
            </h3>
          </div>
          <p className="mt-2 text-labsa-charcoal-muted">
            {isAr
              ? 'يركز كتالوج لَبسة على الملابس الخارجية والكاجوال للرجال والأطفال. وفي حال توفر قطع داخلية مغلفة، فإن فتح الغلاف الصحي قد يمنع الاسترجاع لتغيير الرأي فقط حرصاً على الصحة العامة، دون المساس بحق العميل في استرجاع أو استبدال أي قطعة بها عيب صناعة.'
              : 'While LABSA’s catalog focuses on outerwear and everyday apparel for men and children, if sealed undergarment items are offered, unsealing hygiene packaging may restrict preference-only returns without affecting statutory rights for defective items.'}
          </p>
        </section>

        {/* Bottom Links */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-labsa-cream pt-6 text-xs font-bold">
          <Link
            href="/orders/track"
            className="rounded-xl bg-labsa-charcoal px-5 py-2.5 text-labsa-white transition hover:bg-labsa-terracotta"
          >
            {isAr ? 'تتبع حالة طلبك' : 'Track Your Order'}
          </Link>
          <Link
            href="/policies/shipping"
            className="rounded-xl border border-labsa-cream bg-labsa-canvas px-5 py-2.5 text-labsa-charcoal transition hover:border-labsa-terracotta"
          >
            {isAr
              ? 'عرض جدول الشحن والمحافظات (50 / 70 / 90 ج.م)'
              : 'View Governorate Shipping Fees (EGP 50 / 70 / 90)'}
          </Link>
        </div>
      </div>
    </div>
  );
}
