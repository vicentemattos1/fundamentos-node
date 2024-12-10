import { randomUUID } from "node:crypto"
import { Database } from "./database.js"
import { buildRoutePath } from "./utils/build-route-path.js"
import { parse } from "csv-parse"
import fs from "node:fs"

const database = new Database()

export const routes = [
  {
    method: "GET",
    path: buildRoutePath("/tasks"),
    handler: (req, res) => {
      const tasks = database.select("tasks")

      return res.end(JSON.stringify(tasks))
    },
  },
  {
    method: "POST",
    path: buildRoutePath("/tasks"),
    handler: (req, res) => {
      const { title, description } = req.body

      if (!title) {
        return res.writeHead(400).end(
          JSON.stringify({
            message: "Title required",
          }),
        )
      }
      if (!description) {
        return res.writeHead(400).end(
          JSON.stringify({
            message: "Description required",
          }),
        )
      }

      const task = {
        id: randomUUID(),
        title,
        description,
        completed_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      }

      database.insert("tasks", task)

      return res.writeHead(201).end()
    },
  },
  {
    method: "POST",
    path: buildRoutePath("/tasks/import"),
    handler: async (req, res) => {
      const csvPath = new URL("./stream/tasks.csv", import.meta.url)

      try {
        const stream = fs.createReadStream(csvPath)
        const csvParse = parse({
          delimiter: ",",
          skip_empty_lines: true,
          from_line: 2,
        })

        const linesParse = stream.pipe(csvParse)

        for await (const line of linesParse) {
          const [title, description] = line

          const task = {
            id: randomUUID(),
            title,
            description,
            completed_at: null,
            created_at: new Date(),
            updated_at: new Date(),
          }

          database.insert("tasks", task)
        }
      } catch {
        return res.writeHead(400).end(
          JSON.stringify({
            message: "File required",
          }),
        )
      }
      return res.writeHead(201).end(
        JSON.stringify({
          message: "Upload done",
        }),
      )
    },
  },
  {
    method: "PUT",
    path: buildRoutePath("/tasks/:id"),
    handler: (req, res) => {
      const { id } = req.params
      const { title, description } = req.body

      if (!title || !description) {
        return res.writeHead(400).end(
          JSON.stringify({
            message: "Title or description are required",
          }),
        )
      }
      const [tasks] = database.select("tasks", { id })

      if (!tasks) {
        return res.writeHead(404).end()
      }

      database.update("tasks", id, {
        title,
        description,
        updated_at: new Date(),
      })

      return res.writeHead(204).end()
    },
  },
  {
    method: "PATCH",
    path: buildRoutePath("/tasks/:id/complete"),
    handler: (req, res) => {
      const { id } = req.params

      database.update("tasks", id, {
        completed_at: new Date(),
      })

      return res.writeHead(204).end()
    },
  },
  {
    method: "DELETE",
    path: buildRoutePath("/tasks/:id"),
    handler: (req, res) => {
      const { id } = req.params

      database.delete("tasks", id)

      return res.writeHead(204).end()
    },
  },
]
