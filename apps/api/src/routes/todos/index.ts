import { todoContract } from "@app/shared";
import { type Request, type Response, Router } from "express";
import { sendInvalidBody, sendNotFound } from "#http";
import type { TodosService } from "#services/todos";

const { list, read, create, update, remove } = todoContract;

export function createTodosRouter(service: TodosService): Router {
  function handleList(_req: Request, res: Response): void {
    res.status(list.status).json(service.list());
  }

  function handleRead(req: Request, res: Response): void {
    const todo = service.find(String(req.params.id));

    if (todo === undefined) {
      sendNotFound(res, "todo");
      return;
    }

    res.status(read.status).json(todo);
  }

  function handleCreate(req: Request, res: Response): void {
    const parsed = create.body.safeParse(req.body);

    if (!parsed.success) {
      sendInvalidBody(res, parsed.error);
      return;
    }

    res.status(create.status).json(service.create(parsed.data));
  }

  function handleUpdate(req: Request, res: Response): void {
    const parsed = update.body.safeParse(req.body);

    if (!parsed.success) {
      sendInvalidBody(res, parsed.error);
      return;
    }

    const updated = service.update(String(req.params.id), parsed.data);

    if (updated === undefined) {
      sendNotFound(res, "todo");
      return;
    }

    res.status(update.status).json(updated);
  }

  function handleDelete(req: Request, res: Response): void {
    if (!service.remove(String(req.params.id))) {
      sendNotFound(res, "todo");
      return;
    }

    res.status(remove.status).end();
  }

  const router = Router();

  // Patterns come from the contract, so a route can never answer at an address the client is not
  // calling.
  router.get(list.pattern, handleList);
  router.get(read.pattern, handleRead);
  router.post(create.pattern, handleCreate);
  router.patch(update.pattern, handleUpdate);
  router.delete(remove.pattern, handleDelete);

  return router;
}
