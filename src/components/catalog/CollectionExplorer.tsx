'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  type Audience,
  type CategoryKey,
  type ProductColor,
  CATALOG_CATEGORIES,
  CATALOG_COLORS,
  KIDS_SIZES,
  MEN_SIZES,
  getAllVisibleProducts,
  getLocalizedText,
  isProductInStock,
} from '@/data/catalog';
import { ProductCard } from '@/components/catalog/ProductCard';
import { cn } from '@/lib/utils';
import {
  Check,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

type PriceRangeFilter = 'all' | 'under-500' | '500-900' | 'over-900';
type AvailabilityFilter = 'all' | 'in-stock' | 'out-of-stock';
type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc';

const PAGE_SIZE = 6;

interface CollectionExplorerProps {
  title: string;
  intro: string;
  fixedAudience?: Audience;
  fixedCategory?: CategoryKey;
}

export function CollectionExplorer({
  title,
  intro,
  fixedAudience,
  fixedCategory,
}: CollectionExplorerProps) {
  const locale = useLocale();
  const t = useTranslations('Catalog');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Read URL query state
  const queryParam = searchParams.get('q') ?? '';
  const audienceParam = fixedAudience ?? (searchParams.get('audience') as Audience | null);
  const categoryParam = fixedCategory ?? (searchParams.get('category') as CategoryKey | null);
  const sizeParam = searchParams.get('size');
  const colorParam = searchParams.get('color') as ProductColor['key'] | null;
  const priceParam = (searchParams.get('price') as PriceRangeFilter) || 'all';
  const availParam = (searchParams.get('availability') as AvailabilityFilter) || 'all';
  const sortParam = (searchParams.get('sort') as SortOption) || 'featured';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [searchInput, setSearchInput] = useState(queryParam);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [catalogHydrated, setCatalogHydrated] = useState(false);

  useEffect(() => {
    setCatalogHydrated(true);
  }, []);

  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  function updateUrlParams(updates: Record<string, string | null>, resetPage = true) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (!val || val === 'all') {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    }
    if (resetPage) {
      next.delete('page');
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function handleResetFilters() {
    setSearchInput('');
    router.replace(pathname, { scroll: false });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateUrlParams({ q: searchInput.trim() || null });
  }

  // Available size pills based on selected audience
  const availableSizes = useMemo(() => {
    if (audienceParam === 'men') return [...MEN_SIZES];
    if (audienceParam === 'kids') return [...KIDS_SIZES];
    return [...MEN_SIZES, ...KIDS_SIZES];
  }, [audienceParam]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const all = catalogHydrated ? getAllVisibleProducts() : getAllVisibleProducts();
    const normalizedQuery = queryParam.trim().toLowerCase();

    const matches = all.filter((product) => {
      // 1. Audience filter
      if (audienceParam && product.audience !== audienceParam) {
        return false;
      }

      // 2. Category filter
      if (categoryParam && product.category !== categoryParam) {
        return false;
      }

      // 3. Search query filter (matches Arabic & English title, description, category, or colors)
      if (normalizedQuery) {
        const searchableText = [
          product.title.ar,
          product.title.en,
          product.shortDescription.ar,
          product.shortDescription.en,
          product.description.ar,
          product.description.en,
          product.details.material.ar,
          product.details.material.en,
          ...product.colors.flatMap((c) => [c.name.ar, c.name.en]),
        ]
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(normalizedQuery)) {
          return false;
        }
      }

      // 4. Size filter (checks if product offers this size)
      if (sizeParam && !product.sizes.includes(sizeParam)) {
        return false;
      }

      // 5. Color filter (checks if product offers this color)
      if (colorParam && !product.colors.some((c) => c.key === colorParam)) {
        return false;
      }

      // 6. If both size AND color are selected, or availability is "in-stock", verify variant stock
      const productHasStock = isProductInStock(product);
      if (availParam === 'in-stock') {
        if (!productHasStock) return false;
        // Also ensure that if a size or color is chosen, at least one matching variant is in stock
        const matchingVariantInStock = product.variants.some((v) => {
          const sizeMatch = !sizeParam || v.size === sizeParam;
          const colorMatch = !colorParam || v.colorKey === colorParam;
          return sizeMatch && colorMatch && v.stock > 0;
        });
        if (!matchingVariantInStock) return false;
      } else if (availParam === 'out-of-stock') {
        if (productHasStock) return false;
      }

      // 7. Price range filter (in EGP)
      if (priceParam === 'under-500' && product.priceEgp >= 500) {
        return false;
      }
      if (
        priceParam === '500-900' &&
        (product.priceEgp < 500 || product.priceEgp > 900)
      ) {
        return false;
      }
      if (priceParam === 'over-900' && product.priceEgp <= 900) {
        return false;
      }

      return true;
    });

    // Sort matching products
    return [...matches].sort((a, b) => {
      if (sortParam === 'price-asc') {
        return a.priceEgp - b.priceEgp;
      }
      if (sortParam === 'price-desc') {
        return b.priceEgp - a.priceEgp;
      }
      if (sortParam === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // Default: featured / recommended
      return a.featuredRank - b.featuredRank;
    });
  }, [
    audienceParam,
    categoryParam,
    queryParam,
    sizeParam,
    colorParam,
    availParam,
    priceParam,
    sortParam,
    catalogHydrated,
  ]);

  const visibleCount = Math.min(filteredProducts.length, pageParam * PAGE_SIZE);
  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const remainingCount = Math.max(0, filteredProducts.length - visibleCount);

  // Active filter tags for quick visual inspection and removal
  const activeFilterChips: { key: string; label: string; onClear: () => void }[] = [];

  if (queryParam) {
    activeFilterChips.push({
      key: 'q',
      label: `"${queryParam}"`,
      onClear: () => {
        setSearchInput('');
        updateUrlParams({ q: null });
      },
    });
  }
  if (!fixedAudience && audienceParam) {
    activeFilterChips.push({
      key: 'audience',
      label: audienceParam === 'men' ? t('audienceMen') : t('audienceKids'),
      onClear: () => updateUrlParams({ audience: null }),
    });
  }
  if (!fixedCategory && categoryParam) {
    const catObj = CATALOG_CATEGORIES.find((c) => c.key === categoryParam);
    activeFilterChips.push({
      key: 'category',
      label: catObj ? getLocalizedText(catObj.name, locale) : categoryParam,
      onClear: () => updateUrlParams({ category: null }),
    });
  }
  if (sizeParam) {
    activeFilterChips.push({
      key: 'size',
      label: `${t('sizeLabel')}: ${sizeParam}`,
      onClear: () => updateUrlParams({ size: null }),
    });
  }
  if (colorParam && CATALOG_COLORS[colorParam]) {
    activeFilterChips.push({
      key: 'color',
      label: getLocalizedText(CATALOG_COLORS[colorParam].name, locale),
      onClear: () => updateUrlParams({ color: null }),
    });
  }
  if (priceParam !== 'all') {
    const priceLabels: Record<PriceRangeFilter, string> = {
      all: t('priceAll'),
      'under-500': t('priceUnder500'),
      '500-900': t('price500To900'),
      'over-900': t('priceOver900'),
    };
    activeFilterChips.push({
      key: 'price',
      label: priceLabels[priceParam],
      onClear: () => updateUrlParams({ price: null }),
    });
  }
  if (availParam !== 'all') {
    activeFilterChips.push({
      key: 'availability',
      label: availParam === 'in-stock' ? t('availInStock') : t('availOutOfStock'),
      onClear: () => updateUrlParams({ availability: null }),
    });
  }

  // Shared filter controls panel rendered in Desktop Sidebar & Mobile Sheet
  function renderFilterControls() {
    return (
      <div className="space-y-6">
        {/* 1. Department / Audience Filter (Only when not fixed to /men or /kids) */}
        {!fixedAudience && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-labsa-charcoal">
              {t('audienceLabel')}
            </h3>
            <div className="mt-2.5 flex flex-col space-y-1.5">
              {[
                { val: null, label: t('audienceAll') },
                { val: 'men', label: t('audienceMen') },
                { val: 'kids', label: t('audienceKids') },
              ].map((opt) => {
                const selected = (audienceParam ?? null) === opt.val;
                return (
                  <button
                    key={opt.val ?? 'all'}
                    type="button"
                    onClick={() => updateUrlParams({ audience: opt.val, size: null })}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-2 text-start text-xs font-semibold transition',
                      selected
                        ? 'bg-labsa-charcoal text-labsa-white'
                        : 'bg-labsa-canvas text-labsa-charcoal hover:bg-labsa-surface'
                    )}
                  >
                    <span>{opt.label}</span>
                    {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Category Filter */}
        {!fixedCategory && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-labsa-charcoal">
              {t('categoryLabel')}
            </h3>
            <div className="mt-2.5 flex flex-col space-y-1.5">
              <button
                type="button"
                onClick={() => updateUrlParams({ category: null })}
                className={cn(
                  'flex items-center justify-between rounded-xl px-3 py-2 text-start text-xs font-semibold transition',
                  !categoryParam
                    ? 'bg-labsa-olive text-labsa-white'
                    : 'bg-labsa-canvas text-labsa-charcoal hover:bg-labsa-surface'
                )}
              >
                <span>{t('categoryAll')}</span>
                {!categoryParam && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              </button>

              {CATALOG_CATEGORIES.map((cat) => {
                const selected = categoryParam === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() =>
                      updateUrlParams({ category: selected ? null : cat.key })
                    }
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-2 text-start text-xs font-semibold transition',
                      selected
                        ? 'bg-labsa-olive text-labsa-white'
                        : 'bg-labsa-canvas text-labsa-charcoal hover:bg-labsa-surface'
                    )}
                  >
                    <span>{getLocalizedText(cat.name, locale)}</span>
                    {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Size Filter */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-labsa-charcoal">
            {t('sizeLabel')}
          </h3>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {availableSizes.map((sz) => {
              const selected = sizeParam === sz;
              return (
                <button
                  key={sz}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => updateUrlParams({ size: selected ? null : sz })}
                  className={cn(
                    'min-h-[44px] min-w-[44px] rounded-lg border px-2.5 py-1.5 font-mono text-xs font-bold transition',
                    selected
                      ? 'border-labsa-terracotta bg-labsa-terracotta text-labsa-white shadow-sm'
                      : 'border-labsa-cream bg-labsa-canvas text-labsa-charcoal hover:border-labsa-charcoal'
                  )}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Color Filter (Accessible: shows color swatch + localized name + check icon) */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-labsa-charcoal">
            {t('colorLabel')}
          </h3>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {Object.values(CATALOG_COLORS).map((color) => {
              const selected = colorParam === color.key;
              return (
                <button
                  key={color.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    updateUrlParams({ color: selected ? null : color.key })
                  }
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    selected
                      ? 'border-labsa-charcoal bg-labsa-charcoal text-labsa-white shadow-sm'
                      : 'border-labsa-cream bg-labsa-canvas text-labsa-charcoal hover:border-labsa-terracotta'
                  )}
                >
                  <span
                    style={{ backgroundColor: color.hex }}
                    className="h-3.5 w-3.5 rounded-full border border-labsa-white/60"
                    aria-hidden="true"
                  />
                  <span>{getLocalizedText(color.name, locale)}</span>
                  {selected && <Check className="h-3 w-3" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Price Range Filter (EGP) */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-labsa-charcoal">
            {t('priceLabel')}
          </h3>
          <div className="mt-2.5 flex flex-col space-y-1.5">
            {(
              [
                { val: 'all', label: t('priceAll') },
                { val: 'under-500', label: t('priceUnder500') },
                { val: '500-900', label: t('price500To900') },
                { val: 'over-900', label: t('priceOver900') },
              ] as const
            ).map((opt) => {
              const selected = priceParam === opt.val;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => updateUrlParams({ price: opt.val })}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-3 py-2 text-start text-xs font-semibold transition',
                    selected
                      ? 'bg-labsa-terracotta text-labsa-white'
                      : 'bg-labsa-canvas text-labsa-charcoal hover:bg-labsa-surface'
                  )}
                >
                  <span>{opt.label}</span>
                  {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Availability Filter */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-labsa-charcoal">
            {t('availabilityLabel')}
          </h3>
          <div className="mt-2.5 flex flex-col space-y-1.5">
            {(
              [
                { val: 'all', label: t('availAll') },
                { val: 'in-stock', label: t('availInStock') },
                { val: 'out-of-stock', label: t('availOutOfStock') },
              ] as const
            ).map((opt) => {
              const selected = availParam === opt.val;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => updateUrlParams({ availability: opt.val })}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-3 py-2 text-start text-xs font-semibold transition',
                    selected
                      ? 'bg-labsa-charcoal text-labsa-white'
                      : 'bg-labsa-canvas text-labsa-charcoal hover:bg-labsa-surface'
                  )}
                >
                  <span>{opt.label}</span>
                  {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reset All Filters Button */}
        {activeFilterChips.length > 0 && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-labsa-terracotta px-4 py-2.5 text-xs font-bold text-labsa-terracotta-dark transition hover:bg-labsa-terracotta-light"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('resetFilters')}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Collection Header Banner */}
      <div className="rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-extrabold text-labsa-charcoal sm:text-4xl">
              {queryParam
                ? t('searchResultsTitle', { query: queryParam })
                : title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-labsa-charcoal-muted sm:text-base">
              {queryParam ? t('searchResultsIntro') : intro}
            </p>
          </div>

          <div className="rounded-xl border border-labsa-cream bg-labsa-canvas px-4 py-2 text-xs font-bold text-labsa-charcoal">
            {t('showingCount', {
              shown: visibleProducts.length,
              total: filteredProducts.length,
            })}
          </div>
        </div>

        {/* Collection Search & Sort Control Bar */}
        <div className="mt-6 flex flex-col gap-3 border-t border-dashed border-labsa-cream pt-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          {/* In-Page Collection Filter Search Form (Explicitly Scoped) */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full min-w-0 flex-1 sm:max-w-md"
          >
            <label
              htmlFor="catalog-collection-search-input"
              className="mb-1.5 block text-xs font-bold text-labsa-olive-dark"
            >
              {fixedAudience === 'men'
                ? t('catalogSearchScopeMen')
                : fixedAudience === 'kids'
                  ? t('catalogSearchScopeKids')
                  : t('catalogSearchScopeAll')}
            </label>
            <div className="flex min-w-0 items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-labsa-charcoal-muted"
                  aria-hidden="true"
                />
                <input
                  id="catalog-collection-search-input"
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={
                    fixedAudience === 'men'
                      ? t('searchPlaceholderMen')
                      : fixedAudience === 'kids'
                        ? t('searchPlaceholderKids')
                        : t('searchPlaceholder')
                  }
                  aria-label={
                    fixedAudience === 'men'
                      ? t('catalogSearchScopeMen')
                      : fixedAudience === 'kids'
                        ? t('catalogSearchScopeKids')
                        : t('catalogSearchScopeAll')
                  }
                  className="min-h-[44px] w-full min-w-0 rounded-xl border border-labsa-cream bg-labsa-canvas ps-10 pe-3 py-2 text-sm text-labsa-charcoal placeholder:text-labsa-charcoal-light focus:border-labsa-terracotta focus:bg-labsa-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="min-h-[44px] shrink-0 rounded-xl bg-labsa-olive px-4 py-2 text-xs font-bold text-labsa-white transition hover:bg-labsa-olive-dark"
              >
                {t('searchButton')}
              </button>
            </div>
          </form>

          {/* Mobile Filter Sheet Trigger + Sort Dropdown */}
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2.5 sm:justify-end">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-labsa-cream bg-labsa-canvas px-4 py-2 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-terracotta lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4 text-labsa-terracotta-dark" aria-hidden="true" />
              <span>{t('openFiltersMobile')}</span>
              {activeFilterChips.length > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-labsa-terracotta px-1.5 text-[11px] text-labsa-white">
                  {activeFilterChips.length}
                </span>
              )}
            </button>

            <div className="flex min-w-0 items-center gap-2">
              <label
                htmlFor="catalog-sort-select"
                className="shrink-0 text-xs font-bold text-labsa-charcoal-muted"
              >
                {t('sortLabel')}
              </label>
              <select
                id="catalog-sort-select"
                value={sortParam}
                onChange={(e) =>
                  updateUrlParams({ sort: e.target.value as SortOption }, false)
                }
                className="min-h-[44px] max-w-full min-w-0 rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-xs font-bold text-labsa-charcoal focus:border-labsa-terracotta focus:bg-labsa-white focus:outline-none"
              >
                <option value="featured">{t('sortFeatured')}</option>
                <option value="newest">{t('sortNewest')}</option>
                <option value="price-asc">{t('sortPriceAsc')}</option>
                <option value="price-desc">{t('sortPriceDesc')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFilterChips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-labsa-cream pt-4">
            <span className="text-xs font-bold text-labsa-charcoal-muted">
              {t('activeFiltersLabel')}
            </span>
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onClear}
                className="inline-flex items-center gap-1.5 rounded-full border border-labsa-terracotta/50 bg-labsa-terracotta-light px-3 py-1 text-xs font-bold text-labsa-terracotta-dark transition hover:bg-labsa-terracotta hover:text-labsa-white"
              >
                <span>{chip.label}</span>
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            ))}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-labsa-olive-dark underline hover:text-labsa-terracotta-dark"
            >
              {t('resetFilters')}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Layout: Desktop Filter Sidebar + Product Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Desktop Filters Sidebar */}
        <aside
          aria-label={t('filtersTitle')}
          className="hidden min-w-0 lg:col-span-3 lg:block"
        >
          <div className="sticky top-28 rounded-2xl border border-labsa-cream bg-labsa-white p-5 shadow-craft">
            <div className="mb-4 flex items-center justify-between border-b border-dashed border-labsa-cream pb-3">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-labsa-charcoal">
                <SlidersHorizontal className="h-4 w-4 text-labsa-terracotta-dark" aria-hidden="true" />
                <span>{t('filtersTitle')}</span>
              </h2>
            </div>
            {renderFilterControls()}
          </div>
        </aside>

        {/* Product Results Column */}
        <div className="min-w-0 lg:col-span-9">
          {visibleProducts.length === 0 ? (
            /* Helpful Empty State */
            <div className="rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-10 text-center shadow-craft">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-labsa-surface text-labsa-terracotta">
                <Search className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-extrabold text-labsa-charcoal">
                {queryParam
                  ? t('emptySearchTitle', { query: queryParam })
                  : t('emptyTitle')}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-labsa-charcoal-muted">
                {queryParam
                  ? t('emptySearchDescription')
                  : t('emptyDescription')}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-labsa-terracotta px-5 py-2.5 text-sm font-bold text-labsa-white transition hover:bg-labsa-terracotta-dark"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>{t('resetFilters')}</span>
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Progressive Loading ("Load More") Footer */}
              <div className="mt-10 flex flex-col items-center justify-center gap-3">
                <p className="text-xs font-semibold text-labsa-charcoal-muted">
                  {t('showingCount', {
                    shown: visibleProducts.length,
                    total: filteredProducts.length,
                  })}
                </p>

                {remainingCount > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateUrlParams({ page: String(pageParam + 1) }, false)
                    }
                    className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border-2 border-labsa-charcoal bg-labsa-white px-6 py-2.5 text-sm font-bold text-labsa-charcoal shadow-sm transition hover:bg-labsa-charcoal hover:text-labsa-white"
                  >
                    <span>
                      {t('loadMoreCta', { remaining: remainingCount })}
                    </span>
                  </button>
                ) : (
                  filteredProducts.length > PAGE_SIZE && (
                    <span className="text-xs text-labsa-olive-dark">
                      {t('allLoadedNote', { total: filteredProducts.length })}
                    </span>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer / Sheet */}
      {mobileFiltersOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('filtersTitle')}
          className="fixed inset-0 z-50 flex justify-end bg-labsa-charcoal/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileFiltersOpen(false)}
        >
          <div
            className="flex h-full w-full max-w-sm flex-col justify-between overflow-y-auto bg-labsa-white p-5 shadow-craft-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between border-b border-dashed border-labsa-cream pb-4">
                <h2 className="flex items-center gap-2 text-base font-extrabold text-labsa-charcoal">
                  <SlidersHorizontal className="h-4 w-4 text-labsa-terracotta" aria-hidden="true" />
                  <span>{t('filtersTitle')}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label={t('closeFilters')}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-labsa-cream bg-labsa-canvas text-labsa-charcoal"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-5">{renderFilterControls()}</div>
            </div>

            <div className="sticky bottom-0 mt-6 border-t border-labsa-cream bg-labsa-white pt-4">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full rounded-xl bg-labsa-terracotta py-3 text-sm font-bold text-labsa-white shadow-craft transition hover:bg-labsa-terracotta-dark"
              >
                {t('applyFilters', { count: filteredProducts.length })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
