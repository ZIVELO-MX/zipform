# TLOZ Roadmap

**Current state:** mock-backed dashboard module inside Zipform
**Target state:** daily-usable Mission operating system for Zivelo

This roadmap is product-specific. The Zipform platform roadmap remains in
`../../ROADMAP.md`.

---

## NOW

- [IMPLEMENTED] Dashboard route at `/tloz`
- [IMPLEMENTED] Board route at `/tloz/board`
- [IMPLEMENTED] Lista route at `/tloz/list`
- [IMPLEMENTED] Tabla route at `/tloz/table`
- [IMPLEMENTED] Calendario route at `/tloz/calendar`
- [IMPLEMENTED] Mission Detail route at `/tloz/missions/[missionId]`
- [IMPLEMENTED] Async mock data layer in `apps/dashboard/lib/tloz-data.ts`
- [IMPLEMENTED] TLOZ shared types for Season, Episode, Project, Mission, dependencies, Quest Items, checklist items, resources, and user mission state
- [IMPLEMENTED] Spanish UI with RPG terms kept in English
- [IMPLEMENTED] shadcn Progress component replacing manual bar on cards and table
- [IMPLEMENTED] Mission type-colored right border on cards
- [IMPLEMENTED] Controlled Lucide icon per mission, resolved via `resolveMissionIcon()` helper
- [IMPLEMENTED] Owner Avatar + username (from `ownerId`) in card footer
- [IMPLEMENTED] Visual consistency: icon + tone across list, table, board, calendar, dashboard rows
- [IMPLEMENTED] `exploration_quest` displays as **Explore** in badges and labels
- [IMPLEMENTED] `DashboardMissionList` extracted from page into `components/tloz/` per UI guidelines
- [IMPLEMENTED] Owner Avatar uses real UserProfile with avatar image and username
- [IMPLEMENTED] Avatars as circles (rounded-full) in all TLOZ mission views
- [IMPLEMENTED] Progress bar solid black (var(--carbon)) instead of gradient
- [IMPLEMENTED] Icon + type badge + flow badge aligned horizontally in card header
- [IMPLEMENTED] Offset accent border (box-shadow) on cards for subtle depth
- [IMPLEMENTED] Tooltips on state icons, dependency avatars, and quest item dots
- [IMPLEMENTED] Badge background matches mission type tone color in all views
- [IMPLEMENTED] QuestItemDots: hidden when empty, overflow count (+N) when >3 items
- [IMPLEMENTED] currentUser imported from @zipform/data (no duplication)

Current limitations:

- Creation and editing are visible but non-persistent.
- Search and filters are placeholders backed by mock data.
- Activity history is a placeholder.
- Resources are metadata-only; uploads are not implemented.
- Permissions are not defined.

---

## NEXT

### Product Decisions

- Define quick-create versus detailed-create Mission behavior.
- Define which Mission fields are editable in list, board, table, calendar, and detail contexts.
- Define required fields, validation, and error states for Mission creation.
- Define completion rules for Exploration Quest conclusions.
- Define dependency behavior when moving a Mission to Now.
- Define Quest Item acquisition, requirement, and blocking semantics.
- Define the activity event model.
- Define resource upload, preview, access, deletion, and storage behavior.

### Persistence

- Choose the database driver and migration strategy.
- Replace `apps/dashboard/lib/tloz-data.ts` with a real repository implementation without changing page/component contracts.
- Persist Missions, Projects, Seasons, Episodes, dependencies, Quest Items, checklist items, resources, and user mission state.
- Add stable IDs, timestamps, and ownership from authenticated user context.

### Search And Navigation

- Implement global command/search across Missions, Proyectos, Quest Items, Recursos, and views.
- Make breadcrumbs reflect deeper hierarchy when Project and Episode pages exist.
- Add direct navigation targets for Projects, Quest Items, and Resources.

### Permissions

- Define who can create, edit, complete, block, delete, and assign Missions.
- Define role-based visibility for resources and activity.
- Connect ownership and user mission state to shared authentication.

---

## LATER

### Full Product Surface

- Project detail pages.
- Season detail pages.
- Episode detail pages.
- Quest Item index and detail pages.
- Resource library.
- Saved filters and user-specific views.
- Team workload and active Mission limits.

### Collaboration

- Comments or notes on Missions.
- Notifications for blocking changes, due dates, and assignment changes.
- Activity timeline with meaningful event grouping.

### Quality Gates

- Unit tests for repository mapping and derived Mission state.
- Route tests for all TLOZ views.
- Visual checks for desktop, mobile, expanded sidebar, and collapsed sidebar states.
- Accessibility pass for keyboard navigation, table semantics, forms, and disabled actions.

---

## Release Gates

TLOZ is daily-usable when:

- Missions can be created, edited, assigned, completed, blocked, and searched.
- Board, Lista, Tabla, Calendario, and Mission Detail read and write persistent data.
- Dependencies and required Quest Items affect Mission readiness in a predictable way.
- Resource behavior is defined and implemented.
- Permissions are enforced from shared authentication.
- Activity history shows the events users need for operational visibility.
