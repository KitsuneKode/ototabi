# Plan 10: OXC Migration

**Status:** in-progress  
**Priority:** P0

## Problem

Currently using ESLint + Prettier with typescript-eslint, eslint-config-prettier, eslint-plugin-react-hooks, eslint-plugin-turbo, prettier-plugin-sort-imports. Multiple config files, slow lint times, heavy dependency tree in `tooling/eslint-config/`.

## Solution

Replace with oxlint + oxfmt from the OXC project. Single binary does both. Matches the toolchain used in the reference repo (t3code).

## OXC Plugin Coverage Confirmed

| Need          | oxlint Plugin                        | Status |
| ------------- | ------------------------------------ | ------ |
| ESLint core   | `eslint` (default)                   | ✓      |
| TypeScript    | `typescript` (default)               | ✓      |
| React + hooks | `react` (includes react-hooks rules) | ✓      |
| Next.js       | `nextjs`                             | ✓      |
| Import rules  | `import`                             | ✓      |
| a11y          | `jsx-a11y`                           | ✓      |
| Unicorn       | `unicorn` (default)                  | ✓      |
| Oxc-specific  | `oxc` (default)                      | ✓      |

| Need              | oxfmt Feature               | Status |
| ----------------- | --------------------------- | ------ |
| Code formatting   | core                        | ✓      |
| Import sorting    | `sortImports`               | ✓      |
| Tailwind classes  | `sortTailwindcss`           | ✓      |
| package.json sort | `sortPackageJson` (default) | ✓      |

## Files to Create

- `/.oxlintrc.json`
- `/.oxfmtrc.json`
- `/.gitattributes`

## Files to Update

- `package.json` — replace scripts, add devDeps
- `.vscode/settings.json` — oxc formatter
- `.vscode/extensions.json` — recommend oxc

## Files to Remove

- `/.prettierrc`
- `/.prettierignore`
- `/tooling/eslint-config/` (entire directory)

## Acceptance Criteria

- `bun fmt` formats all files without errors
- `bun lint` passes with no errors
- `bun typecheck` passes
- `bun run build` passes
- No eslint or prettier in `devDependencies`
