import { useEffect } from "react";
import { TodoList } from "#components/TodoList";
import { useTodos } from "#hooks/useTodos";

export function App() {
  const { todos, loading, actions } = useTodos();

  useEffect(() => {
    actions.fetch();
  }, [actions]);

  if (loading) {
    return <p>Loading…</p>;
  }

  return <TodoList todos={todos} onToggle={actions.toggle} />;
}
