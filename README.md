# LandlordForge

LandlordForge is a mobile-first Next.js 15 prototype for small landlords with a built-in tenant portal, persistent messaging center, maintenance flows, payment tracking, expenses, and Pro-only reports.

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
- Tenant rent payment and maintenance request actions
- Landlord properties, tenants, expenses, maintenance board, and reports
- Free vs Pro gating with upgrade dialog and floating upsell
- Offline-first persistence with PWA setup

## Project Root

This folder is the app root:

```text
C:\Users\SeanA\Documents\Codex\2026-04-24\you-are-an-elite-full-stack
```

## Create a Fresh Next.js App Yourself

If you want to recreate the shell from scratch first:

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

## GitHub

From the project root:

```bash
git init
git add .
git commit -m "LandlordForge role-based SaaS upgrade"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/landlordforge.git
git push -u origin main
```

## Deploy to Vercel

1. Push this folder to a GitHub repo named `landlordforge`
2. Go to [https://vercel.com/new](https://vercel.com/new)
3. Import the GitHub repo
4. Keep the detected framework as `Next.js`
5. Use the default project root
6. Deploy

Recommended settings:

- Node.js version: `22.x`
- Install command: `npm install`
- Build command: `npm run build`

No environment variables are required for this MVP.

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

