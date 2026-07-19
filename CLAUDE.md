# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run test          # Run unit tests with coverage
bun run build         # Bundle src/main.ts → dist/index.js via esbuild
bun run lint          # ESLint
bun run lint:fix      # ESLint with auto-fix
bun run format        # Prettier (write)
bun run format-check  # Prettier (check only)
bun run all           # format + lint:fix + build + test
```

Run a single test file:

```bash
bun test __tests__/installer.test.ts   # or filter by name: bun test -t <name>
```

## Architecture

This is a TypeScript GitHub Action that installs BATS (Bash Automated Testing System) from GitHub release archives.

**Module system:** CommonJS (no `"type": "module"`). esbuild emits CommonJS (`--format=cjs --target=node24`). Imports have no `.js` extension. `tsc` never runs; `tsconfig.json` is only for editor type-checking.

**Bundling:** esbuild bundles `src/main.ts` into `dist/index.js` (plus `dist/index.js.LEGAL.txt` via `--legal-comments=external`). There is no intermediate build step — esbuild reads `src/` and writes `dist/` in one pass. The `dist/` directory is committed to git — GitHub Actions executes it directly.

The bundle includes dependency code, so its exact bytes depend on the installed dependency versions. Always run `bun install --frozen-lockfile` before `bun run build` when checking or regenerating `dist/`. A local `node_modules` that has drifted from `bun.lock` produces a different bundle, which looks like a stale `dist/` but is not. CI builds from the frozen lockfile, so matching it locally requires the frozen install first.

**Dependencies:** Anything imported by `src/` is a runtime dependency and gets bundled into `dist/`. These currently are all `@actions/*` packages. When you add a new runtime dependency that `src/` imports, also add its name pattern to the `actions-runtime` group in `.github/dependabot.yml`. Bun does not support `dependency-type` scoping, so the split between runtime and dev dependencies is maintained by name patterns there, not automatically.

**Entry point:** `action.yml` points to `dist/index.js`, which executes `src/main.ts`. `src/main.ts` exports `run()` (for testability) and calls it under a `require.main === module` guard.

**Source files:**

- `src/main.ts` — reads `version` and `token` inputs, calls `installBats`, sets `version` output
- `src/installer.ts` — all domain logic: `normalizeVersion`, `resolveLatestVersion` (GitHub API), `getDownloadUrl`, `downloadBats` (tool-cache), `installBats`

**BATS installation:** Downloads `https://github.com/bats-core/bats-core/archive/v<VERSION>.tar.gz` (Linux/macOS) or `.zip` (Windows). Extracts to an outer directory containing `bats-core-<version>/` — the inner directory is what gets cached via `@actions/tool-cache`. `bin/bats` computes its own `BATS_ROOT` dynamically, so adding `<cached>/bin` to PATH is sufficient; `install.sh` is not run.

**Releases:** `.github/workflows/release.yml` calls the [`release-mate/action`](https://github.com/release-mate/action) reusable workflow on every push to `main`. It runs release-please with a short-lived GitHub App token instead of a PAT, so the release PR and tag can trigger other workflows. Config stays in `release-please-config.json` and `.release-please-manifest.json`. The workflow needs two repository secrets: `RELEASE_MATE_CLIENT_ID` and `RELEASE_MATE_PRIVATE_KEY`. Merging the release PR cuts a GitHub Release, which triggers `publish.yml` to move the major version tag.

**Testing:** Tests use `bun:test`. `spyOn` for `@actions/core` and `@actions/tool-cache`. The `os` module is replaced via `mock.module` (because `os.platform` is non-configurable). `HttpClient.prototype.getJson` is spied on the prototype.
