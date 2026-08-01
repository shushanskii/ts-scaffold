export enum TodoStatus {
  Active = "active",
  Done = "done",
}

export interface Todo {
  readonly id: string;
  readonly title: string;
  readonly status: TodoStatus;
}
