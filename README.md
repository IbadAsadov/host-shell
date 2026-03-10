# host-shell

The shell. Runs on port 3000, owns the router, and is what users actually load in the browser. It doesn't contain any auth or dashboard logic — it just pulls those in from separate apps at runtime and handles the case where they fail to load.

---

## How it fits together

```
host-shell :3000
  /auth/*      → remote-auth :3001
  /dashboard/* → remote-dashboard :3002
```

The host loads each remote's `remoteEntry.js` at runtime via Module Federation. Neither remote is bundled into the host at build time. They can be deployed independently.

Shared libraries (React, React Router, Chakra UI, Zustand) are declared as singletons so the MF runtime negotiates one copy across all three apps. Two copies of React in the same browser tab is a bad time.

---

## Why MFE and not just a monorepo?

Honestly for this project size a monorepo with route-level code splitting would work fine. The MFE approach is deliberate — it forces a real separation boundary between auth and dashboard so they can be owned, tested, and deployed independently.

The practical wins:

- fix a login bug and redeploy only `remote-auth`, the dashboard doesn't move
- users on `/dashboard` never download auth code at all
- if `remote-auth` is down or throws a JS error, the dashboard still works

I used `@module-federation/enhanced` instead of `single-spa` because it integrates directly with Rspack, handles shared module negotiation natively, and doesn't require a separate runtime bootstrap library.

---

## How the host loads remotes

Every app in this project has an `index.ts` that just does:

```ts
import("./bootstrap");
```

That one dynamic import is not optional. It gives the MF runtime time to work out which shared modules are already loaded before any React component code runs. Without it you end up with two React instances in memory and confusing hook errors.

Remote URLs come from env vars:

```ts
remotes: {
  authApp:      `authApp@${REMOTE_AUTH_URL}/remoteEntry.js`,
  dashboardApp: `dashboardApp@${REMOTE_DASHBOARD_URL}/remoteEntry.js`,
}
```

Defaults to `localhost:3001` and `localhost:3002` in dev. Same build artifact works in staging or prod just by changing the env vars.

In `AppRouter.tsx` each remote is just a lazy import:

```tsx
const AuthRoutes = lazy(() => import("authApp/AuthRoutes"));
const DashboardRoutes = lazy(() => import("dashboardApp/DashboardRoutes"));
```

### RemoteBoundary

Every remote route is wrapped in `RemoteBoundary`. It combines a class-based `ErrorBoundary` (catches `ChunkLoadError` when a remote is unreachable) with a `Suspense` fallback (shows a spinner while the JS loads). If a remote fails the user sees an error card with the remote name, the error message, and Retry / Go Home buttons — not a white screen.

The `@mf-types/` folder has generated `.d.ts` declarations for remote modules so they're fully typed in the host without a shared package.

---

## Bundle strategy

```
runtime.js       ← MF module registry, runtimeChunk: "single" is required
vendor.forms.js  ← react-hook-form + zod, separate cache group so it survives deploys
vendor.common.js ← other node_modules used in 2+ places
main.js          ← app code
```

`runtimeChunk: "single"` is what Module Federation needs to track which shared modules are already in memory. Form libraries get their own cache group at priority 30 — they don't change often so they cache well separately from UI code that changes more frequently.

Run `bun run build:analyze` for an interactive chunk breakdown via RsDoctor.

---

## Testing

Vitest + jsdom + Testing Library. The main test worth calling out is `RemoteBoundary.test.tsx` — it covers the three states the component can be in:

- children render normally
- lazy import is still pending (spinner shows with the correct remote name)
- remote throws (error card with Retry and Go Home buttons)

Since `RemoteBoundary` is the resilience layer for the whole shell it made sense to cover it properly. `test-utils/render.tsx` wraps Testing Library's `render` with providers so tests don't need boilerplate setup.

```bash
bun run test
bun run test:coverage
```

---

## CSS and UI

Chakra UI v3. Worth noting that v3 dropped runtime style injection — everything resolves to CSS custom properties at init, no injection overhead in production.

Design tokens in `src/theme/tokens.ts`: brand blue palette, neutral greys, semantic colours, Sora for headings, Plus Jakarta Sans for body text. Component variants live in `recipes.ts` and get tree-shaken. No `.css` files anywhere, everything goes through Chakra props.

The host's `AppThemeProvider` is the outermost one. Remotes use the same Chakra singleton via MF — they don't mount a second provider.

---

## Forms

Minimal in the shell itself, the real form work is in `remote-auth`. Stack is React Hook Form + Zod with `@hookform/resolvers/zod`. Schemas live next to their types, types are derived with `z.infer` so schema and TypeScript interface can't drift apart. `onTouched` validation mode — first error shows on blur, re-validates on change after that.

---

## Risks

**Version drift.** Dependencies are pinned now but if teams start bumping them independently you can end up with remotes built against different Chakra or React minor versions. MF picks one at runtime and the other silently breaks. Keep a root lockfile or use Renovate.

**No auth guard in the shell.** Route protection lives inside the remotes. Nothing in the host stops an unauthenticated direct navigation to `/dashboard/settings`. A `ProtectedRoute` wrapper here would fix this for all remotes at once.

**Stale `@mf-types/` declarations.** These need regenerating when a remote changes its public interface. If they go stale TypeScript passes and the runtime breaks. Should be automated in CI.

**No E2E tests.** Component tests cover parts in isolation but nothing tests the full composition — actual remote loading, cross-remote navigation, boundary recovery in a real browser. A Playwright smoke test for the happy path would cover the most important gaps.

**All APIs are mocked.** Every store action is a `setTimeout`. When real endpoints get wired in, error paths (401s, timeouts, token refresh) will need to be built from scratch.

---

## Strengths

The bootstrap pattern (`index.ts` → `import("./bootstrap")`) is correctly done in all three apps. Small thing but many MFE setups skip it and end up with broken React context.

`RemoteBoundary` means the app degrades gracefully. A remote being down during a deploy doesn't affect other routes at all.

Env-var-driven remote URLs mean the same build artifact works across environments without a rebuild.

Type safety from `@mf-types/` is better than you'd expect — remote component props are fully typed and the compiler catches interface mismatches even across separate deployments.

---

## Weaknesses

All API calls are `setTimeout` mocks. The app has never made a real HTTP request. This is the biggest gap before production.

Theme config is copy-pasted across all three apps. A rebrand means three files to update with no enforcement they stay consistent.

Zustand stores are remote-scoped. The dashboard can't react to auth state changes. Log out and the dashboard keeps rendering until you navigate somewhere else.

No SSR. Client-rendered SPA only. Adding it later in a MFE context means dealing with streaming and hydration coordination across remotes, which is non-trivial.

---

## Project structure

```
src/
  index.ts              ← async MF bootstrap boundary
  bootstrap.tsx         ← mounts the React root
  App.tsx
  components/
    GlobalShell.tsx     ← nav layout
    NotFound.tsx
    RemoteBoundary.tsx  ← error + suspense wrapper for remotes
    __tests__/
  router/
    AppRouter.tsx       ← BrowserRouter + lazy remote routes
    routes.ts           ← typed route constants
  theme/
    tokens.ts
    recipes.ts
    AppThemeProvider.tsx
  declarations/
    remotes.d.ts
  @mf-types/            ← generated types for remote modules
```

---

## Commands

```bash
bun run dev              # :3000, hot reload
bun run build
bun run build:analyze    # RsDoctor bundle report
bun run preview          # serve dist/ on :3000
bun run test
bun run test:coverage
bun run type-check
bun run check:fix        # biome lint + format
```

---

## 1. Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (User)                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ navigates to /
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   host-shell  :3000                             │
│                                                                 │
│   BrowserRouter                                                 │
│   └── GlobalShell (Chakra Provider + nav layout)               │
│        ├── /auth/*  ──► RemoteBoundary(name="Auth")            │
│        │                └── lazy(() => authApp/AuthRoutes)      │
│        └── /dashboard/* ► RemoteBoundary(name="Dashboard")     │
│                           └── lazy(() => dashboardApp/          │
│                                         DashboardRoutes)        │
└────────────┬────────────────────────┬───────────────────────────┘
             │ remoteEntry.js         │ remoteEntry.js
             ▼                        ▼
┌─────────────────────┐  ┌───────────────────────────┐
│  remote-auth :3001  │  │  remote-dashboard  :3002  │
│                     │  │                           │
│  Exposes:           │  │  Exposes:                 │
│  • ./AuthRoutes     │  │  • ./DashboardRoutes       │
│                     │  │                           │
│  Modules:           │  │  Modules:                 │
│  • login            │  │  • overview               │
│  • register         │  │  • analytics              │
│  • forgot-password  │  │  • settings               │
│                     │  │  • layout (sidebar)       │
│  State: Zustand     │  │  State: Zustand           │
│  Forms: RHF + Zod   │  │                           │
└─────────────────────┘  └───────────────────────────┘

        Shared singletons (negotiated at runtime via Module Federation):
        react · react-dom · react-router-dom · @chakra-ui/react
        @emotion/react · @emotion/styled · zustand
```

### Port map

| App              | Dev port | Exposes             |
| ---------------- | -------- | ------------------- |
| host-shell       | 3000     | — (consumer only)   |
| remote-auth      | 3001     | `./AuthRoutes`      |
| remote-dashboard | 3002     | `./DashboardRoutes` |

---

## 2. Why Microfrontend?

| Concern                     | Monolith                            | This MFE approach                                                                   |
| --------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| **Team ownership**          | All teams share one deployment      | Auth and Dashboard teams own separate repos and CI pipelines                        |
| **Independent deployments** | Full rebuild on every change        | Each remote ships its own `remoteEntry.js` — hotfix auth without touching dashboard |
| **Bundle size**             | All code loaded upfront             | Remotes are lazy-loaded; users on `/dashboard` never parse auth code                |
| **Technology flexibility**  | Locked to one global version        | Shared libs negotiated at runtime; a remote can upgrade React independently         |
| **Fault isolation**         | One bad component can crash the app | `RemoteBoundary` catches per-remote failures, keeping shell and other remotes alive |

**Module Federation v2** (`@module-federation/enhanced`) was chosen over alternatives such as `single-spa` or iframes because:

- Native Rspack/Webpack integration — no extra runtime adapters.
- Shared module negotiation prevents duplicate React instances (critical for hooks).
- `remoteEntry.js` manifest loading enables seamless async-loading without global variables.

---

## 3. How Host and Remotes Work

### Bootstrap pattern

Every app splits `index.ts` → `bootstrap.tsx`. The thin `index.ts` is a dynamic import:

```ts
// index.ts
import("./bootstrap"); // forces MF runtime to negotiate shared modules FIRST
```

This ensures the MF runtime resolves singletons (React, Router, Chakra) before any component tree mounts, preventing the "multiple React copies" problem.

### Host as consumer

`rspack.config.ts` declares remotes driven by environment variables:

```ts
remotes: {
  authApp:      `authApp@${REMOTE_AUTH_URL}/remoteEntry.js`,
  dashboardApp: `dashboardApp@${REMOTE_DASHBOARD_URL}/remoteEntry.js`,
}
```

`AppRouter.tsx` lazy-loads each remote route tree:

```tsx
const AuthRoutes = lazy(() => import("authApp/AuthRoutes"));
const DashboardRoutes = lazy(() => import("dashboardApp/DashboardRoutes"));
```

### RemoteBoundary — resilience layer

Every remote is wrapped with `RemoteBoundary`, which composes:

1. **`React.Suspense`** → branded `<LoadingFallback>` (spinner) while `remoteEntry.js` fetches.
2. **Class-based `RemoteErrorBoundary`** → catches `ChunkLoadError` and network failures, renders a recovery card with **Retry** and **Go Home** actions.

```
RemoteBoundary
  └── RemoteErrorBoundary (class)   ← catches ChunkLoadError / network failures
       └── React.Suspense           ← shows LoadingFallback while fetching remoteEntry.js
            └── {children}
```

### TypeScript contract

`@mf-types/` holds generated `.d.ts` declarations so remote components are fully typed without a shared package or monorepo tooling.

### Shell responsibilities

| Concern         | Implementation                                                                     |
| --------------- | ---------------------------------------------------------------------------------- |
| Routing         | `BrowserRouter` + `Routes` in `AppRouter.tsx` — owns all top-level path prefixes   |
| Layout          | `GlobalShell` — nav bar, page frame, Chakra `AppThemeProvider`                     |
| Remote loading  | `React.lazy()` imports `authApp/AuthRoutes` and `dashboardApp/DashboardRoutes`     |
| Fault isolation | `RemoteBoundary` wraps every remote route — handles Suspense + class ErrorBoundary |
| Type safety     | `@mf-types/` folder holds generated `.d.ts` for all consumed remote modules        |
| Bundle analysis | `bun run build:analyze` opens RsDoctor with chunk visualisation                    |

### Remote URLs

Environment variables control remote URLs so the **same build artifact** can point to different environments without rebuilding:

| Variable               | Default                 |
| ---------------------- | ----------------------- |
| `REMOTE_AUTH_URL`      | `http://localhost:3001` |
| `REMOTE_DASHBOARD_URL` | `http://localhost:3002` |

---

## 4. Bundle & Chunk Strategy

```
runtime.js       ← single MF runtime (runtimeChunk: "single") — required by MF
vendor.forms.js  ← react-hook-form + @hookform + zod (priority 30, cached separately)
vendor.common.js ← all other node_modules used ≥2× (priority 5)
main.js          ← host app code
```

`runtimeChunk: "single"` centralises Webpack's module registry in one file, which the MF runtime requires to track which shared modules are already loaded.

`vendor.forms` is split at priority 30 so form libraries are cached independently from other vendors — they change less frequently, maximising cache hit rate.

### Shared module singleton enforcement

All cross-cutting libraries are declared `singleton: true`:

```
react · react-dom · react-router-dom · @chakra-ui/react
@emotion/react · @emotion/styled · zustand
```

If semver ranges mismatch, the MF runtime warns and uses the highest compatible version instead of duplicating the library.

### Bundle analysis

```bash
bun run build:analyze   # opens RsDoctor UI with chunk visualisation
```

---

## 5. Testing Strategy

### Tooling

| Tool                            | Purpose                              |
| ------------------------------- | ------------------------------------ |
| **Vitest 3**                    | Test runner (fast HMR-aware re-runs) |
| **jsdom**                       | Browser environment simulation       |
| **@testing-library/react**      | Component interaction testing        |
| **@testing-library/user-event** | Realistic event simulation           |
| **@testing-library/jest-dom**   | DOM assertion matchers               |

### What is tested

**`RemoteBoundary.test.tsx`** — the most critical host-level test. Covers three states:

1. Successful render — children appear in the DOM.
2. Suspense pending — loading spinner with the correct remote name is visible.
3. Error thrown — error card with Retry / Go Home buttons is shown.

```
src/components/__tests__/RemoteBoundary.test.tsx
src/components/__tests__/GlobalShell.test.tsx
```

### Test utilities

`src/test-utils/render.tsx` wraps `@testing-library/react`'s `render` with the Chakra theme provider and a `MemoryRouter`, so tests import `render` from `test-utils` rather than the library directly.

### Commands

```bash
bun run test              # single run
bun run test:watch        # watch mode
bun run test:coverage     # V8 coverage report
```

---

## 6. CSS & UI Architecture

### Chakra UI v3

Chakra v3 uses **CSS variables** instead of runtime style injection. Styles resolve to static CSS custom properties at init — no overhead in production rendering.

### Design tokens (`src/theme/tokens.ts`)

```ts
colors:     brand (blue-based), neutral, success, warning, error, info
typography: Sora (headings), Plus Jakarta Sans (body), JetBrains Mono (mono)
fontSizes:  xs → 5xl scale
```

### Recipes (`src/theme/recipes.ts`)

Component variants are defined as **recipes** rather than inline `sx` props:

| Recipe           | Adds                                                      |
| ---------------- | --------------------------------------------------------- |
| `buttonRecipe`   | `danger` colour variant + active scale micro-interaction  |
| `cardSlotRecipe` | Standardised Card slot padding, border-radius, and shadow |

Recipes are tree-shaken in production builds and keep variant logic co-located with the component definition.

### No global CSS / CSS Modules

All layout, spacing, and colour decisions use Chakra's prop-based API (`px`, `py`, `bg`, `color`, etc.) mapped to design tokens. There are no `.css` files or CSS Modules in the codebase.

### Theme provider

The host shell's `AppThemeProvider` is the outermost provider. Remotes rely on the shell's shared Chakra singleton via Module Federation — they do **not** mount a second provider.

---

## 7. Form & Validation Approach

Forms in this app are minimal — login and register flows live in `remote-auth`. The host shell provides reusable primitives consumed by remotes:

### Stack

| Layer      | Library                     |
| ---------- | --------------------------- |
| Form state | **React Hook Form 7**       |
| Schema     | **Zod 4**                   |
| Bridge     | **@hookform/resolvers/zod** |

### Single source of truth

Zod schemas define rules; `z.infer<typeof schema>` derives the TypeScript type:

```ts
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormData = z.infer<typeof loginSchema>;
```

This eliminates the class of bug where schema and TypeScript type drift apart.

### Validation mode

`mode: "onTouched"` — validates on `blur` for the first interaction, then on `change` once a field has been touched. Balances immediate feedback with avoiding premature error messages.

---

## 8. Risks as the Project Scales

1. **Shared module version drift** — as teams evolve independently, library versions across remotes may diverge. MF's singleton mechanism uses one version at runtime, potentially breaking a remote built against a different API. _Mitigation_: pin dependency versions via a workspace manifest or Renovate bot.

2. **No cross-remote auth guard** — route protection currently lives inside `remote-auth`. A future remote added without implementing guards will leave routes unprotected. _Mitigation_: add a `ProtectedRoute` wrapper in the host shell so all remotes inherit the guard automatically.

3. **CI/CD coordination overhead** — independent deployments risk incompatibility between host and remotes when the exposed module contract changes. _Mitigation_: contract testing (Pact) or integration smoke tests in staging on every remote deploy.

4. **Mocked API surface** — all API calls use `setTimeout` stubs. When real APIs are introduced, error handling (timeouts, 401 refresh, server errors) must be retrofitted across both remotes. _Mitigation_: introduce a shared `apiClient` module early to centralise request interceptors.

5. **Testing coverage gaps** — `test-utils/` scaffolding exists but is minimal. As UI complexity grows, the absence of comprehensive tests increases regression risk. _Mitigation_: enforce coverage thresholds in CI (`vitest --coverage`).

6. **Stale TypeScript declarations** — `@mf-types/` must be regenerated whenever a remote changes its interface. Stale declarations silently pass `tsc` while failing at runtime. _Mitigation_: automate `dts` generation in each remote's CI and commit updated types to the host.

7. **No SSR or static pre-rendering** — the current setup is client-rendered SPA only. Adding SSR later in a MFE context requires non-trivial infrastructure changes (streaming, hydration coordination). _Mitigation_: evaluate at architecture level before the first SSR requirement emerges.

---

## 9. Strengths

- **True fault isolation** — `RemoteBoundary` prevents a failing remote from crashing the full app; users see a scoped error card with recovery options.
- **Performance by default** — no remote code is fetched until the user navigates to its route prefix. Async chunk splitting within each remote adds a further deferral.
- **Environment-driven URLs** — `REMOTE_AUTH_URL` / `REMOTE_DASHBOARD_URL` env vars allow the same artifact to point to staging or production remotes without rebuilding.
- **Type-safe contracts** — `@mf-types/` gives full TypeScript intellisense for remote components without a shared package or monorepo tooling.
- **Bootstrap async boundary** — the `index.ts → import("./bootstrap")` pattern is correctly implemented in every app, preventing the subtle `Cannot read properties of undefined` error that occurs when MF shared modules are imported before the federation runtime has resolved.
- **Bundle analysis built in** — `bun run build:analyze` opens an interactive RsDoctor report for per-chunk inspection in a single command.

---

## 10. Weaknesses

- **All APIs are mocked** — `setTimeout`-based stubs provide zero coverage of real HTTP error paths, token expiry, or race conditions.
- **No E2E tests** — unit and component tests exist, but there are no Playwright or Cypress tests verifying the full MFE composition (actual remote loading, cross-remote navigation, `RemoteBoundary` recovery in a real browser).
- **No cross-remote auth guard** — the host does not enforce authentication at the routing layer; a carelessly added remote can expose protected pages unauthenticated.
- **Duplicated theme configuration** — `tokens.ts`, `recipes.ts`, and `AppThemeProvider.tsx` are copy-pasted across all three apps. A brand update requires three separate edits with no synchronisation mechanism.
- **Zustand stores are remote-scoped** — there is no mechanism for the shell or a sibling remote to react to another remote's store changes (e.g., dashboard cannot redirect to `/auth/login` on logout).
- **Manual type generation** — `@mf-types/` declarations must be kept current manually; a stale declaration silently passes type-check while the runtime breaks.

---

## Project Structure

```
src/
  index.ts              ← async bootstrap boundary (MF runtime init)
  bootstrap.tsx         ← React root mount
  App.tsx               ← Providers composition
  components/
    GlobalShell.tsx     ← nav layout
    NotFound.tsx        ← 404 page
    RemoteBoundary.tsx  ← loading + error wrapper for remotes
    __tests__/
  router/
    AppRouter.tsx       ← BrowserRouter + lazy remote routes
    routes.ts           ← typed route constants
  theme/
    tokens.ts           ← colour + typography design tokens
    recipes.ts          ← Chakra component recipes (button, card)
    AppThemeProvider.tsx
  declarations/
    remotes.d.ts        ← manual ambient types for remote imports
  @mf-types/            ← auto-generated types from remote apps
```

---

## Commands

```bash
bun run dev              # dev server on :3000 (hot reload)
bun run build            # production build → dist/
bun run build:analyze    # production build + RsDoctor bundle report
bun run preview          # serve dist/ on :3000
bun run test             # vitest single run
bun run test:watch       # vitest watch mode
bun run test:coverage    # coverage report (V8)
bun run type-check       # tsc --noEmit
bun run check:fix        # biome lint + format (write)
```
