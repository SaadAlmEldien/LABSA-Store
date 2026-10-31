import React from 'react';
import { getLocale } from 'next-intl/server';
import { FileText } from 'lucide-react';

export default async function TermsPolicyPage() {
  const locale = await getLocale();
  const isAr = locale === 'ar';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-labsa-surface px-3.5 py-1 text-xs font-extrabold text-labsa-charcoal">
          <FileText className="h-3.5 w-3.5 text-labsa-terracotta" />
          <span>{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</span>
        </div>

        <h1 className="mt-4 text-2xl font-extrabold text-labsa-charcoal sm:text-4xl">
          {isAr
            ? 'الشروط والأحكام العامة — لَبسة (LABSA)'
            : 'Terms & Conditions — LABSA'}
        </h1>

        <div className="mt-6 space-y-5 text-xs leading-relaxed text-labsa-charcoal sm:text-sm">
          <section className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
            <h2 className="text-base font-extrabold text-labsa-charcoal">
              {isAr
                ? '1. نطاق المنتجات والعملة المعتمدة'
                : '1. Product Scope & Official Currency'}
            </h2>
            <p className="mt-2 text-labsa-charcoal-muted">
              {isAr
                ? 'يختص متجر لَبسة بملابس الرجال والأطفال داخل السوق المصري، وتُسعّر جميع المنتجات ورسوم الشحن وأكواد الخصم حصرياً بالجنيه المصري (ج.م / EGP).'
                : 'LABSA specializes in men’s and children’s clothing for the Egyptian market. All product prices, promotional discounts, and governorate shipping fees are denominated strictly in Egyptian Pounds (EGP).'}
            </p>
          </section>

          <section className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
            <h2 className="text-base font-extrabold text-labsa-charcoal">
              {isAr
                ? '2. قواعد أكواد وكوبونات الخصم'
                : '2. Promotional Coupon Rules'}
            </h2>
            <p className="mt-2 text-labsa-charcoal-muted">
              {isAr
                ? 'يُسمح بتطبيق كود خصم واحد كحد أقصى لكل طلب، ويُحسب الخصم على إجمالي سعر المنتجات المؤهلة فقط دون المساس برسوم التوصيل للمحافظات (50 / 70 / 90 ج.م). يتم التحقق من صلاحية الكوبون لحظة تأكيد الطلب.'
                : 'At most one coupon may be applied per order. Discounts apply strictly to eligible product subtotals, do not reduce governorate delivery fees (EGP 50 / 70 / 90), and are validated at order placement.'}
            </p>
          </section>

          <section className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
            <h2 className="text-base font-extrabold text-labsa-charcoal">
              {isAr
                ? '3. التقييمات والمراجعات الخاضعة للإشراف'
                : '3. Moderated Customer Ratings & Reviews'}
            </h2>
            <p className="mt-2 text-labsa-charcoal-muted">
              {isAr
                ? 'تخضع جميع التقييمات المرسلة للمراجعة قبل النشر. تُمنح شارة «شراء مُوثّق» للطلبات التي يثبت تسليمها عبر مطابقة رقم الطلب ورقم الموبايل.'
                : 'All submitted product reviews enter moderation before publication. The “Verified Purchase” badge is granted when order verification confirms a delivered order containing that product.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
