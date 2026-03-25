import { Elysia, t } from "elysia"
import { readContentDir, writeContentFile, deleteContentFile, paths, ensureDirs } from "../fs.ts"
import { generateId } from "../lib/id.ts"

export const snippetRoutes = new Elysia({ prefix: "/api/v1" })
  .get("/snippets", async ({ query }) => {
    await ensureDirs()
    const files = await readContentDir(paths.snippets)
    let results = files.map(({ meta, body }) => ({
      id: meta.id as string,
      title: meta.title as string,
      code: body.trim(),
      lang: meta.lang as string,
      cat: meta.cat as string,
      tags: (meta.tags as string[]) ?? [],
      desc: (meta.desc as string) ?? "",
      fav: meta.fav === true,
      created: meta.created as string,
      updated: meta.updated as string,
    }))

    if (query.q) {
      const q = query.q.toLowerCase()
      results = results.filter(
        (s) => s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
      )
    }
    if (query.lang) results = results.filter((s) => s.lang === query.lang)
    if (query.cat) results = results.filter((s) => s.cat === query.cat)
    if (query.tag) results = results.filter((s) => s.tags.includes(query.tag))
    if (query.fav === "true") results = results.filter((s) => s.fav)

    return results.sort((a, b) => b.updated.localeCompare(a.updated))
  })
  .get("/snippets/:id", async ({ params, set }) => {
    await ensureDirs()
    const files = await readContentDir(paths.snippets)
    const file = files.find((f) => f.meta.id === params.id)
    if (!file) {
      set.status = 404
      return { error: "Snippet not found" }
    }
    return {
      id: file.meta.id,
      title: file.meta.title,
      code: file.body.trim(),
      lang: file.meta.lang,
      cat: file.meta.cat,
      tags: (file.meta.tags as string[]) ?? [],
      desc: (file.meta.desc as string) ?? "",
      fav: file.meta.fav === true,
      created: file.meta.created,
      updated: file.meta.updated,
    }
  })
  .post("/snippets", async ({ body, set }) => {
    await ensureDirs()
    const id = generateId()
    const now = new Date().toISOString()
    const meta = {
      id,
      title: body.title,
      lang: body.lang,
      cat: body.cat,
      tags: body.tags ?? [],
      desc: body.desc ?? "",
      fav: body.fav ?? false,
      created: now,
      updated: now,
    }
    await writeContentFile(paths.snippets, id, meta, body.code, body.lang)
    set.status = 201
    return { ...meta, code: body.code }
  }, {
    body: t.Object({
      title: t.String({ minLength: 1, maxLength: 120 }),
      code: t.String({ minLength: 1 }),
      lang: t.String(),
      cat: t.String({ minLength: 1 }),
      tags: t.Optional(t.Array(t.String())),
      desc: t.Optional(t.String()),
      fav: t.Optional(t.Boolean()),
    })
  })
  .patch("/snippets/:id", async ({ params, body, set }) => {
    await ensureDirs()
    const files = await readContentDir(paths.snippets)
    const file = files.find((f) => f.meta.id === params.id)
    if (!file) {
      set.status = 404
      return { error: "Snippet not found" }
    }
    const updated = {
      ...file.meta,
      ...body,
      updated: new Date().toISOString(),
    }
    const code = body.code ?? file.body.trim()
    await deleteContentFile(paths.snippets, params.id)
    await writeContentFile(paths.snippets, params.id, updated, code, updated.lang as string)
    return { ...updated, code }
  }, {
    body: t.Partial(t.Object({
      title: t.String({ minLength: 1, maxLength: 120 }),
      code: t.String({ minLength: 1 }),
      lang: t.String(),
      cat: t.String({ minLength: 1 }),
      tags: t.Array(t.String()),
      desc: t.String(),
      fav: t.Boolean(),
    }))
  })
  .delete("/snippets/:id", async ({ params, set }) => {
    const deleted = await deleteContentFile(paths.snippets, params.id)
    if (!deleted) {
      set.status = 404
      return { error: "Snippet not found" }
    }
    return { ok: true }
  })
