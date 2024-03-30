import { randomUUID } from "node:crypto";

import { Database } from "./database.js";
import { buildRoutePath } from "./utils/build-route-path.js";

const database = new Database();
export const routes = [
  {
    method: "GET",
    path: buildRoutePath("/tasks"),
    handler: (req, res) => {
      const { search } = req.query;

      const tasks = database.select("tasks", {
        title: search,
        description: search,
      });
      return res.json(tasks);
    },
  },
  {
    method: "POST",
    path: buildRoutePath("/tasks"),
    middlewares: [validateTitleAndDescription],
    handler: (req, res) => {
      const { title, description } = req.body;
      const task = {
        id: randomUUID(),
        title,
        description,
        created_at: new Date(),
        updated_at: new Date(),
        completed_at: null,
      };

      database.insert("tasks", task);
      return res.writeHead(201).json(task);
    },
  },
  {
    method: "PUT",
    path: buildRoutePath("/tasks/:id"),
    middlewares: [verifyTaskExistence, validateTitleOrDescription],
    handler: (req, res) => {
      const { id } = req.params;
      const { title, description } = req.body;
      const [task] = database.select("tasks", { id });
      const updatedTask = {
        ...task,
        title: title ?? task.title,
        description: description ?? task.description,
        updated_at: new Date(),
      };

      database.update("tasks", id, updatedTask);
      return res.json(updatedTask);
    },
  },
  {
    method: "DELETE",
    path: buildRoutePath("/tasks/:id"),
    middlewares: [verifyTaskExistence],
    handler: (req, res) => {
      const { id } = req.params;

      database.delete("tasks", id);
      return res.writeHead(204).end();
    },
  },
  {
    method: "PATCH",
    path: buildRoutePath("/tasks/:id/complete"),
    middlewares: [verifyTaskExistence],
    handler: (req, res) => {
      const { id } = req.params;
      const [task] = database.select("tasks", { id });
      const updatedTask = {
        ...task,
        updated_at: new Date(),
        completed_at: task.completed_at ? null : new Date(),
      };

      database.update("tasks", id, updatedTask);
      return res.json(updatedTask);
    },
  },
];

function verifyTaskExistence(req, res) {
  const { id } = req.params;

  const [task] = database.select("tasks", { id });
  if (!task) {
    return res.writeHead(404).json({ message: "Task not found" });
  }
}

function validateTitleAndDescription(req, res) {
  const { title, description } = req.body;

  if (!title) {
    return res.writeHead(400).json({ message: "Task title is missing" });
  }

  if (!description) {
    return res.writeHead(400).json({ message: "Task description is missing" });
  }
}

function validateTitleOrDescription(req, res) {
  const { title, description } = req.body;

  if (!title && !description) {
    return res
      .writeHead(400)
      .json({ message: "At least title or description required" });
  }
}
