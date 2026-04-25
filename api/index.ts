import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"
import { snippetRoutes } from "./routes/snippets.ts"
import { docRoutes } from "./routes/docs.ts"
import { bookmarkRoutes } from "./routes/bookmarks.ts"
import { collectionRoutes } from "./routes/collections.ts"
import { searchRoutes } from "./routes/search.ts"
import { tagRoutes } from "./routes/tags.ts"
import { syncRoutes } from "./routes/sync.ts"
import { seed } from "./seed.ts"

const app = new Elysia()
  .use(
    cors({
      origin: [
        "http://localhost:1420",
        "http://localhost:5173",
        "http://127.0.0.1:1420",
        "http://127.0.0.1:5173",
      ],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
    })
  )
  .use(snippetRoutes)
  .use(docRoutes)
  .use(bookmarkRoutes)
  .use(collectionRoutes)
  .use(searchRoutes)
  .use(tagRoutes)
  .use(syncRoutes)
  .get("/api/v1/health", () => ({ ok: true, version: "0.1.0" }))
  .onError(({ error }) => {
    console.error(error)
    return { error: "Internal server error" }
  })
  .listen({
    port: 7878,
    hostname: "127.0.0.1",
  })

console.log("snipx API running on http://127.0.0.1:7878")

if (process.env.SNIPX_SEED === "1") {
  await seed()
}

export type App = typeof app
