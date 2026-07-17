# LandlordForge — Tenant Portal

**This branch (`TENANT`) is the dedicated, standalone Tenant Portal, running in full production mode.**

LandlordForge Tenant Portal is the renter side of LandlordForge: pay rent (Stripe card/ACH or manual record), track your lease and payment history, submit maintenance requests, message your landlord, and browse/apply for new homes. All data lives in a real **Supabase** (Postgres) backend with row-level security and real email/password accounts.

> The separate `LAND-LOARD` branch contains the matching landlord-only portal. **Both apps share one Supabase project** — a maintenance request submitted here appears in the landlord's queue instantly.

## Stack

- Next.js 15 App Router + TypeScript
- Supabase: Auth (email/password), Postgres with row-level security, Realtime sync
- Stripe Payment Element + webhook settlement (optional; manual-record mode without keys)
- Tailwind CSS + shadcn-style local UI components
- Zustand as the client-side data cache over the Supabase backend
- Lucide icons, PWA manifest

## Quick Start

Full walkthrough: **[SETUP.md](SETUP.md)**. Short version:

1. Create a free Supabase project (or reuse the one from the Landlord Portal) and run `supabase/migrations/001_landlordforge_schema.sql` in its SQL Editor — once per project, shared by both apps.
2. `cp .env.example .env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (same values as the Landlord Portal).
3. Install and run:

```bash
pnpm install
pnpm dev
```

4. Open `http://localhost:3000` and create your tenant account at `/signup`.

Until the env vars are present, protected pages show a setup notice instead of the app.

## How you get connected to your home

Two ways, both automatic:

- **Apply in-app**: browse vacant listings at `/browse` and apply. When the landlord approves, your lease, first rent charge, and a welcome message appear instantly.
- **Lease email match**: if your landlord already created your tenancy with your email address, signing up with that email links your account on the spot.

## Rent payments

- With Stripe configured, "Pay rent now" opens Stripe's secure Payment Element (card or US bank). Settlement is confirmed server-side by the `POST /api/stripe/webhook` route — idempotent and signature-verified.
- Without Stripe keys, payments run in **manual mode**: the payment is recorded with a receipt and your landlord is notified (for check/Zelle/cash arrangements).
- Late rent accrues a flat $50 fee after a 3-day grace period; totals are always computed server-side.

## Security

- Row-level security scopes every query: you can only see your own lease, payments, requests, and message threads.
- Card and bank details go straight to Stripe — they never touch LandlordForge servers.

## Build

```bash
pnpm build
pnpm start
```
