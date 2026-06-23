# UI Element Guidelines

Before adding a new UI element or component to this project, follow the process below.

## 0. Architecture — generic vs specific

This monorepo enforces a strict separation:

| Layer | Location | Purpose |
|-------|----------|---------|
| **Generic UI primitives** | `packages/ui/src/components/` | shadcn components (button, dialog, tooltip, etc.) and reusable compound components (`app-sidebar.tsx`, `page-layout.tsx`). Framework-agnostic (no app-specific data fetches, no route knowledge). Imported by convention, never by relative path. |
| **App orchestration** | `apps/*/components/` | Thin wrappers that import from `@zipform/ui` and add app-specific state, data binding, and layout logic (e.g., `app-shell.tsx`). One file per concern. |
| **App pages** | `apps/*/app/` | Route components that only compose orchestration components. No presentational markup, no direct imports from `packages/ui/`. |

**Rule of thumb**: If a component could be useful in a different project (same visual but different data), it belongs in `packages/ui/`. If it wires a generic component to a specific API, route, or store, it belongs in `apps/dashboard/components/`.

Example — the sidebar flow:
1. `packages/ui/src/components/app-sidebar.tsx` — defines `DesktopSidebar`, `SidebarLink`, `ProfileDropdown`, `MobileBottomNav`, `MobileMenuPanel` as generic, data-agnostic components.
2. `apps/dashboard/components/app-shell.tsx` — imports them from `@zipform/ui`, manages `collapsed`/`sidebarWidth` state in `localStorage`, passes actual `navItems` and `user` data.
3. `apps/dashboard/app/layout.tsx` — renders `<AppShell>`.

## 1. Check what already exists

- **shadcn components**: Check `packages/ui/src/components/` for existing components. shadcn components follow a standard structure (forward refs, `cn()` for class merging, exposed from `packages/ui/src/index.ts`).
- **Custom components**: Check `packages/ui/src/components/` for custom reuse-oriented components like `app-sidebar.tsx` and `page-layout.tsx`.
- **Design tokens**: The project uses custom CSS variables defined in `apps/dashboard/app/globals.css` (`--zivelo-red`, `--carbon`, `--paper`, `--ink-muted`, `--line`, `--shadow-soft`, etc.). Prefer these over hardcoded colors.
- **Tailwind config**: `apps/dashboard/tailwind.config.ts` defines custom colors (`carbon`, `ivory`, `paper`, `zivelo`, etc.) and the `tailwindcss-animate` plugin. Use these utility classes instead of arbitrary values.

## 2. Adding a new shadcn component

```bash
pnpm dlx shadcn@latest add <component-name> -c packages/ui
```

- Always use `-c packages/ui` so the component lives in the shared package, not in an app. (Avoid creating a separate `apps/dashboard/components/ui/` — that directory exists only for legacy additions; all new components go into `packages/ui/`.)
- After adding, verify the import path: shadcn generates `@/lib/utils` but the package uses relative imports. Fix if necessary (e.g., `../lib/utils`).
- Export the new component from `packages/ui/src/index.ts`.

## 3. Adding a new custom component

- Place reusable presentational components in `packages/ui/src/components/`.
- Name files in kebab-case (`page-layout.tsx`, `app-sidebar.tsx`).
- Use `"use client"` if the component uses hooks, event handlers, or browser APIs.
- Apply design tokens via Tailwind classes (prefer `bg-carbon` over `bg-[#1D1D1B]`).
- For animations: `transition-all duration-200`, `animate-in`/`animate-out` (from `tailwindcss-animate` plugin).
- Export from `packages/ui/src/index.ts` with `export * from "./components/<filename>"`.

## 4. Consuming UI components in the dashboard app

- **Always import from `@zipform/ui`**, never from relative paths into `packages/ui/`.
- Keep orchestration logic (state, effects, localStorage, data fetching) in `apps/dashboard/components/`, not in `packages/ui/`.
- Pages in `apps/dashboard/app/` import from `apps/dashboard/components/` (or directly from `@zipform/ui` for simple cases) and must not contain presentational markup.
- If an orchestration wrapper would be trivial, prefer importing directly from `@zipform/ui` in the page.

## 5. Animation conventions

- `tailwindcss-animate` plugin is registered in `apps/dashboard/tailwind.config.ts`. All shadcn-style animation classes are available.
- **Tooltips**: Use `data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95` for normal opens. Also include `data-[state=instant-open]:...` variants for sequential tooltip switches.
- **Dropdowns**: Use `data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95` plus `data-[side=*]:slide-in-from-*` for directional entry.
- If an animation appears missing, verify the plugin is in `tailwind.config.ts plugins` array and the correct Radix state is targeted.

## 6. TypeScript / exports

- Define component props inline or as exported types. Avoid importing types from `@zipform/types` in the UI package (prefer inline definitions like `NavItem`, `SidebarUser` to keep the package decoupled).
- Re-export all public types from `packages/ui/src/index.ts`.
- Peer dependencies needed by the UI package (e.g., `next`, `react`, `react-dom`) must be listed in `packages/ui/package.json` under `peerDependencies`.

## 7. Verification

After any UI change:

1. TypeScript: `pnpm --filter @zipform/dashboard exec npx tsc --noEmit` — must pass with zero errors.
2. Build: `pnpm --filter @zipform/dashboard build` — must complete successfully.
3. Check for regressions in collapsed/expanded sidebar states, mobile menu, and dropdown/tooltip animations.
