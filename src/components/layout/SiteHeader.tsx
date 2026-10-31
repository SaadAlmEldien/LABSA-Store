'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { PromotionalAnnouncementBar } from '@/components/layout/PromotionalAnnouncementBar';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { cn } from '@/lib/utils';
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  Truck,
  Ruler,
} from 'lucide-react';

export function SiteHeader() {
  const tNav = useTranslations('Nav');
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { totalQuantity } = useCart();
  const { totalWishlistCount } = useWishlist();
  const isHomePage = pathname === '/' || pathname === '';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close drawers when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Focus input when search opens & handle Escape key
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Standalone admin routes (/admin and /admin/login) do not render the public shopping header
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const isHomepage = pathname === '/' || pathname === '';

  const navLinks = [
    {
      href: '/men',
      labelAr: 'رجال / Men',
      labelEn: 'Men / رجال',
    },
    {
      href: '/kids',
      labelAr: 'أطفال / Kids',
      labelEn: 'Kids / أطفال',
    },
    {
      href: '/shop',
      labelAr: 'جميع القطع / All Clothing',
      labelEn: 'All Clothing / جميع القطع',
    },
    {
      href: '/about',
      labelAr: 'قصتنا / Our Story',
      labelEn: 'Our Story / قصتنا',
    },
    {
      href: '/orders/track',
      labelAr: 'تتبع طلبك / Track Order',
      labelEn: 'Track Order / تتبع طلبك',
    },
  ] as const;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/shop');
    }
    setSearchOpen(false);
    setMobileMenuOpen(false);
  }

  function isActiveRoute(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* 1. Compact Full-Width Promotional Announcement Bar: in normal document flow at the very top of the page, scrolls out of view naturally */}
      <PromotionalAnnouncementBar />

      {/* 2. Main Navigation Header directly below it */}
      <header
        className={cn(
          'z-40 w-full pointer-events-none transition-all duration-300 sticky top-0 inset-x-0',
          isHomePage && 'h-0 overflow-visible'
        )}
      >
        <div className="pt-2 sm:pt-2.5 pb-0 px-3 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Floating Translucent Navigation Panel matching template/nav.jpg:
              - Every button (except cart) uses transparent appearance
              - Logo at far right in RTL (start in LTR) with transparent background
              - Language switcher immediately beside logo (no globe, 'ع' and 'En' with black circle on active)
              - Search icon centered horizontally and slightly larger */}
          <div className="pointer-events-auto rounded-2xl border border-[#E9D7BF]/70 bg-[#FAF7F2]/65 backdrop-blur-md shadow-sm px-4 sm:px-6 py-2 transition-all">
          {/* Primary Top Row */}
          {!searchOpen ? (
            <div className="relative flex h-10 items-center justify-between gap-2 sm:gap-4">
              {/* Start Group: Logo at far right in RTL (far left in LTR) + Language Switcher immediately beside it */}
              <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
                {/* LABSA Logo: Maximized within fixed h-10 row with trimmed artwork asset */}
                <Link
                  href="/"
                  aria-label="LABSA | لَبسة"
                  className="group inline-flex shrink-0 items-center transition-transform hover:scale-[1.02] bg-transparent"
                >
                  <picture className="block bg-transparent">
                    <source srcSet="/brand/labsa-logo-transparent.webp" type="image/webp" />
                    <img
                      src="/brand/labsa-logo-transparent.png"
                      alt="LABSA | لَبسة"
                      loading="eager"
                      decoding="async"
                      className="h-9 sm:h-[38px] lg:h-10 w-auto object-contain select-none bg-transparent"
                    />
                  </picture>
                </Link>

                {/* Language Switcher immediately beside logo */}
                <LanguageSwitcher />
              </div>

              {/* Center Group (Desktop lg+): Search icon centered horizontally */}
              <div className="hidden lg:flex absolute inset-y-0 left-1/2 -translate-x-1/2 items-center justify-center pointer-events-none">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-expanded={searchOpen}
                  aria-label={tNav('openSearch')}
                  title={isAr ? 'بحث في المتجر' : 'Search store'}
                  className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-labsa-charcoal hover:text-labsa-terracotta hover:bg-black/5 active:bg-black/10 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-labsa-charcoal"
                >
                  <Search className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* End Group: Search (mobile/tablet), Wishlist, Account, Cart, Mobile Menu */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Mobile/Tablet Search Icon (< lg) */}
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-expanded={searchOpen}
                  aria-label={tNav('openSearch')}
                  title={isAr ? 'بحث في المتجر' : 'Search store'}
                  className="inline-flex lg:hidden h-9 w-9 items-center justify-center rounded-full bg-transparent text-labsa-charcoal hover:text-labsa-terracotta hover:bg-black/5 active:bg-black/10 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-labsa-charcoal"
                >
                  <Search className="h-5 w-5" aria-hidden="true" />
                </button>

                {/* Wishlist Link (Transparent appearance) */}
                <Link
                  href="/wishlist"
                  aria-label={tNav('wishlist')}
                  title={tNav('wishlist')}
                  className={cn(
                    'relative hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-labsa-charcoal hover:text-labsa-terracotta hover:bg-black/5 transition',
                    isActiveRoute('/wishlist') && 'text-labsa-terracotta'
                  )}
                >
                  <Heart
                    className={cn(
                      'h-4.5 w-4.5',
                      totalWishlistCount > 0 && 'fill-labsa-terracotta text-labsa-terracotta'
                    )}
                    aria-hidden="true"
                  />
                  {totalWishlistCount > 0 && (
                    <span className="absolute -top-0.5 -end-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-labsa-terracotta px-1 text-[9px] font-bold text-white">
                      {totalWishlistCount}
                    </span>
                  )}
                </Link>

                {/* Account Link (Transparent appearance) */}
                <Link
                  href="/account"
                  aria-label={tNav('account')}
                  title={tNav('account')}
                  className={cn(
                    'hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full bg-transparent px-2.5 text-xs font-semibold text-labsa-charcoal hover:text-labsa-terracotta hover:bg-black/5 transition',
                    isActiveRoute('/account') && 'text-labsa-terracotta'
                  )}
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden md:inline">{isAr ? 'حسابي' : 'Account'}</span>
                </Link>

                {/* Cart Button: Icon-only distinct button with screen-reader accessibility */}
                <Link
                  href="/cart"
                  aria-label={
                    isAr
                      ? totalQuantity > 0
                        ? `سلة المشتريات (${totalQuantity})`
                        : 'سلة المشتريات'
                      : totalQuantity > 0
                        ? `Shopping cart (${totalQuantity})`
                        : 'Shopping cart'
                  }
                  title={isAr ? 'سلة المشتريات' : 'Shopping cart'}
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-labsa-charcoal hover:bg-labsa-terracotta text-white shadow-2xs transition active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-labsa-charcoal shrink-0"
                >
                  <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="sr-only">
                    {isAr ? 'سلة المشتريات' : 'Shopping cart'}
                  </span>
                  {totalQuantity > 0 && (
                    <span
                      aria-live="polite"
                      className="absolute -top-1 -end-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-labsa-terracotta px-1 text-[10px] font-extrabold text-white shadow-xs"
                    >
                      {totalQuantity}
                    </span>
                  )}
                </Link>

                {/* Mobile Menu Toggle Button (transparent, lg:hidden) */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  aria-expanded={mobileMenuOpen}
                  aria-label={mobileMenuOpen ? tNav('closeMenu') : tNav('openMenu')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-transparent text-labsa-charcoal hover:bg-black/5 active:bg-black/10 transition lg:hidden"
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Menu className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Activated Search Bar overlaying the primary row */
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              aria-label={tNav('globalSearchScopeLabel')}
              className="flex h-10 items-center gap-2"
            >
              <div className="relative flex flex-1 items-center">
                <Search
                  className="pointer-events-none absolute start-3.5 h-4 w-4 text-labsa-charcoal-muted"
                  aria-hidden="true"
                />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث في كل الملابس: تشينو، هودي، سالوبيت...' : 'Search clothing: chinos, hoodies, overalls...'}
                  aria-label={tNav('globalSearchScopeLabel')}
                  className="h-9 w-full rounded-full border border-labsa-cream bg-white/95 ps-10 pe-24 text-xs sm:text-sm text-labsa-charcoal placeholder:text-labsa-charcoal-muted focus:border-labsa-terracotta focus:outline-none shadow-2xs transition"
                />
                <button
                  type="submit"
                  className="absolute end-1.5 h-6.5 rounded-full bg-labsa-charcoal px-3 text-[11px] font-bold text-white hover:bg-labsa-terracotta transition"
                >
                  {tNav('searchButton')}
                </button>
              </div>

              {/* Close search button (Escape or click) */}
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                title="Esc"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-labsa-charcoal hover:bg-black/5 transition"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          )}

          {/* Subtle Horizontal Divider */}
          <div className="hidden lg:block my-1 border-b border-[#E9D7BF]/40" />

          {/* Secondary Row: Desktop Balanced Navigation Links Row */}
          <nav
            aria-label="Primary Storefront Navigation"
            className="hidden lg:flex h-6 items-center justify-center gap-6 xl:gap-8 text-xs font-semibold text-labsa-charcoal"
          >
            {navLinks.map((item, idx) => {
              const active = isActiveRoute(item.href);
              const label = isAr ? item.labelAr : item.labelEn;
              return (
                <React.Fragment key={item.href}>
                  {idx > 0 && (
                    <span aria-hidden="true" className="text-labsa-charcoal/20 select-none text-[10px]">
                      •
                    </span>
                  )}
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'transition-colors hover:text-labsa-terracotta',
                      active ? 'font-bold text-labsa-terracotta underline underline-offset-4' : 'text-labsa-charcoal'
                    )}
                  >
                    {label}
                  </Link>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="pointer-events-auto mt-2 rounded-2xl border border-[#E9D7BF]/75 bg-[#FAF7F2]/95 backdrop-blur-md p-4 shadow-lg lg:hidden">
            <nav aria-label="Mobile Navigation" className="flex flex-col space-y-1.5">
              {navLinks.map((item) => {
                const active = isActiveRoute(item.href);
                const label = isAr ? item.labelAr : item.labelEn;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-[40px] items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition',
                      active
                        ? 'bg-labsa-terracotta text-white'
                        : 'text-labsa-charcoal hover:bg-white/80'
                    )}
                  >
                    <span>{label}</span>
                  </Link>
                );
              })}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-labsa-cream/60 mt-1">
                <Link
                  href="/account"
                  className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-labsa-cream bg-white/70 px-3 py-1.5 text-xs font-medium text-labsa-charcoal"
                >
                  <User className="h-3.5 w-3.5 text-labsa-olive-dark" aria-hidden="true" />
                  <span>{isAr ? 'حسابي' : 'Account'}</span>
                </Link>

                <Link
                  href="/wishlist"
                  className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-labsa-cream bg-white/70 px-3 py-1.5 text-xs font-medium text-labsa-charcoal"
                >
                  <Heart className="h-3.5 w-3.5 text-labsa-terracotta" aria-hidden="true" />
                  <span>{tNav('wishlist')}</span>
                </Link>

                <Link
                  href="/size-guide"
                  className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-labsa-cream bg-white/70 px-3 py-1.5 text-xs font-medium text-labsa-charcoal"
                >
                  <Ruler className="h-3.5 w-3.5 text-labsa-olive-dark" aria-hidden="true" />
                  <span>{tNav('sizeGuide')}</span>
                </Link>

                <Link
                  href="/orders/track"
                  className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-labsa-cream bg-white/70 px-3 py-1.5 text-xs font-medium text-labsa-charcoal"
                >
                  <Truck className="h-3.5 w-3.5 text-labsa-terracotta-dark" aria-hidden="true" />
                  <span>{tNav('trackOrder')}</span>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </div>
  </header>
  </>
  );
}
