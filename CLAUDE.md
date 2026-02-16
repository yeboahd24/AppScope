# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AppScope is a Gmail account security monitoring tool with a Free Tier product. Users sign in with Google, then the AppScope Chrome extension auto-scrapes their connected third-party apps from Google's permissions page and syncs them to the dashboard. Built with React 19 + Vite 7, plain JavaScript (no TypeScript), deployed to GitHub Pages.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build to `dist/`
- `npm run lint` — ESLint (flat config, ESLint 9+)
- `npm run preview` — Preview production build locally
- `npm run deploy` — Deploy to GitHub Pages via `gh-pages -d dist`

No test framework is configured.

## Architecture

### Web App (`src/`)

**Multi-component app** with the root in `src/App.jsx`. No routing library — navigation is handled via `useState` with manual page state.

**Components:**
- `src/App.jsx` — Root component: landing page, demo onboarding, demo dashboard, auth state management, navigation routing
- `src/GuidedScan.jsx` — 4-step guided scan wizard (manual fallback if extension not installed)
- `src/Dashboard.jsx` — Authenticated user's real dashboard (fetches from `user_apps` table)
- `src/RevokeGuide.jsx` — Step-by-step revoke instructions + deep link to Google permissions

**Shared modules:**
- `src/supabaseClient.js` — Supabase SDK client (`@supabase/supabase-js`) for auth + data
- `src/commonApps.js` — Static array of ~40 common apps with icons, permissions, risk levels, categories

**Page states for anonymous users:**
- `"landing"` — Marketing page with waitlist signup + "Sign In with Google" CTA
- `"onboarding"` — 3-step onboarding flow (demo)
- `"app"` — Demo security dashboard (uses mock data)

**Auth flow for signed-in users:**
- `authPage === "scan"` → `GuidedScan` component (first-time users)
- `authPage === "dashboard"` → `Dashboard` component (returning users with saved apps)

### Chrome Extension (`extension/` — planned)

Content script scrapes `myaccount.google.com/permissions` DOM to extract connected third-party apps, then syncs them to Supabase `user_apps` table via the user's auth token.

### Backend (Supabase)

**Tables:**
- `waitlist` — Email waitlist signups
- `user_apps` — User's connected apps (columns: `id`, `user_id`, `app_name`, `app_icon`, `permissions`, `risk_level`, `category`, `is_custom`, `is_revoked`, `revoked_at`, `created_at`). Row-level security: users can only CRUD their own rows.

**Auth:** Google OAuth via Supabase Auth. Redirect URI: `https://xfprwyojsobfvygqogrx.supabase.co/auth/v1/callback`

## Key Technical Details

- ES modules (`"type": "module"` in package.json)
- Vite base path is `/`
- Supabase URL and anon key are hard-coded in `src/supabaseClient.js`
- Google OAuth is functional via `supabase.auth.signInWithOAuth({ provider: "google" })`
- Entry point: `src/main.jsx` → `src/App.jsx`
- All inline styles — no CSS framework, no CSS modules. `index.css` has minimal global defaults.
- Mock data (`mockAccounts` in `App.jsx`) still used for the anonymous demo flow
- Risk scoring is 2-level: `"safe"` / `"risky"` (Free Tier limit)
- Free Tier: 1 Gmail account, no bulk revoke, no scan history, no alerts

## Important Conventions

- Always ask for permission before implementing changes
- Plain JavaScript only — no TypeScript
- Inline styles only — no CSS files per component
- Keep the anonymous demo flow working (mock data) alongside the real auth flow
