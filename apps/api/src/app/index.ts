import express, { type Express } from "express";
import { createTodosRouter } from "#routes/todos";
import { createTodosService, type TodosService } from "#services/todos";

// Kept separate from `main.ts` so tests can exercise the app without binding a port, and so each
// call gets an isolated service. `now` reaches the service for the same reason: a test decides
// what today is instead of finding out.
//
// `service` is the seam for a caller that arrives with a store it already filled — `main.ts` seeds
// the rows the dev server shows. Callers that leave it out get the empty store tests assume, so
// seeding never reaches a test.
export function createApp(
  now: () => Date = () => new Date(),
  service: TodosService = createTodosService(now),
): Express {
  const app = express();

  app.use(express.json());
  app.use("/todos", createTodosRouter(service));

  return app;
}
