import type { Todo } from "@app/shared";
import type { RootState } from "#store";

// The only way the UI reads Redux state. Typed against `RootState`, so selectors sit after
// `store/` in the layer order.
export function selectTodos(state: RootState): readonly Todo[] {
  return state.todos.items;
}

export function selectTodosLoading(state: RootState): boolean {
  return state.todos.loading;
}
