# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server (exposed on all interfaces via --host)
npm run build      # production build
npm run lint       # ESLint
npm run test       # run tests once (Vitest)
npm run test:watch # watch mode
```

## Stack

Vite + React 18 + TypeScript · shadcn/ui (Radix UI primitives) · Tailwind CSS · TanStack Query · React Router v6 · Supabase (auth, DB, storage) · Sonner (toasts) · Lucide React · Zod

Path alias: `@/` → `src/`

## Architecture

### Auth & Roles

`useAuth` (`src/hooks/useAuth.tsx`) is the single source of truth for session state. It reads `role` and `roles` columns from the `profiles` table and exposes them via context. The four roles are: `cliente`, `lojista`, `entregador`, `admin`.

`RequireRole` (`src/components/RequireRole.tsx`) is a route guard. It redirects unauthenticated users to the `redirectTo` prop and users missing the required role to the role's onboarding page (`LOGIN_BY_ROLE` map).

`AuthFlow` (`src/components/AuthFlow.tsx`) is the shared login/signup component used by all role-specific login pages. After login it checks roles and redirects: `admin` → `/admin/painel`, `lojista` with store → `/lojista/painel`, otherwise `finalPath`.

Session is stored in `sessionStorage` (not `localStorage`), so closing the browser clears it.

### Route Guards in App.tsx

```
Client  = RequireRole role="cliente"
Seller  = RequireRole role="lojista"
Courier = RequireRole role="entregador"
Admin   = desktop-only + RequireRole role=["admin","lojista"]
```

Admin routes are blocked on mobile (`useIsMobile()` → redirect to `/`).

### AppShell

`AppShell` (`src/components/AppShell.tsx`) infers the current profile from the URL prefix (`/admin`, `/lojista`, `/entregador`, `/cliente`) and renders the appropriate sidebar (desktop) and bottom nav (mobile). Auth/login routes (`/`, `/auth`, `/cliente`, `/lojista`, `/entregador`) render without the shell.

### Profile Data

User data beyond auth lives in the `profiles` table. Extra fields (store name, social links, verification state, etc.) are stored as JSON in `profiles.extras` (typed as `Record<string, string>`). The `verified` boolean column and `cnpj` column are top-level.

### Supabase Integration

Client: `src/integrations/supabase/client.ts`  
Types: `src/integrations/supabase/types.ts` (auto-generated — do not edit manually)  
Storage bucket for images: `avatars` (used by `ImagePicker`)

`ImagePicker` (`src/components/ImagePicker.tsx`) handles image upload to Supabase Storage. It accepts a `folder` prop that becomes a path prefix inside the `avatars` bucket.

### Styling Conventions

Custom Tailwind utilities defined in the project:
- `gradient-brand` — primary gradient
- `shadow-card`, `shadow-elevated`, `shadow-glow` — elevation scale
- `bg-success` / `text-success` — green semantic color
- `bg-warning` / `text-warning` — amber semantic color

Page layout pattern: `px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6`

### Toasts

Always use `toast` from `sonner` (imported as `import { toast } from "sonner"`).

### Admin Credentials (dev)

Default admin: `adm@gmail.com` / `202020`. Requires the user to exist in Supabase Auth and have `role = 'admin'` set in `profiles`.
