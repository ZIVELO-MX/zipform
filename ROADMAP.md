# Zipform Roadmap

**Current Version:** 0.1
**Target Version:** 1.0

---

### NOW

- [PLATFORM] Build functional dashboard shell with responsive sidebar
- [PLATFORM] Create mock data modules that can be replaced by a real DB driver
- [DOCUMENTATION] Create ROADMAP.md and keep README synchronized

---

### NEXT

**Authentication**

- [AUTH] Enable shared internal authentication

**Quotes**

- [QUOTES] Prepare Quotes integration path for daily-use readiness
  Depends on: Enable shared internal authentication

**TLOZ**

- [TLOZ] Support TLOZ with navigation, shared UI, auth, and deployment foundations
  Depends on: Enable shared internal authentication

**UI**

- [UI] Extract reusable dashboard components into shared UI primitives

**Infrastructure**

- [PLATFORM] Prepare the dashboard deployment baseline

---

### LATER

- Add Finance as an internal platform application
- Add Security as an internal platform application
- Add UI Preview for shared component validation

---

Moving from 0.1 to 1.0 requires Quotes and TLOZ to both reach daily usability.
This roadmap intentionally keeps TLOZ product design outside the platform
roadmap and treats Quotes as an existing product that may be integrated or
rebuilt depending on the actual source state.
