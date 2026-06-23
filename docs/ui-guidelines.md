# UI Element Guidelines

Before adding a new UI element or component to this project, follow the process below.

## 0. Architecture — generic vs specific

This monorepo enforces a strict separation:

| Layer | Location | Purpose |
|-------|----------|---------|
| **Generic UI primitives** | `packages/ui/src/components/` | shadcn components (button, dialog, tooltip, etc.) and reusable compound components (`app-sidebar.tsx`, `page-layout.tsx`). Framework-agnostic (no app-specific data fetches, no route knowledge). Imported by convention, never by relative path. |
| **App orchestration** | `apps/*/components/` | Thin wrappers that import from `@zipform/ui` and add app-specific state, data binding, and layout logic (e.g., `app-shell.tsx`). One file per concern. |
| **App pages** | `apps/*/app/` | Route components that compose orchestration and shared UI components. Should not contain significant presentational markup. |

**Rule of thumb**: If a component could be useful in a different project (same visual but different data), it belongs in `packages/ui/`. If it wires a generic component to a specific API, route, or store, it belongs in `apps/*/components/`.

Example — the sidebar flow:
1. `packages/ui/src/components/app-sidebar.tsx` — defines `DesktopSidebar`, `SidebarLink`, `ProfileDropdown`, `MobileBottomNav`, `MobileMenuPanel` as generic, data-agnostic components.
2. `apps/dashboard/components/app-shell.tsx` — imports them from `@zipform/ui`, manages `collapsed`/`sidebarWidth` state in `localStorage`, passes actual `navItems` and `user` data.
3. `apps/dashboard/app/layout.tsx` — renders `<AppShell>`.

## 1. Design tokens

Design tokens (CSS custom properties) are owned by the shared UI package:

| Ownership | Location |
|-----------|----------|
| **Platform-level tokens** (colors, spacing, shadows, fonts) | `packages/ui/src/tokens.css` — `:root` variables consumed by any application. |
| **Tailwind utilities** (classes like `bg-carbon`, `text-zivelo`) | `apps/*/tailwind.config.ts` — each app extends the shared palette. |

The consuming application imports tokens by adding `@import "../../../packages/ui/src/tokens.css"` at the top of its `globals.css`.

Applications may define **app-scoped** overrides (e.g., a custom font stack for a specific brand) but must never redefine platform-level tokens.

## 2. Check what already exists

- **shadcn components**: Check `packages/ui/src/components/` for existing components. shadcn components follow a standard structure (forward refs, `cn()` for class merging, exposed from `packages/ui/src/index.ts`).
- **Custom components**: Check `packages/ui/src/components/` for custom reuse-oriented components like `app-sidebar.tsx` and `page-layout.tsx`.
- **Design tokens**: See section 1 above. All platform CSS variables are in `packages/ui/src/tokens.css`.
- **Tailwind config**: Each app's `tailwind.config.ts` defines the palette and the `tailwindcss-animate` plugin. Prefer utility classes over arbitrary values.

## 3. Adding a new shadcn component

```bash
pnpm dlx shadcn@latest add <component-name> -c packages/ui
```

- Always use `-c packages/ui` so the component lives in the shared package, not in an app. (Avoid creating `apps/*/components/ui/` — that directory exists only for legacy additions; all new components go into `packages/ui/`.)
- After adding, verify the import path: shadcn generates `@/lib/utils` but the package uses relative imports. Fix if necessary (e.g., `../lib/utils`).
- Export the new component from `packages/ui/src/index.ts`.

## 4. Adding a new custom component

- Place reusable presentational components in `packages/ui/src/components/`.
- Name files in kebab-case (`page-layout.tsx`, `app-sidebar.tsx`).
- Use `"use client"` if the component uses hooks, event handlers, or browser APIs.
- Apply design tokens via Tailwind classes (prefer `bg-carbon` over `bg-[#1D1D1B]`).
- Export from `packages/ui/src/index.ts` with `export * from "./components/<filename>"`.

## 5. Consuming UI components in a consumer application

- **Always import from `@zipform/ui`**, never from relative paths into `packages/ui/`.
- Keep orchestration logic (state, effects, localStorage, data fetching) in `apps/*/components/`, not in `packages/ui/`.
- Pages in `apps/*/app/` import from `apps/*/components/` (or directly from `@zipform/ui` for simple cases) and should primarily compose components rather than contain significant presentational markup. Simple pages may remain concise without introducing unnecessary wrappers.
- If an orchestration wrapper would be trivial, prefer importing directly from `@zipform/ui` in the page.

## 6. Motion as part of the design system

Motion is considered a first-class design system concern, not an app-specific embellishment.

- Reusable animation patterns (keyframes, transition durations, easing curves) should live in `packages/ui/src/tokens.css` or in shared Tailwind config extensions when possible.
- Before creating custom interaction patterns in an app, check whether a motion primitive already exists in the shared package.
- Radix state-driven animations (`animate-in`/`animate-out` classes via the `tailwindcss-animate` plugin) are the preferred mechanism. Custom `@keyframes` should be added to the shared package's config only when no Radix pattern fits.
- **Tooltips**: Include both `data-[state=delayed-open]:animate-in ...` and `data-[state=instant-open]:animate-in ...` variants to cover sequential tooltip switches.
- **Dropdowns**: Use `data-[state=open]:animate-in` plus `data-[side=*]:slide-in-from-*` for directional entry.
- If an animation appears missing, verify the plugin is registered in the consuming app's `tailwind.config.ts plugins` array and the correct Radix state attribute is targeted.

## 7. TypeScript / exports

- Define component props inline or as exported types. Avoid importing types from `@zipform/types` in the UI package (prefer inline definitions like `NavItem`, `SidebarUser` to keep the package decoupled).
- Re-export all public types from `packages/ui/src/index.ts`.
- Peer dependencies needed by the UI package (e.g., `next`, `react`, `react-dom`) must be listed in `packages/ui/package.json` under `peerDependencies`.

## 8. Application registration

Future applications (e.g., `apps/quotes`, `apps/tloz`, `apps/finance`) should expose metadata for platform-wide discovery and navigation.

### Convention

Each application exports a registration object from `apps/<name>/app/register.ts`:

```ts
import type { AppRegistration } from "@zipform/ui";

export const register: AppRegistration = {
  id: "my-app",
  name: "My App",
  icon: "file-text",
  route: "/my-app",
};
```

Where `AppRegistration` is defined in `packages/ui/src/index.ts`:

```ts
export type AppRegistration = {
  id: string;
  name: string;
  icon: string;
  route: string;
};
```

### Assembly

The platform shell (`apps/shell/app/layout.tsx` or equivalent) imports available registrations and passes them to the sidebar:

```ts
import { register as quotes } from "@zipform/quotes/app/register";

const navItems = [quotes, tloz, finance].map(toNavItem);
```

This enables future dashboard navigation, discovery, and module management without hardcoded application definitions.

---

## 9. Verification

After any UI change:

1. TypeScript: `pnpm --filter <app-name> exec npx tsc --noEmit` — must pass with zero errors.
2. Build: `pnpm --filter <app-name> build` — must complete successfully.
3. Check for regressions in collapsed/expanded sidebar states, mobile menu, and dropdown/tooltip animations.
