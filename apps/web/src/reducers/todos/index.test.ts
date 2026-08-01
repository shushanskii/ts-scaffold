import { type Todo, TodoStatus } from "@app/shared";
import { describe, expect, it } from "vitest";
import {
  addTodo,
  initialState,
  removeTodo,
  replaceTodo,
  setError,
  setLoading,
  setTodos,
  todosReducer,
} from "#reducers/todos";

const active: Todo = { id: "todo-1", title: "read the conventions", status: TodoStatus.Active };
const done: Todo = { id: "todo-2", title: "add a package", status: TodoStatus.Done };

describe("todosReducer", () => {
  it("sets the loading flag without touching anything else", () => {
    const previous = { ...initialState, items: [active], error: "boom" };

    const next = todosReducer(previous, setLoading(true));

    expect(next.loading).toBe(true);
    expect(next.items).toEqual([active]);
    expect(next.error).toBe("boom");
    expect(previous.loading).toBe(false);
  });

  it("sets and clears the error", () => {
    const withError = todosReducer(initialState, setError("network down"));

    expect(withError.error).toBe("network down");
    expect(todosReducer(withError, setError(undefined)).error).toBeUndefined();
  });

  it("replaces the whole list", () => {
    const next = todosReducer(initialState, setTodos([active, done]));

    expect(next.items).toEqual([active, done]);
    expect(initialState.items).toEqual([]);
  });

  it("appends a todo", () => {
    const previous = { ...initialState, items: [active] };

    expect(todosReducer(previous, addTodo(done)).items).toEqual([active, done]);
    expect(previous.items).toEqual([active]);
  });

  it("swaps a todo for the version the server returned", () => {
    const previous = { ...initialState, items: [active, done] };
    const updated: Todo = { ...active, status: TodoStatus.Done };

    const next = todosReducer(previous, replaceTodo(updated));

    expect(next.items[0]).toEqual(updated);
    expect(next.items[1]).toEqual(done);
    expect(previous.items[0]?.status).toBe(TodoStatus.Active);
  });

  it("drops a todo by id", () => {
    const previous = { ...initialState, items: [active, done] };

    expect(todosReducer(previous, removeTodo(active.id)).items).toEqual([done]);
  });

  it("returns the same state object when nothing matches", () => {
    const previous = { ...initialState, items: [active] };

    expect(todosReducer(previous, replaceTodo({ ...active, id: "missing" }))).toBe(previous);
    expect(todosReducer(previous, removeTodo("missing"))).toBe(previous);
  });
});
