import { describe, expect, it } from "vitest";
import { createTodoSchema, updateTodoSchema } from "#schemas/todo";
import { TodoStatus } from "#types/todo";

describe("createTodoSchema", () => {
  it("trims the title", () => {
    const result = createTodoSchema.safeParse({ title: "  read the conventions  " });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ title: "read the conventions" });
  });

  it("rejects a blank title", () => {
    expect(createTodoSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(createTodoSchema.safeParse({}).success).toBe(false);
  });
});

describe("updateTodoSchema", () => {
  it("accepts a partial update", () => {
    const result = updateTodoSchema.safeParse({ status: TodoStatus.Done });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ status: TodoStatus.Done });
  });

  it("rejects an empty update", () => {
    expect(updateTodoSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a status outside the enum", () => {
    expect(updateTodoSchema.safeParse({ status: "archived" }).success).toBe(false);
  });
});
