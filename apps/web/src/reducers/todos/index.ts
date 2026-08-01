import type { Todo } from "@app/shared";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface TodosState {
  readonly items: readonly Todo[];
  readonly loading: boolean;
  readonly error: string | undefined;
}

export const initialState: TodosState = {
  items: [],
  loading: false,
  error: undefined,
};

// Dispatched by sagas only — never by a component or a hook. Named `[verb][Entity]` like any other
// function, and each one does exactly what its name says: no reducer clears a flag on the side.
// Payloads carry what the server returned, so the store never guesses the outcome of a request.
const todosSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | undefined>) {
      state.error = action.payload;
    },
    setTodos(state, action: PayloadAction<readonly Todo[]>) {
      // Copied, not aliased: the state is `readonly`, an Immer draft is not.
      state.items = [...action.payload];
    },
    addTodo(state, action: PayloadAction<Todo>) {
      state.items.push(action.payload);
    },
    replaceTodo(state, action: PayloadAction<Todo>) {
      const index = state.items.findIndex((item) => item.id === action.payload.id);

      if (index === -1) {
        return;
      }

      state.items[index] = action.payload;
    },
    removeTodo(state, action: PayloadAction<string>) {
      const remaining = state.items.filter((item) => item.id !== action.payload);

      if (remaining.length === state.items.length) {
        return;
      }

      state.items = remaining;
    },
  },
});

export const { setLoading, setError, setTodos, addTodo, replaceTodo, removeTodo } =
  todosSlice.actions;
export const todosReducer = todosSlice.reducer;
