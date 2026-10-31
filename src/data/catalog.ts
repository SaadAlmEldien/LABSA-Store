import type { AppLocale } from '@/i18n/routing';

export type Audience = 'men' | 'kids';

export type CategoryKey =
  | 'trousers'
  | 'shirts'
  | 'tshirts'
  | 'sweatshirts'
  | 'jackets';

export type ProductStatus = 'active' | 'out_of_stock' | 'draft';

export interface LocalizedText {
  ar: string;
  en: string;
}

export interface ProductColor {
  key: 'olive' | 'terracotta' | 'charcoal' | 'cream' | 'sand' | 'navy';
  name: LocalizedText;
  hex: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  colorKey: ProductColor['key'];
  size: string;
  stock: number;
}

export interface ProductImage {
  id: string;
  url: string;
  fallbackUrl?: string;
  alt: LocalizedText;
  isPrimary?: boolean;
  colorKey?: ProductColor['key'];
  caption?: LocalizedText;
}

export interface ProductDetailsSpec {
  material: LocalizedText;
  fit: LocalizedText;
  care: LocalizedText;
}

export interface CatalogProduct {
  id: string;
  slug: string;
  audience: Audience;
  category: CategoryKey;
  title: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;
  priceEgp: number;
  previousPriceEgp?: number;
  colors: ProductColor[];
  sizes: string[];
  variants: ProductVariant[];
  images: ProductImage[];
  status: ProductStatus;
  isNew: boolean;
  isFeatured: boolean;
  featuredRank: number;
  createdAt: string;
  details: ProductDetailsSpec;
}

export interface CategoryDefinition {
  key: CategoryKey;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  audiences: Audience[];
}

export const CATALOG_CATEGORIES: CategoryDefinition[] = [
  {
    key: 'trousers',
    slug: 'trousers',
    name: {
      ar: 'بناطيل وسالوبيتات',
      en: 'Trousers & Overalls',
    },
    description: {
      ar: 'بناطيل تشينو وكارجو للرجال، وسالوبيتات كانفاس وبناطيل جوجر متينة للأطفال.',
      en: "Tailored men's chinos and cargo trousers alongside durable children's canvas overalls and twill joggers.",
    },
    audiences: ['men', 'kids'],
  },
  {
    key: 'shirts',
    slug: 'shirts',
    name: {
      ar: 'قمصان وأوفرشيرت',
      en: 'Shirts & Overshirts',
    },
    description: {
      ar: 'قمصان قطن مصري أوكسفورد، قمصان أوفرشيرت ثقيلة، وقمصان فلانيل ناعمة للأطفال.',
      en: 'Egyptian cotton Oxford button-downs, brushed overshirts, and soft flannel shirts for boys and girls.',
    },
    audiences: ['men', 'kids'],
  },
  {
    key: 'tshirts',
    slug: 'tshirts',
    name: {
      ar: 'تيشيرتات قطنية',
      en: 'Cotton T-Shirts',
    },
    description: {
      ar: 'تيشيرتات يومية من القطن المصري الممشط بتقفيل متقن وألوان ترابية دافئة.',
      en: 'Everyday combed Egyptian cotton T-shirts with durable ribbed collars and warm earth tones.',
    },
    audiences: ['men', 'kids'],
  },
  {
    key: 'sweatshirts',
    slug: 'sweatshirts',
    name: {
      ar: 'هوديز وسويت شيرت',
      en: 'Hoodies & Sweatshirts',
    },
    description: {
      ar: 'هوديز وسويت شيرت من قطن الميلتون المبطن بتفاصيل خياطة بارزة وجيوب عملية.',
      en: 'Heavyweight brushed fleece hoodies and crewneck sweatshirts with contrast pockets and reinforced seams.',
    },
    audiences: ['men', 'kids'],
  },
  {
    key: 'jackets',
    slug: 'jackets',
    name: {
      ar: 'بليزرات وجواكت خفيفة',
      en: 'Blazers & Light Jackets',
    },
    description: {
      ar: 'بليزرات كاجوال مبطنة للرجال وجواكت قميصية خفيفة ومريحة للأطفال.',
      en: "Structured casual blazers for men and quilted cotton shirt-jackets for children's everyday layering.",
    },
    audiences: ['men', 'kids'],
  },
];

export const CATALOG_COLORS: Record<ProductColor['key'], ProductColor> = {
  olive: {
    key: 'olive',
    name: { ar: 'زيتوني مطفي', en: 'Muted Olive' },
    hex: '#808060',
  },
  terracotta: {
    key: 'terracotta',
    name: { ar: 'تيراكوتا دافئ', en: 'Terracotta Orange' },
    hex: '#C8784C',
  },
  charcoal: {
    key: 'charcoal',
    name: { ar: 'فحمي داكن', en: 'Charcoal' },
    hex: '#30302E',
  },
  cream: {
    key: 'cream',
    name: { ar: 'كريمي طبيعي', en: 'Warm Cream' },
    hex: '#E9D7BF',
  },
  sand: {
    key: 'sand',
    name: { ar: 'بيج رملي', en: 'Warm Sand' },
    hex: '#D6C5B3',
  },
  navy: {
    key: 'navy',
    name: { ar: 'كحلي كلاسيكي', en: 'Deep Navy' },
    hex: '#2C3E50',
  },
};

export const MEN_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;
export const KIDS_SIZES = ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-12Y'] as const;

/**
 * Authoritative Demo Product Catalog (14 Products: 8 Men's, 6 Children's)
 */
export const DEMO_PRODUCTS: CatalogProduct[] = [
  // ===========================================================================
  // MEN'S COLLECTION (8 PRODUCTS)
  // ===========================================================================
  {
    id: 'prod-men-01',
    slug: 'olive-topstitched-chino-trousers',
    audience: 'men',
    category: 'trousers',
    title: {
      ar: 'بنطلون تشينو زيتوني بغرز خياطة بارزة',
      en: 'Olive Topstitched Utility Chino Trousers',
    },
    shortDescription: {
      ar: 'بنطلون تشينو رجالي بقصة مستقيمة مريحة من قطن تويل مصري مبرد (290 جم/م²) بجيوب مقواة.',
      en: 'Relaxed straight-fit chinos in 290 GSM brushed Egyptian cotton twill with reinforced pockets.',
    },
    description: {
      ar: 'بنطلون تشينو عملي مصمم لراحتك طوال اليوم من القطن المصري المبرد عالي الكثافة مع نسبة مرونة خفيفة تسهل الحركة. يتميز بجيوب جانبية مقواة بغرز خياطة مزدوجة وثنية سفلية نظيفة تناسب الشغل والخروجات اليومية.',
      en: 'Cut from dense 290 GSM brushed Egyptian cotton twill with a touch of stretch for easy movement all day. Finished with double-stitched slant pockets, a coin welt pocket, and clean cuffs that pair effortlessly with shirts or tees.',
    },
    priceEgp: 750,
    previousPriceEgp: 890,
    colors: [CATALOG_COLORS.olive, CATALOG_COLORS.charcoal, CATALOG_COLORS.sand],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    variants: [
      { id: 'v-m01-olive-s', sku: 'LAB-M01-OLV-S', colorKey: 'olive', size: 'S', stock: 6 },
      { id: 'v-m01-olive-m', sku: 'LAB-M01-OLV-M', colorKey: 'olive', size: 'M', stock: 10 },
      { id: 'v-m01-olive-l', sku: 'LAB-M01-OLV-L', colorKey: 'olive', size: 'L', stock: 8 },
      { id: 'v-m01-olive-xl', sku: 'LAB-M01-OLV-XL', colorKey: 'olive', size: 'XL', stock: 4 },
      { id: 'v-m01-olive-xxl', sku: 'LAB-M01-OLV-XXL', colorKey: 'olive', size: 'XXL', stock: 0 },
      { id: 'v-m01-char-s', sku: 'LAB-M01-CHR-S', colorKey: 'charcoal', size: 'S', stock: 4 },
      { id: 'v-m01-char-m', sku: 'LAB-M01-CHR-M', colorKey: 'charcoal', size: 'M', stock: 7 },
      { id: 'v-m01-char-l', sku: 'LAB-M01-CHR-L', colorKey: 'charcoal', size: 'L', stock: 5 },
      { id: 'v-m01-char-xl', sku: 'LAB-M01-CHR-XL', colorKey: 'charcoal', size: 'XL', stock: 2 },
      { id: 'v-m01-char-xxl', sku: 'LAB-M01-CHR-XXL', colorKey: 'charcoal', size: 'XXL', stock: 3 },
      { id: 'v-m01-sand-s', sku: 'LAB-M01-SND-S', colorKey: 'sand', size: 'S', stock: 0 },
      { id: 'v-m01-sand-m', sku: 'LAB-M01-SND-M', colorKey: 'sand', size: 'M', stock: 5 },
      { id: 'v-m01-sand-l', sku: 'LAB-M01-SND-L', colorKey: 'sand', size: 'L', stock: 6 },
      { id: 'v-m01-sand-xl', sku: 'LAB-M01-SND-XL', colorKey: 'sand', size: 'XL', stock: 3 },
      { id: 'v-m01-sand-xxl', sku: 'LAB-M01-SND-XXL', colorKey: 'sand', size: 'XXL', stock: 2 },
    ],
    images: [
      {
        id: 'img-m01-1',
        url: '/products/men-olive-chinos.jpg',
        fallbackUrl: '/products/studio-trousers.svg',
        alt: {
          ar: 'بنطلون تشينو رجالي زيتوني مطوي يظهر تفاصيل الخياطة والجيوب',
          en: "Folded men's muted olive cotton twill chino trousers showing topstitched pockets",
        },
        isPrimary: true,
        colorKey: 'olive',
      },
      {
        id: 'img-m01-2',
        url: '/products/studio-trousers.svg',
        alt: {
          ar: 'مخطط تفصيلي لخياطة الجيب وثنية البنطلون التشينو',
          en: 'Tailoring detail diagram of pocket stitching and trouser cuff construction',
        },
      },
    ],
    status: 'active',
    isNew: false,
    isFeatured: true,
    featuredRank: 1,
    createdAt: '2026-10-12T10:00:00Z',
    details: {
      material: {
        ar: '98% قطن مصري تويل مبروم، 2% إيلاستين للمرونة (وزن القماش 290 جم/م²)',
        en: '98% brushed Egyptian cotton twill, 2% elastane (290 GSM fabric weight)',
      },
      fit: {
        ar: 'قصة مستقيمة مريحة (Regular Tapered Fit) بخصر متوسط الارتفاع',
        en: 'Regular tapered fit with mid-rise waist and comfortable seat',
      },
      care: {
        ar: 'غسيل آلي بماء فاتر (30 درجة مئوية) مع ألوان مشابهة. يُكوى على حرارة متوسطة.',
        en: 'Machine wash cold (30°C) with similar colors. Warm iron inside out.',
      },
    },
  },

  {
    id: 'prod-men-02',
    slug: 'charcoal-tailored-casual-blazer',
    audience: 'men',
    category: 'jackets',
    title: {
      ar: 'بليزر كاجوال فحمي مبطن بياقة زيتونية',
      en: 'Charcoal Tailored Blazer with Olive Lapel Trim',
    },
    shortDescription: {
      ar: 'بليزر كاجوال رجالي بنصف بطانة خفيفة من مزيج القطن والكتان مع ياقة زيتونية متباينة.',
      en: 'Half-lined smart-casual cotton-linen blazer with muted olive lapel trim and welt pockets.',
    },
    description: {
      ar: 'بليزر يجمع بين شياكة التفصيل وراحة اللبس اليومي؛ منسوج من القطن والكتان المسامي بلون فحمي داكن مع بطانة نصفية خفيفة تناسب جو مصر. مزود بياقة وغطاء جيوب باللون الزيتوني المطفي وغرز خياطة بارزة تمنحه طابعاً عصرياً مميزاً.',
      en: 'Balancing sharp tailoring with everyday comfort, this half-lined charcoal blazer is woven from a breathable cotton-linen herringbone blend. Detailed with muted olive lapel facing, welt pocket flaps, and tonal stitch work.',
    },
    priceEgp: 1450,
    colors: [CATALOG_COLORS.charcoal, CATALOG_COLORS.olive],
    sizes: ['M', 'L', 'XL', 'XXL'],
    variants: [
      { id: 'v-m02-char-m', sku: 'LAB-M02-CHR-M', colorKey: 'charcoal', size: 'M', stock: 5 },
      { id: 'v-m02-char-l', sku: 'LAB-M02-CHR-L', colorKey: 'charcoal', size: 'L', stock: 7 },
      { id: 'v-m02-char-xl', sku: 'LAB-M02-CHR-XL', colorKey: 'charcoal', size: 'XL', stock: 4 },
      { id: 'v-m02-char-xxl', sku: 'LAB-M02-CHR-XXL', colorKey: 'charcoal', size: 'XXL', stock: 2 },
      { id: 'v-m02-olive-m', sku: 'LAB-M02-OLV-M', colorKey: 'olive', size: 'M', stock: 3 },
      { id: 'v-m02-olive-l', sku: 'LAB-M02-OLV-L', colorKey: 'olive', size: 'L', stock: 4 },
      { id: 'v-m02-olive-xl', sku: 'LAB-M02-OLV-XL', colorKey: 'olive', size: 'XL', stock: 0 },
      { id: 'v-m02-olive-xxl', sku: 'LAB-M02-OLV-XXL', colorKey: 'olive', size: 'XXL', stock: 2 },
    ],
    images: [
      {
        id: 'img-m02-1',
        url: '/products/men-charcoal-blazer.jpg',
        fallbackUrl: '/products/studio-jacket.svg',
        alt: {
          ar: 'بليزر كاجوال رجالي بلون فحمي داكن مع تفاصيل ياقة وجيوب باللون الزيتوني',
          en: "Men's charcoal tailored casual blazer with muted olive lapel and pocket trim",
        },
        isPrimary: true,
        colorKey: 'charcoal',
      },
      {
        id: 'img-m02-2',
        url: '/products/studio-jacket.svg',
        alt: {
          ar: 'رسم تفصيلي لخياطة ياقة البليزر والأزرار الثلاثة',
          en: 'Detailed tailoring view of lapel stitching and three-button closure',
        },
      },
    ],
    status: 'active',
    isNew: true,
    isFeatured: true,
    featuredRank: 2,
    createdAt: '2026-10-25T14:00:00Z',
    details: {
      material: {
        ar: '85% قطن منسوج، 15% كتان مع بطانة نصفية من القطن الخفيف',
        en: '85% structured cotton herringbone, 15% linen with breathable half-lining',
      },
      fit: {
        ar: 'قصة مفصلة مريحة (Tailored Comfort Fit) تسمح بارتداء قميص أو تيشيرت أسفلها',
        en: 'Tailored comfort fit designed for easy layering over shirts or knitwear',
      },
      care: {
        ar: 'يُنصح بالتنظيف الجاف أو الغسيل اليدوي البارد للحفاظ على ثبات الياقة.',
        en: 'Dry clean recommended or gentle cold hand wash; steam to refresh.',
      },
    },
  },

  {
    id: 'prod-men-03',
    slug: 'olive-terracotta-heavyweight-hoodie',
    audience: 'men',
    category: 'sweatshirts',
    title: {
      ar: 'هودي قطن ثقيل زيتوني بجيب تيراكوتا',
      en: 'Olive Heavyweight Hoodie with Terracotta Pocket',
    },
    shortDescription: {
      ar: 'هودي قطن ميلتون مصري ثقيل (360 جم/م²) مبطن من الداخل مع جيب كانغرو بلون التيراكوتا.',
      en: 'Heavyweight 360 GSM brushed Egyptian cotton fleece hoodie with a contrast terracotta pouch pocket.',
    },
    description: {
      ar: 'قطعة أساسية لأيام الخريف والشتاء؛ هودي رجالي باللون الزيتوني المطفي مصنوع من قطن ميلتون مصري ثقيل (360 جم/م²) معالج ضد الوبر والانكماش. يتميز بجيب أمامي واسع بلون التيراكوتا الدافئ، وغطاء رأس مزدوج الطبقات، وأساور مضلعة متينة تحافظ على شكلها.',
      en: 'Cut from pre-shrunk 360 GSM Egyptian combed cotton fleece with a soft anti-pill brushed interior. Designed in muted olive with a warm terracotta kangaroo pocket, double-layer hood, braided drawcords, and sturdy ribbed cuffs.',
    },
    priceEgp: 890,
    colors: [CATALOG_COLORS.olive, CATALOG_COLORS.terracotta, CATALOG_COLORS.charcoal],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    variants: [
      { id: 'v-m03-olive-s', sku: 'LAB-M03-OLV-S', colorKey: 'olive', size: 'S', stock: 5 },
      { id: 'v-m03-olive-m', sku: 'LAB-M03-OLV-M', colorKey: 'olive', size: 'M', stock: 12 },
      { id: 'v-m03-olive-l', sku: 'LAB-M03-OLV-L', colorKey: 'olive', size: 'L', stock: 9 },
      { id: 'v-m03-olive-xl', sku: 'LAB-M03-OLV-XL', colorKey: 'olive', size: 'XL', stock: 6 },
      { id: 'v-m03-olive-xxl', sku: 'LAB-M03-OLV-XXL', colorKey: 'olive', size: 'XXL', stock: 3 },
      { id: 'v-m03-terra-s', sku: 'LAB-M03-TER-S', colorKey: 'terracotta', size: 'S', stock: 3 },
      { id: 'v-m03-terra-m', sku: 'LAB-M03-TER-M', colorKey: 'terracotta', size: 'M', stock: 6 },
      { id: 'v-m03-terra-l', sku: 'LAB-M03-TER-L', colorKey: 'terracotta', size: 'L', stock: 4 },
      { id: 'v-m03-terra-xl', sku: 'LAB-M03-TER-XL', colorKey: 'terracotta', size: 'XL', stock: 0 },
      { id: 'v-m03-terra-xxl', sku: 'LAB-M03-TER-XXL', colorKey: 'terracotta', size: 'XXL', stock: 2 },
      { id: 'v-m03-char-s', sku: 'LAB-M03-CHR-S', colorKey: 'charcoal', size: 'S', stock: 4 },
      { id: 'v-m03-char-m', sku: 'LAB-M03-CHR-M', colorKey: 'charcoal', size: 'M', stock: 8 },
      { id: 'v-m03-char-l', sku: 'LAB-M03-CHR-L', colorKey: 'charcoal', size: 'L', stock: 5 },
      { id: 'v-m03-char-xl', sku: 'LAB-M03-CHR-XL', colorKey: 'charcoal', size: 'XL', stock: 3 },
      { id: 'v-m03-char-xxl', sku: 'LAB-M03-CHR-XXL', colorKey: 'charcoal', size: 'XXL', stock: 1 },
    ],
    images: [
      {
        id: 'img-m03-1',
        url: '/products/men-olive-hoodie.jpg',
        fallbackUrl: '/products/studio-hoodie.svg',
        alt: {
          ar: 'هودي رجالي قطن ثقيل باللون الزيتوني مع جيب أمامي بلون التيراكوتا',
          en: "Men's muted olive heavyweight cotton hoodie with terracotta kangaroo pouch pocket",
        },
        isPrimary: true,
        colorKey: 'olive',
      },
      {
        id: 'img-m03-2',
        url: '/products/studio-hoodie.svg',
        alt: {
          ar: 'تفاصيل غرز الجيب الأمامي والأساور المضلعة للهودي',
          en: 'Close-up illustration of kangaroo pocket stitching and ribbed cuff construction',
        },
      },
    ],
    status: 'active',
    isNew: true,
    isFeatured: true,
    featuredRank: 3,
    createdAt: '2026-10-26T09:30:00Z',
    details: {
      material: {
        ar: '100% قطن مصري ميلتون مبطن ثقيل (360 جم/م²) معالج ضد الوبر',
        en: '100% combed Egyptian cotton fleece (360 GSM), anti-pill brushed interior',
      },
      fit: {
        ar: 'قصة مريحة بأكتاف منسدلة قليلاً (Relaxed Fit)',
        en: 'Relaxed everyday fit with structured double-layer hood',
      },
      care: {
        ar: 'يُغسل مقلوباً بماء بارد. يُجفف في الظل بعيداً عن المجفف الحراري.',
        en: 'Wash inside out in cold water. Lay flat or line dry in shade.',
      },
    },
  },

  {
    id: 'prod-men-04',
    slug: 'terracotta-brushed-cotton-overshirt',
    audience: 'men',
    category: 'shirts',
    title: {
      ar: 'قميص أوفرشيرت قطني بلون التيراكوتا الدافئ',
      en: 'Terracotta Brushed Cotton Twill Overshirt',
    },
    shortDescription: {
      ar: 'قميص ثقيل بجيوب صدر مزدوجة يمكن ارتداؤه كقميص أو جاكيت خفيف بين الفصول.',
      en: 'Midweight brushed cotton overshirt with dual utility chest pockets and horn-tone buttons.',
    },
    description: {
      ar: 'قطعة عملية لا غنى عنها في خزانة الرجل؛ قميص أوفرشيرت منسوج من القطن المصنفر الناعم بلون التيراكوتا الدافئ. مزود بجيبين أماميين بغطاء وأزرار متينة مع خياطة بارزة تمنحه طابعاً حرفياً أصيلاً.',
      en: 'Designed as a versatile transitional layer, this terracotta overshirt is cut from softly peached cotton twill. Detailed with twin button-flap chest pockets, reinforced cuffs, and contrast cream stitching.',
    },
    priceEgp: 680,
    previousPriceEgp: 780,
    colors: [CATALOG_COLORS.terracotta, CATALOG_COLORS.olive, CATALOG_COLORS.cream],
    sizes: ['S', 'M', 'L', 'XL'],
    variants: [
      { id: 'v-m04-terra-s', sku: 'LAB-M04-TER-S', colorKey: 'terracotta', size: 'S', stock: 4 },
      { id: 'v-m04-terra-m', sku: 'LAB-M04-TER-M', colorKey: 'terracotta', size: 'M', stock: 8 },
      { id: 'v-m04-terra-l', sku: 'LAB-M04-TER-L', colorKey: 'terracotta', size: 'L', stock: 6 },
      { id: 'v-m04-terra-xl', sku: 'LAB-M04-TER-XL', colorKey: 'terracotta', size: 'XL', stock: 3 },
      { id: 'v-m04-olive-s', sku: 'LAB-M04-OLV-S', colorKey: 'olive', size: 'S', stock: 2 },
      { id: 'v-m04-olive-m', sku: 'LAB-M04-OLV-M', colorKey: 'olive', size: 'M', stock: 5 },
      { id: 'v-m04-olive-l', sku: 'LAB-M04-OLV-L', colorKey: 'olive', size: 'L', stock: 4 },
      { id: 'v-m04-olive-xl', sku: 'LAB-M04-OLV-XL', colorKey: 'olive', size: 'XL', stock: 0 },
      { id: 'v-m04-cream-s', sku: 'LAB-M04-CRM-S', colorKey: 'cream', size: 'S', stock: 3 },
      { id: 'v-m04-cream-m', sku: 'LAB-M04-CRM-M', colorKey: 'cream', size: 'M', stock: 4 },
      { id: 'v-m04-cream-l', sku: 'LAB-M04-CRM-L', colorKey: 'cream', size: 'L', stock: 2 },
      { id: 'v-m04-cream-xl', sku: 'LAB-M04-CRM-XL', colorKey: 'cream', size: 'XL', stock: 1 },
    ],
    images: [
      {
        id: 'img-m04-1',
        url: '/products/men-terracotta-overshirt.jpg',
        fallbackUrl: '/products/studio-shirt.svg',
        alt: {
          ar: 'قميص أوفرشيرت رجالي بلون التيراكوتا مع جيوب صدر مزدوجة',
          en: "Men's terracotta brushed cotton overshirt with dual chest pockets",
        },
        isPrimary: true,
        colorKey: 'terracotta',
      },
      {
        id: 'img-m04-2',
        url: '/products/studio-shirt.svg',
        alt: {
          ar: 'تفاصيل أزرار وجيب القميص الأوفرشيرت',
          en: 'Detail view of chest pocket flap and button stitching',
        },
      },
    ],
    status: 'active',
    isNew: false,
    isFeatured: false,
    featuredRank: 6,
    createdAt: '2026-10-10T11:00:00Z',
    details: {
      material: {
        ar: '100% قطن تويل مصنفر متوسط الوزن (240 جم/م²)',
        en: '100% peached midweight cotton twill (240 GSM)',
      },
      fit: {
        ar: 'قصة كلاسيكية تسمح بارتدائه فوق تيشيرت',
        en: 'Classic overshirt cut with room for a base T-shirt',
      },
      care: {
        ar: 'غسيل آلي بارد (30 درجة). يُعلق ليجف.',
        en: 'Machine wash cold (30°C). Hang dry.',
      },
    },
  },

  {
    id: 'prod-men-05',
    slug: 'warm-cream-egyptian-cotton-oxford-shirt',
    audience: 'men',
    category: 'shirts',
    title: {
      ar: 'قميص أوكسفورد قطن مصري بلون كريمي دافئ',
      en: 'Warm Cream Egyptian Cotton Oxford Shirt',
    },
    shortDescription: {
      ar: 'قميص أوكسفورد كلاسيكي بياقة بأزرار، منسوج من القطن المصري طويل التيلة.',
      en: 'Timeless button-down collar Oxford shirt woven from breathable long-staple Egyptian cotton.',
    },
    description: {
      ar: 'قميص أوكسفورد رجالي يجمع بين النعومة والمتانة بفضل نسيج القطن المصري طويل التيلة القابل للتنفس. لونه الكريمي الطبيعي الدافئ يجعله سهل التنسيق مع البناطيل التشينو الزيتونية أو الفحمية في الشغل والمشاوير اليومية.',
      en: 'Woven in a breathable basketweave from 100% long-staple Egyptian cotton, this warm cream Oxford shirt softens with every wash while holding a clean button-down collar roll and comfortable regular fit.',
    },
    priceEgp: 620,
    colors: [CATALOG_COLORS.cream, CATALOG_COLORS.olive, CATALOG_COLORS.navy],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    variants: [
      { id: 'v-m05-cream-s', sku: 'LAB-M05-CRM-S', colorKey: 'cream', size: 'S', stock: 5 },
      { id: 'v-m05-cream-m', sku: 'LAB-M05-CRM-M', colorKey: 'cream', size: 'M', stock: 9 },
      { id: 'v-m05-cream-l', sku: 'LAB-M05-CRM-L', colorKey: 'cream', size: 'L', stock: 7 },
      { id: 'v-m05-cream-xl', sku: 'LAB-M05-CRM-XL', colorKey: 'cream', size: 'XL', stock: 4 },
      { id: 'v-m05-cream-xxl', sku: 'LAB-M05-CRM-XXL', colorKey: 'cream', size: 'XXL', stock: 2 },
      { id: 'v-m05-olive-s', sku: 'LAB-M05-OLV-S', colorKey: 'olive', size: 'S', stock: 3 },
      { id: 'v-m05-olive-m', sku: 'LAB-M05-OLV-M', colorKey: 'olive', size: 'M', stock: 6 },
      { id: 'v-m05-olive-l', sku: 'LAB-M05-OLV-L', colorKey: 'olive', size: 'L', stock: 5 },
      { id: 'v-m05-olive-xl', sku: 'LAB-M05-OLV-XL', colorKey: 'olive', size: 'XL', stock: 2 },
      { id: 'v-m05-olive-xxl', sku: 'LAB-M05-OLV-XXL', colorKey: 'olive', size: 'XXL', stock: 0 },
      { id: 'v-m05-navy-s', sku: 'LAB-M05-NVY-S', colorKey: 'navy', size: 'S', stock: 4 },
      { id: 'v-m05-navy-m', sku: 'LAB-M05-NVY-M', colorKey: 'navy', size: 'M', stock: 6 },
      { id: 'v-m05-navy-l', sku: 'LAB-M05-NVY-L', colorKey: 'navy', size: 'L', stock: 4 },
      { id: 'v-m05-navy-xl', sku: 'LAB-M05-NVY-XL', colorKey: 'navy', size: 'XL', stock: 3 },
      { id: 'v-m05-navy-xxl', sku: 'LAB-M05-NVY-XXL', colorKey: 'navy', size: 'XXL', stock: 2 },
    ],
    images: [
      {
        id: 'img-m05-1',
        url: '/products/men-cream-oxford-shirt.jpg',
        fallbackUrl: '/products/studio-shirt.svg',
        alt: {
          ar: 'قميص أوكسفورد رجالي بلون كريمي دافئ مطوي بعناية',
          en: "Folded men's warm cream Egyptian cotton Oxford button-down shirt",
        },
        isPrimary: true,
        colorKey: 'cream',
      },
      {
        id: 'img-m05-2',
        url: '/products/studio-shirt.svg',
        alt: {
          ar: 'تفاصيل الياقة والأزرار لقميص الأوكسفورد',
          en: 'Collar and button placket construction view',
        },
      },
    ],
    status: 'active',
    isNew: true,
    isFeatured: false,
    featuredRank: 7,
    createdAt: '2026-10-22T12:00:00Z',
    details: {
      material: {
        ar: '100% قطن مصري طويل التيلة بنسيج أوكسفورد متين',
        en: '100% long-staple Egyptian cotton Oxford weave',
      },
      fit: {
        ar: 'قصة منتظمة مريحة (Regular Fit) مع كسرة خلفية لحرية حركة الكتفين',
        en: 'Regular fit with center back box pleat for shoulder mobility',
      },
      care: {
        ar: 'غسيل آلي بماء دافئ (40 درجة). يُكوى بالبخار وهو رطب قليلاً.',
        en: 'Machine wash warm (40°C). Steam iron while slightly damp.',
      },
    },
  },

  {
    id: 'prod-men-06',
    slug: 'heavyweight-combed-cotton-pocket-tshirt',
    audience: 'men',
    category: 'tshirts',
    title: {
      ar: 'تيشيرت قطن ممشط ثقيل بجيب أمامي',
      en: 'Heavyweight Combed Cotton Pocket T-Shirt',
    },
    shortDescription: {
      ar: 'تيشيرت أساسي بوزن 220 جم/م² وياقة مضلعة متينة تحافظ على شكلها بعد الغسيل.',
      en: 'Substantial 220 GSM combed Egyptian cotton crewneck tee with a stitched patch chest pocket.',
    },
    description: {
      ar: 'صُنع هذا التيشيرت اليومي من خيوط القطن المصري الممشط بوزن 220 جم/م² فلا يشف ولا يفقد قوامه مع الاستخدام المتكرر. مزود بجيب صدر بغرز مزدوجة وشريط تقوية داخلي عند الرقبة والكتفين.',
      en: 'Built as the ultimate everyday foundation, our pocket T-shirt uses 220 GSM single-jersey Egyptian combed cotton for an opaque, structured drape. Features a double-stitched chest pocket and taped shoulder seams.',
    },
    priceEgp: 380,
    colors: [
      CATALOG_COLORS.charcoal,
      CATALOG_COLORS.olive,
      CATALOG_COLORS.terracotta,
      CATALOG_COLORS.cream,
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    variants: [
      { id: 'v-m06-char-s', sku: 'LAB-M06-CHR-S', colorKey: 'charcoal', size: 'S', stock: 8 },
      { id: 'v-m06-char-m', sku: 'LAB-M06-CHR-M', colorKey: 'charcoal', size: 'M', stock: 14 },
      { id: 'v-m06-char-l', sku: 'LAB-M06-CHR-L', colorKey: 'charcoal', size: 'L', stock: 12 },
      { id: 'v-m06-char-xl', sku: 'LAB-M06-CHR-XL', colorKey: 'charcoal', size: 'XL', stock: 6 },
      { id: 'v-m06-char-xxl', sku: 'LAB-M06-CHR-XXL', colorKey: 'charcoal', size: 'XXL', stock: 4 },
      { id: 'v-m06-olive-s', sku: 'LAB-M06-OLV-S', colorKey: 'olive', size: 'S', stock: 7 },
      { id: 'v-m06-olive-m', sku: 'LAB-M06-OLV-M', colorKey: 'olive', size: 'M', stock: 10 },
      { id: 'v-m06-olive-l', sku: 'LAB-M06-OLV-L', colorKey: 'olive', size: 'L', stock: 9 },
      { id: 'v-m06-olive-xl', sku: 'LAB-M06-OLV-XL', colorKey: 'olive', size: 'XL', stock: 5 },
      { id: 'v-m06-olive-xxl', sku: 'LAB-M06-OLV-XXL', colorKey: 'olive', size: 'XXL', stock: 2 },
      { id: 'v-m06-terra-s', sku: 'LAB-M06-TER-S', colorKey: 'terracotta', size: 'S', stock: 5 },
      { id: 'v-m06-terra-m', sku: 'LAB-M06-TER-M', colorKey: 'terracotta', size: 'M', stock: 8 },
      { id: 'v-m06-terra-l', sku: 'LAB-M06-TER-L', colorKey: 'terracotta', size: 'L', stock: 6 },
      { id: 'v-m06-terra-xl', sku: 'LAB-M06-TER-XL', colorKey: 'terracotta', size: 'XL', stock: 3 },
      { id: 'v-m06-terra-xxl', sku: 'LAB-M06-TER-XXL', colorKey: 'terracotta', size: 'XXL', stock: 0 },
      { id: 'v-m06-cream-s', sku: 'LAB-M06-CRM-S', colorKey: 'cream', size: 'S', stock: 6 },
      { id: 'v-m06-cream-m', sku: 'LAB-M06-CRM-M', colorKey: 'cream', size: 'M', stock: 9 },
      { id: 'v-m06-cream-l', sku: 'LAB-M06-CRM-L', colorKey: 'cream', size: 'L', stock: 7 },
      { id: 'v-m06-cream-xl', sku: 'LAB-M06-CRM-XL', colorKey: 'cream', size: 'XL', stock: 4 },
      { id: 'v-m06-cream-xxl', sku: 'LAB-M06-CRM-XXL', colorKey: 'cream', size: 'XXL', stock: 3 },
    ],
    images: [
      {
        id: 'img-m06-1',
        url: '/products/men-pocket-tshirt.jpg',
        fallbackUrl: '/products/studio-tshirt.svg',
        alt: {
          ar: 'تيشيرت رجالي قطن ثقيل بلون فحمي مع جيب صدر',
          en: "Men's charcoal heavyweight combed cotton pocket T-shirt",
        },
        isPrimary: true,
        colorKey: 'charcoal',
      },
      {
        id: 'img-m06-2',
        url: '/products/studio-tshirt.svg',
        alt: {
          ar: 'مخطط تفصيلي لخياطة الياقة المضلعة وجيب الصدر',
          en: 'Detail view of ribbed crew collar and stitched chest pocket',
        },
      },
    ],
    status: 'active',
    isNew: false,
    isFeatured: true,
    featuredRank: 5,
    createdAt: '2026-10-08T15:00:00Z',
    details: {
      material: {
        ar: '100% قطن مصري ممشط سينجل جيرسيه (220 جم/م²)',
        en: '100% combed Egyptian cotton single jersey (220 GSM)',
      },
      fit: {
        ar: 'قصة كلاسيكية مريحة (Classic Fit)',
        en: 'Classic everyday fit, true to size',
      },
      care: {
        ar: 'غسيل آلي بماء بارد (30 درجة). لا تستخدم المبيضات.',
        en: 'Machine wash cold (30°C). Do not bleach.',
      },
    },
  },

  {
    id: 'prod-men-07',
    slug: 'charcoal-relaxed-twill-cargo-trousers',
    audience: 'men',
    category: 'trousers',
    title: {
      ar: 'بنطلون كارجو تويل مريح بلون فحمي',
      en: 'Charcoal Relaxed Cotton Twill Cargo Trousers',
    },
    shortDescription: {
      ar: 'بنطلون كارجو عملي بستة جيوب ورباط خصر داخلي لراحة فائقة في الحركة.',
      en: 'Six-pocket utility cargo trousers in washed charcoal cotton twill with an internal drawcord waist.',
    },
    description: {
      ar: 'يقدم هذا البنطلون الكارجو تصميماً عصرياً أنيقاً بدون بروز مبالغ فيه للجيوب الجانبية. مصنوع من قماش التويل القطني المغسول لمنحه ملمساً ناعماً من اليوم الأول، مع خياطة مقواة عند نقاط الشد.',
      en: 'A clean, modern take on utility trousers featuring low-profile gusseted side cargo pockets, bar-tack seam reinforcements, and a comfortable waistband with belt loops plus an internal cotton drawcord.',
    },
    priceEgp: 820,
    colors: [CATALOG_COLORS.charcoal, CATALOG_COLORS.olive],
    sizes: ['S', 'M', 'L', 'XL'],
    variants: [
      { id: 'v-m07-char-s', sku: 'LAB-M07-CHR-S', colorKey: 'charcoal', size: 'S', stock: 3 },
      { id: 'v-m07-char-m', sku: 'LAB-M07-CHR-M', colorKey: 'charcoal', size: 'M', stock: 7 },
      { id: 'v-m07-char-l', sku: 'LAB-M07-CHR-L', colorKey: 'charcoal', size: 'L', stock: 6 },
      { id: 'v-m07-char-xl', sku: 'LAB-M07-CHR-XL', colorKey: 'charcoal', size: 'XL', stock: 4 },
      { id: 'v-m07-olive-s', sku: 'LAB-M07-OLV-S', colorKey: 'olive', size: 'S', stock: 2 },
      { id: 'v-m07-olive-m', sku: 'LAB-M07-OLV-M', colorKey: 'olive', size: 'M', stock: 5 },
      { id: 'v-m07-olive-l', sku: 'LAB-M07-OLV-L', colorKey: 'olive', size: 'L', stock: 4 },
      { id: 'v-m07-olive-xl', sku: 'LAB-M07-OLV-XL', colorKey: 'olive', size: 'XL', stock: 2 },
    ],
    images: [
      {
        id: 'img-m07-1',
        url: '/products/men-charcoal-cargos.jpg',
        fallbackUrl: '/products/studio-trousers.svg',
        alt: {
          ar: 'بنطلون كارجو رجالي تويل بلون فحمي بجيوب جانبية',
          en: "Men's charcoal cotton twill cargo trousers with side flap pockets",
        },
        isPrimary: true,
        colorKey: 'charcoal',
      },
      {
        id: 'img-m07-2',
        url: '/products/studio-trousers.svg',
        alt: {
          ar: 'تفاصيل الجيب الجانبي والخياطة المقواة للبنطلون الكارجو',
          en: 'Detail view of cargo pocket flap and reinforced seam stitching',
        },
      },
    ],
    status: 'active',
    isNew: false,
    isFeatured: false,
    featuredRank: 9,
    createdAt: '2026-10-05T10:00:00Z',
    details: {
      material: {
        ar: '100% قطن تويل مغسول بالإنزيمات لملمس ناعم (310 جم/م²)',
        en: '100% enzyme-washed cotton twill (310 GSM)',
      },
      fit: {
        ar: 'قصة مريحة واسعة قليلاً عند الفخذ وتضيق تدريجياً نحو الكاحل',
        en: 'Relaxed tapered utility fit',
      },
      care: {
        ar: 'غسيل آلي بماء بارد مع غلق الأزرار والسحاب.',
        en: 'Machine wash cold with buttons and zip fastened.',
      },
    },
  },

  {
    id: 'prod-men-08',
    slug: 'heritage-stitched-crewneck-sweatshirt',
    audience: 'men',
    category: 'sweatshirts',
    title: {
      ar: 'سويت شيرت قطن ميلتون بياقة دائرية وغرز بارزة',
      en: 'Heritage Stitched Cotton Crewneck Sweatshirt',
    },
    shortDescription: {
      ar: 'سويت شيرت قطن فرنش تيري مصري (330 جم/م²) بمثلث رقبة مضلع وغرز خياطة مسطحة بارزة.',
      en: '330 GSM Egyptian loopback French terry crewneck sweatshirt with ribbed V-insert and flatlock seams.',
    },
    description: {
      ar: 'سويت شيرت رجالي بياقة دائرية من قطن فرنش تيري مصري مسامي بوزن 330 جم/م². مصمم بمثلث قطني مضلع عند الرقبة وغرز خياطة مسطحة متينة على الأكتاف والأكمام تمنحك راحة وعملية في اللبس اليومي.',
      en: 'Crafted from 330 GSM Egyptian loopback French terry cotton for breathable, three-season comfort. Features a traditional ribbed V-notch at the collar, durable flatlock seam construction, and snug ribbed trims.',
    },
    priceEgp: 720,
    colors: [CATALOG_COLORS.sand, CATALOG_COLORS.terracotta],
    sizes: ['M', 'L', 'XL'],
    variants: [
      { id: 'v-m08-sand-m', sku: 'LAB-M08-SND-M', colorKey: 'sand', size: 'M', stock: 0 },
      { id: 'v-m08-sand-l', sku: 'LAB-M08-SND-L', colorKey: 'sand', size: 'L', stock: 0 },
      { id: 'v-m08-sand-xl', sku: 'LAB-M08-SND-XL', colorKey: 'sand', size: 'XL', stock: 0 },
      { id: 'v-m08-terra-m', sku: 'LAB-M08-TER-M', colorKey: 'terracotta', size: 'M', stock: 0 },
      { id: 'v-m08-terra-l', sku: 'LAB-M08-TER-L', colorKey: 'terracotta', size: 'L', stock: 0 },
      { id: 'v-m08-terra-xl', sku: 'LAB-M08-TER-XL', colorKey: 'terracotta', size: 'XL', stock: 0 },
    ],
    images: [
      {
        id: 'img-m08-1',
        url: '/products/men-sand-crewneck.jpg',
        fallbackUrl: '/products/studio-hoodie.svg',
        alt: {
          ar: 'سويت شيرت رجالي بلون بيج رملي بياقة دائرية وغرز بارزة',
          en: "Men's warm sand cotton fleece crewneck sweatshirt",
        },
        isPrimary: true,
        colorKey: 'sand',
      },
      {
        id: 'img-m08-2',
        url: '/products/studio-hoodie.svg',
        alt: {
          ar: 'مخطط تفصيلي لخياطة الرقبة والأكمام للسويت شيرت',
          en: 'Detail diagram of V-notch collar and flatlock sleeve seams',
        },
      },
    ],
    status: 'out_of_stock',
    isNew: false,
    isFeatured: false,
    featuredRank: 14,
    createdAt: '2026-10-01T09:00:00Z',
    details: {
      material: {
        ar: '100% قطن مصري فرنش تيري (330 جم/م²)',
        en: '100% Egyptian loopback French terry cotton (330 GSM)',
      },
      fit: {
        ar: 'قصة منتظمة مريحة (Regular Fit)',
        en: 'Regular fit with ribbed cuffs and waistband',
      },
      care: {
        ar: 'غسيل آلي بماء بارد. يُجفف على سطح مستوٍ.',
        en: 'Machine wash cold. Dry flat.',
      },
    },
  },

  // ===========================================================================
  // CHILDREN'S COLLECTION (6 PRODUCTS)
  // ===========================================================================
  {
    id: 'prod-kids-01',
    slug: 'kids-terracotta-canvas-overalls',
    audience: 'kids',
    category: 'trousers',
    title: {
      ar: 'سالوبيت أطفال قماش كانفاس تيراكوتا بغرز متقنة',
      en: "Kids' Terracotta Stitched Cotton Canvas Overalls",
    },
    shortDescription: {
      ar: 'سالوبيت أطفال عملي من قطن الكانفاس المغسول الناعم (270 جم/م²) بحمالات قابلة للتعديل.',
      en: 'Soft-washed 270 GSM cotton canvas overalls with extendable straps and a stitched bib pocket.',
    },
    description: {
      ar: 'سالوبيت أطفال مريح ومتين مصمم للعب والخروجات؛ منسوج من قطن الكانفاس المغسول الناعم على البشرة بلون التيراكوتا الدافئ. مزود بحمالات كتف قابلة للإطالة لتواكب نمو الطفل، وكباسين جانبية لسهولة اللبس، وجيب صدر مقسم بغرز خياطة مزدوجة.',
      en: 'Built for active play and easy movement, these kids’ overalls are cut from soft-washed 270 GSM cotton canvas. Detailed with extendable shoulder straps for growing children, side snap buttons, a divided bib pocket, and double-stitched seams.',
    },
    priceEgp: 580,
    previousPriceEgp: 650,
    colors: [CATALOG_COLORS.terracotta, CATALOG_COLORS.olive, CATALOG_COLORS.navy],
    sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-12Y'],
    variants: [
      { id: 'v-k01-terra-2y', sku: 'LAB-K01-TER-2Y', colorKey: 'terracotta', size: '2-3Y', stock: 6 },
      { id: 'v-k01-terra-4y', sku: 'LAB-K01-TER-4Y', colorKey: 'terracotta', size: '4-5Y', stock: 10 },
      { id: 'v-k01-terra-6y', sku: 'LAB-K01-TER-6Y', colorKey: 'terracotta', size: '6-7Y', stock: 8 },
      { id: 'v-k01-terra-8y', sku: 'LAB-K01-TER-8Y', colorKey: 'terracotta', size: '8-9Y', stock: 5 },
      { id: 'v-k01-terra-10y', sku: 'LAB-K01-TER-10Y', colorKey: 'terracotta', size: '10-12Y', stock: 3 },
      { id: 'v-k01-olive-2y', sku: 'LAB-K01-OLV-2Y', colorKey: 'olive', size: '2-3Y', stock: 4 },
      { id: 'v-k01-olive-4y', sku: 'LAB-K01-OLV-4Y', colorKey: 'olive', size: '4-5Y', stock: 7 },
      { id: 'v-k01-olive-6y', sku: 'LAB-K01-OLV-6Y', colorKey: 'olive', size: '6-7Y', stock: 6 },
      { id: 'v-k01-olive-8y', sku: 'LAB-K01-OLV-8Y', colorKey: 'olive', size: '8-9Y', stock: 0 },
      { id: 'v-k01-olive-10y', sku: 'LAB-K01-OLV-10Y', colorKey: 'olive', size: '10-12Y', stock: 2 },
      { id: 'v-k01-navy-2y', sku: 'LAB-K01-NVY-2Y', colorKey: 'navy', size: '2-3Y', stock: 3 },
      { id: 'v-k01-navy-4y', sku: 'LAB-K01-NVY-4Y', colorKey: 'navy', size: '4-5Y', stock: 5 },
      { id: 'v-k01-navy-6y', sku: 'LAB-K01-NVY-6Y', colorKey: 'navy', size: '6-7Y', stock: 4 },
      { id: 'v-k01-navy-8y', sku: 'LAB-K01-NVY-8Y', colorKey: 'navy', size: '8-9Y', stock: 4 },
      { id: 'v-k01-navy-10y', sku: 'LAB-K01-NVY-10Y', colorKey: 'navy', size: '10-12Y', stock: 2 },
    ],
    images: [
      {
        id: 'img-k01-1',
        url: '/products/kids-terracotta-overalls.jpg',
        fallbackUrl: '/products/studio-overalls.svg',
        alt: {
          ar: 'سالوبيت أطفال قماش كانفاس بلون التيراكوتا بحمالات وجيب أمامي',
          en: "Children's terracotta orange cotton canvas overalls with bib pocket and adjustable straps",
        },
        isPrimary: true,
        colorKey: 'terracotta',
      },
      {
        id: 'img-k01-2',
        url: '/products/studio-overalls.svg',
        alt: {
          ar: 'رسم تفصيلي لإبزيم الحمالات وجيب الصدر للسالوبيت',
          en: 'Detail illustration of child-safe strap hardware and stitched bib pocket',
        },
      },
    ],
    status: 'active',
    isNew: true,
    isFeatured: true,
    featuredRank: 4,
    createdAt: '2026-10-27T08:00:00Z',
    details: {
      material: {
        ar: '100% قطن كانفاس مغسول ناعم الملمس (270 جم/م²) لطيف على بشرة الأطفال',
        en: '100% soft-washed breathable cotton canvas (270 GSM)',
      },
      fit: {
        ar: 'قصة مريحة تسمح بارتداء تيشيرت أو بلوفر أسفل السالوبيت مع حمالات قابلة للإطالة',
        en: 'Roomy play-friendly fit with extendable shoulder straps and side snap buttons',
      },
      care: {
        ar: 'غسيل آلي بماء دافئ (40 درجة) مع قفل المشابك المعدنية.',
        en: 'Machine wash warm (40°C) with clasps fastened.',
      },
    },
  },

  {
    id: 'prod-kids-02',
    slug: 'kids-cozy-olive-terracotta-hoodie',
    audience: 'kids',
    category: 'sweatshirts',
    title: {
      ar: 'هودي أطفال قطن ناعم زيتوني بجيب تيراكوتا',
      en: "Kids' Cozy Olive & Terracotta Cotton Hoodie",
    },
    shortDescription: {
      ar: 'هودي أطفال قطن مصري مبطن ناعم (310 جم/م²) بياقة آمنة بدون أربطة وجيب تيراكوتا.',
      en: 'Soft-brushed 310 GSM Egyptian cotton fleece hoodie with a child-safe cord-free hood.',
    },
    description: {
      ar: 'هودي أطفال دافئ ومريح باللون الزيتوني المطفي مع جيب كانغرو بلون التيراكوتا. مصنوع من قطن مصري مبطن ناعم على البشرة، ومصمم بفتحة ياقة متقاطعة مرنة بدون أربطة لسلامة الطفل وسهولة اللبس والخلع.',
      en: 'Cut from soft-brushed 310 GSM Egyptian cotton fleece in muted olive with a contrast terracotta pouch pocket. Designed specifically for kids with a safe, cord-free crossover hood opening that slips on easily.',
    },
    priceEgp: 490,
    colors: [CATALOG_COLORS.olive, CATALOG_COLORS.terracotta],
    sizes: ['4-5Y', '6-7Y', '8-9Y', '10-12Y'],
    variants: [
      { id: 'v-k02-olive-4y', sku: 'LAB-K02-OLV-4Y', colorKey: 'olive', size: '4-5Y', stock: 8 },
      { id: 'v-k02-olive-6y', sku: 'LAB-K02-OLV-6Y', colorKey: 'olive', size: '6-7Y', stock: 10 },
      { id: 'v-k02-olive-8y', sku: 'LAB-K02-OLV-8Y', colorKey: 'olive', size: '8-9Y', stock: 7 },
      { id: 'v-k02-olive-10y', sku: 'LAB-K02-OLV-10Y', colorKey: 'olive', size: '10-12Y', stock: 5 },
      { id: 'v-k02-terra-4y', sku: 'LAB-K02-TER-4Y', colorKey: 'terracotta', size: '4-5Y', stock: 5 },
      { id: 'v-k02-terra-6y', sku: 'LAB-K02-TER-6Y', colorKey: 'terracotta', size: '6-7Y', stock: 6 },
      { id: 'v-k02-terra-8y', sku: 'LAB-K02-TER-8Y', colorKey: 'terracotta', size: '8-9Y', stock: 4 },
      { id: 'v-k02-terra-10y', sku: 'LAB-K02-TER-10Y', colorKey: 'terracotta', size: '10-12Y', stock: 0 },
    ],
    images: [
      {
        id: 'img-k02-1',
        url: '/products/men-olive-hoodie.jpg',
        fallbackUrl: '/products/studio-hoodie.svg',
        alt: {
          ar: 'هودي أطفال قطن ناعم باللون الزيتوني مع جيب أمامي تيراكوتا',
          en: "Children's muted olive cotton fleece hoodie with terracotta front pouch pocket",
        },
        isPrimary: true,
        colorKey: 'olive',
      },
      {
        id: 'img-k02-2',
        url: '/products/studio-hoodie.svg',
        alt: {
          ar: 'تفاصيل الياقة الآمنة بدون أربطة والجيب الأمامي لهودي الأطفال',
          en: 'Detail view of child-safe cordless hood collar and front kangaroo pocket',
        },
      },
    ],
    status: 'active',
    isNew: true,
    isFeatured: true,
    featuredRank: 8,
    createdAt: '2026-10-24T16:00:00Z',
    details: {
      material: {
        ar: '100% قطن مصري مبطن ناعم (310 جم/م²) خالٍ من المواد المهيجة للبشرة',
        en: '100% soft-brushed Egyptian cotton fleece (310 GSM)',
      },
      fit: {
        ar: 'قصة مريحة بياقة متقاطعة بدون أربطة لسلامة الأطفال',
        en: 'Easy pullover fit with cord-free safety hood',
      },
      care: {
        ar: 'غسيل آلي بماء بارد (30 درجة). يُكوى من الداخل على حرارة منخفضة.',
        en: 'Machine wash cold (30°C). Low iron inside out.',
      },
    },
  },

  {
    id: 'prod-kids-03',
    slug: 'kids-soft-egyptian-cotton-everyday-tshirt',
    audience: 'kids',
    category: 'tshirts',
    title: {
      ar: 'تيشيرت أطفال قطن مصري ناعم للاستخدام اليومي',
      en: "Kids' Soft Egyptian Cotton Everyday T-Shirt",
    },
    shortDescription: {
      ar: 'تيشيرت قطني فائق النعومة بتقليمات دافئة وياقة مرنة تسهل ارتداءه.',
      en: 'Breathable combed cotton crewneck tee with warm woven stripes and a tagless comfort neck.',
    },
    description: {
      ar: 'تيشيرت أطفال يومي مصمم ليتحمل الغسيل المتكرر والنشاط المستمر. مصنوع من القطن المصري الصافي مع طباعة مقاس داخلية بدون تيكت رقبة بارز لمنع أي احتكاك ببشرة الطفل.',
      en: 'Woven from yarn-dyed combed Egyptian cotton so colors stay vibrant wash after wash. Features a tag-free printed neck label for itch-free comfort and reinforced double-needle hems.',
    },
    priceEgp: 290,
    colors: [CATALOG_COLORS.cream, CATALOG_COLORS.terracotta, CATALOG_COLORS.olive],
    sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-12Y'],
    variants: [
      { id: 'v-k03-cream-2y', sku: 'LAB-K03-CRM-2Y', colorKey: 'cream', size: '2-3Y', stock: 10 },
      { id: 'v-k03-cream-4y', sku: 'LAB-K03-CRM-4Y', colorKey: 'cream', size: '4-5Y', stock: 12 },
      { id: 'v-k03-cream-6y', sku: 'LAB-K03-CRM-6Y', colorKey: 'cream', size: '6-7Y', stock: 9 },
      { id: 'v-k03-cream-8y', sku: 'LAB-K03-CRM-8Y', colorKey: 'cream', size: '8-9Y', stock: 8 },
      { id: 'v-k03-cream-10y', sku: 'LAB-K03-CRM-10Y', colorKey: 'cream', size: '10-12Y', stock: 6 },
      { id: 'v-k03-terra-2y', sku: 'LAB-K03-TER-2Y', colorKey: 'terracotta', size: '2-3Y', stock: 7 },
      { id: 'v-k03-terra-4y', sku: 'LAB-K03-TER-4Y', colorKey: 'terracotta', size: '4-5Y', stock: 8 },
      { id: 'v-k03-terra-6y', sku: 'LAB-K03-TER-6Y', colorKey: 'terracotta', size: '6-7Y', stock: 5 },
      { id: 'v-k03-terra-8y', sku: 'LAB-K03-TER-8Y', colorKey: 'terracotta', size: '8-9Y', stock: 4 },
      { id: 'v-k03-terra-10y', sku: 'LAB-K03-TER-10Y', colorKey: 'terracotta', size: '10-12Y', stock: 3 },
      { id: 'v-k03-olive-2y', sku: 'LAB-K03-OLV-2Y', colorKey: 'olive', size: '2-3Y', stock: 6 },
      { id: 'v-k03-olive-4y', sku: 'LAB-K03-OLV-4Y', colorKey: 'olive', size: '4-5Y', stock: 9 },
      { id: 'v-k03-olive-6y', sku: 'LAB-K03-OLV-6Y', colorKey: 'olive', size: '6-7Y', stock: 7 },
      { id: 'v-k03-olive-8y', sku: 'LAB-K03-OLV-8Y', colorKey: 'olive', size: '8-9Y', stock: 5 },
      { id: 'v-k03-olive-10y', sku: 'LAB-K03-OLV-10Y', colorKey: 'olive', size: '10-12Y', stock: 4 },
    ],
    images: [
      {
        id: 'img-k03-1',
        url: '/products/kids-everyday-tshirt.jpg',
        fallbackUrl: '/products/studio-tshirt.svg',
        alt: {
          ar: 'تيشيرت أطفال قطن مصري ناعم بلون كريمي وتقليمات تيراكوتا',
          en: "Children's warm cream and terracotta striped cotton crewneck T-shirt",
        },
        isPrimary: true,
        colorKey: 'cream',
      },
      {
        id: 'img-k03-2',
        url: '/products/studio-tshirt.svg',
        alt: {
          ar: 'تفاصيل الياقة القطنية المريحة لتيشيرت الأطفال',
          en: 'Detail view of tagless ribbed crew neck and sleeve stitch',
        },
      },
    ],
    status: 'active',
    isNew: false,
    isFeatured: false,
    featuredRank: 10,
    createdAt: '2026-10-14T10:00:00Z',
    details: {
      material: {
        ar: '100% قطن مصري ممشط ناعم (190 جم/م²)',
        en: '100% combed Egyptian cotton jersey (190 GSM)',
      },
      fit: {
        ar: 'قصة يومية مريحة تناسب الارتداء بمفرده أو تحت السالوبيت والجاكيت',
        en: 'Relaxed everyday fit ideal for layering under overalls or jackets',
      },
      care: {
        ar: 'غسيل آلي بماء دافئ (40 درجة).',
        en: 'Machine wash warm (40°C).',
      },
    },
  },

  {
    id: 'prod-kids-04',
    slug: 'kids-quilted-cotton-shirt-jacket',
    audience: 'kids',
    category: 'jackets',
    title: {
      ar: 'جاكيت قميصي مبطن خفيف للأطفال بأزرار آمنة',
      en: "Kids' Quilted Cotton Shirt-Jacket",
    },
    shortDescription: {
      ar: 'جاكيت خريفي/شتوي خفيف الوزن بتبطين قطني مريح وكباسين سهلة الفتح والإغلاق.',
      en: 'Lightweight diamond-quilted cotton overshirt jacket with easy snap-button closures.',
    },
    description: {
      ar: 'يمنح هذا الجاكيت القميصي طفلك الدفء المثالي في الصباح البارد دون إعاقة حركته. مبطن بطبقة قطنية ناعمة ومزود بكباسين ملساء يسهل على الطفل فتحها وإغلاقها بنفسه في المدرسة أو النادي.',
      en: 'Designed for crisp mornings and school outings, this quilted cotton shirt-jacket layers effortlessly over tees and hoodies. Features child-friendly press-stud buttons and deep patch hand-warmer pockets.',
    },
    priceEgp: 640,
    colors: [CATALOG_COLORS.olive, CATALOG_COLORS.charcoal],
    sizes: ['4-5Y', '6-7Y', '8-9Y', '10-12Y'],
    variants: [
      { id: 'v-k04-olive-4y', sku: 'LAB-K04-OLV-4Y', colorKey: 'olive', size: '4-5Y', stock: 5 },
      { id: 'v-k04-olive-6y', sku: 'LAB-K04-OLV-6Y', colorKey: 'olive', size: '6-7Y', stock: 7 },
      { id: 'v-k04-olive-8y', sku: 'LAB-K04-OLV-8Y', colorKey: 'olive', size: '8-9Y', stock: 6 },
      { id: 'v-k04-olive-10y', sku: 'LAB-K04-OLV-10Y', colorKey: 'olive', size: '10-12Y', stock: 4 },
      { id: 'v-k04-char-4y', sku: 'LAB-K04-CHR-4Y', colorKey: 'charcoal', size: '4-5Y', stock: 4 },
      { id: 'v-k04-char-6y', sku: 'LAB-K04-CHR-6Y', colorKey: 'charcoal', size: '6-7Y', stock: 5 },
      { id: 'v-k04-char-8y', sku: 'LAB-K04-CHR-8Y', colorKey: 'charcoal', size: '8-9Y', stock: 3 },
      { id: 'v-k04-char-10y', sku: 'LAB-K04-CHR-10Y', colorKey: 'charcoal', size: '10-12Y', stock: 2 },
    ],
    images: [
      {
        id: 'img-k04-1',
        url: '/products/kids-olive-jacket.jpg',
        fallbackUrl: '/products/studio-jacket.svg',
        alt: {
          ar: 'جاكيت قميصي مبطن للأطفال باللون الزيتوني مع جيوب أمامية',
          en: "Children's quilted muted olive cotton shirt-jacket with patch pockets",
        },
        isPrimary: true,
        colorKey: 'olive',
      },
      {
        id: 'img-k04-2',
        url: '/products/studio-jacket.svg',
        alt: {
          ar: 'مخطط تفصيلي للتبطين الماسي وجيوب جاكيت الأطفال',
          en: 'Detail view of diamond quilting stitch and snap closures',
        },
      },
    ],
    status: 'active',
    isNew: true,
    isFeatured: true,
    featuredRank: 6,
    createdAt: '2026-10-23T13:00:00Z',
    details: {
      material: {
        ar: 'طبقة خارجية وبطانة داخلية 100% قطن ناعم مع حشوة خفيفة مضادة للحساسية',
        en: '100% cotton poplin outer and jersey lining with lightweight hypoallergenic fill',
      },
      fit: {
        ar: 'قصة مريحة تسمح بارتداء هودي أو قميص أسفلها',
        en: 'Relaxed layering fit with curved shirt hem',
      },
      care: {
        ar: 'غسيل آلي لطيف بماء بارد (30 درجة).',
        en: 'Gentle machine wash cold (30°C).',
      },
    },
  },

  {
    id: 'prod-kids-05',
    slug: 'kids-reinforced-knee-twill-joggers',
    audience: 'kids',
    category: 'trousers',
    title: {
      ar: 'بنطلون جوجر أطفال قطن تويل بركب مقوّاة',
      en: "Kids' Reinforced Knee Cotton Twill Joggers",
    },
    shortDescription: {
      ar: 'بنطلون أطفال عملي بخصر مطاطي ناعم وطبقة تقوية إضافية عند الركبتين لتحمل اللعب.',
      en: 'Pull-on cotton twill joggers with an elastic drawstring waist and double-layered knee panels.',
    },
    description: {
      ar: 'لأن ملابس الأطفال تحتاج إلى متانة مضاعفة، صممنا هذا البنطلون بطبقة قماش مزدوجة ومخيطه بعناية عند الركبتين مع خصر مطاطي مريح وأساور كاحل ناعمة.',
      en: 'Engineered for active play, these pull-on joggers combine soft stretch cotton twill with stitched double-layer knee patches, deep side pockets, and a gentle ribbed elastic waistband.',
    },
    priceEgp: 440,
    previousPriceEgp: 510,
    colors: [CATALOG_COLORS.olive, CATALOG_COLORS.sand, CATALOG_COLORS.charcoal],
    sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-12Y'],
    variants: [
      { id: 'v-k05-olive-2y', sku: 'LAB-K05-OLV-2Y', colorKey: 'olive', size: '2-3Y', stock: 6 },
      { id: 'v-k05-olive-4y', sku: 'LAB-K05-OLV-4Y', colorKey: 'olive', size: '4-5Y', stock: 9 },
      { id: 'v-k05-olive-6y', sku: 'LAB-K05-OLV-6Y', colorKey: 'olive', size: '6-7Y', stock: 7 },
      { id: 'v-k05-olive-8y', sku: 'LAB-K05-OLV-8Y', colorKey: 'olive', size: '8-9Y', stock: 5 },
      { id: 'v-k05-olive-10y', sku: 'LAB-K05-OLV-10Y', colorKey: 'olive', size: '10-12Y', stock: 4 },
      { id: 'v-k05-sand-2y', sku: 'LAB-K05-SND-2Y', colorKey: 'sand', size: '2-3Y', stock: 5 },
      { id: 'v-k05-sand-4y', sku: 'LAB-K05-SND-4Y', colorKey: 'sand', size: '4-5Y', stock: 6 },
      { id: 'v-k05-sand-6y', sku: 'LAB-K05-SND-6Y', colorKey: 'sand', size: '6-7Y', stock: 4 },
      { id: 'v-k05-sand-8y', sku: 'LAB-K05-SND-8Y', colorKey: 'sand', size: '8-9Y', stock: 3 },
      { id: 'v-k05-sand-10y', sku: 'LAB-K05-SND-10Y', colorKey: 'sand', size: '10-12Y', stock: 0 },
      { id: 'v-k05-char-2y', sku: 'LAB-K05-CHR-2Y', colorKey: 'charcoal', size: '2-3Y', stock: 4 },
      { id: 'v-k05-char-4y', sku: 'LAB-K05-CHR-4Y', colorKey: 'charcoal', size: '4-5Y', stock: 6 },
      { id: 'v-k05-char-6y', sku: 'LAB-K05-CHR-6Y', colorKey: 'charcoal', size: '6-7Y', stock: 5 },
      { id: 'v-k05-char-8y', sku: 'LAB-K05-CHR-8Y', colorKey: 'charcoal', size: '8-9Y', stock: 4 },
      { id: 'v-k05-char-10y', sku: 'LAB-K05-CHR-10Y', colorKey: 'charcoal', size: '10-12Y', stock: 3 },
    ],
    images: [
      {
        id: 'img-k05-1',
        url: '/products/kids-twill-joggers.jpg',
        fallbackUrl: '/products/studio-trousers.svg',
        alt: {
          ar: 'بنطلون جوجر أطفال قطن تويل باللون الزيتوني بركب مقواة وخصر مطاطي',
          en: "Children's muted olive cotton twill joggers with reinforced knee panels",
        },
        isPrimary: true,
        colorKey: 'olive',
      },
      {
        id: 'img-k05-2',
        url: '/products/studio-trousers.svg',
        alt: {
          ar: 'تفاصيل خياطة الركبة المقواة والخصر المطاطي لبنطلون الأطفال',
          en: 'Detail view of reinforced knee stitching and elastic drawstring waist',
        },
      },
    ],
    status: 'active',
    isNew: false,
    isFeatured: false,
    featuredRank: 11,
    createdAt: '2026-10-16T09:00:00Z',
    details: {
      material: {
        ar: '97% قطن مصري تويل ناعم، 3% إيلاستين (260 جم/م²)',
        en: '97% soft Egyptian cotton twill, 3% elastane (260 GSM)',
      },
      fit: {
        ar: 'قصة مريحة سهلة الارتداء بخصر مطاطي كامل ورباط تعديل',
        en: 'Easy pull-on fit with full elastic waistband and functional drawcord',
      },
      care: {
        ar: 'غسيل آلي بماء دافئ (40 درجة).',
        en: 'Machine wash warm (40°C).',
      },
    },
  },

  {
    id: 'prod-kids-06',
    slug: 'kids-brushed-flannel-button-down-shirt',
    audience: 'kids',
    category: 'shirts',
    title: {
      ar: 'قميص أطفال فلانيل قطن ناعم بنقشة دافئة',
      en: "Kids' Brushed Flannel Checkered Shirt",
    },
    shortDescription: {
      ar: 'قميص قطن فلانيل مزدوج النعومة بألوان التيراكوتا والزيتوني والكريمي.',
      en: 'Double-brushed cotton flannel shirt woven in our signature terracotta, olive, and cream check.',
    },
    description: {
      ar: 'قميص أطفال خريفي وشتوي منسوج من خيوط الفلانيل القطنية المصبوغة قبل النسيج والمصنفرة من الوجهين لنعومة مضاعفة. يتميز بثبات ألوانه الدافئة، ويمكن ارتداؤه مغلقاً أو مفتوحاً فوق تيشيرت قطني.',
      en: 'Woven from yarn-dyed, double-brushed 200 GSM cotton flannel for lasting color and cozy softness inside and out. Easy to wear buttoned up or layered open over an everyday cotton tee.',
    },
    priceEgp: 420,
    colors: [CATALOG_COLORS.terracotta, CATALOG_COLORS.olive],
    sizes: ['4-5Y', '6-7Y', '8-9Y', '10-12Y'],
    variants: [
      { id: 'v-k06-terra-4y', sku: 'LAB-K06-TER-4Y', colorKey: 'terracotta', size: '4-5Y', stock: 6 },
      { id: 'v-k06-terra-6y', sku: 'LAB-K06-TER-6Y', colorKey: 'terracotta', size: '6-7Y', stock: 8 },
      { id: 'v-k06-terra-8y', sku: 'LAB-K06-TER-8Y', colorKey: 'terracotta', size: '8-9Y', stock: 5 },
      { id: 'v-k06-terra-10y', sku: 'LAB-K06-TER-10Y', colorKey: 'terracotta', size: '10-12Y', stock: 4 },
      { id: 'v-k06-olive-4y', sku: 'LAB-K06-OLV-4Y', colorKey: 'olive', size: '4-5Y', stock: 5 },
      { id: 'v-k06-olive-6y', sku: 'LAB-K06-OLV-6Y', colorKey: 'olive', size: '6-7Y', stock: 6 },
      { id: 'v-k06-olive-8y', sku: 'LAB-K06-OLV-8Y', colorKey: 'olive', size: '8-9Y', stock: 4 },
      { id: 'v-k06-olive-10y', sku: 'LAB-K06-OLV-10Y', colorKey: 'olive', size: '10-12Y', stock: 3 },
    ],
    images: [
      {
        id: 'img-k06-1',
        url: '/products/men-terracotta-overshirt.jpg',
        fallbackUrl: '/products/studio-shirt.svg',
        alt: {
          ar: 'قميص أطفال قطن فلانيل ناعم بألوان التيراكوتا والزيتوني',
          en: "Children's brushed cotton flannel button-down shirt in warm terracotta tones",
        },
        isPrimary: true,
        colorKey: 'terracotta',
      },
      {
        id: 'img-k06-2',
        url: '/products/studio-shirt.svg',
        alt: {
          ar: 'تفاصيل ياقة وجيب قميص الأطفال الفلانيل',
          en: 'Detail view of brushed flannel collar and chest pocket',
        },
      },
    ],
    status: 'active',
    isNew: false,
    isFeatured: false,
    featuredRank: 12,
    createdAt: '2026-10-18T11:30:00Z',
    details: {
      material: {
        ar: '100% قطن فلانيل مصنفر من الوجهين (200 جم/م²)',
        en: '100% double-brushed yarn-dyed cotton flannel (200 GSM)',
      },
      fit: {
        ar: 'قصة مريحة بأكمام قابلة للطي',
        en: 'Comfort fit with button cuffs and chest pocket',
      },
      care: {
        ar: 'غسيل آلي بماء بارد (30 درجة).',
        en: 'Machine wash cold (30°C).',
      },
    },
  },
];

// =============================================================================
// CATALOG HELPER & QUERY FUNCTIONS (SHARED STOREFRONT + ADMIN PERSISTENCE)
// =============================================================================

export const CATALOG_STORAGE_KEY = 'labsa_demo_catalog_v1';

export interface ApprovedLocalProductAsset {
  url: string;
  fallbackUrl: string;
  label: LocalizedText;
}

/**
 * Approved local product imagery in `public/products/`.
 * Admins can select only from these verified local assets; external URLs are disallowed.
 */
export const APPROVED_LOCAL_PRODUCT_IMAGES: readonly ApprovedLocalProductAsset[] =
  [
    {
      url: '/products/men-olive-chinos.jpg',
      fallbackUrl: '/products/studio-trousers.svg',
      label: {
        ar: 'بنطلون تشينو زيتوني رجالي (استوديو)',
        en: "Men's Olive Chino Trousers (Studio Flat-Lay)",
      },
    },
    {
      url: '/products/men-charcoal-blazer.jpg',
      fallbackUrl: '/products/studio-jacket.svg',
      label: {
        ar: 'بليزر كاجوال فحمي رجالي (استوديو)',
        en: "Men's Charcoal Tailored Blazer (Studio Flat-Lay)",
      },
    },
    {
      url: '/products/men-olive-hoodie.jpg',
      fallbackUrl: '/products/studio-hoodie.svg',
      label: {
        ar: 'هودي قطن ثقيل زيتوني رجالي (استوديو)',
        en: "Men's Olive Heavyweight Hoodie (Studio Flat-Lay)",
      },
    },
    {
      url: '/products/men-cream-oxford-shirt.jpg',
      fallbackUrl: '/products/studio-shirt.svg',
      label: {
        ar: 'قميص أوكسفورد قطن مصري كريمي (استوديو)',
        en: "Men's Warm Cream Oxford Shirt (Studio Flat-Lay)",
      },
    },
    {
      url: '/products/men-terracotta-overshirt.jpg',
      fallbackUrl: '/products/studio-shirt.svg',
      label: {
        ar: 'أوفرشيرت قطن تيراكوتا رجالي (استوديو)',
        en: "Men's Terracotta Overshirt (Studio Flat-Lay)",
      },
    },
    {
      url: '/products/men-charcoal-cargos.jpg',
      fallbackUrl: '/products/studio-trousers.svg',
      label: {
        ar: 'بنطلون كارجو فحمي رجالي (استوديو)',
        en: "Men's Charcoal Cargo Trousers (Studio Flat-Lay)",
      },
    },
    {
      url: '/products/men-pocket-tshirt.jpg',
      fallbackUrl: '/products/studio-tshirt.svg',
      label: {
        ar: 'تيشيرت قطن مصري بجيب صدر (استوديو)',
        en: "Men's Egyptian Cotton Pocket T-Shirt (Studio Flat-Lay)",
      },
    },
    {
      url: '/products/men-sand-crewneck.jpg',
      fallbackUrl: '/products/studio-hoodie.svg',
      label: {
        ar: 'سويت شيرت قطن رملي دافئ (استوديو)',
        en: "Men's Warm Sand Crewneck Sweatshirt (Studio Flat-Lay)",
      },
    },
    {
      url: '/products/kids-terracotta-overalls.jpg',
      fallbackUrl: '/products/studio-overalls.svg',
      label: {
        ar: 'سالوبيت أطفال كانفاس تيراكوتا (استوديو)',
        en: "Kids' Terracotta Canvas Overalls (Studio Flat-Lay)",
      },
    },
    {
      url: '/products/kids-olive-jacket.jpg',
      fallbackUrl: '/products/studio-jacket.svg',
      label: {
        ar: 'جاكيت أطفال مبطن زيتوني (استوديو)',
        en: "Kids' Olive Quilted Jacket (Studio Flat-Lay)",
      },
    },
    {
      url: '/products/kids-everyday-tshirt.jpg',
      fallbackUrl: '/products/studio-tshirt.svg',
      label: {
        ar: 'تيشيرت أطفال قطن مصري يومي (استوديو)',
        en: "Kids' Everyday Egyptian Cotton T-Shirt (Studio Flat-Lay)",
      },
    },
    {
      url: '/products/kids-twill-joggers.jpg',
      fallbackUrl: '/products/studio-trousers.svg',
      label: {
        ar: 'بنطلون جوجر أطفال قطن تويل (استوديو)',
        en: "Kids' Reinforced Twill Joggers (Studio Flat-Lay)",
      },
    },
    {
      url: '/products/studio-trousers.svg',
      fallbackUrl: '/products/studio-trousers.svg',
      label: {
        ar: 'رسم تفصيلي للخياطة — بناطيل (SVG)',
        en: 'Construction Detail — Trousers (SVG)',
      },
    },
    {
      url: '/products/studio-shirt.svg',
      fallbackUrl: '/products/studio-shirt.svg',
      label: {
        ar: 'رسم تفصيلي للخياطة — قمصان (SVG)',
        en: 'Construction Detail — Shirts (SVG)',
      },
    },
    {
      url: '/products/studio-tshirt.svg',
      fallbackUrl: '/products/studio-tshirt.svg',
      label: {
        ar: 'رسم تفصيلي للخياطة — تيشيرتات (SVG)',
        en: 'Construction Detail — T-Shirts (SVG)',
      },
    },
    {
      url: '/products/studio-hoodie.svg',
      fallbackUrl: '/products/studio-hoodie.svg',
      label: {
        ar: 'رسم تفصيلي للخياطة — هوديز وسويت شيرت (SVG)',
        en: 'Construction Detail — Hoodies & Sweatshirts (SVG)',
      },
    },
    {
      url: '/products/studio-jacket.svg',
      fallbackUrl: '/products/studio-jacket.svg',
      label: {
        ar: 'رسم تفصيلي للخياطة — جواكت وبليزرات (SVG)',
        en: 'Construction Detail — Jackets & Blazers (SVG)',
      },
    },
    {
      url: '/products/studio-overalls.svg',
      fallbackUrl: '/products/studio-overalls.svg',
      label: {
        ar: 'رسم تفصيلي للخياطة — سالوبيتات أطفال (SVG)',
        en: 'Construction Detail — Overalls (SVG)',
      },
    },
  ] as const;

export const APPROVED_PRODUCT_COLORS: readonly ProductColor[] = [
  {
    key: 'olive',
    name: { ar: 'زيتوني مطفي', en: 'Muted Olive' },
    hex: '#808060',
  },
  {
    key: 'terracotta',
    name: { ar: 'تيراكوتا دافئ', en: 'Terracotta Orange' },
    hex: '#C8784C',
  },
  {
    key: 'charcoal',
    name: { ar: 'فحمي داكن', en: 'Deep Charcoal' },
    hex: '#30302E',
  },
  {
    key: 'cream',
    name: { ar: 'كريمي قطني', en: 'Warm Cream' },
    hex: '#E9D7BF',
  },
  {
    key: 'sand',
    name: { ar: 'رملي دافئ', en: 'Warm Sand' },
    hex: '#D6C4A8',
  },
  {
    key: 'navy',
    name: { ar: 'كحلي كلاسيكي', en: 'Heritage Navy' },
    hex: '#2E3D4F',
  },
] as const;

export function isApprovedLocalImageUrl(url: string): boolean {
  return APPROVED_LOCAL_PRODUCT_IMAGES.some((asset) => asset.url === url);
}

/**
 * Returns all catalog products (including draft/archived products for Admin),
 * reading any saved admin catalog changes from localStorage when in browser.
 */
export function getAllCatalogProducts(): CatalogProduct[] {
  if (typeof window === 'undefined') {
    return DEMO_PRODUCTS;
  }
  try {
    const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return DEMO_PRODUCTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as CatalogProduct[];
    }
    return DEMO_PRODUCTS;
  } catch {
    return DEMO_PRODUCTS;
  }
}

export function writeCatalogProducts(products: CatalogProduct[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(products));
    return true;
  } catch {
    return false;
  }
}

export function getAllVisibleProducts(): CatalogProduct[] {
  return getAllCatalogProducts().filter((p) => p.status !== 'draft');
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return getAllCatalogProducts().find(
    (p) => p.slug === slug && p.status !== 'draft'
  );
}

export function getProductsByAudience(audience: Audience): CatalogProduct[] {
  return getAllVisibleProducts().filter((p) => p.audience === audience);
}

export function getProductTotalStock(product: CatalogProduct): number {
  return product.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
}

export function isProductInStock(product: CatalogProduct): boolean {
  return product.status === 'active' && getProductTotalStock(product) > 0;
}

export function getVariant(
  product: CatalogProduct,
  colorKey: string | null,
  size: string | null
): ProductVariant | undefined {
  if (!colorKey || !size) return undefined;
  return product.variants.find(
    (v) => v.colorKey === colorKey && v.size === size
  );
}

export function getCategoryByKey(
  key: CategoryKey
): CategoryDefinition | undefined {
  return CATALOG_CATEGORIES.find((cat) => cat.key === key);
}

/**
 * Resolves a route slug (such as `/category/trousers` or Home page links like
 * `/category/men-trousers`, `/category/kids-overalls`, `/category/men-blazers`, etc.)
 * into a structured category & optional audience filter.
 */
export function resolveCategorySlug(slug: string): {
  category?: CategoryKey;
  audience?: Audience;
  title: LocalizedText;
  description: LocalizedText;
} | null {
  const direct = CATALOG_CATEGORIES.find((c) => c.slug === slug);
  if (direct) {
    return {
      category: direct.key,
      title: direct.name,
      description: direct.description,
    };
  }

  const aliasMap: Record<
    string,
    {
      category?: CategoryKey;
      audience?: Audience;
      title: LocalizedText;
      description: LocalizedText;
    }
  > = {
    'men-trousers': {
      category: 'trousers',
      audience: 'men',
      title: { ar: 'بناطيل وتشينو رجالي', en: "Men's Trousers & Chinos" },
      description: {
        ar: 'تشكيلة البناطيل الرجالي التشينو والكارجو بتفاصيل خياطة متينة.',
        en: "Tailored men's chino and utility cargo trousers in Egyptian cotton twill.",
      },
    },
    'kids-overalls': {
      category: 'trousers',
      audience: 'kids',
      title: {
        ar: 'سالوبيتات وبناطيل أطفال',
        en: "Children's Overalls & Trousers",
      },
      description: {
        ar: 'سالوبيتات كانفاس وبناطيل جوجر مريحة ومقواة للأطفال.',
        en: "Durable cotton canvas overalls and reinforced knee joggers for active kids.",
      },
    },
    'men-blazers': {
      category: 'jackets',
      audience: 'men',
      title: {
        ar: 'بليزرات وجواكت رجالي',
        en: "Men's Blazers & Light Jackets",
      },
      description: {
        ar: 'بليزرات كاجوال مبطنة بتفاصيل ياقة وجيوب متقنة.',
        en: "Structured smart-casual blazers and light layering jackets for men.",
      },
    },
    'men-scarves-shirts': {
      category: 'shirts',
      audience: 'men',
      title: {
        ar: 'قمصان وأوفرشيرت رجالي',
        en: "Men's Shirts & Overshirts",
      },
      description: {
        ar: 'قمصان أوكسفورد قطن مصري وقمصان أوفرشيرت ثقيلة.',
        en: "Breathable Egyptian cotton Oxford shirts and brushed cotton overshirts.",
      },
    },
    'men-kids-hoodies': {
      category: 'sweatshirts',
      title: {
        ar: 'هوديز وسويت شيرت (رجالي وأطفال)',
        en: 'Cotton Hoodies & Sweatshirts (Men & Kids)',
      },
      description: {
        ar: 'هوديز وسويت شيرت من قطن الميلتون الثقيل للرجال والأطفال.',
        en: 'Heavyweight brushed cotton fleece hoodies and sweatshirts for men and children.',
      },
    },
    'kids-everyday': {
      audience: 'kids',
      title: {
        ar: 'ملابس أطفال يومية',
        en: "Kids' Everyday Essentials",
      },
      description: {
        ar: 'تشكيلة ملابس الأطفال اليومية من عمر سنتين حتى 12 سنة.',
        en: "Everyday cotton essentials for children aged 2 to 12 years.",
      },
    },
  };

  return aliasMap[slug] ?? null;
}

export function getRelatedProducts(
  product: CatalogProduct,
  limit = 4
): CatalogProduct[] {
  return getAllVisibleProducts()
    .filter((p) => p.id !== product.id && p.audience === product.audience)
    .sort((a, b) => {
      const sameCatA = a.category === product.category ? 0 : 1;
      const sameCatB = b.category === product.category ? 0 : 1;
      if (sameCatA !== sameCatB) return sameCatA - sameCatB;
      return a.featuredRank - b.featuredRank;
    })
    .slice(0, limit);
}

export function getLocalizedText(
  text: LocalizedText,
  locale: AppLocale | string
): string {
  return locale === 'ar' ? text.ar : text.en;
}
