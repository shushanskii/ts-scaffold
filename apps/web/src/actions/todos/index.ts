import type { TodoStatus } from "@app/shared";

// Saga entry points, and the only actions the UI is allowed to dispatch. Declared by hand so the
// types stay enum members; slice actions are generated separately and belong to sagas.
// Values are namespaced because Redux action types share one global space.
export enum TodosActions {
  Load = "todos/load",
  Toggle = "todos/toggle",
}

// `type`, not `interface`: Redux's `UnknownAction` carries an index signature, and TypeScript
// grants an implicit one to type aliases only — an interface here fails to dispatch.
export type LoadTodos = {
  readonly type: TodosActions.Load;
  readonly payload: {
    readonly status?: TodoStatus;
  };
};

export type ToggleTodo = {
  readonly type: TodosActions.Toggle;
  readonly payload: string;
};

export function loadTodos(payload: LoadTodos["payload"] = {}): LoadTodos {
  return { type: TodosActions.Load, payload };
}

export function toggleTodo(payload: string): ToggleTodo {
  return { type: TodosActions.Toggle, payload };
}
