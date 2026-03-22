import { Elysia } from "elysia"
import { readContentDir, paths, ensureDirs } from "../fs.ts"

export const searchRoutes = new Elysia({ prefix: "/api/v1" }).get(
  "/search",
  async ({ query, set }) => {
    const q = query.q
    if (!q) {
      set.status = 400
      return { error: "Query parameter 'q' is required" }
    }

    await ensureDirs()
    const like = q.toLowerCase()

    const snippets = (await readContentDir(paths.snippets))
      .filter(
        (f) =>
          String(f.meta.title).toLowerCase().includes(like) ||
          f.body.toLowerCase().includes(like),
      )
      .map((f) => ({
        id: f.meta.id as string,
        type: "snippet" as const,
        title: f.meta.title as string,
        cat: f.meta.cat as string,
        tags: (f.meta.tags as string[]) ?? [],
      }))

    const docs = (await readContentDir(paths.docs))
      .filter(
        (f) =>
          String(f.meta.title).toLowerCase().includes(like) ||
          String(f.meta.url ?? "").toLowerCase().includes(like),
      )
      .map((f) => ({
        id: f.meta.id as string,
        type: "doc" as const,
        title: f.meta.title as string,
        cat: f.meta.cat as string,
        tags: (f.meta.tags as string[]) ?? [],
      }))

    const bookmarks = (await readContentDir(paths.bookmarks))
      .filter(
        (f) =>
          String(f.meta.title).toLowerCase().includes(like) ||
          String(f.meta.url ?? "").toLowerCase().includes(like),
      )
      .map((f) => ({
        id: f.meta.id as string,
        type: "bookmark" as const,
        title: f.meta.title as string,
        cat: f.meta.cat as string,
        tags: (f.meta.tags as string[]) ?? [],
      }))

    return [...snippets, ...docs, ...bookmarks].sort((a, b) =>
      a.title.localeCompare(b.title),
    )
  },
)
