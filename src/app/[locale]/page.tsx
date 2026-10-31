import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { getAllVisibleProducts } from '@/data/catalog';
import { SEEDED_DEMO_REVIEWS } from '@/data/reviews';
import { ProductCard } from '@/components/catalog/ProductCard';
import { ClothingRackReviews } from '@/components/reviews/ClothingRackReviews';
import { PinnedNotesSection } from '@/components/home/PinnedNotesSection';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Truck,
  CreditCard,
  RefreshCw,
  Ruler,
  Star,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

export default function HomePage() {
  const tHome = useTranslations('Home');
  const locale = useLocale();
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const allProducts = getAllVisibleProducts();

  // Filter 4 key men's products for Section 1
  const menProducts = allProducts
    .filter((p) => p.audience === 'men')
    .slice(0, 4);

  // Filter 4 key children's products for Section 3
  const kidsProducts = allProducts
    .filter((p) => p.audience === 'kids')
    .slice(0, 4);

  // Exactly 5 approved reviews for the 5 hangers on the clothing rack
  const rackReviews = SEEDED_DEMO_REVIEWS.filter((r) => r.status === 'approved').slice(0, 5);

  return (
    <div className="space-y-16 sm:space-y-20 lg:space-y-24">
      {/* =====================================================================
          MAIN HERO SECTION:
          - Starts at y = 0 with NO white gap and NO blank spacer
          - Transparent navigation overlays on top of this hero
          - Uses template/hero-section.jpg
          - Responsive crop preserves both man and child and their clothing
         ===================================================================== */}
      <section className="relative -mt-0 min-h-[92vh] sm:min-h-[96vh] w-full overflow-hidden flex flex-col justify-between">
        {/* Editorial Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/campaign/hero-section.jpg"
            alt={tHome('hero.menFeatureAlt')}
            className="h-full w-full object-cover object-[center_35%] filter brightness-[0.92] contrast-[1.03]"
          />
          {/* Minimum vignette overlay for high text contrast without obscuring subjects */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/65" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/30" />
        </div>

        {/* Top spacer matching floating navigation overlay */}
        <div className="relative z-10 pt-28 sm:pt-36 lg:pt-40" />

        {/* Centered Editorial Text Block matching template/design-template.jpg */}
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 text-center sm:px-6">
          {/* Arabic Capsule Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
            {tHome('hero.capsuleTitleAr')}
          </h1>

          {/* English Capsule Title */}
          <p className="mt-1 sm:mt-2 text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#FDFBF7] tracking-tight drop-shadow-md">
            {tHome('hero.capsuleTitleEn')}
          </p>

          {/* Brand Tagline: "لبسة تليق بيك" */}
          <div className="mt-3.5 sm:mt-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-4 py-1 text-xs sm:text-sm font-bold text-white backdrop-blur-sm shadow-2xs">
            <span>{tHome('hero.tagline')}</span>
          </div>

          {/* Subtitle Statement */}
          <p className="mt-3.5 sm:mt-4 text-sm sm:text-lg lg:text-xl font-medium text-white/95 max-w-2xl mx-auto drop-shadow leading-relaxed">
            {isAr ? tHome('hero.subtitle') : tHome('hero.subtitle')}
          </p>
          <p className="text-xs sm:text-base font-normal text-white/80 max-w-2xl mx-auto drop-shadow mt-1">
            {isAr ? tHome('hero.subtitleEn') : tHome('hero.subtitleAr')}
          </p>

          {/* Actions with LABSA Button Identity */}
          <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {/* Primary Action Pill */}
            <Link
              href="/shop"
              className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#FAF7F2] hover:bg-white active:scale-[0.98] px-7 py-2.5 text-xs sm:text-sm font-bold text-labsa-charcoal shadow-md transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span>{tHome('hero.ctaCapsule')}</span>
              <ArrowIcon className="ms-2 h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>

            {/* Department Actions */}
            <Link
              href="/men"
              className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-white/40 bg-black/35 backdrop-blur-sm hover:bg-white hover:text-labsa-charcoal active:scale-[0.98] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white transition"
            >
              <span>{tHome('hero.ctaMen')}</span>
            </Link>

            <Link
              href="/kids"
              className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-white/40 bg-black/35 backdrop-blur-sm hover:bg-white hover:text-labsa-charcoal active:scale-[0.98] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white transition"
            >
              <span>{tHome('hero.ctaKids')}</span>
            </Link>
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="relative z-10 pb-6 sm:pb-10" />
      </section>

      {/* =====================================================================
          EXACT REQUESTED ORDER: SECTION 1
          - Men’s collection section: NO background photo
          - Uses existing men's catalog data & product imagery
         ===================================================================== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-labsa-cream/70 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-labsa-olive-dark">
              {isAr ? 'القسم الرجالي • MEN’S COLLECTION' : "Men's Collection • القسم الرجالي"}
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-labsa-charcoal tracking-tight">
              {isAr ? 'تشكيلة ملابس الرجال' : "Men's Everyday Collection"}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-labsa-charcoal-muted max-w-2xl leading-relaxed">
              {isAr
                ? 'قطع عملية وتفصيل متقن من القطن المصري الممشط والتويل عالي الكثافة مصممة لراحتك وثبات القصة طوال اليوم.'
                : 'Everyday pieces tailored from combed Egyptian cotton, brushed twill, and breathable weaves.'}
            </p>
          </div>

          <Link
            href="/men"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs sm:text-sm font-bold text-labsa-terracotta-dark hover:text-labsa-charcoal transition"
          >
            <span>{isAr ? 'تصفح كل ملابس الرجال' : "Explore All Men's Clothing"}</span>
            <ArrowIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* 4-Item Men's Product Cards */}
        <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {menProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* =====================================================================
          EXACT REQUESTED ORDER: SECTION 2
          - FULL-BLEED image section: extends edge-to-edge across viewport
          - Uses template/other-section.jpg
          - Group/family lifestyle story in Cairo street
         ===================================================================== */}
      <section className="relative w-full overflow-hidden">
        {/* Full-Bleed Editorial Canvas (No side margin constraint) */}
        <div className="relative min-h-[500px] sm:min-h-[600px] lg:min-h-[680px] w-full flex items-end">
          <img
            src="/campaign/other-section.jpg"
            alt={isAr ? 'أصدقاء وعائلة يتجولون في شوارع القاهرة بملابس لَبسة القطنية' : 'Group of friends and family walking in Cairo wearing LABSA clothing'}
            className="absolute inset-0 h-full w-full object-cover object-[center_30%] filter brightness-[0.92] contrast-[1.02]"
          />

          {/* Minimum contrast overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30" />

          {/* Readable inner content container */}
          <div className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16 text-center">
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#FDFBF7]/90 drop-shadow">
              {tHome('campaignFamily.tag')}
            </p>

            <h3 className="mt-2 text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
              {tHome('campaignFamily.title')}
            </h3>

            <p className="mt-3 max-w-xl mx-auto text-xs sm:text-base text-white/90 drop-shadow leading-relaxed">
              {tHome('campaignFamily.subtitle')}
            </p>

            <div className="mt-6 sm:mt-8">
              <Link
                href="/shop"
                className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#FAF7F2] hover:bg-white active:scale-[0.98] px-8 py-2.5 text-xs sm:text-sm font-bold text-labsa-charcoal shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <span>{tHome('campaignFamily.cta')}</span>
                <ArrowIcon className="ms-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          EXACT REQUESTED ORDER: SECTION 3
          - Kids’ collection section: NO background photo
          - Uses existing children's catalog data & product imagery
         ===================================================================== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-labsa-cream/70 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-labsa-olive-dark">
              {isAr ? 'قسم الأطفال • KIDS’ COLLECTION' : "Kids' Collection • قسم الأطفال"}
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-labsa-charcoal tracking-tight">
              {isAr ? 'تشكيلة ملابس الأطفال' : "Kids' Play-Ready Collection"}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-labsa-charcoal-muted max-w-2xl leading-relaxed">
              {isAr
                ? 'سالوبيتات كانفاس ناعمة، هوديز بدون أربطة لسلامة الطفل، وبناطيل جوجر بركب مقواة تتحمل اللعب والحركة.'
                : 'Play-ready canvas overalls, cordless fleece hoodies, and reinforced-knee joggers.'}
            </p>
          </div>

          <Link
            href="/kids"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs sm:text-sm font-bold text-labsa-terracotta-dark hover:text-labsa-charcoal transition"
          >
            <span>{isAr ? 'تصفح كل ملابس الأطفال' : "Explore All Kids' Clothing"}</span>
            <ArrowIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* 4-Item Children's Product Cards */}
        <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {kidsProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* =====================================================================
          EXACT REQUESTED ORDER: SECTION 4
          - FULL-BLEED image section: extends edge-to-edge across viewport
          - Uses template/other-section2.jpg
          - Separate man-and-child editorial feature
         ===================================================================== */}
      <section className="relative w-full overflow-hidden">
        {/* Full-Bleed Editorial Canvas (No side margin constraint) */}
        <div className="relative min-h-[500px] sm:min-h-[600px] lg:min-h-[680px] w-full flex items-end">
          <img
            src="/campaign/other-section2.jpg"
            alt={isAr ? 'رجل وطفل في ممشى بالقاهرة بملابس لَبسة الحضرية' : 'Man and child in Cairo promenade wearing LABSA clothing'}
            className="absolute inset-0 h-full w-full object-cover object-[center_35%] filter brightness-[0.92] contrast-[1.02]"
          />

          {/* Minimum contrast overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30" />

          {/* Readable inner content container */}
          <div className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16 text-center">
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#FDFBF7]/90 drop-shadow">
              {tHome('campaignUrban.tag')}
            </p>

            <h3 className="mt-2 text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
              {tHome('campaignUrban.title')}
            </h3>

            <p className="mt-3 max-w-xl mx-auto text-xs sm:text-base text-white/90 drop-shadow leading-relaxed">
              {tHome('campaignUrban.subtitle')}
            </p>

            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/men"
                className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#FAF7F2] hover:bg-white active:scale-[0.98] px-7 py-2.5 text-xs sm:text-sm font-bold text-labsa-charcoal shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <span>{tHome('campaignUrban.ctaMen')}</span>
              </Link>

              <Link
                href="/kids"
                className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-white/60 bg-black/35 backdrop-blur-sm hover:bg-white hover:text-labsa-charcoal active:scale-[0.98] px-7 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg transition"
              >
                <span>{tHome('campaignUrban.ctaKids')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          COMBINED SECTION: CUSTOMER REVIEWS & SHOPPING INFORMATION
          - Starts directly with the customer reviews content (tag, heading, subtitle, rack)
          - Compact, refined review invitation CTA
          - Standalone pinned service notes (20-25% smaller, no shared board)
         ===================================================================== */}
      <section
        id="reviews-and-notes"
        aria-labelledby="reviews-rack-heading"
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10"
      >
        {/* 1. Interactive Clothing Rack Reviews (Opens directly with Reviews Header & Rack) */}
        <div>
          <ClothingRackReviews
            initialReviews={rackReviews}
            allProducts={allProducts}
            embedded
          />
        </div>

        {/* 2. Rebuilt Compact Review CTA (Refined, Non-overlapping, LABSA Brand Tokens) */}
        <div className="mx-auto max-w-3xl px-2 sm:px-4">
          <div className="rounded-2xl border border-labsa-cream/90 bg-white/95 px-4 py-3 sm:px-5 sm:py-3.5 shadow-2xs transition-all hover:border-labsa-terracotta/40">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-start">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-labsa-surface text-labsa-terracotta-dark shadow-2xs">
                  <MessageSquare className="h-4.5 w-4.5" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-labsa-charcoal leading-snug">
                    {isAr ? 'اشتريت قطعة من لَبسة؟ شاركنا رأيك' : 'Purchased a LABSA Garment? Share Your Review'}
                  </h4>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-labsa-charcoal-muted leading-relaxed font-normal">
                    {isAr
                      ? 'يمكنك تقييم أي منتج مباشرة من صفحة تفاصيل القطعة بعد استلام طلبك ومساعدتنا في تطوير التشكيلة.'
                      : 'You can submit feedback directly from any garment page after receiving your delivery.'}
                  </p>
                </div>
              </div>

              <Link
                href="/shop"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-labsa-charcoal hover:bg-labsa-terracotta active:scale-[0.98] text-white px-4 py-2 text-xs font-bold shadow-2xs transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-labsa-charcoal"
              >
                <span>{isAr ? 'تصفح وقيم تجربتك' : 'Browse to Review'}</span>
                <ArrowIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Standalone Pinned Service Notes (Embedded, 20-25% Smaller, No Board) */}
        <PinnedNotesSection embedded />
      </section>
    </div>
  );
}
