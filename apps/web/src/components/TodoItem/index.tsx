import { type Todo, TodoStatus } from "@app/shared";
import { memo } from "react";
import styled from "styled-components";

const Item = styled.li<{ $done: boolean }>`
  cursor: pointer;
  padding: 4px 0;
  text-decoration: ${({ $done }) => ($done ? "line-through" : "none")};
`;

interface TodoItemProps {
  readonly todo: Todo;
  readonly onToggle: (id: string) => void;
}

export const TodoItem = memo(function TodoItem({ todo, onToggle }: TodoItemProps) {
  function handleClick() {
    onToggle(todo.id);
  }

  return (
    <Item $done={todo.status === TodoStatus.Done} onClick={handleClick}>
      {todo.title}
    </Item>
  );
});
