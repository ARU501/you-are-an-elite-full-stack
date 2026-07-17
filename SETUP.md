# LandlordForge Production Setup

Both apps — the **Landlord Portal** (`LAND-LOARD` branch) and the **Tenant Portal** (`TENANT` branch) — share **one Supabase project**. Set it up once, then point both apps at the same keys.

## 1. Create the Supabase project (one time)

1. Go to [supabase.com](https://supabase.com), sign in, and click **New project** (free tier is fine).
2. Pick any name (e.g. `landlordforge`), set a database password, and create the project.
3. When it finishes provisioning, open **SQL Editor** in the left sidebar.
4. Open the file `supabase/migrations/001_landlordforge_schema.sql` from this repo, paste the whole thing into the SQL editor, and click **Run**. You should see "Success. No rows returned".

This creates every table (profiles, properties, tenancies, rent payments, payment profiles, payment events, maintenance requests, expenses, messages, activities, rental applications), all row-level-security policies, the signup trigger, and the rent-charge generator.

## 2. Configure email confirmation (recommended for first run)

By default Supabase requires new users to confirm their email before they can sign in.

- For instant signups while testing: **Authentication → Sign In / Up → Email** and turn **off** "Confirm email".
- For production: leave it on — users get a confirmation email and then sign in.

## 3. Add the keys to the app

1. In Supabase: **Settings → API**. Copy the **Project URL** and the **anon public** key.
2. In the repo root, copy `.env.example` to `.env.local`.
3. Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # from the same page - keep secret, server only
```

4. Do the same in the **other branch's** checkout (same values — one shared backend).

## 4. Run it

```bash
pnpm install
pnpm dev
```

- Landlord Portal: create a landlord account at `/signup`, add properties, mark a unit **Vacant** to list it.
- Tenant Portal (TENANT branch, e.g. `pnpm dev --port 3001`): create a tenant account at `/signup`, browse vacant listings at `/browse`, and apply.
- Back in the Landlord Portal, approve the application under **Applications** — the tenancy, lease, welcome message, and first rent charge are created automatically, and both apps sync live.

> A tenant who signs up with the same email address as their lease (`tenant_email` on the tenancy) is linked automatically at signup — the application flow is not mandatory.

## 5. Stripe rent payments (optional)

Without Stripe keys, tenant payments run in **manual mode**: the payment is recorded, receipts are issued, and the landlord is notified — but no money moves.

To collect real card/ACH payments:

1. Create a [Stripe](https://stripe.com) account and grab your **test keys** from Developers → API keys.
2. Add to `.env.local` (both apps, but only the Tenant Portal collects):

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. Point a Stripe webhook at `POST /api/stripe/webhook` (locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`, which prints the `whsec_...` secret). Select the `payment_intent.*` and `charge.refunded` events.
4. The webhook settles payments in the database using the `SUPABASE_SERVICE_ROLE_KEY`, so that key is required for live payments.

Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

## 6. Deploy (optional)

Both branches deploy cleanly to Vercel:

1. Import the repo, pick the branch (`LAND-LOARD` or `TENANT`) per Vercel project.
2. Set the same environment variables in Project Settings → Environment Variables.
3. Update the Stripe webhook URL to the deployed domain.

## Troubleshooting

- **"Connect your backend to finish setup" screen** — `.env.local` is missing or the dev server wasn't restarted after adding it.
- **Sign-in works but the workspace is empty** — the SQL migration wasn't run; check the SQL Editor for errors.
- **Tenant can't see their home** — their tenancy's `tenant_email` doesn't match their signup email, and they haven't been approved through an application. Fix the email on the tenancy or have them apply to the listing.
- **Payments stay "pending" with Stripe** — the webhook isn't reaching the app or `SUPABASE_SERVICE_ROLE_KEY` is missing.
