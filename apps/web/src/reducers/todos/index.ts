import { type Todo, TodoStatus } from "@app/shared";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface TodosState {
  readonly items: readonly Todo[];
  readonly loading: boolean;
}

export const initialState: TodosState = {
  items: [],
  loading: false,
};

// These actions are dispatched by sagas only — never by a component or a hook.
const todosSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    loadStarted(state) {
      state.loading = true;
    },
    loaded(state, action: PayloadAction<readonly Todo[]>) {
      // Copied, not aliased: the state is `readonly`, an Immer draft is not.
      state.items = [...action.payload];
      state.loading = false;
    },
    toggled(state, action: PayloadAction<string>) {
      const todo = state.items.find((item) => item.id === action.payload);

      if (todo === undefined) {
        return;
      }

      todo.status = todo.status === TodoStatus.Done ? TodoStatus.Active : TodoStatus.Done;
    },
  },
});

export const { loadStarted, loaded, toggled } = todosSlice.actions;
export const todosReducer = todosSlice.reducer;
