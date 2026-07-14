# TLOZ Interface System

## Direction

- Feel: compact, operational, calm, and game-system inspired without decorative fantasy chrome.
- Focal pattern: the mission or entity title leads; metadata, properties, and activity remain secondary.
- Color: use existing semantic tokens and neutral carbon surfaces. Reserve TLOZ red for brand actions, completed states, and destructive emphasis.
- Depth: borders-first with quiet surface shifts; avoid decorative shadows and harsh dividers.
- Spacing: 4 px base unit. Prefer 8–16 px inside controls and 24–32 px between major workflow sections.

## Hierarchy and density

- Page title: approximately 30 px, bold, tight tracking, balanced wrapping.
- Section label: 13 px, bold, uppercase, subtle tracking, secondary foreground.
- Body copy: 13–15 px with compact controls and comfortable Markdown line height.
- Metadata: 11–12 px; use monospace and tabular numbers for IDs, counts, and progress.
- Desktop may use a content column with a 308 px sticky properties rail; collapse to one column in narrow containers.

## Reusable component patterns

### Mission content accordion

- Use the shared Radix `Accordion`; do not hand-roll disclosure behavior.
- Description, Detail, and Checklist are independent items in a `type="multiple"` accordion and remain open initially so existing information is not hidden on first load.
- Place the chevron at the inline start with `iconPosition="start"`; keep the 13 px uppercase label immediately after it.
- Keep counts as non-interactive content inside the trigger. Place filters, menus, editors, and other interactive controls inside `AccordionContent` to avoid nested buttons.
- Preserve the shared short open/close animation and disable meaningful motion under `prefers-reduced-motion`.

### Mission detail content

- Keep Markdown as the source of truth and render it with the real Markdown renderer outside editing mode.
- Markdown editing areas use at least 320 px on desktop and about 45dvh on mobile.
- Checklist filters retain the brief opacity/translation transition; completed controls and status indicators use TLOZ red consistently.

### Compact panel controls

- Reuse shared primitives for selects, popovers, icons, tooltips, segmented controls, and dialogs.
- Keep visible controls compact while preserving accessible names, focus states, and practical hit areas.
- Overlay content must remain within the panel overlay root; only the explicit backdrop, Escape, or close control dismisses a side panel.
