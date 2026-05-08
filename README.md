# LandlordForge

LandlordForge is a mobile-first MVP for small landlords and solo contractors who need one lightweight place to track rent, jobs, tenants or clients, maintenance, invoices, expenses, and reports.

## Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS + shadcn-style local UI components
- Zustand state with LocalStorage persistence
- IndexedDB snapshot mirror for offline-first behavior
- Lucide icons
- Recharts for the Pro reports view
- PWA manifest + `public/sw.js` service worker stub

## Demo Credentials

- Email: `demo@landlordforge.com`
- Password: `demo123`

## Project Root

This whole folder is the app:

```text
C:\Users\SeanA\Documents\Codex\2026-04-24\you-are-an-elite-full-stack
```

That is the folder to upload to GitHub or import into Vercel.

## Run Locally

Standard Node setup:

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

In this Codex desktop environment, if `node` is flaky on PATH, use:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-dev.ps1
```

## Put It On GitHub

If Git is installed on your machine, run these commands from the project root:

```bash
git init
git add .
git commit -m "Initial LandlordForge MVP"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/landlordforge.git
git push -u origin main
```

If you do not want to use Git locally, you can also:

1. Create a new GitHub repo named `landlordforge`
2. Open this folder
3. Drag the project files into the GitHub web upload screen
4. Commit the upload on `main`

Do not upload `node_modules`, `.next`, `.logs`, `.tools`, or `.vercel`.

## Deploy To Vercel

The cleanest path is importing the GitHub repo into Vercel.

1. Go to [Vercel](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your `landlordforge` repo
4. Keep the framework as **Next.js**
5. Keep the root directory as the repo root
6. Deploy

This project does not need environment variables for the MVP.

Recommended project settings:

- Node.js version: `22.x`
- Install command: `pnpm install` or `npm install`
- Build command: `npm run build`
- Output setting: default Next.js

## Quick Share Flow

Once Vercel gives you a URL, send:

```text
Here’s the LandlordForge demo: https://your-url.vercel.app
Click Start Free or use demo@landlordforge.com / demo123
```

## Included MVP Features

- Public landing page with pricing teaser and demo CTA
- Demo auth with a Free to Pro upgrade path
- Dashboard stats, recent activity, mode switching, and theme toggle
- Unified Properties / Jobs workflow
- Tenants / Clients detail view with search and payment history
- Rent / Invoicing tracker with PDF preview stub
- Maintenance / Tasks board with push notification simulation
- Expense logging with monthly summary
- Pro-only reports with Recharts cashflow visualization
- PWA manifest and service worker stub

## Scripts

- `npm run dev` starts the app in development mode
- `npm run build` creates a production build
- `npm run start` runs the production server
- `npm run lint` runs the Next.js lint check
