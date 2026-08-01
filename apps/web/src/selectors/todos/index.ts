import { type Todo, TodoStatus } from "@app/shared";
import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "#store";

// The only way the UI reads Redux state. Typed against `RootState`, so selectors sit after
// `store/` in the layer order.

// Plain reads: they return what is already in the store, so there is nothing to memoize.
export function selectTodos(state: RootState): readonly Todo[] {
  return state.todos.items;
}

export function selectTodosLoading(state: RootState): boolean {
  return state.todos.loading;
}

// Derived: `createSelector` recomputes only when `items` changes identity. Without it every
// render would recompute, and any selector returning a fresh array or object would hand consumers
// a new reference each time and defeat `memo`.
export const selectRemainingCount = createSelector([selectTodos], (todos) => {
  return todos.filter((todo) => todo.status === TodoStatus.Active).length;
});
