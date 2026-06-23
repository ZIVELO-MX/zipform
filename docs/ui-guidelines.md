# UI Element Guidelines

Before adding a new UI element or component to this project, follow the process below.

## 1. Check what already exists

- **shadcn components**: Check `packages/ui/src/components/` for existing components. shadcn components follow a standard structure (forward refs, `cn()` for class merging, exposed from `packages/ui/src/index.ts`).
- **Custom components**: Check `packages/ui/src/components/` for app-specific components like `app-sidebar.tsx` and `page-layout.tsx`.
- **Design tokens**: The project uses custom CSS variables defined in `apps/dashboard/app/globals.css` (`--zivelo-red`, `--carbon`, `--paper`, `--ink-muted`, `--line`, `--shadow-soft`, etc.). Prefer these over hardcoded colors.
- **Tailwind config**: `apps/dashboard/tailwind.config.ts` defines custom colors (`carbon`, `ivory`, `paper`, `zivelo`, etc.) and the `tailwindcss-animate` plugin. Use these utility classes instead of arbitrary values.

## 2. Adding a new shadcn component

```bash
pnpm dlx shadcn@latest add <component-name> -c packages/ui
```

- Always use `-c packages/ui` so the component is added to the shared package.
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

- Import from `@zipform/ui` (the package name), never from relative paths.
- Keep orchestration logic (state, effects, localStorage) in `apps/dashboard/components/`, not in `packages/ui`.
- Pages and layouts in `apps/dashboard/app/` should only compose components, not contain presentational markup.

## 5. Animation conventions

- `tailwindcss-animate` plugin is registered in `apps/dashboard/tailwind.config.ts`. All shadcn-style animation classes are available.
- **Tooltips**: Use `data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95` for normal opens. Also include `data-[state=instant-open]:...` variants for sequential tooltip switches.
- **Dropdowns**: Use `data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95` plus `data-[side=*]:slide-in-from-*` for directional entry.
- If an animation appears missing, verify the plugin is in `tailwind.config.ts plugins` array and the correct Radix state is targeted.

## 6. TypeScript / exports

- Define component props inline or as exported types. Avoid importing types from `@zipform/types` in the UI package (prefer inline definitions to keep the package decoupled).
- Re-export all public types (like `NavItem`, `SidebarUser`) from `packages/ui/src/index.ts`.
- Peer dependencies needed by the UI package (e.g., `next`, `react`, `react-dom`) must be listed in `packages/ui/package.json` under `peerDependencies`.

## 7. Verification

After any UI change:

1. TypeScript: `pnpm --filter @zipform/dashboard exec npx tsc --noEmit` — must pass with zero errors.
2. Build: `pnpm --filter @zipform/dashboard build` — must complete successfully.
3. Check for regressions in collapsed/expanded sidebar states, mobile menu, and dropdown/tooltip animations.
