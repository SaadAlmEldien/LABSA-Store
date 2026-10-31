import type { LocalizedText } from '@/data/catalog';
import type { DemoOrder } from '@/data/orders';

export interface DemoOrderNotification {
  id: string;
  orderNumber: string;
  timestamp: string;
  category: 'order' | 'payment' | 'shipment';
  statusKey: string;
  title: LocalizedText;
  message: LocalizedText;
  channelPreviewLabel: LocalizedText;
}

/**
 * Derives customer-visible in-app demo notifications strictly from a verified
 * customer order's public status history (after `sanitizeOrderForCustomer` has
 * stripped all private admin notes).
 *
 * Security & Privacy:
 * - Notifications are NEVER exposed in a global unauthenticated feed.
 * - Shown only to the customer who unlocked the matching order via Order Ref + Mobile Lookup.
 * - No real Email, SMS, or WhatsApp messages are sent.
 */
export function buildOrderNotificationsForCustomer(
  sanitizedOrder: DemoOrder
): DemoOrderNotification[] {
  return [...sanitizedOrder.statusHistory]
    .reverse()
    .map((entry) => {
      const title: LocalizedText =
        entry.domain === 'payment'
          ? {
              ar: `إشعار تحديث حالة الدفع — الطلب ${sanitizedOrder.orderNumber}`,
              en: `Payment Status Update — Order ${sanitizedOrder.orderNumber}`,
            }
          : entry.domain === 'shipment'
            ? {
                ar: `إشعار تحديث الشحنة والتتبع — الطلب ${sanitizedOrder.orderNumber}`,
                en: `Shipment & Tracking Update — Order ${sanitizedOrder.orderNumber}`,
              }
            : {
                ar: `إشعار حالة الطلب — الطلب ${sanitizedOrder.orderNumber}`,
                en: `Order Status Update — Order ${sanitizedOrder.orderNumber}`,
              };

      return {
        id: `notif-${entry.id}`,
        orderNumber: sanitizedOrder.orderNumber,
        timestamp: entry.timestamp,
        category: entry.domain,
        statusKey: entry.toStatus,
        title,
        message: entry.note,
        channelPreviewLabel: {
          ar: 'إشعار داخل التطبيق فقط (نسخة تجريبية — لا يتم إرسال رسائل SMS أو بريد أو واتساب حقيقية)',
          en: 'In-App Demo Notification Only (No real Email, SMS, or WhatsApp sent)',
        },
      };
    });
}

/**
 * Documented Integration Boundary for a Future External Notification Service
 * --------------------------------------------------------------------------
 * In a production deployment, a server-side adapter implementing this interface
 * can dispatch transactional notifications when `adminUpdateOrderStatus`,
 * `adminUpdatePaymentStatus`, or `adminUpdateShipmentAndTracking` commits.
 * No real provider or credentials are used in this portfolio project.
 */
export interface FutureNotificationProviderBoundary {
  readonly providerName: string;
  sendOrderUpdateNotification(params: {
    orderNumber: string;
    recipientPhoneNormalized: string;
    locale: 'ar' | 'en';
    category: 'order' | 'payment' | 'shipment';
    publicMessage: string;
  }): Promise<{ delivered: boolean; providerMessageId?: string }>;
}
