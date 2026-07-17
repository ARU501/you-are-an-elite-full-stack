# LandlordForge — Landlord Portal

**This branch (`LAND-LOARD`) is the dedicated, standalone Landlord Portal, running in full production mode.**

LandlordForge is a complete landlord operating system: property management, rental application review, tenant oversight, maintenance handling, rent collection, financial reports, and in-app messaging. All data lives in a real **Supabase** (Postgres) backend with row-level security, real email/password accounts, live cross-app sync, and **Stripe**-powered rent collection.

> The separate `TENANT` branch contains the matching tenant-only portal. **Both apps share one Supabase project** — a tenant paying rent in the Tenant Portal shows up instantly in this app.

## Stack

- Next.js 15 App Router + TypeScript
- Supabase: Auth (email/password), Postgres with row-level security, Realtime sync
- Stripe Payment Intents + webhook settlement (optional; manual-record mode without keys)
- Tailwind CSS + shadcn-style local UI components
- Zustand as the client-side data cache over the Supabase backend
- Lucide icons, Recharts for Pro reports, PWA manifest

## Quick Start

Full walkthrough: **[SETUP.md](SETUP.md)**. Short version:

1. Create a free Supabase project and run `supabase/migrations/001_landlordforge_schema.sql` in its SQL Editor.
2. `cp .env.example .env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
3. Install and run:

```bash
pnpm install
pnpm dev
```

4. Open `http://localhost:3000`, create your landlord account at `/signup`, and add your first property.

Until the env vars are present, protected pages show a setup notice instead of the app.

## How the two portals connect

1. Landlord adds a property and sets its status to **Vacant** — it becomes a public listing.
2. A tenant (TENANT branch app) signs up, browses `/browse`, and applies.
3. Landlord approves under **Applications** → one atomic database function creates the tenancy, links the tenant's account, marks the property occupied, generates the first rent charge, and sends a welcome message.
4. Rent charges auto-generate monthly; late charges roll to overdue with a flat $50 fee after a 3-day grace period.
5. Messaging, maintenance requests, payments, and applications sync live between both apps via Supabase Realtime.

Tenants can also be linked without an application: create a tenancy whose `tenant_email` matches the email the tenant later signs up with.

## Payments

- `POST /api/payments/create-intent` — authenticated; validates the rent charge server-side (RLS-scoped) and computes the authoritative total. With `STRIPE_SECRET_KEY` set it creates a real Payment Intent; the Tenant Portal collects the card/bank details in Stripe's Payment Element.
- `POST /api/stripe/webhook` — signature-verified, idempotent by `stripe_event_id`; settles the payment in Postgres via the service-role client and notifies the landlord thread.
- Without Stripe keys: **manual mode** — payments are recorded (check/Zelle/cash) with receipts, no money moves.

## Security

- Every table has row-level security: landlords only see their own portfolio; tenants only their own tenancy, payments, requests, and messages.
- Payment totals are computed server-side; webhook mutations are idempotent and signature-verified.
- No card or bank numbers ever touch this app — collection is Stripe-hosted.
- The `SUPABASE_SERVICE_ROLE_KEY` is used only in server routes (webhook), never shipped to the browser.

## Free vs Pro

Free landlord accounts include 2 properties and 10 sent messages; the upgrade dialog flips the account tier (`profiles.tier`) — wire it to Stripe Checkout when you want paid upgrades.

## Build

```bash
pnpm build
pnpm start
```
