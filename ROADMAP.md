# TLOZ Roadmap

## Current migration

- [x] Make TLOZ the only product represented by this repository.
- [x] Move the global lobby to `/` and Project workspaces to `/:projectSlug`.
- [x] Introduce Project, Mission, and Inventory as typed documents.
- [x] Support Markdown plus YAML frontmatter import and export.
- [x] Let each Project define the Mission field and workflow contract.
- [x] Drive Mission creation and views from Project-specific status and category
      options.
- [x] Add a document-oriented Data API v2 with optimistic revisions.
- [x] Preserve v1 and legacy data projections for one compatibility release.
- [x] Remove legacy application-launcher surfaces.
- [ ] Rename the GitHub repository after this migration is merged.
- [ ] Configure and verify the `tloz.zivelo.dev` production domain.
- [ ] Remove v1 compatibility after consumers migrate to documents v2.

## Next

- [ ] Add saved document queries and reusable views.
- [ ] Add relations between arbitrary documents.
- [ ] Add bulk Mission property editing driven by Project contracts.
- [ ] Add document history and revision comparison.
- [ ] Add full-text search over properties and Markdown bodies.
- [ ] Add Project contract templates.

## Verification

The pull request pipeline is the source of truth for type checking, automated
tests, the production build, and preview deployment. Manual verification should
cover root navigation, a Project-specific workflow, contract editing, Markdown
round-tripping, and Inventory detail.
