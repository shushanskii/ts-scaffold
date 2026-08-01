import { createTodoSchema, updateTodoSchema } from "@app/shared";
import { type Request, type Response, Router } from "express";
import { type ZodError, z } from "zod";
import type { TodosService } from "#services/todos";

function badRequest(res: Response, error: ZodError): void {
  const { formErrors, fieldErrors } = z.flattenError(error);

  res.status(400).json({ error: "invalid request body", formErrors, fieldErrors });
}

export function createTodosRouter(service: TodosService): Router {
  function handleList(_req: Request, res: Response): void {
    res.json(service.list());
  }

  function handleRead(req: Request, res: Response): void {
    const todo = service.find(String(req.params.id));

    if (todo === undefined) {
      res.status(404).json({ error: "todo not found" });
      return;
    }

    res.json(todo);
  }

  function handleCreate(req: Request, res: Response): void {
    const parsed = createTodoSchema.safeParse(req.body);

    if (!parsed.success) {
      badRequest(res, parsed.error);
      return;
    }

    res.status(201).json(service.create(parsed.data));
  }

  function handleUpdate(req: Request, res: Response): void {
    const parsed = updateTodoSchema.safeParse(req.body);

    if (!parsed.success) {
      badRequest(res, parsed.error);
      return;
    }

    const updated = service.update(String(req.params.id), parsed.data);

    if (updated === undefined) {
      res.status(404).json({ error: "todo not found" });
      return;
    }

    res.json(updated);
  }

  function handleDelete(req: Request, res: Response): void {
    if (!service.remove(String(req.params.id))) {
      res.status(404).json({ error: "todo not found" });
      return;
    }

    res.status(204).end();
  }

  const router = Router();

  router.get("/", handleList);
  router.get("/:id", handleRead);
  router.post("/", handleCreate);
  router.patch("/:id", handleUpdate);
  router.delete("/:id", handleDelete);

  return router;
}
