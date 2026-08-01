import { z } from "zod";
import { TodoStatus } from "#types/todo";

// Wire formats live here, not in `types/`: a schema is runtime behaviour, and `types/` holds only
// types. The request DTOs are inferred from the schemas, so validation and types cannot drift.

export const createTodoSchema = z.object({
  title: z.string().trim().min(1),
});

export const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    status: z.enum(TodoStatus).optional(),
  })
  // An all-optional object accepts `{}`, which would report success while changing nothing.
  .refine((update) => update.title !== undefined || update.status !== undefined, {
    message: "at least one of title or status is required",
  });

export type CreateTodo = z.infer<typeof createTodoSchema>;
export type UpdateTodo = z.infer<typeof updateTodoSchema>;
