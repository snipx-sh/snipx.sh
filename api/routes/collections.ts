import { Elysia, t } from "elysia"
import { readdir, readFile, writeFile, unlink, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { existsSync } from "node:fs"
import { paths, ensureDirs } from "../fs.ts"
import { generateId } from "../lib/id.ts"

const collectionsDir = paths.collections

async function readCollections() {
  await ensureDirs()
  if (!existsSync(collectionsDir)) return []
  const entries = await readdir(collectionsDir)
  const results = []
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue
    const content = await readFile(join(collectionsDir, entry), "utf-8")
    results.push(JSON.parse(content))
  }
  return results
}

async function readCollection(id: string) {
  const filePath = join(collectionsDir, `${id}.json`)
  if (!existsSync(filePath)) return null
  const content = await readFile(filePath, "utf-8")
  return JSON.parse(content)
}

async function writeCollection(data: Record<string, unknown>) {
  await mkdir(collectionsDir, { recursive: true })
  await writeFile(
    join(collectionsDir, `${data.id}.json`),
    JSON.stringify(data, null, 2),
    "utf-8",
  )
}

export const collectionRoutes = new Elysia({ prefix: "/api/v1" })
  .get("/collections", async () => {
    return await readCollections()
  })
  .get("/collections/:id", async ({ params, set }) => {
    const col = await readCollection(params.id)
    if (!col) {
      set.status = 404
      return { error: "Collection not found" }
    }
    return col
  })
  .post(
    "/collections",
    async ({ body, set }) => {
      const id = generateId()
      const now = new Date().toISOString()
      const col = {
        id,
        name: body.name,
        desc: body.desc ?? "",
        parent: body.parent ?? null,
        items: [],
        created: now,
        updated: now,
      }
      await writeCollection(col)
      set.status = 201
      return col
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        desc: t.Optional(t.String()),
        parent: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    },
  )
  .patch(
    "/collections/:id",
    async ({ params, body, set }) => {
      const col = await readCollection(params.id)
      if (!col) {
        set.status = 404
        return { error: "Collection not found" }
      }
      const updated = { ...col, ...body, updated: new Date().toISOString() }
      await writeCollection(updated)
      return updated
    },
    {
      body: t.Partial(
        t.Object({
          name: t.String({ minLength: 1 }),
          desc: t.String(),
          parent: t.Union([t.String(), t.Null()]),
        }),
      ),
    },
  )
  .delete("/collections/:id", async ({ params, set }) => {
    const filePath = join(collectionsDir, `${params.id}.json`)
    if (!existsSync(filePath)) {
      set.status = 404
      return { error: "Collection not found" }
    }
    await unlink(filePath)
    return { ok: true }
  })
  .post(
    "/collections/:id/items",
    async ({ params, body, set }) => {
      const col = await readCollection(params.id)
      if (!col) {
        set.status = 404
        return { error: "Collection not found" }
      }
      col.items.push({ id: body.itemId, type: body.itemType })
      col.updated = new Date().toISOString()
      await writeCollection(col)
      return col
    },
    {
      body: t.Object({
        itemId: t.String(),
        itemType: t.Union([
          t.Literal("snippet"),
          t.Literal("doc"),
          t.Literal("bookmark"),
        ]),
      }),
    },
  )
  .delete("/collections/:id/items/:itemId", async ({ params, set }) => {
    const col = await readCollection(params.id)
    if (!col) {
      set.status = 404
      return { error: "Collection not found" }
    }
    col.items = col.items.filter((item: any) => item.id !== params.itemId)
    col.updated = new Date().toISOString()
    await writeCollection(col)
    return col
  })
