import { TodoStatus } from "@app/shared";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "#app";

let app: ReturnType<typeof createApp>;

// A fresh app means a fresh service, so no test can see another's todos.
beforeEach(() => {
  app = createApp();
});

async function seedTodo(title: string) {
  const response = await request(app).post("/todos").send({ title });
  return response.body;
}

describe("GET /todos", () => {
  it("starts empty and lists what was created", async () => {
    const empty = await request(app).get("/todos");

    expect(empty.status).toBe(200);
    expect(empty.body).toEqual([]);

    const created = await seedTodo("read the conventions");
    const listed = await request(app).get("/todos");

    expect(listed.body).toEqual([created]);
  });
});

describe("GET /todos/:id", () => {
  it("returns a single todo", async () => {
    const created = await seedTodo("read the conventions");

    const response = await request(app).get(`/todos/${created.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(created);
  });

  it("404s on an unknown id", async () => {
    const response = await request(app).get("/todos/missing");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "todo not found" });
  });
});

describe("POST /todos", () => {
  it("creates an active todo and trims the title", async () => {
    const response = await request(app).post("/todos").send({ title: "  read the conventions  " });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: "read the conventions",
      status: TodoStatus.Active,
    });
    expect(response.body.id).toEqual(expect.any(String));
  });

  it("400s on a blank title", async () => {
    const response = await request(app).post("/todos").send({ title: "  " });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("invalid request body");
    expect(response.body.fieldErrors.title).toBeDefined();
  });
});

describe("PATCH /todos/:id", () => {
  it("updates status and leaves the title alone", async () => {
    const created = await seedTodo("read the conventions");

    const response = await request(app)
      .patch(`/todos/${created.id}`)
      .send({ status: TodoStatus.Done });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...created, status: TodoStatus.Done });
  });

  it("400s on an unknown status", async () => {
    const created = await seedTodo("read the conventions");

    const response = await request(app).patch(`/todos/${created.id}`).send({ status: "archived" });

    expect(response.status).toBe(400);
    expect(response.body.fieldErrors.status).toBeDefined();
  });

  it("400s on an empty body", async () => {
    const created = await seedTodo("read the conventions");

    const response = await request(app).patch(`/todos/${created.id}`).send({});

    expect(response.status).toBe(400);
    // The "at least one field" rule is a schema-level refinement, so it lands in formErrors.
    expect(response.body.formErrors).toContain("at least one of title or status is required");
  });

  it("404s on an unknown id", async () => {
    const response = await request(app).patch("/todos/missing").send({ title: "whatever" });

    expect(response.status).toBe(404);
  });
});

describe("DELETE /todos/:id", () => {
  it("removes the todo and answers 204", async () => {
    const created = await seedTodo("read the conventions");

    const response = await request(app).delete(`/todos/${created.id}`);

    expect(response.status).toBe(204);

    const listed = await request(app).get("/todos");

    expect(listed.body).toEqual([]);
  });

  it("404s on an unknown id", async () => {
    const response = await request(app).delete("/todos/missing");

    expect(response.status).toBe(404);
  });
});
