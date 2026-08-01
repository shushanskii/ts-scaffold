import { type Todo, TodoStatus } from "@app/shared";
import { all, call, put, takeEvery, takeLatest } from "redux-saga/effects";
import {
  type CreateTodoAction,
  type DeleteTodoAction,
  type LoadTodosAction,
  TodosActions,
  type ToggleTodoAction,
} from "#actions/todos";
import { todosApi } from "#api/todos";
import { addTodo, removeTodo, replaceTodo, setError, setLoading, setTodos } from "#reducers/todos";

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unexpected error";
}

// Note the absence of `finally`: redux-saga runs it on cancellation too, so a `takeLatest` that
// superseded this task would clear the loading flag the newer request had just raised.
function* loadTodos(action: LoadTodosAction) {
  yield put(setLoading(true));
  yield put(setError(undefined));

  try {
    const todos: readonly Todo[] = yield call(todosApi.list);
    const { status } = action.payload;

    yield put(setTodos(status === undefined ? todos : todos.filter((t) => t.status === status)));
    yield put(setLoading(false));
  } catch (error) {
    yield put(setError(toMessage(error)));
    yield put(setLoading(false));
  }
}

function* createTodo(action: CreateTodoAction) {
  try {
    const todo: Todo = yield call(todosApi.create, { title: action.payload.title });

    yield put(addTodo(todo));
  } catch (error) {
    yield put(setError(toMessage(error)));
  }
}

function* toggleTodo(action: ToggleTodoAction) {
  const { id, status } = action.payload;
  const next = status === TodoStatus.Done ? TodoStatus.Active : TodoStatus.Done;

  try {
    const updated: Todo = yield call(todosApi.update, id, { status: next });

    yield put(replaceTodo(updated));
  } catch (error) {
    yield put(setError(toMessage(error)));
  }
}

function* deleteTodo(action: DeleteTodoAction) {
  try {
    yield call(todosApi.remove, action.payload.id);

    yield put(removeTodo(action.payload.id));
  } catch (error) {
    yield put(setError(toMessage(error)));
  }
}

export function* rootSaga() {
  yield all([
    takeLatest(TodosActions.Load, loadTodos),
    takeEvery(TodosActions.Create, createTodo),
    takeEvery(TodosActions.Toggle, toggleTodo),
    takeEvery(TodosActions.Delete, deleteTodo),
  ]);
}
