# Zipform

Zipform is an internal software platform used by Zivelo.

The platform is composed of independent applications that share a common
ecosystem: authentication, navigation, design system, and infrastructure.

---

## Applications

### Quotes

Generates and manages client quotes. Currently exists as a functional product
and is being refactored toward stability and long-term maintainability.

Target: daily usable by v1.0.

### TLOZ (The Legend of Zivelo)

The strategic foundation of Zipform. Manages projects, tasks, missions,
and version planning. Currently under active development.

The MVP cannot be released without a functional TLOZ.

---

## Architecture

- Next.js monorepo with shared packages
- Shared authentication across all applications
- Shared design system (components, tokens, motion patterns)
- Shared navigation and dashboard as a unified entry point
- Applications are independent but ecosystem-aware
- Future applications can be added with minimal architectural changes

Current workspace:

- `apps/dashboard` - functional Zipform dashboard
- `packages/data` - async mock data repositories, shaped so a real database
  driver can replace the mock source later
- `packages/types` - shared platform types

---

## Brand

| Name       | Hex     | Purpose                         |
| ---------- | ------- | ------------------------------- |
| Zivelo Red | #D72228 | Primary accent                  |
| Carbon     | #1D1D1B | Text, headings, dark surfaces   |
| Off-White  | #FAFAF9 | Primary background              |
| Warm Stone | #C8B99A | Secondary accents               |
| Tint Red   | #F5E0E1 | Soft backgrounds and highlights |

---

## Current Roadmap Status

See ROADMAP.md for the full NOW / NEXT / LATER breakdown.

|                     |                           |
| ------------------- | ------------------------- |
| **Current version** | 0.1                       |
| **Target version**  | 1.0                       |

---

## Getting Started

Install dependencies and run the dashboard:

```sh
pnpm install
pnpm dev
```

Build the dashboard:

```sh
pnpm build
```

---

## Contributing

This repository is an internal Zivelo tool. All architectural decisions are
governed by the Zipform platform roadmap. See IDEA.md for the agent prompt
policy and planning rules.
