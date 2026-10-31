'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import {
  Facebook,
  Instagram,
  Youtube,
  Info,
} from 'lucide-react';

export function SiteFooter() {
  const tFooter = useTranslations('Footer');
  const pathname = usePathname();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const currentYear = new Date().getFullYear();

  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const paymentLogos = [
    { name: 'InstaPay', src: '/payments/instapay.jpg' },
    { name: 'Vodafone Cash', src: '/payments/vodafone-cash.jpg' },
    { name: 'Orange Money', src: '/payments/orange-money.jpg' },
    { name: 'Visa', src: '/payments/visa.jpg' },
    { name: 'Mastercard', src: '/payments/mastercard.jpg' },
  ];

  // Standalone admin routes (/admin and /admin/login) do not render the public shopping footer
  if (pathname.startsWith('/admin')) {
    return null;
  }

  function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      // Inform the customer honestly that this is a portfolio demo template without saving fake data
      setNewsletterSubmitted(true);
    }
  }

  return (
    <footer className="mt-16 sm:mt-20 lg:mt-24 bg-[#20201E] text-[#FDFBF7] border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 pt-9 pb-5 sm:px-6 sm:pt-12 sm:pb-6 lg:px-8">
        {/* Top Desktop 4-Column Layout strictly matching template/footer.jpg */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Column 1: Brand & Dual Statements */}
          <div className="lg:col-span-4">
            <Link
              href="/"
              aria-label="LABSA | لَبسة"
              className="inline-block text-2xl sm:text-3xl font-extrabold tracking-tight text-white hover:text-labsa-cream transition"
            >
              LABSA | لَبسة
            </Link>

            <div className="mt-3.5 space-y-1.5 text-xs sm:text-sm text-[#A8A8A2] leading-relaxed max-w-sm">
              <p>{tFooter('brandStatementEn')}</p>
              <p className="font-arabic">{tFooter('brandStatementAr')}</p>
            </div>
          </div>

          {/* Column 2: Shop / تسوق */}
          <div className="lg:col-span-2">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {tFooter('shopHeading')}
            </h3>
            <ul className="mt-3.5 space-y-2 text-xs sm:text-sm text-[#A8A8A2]">
              <li>
                <Link
                  href="/men"
                  className="transition hover:text-white hover:underline underline-offset-4"
                >
                  {tFooter('menLink')}
                </Link>
              </li>
              <li>
                <Link
                  href="/kids"
                  className="transition hover:text-white hover:underline underline-offset-4"
                >
                  {tFooter('kidsLink')}
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="transition hover:text-white hover:underline underline-offset-4"
                >
                  {tFooter('allClothingLink')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care / خدمة العملاء */}
          <div className="lg:col-span-3">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {tFooter('customerCareHeading')}
            </h3>
            <ul className="mt-3.5 space-y-2 text-xs sm:text-sm text-[#A8A8A2]">
              <li>
                <Link
                  href="/size-guide"
                  className="transition hover:text-white hover:underline underline-offset-4"
                >
                  {tFooter('sizeGuideLink')}
                </Link>
              </li>
              <li>
                <Link
                  href="/orders/track"
                  className="transition hover:text-white hover:underline underline-offset-4"
                >
                  {tFooter('trackOrderLink')}
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/shipping"
                  className="transition hover:text-white hover:underline underline-offset-4"
                >
                  {tFooter('shippingReturnsLink')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter / النشرة البريدية */}
          <div className="lg:col-span-3">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {tFooter('newsletterHeading')}
            </h3>

            <form onSubmit={handleNewsletterSubmit} className="mt-3.5 space-y-2.5">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={tFooter('newsletterPlaceholder')}
                required
                className="w-full rounded-full border border-white/20 bg-[#2C2C29] px-4 py-2 text-xs sm:text-sm text-white placeholder-[#787872] focus:border-labsa-terracotta focus:outline-none transition"
              />

              <button
                type="submit"
                className="w-full rounded-full bg-[#C8784C] hover:bg-labsa-terracotta-dark active:scale-[0.98] px-6 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-labsa-terracotta"
              >
                {tFooter('newsletterButton')}
              </button>
            </form>

            {newsletterSubmitted && (
              <div className="mt-2.5 flex items-start gap-1.5 rounded-xl border border-white/10 bg-white/5 p-2 text-[11px] text-[#C4C4BD]">
                <Info className="h-3.5 w-3.5 shrink-0 text-labsa-terracotta mt-0.5" aria-hidden="true" />
                <p>{tFooter('newsletterDemoNote')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Thin Horizontal Divider */}
        <div className="mt-7 mb-3.5 sm:mt-9 sm:mb-4 border-t border-white/10" />

        {/* Compact Bottom Row: Social Icons, Payment Marks, Legal Row */}
        <div className="flex flex-col items-center justify-between gap-3 sm:gap-3.5 lg:flex-row text-xs py-0.5">
          {/* Social Icons: Facebook, X, Instagram, YouTube with authentic brand hover colors */}
          <div className="flex items-center gap-2 text-[#A8A8A2]">
            {/* Facebook */}
            <a
              href="#"
              aria-label="Facebook"
              title="Facebook"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#D1D1CB] transition hover:bg-[#1877F2] hover:border-[#1877F2] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1877F2]"
            >
              <Facebook className="h-3 w-3" aria-hidden="true" />
            </a>

            {/* X (formerly Twitter) */}
            <a
              href="#"
              aria-label="X (Twitter)"
              title="X (Twitter)"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#D1D1CB] transition hover:bg-white hover:border-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="#"
              aria-label="Instagram"
              title="Instagram"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#D1D1CB] transition hover:bg-[#E4405F] hover:border-[#E4405F] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E4405F]"
            >
              <Instagram className="h-3 w-3" aria-hidden="true" />
            </a>

            {/* YouTube */}
            <a
              href="#"
              aria-label="YouTube"
              title="YouTube"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#D1D1CB] transition hover:bg-[#FF0000] hover:border-[#FF0000] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF0000]"
            >
              <Youtube className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>

          {/* Payment Marks: Supplied template images only, no text captions, uniform containers */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {paymentLogos.map((pm) => (
              <div
                key={pm.name}
                title={pm.name}
                className="flex h-7 w-11 sm:h-7.5 sm:w-12 items-center justify-center rounded-md bg-white p-0.5 sm:p-1 shadow-2xs border border-white/20 select-none overflow-hidden"
              >
                <img
                  src={pm.src}
                  alt={pm.name}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ))}
          </div>

          {/* Compact Copyright & Policy Links */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs text-[#A8A8A2]">
            <span>© {currentYear} {tFooter('copyright')}</span>
            <span aria-hidden="true" className="text-white/20 select-none">•</span>
            <span>{tFooter('developedBy')} <span className="text-[#D1D1CB]">Saad Alm Eldien</span></span>
            <span aria-hidden="true" className="text-white/20 select-none">•</span>
            <Link
              href="/policies/privacy"
              className="transition hover:text-white hover:underline underline-offset-4"
            >
              {tFooter('privacyPolicy')}
            </Link>
            <span aria-hidden="true" className="text-white/20 select-none">•</span>
            <Link
              href="/policies/terms"
              className="transition hover:text-white hover:underline underline-offset-4"
            >
              {tFooter('termsPolicy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
