import { type Todo, TodoStatus } from "@app/shared";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TodoList } from "#components/TodoList";

const todos: readonly Todo[] = [
  { id: "todo-1", title: "read the conventions", status: TodoStatus.Done },
  { id: "todo-2", title: "add a package", status: TodoStatus.Active },
];

function renderList() {
  const handleToggle = vi.fn();
  const handleRemove = vi.fn();

  return {
    handleToggle,
    handleRemove,
    ...render(<TodoList onRemove={handleRemove} onToggle={handleToggle} todos={todos} />),
  };
}

describe("TodoList", () => {
  it("reports the clicked todo, not just its id", () => {
    const { getByText, handleToggle, asFragment } = renderList();

    fireEvent.click(getByText("add a package"));

    // The whole todo travels up so the saga can flip the status without reading state.
    expect(handleToggle).toHaveBeenCalledExactlyOnceWith(todos[1]);
    expect(asFragment()).toMatchSnapshot();
  });

  it("reports removals separately from toggles", () => {
    const { getByLabelText, handleRemove, handleToggle } = renderList();

    fireEvent.click(getByLabelText("remove read the conventions"));

    expect(handleRemove).toHaveBeenCalledExactlyOnceWith(todos[0]);
    expect(handleToggle).not.toHaveBeenCalled();
  });
});
