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
- [x] Keep `zipform.zivelo.dev` as the production domain while the TLOZ alias remains deferred.
- [ ] Remove v1 compatibility after consumers migrate to documents v2.
- [ ] Replace the physical document mirror with the canonical Container/Content
      store defined by TLO-0075.

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
