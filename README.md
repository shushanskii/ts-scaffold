# ts-scaffold

A working TypeScript monorepo you copy to start a new project. It is not a generator — the
repository *is* the template, so everything in it is code that builds, tests and passes its own
quality gate. If it is broken here, you would have found out the hard way in every project started
from it.

## What's in the box

Three packages, one per shape a real project needs:

| Package | Path | Role | Build |
|---|---|---|---|
| `@app/shared` | `packages/shared` | types + zod schemas used by both sides | none — `exports` points at `./src/index.ts` |
| `@app/api` | `apps/api` | Express service | `tsup` → `dist/main.js` |
| `@app/web` | `apps/web` | React SPA on Redux Toolkit + Saga | `vite build` → `dist/` |

They demonstrate one end-to-end loop: a click in the browser dispatches an intent, a saga calls the
service over HTTP, the response is validated and stored, a selector feeds it back to the UI.

## Quick start

Requires **Node ≥ 22**. pnpm comes from the `packageManager` field — `corepack enable` is enough.

```bash
pnpm install     # also installs the husky hooks
pnpm dev         # service on :3000, web on :5173
```

Open <http://localhost:5173>. The browser calls `/api/*`, which the Vite dev server proxies to the
service with the prefix stripped — no CORS, and no base URL baked into the client. Point it
somewhere else with `API_URL`.

## Making it yours

The `@app` scope and the `Todo` domain exist so the template runs. Both are meant to be deleted.

1. **Rename the workspace** — `name` in the root `package.json`.
2. **Rename the scope** — `@app/shared`, `@app/api`, `@app/web` in the three package manifests, plus
   the `@app/shared` dependency in `apps/api` and `apps/web`.
3. **Delete the example domain** — everything named `todo`/`Todo` under `packages/shared/src`,
   `apps/api/src` and `apps/web/src`, including its tests and snapshots. Keep the directory
   structure; it is the convention.
4. **Fill in `conventions/project.md`** — it is deliberately close to empty. Package names, the
   package graph, and domain terms belong there, not in the portable layers.
5. **Update the boundary zones** in `.fallowrc.json` if you add or rename packages. A package with
   no zone is a package with no enforced boundaries.

Then `pnpm run audit && pnpm test` should still be green. It will not be if you missed a step.

## Commands

Run from the repository root:

| Command | What it does |
|---|---|
| `pnpm dev` | service in watch mode + Vite dev server |
| `pnpm run audit` | **the gate** — typecheck, then Biome, then fallow |
| `pnpm test` | Vitest in every package |
| `pnpm run build` | `tsup` and `vite build` into each app's `dist/` |
| `pnpm run fix` | Biome auto-fix (format + lint) |

### The gate

`pnpm run audit` is the single verification command, and the `pre-commit` hook runs it:

```
turbo run typecheck              types, per package
biome check .                    format + lint, whole repo
fallow dead-code --fail-on-issues  dead code, cycles, boundaries, duplicate exports
```

Green means types, style and structure all pass. `commitlint` separately rejects commit messages
that are not [Conventional Commits](https://www.conventionalcommits.org/).

## Layout

Inside every package, an entity is a **directory with an `index.ts`** — never a flat `Thing.ts`.
Which buckets a package has depends on its role:

```
packages/shared/src/     types/ schemas/
apps/api/src/            app/ routes/ services/          + main.ts
apps/web/src/            api/ actions/ reducers/ sagas/
                         store/ selectors/ hooks/ components/   + main.tsx
```

Layers only import leftwards, and fallow enforces it. In `apps/web` that means components reach
state through a hook, never through a reducer; sagas dispatch slice actions, the UI never does.

## Stack

TypeScript 7 · pnpm workspaces + Turborepo · Biome · Vitest + Testing Library · fallow
React 19 · Redux Toolkit + Redux Saga · styled-components · Vite
Express 5 · tsup · zod

Shared dependency versions live once in the pnpm `catalog:` in `pnpm-workspace.yaml`. No package
hard-codes a version.

## Conventions

The rules are loaded into every agent session through `CLAUDE.md` → `AGENTS.md`, layered from most
portable to most project-specific:

- [`conventions/core.md`](./conventions/core.md) — any TypeScript monorepo
- [`conventions/react.md`](./conventions/react.md) — any React project
- [`conventions/redux.md`](./conventions/redux.md) — Redux Toolkit + Saga
- [`conventions/project.md`](./conventions/project.md) — only this repository

Read them before adding a package. They are short, and they describe what the code actually does —
several of the rules exist because the toolchain caught the alternative.