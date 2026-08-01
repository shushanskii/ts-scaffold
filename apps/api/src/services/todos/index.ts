import { randomUUID } from "node:crypto";
import { type Todo, TodoStatus } from "@app/shared";

const todos: Todo[] = [];

export function listTodos(): readonly Todo[] {
  return todos;
}

export function addTodo(title: string): Todo {
  const todo: Todo = { id: randomUUID(), title, status: TodoStatus.Active };
  todos.push(todo);
  return todo;
}
