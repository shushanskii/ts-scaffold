import { type Request, type Response, Router } from "express";
import { addTodo, listTodos } from "#services/todos";

function handleList(_req: Request, res: Response): void {
  res.json(listTodos());
}

function handleCreate(req: Request, res: Response): void {
  const { title } = req.body as { title?: string };

  if (typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  res.status(201).json(addTodo(title));
}

export const todosRouter = Router();

todosRouter.get("/", handleList);
todosRouter.post("/", handleCreate);
