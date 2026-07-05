# Quotes — Integration Analysis & Implementation Plan

## Overview

**Zivelo Quotes** (`zivelo-quotes/`) is a production SaaS platform for creating, managing, and sharing interactive quote/proposal pages. It replaces static PDFs with branded, interactive web pages at unique URLs (`/q/{slug}`). The app is built with Next.js 16.2, Prisma + Supabase (PostgreSQL), and NextAuth v5.

**Zipform** (`zipform/`) is the internal Zivelo monorepo that consolidates all internal tools into a shared platform with auth, navigation, design system, and data abstractions. Quotes is one of the target apps to integrate.

The current placeholder at `apps/dashboard/app/quotes/page.tsx` renders an `EmptyModule` — this document defines the integration roadmap.

---

## Zivelo Quotes — Architecture Deep-Dive

### Data Model (Prisma)

A single `Quote` table stores everything via JSONB for flexibility:

```prisma
model Quote {
  id            String   @id @default(cuid())
  slug          String   @unique           // URL-safe identifier
  projectLabel  String                     // e.g. "Zivelo Studio — Desarrollo Web"
  title         String                     // e.g. "Plataforma E‑commerce — Fase 1"
  recipientName String
  summary       String                     // Executive summary (plain text)
  preparedBy    String                     // Defaults to "Zivelo"
  validUntil    String                     // Date string, e.g. "2025-08-15"
  status        String   @default("draft") // "draft" | "active"
  currency      String   @default("MXN")   // MXN | USD | EUR | COP | CLP | ARS | BRL
  phone         String                     // WhatsApp number for client actions
  branding      Json     @default("{}")    // { logoPath: string }
  items         Json     @default("[]")    // QuoteItem[]
  actions       Json     @default("{}")    // { approve, askQuestion, downloadPdf: boolean }
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### QuoteItem Shape (Zod)

```typescript
{
  title: string
  shortDescription: string
  description: string
  price: number
  bullets: string[]
  attachments: string[]
  links: string[]
}
```

### Quote Lifecycle

```
draft ──[publish]──→ active ──[expire]──→ expired (UI-only)
  ↑                     │
  └──[unpublish]────────┘
```

### Current Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| Language | TypeScript 5.7 |
| Database | PostgreSQL 15 (Supabase, shared instance) |
| ORM | Prisma 6.19 |
| Auth | NextAuth v5 (Credentials + Zoho OIDC, JWT sessions) |
| Forms | react-hook-form + Zod |
| UI | Tailwind CSS v4 + shadcn/ui (New York style) |
| PDF | jsPDF + jspdf-autotable (client-side) |
| OG Images | Next.js `ImageResponse` (Satori) |
| Animation | motion (framer-motion fork) |
| Testing | Vitest |

### Code Organization (Key Files)

```
zivelo-quotes/
├── lib/
│   ├── actions/quote.ts       # Server Actions: CRUD + publish/unpublish
│   ├── schemas/quote.ts       # Zod schemas (formSchema, itemSchema)
│   ├── demo-quote-data.ts     # Types: QuoteData, QuoteItem + helpers
│   ├── pdf/generate-quote-pdf.ts  # Client-side PDF generation
│   ├── prisma.ts              # Singleton Prisma client
│   └── auth/                  # AuthProvider (SessionProvider wrapper)
├── app/
│   ├── q/[quoteSlug]/         # Public quote viewer (Server Component)
│   └── dashboard/             # Dashboard: list, create, edit forms
├── components/
│   ├── quote/                 # QuoteHero, QuoteSummary, QuoteItemsList,
│   │                          # QuotePricing, QuoteActions, GeneratePdfButton
│   └── ui/                    # 58 shadcn primitives
└── prisma/schema.prisma       # Quote + User models
```

### Server Actions (`lib/actions/quote.ts`)

| Action | Returns |
|---|---|
| `createQuote(data)` | `{ success, slug }` |
| `getQuoteBySlug(slug)` | `FormValues \| null` |
| `updateQuote(slug, data)` | `{ success, slug }` |
| `listQuotes()` | `{ success, quotes: QuoteSummary[] }` |
| `publishQuote(slug)` | `{ success, slug }` |
| `unpublishQuote(slug)` | `{ success, slug }` |

Each action:
1. Checks auth (session from `next-auth`)
2. Parses input with Zod schema
3. Writes to Prisma
4. Calls `revalidatePath()` for cache invalidation

### Current Auth Model

- **Providers**: Credentials (email/scrypt password) + Zoho OIDC
- **Session**: JWT-based (no DB sessions)
- **Roles**: Owner > Manager > Editor > Viewer
- **Middleware**: Protects `/dashboard/*`, redirects unauthenticated → `/dashboard/login`
- **Password**: scrypt with 16-byte salt, `mustChangePassword` flag for first login

---

## Zipform Platform — Integration Surface

### Repository Structure (what already exists)

```
zipform/
├── apps/dashboard/
│   ├── app/quotes/page.tsx    ← Placeholder (EmptyModule)
│   └── app/quotes/README.md   ← This file
├── packages/
│   ├── types/src/index.ts     ← AppModule, UserProfile, TlozMission, etc.
│   ├── data/src/
│   │   ├── contracts.ts       ← ZipformDataClient interface
│   │   ├── drivers/
│   │   │   ├── mock.ts        ← Mock driver with seed data
│   │   │   └── prisma.ts      ← Prisma driver (SQLite)
│   │   └── seed-data.ts       ← Seed data
│   └── ui/src/
│       └── components/        ← shadcn-based design system
├── ROADMAP.md                 ← Quotes integration in NEXT column
└── pnpm-workspace.yaml
```

### Zipform Data Client Contract

```typescript
type ZipformDataClient = {
  apps: {
    list(): Promise<AppModule[]>;
    getById(id: string): Promise<AppModule | null>;
  };
  roadmap: {
    getSnapshot(): Promise<RoadmapSnapshot>;
  };
  user: {
    getCurrent(): Promise<UserProfile>;
  };
  platform: {
    getMetrics(): Promise<PlatformMetric[]>;
  };
  tloz: TlozRepository;  // Full CRUD for TLOZ missions
  // → quotes: QuoteRepository (to be added)
};
```

### Zipform Coding Conventions

1. **Server-first**: Server Components fetch data → Client Components render
2. **Package layer separation**: Types in `@zipform/types`, data in `@zipform/data`, UI in `@zipform/ui`
3. **Driver pattern**: `@zipform/data` exposes `createDataClient()` with `"mock"` or `"prisma"` driver
4. **shadcn-style components**: `forwardRef`, `cn()`, `cva()`, `displayName`
5. **kebab-case** filenames, **named exports** for components
6. **"use client"** only when hooks/browser APIs are needed
7. **CSS custom properties** in `tokens.css` + Tailwind utility classes
8. **String IDs** (no auto-increment integers)

### Existing Quotes Placeholder

`apps/dashboard/app/quotes/page.tsx` reads app metadata via `dataClient.apps.getById("quotes")` and renders an `EmptyModule` with the message *"Integración de Cotizaciones pendiente"*.

The sidebar (`app-shell.tsx`) already includes a "Cotizaciones" navigation item pointing to `/quotes`.

---

## Integration Phases

### Phase 0: Shared Types (`@zipform/types`)

Add Quote-related types to `packages/types/src/index.ts`:

```typescript
export type QuoteStatus = "draft" | "active" | "expired";
export type QuoteCurrency = "MXN" | "USD" | "EUR" | "COP" | "CLP" | "ARS" | "BRL";

export type QuoteItem = {
  title: string;
  shortDescription: string;
  description: string;
  price: number;
  bullets: string[];
};

export type QuoteActionsConfig = {
  approve: boolean;
  askQuestion: boolean;
  downloadPdf: boolean;
};

export type QuoteBranding = {
  logoPath: string;
};

export type Quote = {
  id: string;
  slug: string;
  projectLabel: string;
  title: string;
  recipientName: string;
  summary: string;
  preparedBy: string;
  validUntil: string;
  status: QuoteStatus;
  currency: QuoteCurrency;
  phone: string;
  branding: QuoteBranding;
  items: QuoteItem[];
  actions: QuoteActionsConfig;
  createdAt: string;
  updatedAt: string;
};

export type QuoteSummary = {
  id: string;
  slug: string;
  title: string;
  client: string;
  status: QuoteStatus;
  validUntil: string | null;
  total: number;
  currency: string;
  updatedAt: string;
};
```

### Phase 1: Data Repository (`@zipform/data`)

Add a `QuoteRepository` contract to `packages/data/src/contracts.ts`:

```typescript
export type QuoteRepository = {
  list(): Promise<QuoteSummary[]>;
  getBySlug(slug: string): Promise<Quote | null>;
  create(data: QuoteCreateInput): Promise<{ slug: string }>;
  update(slug: string, data: QuoteUpdateInput): Promise<{ slug: string }>;
  publish(slug: string): Promise<{ slug: string }>;
  unpublish(slug: string): Promise<{ slug: string }>;
};

// Extend ZipformDataClient
type ZipformDataClient = {
  // ... existing
  quotes: QuoteRepository;
};
```

Implement both drivers:
- **Mock driver**: In-memory array with seed quotes from `zivelo-quotes/prisma/seed.ts`
- **Prisma driver**: Uses the existing `Quote` table in Supabase PostgreSQL (add Prisma schema to `packages/data/prisma/`)

### Phase 2: Shared Auth (Prerequisite)

**The ROADMAP gates quotes integration behind shared internal authentication.** The current Zipform dashboard has no auth layer — all data is read from the mock driver. Quotes need auth because:

- The dashboard is a CMS (create, edit, publish, unpublish)
- Server Actions must verify the user's role
- Viewer role restricts write access

**Options:**
1. **Port NextAuth v5** from `zivelo-quotes` into the Zipform monorepo (recommended — it's already built and tested)
2. **Create a new auth package** `@zipform/auth` that wraps NextAuth v5, shared across all apps
3. **Phase approach**: Start without auth for read-only mock data, add auth before Server Actions go live

The `zivelo-quotes` auth setup that needs porting:
- `auth.ts` — NextAuth config with Credentials + Zoho OIDC
- `auth.config.ts` — Edge-safe config for middleware
- `middleware.ts` — Route protection
- `lib/auth/auth-context.tsx` — React context provider
- `app/api/auth/[...nextauth]/route.ts` — Route handler

### Phase 3: Quote Dashboard Pages

Build the following pages in `apps/dashboard/app/quotes/` using `@zipform/ui` components:

#### Route Structure

```
app/quotes/
├── page.tsx              ← List all quotes (table + card views)
├── new/page.tsx          ← Create quote form
├── [slug]/
│   ├── page.tsx          ← Quote detail / public viewer
│   └── edit/page.tsx     ← Edit quote form
```

#### Page: Quote List (`/quotes`)

Replace the current `EmptyModule` placeholder with:

- **Search bar** — filter by title, client, slug
- **Status filter** — All / Active / Draft / Expired
- **Responsive layout** — Table on desktop, cards on mobile (following the existing zivelo-quotes pattern)
- **Row actions** — View (external link), Edit (pencil), Publish/Unpublish toggle
- **Summary** — "Showing X of Y quotes" footer
- **Create button** — "Nueva cotización" link

Use `@zipform/ui` components: `Table`, `Badge`, `Button`, `Input`, `Select`, `PageHeader`, `StatusPill`, `EmptyState`.

#### Page: Create Quote (`/quotes/new`)

Complex multi-section form:

- **Basic Info** — Title, Project Label, Recipient Name, Prepared By, Valid Until
- **Status & Currency** — Draft/Active toggle, Currency select
- **Summary** — Textarea
- **Items** — Reorderable list with inline bullet editors, price per item, auto-calculated total
- **Branding** — Logo upload (path storage)
- **Actions** — Toggle switches for WhatsApp approve, WhatsApp ask question, PDF download
- **Slug** — Auto-generated from title, editable with validation (`/^[a-z0-9-]+$/`)

Use `@zipform/ui` with `react-hook-form` + Zod (these are not in the current Zipform monorepo — they need to be added to `apps/dashboard/package.json`).

#### Page: Public Quote Viewer (`/quotes/[slug]`)

A public-facing page that renders a quote for client viewing:

- **QuoteHero** — Project label, title, prepared-by, validity date, status badge
- **QuoteSummary** — Executive summary in bordered card
- **QuoteItemsList** — Accordion-style expandable items with description + bullets
- **QuotePricing** — Total price callout
- **QuoteActions** — WhatsApp approve link, WhatsApp question link, PDF download

This page does NOT need auth — it reads published quotes. Route it under a separate layout if needed (no sidebar, no auth guard).

Alternatively, keep the public viewer in `zivelo-quotes` at `/q/{slug}` and just redirect from the dashboard. This avoids replicating the public page.

### Phase 4: Server Actions

Add Server Actions to `apps/dashboard/app/quotes/actions.ts`:

```typescript
"use server";

// Replicate the zivelo-quotes actions but:
// 1. Use @zipform/data's QuoteRepository instead of direct Prisma calls
// 2. Use shared auth from @zipform/auth
// 3. Revalidate /quotes path
```

### Phase 5: PDF Generation

Port `lib/pdf/generate-quote-pdf.ts` from `zivelo-quotes` to the Zipform dashboard. This is a client-side utility using jsPDF + jspdf-autotable.

Install dependencies:
```
pnpm add jspdf jspdf-autotable --filter @zipform/dashboard
```

Create `apps/dashboard/lib/pdf/generate-quote-pdf.ts`.

### Phase 6: Shared Supabase Database Integration

The existing `Quote` table lives in a shared Supabase PostgreSQL instance. The Zipform Prisma driver needs to:

1. Either connect to the same Supabase instance (add `DATABASE_URL` to the dashboard's env)
2. Or replicate the Prisma schema in `packages/data/prisma/`

**Important**: The DB is shared with the standalone `zivelo-quotes` app. Both apps can coexist as long as they don't conflict on migrations. The safest approach is:
- `zivelo-quotes` remains the migration owner (it has the full history)
- Zipform reads from the same DB but uses Prisma's `unchecked` casts or the existing schema
- Or use a shared Prisma package (`@zipform/db-prisma`)

---

## Key Differences & Migration Notes

| Concern | Zivelo Quotes | Zipform Target | Notes |
|---|---|---|---|
| **Next.js** | 16.2.6 | 15.0.4 | Align versions or handle incompatibilities |
| **Tailwind** | v4 (`@tailwindcss/postcss`) | v3 (`tailwindcss`) | v4 has breaking changes in config |
| **PostgreSQL** | Supabase (shared) | SQLite (dev) / Supabase | Prisma provider change |
| **Auth** | NextAuth v5, Credentials + Zoho | None yet | Primary integration blocker |
| **Forms** | react-hook-form + Zod resolver | Not in monorepo | Required for create/edit |
| **PDF** | jsPDF + jspdf-autotable | Not in monorepo | Required for download feature |
| **OG Images** | Next.js `ImageResponse` | Not planned | Could be added later |
| **UI Kit** | Custom shadcn (New York, Tailwind v4) | `@zipform/ui` (Tailwind v3) | Components need restyling |
| **Locale** | Spanish (es-MX) | Spanish (es-MX) | Aligned, no changes needed |

---

## Component Mapping

### Zivelo Quotes → Zipform

| Zivelo Quotes Component | Zipform Equivalent | Notes |
|---|---|---|
| `components/ui/button` | `@zipform/ui/button` | Available |
| `components/ui/badge` | `@zipform/ui/badge` | Available |
| `components/ui/card` | `@zipform/ui/card` | Available |
| `components/ui/input` | `@zipform/ui/input` | Available |
| `components/ui/select` | `@zipform/ui/select` | Available |
| `components/ui/table` | `@zipform/ui/table` | Available |
| `components/ui/dialog` | `@zipform/ui/slide-over` | Different pattern — use slide-over |
| `components/ui/dropdown-menu` | `@zipform/ui/dropdown-menu` | Available |
| `components/ui/separator` | `@zipform/ui/separator` | Available |
| `components/ui/sonner` | `@zipform/ui/sonner` | Available (Toaster) |
| `components/ui/accordion` | `@zipform/ui/accordion` | Available |
| `components/ui/tooltip` | `@zipform/ui/tooltip` | Available (TooltipProvider) |
| `components/ui/form` (react-hook-form) | N/A | Needs to be added |
| `components/ui/alert-dialog` | `@zipform/ui/alert-dialog` | Available |
| `components/quote/QuoteHero` | New | Build in `apps/dashboard/components/quotes/` |
| `components/quote/QuoteSummary` | New | Build in `apps/dashboard/components/quotes/` |
| `components/quote/QuoteItemsList` | New | Build in `apps/dashboard/components/quotes/` |
| `components/quote/QuotePricing` | New | Build in `apps/dashboard/components/quotes/` |
| `components/quote/QuoteActions` | New | Build in `apps/dashboard/components/quotes/` |
| `components/quote/QuoteCreateForm` | New | Build in `apps/dashboard/components/quotes/` |

---

## Package Dependencies to Add

### `apps/dashboard/package.json`

```json
{
  "dependencies": {
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.24.0",
    "jspdf": "^4.2.0",
    "jspdf-autotable": "^5.0.7",
    "date-fns": "^4.1.0",
    "next-auth": "5.0.0-beta.31"
  }
}
```

---

## Files to Create in Zipform

```
apps/dashboard/
├── app/quotes/
│   ├── README.md                  ← This file
│   ├── page.tsx                   ← Quote list (replace placeholder)
│   ├── new/page.tsx               ← Create quote form
│   ├── [slug]/page.tsx            ← Quote detail / public viewer
│   └── [slug]/edit/page.tsx       ← Edit quote form
├── app/quotes/actions.ts          ← Server Actions
├── components/quotes/
│   ├── quote-hero.tsx
│   ├── quote-summary.tsx
│   ├── quote-items-list.tsx
│   ├── quote-pricing.tsx
│   ├── quote-actions.tsx
│   ├── quote-create-form.tsx
│   ├── quote-edit-form.tsx
│   ├── generate-pdf-button.tsx
│   └── index.ts
├── lib/pdf/
│   └── generate-quote-pdf.ts

packages/
├── types/src/index.ts             ← Add Quote types (see Phase 0)
└── data/src/
    ├── contracts.ts               ← Add QuoteRepository
    ├── drivers/mock.ts            ← Add mock quote driver
    ├── drivers/prisma.ts          ← Add Prisma quote driver
    └── seed-data.ts               ← Add seed quotes
```

---

## Files to Port (with modifications)

| Source (zivelo-quotes) | Target (zipform) | Modifications |
|---|---|---|
| `lib/actions/quote.ts` | `apps/dashboard/app/quotes/actions.ts` | Use `@zipform/data` instead of direct Prisma |
| `lib/schemas/quote.ts` | `apps/dashboard/lib/schemas/quote.ts` | Remove `"use server"`, keep Zod schemas |
| `lib/demo-quote-data.ts` | `apps/dashboard/lib/quotes/quote-data.ts` | Types live in `@zipform/types` now |
| `lib/pdf/generate-quote-pdf.ts` | `apps/dashboard/lib/pdf/generate-quote-pdf.ts` | Adapt imports, keep jsPDF logic |
| `lib/prisma.ts` | (handled by `@zipform/data`) | — |
| `auth.ts` + `auth.config.ts` + `middleware.ts` | New `@zipform/auth` package or directly in dashboard | Adapt for monorepo path aliases |
| `app/q/[quoteSlug]/page.tsx` | `apps/dashboard/app/quotes/[slug]/page.tsx` | Use Zipform layout, `@zipform/ui` components |
| `components/quote/*` | `apps/dashboard/components/quotes/*` | Replace `@/components/ui/*` → `@zipform/ui/*` |

---

## Tailwind Version Migration (v4 → v3)

Zivelo Quotes uses Tailwind v4. Zipform uses v3. When porting quote components, watch for these v4-only patterns:

- `@theme inline { ... }` → `@layer base { :root { ... } }` + `tailwind.config.ts`
- `rounded-2xl` → works in v3 (not new)
- `data-[state=open]:...` → works in v3
- No `@import "tailwindcss"` — use `@tailwind base/components/utilities` directives
- Custom colors defined via tokens.css custom properties + Tailwind config `colors` extension

---

## Auth Integration Strategy

The recommended approach:

### Step 1: Create `@zipform/auth` package

```
packages/auth/
├── src/
│   ├── index.ts
│   ├── auth.ts           ← NextAuth v5 config (ported from zivelo-quotes)
│   ├── auth.config.ts    ← Edge-safe config
│   ├── auth-context.tsx   ← React provider wrapping SessionProvider
│   └── middleware.ts      ← Route guard
├── package.json
└── tsconfig.json
```

### Step 2: Use in dashboard

```typescript
import { auth } from "@zipform/auth";

export default async function QuotesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  // ...
}
```

### Step 3: Sync role model

Zipform's `UserProfile` type has `role: string`. Map from the existing `Role` enum (`Owner | Manager | Editor | Viewer`) and enforce in Server Actions.

---

## Testing Strategy

Follow the TLOZ pattern:

1. **Unit tests**: Quote hydration logic, total calculation, Zod validation
2. **Mock driver tests**: Full CRUD on in-memory quotes
3. **Integration tests**: Server Actions (when auth is available)

Use Vitest (already in `@zipform/data`). Target >70% coverage.

---

## ROADMAP Alignment

From `ROADMAP.md`:

> **NEXT:**
> - [QUOTES] Prepare Quotes integration path for daily-use readiness
>   Depends on: Enable shared internal authentication

This means:
1. The types, data layer, and UI scaffolding can be built now (no auth dependency)
2. Server Actions and full CRUD depend on shared auth being implemented first
3. The public quote viewer can be server-rendered without auth (only reads `status: "active"`)

---

## Appendices

### A. Zivelo Quotes Environment Variables

```
DATABASE_URL=postgresql://...
ZOHO_CLIENT_ID=...
ZOHO_CLIENT_SECRET=...
AUTH_SECRET=...
OWNER_EMAILS=admin@zivelo.dev
NEXT_PUBLIC_BASE_URL=https://quotes.zivelo.dev
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

### B. RLS Policies (Supabase)

```sql
CREATE POLICY "anon_select_published" ON "Quote"
  FOR SELECT TO anon USING (status = 'active');

CREATE POLICY "auth_all" ON "Quote"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### C. Shared DB Note

The Supabase database is shared with another project. Use `prisma db execute` for schema changes, never `prisma db push`. Only touch the `Quote` and `User` tables.

### D. Current Nav Item Registration

The "Cotizaciones" sidebar link is already registered in `app-shell.tsx`:

```typescript
function getEnabledApps(): NavItem[] {
  return [
    { label: "Panel", href: "/", icon: Home },
    { label: "Cotizaciones", href: "/quotes", icon: FileText },  // ← already present
    { label: "TLOZ", href: "/tloz", icon: Sword },
  ];
}
```

The `AppModule` metadata is seeded in `packages/data/src/seed-data.ts`:

```typescript
{
  id: "quotes",
  name: "Cotizaciones",
  shortName: "Quotes",
  description: "Gestión de cotizaciones y propuestas interactivas",
  href: "/quotes",
  status: "external",
  versionTarget: "1.0",
  owner: "quotes"
}
```
