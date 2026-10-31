'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import type { AdminSessionPayload } from '@/lib/admin-auth';
import {
  type CatalogProduct,
  getAllCatalogProducts,
  getLocalizedText,
} from '@/data/catalog';
import {
  type DemoOrder,
  readAllDemoOrders,
  readStockDeductions,
} from '@/data/orders';
import { type DemoCoupon, readAllDemoCoupons } from '@/data/coupons';
import { type ProductReview, readAllDemoReviews } from '@/data/reviews';
import { getPaymentMethodOption } from '@/data/payments';
import { AdminOrdersSection } from '@/components/admin/AdminOrdersSection';
import { AdminProductsSection } from '@/components/admin/AdminProductsSection';
import { AdminCouponsSection } from '@/components/admin/AdminCouponsSection';
import { AdminReviewsSection } from '@/components/admin/AdminReviewsSection';
import { formatEGP, cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  ShieldAlert,
  Tag,
  Truck,
} from 'lucide-react';

type AdminTab = 'overview' | 'orders' | 'products' | 'coupons' | 'reviews';

export default function AdminDashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('Admin');
  const tStatuses = useTranslations('OrderStatuses');

  const BackArrow = locale === 'ar' ? ArrowRight : ArrowLeft;

  // Server Session State
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [session, setSession] = useState<AdminSessionPayload | null>(null);

  // Navigation & Shared Data State
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [coupons, setCoupons] = useState<DemoCoupon[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [focusedOrderId, setFocusedOrderId] = useState<string | null>(null);
  const [filterPendingPaymentsOnOpen, setFilterPendingPaymentsOnOpen] =
    useState(false);

  const loadData = useCallback(async () => {
    try {
      const [ordersRes, productsRes, couponsRes, reviewsRes] = await Promise.all([
        fetch('/api/admin/orders', { cache: 'no-store' }),
        fetch('/api/admin/catalog', { cache: 'no-store' }),
        fetch('/api/admin/coupons', { cache: 'no-store' }),
        fetch('/api/admin/reviews', { cache: 'no-store' }),
      ]);

      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        if (oData.ok && Array.isArray(oData.orders)) setOrders(oData.orders);
      } else {
        setOrders(readAllDemoOrders());
      }

      if (productsRes.ok) {
        const pData = await productsRes.json();
        if (pData.ok && Array.isArray(pData.products)) setProducts(pData.products);
      } else {
        setProducts(getAllCatalogProducts());
      }

      if (couponsRes.ok) {
        const cData = await couponsRes.json();
        if (cData.ok && Array.isArray(cData.coupons)) setCoupons(cData.coupons);
      } else {
        setCoupons(readAllDemoCoupons());
      }

      if (reviewsRes.ok) {
        const rData = await reviewsRes.json();
        if (rData.ok && Array.isArray(rData.reviews)) setReviews(rData.reviews);
      } else {
        setReviews(readAllDemoReviews());
      }
    } catch {
      setOrders(readAllDemoOrders());
      setProducts(getAllCatalogProducts());
      setCoupons(readAllDemoCoupons());
      setReviews(readAllDemoReviews());
    }
  }, []);

  const fetchServerSession = useCallback(async () => {
    setIsLoadingSession(true);
    try {
      const res = await fetch('/api/admin/session', {
        method: 'GET',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.session) {
          setSession(data.session);
        } else {
          setSession(null);
          router.replace('/admin/login');
        }
      } else {
        setSession(null);
        router.replace('/admin/login');
      }
    } catch {
      setSession(null);
      router.replace('/admin/login');
    } finally {
      setIsLoadingSession(false);
    }
  }, [router]);

  useEffect(() => {
    fetchServerSession();
    loadData();
  }, [fetchServerSession, loadData]);

  /**
   * Calls the server authorization gate (`POST /api/admin/authorize`) before
   * executing any administrative order, payment, shipment, or catalog mutation.
   */
  const authorizeServerAdminAction = useCallback(
    async (
      actionType: string
    ): Promise<{
      authorized: boolean;
      actorIdentity?: string;
      serverTimestamp?: string;
    }> => {
      try {
        const res = await fetch('/api/admin/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actionType }),
        });
        if (!res.ok) {
          setSession(null);
          router.replace('/admin/login');
          return { authorized: false };
        }
        const data = await res.json();
        return {
          authorized: Boolean(data.authorized),
          actorIdentity: data.actorIdentity,
          serverTimestamp: data.serverTimestamp,
        };
      } catch {
        return { authorized: false };
      }
    },
    [router]
  );

  async function handleSignOut() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    setSession(null);
    setActiveTab('overview');
    router.replace('/admin/login');
  }

  // Dynamic KPI Metrics calculated strictly from stored demo records (Zero fabricated numbers)
  const kpiMetrics = useMemo(() => {
    const newOrdersCount = orders.filter(
      (o) => o.orderStatus === 'new' || o.orderStatus === 'awaiting_processing'
    ).length;

    const awaitingPaymentCount = orders.filter(
      (o) => o.paymentStatus === 'awaiting_manual_verification'
    ).length;

    const preparingOrdersCount = orders.filter(
      (o) =>
        o.orderStatus === 'confirmed' ||
        o.orderStatus === 'preparing' ||
        o.orderStatus === 'ready_to_ship'
    ).length;

    const inTransitShipmentsCount = orders.filter(
      (o) =>
        o.shipmentStatus === 'dispatched' || o.shipmentStatus === 'in_transit'
    ).length;

    const activeProductsCount = products.filter(
      (p) => p.status === 'active'
    ).length;

    const deductions = readStockDeductions();
    let outOfStockVariantsCount = 0;
    for (const prod of products) {
      for (const v of prod.variants) {
        const live = Math.max(0, v.stock - (deductions[v.id] ?? 0));
        if (live <= 0) {
          outOfStockVariantsCount += 1;
        }
      }
    }

    return {
      newOrdersCount,
      awaitingPaymentCount,
      preparingOrdersCount,
      inTransitShipmentsCount,
      activeProductsCount,
      outOfStockVariantsCount,
    };
  }, [orders, products]);

  const pendingVerificationOrders = useMemo(
    () =>
      orders.filter((o) => o.paymentStatus === 'awaiting_manual_verification'),
    [orders]
  );

  function jumpToOrderInOrdersTab(
    orderId: string | null,
    filterPending = false
  ) {
    setFocusedOrderId(orderId);
    setFilterPendingPaymentsOnOpen(filterPending);
    setActiveTab('orders');
  }

  if (isLoadingSession || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-labsa-canvas px-4 py-16 text-center">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-labsa-cream bg-labsa-white px-6 py-4 text-sm font-bold text-labsa-charcoal shadow-craft">
          <Clock className="h-4 w-4 animate-spin text-labsa-terracotta" />
          <span>{t('auth.checkingSession')}</span>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // AUTHENTICATED ADMIN CONSOLE
  // ===========================================================================
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Admin Session & Navigation Bar */}
      <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-5 shadow-craft sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-labsa-cream pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-labsa-charcoal px-3 py-0.5 text-[11px] font-extrabold text-labsa-white">
                LABSA ADMIN
              </span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                  session.authMode === 'configured_credentials'
                    ? 'bg-labsa-status-success/15 text-labsa-status-success'
                    : 'bg-labsa-olive-light text-labsa-olive-dark'
                )}
              >
                {session.authMode === 'configured_credentials'
                  ? t('auth.modeCredentials')
                  : t('auth.modeLocalDemo')}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold text-labsa-charcoal sm:text-3xl">
              {t('pageTitle')}
            </h1>
            <p className="mt-1 text-xs text-labsa-charcoal-muted sm:text-sm">
              {t('pageSubtitle')}
            </p>
          </div>

          {/* Current Admin Identity & Sign-Out */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-labsa-cream bg-labsa-canvas px-3.5 py-2 text-xs">
              <span className="text-labsa-charcoal-muted">
                {t('auth.signedInAs')}{' '}
              </span>
              <strong
                dir="ltr"
                className="font-mono font-extrabold text-labsa-charcoal"
              >
                {session.actorIdentity}
              </strong>
            </div>

            <Link
              href="/"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-labsa-cream bg-labsa-canvas px-3.5 py-2 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-charcoal"
            >
              <BackArrow className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('nav.backToStorefront')}</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-labsa-status-danger/40 bg-labsa-status-danger/10 px-3.5 py-2 text-xs font-extrabold text-labsa-status-danger transition hover:bg-labsa-status-danger hover:text-labsa-white"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('auth.signOutButton')}</span>
            </button>
          </div>
        </div>

        {/* Demo Safeguard Notice */}
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-dashed border-labsa-terracotta/50 bg-labsa-terracotta-light/30 p-3.5 text-xs text-labsa-charcoal">
          <ShieldAlert
            className="mt-0.5 h-4 w-4 shrink-0 text-labsa-terracotta-dark"
            aria-hidden="true"
          />
          <p>{t('demoBanner')}</p>
        </div>

        {/* Primary Admin Section Tabs */}
        <nav
          aria-label="Admin sections"
          className="mt-5 flex flex-wrap gap-2"
        >
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={cn(
              'inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition sm:text-sm',
              activeTab === 'overview'
                ? 'bg-labsa-charcoal text-labsa-white shadow-craft'
                : 'border border-labsa-cream bg-labsa-canvas text-labsa-charcoal hover:border-labsa-charcoal'
            )}
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            <span>{t('nav.overview')}</span>
          </button>

          <button
            type="button"
            onClick={() => jumpToOrderInOrdersTab(null, false)}
            className={cn(
              'inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition sm:text-sm',
              activeTab === 'orders'
                ? 'bg-labsa-charcoal text-labsa-white shadow-craft'
                : 'border border-labsa-cream bg-labsa-canvas text-labsa-charcoal hover:border-labsa-charcoal'
            )}
          >
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            <span>{t('nav.orders')}</span>
            {kpiMetrics.awaitingPaymentCount > 0 && (
              <span className="rounded-full bg-labsa-terracotta px-2 py-0.5 font-mono text-[11px] text-labsa-white">
                {kpiMetrics.awaitingPaymentCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={cn(
              'inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition sm:text-sm',
              activeTab === 'products'
                ? 'bg-labsa-charcoal text-labsa-white shadow-craft'
                : 'border border-labsa-cream bg-labsa-canvas text-labsa-charcoal hover:border-labsa-charcoal'
            )}
          >
            <Boxes className="h-4 w-4" aria-hidden="true" />
            <span>{t('nav.products')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coupons')}
            className={cn(
              'inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition sm:text-sm',
              activeTab === 'coupons'
                ? 'bg-labsa-charcoal text-labsa-white shadow-craft'
                : 'border border-labsa-cream bg-labsa-canvas text-labsa-charcoal hover:border-labsa-charcoal'
            )}
          >
            <Tag className="h-4 w-4" aria-hidden="true" />
            <span>{locale === 'ar' ? 'الكوبونات والخصومات' : 'Coupons'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={cn(
              'inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition sm:text-sm',
              activeTab === 'reviews'
                ? 'bg-labsa-charcoal text-labsa-white shadow-craft'
                : 'border border-labsa-cream bg-labsa-canvas text-labsa-charcoal hover:border-labsa-charcoal'
            )}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span>{locale === 'ar' ? 'تقييمات المنتجات' : 'Reviews'}</span>
            {reviews.filter((r) => r.status === 'pending').length > 0 && (
              <span className="rounded-full bg-labsa-terracotta px-2 py-0.5 font-mono text-[11px] text-labsa-white">
                {reviews.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="mt-6 space-y-6">
          {/* Dynamic KPI Summary Cards (Calculated from Stored Records) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-5 shadow-craft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-labsa-charcoal-muted">
                  {t('overview.kpiNewOrders')}
                </span>
                <Package className="h-5 w-5 text-labsa-charcoal" />
              </div>
              <p className="mt-3 font-mono text-3xl font-extrabold text-labsa-charcoal">
                {kpiMetrics.newOrdersCount}
              </p>
            </div>

            <div className="rounded-3xl border-2 border-labsa-terracotta/50 bg-labsa-white p-5 shadow-craft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-labsa-terracotta-dark">
                  {t('overview.kpiAwaitingPayment')}
                </span>
                <CreditCard className="h-5 w-5 text-labsa-terracotta" />
              </div>
              <p className="mt-3 font-mono text-3xl font-extrabold text-labsa-terracotta-dark">
                {kpiMetrics.awaitingPaymentCount}
              </p>
            </div>

            <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-5 shadow-craft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-labsa-charcoal-muted">
                  {t('overview.kpiPreparingOrders')}
                </span>
                <ClipboardList className="h-5 w-5 text-labsa-olive-dark" />
              </div>
              <p className="mt-3 font-mono text-3xl font-extrabold text-labsa-charcoal">
                {kpiMetrics.preparingOrdersCount}
              </p>
            </div>

            <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-5 shadow-craft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-labsa-charcoal-muted">
                  {t('overview.kpiInTransitShipments')}
                </span>
                <Truck className="h-5 w-5 text-labsa-olive-dark" />
              </div>
              <p className="mt-3 font-mono text-3xl font-extrabold text-labsa-olive-dark">
                {kpiMetrics.inTransitShipmentsCount}
              </p>
            </div>

            <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-5 shadow-craft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-labsa-charcoal-muted">
                  {t('overview.kpiActiveProducts')}
                </span>
                <Boxes className="h-5 w-5 text-labsa-charcoal" />
              </div>
              <p className="mt-3 font-mono text-3xl font-extrabold text-labsa-charcoal">
                {kpiMetrics.activeProductsCount}
              </p>
            </div>

            <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-5 shadow-craft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-labsa-charcoal-muted">
                  {t('overview.kpiOutOfStockVariants')}
                </span>
                <AlertCircle className="h-5 w-5 text-labsa-status-danger" />
              </div>
              <p className="mt-3 font-mono text-3xl font-extrabold text-labsa-status-danger">
                {kpiMetrics.outOfStockVariantsCount}
              </p>
            </div>
          </div>

          {/* Manual Payment Verification Queue Card */}
          <div className="rounded-3xl border-2 border-dashed border-labsa-terracotta/50 bg-labsa-white p-6 shadow-craft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-labsa-charcoal">
                  {t('overview.verificationQueueTitle')}
                </h2>
                <p className="mt-1 text-xs text-labsa-charcoal-muted">
                  {t('overview.verificationQueueSubtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => jumpToOrderInOrdersTab(null, true)}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-labsa-terracotta px-4 py-2 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-terracotta-dark"
              >
                <span>{t('overview.viewAllOrdersButton')}</span>
              </button>
            </div>

            {pendingVerificationOrders.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-labsa-canvas p-4 text-xs font-bold text-labsa-charcoal-muted">
                {t('overview.noPendingVerifications')}
              </p>
            ) : (
              <div className="mt-4 divide-y divide-dashed divide-labsa-cream">
                {pendingVerificationOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                  >
                    <div>
                      <p className="font-mono text-sm font-extrabold text-labsa-charcoal">
                        {order.orderNumber}{' '}
                        <span className="font-sans font-bold text-labsa-charcoal-muted">
                          — {order.customer.fullName}
                        </span>
                      </p>
                      <p className="mt-0.5 text-labsa-charcoal-muted">
                        {getLocalizedText(
                          getPaymentMethodOption(order.paymentMethod).title,
                          locale
                        )}{' '}
                        •{' '}
                        <strong className="font-mono text-labsa-terracotta-dark">
                          {formatEGP(order.pricing.totalEgp, locale)}
                        </strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => jumpToOrderInOrdersTab(order.id, false)}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-labsa-charcoal px-3.5 py-1.5 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-terracotta"
                    >
                      <span>{t('overview.reviewOrderButton')}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Stored Demo Orders */}
          <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold text-labsa-charcoal">
                {t('overview.recentOrdersTitle')}
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => jumpToOrderInOrdersTab(null, false)}
                  className="rounded-xl border border-labsa-cream bg-labsa-canvas px-3.5 py-2 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-charcoal"
                >
                  {t('overview.viewAllOrdersButton')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="rounded-xl border border-labsa-cream bg-labsa-canvas px-3.5 py-2 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-charcoal"
                >
                  {t('overview.manageCatalogButton')}
                </button>
              </div>
            </div>

            {orders.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-labsa-canvas p-4 text-xs font-bold text-labsa-charcoal-muted">
                {t('overview.emptyOrders')}
              </p>
            ) : (
              <div className="mt-4 divide-y divide-dashed divide-labsa-cream">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                  >
                    <div>
                      <p className="font-mono text-sm font-extrabold text-labsa-charcoal">
                        {order.orderNumber}{' '}
                        <span className="font-sans font-bold text-labsa-charcoal-muted">
                          — {order.customer.fullName} (
                          {getLocalizedText(
                            order.customer.governorateNameSnapshot,
                            locale
                          )}
                          )
                        </span>
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="rounded-full bg-labsa-canvas px-2.5 py-0.5 text-[11px] font-bold text-labsa-charcoal">
                          {tStatuses(`order.${order.orderStatus}`)}
                        </span>
                        <span className="rounded-full bg-labsa-terracotta-light/60 px-2.5 py-0.5 text-[11px] font-bold text-labsa-terracotta-dark">
                          {tStatuses(`payment.${order.paymentStatus}`)}
                        </span>
                        <span className="rounded-full bg-labsa-olive-light px-2.5 py-0.5 text-[11px] font-bold text-labsa-olive-dark">
                          {tStatuses(`shipment.${order.shipmentStatus}`)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-extrabold text-labsa-charcoal">
                        {formatEGP(order.pricing.totalEgp, locale)}
                      </span>
                      <button
                        type="button"
                        onClick={() => jumpToOrderInOrdersTab(order.id, false)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-labsa-charcoal px-3.5 py-1.5 text-xs font-extrabold text-labsa-white transition hover:bg-labsa-terracotta"
                      >
                        <span>{t('overview.reviewOrderButton')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS, PAYMENTS & SHIPMENT OPERATIONS */}
      {activeTab === 'orders' && (
        <div className="mt-6">
          <AdminOrdersSection
            orders={orders}
            onOrdersUpdated={loadData}
            authorizeAction={authorizeServerAdminAction}
            initialSelectedOrderId={focusedOrderId}
            initialFilterPendingPayment={filterPendingPaymentsOnOpen}
          />
        </div>
      )}

      {/* TAB 3: PRODUCTS & VARIANT INVENTORY */}
      {activeTab === 'products' && (
        <div className="mt-6">
          <AdminProductsSection
            products={products}
            onCatalogUpdated={loadData}
            authorizeAction={authorizeServerAdminAction}
          />
        </div>
      )}

      {/* TAB 4: DISCOUNT COUPONS */}
      {activeTab === 'coupons' && (
        <div className="mt-6">
          <AdminCouponsSection
            coupons={coupons}
            onCouponsUpdated={loadData}
            authorizeAction={authorizeServerAdminAction}
          />
        </div>
      )}

      {/* TAB 5: CUSTOMER REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="mt-6">
          <AdminReviewsSection
            reviews={reviews}
            onReviewsUpdated={loadData}
            authorizeAction={authorizeServerAdminAction}
          />
        </div>
      )}
    </div>
  );
}
