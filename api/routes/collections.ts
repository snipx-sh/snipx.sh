import { Elysia, t } from "elysia"
import { readdir, readFile, writeFile, unlink, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { existsSync } from "node:fs"
import { paths, ensureDirs, parseNuon, writeNuon } from "../fs.ts"
import { generateId } from "../lib/id.ts"

interface CollectionItem {
  id: string
  type: "snippet" | "doc" | "bookmark"
}

interface Collection {
  id: string
  name: string
  desc: string
  parent: string | null
  items: CollectionItem[]
  created: string
  updated: string
}

const collectionsDir = paths.collections

function isValidCollection(value: unknown): value is Collection {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.desc === "string" &&
    (v.parent === null || typeof v.parent === "string") &&
    Array.isArray(v.items) &&
    (v.items as unknown[]).every((item) => {
      if (typeof item !== "object" || item === null || Array.isArray(item)) return false
      const i = item as Record<string, unknown>
      return (
        typeof i.id === "string" &&
        (i.type === "snippet" || i.type === "doc" || i.type === "bookmark")
      )
    }) &&
    typeof v.created === "string" &&
    typeof v.updated === "string"
  )
}

async function readCollections(): Promise<Collection[]> {
  await ensureDirs()
  if (!existsSync(collectionsDir)) return []
  const entries = await readdir(collectionsDir)
  const results: Collection[] = []
  for (const entry of entries) {
    if (!entry.endsWith(".nuon")) continue
    const filePath = join(collectionsDir, entry)
    try {
      const content = await readFile(filePath, "utf-8")
      const value = parseNuon(content)
      if (!isValidCollection(value)) {
        console.warn(`[collections] Skipping malformed collection file: ${entry} (invalid shape)`)
        continue
      }
      results.push(value)
    } catch (err) {
      console.warn(`[collections] Skipping malformed collection file: ${entry} (${err instanceof Error ? err.message : err})`)
    }
  }
  return results
}

async function readCollection(id: string): Promise<Collection | null> {
  const filePath = join(collectionsDir, `${id}.nuon`)
  if (!existsSync(filePath)) return null
  try {
    const content = await readFile(filePath, "utf-8")
    const value = parseNuon(content)
    if (!isValidCollection(value)) {
      console.warn(`[collections] Malformed collection file: ${id}.nuon (invalid shape)`)
      return null
    }
    return value
  } catch (err) {
    console.warn(`[collections] Failed to parse collection file: ${id}.nuon (${err instanceof Error ? err.message : err})`)
    return null
  }
}

async function writeCollection(data: Collection): Promise<void> {
  await mkdir(collectionsDir, { recursive: true })
  await writeFile(
    join(collectionsDir, `${data.id}.nuon`),
    writeNuon(data),
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
    const filePath = join(collectionsDir, `${params.id}.nuon`)
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
    col.items = col.items.filter((item: CollectionItem) => item.id !== params.itemId)
    col.updated = new Date().toISOString()
    await writeCollection(col)
    return col
  })
