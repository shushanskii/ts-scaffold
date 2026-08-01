# Conventions — core

The **HOW** for any TypeScript monorepo in this workspace: structure, tooling, tests, gates.
Stack-agnostic — nothing here names a framework, a package, or a domain term.

React-specific rules live in [`react.md`](./react.md); anything tied to this particular project
lives in [`project.md`](./project.md).

## Stack

- **TypeScript** (strict) throughout
- **pnpm** workspaces (monorepo) + **Turborepo** (task running/caching)
- **Biome** for formatting + linting
- **Vitest** for tests
- **fallow** for structural analysis / dead code / architecture boundaries

## Monorepo mechanics

- **Workspaces:** `packages/*` (libraries), `examples/*` (demos). Declared in `pnpm-workspace.yaml`.
- **Shared dependency versions** live once in the pnpm `catalog:` (`pnpm-workspace.yaml`). Packages
  reference them as `"some-dep": "catalog:"` — never hard-code a version in a package.
- **Cross-package imports use the package name**, never a relative path across packages:
  `import { Todo } from "@scope/core"` — not `../../core/src`.
- **Intra-package imports use subpath imports** (`#*` → `./src/*/index.ts`, resolving to each
  entity's `index.ts`), declared in each package's `imports` field:
  `import { x } from "#reducers/todo"` — not `../../reducers/todo`.
- **A package's public API is its `exports`.** Only what a package's `exports` (its `src/index.ts`
  barrel) exposes may be imported by others; internals stay private.
- Shared runtime deps are **`peerDependencies`** + a catalog `devDependency`, never bundled.

## Package internals

Within each package's `src/`, every entity is a **directory** containing an `index.ts(x)` — never a
flat `Thing.ts`:

```
packages/<pkg>/src/
├── index.ts(x)               # the package's public barrel (exports)
├── types/<entity>/index.ts   # enums, interfaces, unions — pure types, no behaviour
├── reducers/<entity>/index.ts# reducer + selectors + initialState (behaviour, no framework)
├── hooks/<entity>/index.ts   # framework hooks that consume reducers
└── components/<Name>/index.tsx
```

- Not every package has every bucket — use the buckets a package's role needs. A logic-only package
  may have just `types/`/`reducers/`; a UI package just `components/`/`hooks/`.
- **Component** directories are `PascalCase`; everything else is named after its entity
  (`hooks/useTodos/`, `reducers/todo/`, `types/todo/`).

### Layer direction (within a package)

`types → reducers → hooks → components`. A layer may import only from layers to its left. Notably
**components may not import `reducers/` directly** — state logic reaches the UI through a hook. This
is enforced by fallow boundary zones as each package grows.

## Data modeling

- **No string literals as domain values.** Use `enum` (e.g. `TodoStatus`). Reducer action `type`
  fields must be enum members, not raw strings.
- **All types and enums live in `types/<entity>`**, separate from behaviour.
- State interfaces are `readonly`; produce new state with spreads, never mutate.
- Business logic lives in a **pure reducer** (`reducers/`), free of framework imports.

## Testing

- **Vitest**. Test globals are **off** — import `describe`/`it`/`expect`/`vi` explicitly.
- **Co-locate** tests as `index.test.ts(x)` inside the entity folder next to `index.ts(x)`.
- **Reducer/pure tests**: build state as literals with fixed ids (don't go through
  `crypto.randomUUID`), and assert immutability + reference stability on no-ops (`toBe(prevState)`).

## Verification & the gate

Before considering any change done, run from the **repo root**:

```bash
pnpm run audit   # turbo typecheck + biome check + fallow dead-code (read-only gate)
pnpm test        # turbo test (vitest per package)
```

- **`pnpm run audit`** is the single verification gate: `turbo run typecheck` (types, per package) →
  `biome check .` (format + lint, whole repo) → `fallow dead-code --fail-on-issues` (dead code +
  architecture boundaries, whole workspace). Green `audit` = types, style, and structure all pass.
- **`pnpm run fix`** = `biome check --write .` (auto-fix lint + format). fallow's own fixes remove
  code, so run `fallow fix` deliberately — never as part of `fix`.
- Biome: 2-space indent, double quotes, semicolons, `useNamingConvention` with `strictCase: false`
  (acronyms like HTML/URL/ID and DOM interface augmentation allowed). Let Biome own import ordering.
- **Always use block statements.** Every `if`/`else`/`for`/`while` body is wrapped in braces with
  the body on its own line — never a single-line `if (x) doThing()`. Enforced by Biome's
  `useBlockStatements`.

## fallow (structural analysis)

fallow runs as both an MCP server (interactive) and inside the gate:

- **`fallow dead-code --fail-on-issues`** — expect `No issues found`: no unused exports/files/deps,
  no unresolved imports, no circular deps, no boundary violations.
- **`guard`** (MCP) — check architecture rules that apply to a file **before editing it**.
- Boundaries between packages live in the root `.fallowrc.json`; the concrete package graph is
  documented in [`project.md`](./project.md).
- Other useful tools: `find_dupes`, `check_health`, `inspect_target` / `impact`.

## Git & commits

- **Conventional Commits**: `type(scope): subject`. Types: `feat`, `fix`, `chore`, `docs`,
  `refactor`, `test`, `style`, `perf`. Scope lowercase; subject imperative, lowercase, no period.
- Default branch is `main`; branch off it rather than committing straight to `main`.
- Enforced automatically: **commitlint** on a **husky** `commit-msg` hook rejects non-conforming
  messages; the **`pre-commit`** hook runs `pnpm run audit`. Hooks activate after `pnpm install`.

```
feat(core): add field validation rules
fix(ui): reset the input on submit
chore(repo): set up pnpm + turborepo monorepo
```