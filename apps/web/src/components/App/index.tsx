import { useEffect } from "react";
import { TodoForm } from "#components/TodoForm";
import { TodoList } from "#components/TodoList";
import { useTodos } from "#hooks/useTodos";

export function App() {
  const { todos, remaining, loading, error, filter, actions } = useTodos();

  useEffect(() => {
    actions.load();
  }, [actions]);

  // The control reads its own state back through the hook, so a reload from elsewhere cannot leave
  // the button saying the opposite of what is on screen.
  const overdue = filter.overdue === true;

  function handleToggleOverdue() {
    actions.load(overdue ? {} : { overdue: true });
  }

  if (loading) {
    return <p>Loading…</p>;
  }

  return (
    <>
      <TodoForm onSubmit={actions.create} />
      {error === undefined ? null : <p role="alert">{error}</p>}
      <button onClick={handleToggleOverdue} type="button">
        {overdue ? "show all" : "show overdue"}
      </button>
      {/* `remaining` counts what is on screen, so under the filter that number is not "left". */}
      <p>{overdue ? `${todos.length} overdue` : `${remaining} left`}</p>
      <TodoList onRemove={actions.remove} onToggle={actions.toggle} todos={todos} />
    </>
  );
}
