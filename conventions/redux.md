# Conventions — Redux Toolkit + Saga

State management for React apps. Assumes [`core.md`](./core.md) and [`react.md`](./react.md);
portable to any RTK project.

## Stack additions

- **@reduxjs/toolkit** — the store, slices, and Immer-backed reducers
- **react-redux** — `Provider`, `useSelector`, `useDispatch`
- **redux-saga** — all side effects; the thunk middleware is switched off

## Where core.md bends

`core.md` says reducers are framework-free, action types are enum members, and state is never
mutated. Redux Toolkit satisfies the *intent* of all three while breaking the letter of them, so
those rules do **not** apply inside `reducers/` here:

- **Action types are generated**, not declared. `createSlice({ name: "todos" })` derives
  `"todos/toggled"` and exposes it as `toggled.type`. Never hand-write an action type string, and
  never declare an enum to mirror one — reference `slice.actions` instead.
- **Immer drafts are mutated on purpose.** Inside a `createSlice` reducer, `state.loading = true` is
  the sanctioned style. The `State` interface stays `readonly` for every *consumer*; only the draft
  is writable.
- **`reducers/` imports `@reduxjs/toolkit`.** That is the one framework import allowed in the layer.

Everything else in `core.md` holds — domain values are still enums, state interfaces are still
`readonly`, and business logic still lives in `reducers/`, not in components.

## Buckets

On top of the layers in `core.md`:

```
src/
├── reducers/<entity>/index.ts   # createSlice: state, reducers, exported actions
├── sagas/<entity>/index.ts      # side effects; exports the entity's watcher
├── store/index.ts               # configureStore + saga middleware + RootState types
├── hooks/<entity>/index.ts      # useSelector/useDispatch, wrapped per entity
└── components/<Name>/index.tsx
```

Direction: `types → reducers → sagas → store → hooks → components`.

## Rules

- **A slice exports its reducer and its actions, nothing else.** Assembling them into a store is
  `store/`'s job, so `reducers/` never imports `store/` — that would be a cycle.
- **Sagas own every side effect.** `configureStore` runs with `{ thunk: false }`; if an effect is
  reachable from a component, it belongs in a saga.
- **Components never call `useSelector` or `useDispatch`.** They call a hook from `hooks/` that
  returns state plus a `useMemo`-ed action object, so leaf components stay `memo`-able.
- **Immer's no-op guarantee is a test contract.** A reducer that changes nothing must return the
  identical state object — assert it with `toBe(previous)`.

## Testing

A slice reducer is a pure function, so it is tested exactly as `core.md` describes: build state as
literals with fixed ids, dispatch the action creator, assert the new state, the untouched previous
state, and reference stability on no-ops. No store, no `Provider`, no mocks.