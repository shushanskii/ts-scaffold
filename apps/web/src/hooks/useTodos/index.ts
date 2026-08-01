import type { Todo, TodoStatus } from "@app/shared";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createTodo, deleteTodo, loadTodos, toggleTodo } from "#actions/todos";
import {
  selectRemainingCount,
  selectTodos,
  selectTodosError,
  selectTodosLoading,
} from "#selectors/todos";
import type { AppDispatch } from "#store";

interface UseTodosActions {
  readonly load: (status?: TodoStatus) => void;
  readonly create: (title: string) => void;
  readonly toggle: (todo: Todo) => void;
  readonly remove: (todo: Todo) => void;
}

interface UseTodos {
  readonly todos: readonly Todo[];
  readonly remaining: number;
  readonly loading: boolean;
  readonly error: string | undefined;
  readonly actions: UseTodosActions;
}

// Reads through selectors, writes only by dispatching intents from `actions/todos`. Slice actions
// are a saga's business; nothing above this line may reach them.
export function useTodos(): UseTodos {
  const dispatch = useDispatch<AppDispatch>();
  const todos = useSelector(selectTodos);
  const remaining = useSelector(selectRemainingCount);
  const loading = useSelector(selectTodosLoading);
  const error = useSelector(selectTodosError);

  // Memoized once so leaf components can be `memo`-ed with stable refs. Nothing here closes over
  // `todos`, which is what keeps the reference stable as the data changes.
  const actions = useMemo<UseTodosActions>(
    () => ({
      load: (status?: TodoStatus) => dispatch(loadTodos({ status })),
      create: (title: string) => dispatch(createTodo({ title })),
      toggle: (todo: Todo) => dispatch(toggleTodo({ id: todo.id, status: todo.status })),
      remove: (todo: Todo) => dispatch(deleteTodo({ id: todo.id })),
    }),
    [dispatch],
  );

  return { todos, remaining, loading, error, actions };
}
