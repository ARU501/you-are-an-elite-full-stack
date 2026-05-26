# LandlordForge — Tenant Portal

**This branch (`TENANT`) is the dedicated, standalone Tenant Portal.**

LandlordForge Tenant Portal is a clean, production-quality demo experience for renters. Pay rent, track your lease and payments, submit maintenance requests, message your landlord, and browse/apply for new homes — all in one friendly interface that runs entirely in demo mode.

## Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS + shadcn-style local UI components
- Zustand for auth, product state, and persistence
- LocalStorage + IndexedDB snapshot mirror for offline-first behavior
- Lucide icons
- Recharts for Pro reports
- PWA manifest + `public/sw.js` service worker stub

## Demo Accounts

Landlord:

- Email: `landlord@demo.com`
- Password: `demo123`

Tenant:

- Email: `tenant@demo.com`
- Password: `demo123`

## Key MVP Features

- Public landing page with landlord and tenant entry paths
- Separate `/login/landlord` and `/login/tenant` demo logins
- Role-aware landlord and tenant dashboards
- Persistent in-app messaging center with unread badges
- Tenant rent payment portal with autopay preferences and payment history
- Landlord properties, tenants, payment ops, expenses, maintenance board, and reports
- Free vs Pro gating with upgrade dialog and floating upsell
- Offline-first persistence with PWA setup

## Project Root

```text
C:\Users\SeanA\Documents\Codex\2026-04-24\you-are-an-elite-full-stack
```

## Create a Fresh Next.js App Yourself

```bash
npm create next-app@latest landlordforge -- --ts --tailwind --app
cd landlordforge
```

Then copy this project structure into that folder.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

If your local shell has a flaky Node PATH in this Codex desktop environment, use:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-dev.ps1
```

## Build for Production

```bash
npm run build
npm run start
```

## Optional Stripe Environment Variables

Copy [.env.example](C:/Users/SeanA/Documents/Codex/2026-04-24/you-are-an-elite-full-stack/.env.example) to `.env.local` and set values when you want the API contract routes to talk to Stripe:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Without those keys, the payment portal stays in local demo mode and marks payments paid inside Zustand/localStorage only.

## Payment Processing Portal

Frontend components:

- [components/app/tenant-payments.tsx](C:/Users/SeanA/Documents/Codex/2026-04-24/you-are-an-elite-full-stack/components/app/tenant-payments.tsx)
- [components/app/landlord-dashboard.tsx](C:/Users/SeanA/Documents/Codex/2026-04-24/you-are-an-elite-full-stack/components/app/landlord-dashboard.tsx)
- [lib/payment-processing.ts](C:/Users/SeanA/Documents/Codex/2026-04-24/you-are-an-elite-full-stack/lib/payment-processing.ts)
- [lib/stripe.ts](C:/Users/SeanA/Documents/Codex/2026-04-24/you-are-an-elite-full-stack/lib/stripe.ts)

Backend routes:

- `POST /api/payments/create-intent`
- `POST /api/stripe/webhook`

### Production Schema

The exact starter schema is in [docs/payment-processing-schema.sql](C:/Users/SeanA/Documents/Codex/2026-04-24/you-are-an-elite-full-stack/docs/payment-processing-schema.sql):

```sql
create type payment_status as enum ('due', 'overdue', 'pending', 'paid', 'failed');
create type payment_method_type as enum ('ach', 'card');

create table tenant_payment_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  stripe_customer_id text not null unique,
  autopay_enabled boolean not null default false,
  autopay_method payment_method_type,
  saved_payment_label text,
  notification_channels text[] not null default array['email'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table rent_payments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id),
  tenant_id uuid not null references tenants(id),
  label text not null,
  base_amount_cents integer not null,
  late_fee_cents integer not null default 0,
  paid_amount_cents integer,
  due_date date not null,
  status payment_status not null default 'due',
  payment_method payment_method_type,
  stripe_payment_intent_id text unique,
  receipt_number text unique,
  failure_reason text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payment_events (
  id uuid primary key default gen_random_uuid(),
  rent_payment_id uuid references rent_payments(id),
  stripe_event_id text unique,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
```

Late fees are currently modeled as a flat `$50` fee after a `3` day grace period inside [lib/payment-processing.ts](C:/Users/SeanA/Documents/Codex/2026-04-24/you-are-an-elite-full-stack/lib/payment-processing.ts). In production, store this per property or lease and compute totals server-side.

### API Contracts

`POST /api/payments/create-intent`

- Creates a Stripe PaymentIntent when `STRIPE_SECRET_KEY` exists
- Falls back to local demo mode otherwise
- Accepts `paymentId`, `tenantId`, `amountCents`, `method`, and `autopay`

`POST /api/stripe/webhook`

- Reads the raw request body
- Verifies `stripe-signature` when `STRIPE_WEBHOOK_SECRET` exists
- Handles `payment_intent.succeeded`, `payment_intent.processing`, `payment_intent.payment_failed`, and refund/cancel paths as contract responses

### Security Notes

- Do not collect or store bank account numbers or card numbers in LandlordForge
- Use Stripe-hosted flows, Stripe Elements, or Financial Connections for real ACH/card collection
- Always calculate payment totals server-side from trusted lease and payment records
- Verify Stripe webhook signatures before mutating payment records
- Treat webhook handlers as idempotent by storing `stripe_event_id`
- Keep Stripe secret keys server-only; only publishable keys belong in the browser
- Send email or SMS notifications after confirmed backend processor events, not from browser-only local state

## GitHub

From the project root:

```bash
git init
git add .
git commit -m "LandlordForge payment processing portal"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/landlordforge.git
git push -u origin main
```

## Deploy to Vercel

1. Push this folder to GitHub
2. Go to [https://vercel.com/new](https://vercel.com/new)
3. Import the GitHub repo
4. Keep the detected framework as `Next.js`
5. Use the default project root
6. Deploy

Recommended settings:

- Node.js version: `22.x`
- Install command: `npm install`
- Build command: `npm run build`

## Share the Demo

Send people the deployed URL and say:

```text
Here is the LandlordForge demo: https://your-url.vercel.app
Use landlord@demo.com / demo123 or tenant@demo.com / demo123
```

## Scripts

- `npm run dev` - start development
- `npm run build` - production build
- `npm run start` - run the production server
- `npm run lint` - Next.js lint command
