import { useEffect } from "react";
import { TodoForm } from "#components/TodoForm";
import { TodoList } from "#components/TodoList";
import { useTodos } from "#hooks/useTodos";

export function App() {
  const { todos, remaining, loading, error, actions } = useTodos();

  useEffect(() => {
    actions.load();
  }, [actions]);

  if (loading) {
    return <p>Loading…</p>;
  }

  return (
    <>
      <TodoForm onSubmit={actions.create} />
      {error === undefined ? null : <p role="alert">{error}</p>}
      <p>{remaining} left</p>
      <TodoList onRemove={actions.remove} onToggle={actions.toggle} todos={todos} />
    </>
  );
}
