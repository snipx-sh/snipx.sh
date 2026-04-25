import { Elysia, t } from "elysia"
import { readContentDir, writeContentFile, deleteContentFile, paths, ensureDirs } from "../fs.ts"
import { generateId } from "../lib/id.ts"

export const docRoutes = new Elysia({ prefix: "/api/v1" })
  .get("/docs", async ({ query }) => {
    await ensureDirs()
    const files = await readContentDir(paths.docs)
    let results = files.map(({ meta, body }) => ({
      id: meta.id as string,
      title: meta.title as string,
      url: meta.url as string,
      lang: meta.lang as string,
      cat: meta.cat as string,
      topic: (meta.topic as string) ?? "",
      tags: (meta.tags as string[]) ?? [],
      notes: body.trim(),
      fav: meta.fav === true,
      created: meta.created as string,
      updated: meta.updated as string,
    }))

    if (query.q) {
      const q = query.q.toLowerCase()
      results = results.filter(
        (d) => d.title.toLowerCase().includes(q) || d.notes.toLowerCase().includes(q)
      )
    }
    if (query.lang) results = results.filter((d) => d.lang === query.lang)
    if (query.cat) results = results.filter((d) => d.cat === query.cat)
    if (query.topic) results = results.filter((d) => d.topic === query.topic)
    if (query.tag) results = results.filter((d) => d.tags.includes(query.tag))
    if (query.fav === "true") results = results.filter((d) => d.fav)

    return results.sort((a, b) => b.updated.localeCompare(a.updated))
  })
  .get("/docs/:id", async ({ params, set }) => {
    await ensureDirs()
    const files = await readContentDir(paths.docs)
    const file = files.find((f) => f.meta.id === params.id)
    if (!file) {
      set.status = 404
      return { error: "Doc not found" }
    }
    return {
      id: file.meta.id,
      title: file.meta.title,
      url: file.meta.url,
      lang: file.meta.lang,
      cat: file.meta.cat,
      topic: (file.meta.topic as string) ?? "",
      tags: (file.meta.tags as string[]) ?? [],
      notes: file.body.trim(),
      fav: file.meta.fav === true,
      created: file.meta.created,
      updated: file.meta.updated,
    }
  })
  .post("/docs", async ({ body, set }) => {
    await ensureDirs()
    const id = generateId()
    const now = new Date().toISOString()
    const meta = {
      id,
      title: body.title,
      url: body.url,
      lang: body.lang,
      cat: body.cat,
      topic: body.topic ?? "",
      tags: body.tags ?? [],
      fav: body.fav ?? false,
      created: now,
      updated: now,
    }
    const notes = body.notes ?? ""
    await writeContentFile(paths.docs, id, meta, notes)
    set.status = 201
    return { ...meta, notes }
  }, {
    body: t.Object({
      title: t.String({ minLength: 1, maxLength: 120 }),
      url: t.String({ format: "uri" }),
      lang: t.String(),
      cat: t.String({ minLength: 1 }),
      topic: t.Optional(t.String()),
      tags: t.Optional(t.Array(t.String())),
      notes: t.Optional(t.String()),
      fav: t.Optional(t.Boolean()),
    })
  })
  .patch("/docs/:id", async ({ params, body, set }) => {
    await ensureDirs()
    const files = await readContentDir(paths.docs)
    const file = files.find((f) => f.meta.id === params.id)
    if (!file) {
      set.status = 404
      return { error: "Doc not found" }
    }
    const updated = {
      ...file.meta,
      ...body,
      updated: new Date().toISOString(),
    }
    const notes = body.notes ?? file.body.trim()
    delete (updated as Record<string, unknown>).notes
    await deleteContentFile(paths.docs, params.id)
    await writeContentFile(paths.docs, params.id, updated, notes)
    return { ...updated, notes }
  }, {
    body: t.Partial(t.Object({
      title: t.String({ minLength: 1, maxLength: 120 }),
      url: t.String({ format: "uri" }),
      lang: t.String(),
      cat: t.String({ minLength: 1 }),
      topic: t.String(),
      tags: t.Array(t.String()),
      notes: t.String(),
      fav: t.Boolean(),
    }))
  })
  .delete("/docs/:id", async ({ params, set }) => {
    const deleted = await deleteContentFile(paths.docs, params.id)
    if (!deleted) {
      set.status = 404
      return { error: "Doc not found" }
    }
    return { ok: true }
  })
