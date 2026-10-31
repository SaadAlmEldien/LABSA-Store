import type { LocalizedText } from '@/data/catalog';
import type { AppLocale } from '@/i18n/routing';

export type ShippingTierCode =
  | 'tier_1_metro'
  | 'tier_2_standard'
  | 'tier_3_upper_egypt';

export interface GovernorateShippingRule {
  code: string;
  name: LocalizedText;
  tierCode: ShippingTierCode;
  feeEgp: 50 | 70 | 90;
  estimatedDays: LocalizedText;
}

/**
 * Authoritative 27-Governorate Delivery Fee Mapping in EGP
 * Working Rules:
 * - Cairo and Alexandria: EGP 50
 * - Assiut, Sohag, Qena, Luxor, and Aswan: EGP 90
 * - Giza and Minya: EGP 70
 * - Every other Egyptian governorate: EGP 70
 */
export const EGYPT_GOVERNORATES: readonly GovernorateShippingRule[] = [
  // ===========================================================================
  // TIER 1: EGP 50 (Cairo & Alexandria — 2 Governorates)
  // ===========================================================================
  {
    code: 'CAI',
    name: { ar: 'القاهرة', en: 'Cairo' },
    tierCode: 'tier_1_metro',
    feeEgp: 50,
    estimatedDays: { ar: '1 – 3 أيام عمل', en: '1–3 business days' },
  },
  {
    code: 'ALX',
    name: { ar: 'الإسكندرية', en: 'Alexandria' },
    tierCode: 'tier_1_metro',
    feeEgp: 50,
    estimatedDays: { ar: '1 – 3 أيام عمل', en: '1–3 business days' },
  },

  // ===========================================================================
  // TIER 2: EGP 70 (Giza, Minya & All Remaining 18 Governorates — 20 Total)
  // ===========================================================================
  {
    code: 'GIZ',
    name: { ar: 'الجيزة', en: 'Giza' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '2 – 4 أيام عمل', en: '2–4 business days' },
  },
  {
    code: 'MNY',
    name: { ar: 'المنيا', en: 'Minya' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '2 – 5 أيام عمل', en: '2–5 business days' },
  },
  {
    code: 'QLY',
    name: { ar: 'القليوبية', en: 'Qalyubia' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '2 – 4 أيام عمل', en: '2–4 business days' },
  },
  {
    code: 'DKH',
    name: { ar: 'الدقهلية', en: 'Dakahlia' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '2 – 5 أيام عمل', en: '2–5 business days' },
  },
  {
    code: 'SHR',
    name: { ar: 'الشرقية', en: 'Sharkia' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '2 – 5 أيام عمل', en: '2–5 business days' },
  },
  {
    code: 'GHR',
    name: { ar: 'الغربية', en: 'Gharbia' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '2 – 5 أيام عمل', en: '2–5 business days' },
  },
  {
    code: 'MNF',
    name: { ar: 'المنوفية', en: 'Monufia' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '2 – 5 أيام عمل', en: '2–5 business days' },
  },
  {
    code: 'BHR',
    name: { ar: 'البحيرة', en: 'Beheira' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '2 – 5 أيام عمل', en: '2–5 business days' },
  },
  {
    code: 'KFS',
    name: { ar: 'كفر الشيخ', en: 'Kafr El Sheikh' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '2 – 5 أيام عمل', en: '2–5 business days' },
  },
  {
    code: 'DMT',
    name: { ar: 'دمياط', en: 'Damietta' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '2 – 5 أيام عمل', en: '2–5 business days' },
  },
  {
    code: 'PTS',
    name: { ar: 'بورسعيد', en: 'Port Said' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '2 – 5 أيام عمل', en: '2–5 business days' },
  },
  {
    code: 'ISM',
    name: { ar: 'الإسماعيلية', en: 'Ismailia' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '2 – 5 أيام عمل', en: '2–5 business days' },
  },
  {
    code: 'SUZ',
    name: { ar: 'السويس', en: 'Suez' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '2 – 5 أيام عمل', en: '2–5 business days' },
  },
  {
    code: 'FYM',
    name: { ar: 'الفيوم', en: 'Faiyum' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '2 – 5 أيام عمل', en: '2–5 business days' },
  },
  {
    code: 'BNS',
    name: { ar: 'بني سويف', en: 'Beni Suef' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '2 – 5 أيام عمل', en: '2–5 business days' },
  },
  {
    code: 'RDS',
    name: { ar: 'البحر الأحمر', en: 'Red Sea' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '3 – 5 أيام عمل', en: '3–5 business days' },
  },
  {
    code: 'MTR',
    name: { ar: 'مطروح', en: 'Matrouh' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '3 – 5 أيام عمل', en: '3–5 business days' },
  },
  {
    code: 'NSI',
    name: { ar: 'شمال سيناء', en: 'North Sinai' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '3 – 5 أيام عمل', en: '3–5 business days' },
  },
  {
    code: 'SSI',
    name: { ar: 'جنوب سيناء', en: 'South Sinai' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '3 – 5 أيام عمل', en: '3–5 business days' },
  },
  {
    code: 'WAD',
    name: { ar: 'الوادي الجديد', en: 'New Valley' },
    tierCode: 'tier_2_standard',
    feeEgp: 70,
    estimatedDays: { ar: '3 – 5 أيام عمل', en: '3–5 business days' },
  },

  // ===========================================================================
  // TIER 3: EGP 90 (Assiut, Sohag, Qena, Luxor, Aswan — 5 Governorates)
  // ===========================================================================
  {
    code: 'AST',
    name: { ar: 'أسيوط', en: 'Assiut' },
    tierCode: 'tier_3_upper_egypt',
    feeEgp: 90,
    estimatedDays: { ar: '3 – 6 أيام عمل', en: '3–6 business days' },
  },
  {
    code: 'SOH',
    name: { ar: 'سوهاج', en: 'Sohag' },
    tierCode: 'tier_3_upper_egypt',
    feeEgp: 90,
    estimatedDays: { ar: '3 – 6 أيام عمل', en: '3–6 business days' },
  },
  {
    code: 'QEN',
    name: { ar: 'قنا', en: 'Qena' },
    tierCode: 'tier_3_upper_egypt',
    feeEgp: 90,
    estimatedDays: { ar: '3 – 6 أيام عمل', en: '3–6 business days' },
  },
  {
    code: 'LUX',
    name: { ar: 'الأقصر', en: 'Luxor' },
    tierCode: 'tier_3_upper_egypt',
    feeEgp: 90,
    estimatedDays: { ar: '3 – 6 أيام عمل', en: '3–6 business days' },
  },
  {
    code: 'ASW',
    name: { ar: 'أسوان', en: 'Aswan' },
    tierCode: 'tier_3_upper_egypt',
    feeEgp: 90,
    estimatedDays: { ar: '3 – 6 أيام عمل', en: '3–6 business days' },
  },
] as const;

export function getGovernorateByCode(
  code: string | null | undefined
): GovernorateShippingRule | undefined {
  if (!code) return undefined;
  return EGYPT_GOVERNORATES.find((g) => g.code === code);
}

export function calculateDeliveryFeeEgp(
  governorateCode: string | null | undefined
): number | null {
  const gov = getGovernorateByCode(governorateCode);
  return gov ? gov.feeEgp : null;
}

export function getGovernorateDisplayName(
  gov: GovernorateShippingRule,
  locale: AppLocale | string
): string {
  return locale === 'ar' ? gov.name.ar : gov.name.en;
}
