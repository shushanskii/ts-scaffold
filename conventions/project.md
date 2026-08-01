# Conventions — project

Rules that only make sense for *this* repository. `ts-scaffold` is a template: it is itself a
working monorepo, and a new project starts as a copy of it.

Ownership rule: **if a rule names a package or a domain term, it belongs here** — not in
[`core.md`](./core.md), [`react.md`](./react.md), or [`redux.md`](./redux.md).

## Package graph

Three packages, one per shape a real project needs. Boundaries are enforced by the zones in the root
`.fallowrc.json`.

| Package | Path | Role | Build |
|---|---|---|---|
| `@app/shared` | `packages/shared` | types shared by both sides | none — `exports` points at `./src/index.ts` |
| `@app/api` | `apps/api` | Express service | `tsup` → `dist/main.js` |
| `@app/web` | `apps/web` | React + RTK + Saga SPA | `vite build` → `dist/` |

```
@app/shared ← @app/api
            ← @app/web
```

`api` and `web` never import each other. Both may import `shared`; `shared` imports nothing.

## Buckets by package

- `shared` — `types/` only.
- `api` — `app/` (the Express instance, no `listen`), `routes/`, `services/`. Entry is
  `src/main.ts`, which binds the port and is the only file that does.
- `web` — the Redux layout from [`redux.md`](./redux.md). Entry is `src/main.tsx`.

## The `@app/*` scope is a placeholder

It exists so the template runs. Renaming it is the first step of starting a real project, along with
`name` in the root `package.json` and the zone names in `.fallowrc.json`.

## The example domain is disposable

`Todo` and its slice, saga, routes, and components exist to prove the toolchain works end to end —
they are the scaffold's own test. Delete them once real domain code lands; do not build on top of
them.