import React from 'react';
import { getLocale } from 'next-intl/server';
import { Lock, ShieldCheck, Database, FileText } from 'lucide-react';

export default async function PrivacyPolicyPage() {
  const locale = await getLocale();
  const isAr = locale === 'ar';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-labsa-surface px-3.5 py-1 text-xs font-extrabold text-labsa-charcoal">
          <Lock className="h-3.5 w-3.5 text-labsa-terracotta" />
          <span>{isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy & Data Protection Policy'}</span>
        </div>

        <h1 className="mt-4 text-2xl font-extrabold text-labsa-charcoal sm:text-4xl">
          {isAr
            ? 'سياسة الخصوصية ومعالجة البيانات'
            : 'Privacy Policy & Data Processing'}
        </h1>
        <p className="mt-2 text-xs text-labsa-charcoal-muted sm:text-sm">
          {isAr
            ? 'توضح هذه الوثيقة بوضوح وشفافية كيف يتعامل متجر لَبسة مع بياناتك، أين تُحفظ، ومن يمكنه الوصول إليها.'
            : 'This document explains transparently how LABSA handles your data, where it is stored, and who can access it.'}
        </p>

        <div className="mt-8 space-y-6 text-xs leading-relaxed text-labsa-charcoal sm:text-sm">
          {/* Section 1: Browser Storage vs Server Storage */}
          <section className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-labsa-terracotta" aria-hidden="true" />
              <h2 className="text-base font-extrabold text-labsa-charcoal">
                {isAr
                  ? '1. البيانات المحفوظة في متصفحك (البيانات غير الحساسة)'
                  : '1. Browser Storage (Non-Sensitive Convenience Data)'}
              </h2>
            </div>
            <p className="mt-2.5 text-labsa-charcoal-muted">
              {isAr
                ? 'يحفظ المتجر في متصفحك البيانات غير الحساسة فقط لتسهيل التصفح: تفضيل اللغة (العربية/الإنجليزية)، عناصر سلة التسوق المؤقتة، وقائمة الرغبات. لا يتم حفظ أسماء العملاء، العناوين، أرقام الهواتف، أو السجلات الرسمية للطلبات داخل متصفحك في بيئة التشغيل.'
                : 'Our website stores only non-sensitive convenience data locally in your browser: language preference, temporary shopping bag items, and your saved wishlist. Authoritative order records, customer names, delivery addresses, and phone numbers are never stored in your browser storage in production.'}
            </p>
          </section>

          {/* Section 2: Server-Side Storage */}
          <section className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <Database className="h-5 w-5 text-labsa-terracotta" aria-hidden="true" />
              <h2 className="text-base font-extrabold text-labsa-charcoal">
                {isAr
                  ? '2. بيانات الطلبات والتوصيل (الخادم وقاعدة البيانات المعتمدة)'
                  : '2. Order & Fulfillment Data (Server-Side Database)'}
              </h2>
            </div>
            <p className="mt-2.5 text-labsa-charcoal-muted">
              {isAr
                ? 'عند إتمام الطلب، تُرسل بيانات الشحن (الاسم، رقم الموبايل المصري، عنوان التوصيل، والمحافظة) إلى خوادمنا وتُعالج في قاعدة بيانات PostgreSQL المأمونة. يُقتصر الوصول الرقمي المباشر إلى هذه البيانات داخل النظام حصرياً على مديري تشغيل المتجر المعتمدين. لا يملك مندوبو شركات الشحن أي وصول إلى النظام أو قاعدة البيانات، وتقتصر مشاركة بيانات التواصل والعنوان معهم على بوليصة الشحن الورقية الملصقة على الطرد عند تسليم الشحنة فقط.'
                : 'When you place an order, shipping details (customer name, Egyptian mobile number, street address, and governorate) are processed on our servers and stored in our secure PostgreSQL database. Direct digital access to order and customer records within the system is strictly restricted to authenticated store operations staff. Delivery couriers have no digital system access whatsoever; they receive only the physical recipient name, contact number, and destination address printed on the parcel waybill at dispatch.'}
            </p>
          </section>

          {/* Section 3: Dual-Verification Tracking */}
          <section className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-labsa-terracotta" aria-hidden="true" />
              <h2 className="text-base font-extrabold text-labsa-charcoal">
                {isAr
                  ? '3. التحقق المزدوج لتتبع الطلبات وحماية الخصوصية'
                  : '3. Dual-Verification Order Lookup & Privacy Protection'}
              </h2>
            </div>
            <p className="mt-2.5 text-labsa-charcoal-muted">
              {isAr
                ? 'لمنع أي محاولة للتخمين أو استعراض طلبات الغير، يتطلب تتبع أي طلب إدخال رقم الطلب المرجعي مقروناً برقم الموبايل المسجل ذاته (أو رمز التحقق الرقمي الآمن). تُطبق الخوادم حماية ضد المحاولات المتكررة (Rate Limiting) ولا تظهر الملاحظات الإدارية الداخلية أو تفاصيل الدفع في صفحة التتبع العامة.'
                : 'To prevent enumeration and unauthorized access, tracking an order requires providing both the unique Order Reference and the exact matching Egyptian mobile number (or a secure high-entropy lookup token). Server-side rate limiting prevents automated scraping, and internal administrative notes and private payment references are never revealed.'}
            </p>
          </section>

          {/* Section 4: Payment Security */}
          <section className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-labsa-terracotta" aria-hidden="true" />
              <h2 className="text-base font-extrabold text-labsa-charcoal">
                {isAr
                  ? '4. أمان المدفوعات وعدم جمع بيانات البطاقات البنكية'
                  : '4. Payment Security & Zero Card Data Collection'}
              </h2>
            </div>
            <p className="mt-2.5 text-labsa-charcoal-muted">
              {isAr
                ? 'لا نطلب ولا نخزن أبداً أرقام البطاقات الائتمانية أو رموز التحقق (CVV) أو كلمات المرور أو رموز التحقق (OTP) للمحافظ الإلكترونية. تقتصر طرق الدفع على الدفع نقداً عند الاستلام (COD) أو التحويلات اليدوية التي يراجعها مسؤولو المتجر قبل الشحن.'
                : 'We never collect, process, or store credit or debit card numbers, CVVs, PINs, or one-time passwords (OTPs). Payment options are limited to Cash on Delivery (COD) or manual transfers verified by administrators prior to dispatch.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
