import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "#app";

describe("todos routes", () => {
  it("creates a todo and lists it back", async () => {
    const app = createApp();

    const created = await request(app).post("/todos").send({ title: "read conventions" });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title: "read conventions", status: "active" });

    const listed = await request(app).get("/todos");

    expect(listed.status).toBe(200);
    expect(listed.body).toContainEqual(created.body);
  });

  it("rejects a todo without a title", async () => {
    const app = createApp();

    const response = await request(app).post("/todos").send({ title: "  " });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "title is required" });
  });
});
