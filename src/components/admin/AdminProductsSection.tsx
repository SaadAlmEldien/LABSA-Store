'use client';

import React, { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  APPROVED_LOCAL_PRODUCT_IMAGES,
  APPROVED_PRODUCT_COLORS,
  CATALOG_CATEGORIES,
  DEMO_PRODUCTS,
  type Audience,
  type CatalogProduct,
  type CategoryKey,
  type ProductColor,
  type ProductStatus,
  type ProductVariant,
  getLocalizedText,
  isApprovedLocalImageUrl,
  writeCatalogProducts,
} from '@/data/catalog';
import {
  isProductReferencedInOrders,
  readStockDeductions,
} from '@/data/orders';
import { formatEGP, cn } from '@/lib/utils';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Edit3,
  Image as ImageIcon,
  Layers,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';

interface AdminProductsSectionProps {
  products: CatalogProduct[];
  onCatalogUpdated: () => void;
  authorizeAction: (actionType: string) => Promise<{
    authorized: boolean;
    actorIdentity?: string;
    serverTimestamp?: string;
  }>;
}

export function AdminProductsSection({
  products,
  onCatalogUpdated,
  authorizeAction,
}: AdminProductsSectionProps) {
  const locale = useLocale();
  const t = useTranslations('Admin.products');

  const [searchQuery, setSearchQuery] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Product Form State
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [shortDescAr, setShortDescAr] = useState('');
  const [shortDescEn, setShortDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [audience, setAudience] = useState<Audience>('men');
  const [category, setCategory] = useState<CategoryKey>('trousers');
  const [priceEgp, setPriceEgp] = useState<string>('650');
  const [previousPriceEgp, setPreviousPriceEgp] = useState<string>('');
  const [status, setStatus] = useState<ProductStatus>('active');
  const [selectedLocalImageUrl, setSelectedLocalImageUrl] = useState<string>(
    APPROVED_LOCAL_PRODUCT_IMAGES[0].url
  );
  const [materialAr, setMaterialAr] = useState('');
  const [materialEn, setMaterialEn] = useState('');
  const [fitAr, setFitAr] = useState('');
  const [fitEn, setFitEn] = useState('');
  const [careAr, setCareAr] = useState('');
  const [careEn, setCareEn] = useState('');
  const [variantsDraft, setVariantsDraft] = useState<ProductVariant[]>([]);

  // New Variant Subform inside Modal
  const [newVariantColorKey, setNewVariantColorKey] =
    useState<ProductColor['key']>('olive');
  const [newVariantSize, setNewVariantSize] = useState('M');
  const [newVariantStock, setNewVariantStock] = useState('5');

  const [formError, setFormError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const stockDeductions = useMemo(() => {
    void products;
    return readStockDeductions();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (audienceFilter !== 'all' && p.audience !== audienceFilter) {
        return false;
      }
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      if (q) {
        const hay = [
          p.title.ar,
          p.title.en,
          p.slug,
          ...p.variants.map((v) => v.sku),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, searchQuery, audienceFilter, statusFilter]);

  function openAddNewModal() {
    setEditingProductId(null);
    setTitleAr('');
    setTitleEn('');
    setShortDescAr('');
    setShortDescEn('');
    setDescAr('');
    setDescEn('');
    setAudience('men');
    setCategory('shirts');
    setPriceEgp('690');
    setPreviousPriceEgp('');
    setStatus('active');
    setSelectedLocalImageUrl(APPROVED_LOCAL_PRODUCT_IMAGES[0].url);
    setMaterialAr('100% قطن مصري عالي الجودة');
    setMaterialEn('100% Combed Egyptian Cotton');
    setFitAr('قصة يومية مريحة');
    setFitEn('Comfortable Everyday Regular Fit');
    setCareAr('غسيل آلي بماء بارد (30 درجة مئوية)');
    setCareEn('Machine wash cold (30°C)');
    setVariantsDraft([
      {
        id: `v-custom-${Date.now()}-1`,
        sku: `LAB-NEW-OLV-M`,
        colorKey: 'olive',
        size: 'M',
        stock: 6,
      },
      {
        id: `v-custom-${Date.now()}-2`,
        sku: `LAB-NEW-OLV-L`,
        colorKey: 'olive',
        size: 'L',
        stock: 5,
      },
    ]);
    setFormError(null);
    setIsEditingModalOpen(true);
  }

  function openEditModal(product: CatalogProduct) {
    setEditingProductId(product.id);
    setTitleAr(product.title.ar);
    setTitleEn(product.title.en);
    setShortDescAr(product.shortDescription.ar);
    setShortDescEn(product.shortDescription.en);
    setDescAr(product.description.ar);
    setDescEn(product.description.en);
    setAudience(product.audience);
    setCategory(product.category);
    setPriceEgp(String(product.priceEgp));
    setPreviousPriceEgp(
      product.previousPriceEgp ? String(product.previousPriceEgp) : ''
    );
    setStatus(product.status);
    setSelectedLocalImageUrl(
      product.images[0]?.url ?? APPROVED_LOCAL_PRODUCT_IMAGES[0].url
    );
    setMaterialAr(product.details.material.ar);
    setMaterialEn(product.details.material.en);
    setFitAr(product.details.fit.ar);
    setFitEn(product.details.fit.en);
    setCareAr(product.details.care.ar);
    setCareEn(product.details.care.en);
    setVariantsDraft(product.variants.map((v) => ({ ...v })));
    setFormError(null);
    setIsEditingModalOpen(true);
  }

  function handleUpdateDraftVariantStock(variantId: string, rawVal: string) {
    const parsed = parseInt(rawVal, 10);
    const safeStock = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    setVariantsDraft((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, stock: safeStock } : v))
    );
  }

  function handleAddVariantToDraft() {
    const cleanSize = newVariantSize.trim().toUpperCase();
    if (!cleanSize) return;
    const parsedStock = Math.max(0, parseInt(newVariantStock, 10) || 0);

    const exists = variantsDraft.some(
      (v) => v.colorKey === newVariantColorKey && v.size === cleanSize
    );
    if (exists) {
      setVariantsDraft((prev) =>
        prev.map((v) =>
          v.colorKey === newVariantColorKey && v.size === cleanSize
            ? { ...v, stock: parsedStock }
            : v
        )
      );
      return;
    }

    const newVar: ProductVariant = {
      id: `v-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      sku: `LAB-${newVariantColorKey.slice(0, 3).toUpperCase()}-${cleanSize}-${Math.floor(
        Math.random() * 90 + 10
      )}`,
      colorKey: newVariantColorKey,
      size: cleanSize,
      stock: parsedStock,
    };

    setVariantsDraft((prev) => [...prev, newVar]);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setBannerSuccess(null);

    if (
      !titleAr.trim() ||
      !titleEn.trim() ||
      !shortDescAr.trim() ||
      !shortDescEn.trim() ||
      !descAr.trim() ||
      !descEn.trim() ||
      !materialAr.trim() ||
      !materialEn.trim() ||
      !fitAr.trim() ||
      !fitEn.trim() ||
      !careAr.trim() ||
      !careEn.trim()
    ) {
      setFormError(t('errorRequiredFields'));
      return;
    }

    const numericPrice = Math.round(Number(priceEgp));
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setFormError(t('errorInvalidPrice'));
      return;
    }

    const numericPrevPrice = previousPriceEgp.trim()
      ? Math.round(Number(previousPriceEgp))
      : undefined;

    if (!isApprovedLocalImageUrl(selectedLocalImageUrl)) {
      setFormError(t('errorInvalidImage'));
      return;
    }

    if (variantsDraft.length === 0) {
      setFormError(t('errorNoVariants'));
      return;
    }

    if (variantsDraft.some((v) => v.stock < 0 || !Number.isFinite(v.stock))) {
      setFormError(t('errorNegativeStock'));
      return;
    }

    setIsSaving(true);
    try {
      const authRes = await authorizeAction('save_catalog_product');
      if (!authRes.authorized) {
        setFormError(t('errorRequiredFields'));
        return;
      }

      const usedColorKeys = Array.from(
        new Set(variantsDraft.map((v) => v.colorKey))
      );
      const usedColors: ProductColor[] = usedColorKeys.map(
        (key) =>
          APPROVED_PRODUCT_COLORS.find((c) => c.key === key) ??
          APPROVED_PRODUCT_COLORS[0]
      );
      const usedSizes = Array.from(new Set(variantsDraft.map((v) => v.size)));

      const matchedLocalAsset =
        APPROVED_LOCAL_PRODUCT_IMAGES.find(
          (a) => a.url === selectedLocalImageUrl
        ) ?? APPROVED_LOCAL_PRODUCT_IMAGES[0];

      if (editingProductId) {
        const existing = products.find((p) => p.id === editingProductId);
        if (!existing) return;

        const updatedProduct: CatalogProduct = {
          ...existing,
          audience,
          category,
          title: { ar: titleAr.trim(), en: titleEn.trim() },
          shortDescription: {
            ar: shortDescAr.trim(),
            en: shortDescEn.trim(),
          },
          description: { ar: descAr.trim(), en: descEn.trim() },
          priceEgp: numericPrice,
          previousPriceEgp:
            numericPrevPrice && numericPrevPrice > numericPrice
              ? numericPrevPrice
              : undefined,
          status,
          colors: usedColors,
          sizes: usedSizes,
          variants: variantsDraft,
          images: [
            {
              id: existing.images[0]?.id ?? `img-${Date.now()}`,
              url: matchedLocalAsset.url,
              fallbackUrl: matchedLocalAsset.fallbackUrl,
              alt: { ar: titleAr.trim(), en: titleEn.trim() },
              isPrimary: true,
            },
            ...existing.images.slice(1),
          ],
          details: {
            material: { ar: materialAr.trim(), en: materialEn.trim() },
            fit: { ar: fitAr.trim(), en: fitEn.trim() },
            care: { ar: careAr.trim(), en: careEn.trim() },
          },
        };

        const nextProducts = products.map((p) =>
          p.id === editingProductId ? updatedProduct : p
        );
        try {
          await fetch('/api/admin/catalog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', product: updatedProduct }),
          });
        } catch {
          // Fallback
        }
        writeCatalogProducts(nextProducts);
      } else {
        const slugBase = titleEn
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const newProduct: CatalogProduct = {
          id: `prod-custom-${Date.now()}`,
          slug: `${slugBase || 'labsa-garment'}-${Math.floor(
            Math.random() * 900 + 100
          )}`,
          audience,
          category,
          title: { ar: titleAr.trim(), en: titleEn.trim() },
          shortDescription: {
            ar: shortDescAr.trim(),
            en: shortDescEn.trim(),
          },
          description: { ar: descAr.trim(), en: descEn.trim() },
          priceEgp: numericPrice,
          previousPriceEgp:
            numericPrevPrice && numericPrevPrice > numericPrice
              ? numericPrevPrice
              : undefined,
          colors: usedColors,
          sizes: usedSizes,
          variants: variantsDraft,
          images: [
            {
              id: `img-${Date.now()}-1`,
              url: matchedLocalAsset.url,
              fallbackUrl: matchedLocalAsset.fallbackUrl,
              alt: { ar: titleAr.trim(), en: titleEn.trim() },
              isPrimary: true,
            },
          ],
          status,
          isNew: true,
          isFeatured: false,
          featuredRank: products.length + 1,
          createdAt: new Date().toISOString(),
          details: {
            material: { ar: materialAr.trim(), en: materialEn.trim() },
            fit: { ar: fitAr.trim(), en: fitEn.trim() },
            care: { ar: careAr.trim(), en: careEn.trim() },
          },
        };

        try {
          await fetch('/api/admin/catalog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', product: newProduct }),
          });
        } catch {
          // Fallback
        }
        writeCatalogProducts([newProduct, ...products]);
      }

      setIsEditingModalOpen(false);
      setBannerSuccess(t('productSavedBanner'));
      onCatalogUpdated();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleArchive(product: CatalogProduct) {
    const authRes = await authorizeAction('toggle_product_archive');
    if (!authRes.authorized) return;

    try {
      await fetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_archive', productId: product.id }),
      });
    } catch {
      // Fallback
    }

    const nextStatus: ProductStatus =
      product.status === 'draft' ? 'active' : 'draft';
    const nextProducts = products.map((p) =>
      p.id === product.id ? { ...p, status: nextStatus } : p
    );
    writeCatalogProducts(nextProducts);
    setBannerSuccess(t('productSavedBanner'));
    onCatalogUpdated();
  }

  async function handleResetCatalogSeed() {
    const authRes = await authorizeAction('reset_catalog_seed');
    if (!authRes.authorized) return;
    writeCatalogProducts(DEMO_PRODUCTS);
    setBannerSuccess(t('productSavedBanner'));
    onCatalogUpdated();
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft">
        <div>
          <h2 className="text-xl font-extrabold text-labsa-charcoal sm:text-2xl">
            {t('heading')}
          </h2>
          <p className="mt-1 text-xs text-labsa-charcoal-muted sm:text-sm">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={openAddNewModal}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-labsa-terracotta px-4 py-2.5 text-xs font-extrabold text-labsa-white shadow-craft transition hover:bg-labsa-terracotta-dark"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t('addNewProductButton')}</span>
          </button>
          <button
            type="button"
            onClick={handleResetCatalogSeed}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-labsa-cream bg-labsa-canvas px-4 py-2.5 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-charcoal"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('resetSeedButton')}</span>
          </button>
        </div>
      </div>

      {bannerSuccess && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-labsa-status-success/40 bg-labsa-status-success/10 p-4 text-xs font-extrabold text-labsa-status-success"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{bannerSuccess}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-5 shadow-craft">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search
              className="pointer-events-none absolute start-3.5 top-3 h-4 w-4 text-labsa-charcoal-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              className="min-h-[42px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas ps-10 pe-4 py-2 text-xs text-labsa-charcoal focus:border-labsa-terracotta focus:bg-labsa-white focus:outline-none sm:text-sm"
            />
          </div>

          <div>
            <select
              aria-label={t('filterAudience')}
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="min-h-[42px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-xs font-bold text-labsa-charcoal"
            >
              <option value="all">{t('audienceAll')}</option>
              <option value="men">{t('audienceMen')}</option>
              <option value="kids">{t('audienceKids')}</option>
            </select>
          </div>

          <div>
            <select
              aria-label={t('filterStatus')}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-[42px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-xs font-bold text-labsa-charcoal"
            >
              <option value="all">{t('statusAll')}</option>
              <option value="active">{t('statusActive')}</option>
              <option value="out_of_stock">{t('statusOutOfStock')}</option>
              <option value="draft">{t('statusDraft')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredProducts.map((product) => {
          const inOrders = isProductReferencedInOrders(product.id);
          const totalLiveStock = product.variants.reduce((sum, v) => {
            const ded = stockDeductions[v.id] ?? 0;
            return sum + Math.max(0, v.stock - ded);
          }, 0);

          return (
            <article
              key={product.id}
              className={cn(
                'flex flex-col justify-between rounded-3xl border bg-labsa-white p-5 shadow-craft transition',
                product.status === 'draft'
                  ? 'border-dashed border-labsa-charcoal-light opacity-85'
                  : 'border-labsa-cream'
              )}
            >
              <div>
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-labsa-cream bg-labsa-canvas">
                    <img
                      src={product.images[0]?.url}
                      alt={getLocalizedText(product.title, locale)}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                          product.status === 'active'
                            ? 'bg-labsa-status-success/15 text-labsa-status-success'
                            : product.status === 'out_of_stock'
                              ? 'bg-labsa-status-danger/15 text-labsa-status-danger'
                              : 'bg-labsa-surface text-labsa-charcoal-muted'
                        )}
                      >
                        {product.status === 'active'
                          ? t('statusActive')
                          : product.status === 'out_of_stock'
                            ? t('statusOutOfStock')
                            : t('statusDraft')}
                      </span>
                      <span className="rounded-full bg-labsa-canvas px-2.5 py-0.5 text-[11px] font-bold text-labsa-olive-dark">
                        {product.audience === 'men'
                          ? t('audienceMen')
                          : t('audienceKids')}
                      </span>
                    </div>

                    <h3 className="mt-1.5 text-base font-extrabold text-labsa-charcoal">
                      {getLocalizedText(product.title, locale)}
                    </h3>
                    <p className="mt-0.5 text-xs text-labsa-charcoal-muted">
                      {locale === 'ar' ? product.title.en : product.title.ar}
                    </p>
                    <p className="mt-1.5 font-mono text-sm font-extrabold text-labsa-terracotta-dark">
                      {formatEGP(product.priceEgp, locale)}
                    </p>
                  </div>
                </div>

                {/* Variant Inventory Chips */}
                <div className="mt-4 rounded-2xl border border-labsa-cream bg-labsa-canvas p-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-labsa-charcoal">
                      {t('totalVariantsLabel', {
                        count: product.variants.length,
                      })}
                    </span>
                    <span
                      className={cn(
                        'font-mono font-extrabold',
                        totalLiveStock > 0
                          ? 'text-labsa-olive-dark'
                          : 'text-labsa-status-danger'
                      )}
                    >
                      {t('totalStockLabel', { stock: totalLiveStock })}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {product.variants.map((v) => {
                      const ded = stockDeductions[v.id] ?? 0;
                      const live = Math.max(0, v.stock - ded);
                      return (
                        <span
                          key={v.id}
                          className={cn(
                            'rounded-lg border px-2 py-0.5 font-mono text-[11px]',
                            live > 0
                              ? 'border-labsa-cream bg-labsa-white text-labsa-charcoal'
                              : 'border-labsa-status-danger/40 bg-labsa-status-danger/10 font-bold text-labsa-status-danger'
                          )}
                        >
                          {v.colorKey}/{v.size}: {live}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {inOrders && (
                  <p className="mt-2.5 text-[11px] font-bold text-labsa-olive-dark">
                    • {t('inHistoricalOrdersBadge')}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-dashed border-labsa-cream pt-3.5">
                <button
                  type="button"
                  onClick={() => openEditModal(product)}
                  className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-labsa-charcoal px-3.5 py-2 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-terracotta"
                >
                  <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t('editProductButton')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleArchive(product)}
                  className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-labsa-cream bg-labsa-canvas px-3.5 py-2 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-charcoal"
                >
                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {product.status === 'draft'
                      ? t('restoreButton')
                      : t('archiveButton')}
                  </span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Add / Edit Product & Variant Inventory Modal */}
      {isEditingModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-product-modal-title"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-labsa-charcoal/60 p-3 backdrop-blur-xs sm:p-6"
        >
          <div className="my-4 w-full max-w-4xl rounded-3xl border-2 border-labsa-cream bg-labsa-canvas p-5 shadow-craft-lg sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-labsa-cream pb-4">
              <h3
                id="admin-product-modal-title"
                className="text-xl font-extrabold text-labsa-charcoal"
              >
                {editingProductId
                  ? t('formEditTitle', {
                      title: locale === 'ar' ? titleAr : titleEn,
                    })
                  : t('formAddTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-labsa-cream bg-labsa-white px-3 py-1.5 text-xs font-bold text-labsa-charcoal"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span>{t('cancelEditButton')}</span>
              </button>
            </div>

            <form
              onSubmit={handleSaveProduct}
              noValidate
              className="mt-5 space-y-5 text-xs"
            >
              {formError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-2xl border border-labsa-status-danger/40 bg-labsa-status-danger/10 p-3.5 font-extrabold text-labsa-status-danger"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Bilingual Product Titles */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-2xl border border-labsa-cream bg-labsa-white p-4">
                <div>
                  <label
                    htmlFor="prod-title-ar"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('titleArLabel')}
                  </label>
                  <input
                    id="prod-title-ar"
                    type="text"
                    dir="rtl"
                    required
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-labsa-charcoal"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-title-en"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('titleEnLabel')}
                  </label>
                  <input
                    id="prod-title-en"
                    type="text"
                    dir="ltr"
                    required
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-labsa-charcoal"
                  />
                </div>

                <div>
                  <label
                    htmlFor="prod-short-ar"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('shortDescArLabel')}
                  </label>
                  <input
                    id="prod-short-ar"
                    type="text"
                    dir="rtl"
                    required
                    value={shortDescAr}
                    onChange={(e) => setShortDescAr(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-labsa-charcoal"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-short-en"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('shortDescEnLabel')}
                  </label>
                  <input
                    id="prod-short-en"
                    type="text"
                    dir="ltr"
                    required
                    value={shortDescEn}
                    onChange={(e) => setShortDescEn(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-labsa-charcoal"
                  />
                </div>

                <div>
                  <label
                    htmlFor="prod-desc-ar"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('descArLabel')}
                  </label>
                  <textarea
                    id="prod-desc-ar"
                    rows={3}
                    dir="rtl"
                    required
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-labsa-cream bg-labsa-canvas p-3 text-labsa-charcoal"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-desc-en"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('descEnLabel')}
                  </label>
                  <textarea
                    id="prod-desc-en"
                    rows={3}
                    dir="ltr"
                    required
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-labsa-cream bg-labsa-canvas p-3 text-labsa-charcoal"
                  />
                </div>
              </div>

              {/* Department, Category, EGP Pricing & Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 rounded-2xl border border-labsa-cream bg-labsa-white p-4">
                <div>
                  <label
                    htmlFor="prod-audience"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('audienceLabel')}
                  </label>
                  <select
                    id="prod-audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as Audience)}
                    className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 font-bold text-labsa-charcoal"
                  >
                    <option value="men">{t('audienceMen')}</option>
                    <option value="kids">{t('audienceKids')}</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="prod-category"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('categoryLabel')}
                  </label>
                  <select
                    id="prod-category"
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as CategoryKey)
                    }
                    className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 font-bold text-labsa-charcoal"
                  >
                    {CATALOG_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {getLocalizedText(cat.name, locale)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="prod-price"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('priceEgpLabel')}
                  </label>
                  <input
                    id="prod-price"
                    type="number"
                    min={1}
                    dir="ltr"
                    required
                    value={priceEgp}
                    onChange={(e) => setPriceEgp(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 font-mono font-bold text-labsa-charcoal"
                  />
                </div>

                <div>
                  <label
                    htmlFor="prod-prev-price"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('prevPriceEgpLabel')}
                  </label>
                  <input
                    id="prod-prev-price"
                    type="number"
                    min={0}
                    dir="ltr"
                    value={previousPriceEgp}
                    onChange={(e) => setPreviousPriceEgp(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 font-mono text-labsa-charcoal"
                  />
                </div>

                <div>
                  <label
                    htmlFor="prod-status"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('statusLabel')}
                  </label>
                  <select
                    id="prod-status"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as ProductStatus)
                    }
                    className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 font-bold text-labsa-charcoal"
                  >
                    <option value="active">{t('statusActive')}</option>
                    <option value="out_of_stock">{t('statusOutOfStock')}</option>
                    <option value="draft">{t('statusDraft')}</option>
                  </select>
                </div>
              </div>

              {/* Approved Local Image Asset Picker */}
              <div className="rounded-2xl border border-labsa-cream bg-labsa-white p-4">
                <label
                  htmlFor="prod-local-img"
                  className="flex items-center gap-1.5 font-bold text-labsa-charcoal"
                >
                  <ImageIcon
                    className="h-4 w-4 text-labsa-terracotta"
                    aria-hidden="true"
                  />
                  <span>{t('localImageLabel')}</span>
                </label>
                <p className="mt-1 text-[11px] text-labsa-charcoal-muted">
                  {t('localImageHelper')}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-4">
                  <img
                    src={selectedLocalImageUrl}
                    alt=""
                    className="h-16 w-16 rounded-xl border border-labsa-cream object-cover"
                  />
                  <select
                    id="prod-local-img"
                    value={selectedLocalImageUrl}
                    onChange={(e) => setSelectedLocalImageUrl(e.target.value)}
                    className="min-h-[40px] flex-1 rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 font-bold text-labsa-charcoal"
                  >
                    {APPROVED_LOCAL_PRODUCT_IMAGES.map((asset) => (
                      <option key={asset.url} value={asset.url}>
                        {getLocalizedText(asset.label, locale)} ({asset.url})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Details (Material, Fit, Care) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-2xl border border-labsa-cream bg-labsa-white p-4">
                <div>
                  <label
                    htmlFor="prod-mat-ar"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('materialArLabel')}
                  </label>
                  <input
                    id="prod-mat-ar"
                    type="text"
                    dir="rtl"
                    value={materialAr}
                    onChange={(e) => setMaterialAr(e.target.value)}
                    className="mt-1 min-h-[38px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-1.5 text-labsa-charcoal"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-mat-en"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('materialEnLabel')}
                  </label>
                  <input
                    id="prod-mat-en"
                    type="text"
                    dir="ltr"
                    value={materialEn}
                    onChange={(e) => setMaterialEn(e.target.value)}
                    className="mt-1 min-h-[38px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-1.5 text-labsa-charcoal"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-fit-ar"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('fitArLabel')}
                  </label>
                  <input
                    id="prod-fit-ar"
                    type="text"
                    dir="rtl"
                    value={fitAr}
                    onChange={(e) => setFitAr(e.target.value)}
                    className="mt-1 min-h-[38px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-1.5 text-labsa-charcoal"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-fit-en"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('fitEnLabel')}
                  </label>
                  <input
                    id="prod-fit-en"
                    type="text"
                    dir="ltr"
                    value={fitEn}
                    onChange={(e) => setFitEn(e.target.value)}
                    className="mt-1 min-h-[38px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-1.5 text-labsa-charcoal"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-care-ar"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('careArLabel')}
                  </label>
                  <input
                    id="prod-care-ar"
                    type="text"
                    dir="rtl"
                    value={careAr}
                    onChange={(e) => setCareAr(e.target.value)}
                    className="mt-1 min-h-[38px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-1.5 text-labsa-charcoal"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-care-en"
                    className="block font-bold text-labsa-charcoal"
                  >
                    {t('careEnLabel')}
                  </label>
                  <input
                    id="prod-care-en"
                    type="text"
                    dir="ltr"
                    value={careEn}
                    onChange={(e) => setCareEn(e.target.value)}
                    className="mt-1 min-h-[38px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-1.5 text-labsa-charcoal"
                  />
                </div>
              </div>

              {/* Variant Stock Editor */}
              <div className="rounded-2xl border-2 border-labsa-olive/40 bg-labsa-white p-4">
                <h4 className="flex items-center gap-1.5 text-sm font-extrabold text-labsa-charcoal">
                  <Layers
                    className="h-4 w-4 text-labsa-olive-dark"
                    aria-hidden="true"
                  />
                  <span>{t('variantsHeading')}</span>
                </h4>
                <p className="mt-1 text-[11px] text-labsa-charcoal-muted">
                  {t('variantsSubtitle')}
                </p>

                <div className="mt-3 divide-y divide-dashed divide-labsa-cream">
                  {variantsDraft.map((variant) => {
                    const colorDef = APPROVED_PRODUCT_COLORS.find(
                      (c) => c.key === variant.colorKey
                    );
                    const deducted = stockDeductions[variant.id] ?? 0;
                    const liveAvail = Math.max(0, variant.stock - deducted);

                    return (
                      <div
                        key={variant.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-4 w-4 rounded-full border border-labsa-charcoal/20"
                            style={{ backgroundColor: colorDef?.hex ?? '#808060' }}
                          />
                          <span className="font-mono font-bold text-labsa-charcoal">
                            {variant.sku}
                          </span>
                          <span className="rounded-md bg-labsa-canvas px-2 py-0.5 font-bold text-labsa-charcoal">
                            {colorDef
                              ? getLocalizedText(colorDef.name, locale)
                              : variant.colorKey}{' '}
                            • <strong className="font-mono">{variant.size}</strong>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <label
                              htmlFor={`var-stock-${variant.id}`}
                              className="text-[11px] font-bold text-labsa-charcoal-muted"
                            >
                              {t('variantBaseStock')}:
                            </label>
                            <input
                              id={`var-stock-${variant.id}`}
                              type="number"
                              min={0}
                              dir="ltr"
                              value={variant.stock}
                              onChange={(e) =>
                                handleUpdateDraftVariantStock(
                                  variant.id,
                                  e.target.value
                                )
                              }
                              className="w-20 rounded-lg border border-labsa-cream bg-labsa-canvas px-2.5 py-1 text-center font-mono font-bold text-labsa-charcoal"
                            />
                          </div>

                          {deducted > 0 && (
                            <span className="font-mono text-[11px] text-labsa-charcoal-muted">
                              ({t('variantDeducted')}: -{deducted})
                            </span>
                          )}

                          <span
                            className={cn(
                              'rounded-full px-2.5 py-0.5 font-mono text-[11px] font-extrabold',
                              liveAvail > 0
                                ? 'bg-labsa-olive-light text-labsa-olive-dark'
                                : 'bg-labsa-status-danger/15 text-labsa-status-danger'
                            )}
                          >
                            {liveAvail > 0
                              ? `${t('variantLiveStock')}: ${liveAvail}`
                              : t('variantUnavailable')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add New Variant Row */}
                <div className="mt-4 rounded-xl border border-dashed border-labsa-cream bg-labsa-canvas p-3">
                  <p className="font-bold text-labsa-charcoal">
                    {t('addVariantHeading')}
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <select
                      aria-label={t('newVariantColor')}
                      value={newVariantColorKey}
                      onChange={(e) =>
                        setNewVariantColorKey(
                          e.target.value as ProductColor['key']
                        )
                      }
                      className="min-h-[36px] rounded-lg border border-labsa-cream bg-labsa-white px-2.5 py-1 font-bold text-labsa-charcoal"
                    >
                      {APPROVED_PRODUCT_COLORS.map((col) => (
                        <option key={col.key} value={col.key}>
                          {getLocalizedText(col.name, locale)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      dir="ltr"
                      aria-label={t('newVariantSize')}
                      placeholder={t('newVariantSize')}
                      value={newVariantSize}
                      onChange={(e) => setNewVariantSize(e.target.value)}
                      className="min-h-[36px] rounded-lg border border-labsa-cream bg-labsa-white px-2.5 py-1 font-mono font-bold text-labsa-charcoal"
                    />
                    <input
                      type="number"
                      min={0}
                      dir="ltr"
                      aria-label={t('newVariantStock')}
                      placeholder={t('newVariantStock')}
                      value={newVariantStock}
                      onChange={(e) => setNewVariantStock(e.target.value)}
                      className="min-h-[36px] rounded-lg border border-labsa-cream bg-labsa-white px-2.5 py-1 font-mono font-bold text-labsa-charcoal"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariantToDraft}
                      className="inline-flex min-h-[36px] items-center justify-center gap-1 rounded-lg bg-labsa-olive-dark px-3 py-1 font-extrabold text-labsa-white transition hover:bg-labsa-charcoal"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t('addVariantButton')}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="min-h-[42px] rounded-xl border border-labsa-cream bg-labsa-white px-5 py-2.5 font-bold text-labsa-charcoal"
                >
                  {t('cancelEditButton')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="min-h-[42px] rounded-xl bg-labsa-terracotta px-6 py-2.5 font-extrabold text-labsa-white shadow-craft transition hover:bg-labsa-terracotta-dark disabled:opacity-50"
                >
                  {t('saveProductButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
