import { type ChangeEvent, type FormEvent, memo, useState } from "react";
import styled from "styled-components";

const Form = styled.form`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

interface TodoFormProps {
  readonly onSubmit: (title: string) => void;
}

export const TodoForm = memo(function TodoForm({ onSubmit }: TodoFormProps) {
  // The draft title is UI state, not domain state: it never leaves this component until submit,
  // so it stays in `useState` rather than the store.
  const [title, setTitle] = useState("");

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (title.trim().length === 0) {
      return;
    }

    onSubmit(title);
    setTitle("");
  }

  return (
    <Form onSubmit={handleSubmit}>
      <input
        aria-label="new todo"
        onChange={handleChange}
        placeholder="what needs doing?"
        value={title}
      />
      <button type="submit">add</button>
    </Form>
  );
});
