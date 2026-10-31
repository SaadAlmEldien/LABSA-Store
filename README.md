# LABSA | لَبسة — Egyptian Men's & Children's Clothing Store (Portfolio Demo)

https://labsa-store.vercel.app/en
> **لبسة تليق بيك | Crafted to Fit You**
>
> **Important Demo Notice**: **LABSA | لَبسة** is a fictional e-commerce portfolio project and is **not** a real operating commercial store. All products, inventory counts, customer orders, payment instructions, shipping updates, notifications, and contact details are simulated for demonstration purposes only. Do not enter real personal or financial data.

---

## 1. Project Name, Purpose & Maintainer

- **Project Name**: **LABSA | لَبسة** (`labsa-store`)
- **Author & Maintainer**: **Saad Alm Eldien**
- **Purpose**: A portfolio-grade, full-featured bilingual e-commerce storefront and administrative operations console built around the handcrafted **LABSA** garment-letter brand identity.
- **Target Market & Scope**:
  - **Product Scope**: Exclusively **Men's Clothing** and **Children's Clothing** (trousers, chinos, blazers, overshirts, hoodies, Oxford shirts, kids' overalls, joggers, and everyday sets).
  - **Geography & Currency**: Built specifically for the **Egyptian market** across all **27 Egyptian governorates**, with all product prices, coupon discounts, and delivery fees denominated in **Egyptian Pounds (`EGP` / `ج.م`)**.
  - **Bilingual Experience**: Arabic (`ar`, `dir="rtl"`) as the default primary language and English (`en`, `dir="ltr"`) as the secondary language, with instant locale switching that preserves the current route.

---

## 2. Main Implemented Features

### A. Storefront & Catalog Discovery
- **Brand-Led Home Page (`/[locale]`)**: Features the untouched official **LABSA** logo lockup on a pure `#FFFFFF` surface, department showcases for Men and Children, L-A-B-S-A garment-letter category discovery cards, featured product cards, and transparent 27-governorate shipping & demo payment reassurance.
- **Department & Category Collections (`/[locale]/men`, `/[locale]/kids`, `/[locale]/shop`, `/[locale]/category/[slug]`)**:
  - Bilingual search (matching product titles, descriptions, categories, colors, and SKUs in Arabic and English).
  - Multi-facet filtering by audience (`men` / `kids`), category, size, color swatch, price range in EGP, and in-stock availability.
  - Sorting by Featured, Newest, Price: Low to High, and Price: High to Low.
- **Product Detail Pages (`/[locale]/product/[slug]`)**:
  - Multi-angle product gallery with automatic fallback to local Atelier SVG garment cards if an image fails to load.
  - Color and size variant selector with real-time variant stock indicators (`In Stock`, `Low Stock`, `Out of Stock`) and SKU display.
  - Interactive **Men's & Children's Size Guide Modal** (also available as a standalone page at `/[locale]/size-guide`).
  - Moderated **Customer Ratings & Reviews** section showing average rating and 5-star breakdown strictly from approved reviews, plus a pending-moderation review submission form.
- **Browser-Local Wishlist (`/[locale]/wishlist`)**:
  - Accessible heart toggles on product cards and PDPs, header badge counter, and a dedicated wishlist page with variant selection to safely **Move to Cart** (or navigate to the PDP if a variant is not yet chosen).
- **Bilingual Information & Policy Pages**:
  - About & Fictional Contact (`/[locale]/about`)
  - Customer Hub (`/[locale]/account`)
  - Shipping & 27-Governorate Fee Schedule (`/[locale]/policies/shipping`)
  - Return & Exchange Policy (`/[locale]/policies/returns-exchanges`)
  - Privacy Notice (`/[locale]/policies/privacy`)
  - Terms & Conditions (`/[locale]/policies/terms`)

### B. Shopping Cart, Coupons, Checkout & Order Lookup
- **Shopping Cart (`/[locale]/cart`)**:
  - Variant-level line items (`productId + colorKey + size`), quantity controls capped at live variant stock, out-of-stock/exceeded-stock alerts, and an optional 27-governorate delivery fee estimator.
- **Discount Coupons (`LABSA10`, `CRAFT100`, `WINTER2025`)**:
  - Supports fixed EGP and percentage discounts, start/expiry dates, minimum eligible product subtotal, optional maximum EGP discount cap, and demo usage limits.
  - Enforces at most **one coupon per order**, **never discounts delivery fees**, **never exceeds the eligible product subtotal**, and re-validates authoritatively at order placement.
- **Egyptian Governorate Checkout (`/[locale]/checkout`)**:
  - Validates recipient name, Egyptian mobile number (`010`, `011`, `012`, `015` normalized to 11 digits), governorate selection across all **27 Egyptian governorates**, city/area, and street/building details.
  - Authoritative 3-tier governorate delivery pricing:
    - **EGP 50**: Cairo, Alexandria
    - **EGP 70**: Giza, Minya, and all 18 Delta, Canal, Coastal, Sinai & New Valley governorates
    - **EGP 90**: Assiut, Sohag, Qena, Luxor, Aswan
  - Three clearly labeled **Demo Payment Methods**:
    1. **Cash on Delivery (COD)** → initial payment status: `cod_pending`
    2. **InstaPay (Demo Manual Transfer)** → initial payment status: `awaiting_manual_verification`
    3. **Vodafone Cash (Demo Mobile Wallet)** → initial payment status: `awaiting_manual_verification`
- **Order Confirmation & Safe Order Lookup (`/[locale]/orders/confirmation/[orderNumber]`, `/[locale]/orders/track`)**:
  - Displays three independent lifecycle tracks (**Order Status**, **Payment Status**, **Shipment Status**), immutable item/coupon/shipping snapshots, manual courier tracking details, and scoped **In-App Demo Order Notifications** unlocked only via matching Order Reference + Egyptian Mobile Number.

### C. Admin Operations Console (`/[locale]/admin`)
- **Server-Enforced Admin Gate (`/api/admin/session`, `/api/admin/authorize`)**:
  - Protects admin access via `HttpOnly` HMAC-signed server sessions without exposing a public admin sign-up form or hardcoding credentials in client code.
- **Dynamic KPI Overview & Manual Payment Verification Queue**:
  - Computes KPI counts strictly from stored records (zero fabricated analytics) and surfaces orders in `awaiting_manual_verification`.
- **Manual Order, Payment & Shipment Operations**:
  - Search and filter orders by reference, mobile number, status tracks, and date range (kept in React state rather than URL query parameters to protect customer PII).
  - Confirmation step before saving status changes, with separate **Customer-Visible Notes** and **Private Internal Admin Notes** (never exposed on customer views).
- **Catalog, Inventory, Coupon & Review Moderation Management**:
  - Create/edit Men's and Children's products and adjust per-variant stock counts.
  - Create, edit, activate, deactivate, and archive discount coupons.
  - Filter `pending`, `approved`, and `rejected` product reviews, attach private moderation notes, and approve or reject customer submissions.

---

## 3. Approved Stack & Architectural Overview

- **Framework**: Next.js 15 (App Router) with React 19 and TypeScript (`strict: true`)
- **Styling & Design System**: Tailwind CSS 3 configured with **Palette B** tokens sampled from the supplied LABSA logo (`#FAF7F2` warm canvas, `#FFFFFF` pure white logo/card surface, `#F3ECE1` warm stone, `#E9D7BF` cream stitch border, `#30302E` charcoal ink, `#808060` muted olive, `#C8784C` terracotta)
- **Typography**: `Cairo` for Arabic (`dir="rtl"`) and `Plus Jakarta Sans` for English (`dir="ltr"`) via `next/font/google`
- **Localization**: `next-intl` with locale-prefixed routing (`/ar/...` default and `/en/...`) and dictionary files in `src/messages/ar.json` and `src/messages/en.json`
- **Data & Persistence Layer**:
  - Modular domain modules under `src/data/` (`catalog.ts`, `shipping.ts`, `payments.ts`, `orders.ts`, `coupons.ts`, `reviews.ts`, `notifications.ts`).
  - Runs out-of-the-box in browser-local demo persistence mode (`localStorage` overlays over pre-seeded TypeScript data) and includes the complete PostgreSQL relational schema and Row-Level Security (RLS) migration in `supabase/migrations/001_labsa_schema_and_rls.sql`.

---

## 4. Local Setup & Run Instructions

### Prerequisites
- **Node.js**: v18.18+ or v20+ recommended
- **Package Manager**: `npm` (uses `package-lock.json` at the project root)

### Commands
```bash
# 1. Install dependencies
npm install

# 2. (Optional) Copy .env.example to .env.local and configure private admin variables
cp .env.example .env.local

# 3. Start the local development server at http://localhost:3000
npm run dev

# 4. Run TypeScript type checking
npm run typecheck

# 5. Run ESLint
npm run lint

# 6. Build and run the production bundle locally
npm run build
npm run start
```

---

## 5. Environment Variables & `.env.example`

A safe template is provided in [`.env.example`](./.env.example) containing placeholder values only. Copy it to `.env.local` (which is git-ignored) to customize local behavior:

| Variable Name | Purpose | Required for Local Demo? |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Base URL (`http://localhost:3000` locally) | Optional (defaults to `localhost`) |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Default locale (`ar`) | Optional |
| `NEXT_PUBLIC_DEMO_MODE` | Keeps demo safeguard banners enabled (`true`) | Optional |
| `ADMIN_EMAIL` | Private administrator email verified on the server by `/api/admin/session` | Optional in local dev (see Section 8) |
| `ADMIN_PASSWORD` | Private administrator password verified via timing-safe server comparison | Optional in local dev (see Section 8) |
| `ADMIN_SESSION_SECRET` | Random secret (at least 32 characters) used to sign the `HttpOnly` admin session cookie | Optional in local dev; required in production |
| `ALLOW_LOCAL_DEMO_ADMIN` | Set to `"true"` to explicitly enable the passwordless local demo reviewer session | Optional (enabled automatically in local `NODE_ENV=development` when credentials are unset) |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional Supabase project URL | Optional |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional Supabase public anon key | Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service-role key (never expose to client) | Optional locally; required in production |
| `ORDER_LOOKUP_SECRET` | Dedicated server HMAC secret for customer order lookup (at least 32 characters and distinct from `ADMIN_SESSION_SECRET`) | Optional locally; required in production |
| `TRUSTED_PROXY_PROVIDER` | Trusted reverse proxy used to validate client IPs (`vercel` on Vercel) | Optional locally; required in production |
| `RATE_LIMIT_BACKEND` | Production rate limit store (`database` recommended; requires Supabase migrations) | Optional locally; set to `database` for Vercel |

---

## 6. Data Setup, Seed Data & Persistence Behavior

- **Zero-Config Local Demo Mode**: No external database is required to run or review the portfolio demo. On first visit, the application hydrates from rich bilingual seed data:
  - **12 Products & 72 Variants** (8 Men's garments, 4 Children's garments) in `src/data/catalog.ts`.
  - **27 Egyptian Governorates** with 3 delivery fee tiers (`50 / 70 / 90 EGP`) in `src/data/shipping.ts`.
  - **2 Pre-Seeded Sample Orders** (`LAB-2026-1001` with mobile `01000000001`, and `LAB-2026-1002` with mobile `01000000002`) in `src/data/orders.ts`.
  - **3 Pre-Seeded Demo Coupons** (`LABSA10`, `CRAFT100`, and expired `WINTER2025`) in `src/data/coupons.ts`.
  - **4 Pre-Seeded Demo Product Reviews** (3 approved sample reviews and 1 pending moderation review) in `src/data/reviews.ts`.
- **Browser-Local Persistence Keys**:
  - `labsa_demo_cart_v1` & `labsa_demo_cart_coupon_v1` (Cart items & active coupon code)
  - `labsa_demo_wishlist_v1` (Saved wishlist items, stored separately from cart)
  - `labsa_demo_orders_v1` & `labsa_demo_stock_deductions_v1` (Placed orders & variant stock deductions)
  - `labsa_demo_catalog_overrides_v1` (Admin product/stock edits)
  - `labsa_demo_coupons_v1` (Admin coupon edits & usage counts)
  - `labsa_demo_reviews_v1` (Submitted & moderated reviews)
- **Supabase PostgreSQL Schema**:
  - Production order, customer, and rate-limit persistence requires a Supabase project. Run the migrations in order: `001_labsa_schema_and_rls.sql`, `002_*`, then `003_*` from `supabase/migrations/` using the Supabase SQL Editor. The later migrations add the atomic order and shared rate-limit functions used by the app.

---

## 7. Configuring Admin Access Without Publishing Credentials

Admin authentication is enforced on the server via `/api/admin/session` and `/api/admin/authorize`:
1. **Configured Server Credentials Mode (Recommended for Hosted Previews)**:
   - Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` privately in `.env.local` (or hosting environment variables).
   - Visit `/ar/admin` or `/en/admin` and sign in with those credentials. The server verifies them using `crypto.timingSafeEqual` and issues an `HttpOnly` HMAC-signed cookie (`labsa_admin_session`).
2. **Local Portfolio Reviewer Mode (When `.env.local` Credentials Are Not Set)**:
   - When running locally in development (`NODE_ENV === 'development'`) or when `ALLOW_LOCAL_DEMO_ADMIN="true"` is set, `/[locale]/admin` displays a **Setup Required** notice explaining how to configure `.env.local`, alongside a one-click **Local Demo Reviewer Session** button that issues a server-signed demo session cookie without requiring a hardcoded password in the repository.

---

## 8. Simulated Demo Behaviors & Disconnected External Services

To keep the portfolio safe and self-contained, the following behaviors are **explicitly simulated**:
- **Payments**: Cash on Delivery (`cod`), InstaPay (`instapay`), and Vodafone Cash (`vodafone_cash`) are simulated. Wallet/InstaPay orders start in `awaiting_manual_verification` and display non-functional demo placeholder handles (`labsa.demo@instapay`, `0100-000-0000`). No live payment gateway is connected and no money is charged.
- **Shipment & Courier Tracking**: No live courier API (e.g., Bosta, Aramex, Mylerz) is connected. Administrators manually update shipment statuses (`packing` → `dispatched` → `in_transit` → `delivered`) and enter demo tracking references in `/[locale]/admin`.
- **Order Notifications**: No real Email, SMS, or WhatsApp messages are sent. Customer-visible notifications are generated in-app when order, payment, or shipment statuses change and are shown strictly inside the Order Confirmation and verified Order Lookup (`/orders/track`) views.
- **Demo Reviews**: Seeded reviews are visibly badged as **`Demo Sample Review / تقييم تجريبي للعرض`** and never claim to be verified purchases. Customer-submitted reviews default to `pending` moderation and only earn `Verified Delivered Purchase` when `lookupDemoOrderSafe` confirms a delivered order containing that product.

---

## 9. Brand & Visual Asset Inventory

- **Supplied Official LABSA Brand Assets (Preserved Untouched in `public/brand/`)**:
  - `public/brand/labsa-logo-reference.jpg` — Untouched original source reference image supplied by the project owner.
  - `public/brand/labsa-logo.png` — High-resolution cropped raster lockup on a pure `#FFFFFF` background.
  - `public/brand/labsa-logo.webp` — Web-optimized raster lockup used for primary storefront display with `.png` fallback.
  - Full usage rules are documented in [`BRAND_GUIDE.md`](./BRAND_GUIDE.md).
- **Demo Product Photography & Fallbacks (`public/products/`)**:
  - `public/products/*.jpg` (`men-olive-chinos.jpg`, `men-charcoal-blazer.jpg`, `men-olive-hoodie.jpg`, `men-cream-oxford-shirt.jpg`, `men-pocket-tshirt.jpg`, `men-charcoal-cargos.jpg`, `men-terracotta-overshirt.jpg`, `men-sand-crewneck.jpg`, `kids-terracotta-overalls.jpg`, `kids-olive-jacket.jpg`, `kids-everyday-tshirt.jpg`, `kids-twill-joggers.jpg`) are **AI-generated studio garment illustrations** created specifically for this portfolio demo.
  - `public/products/*.svg` (`men-trousers.svg`, `men-blazer.svg`, `men-hoodie.svg`, `men-shirt.svg`, `men-tee.svg`, `kids-overalls.svg`, `kids-hoodie.svg`, `kids-tee.svg`, `kids-pants.svg`) are local craft-stitched Atelier fallback illustrations.

---

## 10. Deployment Preparation Guidance (Vercel)

The app uses Next.js and its production build succeeds locally. This working folder is not currently connected to a Git repository, so Vercel Git import still requires creating a repository and pushing the project first. Do not commit `.env.local` or any secret values.

1. Create a Supabase project and run every SQL migration in `supabase/migrations/` in filename order (`001`, `002`, `003`).
2. Create a Git repository for this project, ensure `.env.local` stays untracked, and push it to the Git provider you choose.
3. Import that repository in Vercel. Use the detected **Next.js** framework settings; the build command is `npm run build` and the output directory is the default `.next`.
4. Add these variables in Vercel for **Production** and **Preview** as needed:
   - `NEXT_PUBLIC_SITE_URL` — the deployed site URL (set the production domain for Production).
   - `NEXT_PUBLIC_DEMO_MODE="true"` — retain portfolio/demo safeguards.
   - `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` — use the values from the Supabase project; the service-role key must remain server-only.
   - `ADMIN_EMAIL` and a strong unique `ADMIN_PASSWORD`.
   - `ADMIN_SESSION_SECRET` — a high-entropy secret of at least 32 characters.
   - `ORDER_LOOKUP_SECRET` — a separate high-entropy secret of at least 32 characters.
   - `TRUSTED_PROXY_PROVIDER="vercel"`.
   - `RATE_LIMIT_BACKEND="database"`.
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` if the public Supabase client features require them.
5. Deploy, then verify the storefront, administrator sign-in, order creation/lookup, and rate limiting from the deployed URL.

The current payment, shipping, and notification integrations are demo/manual flows. Vercel deployment makes the portfolio accessible; it does not by itself make the store ready to accept real commercial orders.

---

## 11. Before Using This as a Real Store

This codebase is a **portfolio demonstration** and must **not** be used for real commercial transactions without completing the following operational, technical, and legal steps:

1. **Real Business Identity & Contact Channels**:
   - Replace all fictional `DEMO ONLY` phone numbers (`+20 100 000 0000`), email addresses (`demo@labsa-store.example`), and studio addresses with registered commercial contact details, tax registration numbers, and customer support channels.
2. **Licensed Payment Provider & Webhook Verification**:
   - Replace the simulated manual InstaPay/Vodafone Cash placeholders with a licensed Egyptian payment gateway (e.g., Paymob, Fawry, Kashier) using server-verified webhook signatures, PCI-compliant hosted checkout fields, and automated reconciliation.
3. **Courier & Fulfillment Integration**:
   - Establish real commercial shipping contracts across Egyptian governorates, verify live delivery rates and SLAs, and integrate courier APIs/webhooks for automated waybill generation and live shipment tracking.
4. **Production Database, Authentication & Security Hardening**:
   - Move all client-side `localStorage` demo persistence to server-backed PostgreSQL transactions (using the provided Supabase schema/RLS foundation), enforce rate limiting on order creation, lookup, and review submission endpoints, and enable multi-factor authentication (MFA) for administrator accounts.
5. **Real Product Inventory, Sizing & Photography**:
   - Replace the fictional sample catalog, indicative centimeter size tables, and demo-generated garment images (`public/products/`) with real physical inventory SKUs, warehouse stock synchronization, and authentic photography of the actual garments being sold.
6. **Customer Data Privacy & Compliance**:
   - Implement formal data retention, encryption, and deletion workflows compliant with the **Egyptian Personal Data Protection Law (Law No. 151 of 2020)**.
7. **Qualified Egyptian Legal Review of Store Policies**:
   - Have qualified legal counsel review and finalize the Return & Exchange Policy (including the 14-day preference window, the 30-day defective-item store policy target, and any narrow hygiene exceptions), Shipping Policy, Privacy Notice, and Terms & Conditions to ensure full compliance with the **Egyptian Consumer Protection Law (Law No. 181 of 2018)** and executive regulations.
