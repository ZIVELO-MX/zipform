# Zipform Roadmap

**Current Version:** 0.1
**Target Version:** 1.0

---

### NOW

- [PLATFORM] Build functional dashboard shell with responsive sidebar
- [PLATFORM] Create mock data modules that can be replaced by a real DB driver
- [DOCUMENTATION] Create ROADMAP.md and keep README synchronized
- [TLOZ] Ship initial dashboard module with Dashboard, Board, Lista, Tabla, Calendario, and Mission Detail views
- [TLOZ] Card UI: shadcn Progress bar, type-colored right border, Lucide icon per mission, owner Avatar + username footer
- [TLOZ] Visual consistency: icon + tone across all views (list, table, board, calendar, dashboard)
- [TLOZ] Avatars as circles, progress bar solid black
- [TLOZ] Icon + type + flow badges aligned horizontally in card header
- [TLOZ] Owner Avatar uses real UserProfile (avatarUrl, username) from mock data layer
- [TLOZ] Offset accent border (box-shadow) for card depth
- [TLOZ] Tooltips on state icons, dependencies, quest items
- [TLOZ] Badge color matches mission type tone on all views
- [TLOZ] QuestItemDots: hidden when empty, overflow count (+N) when >3
- [UI] Sidebar UserAvatar changed to circle (rounded-full) globally
- [UI] Shared dashboard primitives extracted for TLOZ cards, view sections, slide-over drawers, and attachment metadata

Status:

- Dashboard shell is functional in `apps/dashboard`.
- TLOZ now has an implemented mock-backed module under `/tloz`.
- TLOZ data still comes from replaceable async mock repositories.
- Cards, list rows, and table rows use consistent icon + type-tone visuals.
- Exploration Quest displays as **Explore** instead of "Exploration Quest".
- `DashboardMissionList` extracted from page into components layer, respecting `docs/ui-guidelines.md`.
- Owner display uses `UserProfile` with avatar image, username, and initials fallback.
- All user avatars (sidebar + TLOZ) are circles.
- Mission type badges use the same color as the right border accent.
- TLOZ now uses shared UI primitives for dashboard presentation, slide-over panels, and attachment/resource rows.

---

### NEXT

**Authentication**

- [AUTH] Enable shared internal authentication

**Quotes**

- [QUOTES] Prepare Quotes integration path for daily-use readiness
  Depends on: Enable shared internal authentication

**TLOZ**

- [TLOZ] Replace mock repositories with persistence, permissions, and global search
  Depends on: Enable shared internal authentication
- [TLOZ] Define creation and editing behavior for Missions, checklist items, resources, dependencies, and Quest Items
- [TLOZ] Resolve activity semantics for Mission Detail

**UI**

- [UI] Continue hardening shared primitives used by TLOZ and platform pages
- [UI] Revisit the internal Attachment primitive when an official shadcn registry item is available

**Infrastructure**

- [PLATFORM] Prepare the dashboard deployment baseline

---

### LATER

- Add Finance as an internal platform application
- Add Security as an internal platform application
- Add UI Preview for shared component validation
- Expand TLOZ beyond Missions into deeper project, episode, resource, and Quest Item management after persistence and permissions exist

---

Moving from 0.1 to 1.0 requires Quotes and TLOZ to both reach daily usability.
TLOZ now has its own implementation roadmap in `imports/tloz/ROADMAP.md`.
The platform roadmap tracks the shared foundations and integration gates, while
the TLOZ roadmap tracks product-specific behavior and unresolved decisions.
