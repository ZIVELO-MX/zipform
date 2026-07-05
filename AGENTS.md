## Git & Pull Request Rules

### Commits

- Follow Conventional Commits.
- Allowed types:
  - `feat:`
  - `fix:`
  - `docs:`
  - `refactor:`
  - `test:`
  - `perf:`
  - `style:`
  - `build:`
  - `ci:`
  - `chore:`
- Use the imperative mood.
- Keep the subject line under 72 characters.
- Create one logical change per commit.
- Keep commits atomic.
- Never create WIP commits.
- Before committing, review whether new files or directories should be added to `.gitignore`.

### Features

- Every new feature must include automated tests.
- Follow the project's `error-handling-patterns` when writing tests.

### Pull Requests

- Create the PR automatically when the task is complete.
- PR title must be written in English.
- PR description must be written in Spanish.
- Include manual testing steps only when they are relevant to the implemented change or feature.

### Branches

- Never commit directly to `main` (except when the only changes are to docs).
- Create a dedicated branch for every logical change.
- Open pull requests against `main` by default.
- `dev` está inhabilitado — todos los cambios van directo a `main` mediante PR.

### Safety Rules

Never:

- Delete migrations.
- Modify production secrets.
- Force push.
- Rewrite Git history.
