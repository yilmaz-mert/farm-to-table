# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Important:** This project runs Next.js 16. APIs, conventions, and file structure differ from older versions. Before writing routing, data-fetching, or middleware code, check `node_modules/next/dist/docs/` for the authoritative reference.

## Project

**Dalından Kapıya** — Premium farm-to-consumer organic cherry and sour cherry e-commerce platform (Turkish market). Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Supabase backend.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type-check without emitting
```

Copy `.env.example` to `.env.local` and fill in values before running. Required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER`.

## Architecture

### Route groups

Two parallel layouts under `src/app/`:

| Path | Layout | Purpose |
|---|---|---|
| `(shop)/` | `ShopNavbar` + `ShopFooter` | Public storefront — `/shop`, `/product/[slug]`, `/cart` |
| `(admin)/` | Sidebar shell, `robots: noindex` | Internal dashboard — `/dashboard` |
| `page.tsx` (root) | Imports Navbar/Footer directly | Marketing landing page — lives outside both groups |

The root `page.tsx` is not inside `(shop)` because both can't own `/` simultaneously — it imports the shared components directly instead.

### Root layout providers

`src/app/layout.tsx` wraps all pages with:
- **`LenisProvider`** (`src/components/shared/LenisProvider.tsx`) — initialises Lenis smooth scroll globally via a RAF loop. Cleans up on unmount.
- **`FloatingWhatsApp`** (`src/components/shared/FloatingWhatsApp.tsx`) — fixed bottom-right WhatsApp button. Reads cart from Zustand and formats a Turkish order message. Phone number from `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- **`CartDrawer`** (`src/components/shop/CartDrawer.tsx`) — slide-over right panel driven by `useUIStore`. Added here so it's available on every page (home and checkout).

### Supabase clients — use the right one per context

| File | Use when |
|---|---|
| `src/lib/supabase/client.ts` | Client Components (`'use client'`) |
| `src/lib/supabase/server.ts` → `createClient()` | Server Components, Route Handlers, Server Actions |
| `src/lib/supabase/server.ts` → `createServiceClient()` | Admin/privileged ops only — bypasses RLS |
| `src/lib/supabase/middleware.ts` → `updateSession()` | `middleware.ts` at the project root |

Types live in `src/lib/supabase/types.ts`. Regenerate after schema changes:
```bash
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```

### State stores

**UI store** (`src/store/ui.ts`) — ephemeral UI state (not persisted). Currently holds `cartDrawerOpen` + `openCartDrawer / closeCartDrawer / toggleCartDrawer`. The navbar cart button calls `toggleCartDrawer`; `CartDrawer` calls `closeCartDrawer`.

### State — Zustand cart store (`src/store/cart.ts`)

Persists to `localStorage` under key `dalindankapiya-cart`. Keyed by `variantId` — a product can have multiple weight/grade variants.

**10-minute reservation TTL:** When `addItem` is called and no reservation is active (or the previous one expired), `reservedAt` is stamped with `Date.now()`. Subsequent adds within the window do not reset the clock. `removeItem` clears `reservedAt` when the cart empties. `clearCart` always clears it.

Use the exported pure helpers:
```ts
import { cartItemCount, cartTotal, getReservationSecondsLeft, isReservationActive } from '@/store/cart'
```

Currency is always stored as **kuruş** (integer, 1 TRY = 100 kuruş). Use `formatPrice(kuruş)` from `src/lib/utils.ts` to display.

### Design system — Tailwind CSS v4

No `tailwind.config.ts`. Everything is in `src/app/globals.css`. Tailwind v4 uses CSS-first configuration via `@theme`.

**Three-layer token model:**

1. **Static palette** (`@theme { }`) — `cherry-*`, `verdigris-*`, `bark-*` scales. Fixed values; use with `dark:` modifier when needed.
2. **Semantic CSS variables** (`:root` / `.dark`) — `--bg`, `--fg`, `--brand`, `--accent`, etc. Dark mode activates by adding the `dark` class to `<html>`.
3. **Tailwind utility mapping** (`@theme inline { }`) — maps semantic vars to utilities: `bg-background`, `text-muted`, `text-primary`, `bg-accent`, `border-border`, etc.

**Colour intent:**
- `primary` / `primary-hover` — cherry wine; main brand/navigation actions
- `cta` / `cta-hover` — ripe cherry; conversion buttons and high-emphasis CTAs
- `accent` / `accent-hover` — verdigris (aged copper); the signature accent, use sparingly
- `cherry-wash` — blossom-tint background for pills, tags, highlight areas

**Typography:**
- `font-serif` → Cormorant Garamond (display headings; italic is the brand voice)
- `font-sans` → Plus Jakarta Sans (body copy, UI labels — the body default)
- `font-mono` → DM Mono (prices, weights, numeric data)

**Layout:** Use `.container-page` for any page-width section (max 1280 px, fluid side padding).

### Component map

| Component | Location | Notes |
|---|---|---|
| `Button` | `src/components/ui/button.tsx` | 6 variants, 4 sizes, `asChild` via Radix Slot |
| `Badge` | `src/components/ui/badge.tsx` | 5 variants |
| `ShopNavbar` | `src/components/shared/navbar.tsx` | `'use client'`, includes `ScarcityBar` as first child of sticky header |
| `ScarcityBar` | `src/components/shared/ScarcityBar.tsx` | `'use client'`, live countdown via `setInterval`; quota constants are hardcoded — replace with Supabase fetch |
| `ShopFooter` | `src/components/shared/footer.tsx` | Server Component |
| `LenisProvider` | `src/components/shared/LenisProvider.tsx` | `'use client'`, added to root layout |
| `FloatingWhatsApp` | `src/components/shared/FloatingWhatsApp.tsx` | `'use client'`, added to root layout; reads cart and opens `wa.me` link |
| `ShippingCalculator` | `src/components/shared/ShippingCalculator.tsx` | `'use client'`, city combobox → delivery tier card; data from `src/lib/shipping.ts` |
| `HeroSection` | `src/components/sections/HeroSection.tsx` | `'use client'`, Framer Motion staggered word reveals, verdigris bar |
| `StorySection` | `src/components/sections/StorySection.tsx` | `'use client'`, `useInView` scroll-triggered card reveals |
| `ProductsSection` | `src/components/sections/ProductsSection.tsx` | `'use client'`, `id="urunler"` anchor; package data + qty steppers + `addItem` wiring; blackout notice resolved client-side |
| `TransparencySection` | `src/components/sections/TransparencySection.tsx` | `'use client'`, hover/tap-reveal QR trace card; QR pattern is a hardcoded deterministic grid (never randomise — SSR hydration) |
| `GallerySection` | `src/components/sections/GallerySection.tsx` | `'use client'`, fixed `aspect-square` cards (zero CLS) + lightbox modal (Escape closes, scroll locked); gradient art is swap-ready for `next/image` |
| `CartDrawer` | `src/components/shop/CartDrawer.tsx` | `'use client'`, right-side slide-over; driven by `useUIStore.cartDrawerOpen`; TTL countdown + blackout notice in footer; "Güvenli Ödemeye Geç" calls `router.push('/checkout')` and closes drawer |
| `LegalModal` | `src/components/shop/LegalModal.tsx` | `'use client'`, full-content legal document overlay; receives `title` + `content` string as props; Escape/backdrop close |
| `OrderSuccessModal` | `src/components/shop/OrderSuccessModal.tsx` | `'use client'`, post-purchase screen; shows `orderNumber`, offers 1-click account creation via `supabase.auth.signUp` with the checkout email |

### Checkout flow (`src/app/(shop)/checkout/page.tsx`)

Guest checkout — no forced registration. Form: fullName, email, phone, address, city, postalCode. Client-side validation before `POST /api/checkout`. Legal checkboxes (MSS + Ön Bilgi + KVKK) must all be accepted; clicking the document links opens `LegalModal` with content generated on-the-fly by `legal/generator.ts`.

After submit:
- **Sandbox mode** (`isSandbox: true` in response): `clearCart()` + show `OrderSuccessModal` inline.
- **Production mode** (`checkoutFormContent` in response): inject Iyzico form HTML into the DOM (scripts executed via `document.createElement('script')`) → Iyzico hosts payment.

### Order creation (`src/app/api/checkout/route.ts`)

1. Validate payload (server-side).
2. Generate order number: `DK-YYYYMMDD-XXXX` (random 4-char suffix).
3. Insert into `orders` table via `createServiceClient()` (bypasses RLS).
4. Insert into `order_items` (product_id is nullable — guest items don't have Supabase product UUIDs).
5. Call `initializePayment()` from `lib/iyzico/client.ts`.
6. If Iyzico fails → update order status to `cancelled`, return 502.

**Iyzico identityNumber** is hardcoded as `"11111111111"` (test TC number) for guest checkout. Collect and validate in production.  
**callbackUrl** = `${NEXT_PUBLIC_SITE_URL}/api/checkout/callback` — implement this route to handle Iyzico's POST webhook and update order status.

### `.env.local` additional keys (Step 4)

```
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com   # or production URL
NEXT_PUBLIC_APP_URL=https://your-domain.com        # used for Iyzico callbackUrl
```

Leave `IYZICO_API_KEY` / `IYZICO_SECRET_KEY` as placeholders for sandbox fallback mode.

### Domain logic (`src/lib/`)

- **`shipping.ts`** — all 81 Turkish provinces grouped by region. Marmara + İç Anadolu = `next-day` tier; everything else `one-two-days`. `matchCity(query)` does Turkish-aware diacritic-insensitive search; `tierLabel(tier)` renders the Turkish label. `CITIES` is exported.
- **`harvest.ts`** — `getBlackoutInfo(now?)` implements the Weekend Blackout Rule: Friday ≥ 12:00 or Sat/Sun → order ships with Monday-morning harvest. Returns `{ active, notice }`. Time-dependent — call it inside `useEffect`, never during SSR render.
- **`legal/generator.ts`** — `generateMesafeliSatisSozlesmesi(ctx)` and `generateOnBilgilendirmeFormu(ctx)` generate Turkish legal documents as formatted strings. `PERISHABLE_NOTICE` is the food-law exemption clause (required by 6502 sayılı Kanun + Mesafeli Sözleşmeler Yönetmeliği). Call with a `LegalContext` built from checkout form + cart items.
- **`iyzico/client.ts`** — `initializePayment(request, clientIp)` calls Iyzico `/payment/initialize`. If `IYZICO_API_KEY` / `IYZICO_SECRET_KEY` are missing or placeholder, returns `{ isSandbox: true }` — checkout page then shows `OrderSuccessModal` without a real payment gateway. Auth uses HMAC-SHA256(secretKey, apiKey+random+secretKey+body) → `IYZICO {apiKey}:{base64hash}` header + `x-iyzi-rnd` header.
- **`iyzico/types.ts`** — TypeScript interfaces for `IyzicoPaymentInitRequest` / `IyzicoPaymentInitResponse`.

### Landing page flow (`src/app/page.tsx`)

One-page conversion sequence: Hero → Trust strip → **Products** (`#urunler`) → Shipping calculator → Story → Transparency → Gallery → Editorial CTA (links back to `#urunler`). Product package data lives in `PACKAGES` inside `ProductsSection.tsx` — move to Supabase when the products table is wired.

### Framer Motion conventions

- Use `useReducedMotion()` in any component that has entrance animations; skip or collapse transitions when it returns `true`.
- Set `initial={reduced ? false : { ... }}` to skip initial state entirely under reduced motion (avoids flash).
- Use `ease: [0.25, 0.46, 0.45, 0.94]` as the project-standard cubic bezier.
- `AnimatePresence` with `mode="wait"` for number tick-overs (see `Tick` in `ScarcityBar`).

### Utilities (`src/lib/utils.ts`)

- `cn(...classes)` — clsx + tailwind-merge
- `formatPrice(kuruş)` — formats to locale currency string (e.g. `₺1.234,56`)
- `formatWeight(grams)` — `"500 g"` / `"1.5 kg"`
- `slugify(text)` — Turkish-aware; maps `ğüşıöç` before ASCII-folding

### Iyzico callback & checkout success (Step 5)

**`src/app/api/checkout/callback/route.ts`** — Handles Iyzico's POST redirect after payment. Parses `token` + `conversationId` from body (supports JSON and `application/x-www-form-urlencoded`). Calls `retrievePayment(token, conversationId)`. If paid → updates order to `new_order` + `reserved_until: null`, redirects to `/checkout/success?order=ORDER_NUMBER`. If failed → updates to `cancelled`, redirects to `/checkout?payment=failed`.

**`src/app/(shop)/checkout/success/page.tsx`** — Server Component. Reads `searchParams.order` (Next.js 16 async searchParams pattern). Fetches order from Supabase by `order_number`. Shows success UI + order number. Renders `<SuccessAccountWidget email={...}>` (client component) for optional 1-click account creation.

**`src/app/(shop)/checkout/success/SuccessAccountWidget.tsx`** — `'use client'` component. Password input + `supabase.auth.signUp({ email, password })` call. Shows success or error state. Minimum 8-char password validation.

### PWA Admin Dashboard (Step 5)

**`public/manifest.json`** — PWA manifest for admin shell. `start_url: /admin`, `display: standalone`, `theme_color: #8B002D`. Icon paths at `/icons/icon-192.png` and `/icons/icon-512.png`.

**`middleware.ts`** (root) — Route protection. Unauthenticated requests to `/admin/**` (except `/admin/login`) redirect to `/admin/login?from=<path>`. Already-authenticated users visiting `/admin/login` are redirected to `/admin`. Uses `updateSession()` from `src/lib/supabase/middleware.ts`.

**Admin layout** (`src/app/(admin)/layout.tsx`) — Async Server Component. Verifies session via `supabase.auth.getUser()`, then checks `profiles.role === 'admin'`. Non-admin redirects to `/`. Wraps content in `<div className="dark">` for Night Harvest theme. Flex shell: sticky `AdminHeader` (h-14) + scrollable `<main className="min-h-0 flex-1 overflow-y-auto">` + fixed `AdminBottomNav` (h-16).

**Admin login** (`src/app/admin/login/page.tsx`) — Placed **outside** `(admin)` route group to avoid the auth-redirect loop. `useSearchParams()` must be inside a `<Suspense>` boundary (Next.js 16 requirement).

**Admin dashboard** (`src/app/(admin)/admin/page.tsx`) — Client component. Two sub-components:
- `QuotaController` — reads/writes `daily_harvest_logs` for today. Creates the log (quota: 50) if absent. Delta buttons `[-5,-1,+1,+5]` + reset. Progress bar.
- `PriceEditor` — reads/writes `products.total_price` + `products.price_per_kg`. Per-row save with loading/saved indicators.
- Stats cards: today's order count + revenue (excludes `cancelled`/`pending_payment`).

**Admin orders** (`src/app/(admin)/admin/orders/page.tsx`) — Client component. Kanban-style card list with filter chips per status. `NEXT_STATUS` and `NEXT_LABEL` records drive one-tap status progression. `handleStatusChange` uses two explicit branches (typed update objects) — `Record<string, string|null>` causes TypeScript error with Supabase v2. `DetailModal` is a bottom-sheet (Framer Motion `y: '100%'→0`) with tracking number + invoice URL inputs.

**`AdminHeader`** / **`AdminBottomNav`** — Client components in `src/app/(admin)/`. Header shows current page title (derived from `usePathname()`) + sign-out button. BottomNav links Dashboard + Siparişler, active state via pathname equality.

**Night Harvest dark theme** — Achieved by `<div className="dark">` in the admin layout. Tailwind v4's `@custom-variant dark (&:where(.dark, .dark *))` propagates dark CSS variables to all descendants. No `<html>` class change needed from a Server Component.

**Admin shell flex layout** — `h-dvh flex-col` on root, `shrink-0` on header and nav, `min-h-0 flex-1 overflow-y-auto` on main. `min-h-0` overrides the browser default `min-height: auto` which prevents flex children from shrinking below their content height.

**`iyzico/client.ts`** — Now also exports `retrievePayment(token, conversationId)` with the same sandbox fallback pattern as `initializePayment`. Endpoint: `POST /payment/initialize/retrieve`.

**`iyzico/types.ts`** — Added `IyzicoRetrieveResponse` interface with `status`, `paymentStatus`, `conversationId`, `paymentId`, `isSandbox` fields.
