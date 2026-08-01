import { type Todo, TodoStatus } from "@app/shared";
import { all, put, takeEvery, takeLatest } from "redux-saga/effects";
import { type LoadTodos, TodosActions, type ToggleTodo } from "#actions/todos";
import { loaded, loadStarted, toggled } from "#reducers/todos";

// Stands in for a real API call so the scaffold has no network dependency.
const seed: readonly Todo[] = [
  { id: "todo-1", title: "read the conventions", status: TodoStatus.Done },
  { id: "todo-2", title: "add a package", status: TodoStatus.Active },
];

function* fetchTodos(action: LoadTodos) {
  yield put(loadStarted());

  const { status } = action.payload;
  const items = status === undefined ? seed : seed.filter((todo) => todo.status === status);

  yield put(loaded(items));
}

function* toggleStatus(action: ToggleTodo) {
  yield put(toggled(action.payload));
}

export function* rootSaga() {
  yield all([
    takeLatest(TodosActions.Load, fetchTodos),
    takeEvery(TodosActions.Toggle, toggleStatus),
  ]);
}
