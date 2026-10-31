/**
 * LABSA | لَبسة — Authoritative Brand & Palette B Tokens
 * Source of truth: BRAND_GUIDE.md & public/brand/labsa-logo.*
 */
export const LABSA_BRAND = {
  name: {
    en: 'LABSA',
    ar: 'لَبسة',
    arPlain: 'لبسة',
    combined: 'LABSA | لَبسة',
  },
  tagline: {
    ar: 'لبسة تليق بيك',
    en: 'Crafted Clothing That Suits You',
  },
  assets: {
    logoWebp: '/brand/labsa-logo.webp',
    logoPng: '/brand/labsa-logo.png',
    logoReferenceJpg: '/brand/labsa-logo-reference.jpg',
    width: 1536,
    height: 1024,
  },
  paletteB: {
    logoSurfaceWhite: '#FFFFFF',
    mainWarmWhite: '#FAF7F2',
    secondarySurface: '#F3ECE1',
    warmFabricHighlight: '#E9D7BF',
    charcoal: '#30302E',
    charcoalMuted: '#5C5A54',
    olive: '#808060',
    oliveDark: '#66664B',
    terracotta: '#C8784C',
    terracottaDark: '#B06238',
  },
  currency: {
    code: 'EGP',
    symbolAr: 'ج.م',
    symbolEn: 'EGP',
  },
  demoSafeguards: {
    isDemoStore: true,
    fictionalPhone: '+20 100 000 0000 (DEMO ONLY)',
    fictionalEmail: 'demo@labsa-store.example',
    fictionalInstaPay: 'labsa.demo@instapay (DEMO ONLY)',
    fictionalWallet: '0100-000-0000 (DEMO ONLY)',
  },
} as const;

/**
 * Configured WhatsApp Destination
 * Reuses the project's official phone (+20 100 000 0000 -> 201000000000)
 * Overridable via NEXT_PUBLIC_WHATSAPP_NUMBER or NEXT_PUBLIC_WHATSAPP_URL
 */
export const WHATSAPP_CONTACT = {
  phoneNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '201000000000',
  customUrl: process.env.NEXT_PUBLIC_WHATSAPP_URL || '',
  defaultMessage: {
    ar: 'مرحباً لَبسة، أود الاستفسار عن تشكيلة الملابس والطلبات.',
    en: 'Hello LABSA, I would like to inquire about your apparel collection and orders.',
  },
  getUrl(locale: string = 'ar'): string {
    if (this.customUrl) return this.customUrl;
    const cleanNumber = this.phoneNumber.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      locale === 'ar' ? this.defaultMessage.ar : this.defaultMessage.en
    );
    return `https://wa.me/${cleanNumber}?text=${text}`;
  },
} as const;
