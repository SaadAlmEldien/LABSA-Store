'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { getLocalizedText } from '@/data/catalog';
import {
  type CouponDiscountType,
  type CouponStatus,
  type DemoCoupon,
  normalizeCouponCode,
  readAllDemoCoupons,
  writeAllDemoCoupons,
} from '@/data/coupons';
import { formatEGP, cn } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Plus,
  Tag,
  X,
} from 'lucide-react';

interface AdminCouponsSectionProps {
  coupons: DemoCoupon[];
  onCouponsUpdated: () => void;
  authorizeAction: (actionType: string) => Promise<{
    authorized: boolean;
    actorIdentity?: string;
    serverTimestamp?: string;
  }>;
}

export function AdminCouponsSection({
  coupons,
  onCouponsUpdated,
  authorizeAction,
}: AdminCouponsSectionProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [codeInput, setCodeInput] = useState('');
  const [titleArInput, setTitleArInput] = useState('');
  const [titleEnInput, setTitleEnInput] = useState('');
  const [descArInput, setDescArInput] = useState('');
  const [descEnInput, setDescEnInput] = useState('');
  const [discountTypeInput, setDiscountTypeInput] =
    useState<CouponDiscountType>('percentage');
  const [discountValueInput, setDiscountValueInput] = useState('10');
  const [minSubtotalInput, setMinSubtotalInput] = useState('500');
  const [maxDiscountInput, setMaxDiscountInput] = useState('');
  const [startsAtInput, setStartsAtInput] = useState('2026-01-01');
  const [expiresAtInput, setExpiresAtInput] = useState('2027-12-31');
  const [maxUsesInput, setMaxUsesInput] = useState('50');
  const [statusInput, setStatusInput] = useState<CouponStatus>('active');

  const [formError, setFormError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function openCreateForm() {
    setEditingCouponId(null);
    setIsCreating(true);
    setCodeInput('');
    setTitleArInput('');
    setTitleEnInput('');
    setDescArInput('');
    setDescEnInput('');
    setDiscountTypeInput('percentage');
    setDiscountValueInput('10');
    setMinSubtotalInput('500');
    setMaxDiscountInput('200');
    setStartsAtInput('2026-01-01');
    setExpiresAtInput('2027-12-31');
    setMaxUsesInput('50');
    setStatusInput('active');
    setFormError(null);
    setBannerSuccess(null);
  }

  function openEditForm(coupon: DemoCoupon) {
    setIsCreating(false);
    setEditingCouponId(coupon.id);
    setCodeInput(coupon.code);
    setTitleArInput(coupon.title.ar);
    setTitleEnInput(coupon.title.en);
    setDescArInput(coupon.description.ar);
    setDescEnInput(coupon.description.en);
    setDiscountTypeInput(coupon.discountType);
    setDiscountValueInput(String(coupon.discountValue));
    setMinSubtotalInput(String(coupon.minSubtotalEgp));
    setMaxDiscountInput(
      typeof coupon.maxDiscountEgp === 'number'
        ? String(coupon.maxDiscountEgp)
        : ''
    );
    setStartsAtInput(coupon.startsAt ? coupon.startsAt.slice(0, 10) : '');
    setExpiresAtInput(coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '');
    setMaxUsesInput(
      typeof coupon.maxTotalUsesDemo === 'number'
        ? String(coupon.maxTotalUsesDemo)
        : ''
    );
    setStatusInput(coupon.status);
    setFormError(null);
    setBannerSuccess(null);
  }

  async function handleSaveCoupon(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setBannerSuccess(null);

    const normalizedCode = normalizeCouponCode(codeInput);
    if (!normalizedCode || normalizedCode.length < 3) {
      setFormError(
        isAr
          ? 'يرجى إدخال كود كوبون صالح (3 أحرف أو أرقام على الأقل).'
          : 'Please enter a valid coupon code (at least 3 alphanumeric characters).'
      );
      return;
    }

    const all = readAllDemoCoupons();
    const duplicate = all.find(
      (c) =>
        normalizeCouponCode(c.code) === normalizedCode &&
        c.id !== editingCouponId
    );
    if (duplicate) {
      setFormError(
        isAr
          ? 'كود الكوبون مستخدم بالفعل لكوبون آخر.'
          : 'This coupon code is already used by another coupon.'
      );
      return;
    }

    if (!titleArInput.trim() || !titleEnInput.trim()) {
      setFormError(
        isAr
          ? 'يرجى إدخال عنوان الكوبون بالعربية والإنجليزية.'
          : 'Please enter the coupon title in both Arabic and English.'
      );
      return;
    }

    const val = Number(discountValueInput);
    if (!Number.isFinite(val) || val <= 0) {
      setFormError(
        isAr
          ? 'يجب أن تكون قيمة الخصم رقماً موجباً أكبر من صفر.'
          : 'Discount value must be a positive number greater than zero.'
      );
      return;
    }
    if (discountTypeInput === 'percentage' && val > 100) {
      setFormError(
        isAr
          ? 'نسبة الخصم المئوية لا يمكن أن تتجاوز 100%.'
          : 'Percentage discount cannot exceed 100%.'
      );
      return;
    }

    const minSub = Number(minSubtotalInput);
    if (!Number.isFinite(minSub) || minSub < 0) {
      setFormError(
        isAr
          ? 'الحد الأدنى لقيمة المنتجات يجب أن يكون صفراً أو أكثر.'
          : 'Minimum eligible subtotal must be zero or greater.'
      );
      return;
    }

    const maxDisc = maxDiscountInput.trim()
      ? Number(maxDiscountInput)
      : undefined;
    if (maxDisc !== undefined && (!Number.isFinite(maxDisc) || maxDisc <= 0)) {
      setFormError(
        isAr
          ? 'الحد الأقصى للخصم يجب أن يكون رقماً موجباً.'
          : 'Maximum discount cap must be a positive number.'
      );
      return;
    }

    const maxUses = maxUsesInput.trim() ? Number(maxUsesInput) : undefined;
    if (
      maxUses !== undefined &&
      (!Number.isInteger(maxUses) || maxUses <= 0)
    ) {
      setFormError(
        isAr
          ? 'الحد الأقصى للاستخدام التجريبي يجب أن يكون عدداً صحيحاً موجباً.'
          : 'Demo usage limit must be a positive integer.'
      );
      return;
    }

    const startsIso = startsAtInput
      ? `${startsAtInput}T00:00:00Z`
      : undefined;
    const expiresIso = expiresAtInput
      ? `${expiresAtInput}T23:59:59Z`
      : undefined;

    if (
      startsIso &&
      expiresIso &&
      new Date(startsIso).getTime() > new Date(expiresIso).getTime()
    ) {
      setFormError(
        isAr
          ? 'تاريخ البداية لا يمكن أن يكون بعد تاريخ الانتهاء.'
          : 'Start date cannot be later than expiry date.'
      );
      return;
    }

    setIsSaving(true);
    try {
      const auth = await authorizeAction('coupon_save');
      if (!auth.authorized) {
        setFormError(
          isAr
            ? 'انتهت جلسة المشرف. يرجى تسجيل الدخول مرة أخرى.'
            : 'Administrator session expired. Please sign in again.'
        );
        return;
      }

      const couponPayload = {
        id: isCreating ? `cpn-${Date.now()}` : editingCouponId,
        code: normalizedCode,
        title: { ar: titleArInput.trim(), en: titleEnInput.trim() },
        description: {
          ar: descArInput.trim() || titleArInput.trim(),
          en: descEnInput.trim() || titleEnInput.trim(),
        },
        discountType: discountTypeInput,
        discountValue: Math.round(val),
        minSubtotalEgp: Math.round(minSub),
        maxDiscountEgp: maxDisc ? Math.round(maxDisc) : undefined,
        startsAt: startsIso,
        expiresAt: expiresIso,
        maxTotalUsesDemo: maxUses,
        status: statusInput,
      };

      try {
        await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(couponPayload),
        });
      } catch {
        // Fallback to local
      }

      if (isCreating) {
        const newCoupon: DemoCoupon = {
          ...couponPayload,
          id: couponPayload.id!,
          usedCountDemo: 0,
          createdAt: auth.serverTimestamp ?? new Date().toISOString(),
        };
        writeAllDemoCoupons([newCoupon, ...all]);
      } else if (editingCouponId) {
        const updated: DemoCoupon[] = all.map((c) =>
          c.id === editingCouponId
            ? {
                ...c,
                ...couponPayload,
                id: c.id,
              }
            : c
        );
        writeAllDemoCoupons(updated);
      }

      setIsCreating(false);
      setEditingCouponId(null);
      setBannerSuccess(
        isAr
          ? 'تم حفظ بيانات الكوبون بنجاح وتحديث قواعد الخصم.'
          : 'Coupon saved and discount rules updated.'
      );
      onCouponsUpdated();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleQuickStatusToggle(
    coupon: DemoCoupon,
    newStatus: CouponStatus
  ) {
    const auth = await authorizeAction('coupon_status_change');
    if (!auth.authorized) return;

    try {
      await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...coupon,
          status: newStatus,
        }),
      });
    } catch {
      // Fallback
    }

    const all = readAllDemoCoupons();
    const updated = all.map((c) =>
      c.id === coupon.id ? { ...c, status: newStatus } : c
    );
    writeAllDemoCoupons(updated);
    setBannerSuccess(
      isAr
        ? `تم تحديث حالة الكوبون ${coupon.code} بنجاح.`
        : `Status for coupon ${coupon.code} updated.`
    );
    onCouponsUpdated();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft">
        <div>
          <h2 className="text-xl font-extrabold text-labsa-charcoal sm:text-2xl">
            {isAr
              ? 'إدارة كوبونات الخصم التجريبية'
              : 'Discount Coupons Management'}
          </h2>
          <p className="mt-1 text-xs text-labsa-charcoal-muted sm:text-sm">
            {isAr
              ? 'إنشاء وتعديل وتفعيل أو إيقاف الكوبونات (قيمة ثابتة ج.م أو نسبة مئوية — لا تخصم من رسوم الشحن أبداً).'
              : 'Create, edit, activate, or archive discount coupons (fixed EGP or percentage — never reduces delivery fees).'}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-labsa-terracotta px-4 py-2.5 text-xs font-extrabold text-labsa-white shadow-craft transition hover:bg-labsa-terracotta-dark"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{isAr ? 'إضافة كوبون جديد' : 'Create New Coupon'}</span>
        </button>
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

      {/* Create / Edit Coupon Modal or Inline Card */}
      {(isCreating || editingCouponId) && (
        <form
          onSubmit={handleSaveCoupon}
          noValidate
          className="rounded-3xl border-2 border-labsa-terracotta bg-labsa-white p-6 shadow-craft"
        >
          <div className="flex items-center justify-between border-b border-dashed border-labsa-cream pb-3">
            <h3 className="text-base font-extrabold text-labsa-charcoal">
              {isCreating
                ? isAr
                  ? 'إنشاء كوبون خصم جديد'
                  : 'Create New Discount Coupon'
                : isAr
                  ? 'تعديل بيانات الكوبون'
                  : 'Edit Coupon'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingCouponId(null);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-labsa-cream px-2.5 py-1 text-xs font-bold text-labsa-charcoal"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isAr ? 'إغلاق' : 'Close'}</span>
            </button>
          </div>

          {formError && (
            <div
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-xl border border-labsa-status-danger/40 bg-labsa-status-danger/10 p-3 text-xs font-bold text-labsa-status-danger"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-labsa-charcoal">
                {isAr ? 'كود الكوبون (إنجليزي/أرقام)' : 'Coupon Code'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="LABSA10"
                className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 font-mono text-xs font-extrabold uppercase text-labsa-charcoal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-labsa-charcoal">
                {isAr ? 'نوع الخصم' : 'Discount Type'}
              </label>
              <select
                value={discountTypeInput}
                onChange={(e) =>
                  setDiscountTypeInput(e.target.value as CouponDiscountType)
                }
                className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-xs font-bold text-labsa-charcoal"
              >
                <option value="percentage">
                  {isAr ? 'نسبة مئوية (%)' : 'Percentage (%)'}
                </option>
                <option value="fixed_egp">
                  {isAr ? 'قيمة ثابتة بالجنيه (EGP)' : 'Fixed Amount (EGP)'}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-labsa-charcoal">
                {discountTypeInput === 'percentage'
                  ? isAr
                    ? 'نسبة الخصم (1 - 100%)'
                    : 'Percentage Value (1 - 100%)'
                  : isAr
                    ? 'قيمة الخصم الثابت (ج.م)'
                    : 'Fixed Discount Amount (EGP)'}
              </label>
              <input
                type="number"
                dir="ltr"
                min={1}
                max={discountTypeInput === 'percentage' ? 100 : 50000}
                value={discountValueInput}
                onChange={(e) => setDiscountValueInput(e.target.value)}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 font-mono text-xs font-bold text-labsa-charcoal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-labsa-charcoal">
                {isAr
                  ? 'الحد الأدنى للمنتجات (ج.م)'
                  : 'Minimum Product Subtotal (EGP)'}
              </label>
              <input
                type="number"
                dir="ltr"
                min={0}
                value={minSubtotalInput}
                onChange={(e) => setMinSubtotalInput(e.target.value)}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 font-mono text-xs font-bold text-labsa-charcoal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-labsa-charcoal">
                {isAr
                  ? 'الحد الأقصى للخصم ج.م (اختياري)'
                  : 'Max Discount Cap EGP (Optional)'}
              </label>
              <input
                type="number"
                dir="ltr"
                min={1}
                value={maxDiscountInput}
                onChange={(e) => setMaxDiscountInput(e.target.value)}
                placeholder="200"
                className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 font-mono text-xs font-bold text-labsa-charcoal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-labsa-charcoal">
                {isAr
                  ? 'حد الاستخدام التجريبي (اختياري)'
                  : 'Demo Usage Limit (Optional)'}
              </label>
              <input
                type="number"
                dir="ltr"
                min={1}
                value={maxUsesInput}
                onChange={(e) => setMaxUsesInput(e.target.value)}
                placeholder="50"
                className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 font-mono text-xs font-bold text-labsa-charcoal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-labsa-charcoal">
                {isAr ? 'تاريخ البداية' : 'Start Date'}
              </label>
              <input
                type="date"
                dir="ltr"
                value={startsAtInput}
                onChange={(e) => setStartsAtInput(e.target.value)}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 font-mono text-xs text-labsa-charcoal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-labsa-charcoal">
                {isAr ? 'تاريخ الانتهاء' : 'Expiry Date'}
              </label>
              <input
                type="date"
                dir="ltr"
                value={expiresAtInput}
                onChange={(e) => setExpiresAtInput(e.target.value)}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 font-mono text-xs text-labsa-charcoal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-labsa-charcoal">
                {isAr ? 'الحالة' : 'Status'}
              </label>
              <select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value as CouponStatus)}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-xs font-bold text-labsa-charcoal"
              >
                <option value="active">{isAr ? 'نشط (Active)' : 'Active'}</option>
                <option value="inactive">
                  {isAr ? 'غير نشط (Inactive)' : 'Inactive'}
                </option>
                <option value="archived">
                  {isAr ? 'مؤرشف (Archived)' : 'Archived'}
                </option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-labsa-charcoal">
                {isAr ? 'عنوان الكوبون (بالعربية)' : 'Title (Arabic)'}
              </label>
              <input
                type="text"
                dir="rtl"
                value={titleArInput}
                onChange={(e) => setTitleArInput(e.target.value)}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-xs text-labsa-charcoal"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-labsa-charcoal">
                {isAr ? 'عنوان الكوبون (بالإنجليزية)' : 'Title (English)'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={titleEnInput}
                onChange={(e) => setTitleEnInput(e.target.value)}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-xs text-labsa-charcoal"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-labsa-charcoal">
                {isAr ? 'وصف الكوبون (بالعربية)' : 'Description (Arabic)'}
              </label>
              <input
                type="text"
                dir="rtl"
                value={descArInput}
                onChange={(e) => setDescArInput(e.target.value)}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-xs text-labsa-charcoal"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-labsa-charcoal">
                {isAr ? 'وصف الكوبون (بالإنجليزية)' : 'Description (English)'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={descEnInput}
                onChange={(e) => setDescEnInput(e.target.value)}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-xs text-labsa-charcoal"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-labsa-charcoal px-5 py-2.5 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-terracotta disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>{isAr ? 'حفظ الكوبون' : 'Save Coupon'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Coupons List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {coupons.map((coupon) => (
          <article
            key={coupon.id}
            className="flex flex-col justify-between rounded-3xl border border-labsa-cream bg-labsa-white p-5 shadow-craft"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  dir="ltr"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-labsa-terracotta/50 bg-labsa-terracotta-light/30 px-3 py-1 font-mono text-sm font-extrabold text-labsa-charcoal"
                >
                  <Tag className="h-3.5 w-3.5 text-labsa-terracotta-dark" />
                  <span>{coupon.code}</span>
                </span>

                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[11px] font-extrabold',
                    coupon.status === 'active'
                      ? 'bg-labsa-status-success/15 text-labsa-status-success'
                      : coupon.status === 'inactive'
                        ? 'bg-labsa-terracotta-light text-labsa-terracotta-dark'
                        : 'bg-labsa-surface text-labsa-charcoal-muted'
                  )}
                >
                  {coupon.status.toUpperCase()}
                </span>
              </div>

              <h3 className="mt-3 text-sm font-extrabold text-labsa-charcoal">
                {getLocalizedText(coupon.title, locale)}
              </h3>
              <p className="mt-1 text-xs text-labsa-charcoal-muted">
                {getLocalizedText(coupon.description, locale)}
              </p>

              <dl className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-labsa-canvas p-3 text-xs">
                <div>
                  <dt className="text-[11px] font-bold text-labsa-charcoal-muted">
                    {isAr ? 'قيمة الخصم' : 'Discount'}
                  </dt>
                  <dd className="font-mono font-extrabold text-labsa-olive-dark">
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}%`
                      : formatEGP(coupon.discountValue, locale)}
                    {coupon.maxDiscountEgp
                      ? ` (${isAr ? 'بحد أقصى' : 'cap'} ${formatEGP(coupon.maxDiscountEgp, locale)})`
                      : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-labsa-charcoal-muted">
                    {isAr ? 'الحد الأدنى للمنتجات' : 'Min Subtotal'}
                  </dt>
                  <dd className="font-mono font-bold text-labsa-charcoal">
                    {formatEGP(coupon.minSubtotalEgp, locale)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-labsa-charcoal-muted">
                    {isAr ? 'الاستخدام التجريبي' : 'Demo Usage'}
                  </dt>
                  <dd className="font-mono font-bold text-labsa-charcoal">
                    {coupon.usedCountDemo}
                    {coupon.maxTotalUsesDemo
                      ? ` / ${coupon.maxTotalUsesDemo}`
                      : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-labsa-charcoal-muted">
                    {isAr ? 'صالح حتى' : 'Expires'}
                  </dt>
                  <dd className="font-mono text-[11px] text-labsa-charcoal">
                    {coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-labsa-cream pt-3">
              <button
                type="button"
                onClick={() => openEditForm(coupon)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-labsa-charcoal px-3 py-1.5 text-xs font-bold text-labsa-white transition hover:bg-labsa-terracotta"
              >
                <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isAr ? 'تعديل' : 'Edit'}</span>
              </button>

              {coupon.status !== 'active' && (
                <button
                  type="button"
                  onClick={() => handleQuickStatusToggle(coupon, 'active')}
                  className="inline-flex min-h-[36px] items-center rounded-xl border border-labsa-olive bg-labsa-olive-light/40 px-3 py-1.5 text-xs font-bold text-labsa-olive-dark"
                >
                  {isAr ? 'تفعيل' : 'Activate'}
                </button>
              )}
              {coupon.status === 'active' && (
                <button
                  type="button"
                  onClick={() => handleQuickStatusToggle(coupon, 'inactive')}
                  className="inline-flex min-h-[36px] items-center rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-1.5 text-xs font-bold text-labsa-charcoal"
                >
                  {isAr ? 'إيقاف مؤقت' : 'Deactivate'}
                </button>
              )}
              {coupon.status !== 'archived' && (
                <button
                  type="button"
                  onClick={() => handleQuickStatusToggle(coupon, 'archived')}
                  className="inline-flex min-h-[36px] items-center rounded-xl border border-labsa-status-danger/30 bg-labsa-status-danger/10 px-3 py-1.5 text-xs font-bold text-labsa-status-danger"
                >
                  {isAr ? 'أرشفة' : 'Archive'}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
