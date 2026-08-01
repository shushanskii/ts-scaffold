import express, { type Express } from "express";
import { todosRouter } from "#routes/todos";

// Kept separate from `main.ts` so tests can exercise the app without binding a port.
export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use("/todos", todosRouter);

  return app;
}
