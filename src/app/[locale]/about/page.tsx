import React from 'react';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { LabsaFullLogo } from '@/components/brand/LabsaLogo';
import { MapPin, Scissors, Shirt, Sparkles } from 'lucide-react';

export default async function AboutPage() {
  const locale = await getLocale();
  const isAr = locale === 'ar';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Brand Story Hero Card */}
      <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-10">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-labsa-surface px-3.5 py-1 text-xs font-extrabold text-labsa-terracotta-dark">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isAr
                  ? 'قصة لَبسة | لبسة تليق بيك'
                  : 'The LABSA Story | Crafted to Fit You'}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold text-labsa-charcoal sm:text-4xl">
              {isAr
                ? 'لَبسة (LABSA) — أناقة يومية متقنة للرجال والأطفال في مصر'
                : 'LABSA — Tactile Everyday Apparel for Men & Children in Egypt'}
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-labsa-charcoal-muted sm:text-base">
              {isAr
                ? 'ولدت فكرة «لَبسة» من تقدير التفاصيل الحرفية في صناعة الملابس: الغرز البارزة، الأقمشة القطنية المتينة التي تناسب المناخ المصري، والألوان الترابية الدافئة مثل الزيتوني والتيراكوتا والفحمي.'
                : 'LABSA was conceived around tactile garment craftsmanship: visible topstitching, breathable cotton twills suited for Egypt’s climate, and warm earthy tones of olive, terracotta, and charcoal.'}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-labsa-charcoal-muted">
              {isAr
                ? 'يتخصص متجرنا حصرياً في ملابس الرجال وملابس الأطفال — دون تشتيت في فئات أخرى — لنقدم قطعاً عملية متناسقة بجودة عالية وتسعير واضح بالجنيه المصري (ج.م).'
                : 'Our catalog focuses exclusively on men’s and children’s clothing — offering durable, well-proportioned essentials priced transparently in Egyptian Pounds (EGP).'}
            </p>
          </div>

          {/* Official Logo Showcase on #FFFFFF Surface */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-labsa-cream bg-[#FFFFFF] p-6 text-center shadow-craft">
              <LabsaFullLogo
                alt="LABSA | لَبسة"
                priority
                className="mx-auto max-w-[280px] rounded-2xl bg-[#FFFFFF]"
              />
              <p className="mt-4 text-xs font-bold text-labsa-charcoal-muted">
                {isAr
                  ? 'الهوية البصرية المعتمدة: كل حرف في كلمة LABSA مرسوم كقطعة ملابس بتفاصيل خياطة واضحة.'
                  : 'Brand Identity: Every letter in LABSA is illustrated as a crafted garment with stitched seams.'}
              </p>
            </div>
          </div>
        </div>

        {/* Garment-Letter Craft Values */}
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
            <Shirt className="h-6 w-6 text-labsa-olive-dark" />
            <h2 className="mt-3 text-base font-extrabold text-labsa-charcoal">
              {isAr
                ? 'تخصص حصري للرجال والأطفال'
                : 'Men’s & Kids’ Apparel Only'}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-labsa-charcoal-muted">
              {isAr
                ? 'تشكيلة مركزة من القمصان، البناطيل التشينو والكارغو، الهوديز، البليزرات، وسالوبيتات وأطقم الأطفال العملية.'
                : 'A focused wardrobe of Oxford shirts, chinos, cargo trousers, heavyweight hoodies, blazers, and durable kids’ overalls and sets.'}
            </p>
          </div>

          <div className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
            <Scissors className="h-6 w-6 text-labsa-terracotta" />
            <h2 className="mt-3 text-base font-extrabold text-labsa-charcoal">
              {isAr
                ? 'تفاصيل خياطة متقنة'
                : 'Craft-Stitched Quality'}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-labsa-charcoal-muted">
              {isAr
                ? 'نختار خامات قطنية متينة وتفصيل عملي مريح يناسب الحركة اليومية والغسيل المتكرر.'
                : 'We select breathable cotton weaves and reinforced stitching built for everyday movement and repeated wear.'}
            </p>
          </div>

          <div className="rounded-2xl border border-labsa-cream bg-labsa-canvas p-5">
            <MapPin className="h-6 w-6 text-labsa-olive-dark" />
            <h2 className="mt-3 text-base font-extrabold text-labsa-charcoal">
              {isAr
                ? 'مصمم للسوق المصري (27 محافظة)'
                : 'Built for Egypt (27 Governorates)'}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-labsa-charcoal-muted">
              {isAr
                ? 'تجربة ثنائية اللغة بالعربية والإنجليزية، وتسعير واضح بالجنيه المصري، وتوصيل لجميع محافظات مصر.'
                : 'Bilingual Arabic and English shopping experience, transparent EGP pricing, and delivery across all 27 Egyptian governorates.'}
            </p>
          </div>
        </div>

        {/* Store Navigation & Single Discreet Portfolio Note */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-labsa-cream pt-6 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-xl bg-labsa-charcoal px-5 py-2.5 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-terracotta"
            >
              {isAr ? 'تصفح كتالوج الملابس' : 'Browse Clothing Catalog'}
            </Link>
            <Link
              href="/policies/returns-exchanges"
              className="rounded-xl border border-labsa-cream bg-labsa-canvas px-5 py-2.5 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-terracotta"
            >
              {isAr
                ? 'سياسة الاسترجاع والاستبدال'
                : 'Return & Exchange Policy'}
            </Link>
          </div>

          <p className="text-[11px] leading-relaxed text-labsa-charcoal-muted">
            {isAr
              ? 'ملاحظة: متجر لَبسة هو مشروع استعراضي متكامل للتجارة الإلكترونية؛ جميع الطلبات والمدفوعات تحاكي دورة الشراء الفعلية لأغراض العرض.'
              : 'Note: LABSA is an e-commerce portfolio showcase; orders and payments simulate a complete retail workflow without real financial charges.'}
          </p>
        </div>
      </div>
    </div>
  );
}
