import { randomUUID } from "node:crypto";
import { type CreateTodo, type Todo, TodoStatus, type UpdateTodo } from "@app/shared";

export interface TodosService {
  readonly list: () => readonly Todo[];
  readonly find: (id: string) => Todo | undefined;
  readonly create: (input: CreateTodo) => Todo;
  readonly update: (id: string, input: UpdateTodo) => Todo | undefined;
  readonly remove: (id: string) => boolean;
}

// A factory, not module-level state: every `createApp()` gets its own store, so tests start clean
// without a reset hook. Swap the body for a real repository — the interface is the seam.
export function createTodosService(): TodosService {
  let todos: readonly Todo[] = [];

  function find(id: string): Todo | undefined {
    return todos.find((todo) => todo.id === id);
  }

  return {
    list: () => todos,
    find,
    create: (input) => {
      const todo: Todo = { id: randomUUID(), title: input.title, status: TodoStatus.Active };
      todos = [...todos, todo];
      return todo;
    },
    update: (id, input) => {
      const existing = find(id);

      if (existing === undefined) {
        return undefined;
      }

      const updated: Todo = {
        ...existing,
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.status === undefined ? {} : { status: input.status }),
      };

      todos = todos.map((todo) => (todo.id === id ? updated : todo));

      return updated;
    },
    remove: (id) => {
      const remaining = todos.filter((todo) => todo.id !== id);
      const removed = remaining.length < todos.length;
      todos = remaining;
      return removed;
    },
  };
}
