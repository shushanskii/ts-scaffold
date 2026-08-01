import type { Todo } from "@app/shared";
import { memo } from "react";
import styled from "styled-components";
import { TodoItem } from "#components/TodoItem";

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

interface TodoListProps {
  readonly todos: readonly Todo[];
  readonly onToggle: (id: string) => void;
}

export const TodoList = memo(function TodoList({ todos, onToggle }: TodoListProps) {
  return (
    <List>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} />
      ))}
    </List>
  );
});
