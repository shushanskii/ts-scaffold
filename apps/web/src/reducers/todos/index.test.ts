import { type Todo, TodoStatus } from "@app/shared";
import { describe, expect, it } from "vitest";
import { initialState, loaded, loadStarted, todosReducer, toggled } from "#reducers/todos";

const active: Todo = { id: "todo-1", title: "read the conventions", status: TodoStatus.Active };
const done: Todo = { id: "todo-2", title: "add a package", status: TodoStatus.Done };

describe("todosReducer", () => {
  it("raises the loading flag when a load starts", () => {
    const next = todosReducer(initialState, loadStarted());

    expect(next.loading).toBe(true);
    expect(initialState.loading).toBe(false);
  });

  it("stores loaded todos and clears the loading flag", () => {
    const previous = { ...initialState, loading: true };

    const next = todosReducer(previous, loaded([active]));

    expect(next.items).toEqual([active]);
    expect(next.loading).toBe(false);
    expect(previous.items).toEqual([]);
  });

  it("flips a todo between active and done", () => {
    const previous = { items: [active, done], loading: false };

    const next = todosReducer(previous, toggled(active.id));

    expect(next.items[0]?.status).toBe(TodoStatus.Done);
    expect(next.items[1]).toEqual(done);
    expect(previous.items[0]?.status).toBe(TodoStatus.Active);
  });

  it("returns the same state object for an unknown id", () => {
    const previous = { items: [active], loading: false };

    expect(todosReducer(previous, toggled("missing"))).toBe(previous);
  });
});
