import express, { type Express } from "express";
import { createTodosRouter } from "#routes/todos";
import { createTodosService } from "#services/todos";

// Kept separate from `main.ts` so tests can exercise the app without binding a port, and so each
// call gets an isolated service. `now` reaches the service for the same reason: a test decides
// what today is instead of finding out.
export function createApp(now: () => Date = () => new Date()): Express {
  const app = express();

  app.use(express.json());
  app.use("/todos", createTodosRouter(createTodosService(now)));

  return app;
}
