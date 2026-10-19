import { type Todo, TodoStatus } from "@app/shared";
import { memo } from "react";
import styled from "styled-components";

const Item = styled.li`
  align-items: center;
  display: flex;
  gap: 8px;
  padding: 4px 0;
`;

const Title = styled.span<{ $done: boolean }>`
  cursor: pointer;
  flex: 1;
  text-decoration: ${({ $done }) => ($done ? "line-through" : "none")};
`;

const DueDate = styled.small`
  color: #6b7280;
  font-variant-numeric: tabular-nums;
`;

interface TodoItemProps {
  readonly todo: Todo;
  readonly onToggle: (todo: Todo) => void;
  readonly onRemove: (todo: Todo) => void;
}

export const TodoItem = memo(function TodoItem({ todo, onToggle, onRemove }: TodoItemProps) {
  function handleToggle() {
    onToggle(todo);
  }

  function handleRemove() {
    onRemove(todo);
  }

  return (
    <Item>
      <Title $done={todo.status === TodoStatus.Done} onClick={handleToggle}>
        {todo.title}
      </Title>
      {/*
        Printed, not judged. Whether a date has passed is decided by the service's clock and nowhere
        else; a second copy of that comparison here would be a second clock to disagree with.
      */}
      {todo.dueDate === undefined ? null : <DueDate>due {todo.dueDate}</DueDate>}
      <button aria-label={`remove ${todo.title}`} onClick={handleRemove} type="button">
        ×
      </button>
    </Item>
  );
});
