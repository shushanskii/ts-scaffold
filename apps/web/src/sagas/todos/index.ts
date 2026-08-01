import { type Todo, TodoStatus } from "@app/shared";
import { all, put, takeLatest } from "redux-saga/effects";
import { fetchRequested, fetchSucceeded } from "#reducers/todos";

// Stands in for a real API call so the scaffold has no network dependency.
const seed: readonly Todo[] = [
  { id: "todo-1", title: "read the conventions", status: TodoStatus.Done },
  { id: "todo-2", title: "add a package", status: TodoStatus.Active },
];

function* fetchTodos() {
  yield put(fetchSucceeded(seed));
}

export function* rootSaga() {
  yield all([takeLatest(fetchRequested.type, fetchTodos)]);
}
