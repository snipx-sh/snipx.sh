import { Elysia } from "elysia"
import { readContentDir, paths, ensureDirs } from "../fs.ts"

export const tagRoutes = new Elysia({ prefix: "/api/v1" }).get(
  "/tags",
  async () => {
    await ensureDirs()
    const counts: Record<string, number> = {}

    const allFiles = [
      ...(await readContentDir(paths.snippets)),
      ...(await readContentDir(paths.docs)),
      ...(await readContentDir(paths.bookmarks)),
    ]

    for (const file of allFiles) {
      const tags = (file.meta.tags as string[]) ?? []
      for (const tag of tags) {
        counts[tag] = (counts[tag] ?? 0) + 1
      }
    }

    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
  },
)
