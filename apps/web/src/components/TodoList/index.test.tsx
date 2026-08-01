import { type Todo, TodoStatus } from "@app/shared";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TodoList } from "#components/TodoList";

const todos: readonly Todo[] = [
  { id: "todo-1", title: "read the conventions", status: TodoStatus.Done },
  { id: "todo-2", title: "add a package", status: TodoStatus.Active },
];

describe("TodoList", () => {
  it("renders every todo and reports clicks by id", () => {
    const handleToggle = vi.fn();

    const { getByText, asFragment } = render(<TodoList todos={todos} onToggle={handleToggle} />);

    expect(getByText("read the conventions")).toBeInTheDocument();

    fireEvent.click(getByText("add a package"));

    expect(handleToggle).toHaveBeenCalledExactlyOnceWith("todo-2");
    expect(asFragment()).toMatchSnapshot();
  });
});
