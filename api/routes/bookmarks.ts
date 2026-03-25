import { Elysia, t } from "elysia"
import { readContentDir, writeContentFile, deleteContentFile, paths, ensureDirs } from "../fs.ts"
import { generateId } from "../lib/id.ts"

export const bookmarkRoutes = new Elysia({ prefix: "/api/v1" })
  .get("/bookmarks", async ({ query }) => {
    await ensureDirs()
    const files = await readContentDir(paths.bookmarks)
    let results = files.map(({ meta, body }) => ({
      id: meta.id as string,
      title: meta.title as string,
      url: meta.url as string,
      cat: meta.cat as string,
      tags: (meta.tags as string[]) ?? [],
      notes: body.trim(),
      fav: meta.fav === true,
      created: meta.created as string,
      updated: meta.updated as string,
    }))

    if (query.q) {
      const q = query.q.toLowerCase()
      results = results.filter(
        (b) => b.title.toLowerCase().includes(q) || b.notes.toLowerCase().includes(q)
      )
    }
    if (query.cat) results = results.filter((b) => b.cat === query.cat)
    if (query.tag) results = results.filter((b) => b.tags.includes(query.tag))
    if (query.fav === "true") results = results.filter((b) => b.fav)

    return results.sort((a, b) => b.updated.localeCompare(a.updated))
  })
  .get("/bookmarks/:id", async ({ params, set }) => {
    await ensureDirs()
    const files = await readContentDir(paths.bookmarks)
    const file = files.find((f) => f.meta.id === params.id)
    if (!file) {
      set.status = 404
      return { error: "Bookmark not found" }
    }
    return {
      id: file.meta.id,
      title: file.meta.title,
      url: file.meta.url,
      cat: file.meta.cat,
      tags: (file.meta.tags as string[]) ?? [],
      notes: file.body.trim(),
      fav: file.meta.fav === true,
      created: file.meta.created,
      updated: file.meta.updated,
    }
  })
  .post("/bookmarks", async ({ body, set }) => {
    await ensureDirs()
    const id = generateId()
    const now = new Date().toISOString()
    const meta = {
      id,
      title: body.title,
      url: body.url,
      cat: body.cat,
      tags: body.tags ?? [],
      fav: body.fav ?? false,
      created: now,
      updated: now,
    }
    const notes = body.notes ?? ""
    await writeContentFile(paths.bookmarks, id, meta, notes)
    set.status = 201
    return { ...meta, notes }
  }, {
    body: t.Object({
      title: t.String({ minLength: 1, maxLength: 120 }),
      url: t.String({ format: "uri" }),
      cat: t.String({ minLength: 1 }),
      tags: t.Optional(t.Array(t.String())),
      notes: t.Optional(t.String()),
      fav: t.Optional(t.Boolean()),
    })
  })
  .patch("/bookmarks/:id", async ({ params, body, set }) => {
    await ensureDirs()
    const files = await readContentDir(paths.bookmarks)
    const file = files.find((f) => f.meta.id === params.id)
    if (!file) {
      set.status = 404
      return { error: "Bookmark not found" }
    }
    const updated = {
      ...file.meta,
      ...body,
      updated: new Date().toISOString(),
    }
    const notes = body.notes ?? file.body.trim()
    delete (updated as Record<string, unknown>).notes
    await deleteContentFile(paths.bookmarks, params.id)
    await writeContentFile(paths.bookmarks, params.id, updated, notes)
    return { ...updated, notes }
  }, {
    body: t.Partial(t.Object({
      title: t.String({ minLength: 1, maxLength: 120 }),
      url: t.String({ format: "uri" }),
      cat: t.String({ minLength: 1 }),
      tags: t.Array(t.String()),
      notes: t.String(),
      fav: t.Boolean(),
    }))
  })
  .delete("/bookmarks/:id", async ({ params, set }) => {
    const deleted = await deleteContentFile(paths.bookmarks, params.id)
    if (!deleted) {
      set.status = 404
      return { error: "Bookmark not found" }
    }
    return { ok: true }
  })
