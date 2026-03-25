import { ensureDirs, writeContentFile, paths } from "./fs.ts"

const snippets = [
  {
    id: "nu-pipeline",
    title: "Process Pipeline with Filtering",
    lang: "nushell",
    cat: "Nushell",
    tags: ["pipeline", "process", "filter"],
    desc: "Filter process data using structured pipelines",
    fav: true,
    code: `ps\n  | where cpu > 5.0\n  | select name pid cpu mem\n  | sort-by cpu --reverse\n  | first 10`,
  },
  {
    id: "rs-axum-handler",
    title: "Axum Handler with State",
    lang: "rust",
    cat: "Web",
    tags: ["axum", "handler", "state"],
    desc: "Extract shared state in an Axum route handler",
    fav: true,
    code: `use axum::{extract::State, Json};\nuse std::sync::Arc;\n\nasync fn get_users(\n    State(pool): State<Arc<sqlx::PgPool>>,\n) -> Json<Vec<User>> {\n    let users = sqlx::query_as!(User, "SELECT * FROM users")\n        .fetch_all(&*pool)\n        .await\n        .unwrap();\n    Json(users)\n}`,
  },
  {
    id: "ts-hono-route",
    title: "Hono Route with Zod Validation",
    lang: "typescript",
    cat: "Web",
    tags: ["hono", "zod", "validation"],
    desc: "Type-safe Hono route using Zod schema",
    fav: false,
    code: `import { Hono } from "hono"\nimport { zValidator } from "@hono/zod-validator"\nimport { z } from "zod"\n\nconst app = new Hono()\n  .post("/users", zValidator("json", z.object({\n    name: z.string(),\n    email: z.string().email(),\n  })), (c) => {\n    const data = c.req.valid("json")\n    return c.json({ id: "1", ...data }, 201)\n  })`,
  },
  {
    id: "bash-find-replace",
    title: "Find and Replace in Files",
    lang: "bash",
    cat: "Shell",
    tags: ["find", "sed", "replace"],
    desc: "Recursive find and replace across a directory",
    fav: false,
    code: `find . -type f -name "*.ts" -exec sed -i 's/oldTerm/newTerm/g' {} +`,
  },
  {
    id: "sql-window",
    title: "Window Function - Running Total",
    lang: "sql",
    cat: "Database",
    tags: ["window", "sum", "analytics"],
    desc: "Calculate running total with a window function",
    fav: true,
    code: `SELECT\n  date,\n  amount,\n  SUM(amount) OVER (\n    ORDER BY date\n    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n  ) AS running_total\nFROM transactions\nORDER BY date;`,
  },
  {
    id: "ts-bun-test",
    title: "Bun Test Example",
    lang: "typescript",
    cat: "Testing",
    tags: ["bun", "test", "expect"],
    desc: "Basic Bun test with describe and expect",
    fav: false,
    code: `import { describe, test, expect } from "bun:test"\n\ndescribe("math", () => {\n  test("addition", () => {\n    expect(2 + 2).toBe(4)\n  })\n})`,
  },
  {
    id: "nu-http",
    title: "HTTP Request Pipeline",
    lang: "nushell",
    cat: "Nushell",
    tags: ["http", "json", "api"],
    desc: "Fetch JSON API and process the response",
    fav: true,
    code: `http get "https://api.github.com/users/danielbodnar"\n  | select login name public_repos\n  | to json`,
  },
  {
    id: "rs-thiserror",
    title: "Error Handling with thiserror",
    lang: "rust",
    cat: "Error Handling",
    tags: ["thiserror", "error", "derive"],
    desc: "Custom error types using thiserror derive macro",
    fav: false,
    code: `use thiserror::Error;\n\n#[derive(Error, Debug)]\npub enum AppError {\n    #[error("not found: {0}")]\n    NotFound(String),\n    #[error("unauthorized")]\n    Unauthorized,\n    #[error(transparent)]\n    Database(#[from] sqlx::Error),\n}`,
  },
  {
    id: "js-fetch-retry",
    title: "Fetch with Retry",
    lang: "javascript",
    cat: "Web",
    tags: ["fetch", "retry", "async"],
    desc: "Fetch wrapper with exponential backoff retry",
    fav: false,
    code: `async function fetchRetry(url, opts = {}, retries = 3) {\n  for (let i = 0; i < retries; i++) {\n    try {\n      const res = await fetch(url, opts)\n      if (res.ok) return res\n    } catch (err) {\n      if (i === retries - 1) throw err\n      await new Promise(r => setTimeout(r, 2 ** i * 1000))\n    }\n  }\n}`,
  },
  {
    id: "yaml-gh-actions",
    title: "GitHub Actions CI Workflow",
    lang: "yaml",
    cat: "CI",
    tags: ["github-actions", "ci", "workflow"],
    desc: "Basic CI workflow with test and build steps",
    fav: false,
    code: `name: CI\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: oven-sh/setup-bun@v2\n      - run: bun install\n      - run: bun test`,
  },
]

const docItems = [
  { id: "doc-nu-book", title: "Nushell Book", url: "https://www.nushell.sh/book/", lang: "nushell", cat: "Reference", topic: "language", tags: ["nushell", "docs"], notes: "Official language reference", fav: true },
  { id: "doc-rust-book", title: "The Rust Programming Language", url: "https://doc.rust-lang.org/book/", lang: "rust", cat: "Reference", topic: "language", tags: ["rust", "docs"], notes: "The official Rust book", fav: true },
  { id: "doc-hono", title: "Hono Documentation", url: "https://hono.dev/docs/", lang: "typescript", cat: "Framework", topic: "web", tags: ["hono", "web"], notes: "Lightweight web framework", fav: false },
  { id: "doc-bun-test", title: "Bun Test Runner", url: "https://bun.sh/docs/cli/test", lang: "typescript", cat: "Testing", topic: "testing", tags: ["bun", "test"], notes: "Built-in test runner", fav: false },
  { id: "doc-tauri", title: "Tauri v2 Guides", url: "https://v2.tauri.app/start/", lang: "rust", cat: "Framework", topic: "desktop", tags: ["tauri", "desktop"], notes: "Desktop app framework", fav: true },
  { id: "doc-sqlite-json", title: "SQLite JSON Functions", url: "https://www.sqlite.org/json1.html", lang: "sql", cat: "Database", topic: "json", tags: ["sqlite", "json"], notes: "JSON support in SQLite", fav: false },
  { id: "doc-zod", title: "Zod Documentation", url: "https://zod.dev/", lang: "typescript", cat: "Validation", topic: "schema", tags: ["zod", "validation"], notes: "Schema validation library", fav: false },
  { id: "doc-cf-workers", title: "Cloudflare Workers API", url: "https://developers.cloudflare.com/workers/", lang: "typescript", cat: "Platform", topic: "serverless", tags: ["cloudflare", "workers"], notes: "Edge computing platform", fav: false },
  { id: "doc-ts-utility", title: "TypeScript Utility Types", url: "https://www.typescriptlang.org/docs/handbook/utility-types.html", lang: "typescript", cat: "Reference", topic: "types", tags: ["typescript", "types"], notes: "Built-in utility types", fav: false },
  { id: "doc-vite", title: "Vite Configuration", url: "https://vite.dev/config/", lang: "typescript", cat: "Tooling", topic: "build", tags: ["vite", "config"], notes: "Build tool configuration", fav: false },
]

const bookmarkItems = [
  { id: "bm-tauri", title: "Tauri v2 Repository", url: "https://github.com/tauri-apps/tauri", cat: "Tool", tags: ["tauri", "github"], notes: "Desktop app framework", fav: true },
  { id: "bm-mdn", title: "MDN Web Docs", url: "https://developer.mozilla.org/", cat: "Reference", tags: ["web", "docs"], notes: "Web platform reference", fav: true },
  { id: "bm-cloudflare", title: "Cloudflare Docs", url: "https://developers.cloudflare.com/", cat: "Platform", tags: ["cloudflare", "docs"], notes: "Cloud platform docs", fav: false },
  { id: "bm-bun", title: "Bun Documentation", url: "https://bun.sh/docs", cat: "Tool", tags: ["bun", "runtime"], notes: "JS runtime and toolkit", fav: true },
  { id: "bm-nu-cookbook", title: "Nushell Cookbook", url: "https://www.nushell.sh/cookbook/", cat: "Learning", tags: ["nushell", "cookbook"], notes: "Practical Nushell recipes", fav: false },
  { id: "bm-rust-example", title: "Rust by Example", url: "https://doc.rust-lang.org/rust-by-example/", cat: "Learning", tags: ["rust", "examples"], notes: "Learn Rust by doing", fav: false },
  { id: "bm-hono", title: "Hono Website", url: "https://hono.dev/", cat: "Tool", tags: ["hono", "web"], notes: "Fast web framework", fav: false },
  { id: "bm-sqlite", title: "SQLite Documentation", url: "https://www.sqlite.org/docs.html", cat: "Reference", tags: ["sqlite", "database"], notes: "Embedded database", fav: false },
  { id: "bm-zod", title: "Zod GitHub", url: "https://github.com/colinhacks/zod", cat: "Tool", tags: ["zod", "validation"], notes: "TypeScript schema validation", fav: false },
  { id: "bm-mise", title: "mise Documentation", url: "https://mise.jdx.dev/", cat: "Tool", tags: ["mise", "devtools"], notes: "Dev tool version manager", fav: false },
]

async function seed() {
  await ensureDirs()
  console.log("Seeding ~/.snipx/ with sample files...")

  for (const s of snippets) {
    const meta = { id: s.id, title: s.title, lang: s.lang, cat: s.cat, tags: s.tags, desc: s.desc, fav: s.fav, created: new Date().toISOString(), updated: new Date().toISOString() }
    await writeContentFile(paths.snippets, s.id, meta, s.code, s.lang)
  }
  console.log(`  ${snippets.length} snippets`)

  for (const d of docItems) {
    const meta = { id: d.id, title: d.title, url: d.url, lang: d.lang, cat: d.cat, topic: d.topic, tags: d.tags, fav: d.fav, created: new Date().toISOString(), updated: new Date().toISOString() }
    await writeContentFile(paths.docs, d.id, meta, d.notes)
  }
  console.log(`  ${docItems.length} docs`)

  for (const b of bookmarkItems) {
    const meta = { id: b.id, title: b.title, url: b.url, cat: b.cat, tags: b.tags, fav: b.fav, created: new Date().toISOString(), updated: new Date().toISOString() }
    await writeContentFile(paths.bookmarks, b.id, meta, b.notes)
  }
  console.log(`  ${bookmarkItems.length} bookmarks`)

  console.log("Seeded 30 items to ~/.snipx/")
}

seed()
