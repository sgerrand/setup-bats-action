# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run test          # Run unit tests with coverage
bun run build         # Bundle src/main.ts → dist/index.js via @vercel/ncc
bun run lint          # ESLint
bun run lint:fix      # ESLint with auto-fix
bun run format        # Prettier (write)
bun run format-check  # Prettier (check only)
bun run all           # format + lint:fix + build + test
```

Run a single test file:
```bash
bun run test -- --testPathPattern=installer
```

## Architecture

This is a TypeScript GitHub Action that installs BATS (Bash Automated Testing System) from GitHub release archives.

**Module system:** CommonJS (no `"type": "module"`). tsconfig targets ES2022 with `"module": "commonjs"`. Imports have no `.js` extension.

**Bundling:** `@vercel/ncc` bundles `src/main.ts` into `dist/index.js` (plus `dist/licenses.txt`). The `dist/` directory is committed to git — GitHub Actions executes it directly. The `lib/` tsc intermediate output is gitignored.

**Entry point:** `action.yml` points to `dist/index.js`, which executes `src/main.ts`. `src/main.ts` exports `run()` (for testability) and calls it under a `require.main === module` guard.

**Source files:**
- `src/main.ts` — reads `version` and `token` inputs, calls `installBats`, sets `version` output
- `src/installer.ts` — all domain logic: `normalizeVersion`, `resolveLatestVersion` (GitHub API), `getDownloadUrl`, `downloadBats` (tool-cache), `installBats`

**BATS installation:** Downloads `https://github.com/bats-core/bats-core/archive/v<VERSION>.tar.gz` (Linux/macOS) or `.zip` (Windows). Extracts to an outer directory containing `bats-core-<version>/` — the inner directory is what gets cached via `@actions/tool-cache`. `bin/bats` computes its own `BATS_ROOT` dynamically, so adding `<cached>/bin` to PATH is sufficient; `install.sh` is not run.

**Testing:** `jest.spyOn` for `@actions/core` and `@actions/tool-cache`. `os` module is mocked entirely via `jest.mock('os')` (because `os.platform` is non-configurable). `HttpClient.prototype.getJson` is spied on the prototype.
