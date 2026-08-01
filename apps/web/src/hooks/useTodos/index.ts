import type { Todo } from "@app/shared";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRequested, toggled } from "#reducers/todos";
import type { AppDispatch, RootState } from "#store";

interface TodosActions {
  readonly fetch: () => void;
  readonly toggle: (id: string) => void;
}

interface UseTodos {
  readonly todos: readonly Todo[];
  readonly loading: boolean;
  readonly actions: TodosActions;
}

export function useTodos(): UseTodos {
  const dispatch = useDispatch<AppDispatch>();
  const todos = useSelector((state: RootState) => state.todos.items);
  const loading = useSelector((state: RootState) => state.todos.loading);

  // Memoized once so leaf components can be `memo`-ed with stable refs.
  const actions = useMemo<TodosActions>(
    () => ({
      fetch: () => dispatch(fetchRequested()),
      toggle: (id: string) => dispatch(toggled(id)),
    }),
    [dispatch],
  );

  return { todos, loading, actions };
}
