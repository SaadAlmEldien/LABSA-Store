'use client';

import React, { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getLocalizedText } from '@/data/catalog';
import {
  ALL_ORDER_STATUSES,
  ALL_PAYMENT_STATUSES,
  ALL_SHIPMENT_STATUSES,
  type DemoOrder,
  type OrderLifecycleStatus,
  type ShipmentLifecycleStatus,
  adminUpdateOrderStatus,
  adminUpdatePaymentStatus,
  adminUpdateShipmentAndTracking,
} from '@/data/orders';
import {
  type PaymentLifecycleStatus,
  getPaymentMethodOption,
} from '@/data/payments';
import { formatEGP, cn } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Lock,
  MapPin,
  Package,
  RotateCcw,
  Search,
  ShieldAlert,
  Truck,
  X,
} from 'lucide-react';

interface AdminOrdersSectionProps {
  orders: DemoOrder[];
  onOrdersUpdated: () => void;
  authorizeAction: (actionType: string) => Promise<{
    authorized: boolean;
    actorIdentity?: string;
    serverTimestamp?: string;
  }>;
  initialSelectedOrderId?: string | null;
  initialFilterPendingPayment?: boolean;
}

type DateRangeFilter = 'all' | 'today' | 'last_7_days' | 'last_30_days';

type PendingConfirmation =
  | {
      type: 'payment';
      fromStatus: PaymentLifecycleStatus;
      toStatus: PaymentLifecycleStatus;
    }
  | {
      type: 'order';
      fromStatus: OrderLifecycleStatus;
      toStatus: OrderLifecycleStatus;
    }
  | {
      type: 'shipment';
      fromStatus: ShipmentLifecycleStatus;
      toStatus: ShipmentLifecycleStatus;
    };

export function AdminOrdersSection({
  orders,
  onOrdersUpdated,
  authorizeAction,
  initialSelectedOrderId = null,
  initialFilterPendingPayment = false,
}: AdminOrdersSectionProps) {
  const locale = useLocale();
  const t = useTranslations('Admin.orders');
  const tStatuses = useTranslations('OrderStatuses');

  // Search and filters (kept strictly in React state; never placed in URL to protect customer PII)
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyPendingVerification, setOnlyPendingVerification] = useState(
    initialFilterPendingPayment
  );
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [shipmentStatusFilter, setShipmentStatusFilter] =
    useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DateRangeFilter>('all');

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialSelectedOrderId
  );

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  // Form states inside Order Detail modal
  const [nextPaymentStatus, setNextPaymentStatus] =
    useState<PaymentLifecycleStatus>('paid');
  const [paymentPublicNote, setPaymentPublicNote] = useState('');
  const [paymentInternalNote, setPaymentInternalNote] = useState('');

  const [nextOrderStatus, setNextOrderStatus] =
    useState<OrderLifecycleStatus>('confirmed');
  const [orderPublicNote, setOrderPublicNote] = useState('');
  const [orderInternalNote, setOrderInternalNote] = useState('');

  const [nextShipmentStatus, setNextShipmentStatus] =
    useState<ShipmentLifecycleStatus>('packing');
  const [carrierNameInput, setCarrierNameInput] = useState('');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [shipmentPublicNote, setShipmentPublicNote] = useState('');
  const [shipmentInternalNote, setShipmentInternalNote] = useState('');

  const [pendingConfirm, setPendingConfirm] =
    useState<PendingConfirmation | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function openOrderDetail(order: DemoOrder) {
    setSelectedOrderId(order.id);
    setNextPaymentStatus(
      order.paymentStatus === 'awaiting_manual_verification'
        ? 'paid'
        : order.paymentStatus
    );
    setPaymentPublicNote('');
    setPaymentInternalNote('');

    setNextOrderStatus(order.orderStatus);
    setOrderPublicNote('');
    setOrderInternalNote('');

    setNextShipmentStatus(order.shipmentStatus);
    setCarrierNameInput(order.shipmentTracking?.carrierName ?? '');
    setTrackingNumberInput(order.shipmentTracking?.trackingNumber ?? '');
    setShipmentPublicNote('');
    setShipmentInternalNote('');

    setPendingConfirm(null);
    setActionError(null);
    setActionSuccess(null);
  }

  const pendingPaymentCount = useMemo(
    () =>
      orders.filter((o) => o.paymentStatus === 'awaiting_manual_verification')
        .length,
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = Date.now();

    return orders.filter((order) => {
      if (
        onlyPendingVerification &&
        order.paymentStatus !== 'awaiting_manual_verification'
      ) {
        return false;
      }
      if (
        orderStatusFilter !== 'all' &&
        order.orderStatus !== orderStatusFilter
      ) {
        return false;
      }
      if (
        paymentStatusFilter !== 'all' &&
        order.paymentStatus !== paymentStatusFilter
      ) {
        return false;
      }
      if (
        shipmentStatusFilter !== 'all' &&
        order.shipmentStatus !== shipmentStatusFilter
      ) {
        return false;
      }
      if (dateRangeFilter !== 'all') {
        const orderTime = new Date(order.createdAt).getTime();
        const diffDays = (now - orderTime) / (1000 * 60 * 60 * 24);
        if (dateRangeFilter === 'today' && diffDays > 1) return false;
        if (dateRangeFilter === 'last_7_days' && diffDays > 7) return false;
        if (dateRangeFilter === 'last_30_days' && diffDays > 30) return false;
      }
      if (q) {
        const hay = [
          order.orderNumber,
          order.customer.fullName,
          order.customer.mobileNumber,
          order.customer.normalizedMobile,
          order.customer.governorateNameSnapshot.ar,
          order.customer.governorateNameSnapshot.en,
          order.customer.cityOrArea,
          order.shipmentTracking?.trackingNumber ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    orders,
    searchQuery,
    onlyPendingVerification,
    orderStatusFilter,
    paymentStatusFilter,
    shipmentStatusFilter,
    dateRangeFilter,
  ]);

  function handleResetFilters() {
    setSearchQuery('');
    setOnlyPendingVerification(false);
    setOrderStatusFilter('all');
    setPaymentStatusFilter('all');
    setShipmentStatusFilter('all');
    setDateRangeFilter('all');
  }

  async function executeConfirmedUpdate() {
    if (!selectedOrder || !pendingConfirm) return;
    setActionError(null);
    setActionSuccess(null);
    setIsSaving(true);

    try {
      const authRes = await authorizeAction(`order_${pendingConfirm.type}`);
      if (!authRes.authorized || !authRes.actorIdentity) {
        setActionError(t('confirmActionTitle'));
        setIsSaving(false);
        return;
      }

      const timestamp = authRes.serverTimestamp ?? new Date().toISOString();
      const actorIdentity = authRes.actorIdentity;

      let customerNoteAr = '';
      let customerNoteEn = '';
      let internalNote = '';
      let carrierName: string | undefined;
      let trackingNumber: string | undefined;

      if (pendingConfirm.type === 'payment') {
        const cleanPublic = paymentPublicNote.trim();
        customerNoteAr =
          cleanPublic ||
          `تم تحديث حالة الدفع بواسطة الإدارة إلى: ${tStatuses(
            `payment.${pendingConfirm.toStatus}`
          )}`;
        customerNoteEn =
          cleanPublic ||
          `Payment status updated by administrator to: ${tStatuses(
            `payment.${pendingConfirm.toStatus}`
          )}`;
        internalNote = paymentInternalNote;
      } else if (pendingConfirm.type === 'order') {
        const cleanPublic = orderPublicNote.trim();
        customerNoteAr =
          cleanPublic ||
          `تم تحديث حالة الطلب إلى: ${tStatuses(
            `order.${pendingConfirm.toStatus}`
          )}`;
        customerNoteEn =
          cleanPublic ||
          `Order status updated to: ${tStatuses(
            `order.${pendingConfirm.toStatus}`
          )}`;
        internalNote = orderInternalNote;
      } else if (pendingConfirm.type === 'shipment') {
        const cleanPublic = shipmentPublicNote.trim();
        customerNoteAr =
          cleanPublic ||
          `تم تحديث حالة الشحنة إلى: ${tStatuses(
            `shipment.${pendingConfirm.toStatus}`
          )}${
            trackingNumberInput.trim()
              ? ` (رقم التتبع: ${trackingNumberInput.trim()})`
              : ''
          }`;
        customerNoteEn =
          cleanPublic ||
          `Shipment status updated to: ${tStatuses(
            `shipment.${pendingConfirm.toStatus}`
          )}${
            trackingNumberInput.trim()
              ? ` (Tracking: ${trackingNumberInput.trim()})`
              : ''
          }`;
        internalNote = shipmentInternalNote;
        carrierName = carrierNameInput.trim() || undefined;
        trackingNumber = trackingNumberInput.trim() || undefined;
      }

      // Authoritative Server API call
      let serverUpdated = false;
      try {
        const apiRes = await fetch(
          `/api/admin/orders/${selectedOrder.id}/status`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain: pendingConfirm.type,
              toStatus: pendingConfirm.toStatus,
              customerNoteAr,
              customerNoteEn,
              internalNote,
              carrierName,
              trackingNumber,
            }),
          }
        );
        if (apiRes.ok) {
          serverUpdated = true;
        }
      } catch {
        // Fallback for local dev
      }

      if (!serverUpdated) {
        if (pendingConfirm.type === 'payment') {
          adminUpdatePaymentStatus({
            orderId: selectedOrder.id,
            newPaymentStatus: pendingConfirm.toStatus,
            customerNote: { ar: customerNoteAr, en: customerNoteEn },
            internalNote,
            actorIdentity,
            timestamp,
          });
        } else if (pendingConfirm.type === 'order') {
          adminUpdateOrderStatus({
            orderId: selectedOrder.id,
            newOrderStatus: pendingConfirm.toStatus,
            customerNote: { ar: customerNoteAr, en: customerNoteEn },
            internalNote,
            actorIdentity,
            timestamp,
          });
        } else if (pendingConfirm.type === 'shipment') {
          adminUpdateShipmentAndTracking({
            orderId: selectedOrder.id,
            newShipmentStatus: pendingConfirm.toStatus,
            carrierName: carrierName || 'Aramex Egypt',
            trackingNumber: trackingNumber || 'ARX-DEMO',
            customerTrackingUpdate: { ar: customerNoteAr, en: customerNoteEn },
            internalNote,
            actorIdentity,
            timestamp,
          });
        }
      }

      setActionSuccess(t('saveSuccessBanner'));
      setPaymentPublicNote('');
      setPaymentInternalNote('');
      setOrderPublicNote('');
      setOrderInternalNote('');
      setShipmentPublicNote('');
      setShipmentInternalNote('');
      setPendingConfirm(null);
      onOrdersUpdated();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Queue Toggle */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft">
        <div>
          <h2 className="text-xl font-extrabold text-labsa-charcoal sm:text-2xl">
            {t('heading')}
          </h2>
          <p className="mt-1 text-xs text-labsa-charcoal-muted sm:text-sm">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOnlyPendingVerification(false)}
            className={cn(
              'min-h-[40px] rounded-xl px-4 py-2 text-xs font-extrabold transition',
              !onlyPendingVerification
                ? 'bg-labsa-charcoal text-labsa-white'
                : 'border border-labsa-cream bg-labsa-canvas text-labsa-charcoal hover:border-labsa-charcoal'
            )}
          >
            {t('queueToggleAll', { count: orders.length })}
          </button>
          <button
            type="button"
            onClick={() => setOnlyPendingVerification(true)}
            className={cn(
              'min-h-[40px] rounded-xl px-4 py-2 text-xs font-extrabold transition',
              onlyPendingVerification
                ? 'bg-labsa-terracotta text-labsa-white'
                : 'border border-labsa-terracotta/50 bg-labsa-terracotta-light/40 text-labsa-terracotta-dark hover:bg-labsa-terracotta-light'
            )}
          >
            {t('queueTogglePendingPayment', { count: pendingPaymentCount })}
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-5 shadow-craft">
        <div className="relative">
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
            className="min-h-[44px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas ps-10 pe-4 py-2.5 text-xs text-labsa-charcoal placeholder:text-labsa-charcoal-light focus:border-labsa-terracotta focus:bg-labsa-white focus:outline-none sm:text-sm"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label
              htmlFor="filter-order-status"
              className="block text-[11px] font-bold text-labsa-charcoal-muted"
            >
              {t('filterOrderStatus')}
            </label>
            <select
              id="filter-order-status"
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-xs font-bold text-labsa-charcoal focus:border-labsa-terracotta focus:outline-none"
            >
              <option value="all">{t('filterAll')}</option>
              {ALL_ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {tStatuses(`order.${st}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-payment-status"
              className="block text-[11px] font-bold text-labsa-charcoal-muted"
            >
              {t('filterPaymentStatus')}
            </label>
            <select
              id="filter-payment-status"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-xs font-bold text-labsa-charcoal focus:border-labsa-terracotta focus:outline-none"
            >
              <option value="all">{t('filterAll')}</option>
              {ALL_PAYMENT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {tStatuses(`payment.${st}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-shipment-status"
              className="block text-[11px] font-bold text-labsa-charcoal-muted"
            >
              {t('filterShipmentStatus')}
            </label>
            <select
              id="filter-shipment-status"
              value={shipmentStatusFilter}
              onChange={(e) => setShipmentStatusFilter(e.target.value)}
              className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-xs font-bold text-labsa-charcoal focus:border-labsa-terracotta focus:outline-none"
            >
              <option value="all">{t('filterAll')}</option>
              {ALL_SHIPMENT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {tStatuses(`shipment.${st}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-date-range"
              className="block text-[11px] font-bold text-labsa-charcoal-muted"
            >
              {t('filterDateRange')}
            </label>
            <select
              id="filter-date-range"
              value={dateRangeFilter}
              onChange={(e) =>
                setDateRangeFilter(e.target.value as DateRangeFilter)
              }
              className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-xs font-bold text-labsa-charcoal focus:border-labsa-terracotta focus:outline-none"
            >
              <option value="all">{t('dateAll')}</option>
              <option value="today">{t('dateToday')}</option>
              <option value="last_7_days">{t('dateLast7')}</option>
              <option value="last_30_days">{t('dateLast30')}</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-terracotta hover:text-labsa-terracotta-dark"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('resetFilters')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Order List: Responsive Cards on Mobile + Structured Table on Desktop */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-labsa-cream bg-labsa-white p-10 text-center text-sm font-bold text-labsa-charcoal-muted">
          {t('noMatchingOrders')}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View (lg+) */}
          <div className="hidden overflow-hidden rounded-3xl border border-labsa-cream bg-labsa-white shadow-craft lg:block">
            <table className="w-full text-start text-xs">
              <thead className="border-b border-labsa-cream bg-labsa-surface text-labsa-charcoal">
                <tr>
                  <th className="px-4 py-3.5 text-start font-extrabold">
                    {t('colOrder')}
                  </th>
                  <th className="px-4 py-3.5 text-start font-extrabold">
                    {t('colCustomer')}
                  </th>
                  <th className="px-4 py-3.5 text-start font-extrabold">
                    {t('colDestination')}
                  </th>
                  <th className="px-4 py-3.5 text-start font-extrabold">
                    {t('colTotal')}
                  </th>
                  <th className="px-4 py-3.5 text-start font-extrabold">
                    {t('colPayment')}
                  </th>
                  <th className="px-4 py-3.5 text-start font-extrabold">
                    {t('colOrderAndShipment')}
                  </th>
                  <th className="px-4 py-3.5 text-end font-extrabold">
                    {t('colActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-labsa-cream">
                {filteredOrders.map((order) => {
                  const payMethod = getPaymentMethodOption(order.paymentMethod);
                  return (
                    <tr
                      key={order.id}
                      className="transition hover:bg-labsa-canvas/60"
                    >
                      <td className="px-4 py-4 align-top">
                        <p className="font-mono text-sm font-extrabold text-labsa-charcoal">
                          {order.orderNumber}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-labsa-charcoal-muted">
                          {new Date(order.createdAt).toLocaleDateString(
                            locale === 'ar' ? 'ar-EG' : 'en-EG',
                            { year: 'numeric', month: 'short', day: 'numeric' }
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="font-bold text-labsa-charcoal">
                          {order.customer.fullName}
                        </p>
                        <p
                          dir="ltr"
                          className="mt-1 font-mono text-[11px] text-labsa-charcoal-muted"
                        >
                          {order.customer.mobileNumber}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="font-bold text-labsa-charcoal">
                          {getLocalizedText(
                            order.customer.governorateNameSnapshot,
                            locale
                          )}
                        </p>
                        <p className="mt-1 text-[11px] text-labsa-charcoal-muted">
                          {order.customer.cityOrArea}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top font-mono text-sm font-extrabold text-labsa-charcoal">
                        {formatEGP(order.pricing.totalEgp, locale)}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="font-bold text-labsa-charcoal">
                          {getLocalizedText(payMethod.shortBadge, locale)}
                        </p>
                        <span
                          className={cn(
                            'mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                            order.paymentStatus === 'paid'
                              ? 'bg-labsa-status-success/15 text-labsa-status-success'
                              : order.paymentStatus ===
                                  'awaiting_manual_verification'
                                ? 'bg-labsa-terracotta-light text-labsa-terracotta-dark'
                                : order.paymentStatus === 'verification_failed'
                                  ? 'bg-labsa-status-danger/15 text-labsa-status-danger'
                                  : 'bg-labsa-surface text-labsa-charcoal'
                          )}
                        >
                          <CreditCard className="h-3 w-3" aria-hidden="true" />
                          <span>
                            {tStatuses(`payment.${order.paymentStatus}`)}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top space-y-1.5">
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-labsa-canvas px-2.5 py-0.5 text-[11px] font-bold text-labsa-charcoal">
                            <Package className="h-3 w-3" aria-hidden="true" />
                            <span>
                              {tStatuses(`order.${order.orderStatus}`)}
                            </span>
                          </span>
                        </div>
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-labsa-olive-light px-2.5 py-0.5 text-[11px] font-bold text-labsa-olive-dark">
                            <Truck className="h-3 w-3" aria-hidden="true" />
                            <span>
                              {tStatuses(`shipment.${order.shipmentStatus}`)}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-end">
                        <button
                          type="button"
                          onClick={() => openOrderDetail(order)}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-labsa-charcoal px-3.5 py-2 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-terracotta"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t('inspectButton')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View (< lg) — No Horizontal Scrolling */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {filteredOrders.map((order) => {
              const payMethod = getPaymentMethodOption(order.paymentMethod);
              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-labsa-cream bg-labsa-white p-5 shadow-craft"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-labsa-cream pb-3">
                    <div>
                      <p className="font-mono text-base font-extrabold text-labsa-charcoal">
                        {order.orderNumber}
                      </p>
                      <p className="font-mono text-[11px] text-labsa-charcoal-muted">
                        {new Date(order.createdAt).toLocaleDateString(
                          locale === 'ar' ? 'ar-EG' : 'en-EG'
                        )}
                      </p>
                    </div>
                    <p className="font-mono text-base font-extrabold text-labsa-terracotta-dark">
                      {formatEGP(order.pricing.totalEgp, locale)}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div>
                      <p className="font-bold text-labsa-charcoal">
                        {order.customer.fullName}
                      </p>
                      <p
                        dir="ltr"
                        className="font-mono text-labsa-charcoal-muted"
                      >
                        {order.customer.mobileNumber}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-labsa-charcoal">
                        {getLocalizedText(
                          order.customer.governorateNameSnapshot,
                          locale
                        )}{' '}
                        — {order.customer.cityOrArea}
                      </p>
                      <p className="text-labsa-charcoal-muted">
                        {getLocalizedText(payMethod.shortBadge, locale)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-labsa-terracotta-light/60 px-2.5 py-1 text-[11px] font-bold text-labsa-terracotta-dark">
                      <CreditCard className="h-3 w-3" aria-hidden="true" />
                      <span>{tStatuses(`payment.${order.paymentStatus}`)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-labsa-canvas px-2.5 py-1 text-[11px] font-bold text-labsa-charcoal">
                      <Package className="h-3 w-3" aria-hidden="true" />
                      <span>{tStatuses(`order.${order.orderStatus}`)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-labsa-olive-light px-2.5 py-1 text-[11px] font-bold text-labsa-olive-dark">
                      <Truck className="h-3 w-3" aria-hidden="true" />
                      <span>
                        {tStatuses(`shipment.${order.shipmentStatus}`)}
                      </span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openOrderDetail(order)}
                    className="mt-4 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-labsa-charcoal px-4 py-2.5 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-terracotta"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    <span>{t('inspectButton')}</span>
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Detail & Manual Operations Modal */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-order-detail-title"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-labsa-charcoal/60 p-3 backdrop-blur-xs sm:p-6"
        >
          <div className="my-4 w-full max-w-5xl rounded-3xl border-2 border-labsa-cream bg-labsa-canvas p-5 shadow-craft-lg sm:p-8">
            {/* Modal Top Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-labsa-cream pb-4">
              <div>
                <h3
                  id="admin-order-detail-title"
                  className="text-xl font-extrabold text-labsa-charcoal sm:text-2xl"
                >
                  {t('detailModalTitle', {
                    orderNumber: selectedOrder.orderNumber,
                  })}
                </h3>
                <p className="mt-1 font-mono text-xs text-labsa-charcoal-muted">
                  {new Date(selectedOrder.createdAt).toLocaleString(
                    locale === 'ar' ? 'ar-EG' : 'en-EG'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                aria-label={t('closeDetail')}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-labsa-cream bg-labsa-white px-3.5 py-2 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-terracotta hover:text-labsa-terracotta-dark"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span>{t('closeDetail')}</span>
              </button>
            </div>

            {/* Immutable Snapshot Reassurance Banner */}
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-dashed border-labsa-olive bg-labsa-white p-3.5 text-xs text-labsa-charcoal">
              <ShieldAlert
                className="mt-0.5 h-4 w-4 shrink-0 text-labsa-olive-dark"
                aria-hidden="true"
              />
              <p>{t('snapshotNotice')}</p>
            </div>

            {/* Action Feedback Banners */}
            {actionSuccess && (
              <div
                role="status"
                className="mt-4 flex items-center gap-2 rounded-2xl border border-labsa-status-success/40 bg-labsa-status-success/10 p-3.5 text-xs font-extrabold text-labsa-status-success"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{actionSuccess}</span>
              </div>
            )}
            {actionError && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-2xl border border-labsa-status-danger/40 bg-labsa-status-danger/10 p-3.5 text-xs font-extrabold text-labsa-status-danger"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Confirmation Step Banner before Applying Changes */}
            {pendingConfirm && (
              <div
                role="alertdialog"
                aria-labelledby="confirm-status-change-title"
                className="mt-4 rounded-2xl border-2 border-labsa-terracotta bg-labsa-white p-5 shadow-craft"
              >
                <h4
                  id="confirm-status-change-title"
                  className="text-sm font-extrabold text-labsa-terracotta-dark"
                >
                  {t('confirmActionTitle')}
                </h4>
                <p className="mt-1.5 text-xs text-labsa-charcoal">
                  {t('confirmActionDesc', {
                    from: tStatuses(
                      `${pendingConfirm.type}.${pendingConfirm.fromStatus}`
                    ),
                    to: tStatuses(
                      `${pendingConfirm.type}.${pendingConfirm.toStatus}`
                    ),
                  })}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={executeConfirmedUpdate}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-labsa-terracotta px-5 py-2 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-terracotta-dark disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>{t('confirmSaveButton')}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setPendingConfirm(null)}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-labsa-cream bg-labsa-canvas px-4 py-2 text-xs font-bold text-labsa-charcoal"
                  >
                    <span>{t('cancelButton')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Customer Contact & Immutable Order Items Grid */}
            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Customer Address Card */}
              <div className="rounded-2xl border border-labsa-cream bg-labsa-white p-5 text-xs">
                <h4 className="flex items-center gap-2 text-sm font-extrabold text-labsa-charcoal">
                  <MapPin
                    className="h-4 w-4 text-labsa-terracotta"
                    aria-hidden="true"
                  />
                  <span>{t('customerSectionTitle')}</span>
                </h4>
                <dl className="mt-3 space-y-2">
                  <div>
                    <dt className="font-bold text-labsa-charcoal-muted">
                      {t('customerName')}
                    </dt>
                    <dd className="font-extrabold text-labsa-charcoal">
                      {selectedOrder.customer.fullName}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-labsa-charcoal-muted">
                      {t('customerMobile')}
                    </dt>
                    <dd
                      dir="ltr"
                      className="font-mono font-extrabold text-labsa-charcoal"
                    >
                      {selectedOrder.customer.mobileNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-labsa-charcoal-muted">
                      {t('customerAddress')}
                    </dt>
                    <dd className="text-labsa-charcoal">
                      {getLocalizedText(
                        selectedOrder.customer.governorateNameSnapshot,
                        locale
                      )}{' '}
                      — {selectedOrder.customer.cityOrArea} —{' '}
                      {selectedOrder.customer.streetAndBuilding}
                      {selectedOrder.customer.landmark
                        ? ` (${selectedOrder.customer.landmark})`
                        : ''}
                    </dd>
                  </div>
                  {selectedOrder.customer.deliveryNote && (
                    <div>
                      <dt className="font-bold text-labsa-charcoal-muted">
                        {t('customerNotes')}
                      </dt>
                      <dd className="text-labsa-charcoal">
                        {selectedOrder.customer.deliveryNote}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Immutable Items & Pricing Snapshot Card */}
              <div className="rounded-2xl border border-labsa-cream bg-labsa-white p-5 text-xs">
                <h4 className="flex items-center gap-2 text-sm font-extrabold text-labsa-charcoal">
                  <Package
                    className="h-4 w-4 text-labsa-olive-dark"
                    aria-hidden="true"
                  />
                  <span>{t('itemsSectionTitle')}</span>
                </h4>
                <ul className="mt-3 divide-y divide-dashed divide-labsa-cream">
                  {selectedOrder.items.map((item) => (
                    <li
                      key={item.variantId}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div>
                        <p className="font-bold text-labsa-charcoal">
                          {getLocalizedText(item.titleSnapshot, locale)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-labsa-charcoal-muted">
                          <span className="font-mono">{item.skuSnapshot}</span>{' '}
                          • {getLocalizedText(item.colorNameSnapshot, locale)} •{' '}
                          <span className="font-mono">{item.sizeSnapshot}</span>{' '}
                          × <strong className="font-mono">{item.quantity}</strong>{' '}
                          ({formatEGP(item.unitPriceEgp, locale)})
                        </p>
                      </div>
                      <span className="font-mono font-extrabold text-labsa-charcoal">
                        {formatEGP(item.lineTotalEgp, locale)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 space-y-1.5 border-t border-labsa-cream pt-3">
                  <div className="flex justify-between text-labsa-charcoal-muted">
                    <span>{t('subtotalLabel')}</span>
                    <span className="font-mono font-bold text-labsa-charcoal">
                      {formatEGP(selectedOrder.pricing.subtotalEgp, locale)}
                    </span>
                  </div>
                  {(selectedOrder.pricing.discountEgp ?? 0) > 0 && (
                    <div className="flex justify-between text-labsa-olive-dark">
                      <span className="font-bold">
                        {selectedOrder.pricing.couponCodeSnapshot
                          ? `${locale === 'ar' ? 'خصم الكوبون' : 'Coupon Discount'} (${selectedOrder.pricing.couponCodeSnapshot})`
                          : locale === 'ar'
                            ? 'الخصم'
                            : 'Discount'}
                      </span>
                      <span className="font-mono font-extrabold">
                        - {formatEGP(selectedOrder.pricing.discountEgp ?? 0, locale)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-labsa-charcoal-muted">
                    <span>{t('shippingFeeLabel')}</span>
                    <span className="font-mono font-bold text-labsa-charcoal">
                      {formatEGP(selectedOrder.pricing.deliveryFeeEgp, locale)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-labsa-cream pt-2 text-sm font-extrabold text-labsa-charcoal">
                    <span>{t('grandTotalLabel')}</span>
                    <span className="font-mono text-labsa-terracotta-dark">
                      {formatEGP(selectedOrder.pricing.totalEgp, locale)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Independent Operational Control Panels */}
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* 1. Manual Payment Review Panel */}
              <div className="rounded-2xl border-2 border-labsa-terracotta/40 bg-labsa-white p-5 text-xs">
                <h4 className="flex items-center gap-1.5 text-sm font-extrabold text-labsa-charcoal">
                  <CreditCard
                    className="h-4 w-4 text-labsa-terracotta"
                    aria-hidden="true"
                  />
                  <span>{t('paymentReviewHeading')}</span>
                </h4>

                <div className="mt-3 rounded-xl bg-labsa-canvas p-3">
                  <p className="font-bold text-labsa-charcoal">
                    {t('paymentMethodLabel')}{' '}
                    <span className="text-labsa-terracotta-dark">
                      {getLocalizedText(
                        getPaymentMethodOption(selectedOrder.paymentMethod)
                          .title,
                        locale
                      )}
                    </span>
                  </p>
                  {selectedOrder.paymentMethod !== 'cod' && (
                    <p className="mt-1 text-[11px] text-labsa-charcoal-muted">
                      {t('transferRefLabel')}{' '}
                      <span className="font-mono font-bold text-labsa-charcoal">
                        {selectedOrder.paymentTransferReference ||
                          t('noTransferRef')}
                      </span>
                    </p>
                  )}
                  <p className="mt-1.5 text-[11px] text-labsa-charcoal-muted">
                    {selectedOrder.paymentMethod === 'cod'
                      ? t('codPaymentHint')
                      : t('manualPaymentHint')}
                  </p>
                </div>

                <div className="mt-3 space-y-3">
                  <div>
                    <label
                      htmlFor="admin-pay-status"
                      className="block font-bold text-labsa-charcoal"
                    >
                      {t('selectPaymentStatus')}
                    </label>
                    <select
                      id="admin-pay-status"
                      value={nextPaymentStatus}
                      onChange={(e) =>
                        setNextPaymentStatus(
                          e.target.value as PaymentLifecycleStatus
                        )
                      }
                      className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 font-bold text-labsa-charcoal"
                    >
                      {ALL_PAYMENT_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {tStatuses(`payment.${st}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-pay-public-note"
                      className="block font-bold text-labsa-charcoal"
                    >
                      {t('customerVisibleNoteLabel')}
                    </label>
                    <input
                      id="admin-pay-public-note"
                      type="text"
                      value={paymentPublicNote}
                      onChange={(e) => setPaymentPublicNote(e.target.value)}
                      placeholder={t('customerVisibleNotePlaceholder')}
                      className="mt-1 min-h-[38px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-1.5 text-labsa-charcoal"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-pay-internal-note"
                      className="flex items-center gap-1 font-bold text-labsa-terracotta-dark"
                    >
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      <span>{t('internalAdminNoteLabel')}</span>
                    </label>
                    <input
                      id="admin-pay-internal-note"
                      type="text"
                      value={paymentInternalNote}
                      onChange={(e) => setPaymentInternalNote(e.target.value)}
                      placeholder={t('internalAdminNotePlaceholder')}
                      className="mt-1 min-h-[38px] w-full rounded-xl border border-dashed border-labsa-terracotta/50 bg-labsa-terracotta-light/20 px-3 py-1.5 text-labsa-charcoal"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPendingConfirm({
                        type: 'payment',
                        fromStatus: selectedOrder.paymentStatus,
                        toStatus: nextPaymentStatus,
                      })
                    }
                    className="inline-flex min-h-[40px] w-full items-center justify-center rounded-xl bg-labsa-terracotta px-4 py-2 font-extrabold text-labsa-white transition hover:bg-labsa-terracotta-dark"
                  >
                    {t('preparePaymentUpdate')}
                  </button>
                </div>
              </div>

              {/* 2. Manual Order Status Panel */}
              <div className="rounded-2xl border border-labsa-cream bg-labsa-white p-5 text-xs">
                <h4 className="flex items-center gap-1.5 text-sm font-extrabold text-labsa-charcoal">
                  <Package
                    className="h-4 w-4 text-labsa-charcoal"
                    aria-hidden="true"
                  />
                  <span>{t('orderStatusHeading')}</span>
                </h4>

                <div className="mt-3 space-y-3">
                  <div>
                    <label
                      htmlFor="admin-ord-status"
                      className="block font-bold text-labsa-charcoal"
                    >
                      {t('selectOrderStatus')}
                    </label>
                    <select
                      id="admin-ord-status"
                      value={nextOrderStatus}
                      onChange={(e) =>
                        setNextOrderStatus(
                          e.target.value as OrderLifecycleStatus
                        )
                      }
                      className="mt-1 min-h-[40px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-2 font-bold text-labsa-charcoal"
                    >
                      {ALL_ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {tStatuses(`order.${st}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-ord-public-note"
                      className="block font-bold text-labsa-charcoal"
                    >
                      {t('customerVisibleNoteLabel')}
                    </label>
                    <input
                      id="admin-ord-public-note"
                      type="text"
                      value={orderPublicNote}
                      onChange={(e) => setOrderPublicNote(e.target.value)}
                      placeholder={t('customerVisibleNotePlaceholder')}
                      className="mt-1 min-h-[38px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-1.5 text-labsa-charcoal"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-ord-internal-note"
                      className="flex items-center gap-1 font-bold text-labsa-terracotta-dark"
                    >
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      <span>{t('internalAdminNoteLabel')}</span>
                    </label>
                    <input
                      id="admin-ord-internal-note"
                      type="text"
                      value={orderInternalNote}
                      onChange={(e) => setOrderInternalNote(e.target.value)}
                      placeholder={t('internalAdminNotePlaceholder')}
                      className="mt-1 min-h-[38px] w-full rounded-xl border border-dashed border-labsa-terracotta/50 bg-labsa-terracotta-light/20 px-3 py-1.5 text-labsa-charcoal"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPendingConfirm({
                        type: 'order',
                        fromStatus: selectedOrder.orderStatus,
                        toStatus: nextOrderStatus,
                      })
                    }
                    className="inline-flex min-h-[40px] w-full items-center justify-center rounded-xl bg-labsa-charcoal px-4 py-2 font-extrabold text-labsa-white transition hover:bg-labsa-olive-dark"
                  >
                    {t('prepareOrderUpdate')}
                  </button>
                </div>
              </div>

              {/* 3. Manual Shipment & Tracking Panel */}
              <div className="rounded-2xl border-2 border-labsa-olive/40 bg-labsa-white p-5 text-xs">
                <h4 className="flex items-center gap-1.5 text-sm font-extrabold text-labsa-charcoal">
                  <Truck
                    className="h-4 w-4 text-labsa-olive-dark"
                    aria-hidden="true"
                  />
                  <span>{t('shipmentHeading')}</span>
                </h4>
                <p className="mt-1.5 text-[11px] text-labsa-charcoal-muted">
                  {t('shipmentDemoNotice')}
                </p>

                <div className="mt-3 space-y-2.5">
                  <div>
                    <label
                      htmlFor="admin-shp-status"
                      className="block font-bold text-labsa-charcoal"
                    >
                      {t('selectShipmentStatus')}
                    </label>
                    <select
                      id="admin-shp-status"
                      value={nextShipmentStatus}
                      onChange={(e) =>
                        setNextShipmentStatus(
                          e.target.value as ShipmentLifecycleStatus
                        )
                      }
                      className="mt-1 min-h-[38px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-1.5 font-bold text-labsa-charcoal"
                    >
                      {ALL_SHIPMENT_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {tStatuses(`shipment.${st}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="admin-carrier-name"
                        className="block font-bold text-labsa-charcoal"
                      >
                        {t('carrierNameLabel')}
                      </label>
                      <input
                        id="admin-carrier-name"
                        type="text"
                        value={carrierNameInput}
                        onChange={(e) => setCarrierNameInput(e.target.value)}
                        placeholder={t('carrierNamePlaceholder')}
                        className="mt-1 min-h-[38px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-2.5 py-1.5 text-labsa-charcoal"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="admin-tracking-ref"
                        className="block font-bold text-labsa-charcoal"
                      >
                        {t('trackingNumberLabel')}
                      </label>
                      <input
                        id="admin-tracking-ref"
                        type="text"
                        dir="ltr"
                        value={trackingNumberInput}
                        onChange={(e) => setTrackingNumberInput(e.target.value)}
                        placeholder={t('trackingNumberPlaceholder')}
                        className="mt-1 min-h-[38px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-2.5 py-1.5 font-mono text-labsa-charcoal"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-shp-public-note"
                      className="block font-bold text-labsa-charcoal"
                    >
                      {t('customerTrackingNoteLabel')}
                    </label>
                    <input
                      id="admin-shp-public-note"
                      type="text"
                      value={shipmentPublicNote}
                      onChange={(e) => setShipmentPublicNote(e.target.value)}
                      placeholder={t('customerTrackingNotePlaceholder')}
                      className="mt-1 min-h-[38px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3 py-1.5 text-labsa-charcoal"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-shp-internal-note"
                      className="flex items-center gap-1 font-bold text-labsa-terracotta-dark"
                    >
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      <span>{t('internalAdminNoteLabel')}</span>
                    </label>
                    <input
                      id="admin-shp-internal-note"
                      type="text"
                      value={shipmentInternalNote}
                      onChange={(e) => setShipmentInternalNote(e.target.value)}
                      placeholder={t('internalAdminNotePlaceholder')}
                      className="mt-1 min-h-[38px] w-full rounded-xl border border-dashed border-labsa-terracotta/50 bg-labsa-terracotta-light/20 px-3 py-1.5 text-labsa-charcoal"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPendingConfirm({
                        type: 'shipment',
                        fromStatus: selectedOrder.shipmentStatus,
                        toStatus: nextShipmentStatus,
                      })
                    }
                    className="inline-flex min-h-[40px] w-full items-center justify-center rounded-xl bg-labsa-olive-dark px-4 py-2 font-extrabold text-labsa-white transition hover:bg-labsa-charcoal"
                  >
                    {t('prepareShipmentUpdate')}
                  </button>
                </div>
              </div>
            </div>

            {/* Order Status & Audit Timeline History */}
            <div className="mt-6 rounded-2xl border border-labsa-cream bg-labsa-white p-5 text-xs">
              <h4 className="flex items-center gap-2 text-sm font-extrabold text-labsa-charcoal">
                <Clock
                  className="h-4 w-4 text-labsa-olive-dark"
                  aria-hidden="true"
                />
                <span>{t('historyHeading')}</span>
              </h4>
              <ul className="mt-3 space-y-3">
                {[...selectedOrder.statusHistory].reverse().map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-labsa-cream bg-labsa-canvas p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-labsa-charcoal px-2.5 py-0.5 text-[11px] font-bold text-labsa-white">
                          {entry.domain === 'order'
                            ? t('domainOrder')
                            : entry.domain === 'payment'
                              ? t('domainPayment')
                              : t('domainShipment')}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-labsa-charcoal">
                          {entry.fromStatus
                            ? `${tStatuses(
                                `${entry.domain}.${entry.fromStatus}`
                              )} → `
                            : ''}
                          {tStatuses(`${entry.domain}.${entry.toStatus}`)}
                        </span>
                        <span className="rounded-full border border-labsa-cream bg-labsa-white px-2 py-0.5 text-[10px] font-bold text-labsa-charcoal-muted">
                          {entry.actor === 'admin'
                            ? `${t('actorAdmin')}${
                                entry.actorIdentity
                                  ? ` (${entry.actorIdentity})`
                                  : ''
                              }`
                            : entry.actor === 'customer'
                              ? t('actorCustomer')
                              : t('actorSystem')}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-labsa-charcoal-muted">
                        {new Date(entry.timestamp).toLocaleString(
                          locale === 'ar' ? 'ar-EG' : 'en-EG'
                        )}
                      </span>
                    </div>

                    {/* Customer-Visible Note */}
                    <div className="mt-2 flex items-start gap-2">
                      <span className="shrink-0 rounded-md bg-labsa-olive-light px-2 py-0.5 text-[10px] font-bold text-labsa-olive-dark">
                        {t('publicNoteBadge')}
                      </span>
                      <p className="font-bold text-labsa-charcoal">
                        {getLocalizedText(entry.note, locale)}
                      </p>
                    </div>

                    {/* Private Internal Admin Note (Only visible here in Admin Console) */}
                    {entry.internalNote && (
                      <div className="mt-2 flex items-start gap-2 rounded-lg border border-dashed border-labsa-terracotta/50 bg-labsa-terracotta-light/30 p-2">
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-labsa-terracotta px-2 py-0.5 text-[10px] font-bold text-labsa-white">
                          <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                          <span>{t('internalNoteBadge')}</span>
                        </span>
                        <p className="font-bold text-labsa-charcoal">
                          {entry.internalNote}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
