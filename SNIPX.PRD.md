# SNIPX.PRD.md

**Version:** 1.0.0
**Domains:** snipx.sh / snipx.dev
**Binary:** `snipx`
**Owner:** Daniel Bodnar — daniel@bodnar.sh
**Org:** github.com/snipx-sh

---

## Agent instructions

Read this entire document before writing a single line. Every section is load-bearing. Where this document conflicts with your defaults, this document wins.

**Prose and communication style.** Write in plain direct prose throughout — in code, comments, docs, error messages, commit messages, and any generated text. No theatrical pivots. No "X — they're actually Y" reframe constructions. No preamble before a point. Just say the thing.

**No em-dashes** anywhere in code, comments, strings, UI copy, or documentation. Use ` - ` or restructure the sentence.

**Scope discipline.** The implementation plan is phased. Do not add tables, columns, routes, components, or abstractions in anticipation of later phases. When a later phase begins it arrives with its own instructions.

**No Python** anywhere in this project. Scripts are TypeScript (Bun) for HTTP, parsing, and file I/O. Nushell for anything shell-native.

---

## Vision

Learning is becoming increasingly difficult as the rate of technology accelerates. Every new language, framework, and CLI comes with its own DSL, schema, flags, and grammar, increasing both the surface area and cognitive burden beyond what any individual can absorb.

The instinctive response is hoarding — bookmarks, stars, open tabs — an enormous accumulation of declarative knowledge that never converts into capability. You end up familiar with tools without having internalized them.

Three distinct problems:

**Collection without absorption.** Recognition is cheap. Reproduction is what's missing. The gap between "I know this exists" and "I can reach for it without thinking" is enormous, and nothing in a typical developer's workflow bridges it.

**Availability with too much friction.** Even things genuinely learned are hard to reach in the moment. The retrieval cost is just high enough that you muddle through instead, and every slow retrieval is a missed chance to reinforce what you already know.

**No pipeline from syntax to muscle memory.** Reading docs doesn't build it. Bookmarking doesn't. Even using something occasionally doesn't get you there. The right kind of repetition, in context, at the right time, for developer tooling specifically — Vim motions, shell patterns, CLI flags, API idioms — doesn't exist yet.

snipx addresses all three. v1 is a knowledge manager and retrieval tool. The longer arc is a system that moves knowledge from collection through procedural familiarity into tacit, automatic execution.

---

## Repositories

| Repo | Purpose |
|------|---------|
| `github.com/snipx-sh/snipx.sh` | Core — Tauri desktop app, ElysiaJS API, Nushell module, bootstrap scripts |
| `github.com/snipx-sh/snipx.dev` | Web app — hosted interface + official docs, deployed on Cloudflare |
| `github.com/snipx-sh/snipx` | Official knowledge base — community-maintained knowledge for tools and frameworks |

Personal knowledge repos follow the convention `github.com/[user]/snipx` and are served automatically at `https://snipx.dev/u/[username]`.

---

## Philosophy

**Sane Defaults.** Be thin glue. Align with the upstream platform. Never compete with it. Data lives in native formats. The app is a viewer and organizer, not a walled garden.

**Local-first.** Everything works offline. The API is `127.0.0.1` only. No telemetry. No account required for the desktop app or the CLI.

**Files as the interface.** References, snippets, tutorials, overlays, skill manifests — everything is a file. Vectorizable, searchable, git-trackable, R2-syncable, human-readable without tooling.

**Compounding knowledge.** Some knowledge makes other knowledge cheaper to acquire. The `deps` field in `snipx.nuon` encodes this. Learning paths prioritize tools that compound — earlier knowledge makes later knowledge dramatically cheaper to acquire.

**Agency over automation.** The distinction from AI-generated code is that the developer is the author. Ghost text is your own intent made visible ahead of your fingers. You wrote the file — with advanced tooling — rather than an AI writing it for you while you barely skimmed it.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri v2 |
| Frontend | Vue 3 SFCs, `<script setup lang="ts">`, Vite |
| State management | Pinia |
| Styling (desktop) | Inline styles, Tokyo Night palette (`src/lib/theme.ts`) |
| Syntax highlight | shiki (WASM, lazy-loaded per language) |
| Editor (tutorial) | Monaco Editor + `monaco-editor-auto-typings` |
| Transpilation (tutorial) | Sucrase + Rollup |
| Sandbox execution | Web Worker |
| Panel layout | Reka UI (tutorial), inline flex (desktop) |
| API server | Bun + ElysiaJS |
| API client | Eden (ElysiaJS typed client — no hand-written fetch client) |
| Validation | Zod + ElysiaJS.t (shared between frontend and API) |
| Content storage | Plain files — Markdown + YAML frontmatter, NUON, source files |
| DB adapter (local) | SQLite via `bun:sqlite` — FTS, filtered queries, sync state, index |
| DB adapter (cloud) | Cloudflare D1 (snipx.dev), PostgreSQL (self-hosted), or any adapter |
| DB adapter (Tauri) | `rusqlite` for Tauri IPC commands |
| CLI / shell | Nushell module (`snipx.nu`), >= 0.111.0 |
| Package format | nupm-compatible (`nupm.nuon` + `mod.nu`) |
| Skill format | agentskills.io open standard (`SKILL.md`) |
| Web hosting | Cloudflare (Pages, Workers, R2, KV) |
| Content sync | Cloudflare R2 + user GitHub repos |
| Build tooling | Bun (JS/TS), Cargo (Rust), mise for toolchain |
| Config | `~/.config/snipx/config.toml` (TOML, serde) |
| Bootstrap scripts | Nushell + `claude --print` (`scripts/`) |

---

## Architecture

### Four layers (snipx.sh)

**API** (`api/`) — Bun + ElysiaJS HTTP server on `localhost:7878`. Single source of truth. Owns the SQLite database. Validates all writes with ElysiaJS.t + Zod. Runs as a Tauri sidecar when the desktop app is open, or standalone as a systemd user service.

**Frontend** (`src/`) — Vue 3 SFCs rendering data from the API via the Eden typed client. Pinia for server state. Local component state for UI-only concerns (selected item, search query, REPL visibility). No business logic.

**Tauri shell** (`src-tauri/`) — thin Rust wrapper. Launches the API as a sidecar, manages the window, provides native clipboard and system tray access. No business logic.

**Nushell module** (`nu/snipx.nu`) — talks directly to the API over HTTP. Does not use Tauri IPC. Works independently — the desktop app does not need to be running.

### Data flow

```
Nushell shell     →  snipx.nu module  →  HTTP API (localhost:7878)
Tauri frontend    →  Eden client      →  HTTP API (localhost:7878)
snipx CLI         →                  →  HTTP API (localhost:7878)
snipx.dev Worker  →  GitHub API       →  user's content repo
                                              |
                                        SQLite (snipx.db)

Future (v2):
Doc corpus  →  ingestion pipeline  →  local vector index
                                       |           |
                                 completions   tutorial generator
                                                    |
                                            snippet library
```

## Storage model

### The principle

Files are the source of truth. Always. Every snippet, doc, bookmark, collection, tutorial, and reference is a plain file that can be read, edited, searched, and version-controlled without snipx installed. SQLite and DuckDB add features and performance on top of that — they are never the canonical store. Deleting `.snipx-index.db` loses nothing. The files are the database.

This is consistent with how VitePress, Astro, Hugo, and the tutorial system already work. It means `rg`, `fd`, `fzf`, `bat`, `git`, Neovim, VS Code, and any other tool can interact with your knowledge base natively.

### File layout

```
~/.snipx/
├── snippets/
│   ├── nushell/
│   │   ├── nu-pipeline.md
│   │   └── nu-http.md
│   ├── rust/
│   │   └── rs-axum-handler.md
│   └── typescript/
│       └── ts-hono-route.md
├── docs/
│   ├── doc-nu-book.md
│   └── doc-hono.md
├── bookmarks/
│   ├── bm-mise.md
│   └── bm-zellij.md
├── collections/
│   ├── dev-refs.nuon
│   └── networking.nuon
└── .snipx/                       # operational — all regenerable or deletable
    ├── index.db                  # DuckDB — FTS, filtered queries, search cache
    ├── sync.db                   # SQLite — sync state, git metadata, last push/pull
    └── cache/
        └── github-api/           # SQLite-backed GitHub API response cache
```

The `.snipx/` directory is entirely operational. Deleting it loses no content — `snipx index` rebuilds it from the files.

### Content file format

Every item is a Markdown file with YAML frontmatter. The code body (for snippets) is the file body below the frontmatter. Docs and bookmarks use the frontmatter for all data and optionally use the body for extended notes in Markdown.

```markdown
---
id: nu-pipeline
title: Process Pipeline with Filtering
lang: nushell
cat: Nushell
tags: [pipeline, process, filter]
fav: false
desc: Filter process data using structured pipelines
created: 2025-01-10T00:00:00Z
updated: 2025-03-22T00:00:00Z
---

# List processes consuming more than 5% CPU
ps
  | where cpu > 5.0
  | select name pid cpu mem
  | sort-by cpu --reverse
  | first 10
```

Collections are NUON files (native Nushell format):

```nuon
{
  id:          "dev-refs"
  name:        "Dev References"
  desc:        "Day-to-day tools and APIs"
  parent:      null
  created:     "2025-01-10T00:00:00Z"
  updated:     "2025-03-22T00:00:00Z"
  items: [
    { id: "doc-hono",    type: "doc"      }
    { id: "nu-pipeline", type: "snippet"  }
    { id: "bm-mise",     type: "bookmark" }
  ]
}
```

### Index layer (DuckDB)

DuckDB scans the file tree and builds a queryable index for:
- Full-text search across all content
- Filtered list queries (`lang = 'rust' AND fav = true`)
- Tag aggregation and counts
- Collection membership lookups

The index is always derivable from the files. If stale or missing, rebuild with `snipx index`. The API reads files directly for single-item fetches and queries DuckDB for list and search operations.

```bash
snipx index           # scan ~/.snipx/ and rebuild DuckDB index
snipx index --watch   # watch for file changes and update incrementally
```

### Operational layer (SQLite)

SQLite stores only operational state that has no file equivalent:
- Git sync state (last push, last pull, remote URL, ahead/behind counts)
- GitHub API response cache (rate limit management for snipx.dev)
- Session data (snipx.dev only)
- FTS auxiliary data if DuckDB is unavailable

This is `~/.snipx/sync.db` — small, purpose-specific, never the content source.

### Cloud layer (snipx.dev)

snipx.dev mirrors the user's file content to Cloudflare R2, where it is queryable via R2 SQL and optionally Polars for analytics. This enables the snipx.dev web interface to serve any public `github.com/[user]/snipx` repo at `snipx.dev/u/[username]` without running a database. The R2 mirror is a cache — the GitHub repo is canonical.

### Git sync model

Because content is plain files, sync is just git:

```bash
snipx sync            # git add -A && git commit -m "snipx: sync" && git push
snipx sync --pull     # git pull --rebase
snipx sync status     # git status + ahead/behind count
```

Conflict resolution is standard git — the user's normal git workflow applies. No custom merge logic. No proprietary format. Any git host works (GitHub, Sourcehut, Forgejo, a bare repo on a VPS).

The configured remote defaults to `github.com/[user]/snipx` but is just a git remote — fully user-controlled in `~/.config/snipx/config.toml`.



---

## Repository structure

```
snipx.sh/
├── src-tauri/              # Rust — Tauri shell
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands.rs     # Tauri IPC (thin — delegates to API)
│   │   └── db.rs           # rusqlite schema + migrations
│   └── Cargo.toml
├── src/                    # Vue 3 frontend
│   ├── App.vue
│   ├── components/         # one file per component, PascalCase
│   │   ├── AppHeader.vue
│   │   ├── Sidebar.vue
│   │   ├── SnippetList.vue
│   │   ├── SnippetDetail.vue
│   │   ├── DocList.vue
│   │   ├── DocDetail.vue
│   │   ├── BookmarkList.vue
│   │   ├── BookmarkDetail.vue
│   │   ├── AddForm.vue
│   │   ├── ReplPanel.vue
│   │   └── learn/
│   │       ├── LearnSidebar.vue
│   │       ├── LessonContent.vue
│   │       ├── GhostEditor.vue
│   │       ├── TaskList.vue
│   │       ├── SpeedBar.vue
│   │       ├── OutputPanel.vue
│   │       └── AskPanel.vue
│   ├── stores/             # Pinia stores
│   │   ├── snippets.ts
│   │   ├── docs.ts
│   │   ├── bookmarks.ts
│   │   └── learn.ts
│   └── lib/
│       ├── client.ts       # Eden typed client — no manual fetch
│       ├── theme.ts        # Tokyo Night T object — canonical
│       └── types.ts        # Zod schemas + inferred types
├── api/                    # Bun + ElysiaJS HTTP API
│   ├── index.ts            # register routes, CORS, error middleware
│   ├── routes/
│   │   ├── snippets.ts
│   │   ├── docs.ts
│   │   ├── bookmarks.ts
│   │   ├── search.ts
│   │   └── tags.ts
│   ├── db.ts               # schema, migrations, all query functions
│   └── lib/
│       └── id.ts           # nanoid wrapper
├── nu/                     # Nushell overlay module
│   ├── snipx.nu            # main module — all commands + completions
│   └── lib.nu              # shared helpers (used by scripts/ too)
├── scripts/                # bootstrap tooling
│   ├── init.nu             # repo setup, readme, skills, scaffold
│   ├── create.nu           # scaffold dirs, add-comments
│   └── add.nu              # add features and subcommands
└── nupm.nuon               # nupm package manifest
```

---

## Code conventions

### Naming

- Binary and all CLI subcommands: `snipx`
- All Nushell subcommands prefixed: `snipx list`, `snipx get`, `snipx add`, etc.
- Nushell module: `nu/snipx.nu`
- Config dir: `~/.config/snipx/`
- Data dir: `~/.local/share/snipx/`
- Database: `snipx.db`
- App wordmark in header UI only: `SNIPX` — lowercase `snipx` everywhere else

### TypeScript / Vue

- Strict mode, no `any`
- Zod + ElysiaJS.t for all I/O boundaries — infer types from schemas
- Named imports only, no default imports from library code
- No barrel files — import directly from source
- Vue SFCs use `<script setup lang="ts">` — no Options API
- Props defined with `defineProps<{...}>()` — no runtime prop declarations
- Emits defined with `defineEmits<{...}>()`

### Rust

- No `unwrap()` in production paths — use `?` and proper error types
- `#[cfg(...)]` for any platform-specific code

### Nushell (>= 0.111.0)

- kebab-case commands, snake_case variables, SCREAMING_SNAKE_CASE env vars
- Shebangs: `#!/usr/bin/env -S nu --stdin`
- Boolean flags: no `: bool` annotation, no `= false` default
- `each` not `for` when a return value is needed from a loop
- Error handling: `error make { msg: "...", label: { text: "...", span: (metadata $x).span } }`
- Full help text and at least one `# Example:` in every exported command's doc comment

### Formatting

- 2-space indent (TS/JS/Nu/Vue), 4-space (Rust)
- No trailing whitespace, trailing newline on all files

### Database

- Schema in `api/db.ts` only — no inline SQL anywhere else
- Migrations: append-only numbered functions `migrate_001`, `migrate_002`
- Every table: `id TEXT PRIMARY KEY` (nanoid), `created TEXT`, `updated TEXT` (ISO 8601)
- Tags: JSON array in `TEXT` column — no join tables in v1
- No ORM — raw `bun:sqlite` prepared statements only

### API

- Every handler uses ElysiaJS's built-in validation (`.t` schema on body/query/params)
- Every handler returns typed responses via ElysiaJS — no raw Response construction
- Errors: structured `{ error: "message" }` with appropriate status codes
- 404 for unknown IDs, 400 for validation failures, 500 for unexpected errors
- No authentication in v1 — API binds to `127.0.0.1` only

### Frontend (Vue 3)

- No CSS framework — Tokyo Night tokens in `src/lib/theme.ts` as `const T`
- All layout: inline styles only (`:style="{ ... }"` binding)
- All API calls via Eden client in stores — components never call fetch directly
- Pinia for all server state and shared UI state
- `window.innerHeight` for layout height, never `100vh`
- Composition API only — no Options API

---

## API specification

Base URL: `http://localhost:7878/api/v1`

ElysiaJS exposes a fully typed Eden client. Import it in `src/lib/client.ts`:

```typescript
import { treaty } from '@elysiajs/eden'
import type { App } from '../../api/index'

export const client = treaty<App>('localhost:7878')
```

All frontend API calls go through this client. Type safety is end-to-end with no code generation.

### Collections

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/collections` | List all collections (nested tree structure) |
| GET | `/api/v1/collections/:id` | Get one, including member items |
| POST | `/api/v1/collections` | Create |
| PATCH | `/api/v1/collections/:id` | Rename or re-parent |
| DELETE | `/api/v1/collections/:id` | Delete (items are not deleted, only membership) |
| POST | `/api/v1/collections/:id/items` | Add item to collection `{ itemId, itemType }` |
| DELETE | `/api/v1/collections/:id/items/:itemId` | Remove item from collection |

Collections are NUON files in `~/.snipx/collections/`. The API reads and writes these files directly. No database table. The `parent` field in the NUON file handles nesting. Items can belong to multiple collections — membership is stored in the collection file, not on the item.

### Snippets

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/snippets` | List. Query: `?q=`, `?lang=`, `?cat=`, `?tag=`, `?fav=true` |
| GET | `/api/v1/snippets/:id` | Get one |
| POST | `/api/v1/snippets` | Create |
| PATCH | `/api/v1/snippets/:id` | Update |
| DELETE | `/api/v1/snippets/:id` | Delete |

### Docs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/docs` | List. Query: `?q=`, `?lang=`, `?cat=`, `?topic=`, `?tag=` |
| GET | `/api/v1/docs/:id` | Get one |
| POST | `/api/v1/docs` | Create |
| PATCH | `/api/v1/docs/:id` | Update |
| DELETE | `/api/v1/docs/:id` | Delete |

### Bookmarks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/bookmarks` | List. Query: `?q=`, `?cat=`, `?tag=`, `?fav=true` |
| GET | `/api/v1/bookmarks/:id` | Get one |
| POST | `/api/v1/bookmarks` | Create |
| PATCH | `/api/v1/bookmarks/:id` | Update |
| DELETE | `/api/v1/bookmarks/:id` | Delete |

### Sync

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/sync/push` | Export and push to configured git remote |
| POST | `/api/v1/sync/pull` | Pull from remote and merge (last-write-wins by `updated`) |
| GET | `/api/v1/sync/status` | `{ ahead, behind, lastSync, remote }` |

Sync routes are thin wrappers over git commands executed via `Bun.spawn`. Sync state (last push/pull timestamps, remote URL) is stored in `~/.snipx/.snipx/sync.db` (SQLite) — the only operational database in this layer. Content itself is never stored in SQLite.

### Shared

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/search?q=` | Search across all three types |
| GET | `/api/v1/tags` | All unique tags with counts |
| GET | `/api/v1/health` | `{ ok: true, version: "..." }` |

### Request / response shape

```typescript
// POST /api/v1/snippets
{
  title:    string       // required, max 120
  code:     string       // required
  lang:     SnipxLang    // "nushell" | "bash" | "rust" | "typescript" | ...
  cat:      string       // required
  tags:     string[]     // default []
  desc:     string       // optional
  fav:      boolean      // default false
}

// All responses include:
{
  id:       string       // nanoid
  ...fields
  created:  string       // ISO 8601
  updated:  string       // ISO 8601
}
```

---

## Desktop UI

### Layout

Three-pane layout: fixed-width sidebar (186px) + fixed-width list panel (275px) + flex-1 detail panel. Header (48px). Status bar (26px). REPL panel (resizable, min 130px, max 480px, drag handle on top border).

### Four modes

**Snippets** — syntax-highlighted code viewer with language badge, tag pills, copy-to-clipboard, Run (fires REPL), and favorite toggle.

**Docs** — documentation references with URL, language/topic/tag badges, Quick Notes callout with personal annotations, and direct Open link.

**Bookmarks** — saved URLs with category badge, tags, notes, and date added.

**Learn** — the interactive tutorial system (full spec below).

Each non-Learn mode has its own sidebar category filter with live counts, a Starred section, and a list panel with animated entry. Mode tabs in the header switch between all four.

### Add form

Inline in the right panel — no floating modals. Full field validation via Zod before submit. Auto-selects newly created item after save.

### REPL

Full command set: `help`, `list`, `docs`, `bookmarks`, `show`, `search`, `copy`, `fav`, `run`, `open`, `tags`, `clear`. Command history with arrow-key navigation. `show <id>` navigates to the correct mode. `open <id>` calls the Tauri shell open API.

### Tokyo Night token system

All color values defined as `const T` in `src/lib/theme.ts`. Never hardcode hex values in components. The object is canonical — do not modify or extend without updating the source.

```typescript
// src/lib/theme.ts — canonical, do not duplicate
export const T = {
  bg:'#1a1b26', bgDark:'#13131a', bgPanel:'#16161e', bgHL:'#1e2030',
  bgHover:'#252637', bgActive:'#2a2d3e',
  border:'#3b4261', borderBrt:'#545c7e',
  fg:'#c0caf5', fgDim:'#a9b1d6', fgMuted:'#565f89',
  blue:'#7aa2f7', cyan:'#7dcfff', green:'#9ece6a', green1:'#73daca',
  purple:'#bb9af7', orange:'#ff9e64', yellow:'#e0af68', red:'#f7768e', teal:'#2ac3de',
} as const
```

---

## Interactive Tutorial (Learn mode)

The Learn mode is a first-class tab in the desktop app — not a separate web app. It is the same interface used by snipx.dev/learn. It is the primary vehicle for converting knowledge into muscle memory.

### Layout

Three-panel split matching the ElysiaJS tutorial reference:
1. **Left** — lesson navigation sidebar (186px, same width as snippet sidebar)
2. **Center** — lesson content + task list (340px fixed) with Prev/Next navigation
3. **Right** — editor + output + optional Ask Claude panel (flex-1)

The right panel has a horizontal split: editor on top (flex-1), output terminal on bottom (150px, collapsible).

### Lesson content panel

Each lesson renders structured content blocks in sequence:

- `h2` — section heading
- `p` — prose explanation
- `code` — syntax-highlighted example using the same shiki tokenizer as the snippet viewer
- `tip` — callout block with teal left border

Below the content, the **Assignment** section shows the task list — checkboxes that tick as the user's code satisfies each task's check function.

Prev / Next navigation at the bottom. Next button highlights in yellow when all tasks are complete.

### Ghost text editor

The editor pane is a custom ghost-text implementation — not Monaco for the desktop app, Monaco only for the web playground in snipx.dev.

Architecture:
- A syntax-highlighted overlay layer (absolutely positioned, pointer-events none) renders the full document: user code + ghost remainder, with ghost text at 32% opacity
- A transparent `<textarea>` sits on top, captures input, with `caretColor` set to `T.blue`
- Tab key inserts two spaces
- Ghost remainder is computed by diffing the user's current code against the lesson solution

Ghost remainder logic:
```
if showAnswer → no ghost
if level has no ghost → no ghost
if level is firstLineOnly → show first line of solution
if edCode is empty → show full solution
if solution.startsWith(edCode.trimEnd()) → show solution.slice(edCode.trimEnd().length)
else → no ghost
```

### Speed run levels

Five difficulty levels, selectable via a level bar above the editor:

```
Level 1 — full ghost text, unlimited completions, no time pressure
Level 2 — partial ghost text, limited completions, relaxed par time  (3 min)
Level 3 — first line only, no completions, normal par time          (2 min)
Level 4 — blank file, no hints, tight par time                      (90s)
Level 5 — blank file, no hints, no errors, fast par time            (60s)
```

Scoring on speed, accuracy, and scaffold usage. A level 5 pass means it is genuinely second nature. Level indicator shows remaining time as a progress bar with countdown. Timer turns red with 15 seconds remaining.

Switching levels resets the editor to the starter code (level 1) or blank (levels 2-5) and resets the timer.

### Task system

Each lesson defines an array of tasks:

```typescript
interface LessonTask {
  id:    string
  label: string
  check: (code: string) => boolean   // regex or string check against editor content
}
```

Tasks render as circular checkboxes that transition to green with a checkmark when satisfied. Completed tasks show strikethrough text. When all tasks pass, a green "All tasks complete" banner appears and the Next button activates.

Completed lessons are persisted in the `learn` Pinia store and shown as green circles in the sidebar.

### Output panel

Clicking Run triggers a simulated execution (real execution in v2 via Web Worker). Output renders in a terminal-style panel with the same monospace font and `T.green1` color as the REPL. Close button dismisses it.

For TypeScript lessons in the web playground version (snipx.dev), execution uses a real Sucrase + Rollup + Web Worker pipeline identical to the ElysiaJS tutorial.

### Ask Claude panel

A toggleable side panel (290px) attached to the right edge of the editor. Opens via the "Ask Claude" button in the editor header.

On send, calls the Anthropic API (`claude-sonnet-4-20250514`, max_tokens 600) with a prompt that includes:
- The current lesson title and task list
- The user's current editor code
- The user's question

The prompt explicitly instructs Claude not to give away the full solution — guide the user instead. Messages render as chat bubbles: user messages right-aligned blue, Claude responses left-aligned dark.

### Lesson data format

```typescript
interface Lesson {
  id:       string
  title:    string
  section:  string        // groups lessons in sidebar
  lang:     SnipxLang
  content:  ContentBlock[]
  starter:  string        // initial editor content at level 1
  solution: string        // used for ghost text and Answer reveal
  tasks:    LessonTask[]
  output:   string        // simulated terminal output on Run
}

interface ContentBlock {
  type: 'h2' | 'p' | 'code' | 'tip'
  text: string
  lang?: string           // for code blocks
}

interface Chapter {
  id:       string
  title:    string
  color:    string        // accent color from T
  icon:     Component     // lucide icon
  lessons:  Lesson[]
}
```

### Built-in chapters (v1)

Three chapters ship with snipx v1, each with 2-3 lessons:

**Nushell** (color: `T.blue`, icon: Terminal)
- Data Pipelines — `ps | where cpu > 5.0 | sort-by cpu --reverse`
- HTTP & JSON — `http get`, structured traversal, `$res.repos_url`
- Custom Commands — typed flags, `--dry-run`, early return

**Bun** (color: `T.orange`, icon: Cpu)
- HTTP Server — `Bun.serve()`, fetch handler, `/health` route

**Cloudflare Workers** (color: `T.teal`, icon: Cloud)
- Cache-First Worker — KV get/put, `ctx.waitUntil`, `X-Cache` header

### Progress tracking

Progress is stored in the `learn` Pinia store as `{ [lessonId]: true }`. The sidebar shows a completion circle per lesson. A progress bar in the sidebar footer shows overall completion across all lessons.

When a lesson's tasks are all complete, the lesson is marked done automatically and saved to the store.

---

## Nushell module

`use snipx.nu *` brings the full library into the shell with tab-completion backed by the live API.

### Commands

```nushell
snipx list                          # list all snippets as structured table
snipx list --lang rust              # filter by language
snipx get <id>                      # print code to stdout (pipeable)
snipx add                           # interactive add prompt
snipx copy <id>                     # copy code to clipboard
snipx search <query>                # search all types, return structured table
snipx docs list                     # list doc references
snipx docs open <id>                # open URL in browser
snipx bm list                       # list bookmarks
snipx bm open <id>                  # open URL in browser
snipx tags                          # list all tags with counts
snipx activate [tools...]           # overlay use tool modules
snipx add <tool>                    # add knowledge for a tool
```

### Composability

```nushell
snipx get nu-pipeline | save my-script.nu
snipx list --lang nushell | where fav == true | get id | each { snipx get $in }
snipx search "axum" | where type == "snippet" | get id | first | snipx copy $in
```

### Module structure

```
nu/
├── snipx.nu        # main module — re-exports everything, export-env sets NU_LIB_DIRS
├── lib.nu          # shared helpers — also used by scripts/
└── tools/          # generated tool overlays (one dir per tool)
    ├── mod.nu      # re-exports all installed tool overlays
    └── bun/
        └── mod.nu  # export-env + completions + commands for bun
```

nupm-compatible package manifest:

```nuon
# nupm.nuon
{
  name:        "snipx"
  type:        "module"
  version:     "0.2.0"
  description: "Local-first developer knowledge manager"
  license:     "MIT"
}
```

---

## Bootstrap scripts

`scripts/` contains Nushell scripts that call `claude --print` to generate files and run commands. Each subcommand maps to one or more `claude --print` invocations. Nushell handles plumbing; Claude handles generation.

### Shared helpers (`scripts/lib.nu` — symlinked from `nu/lib.nu`)

```nushell
export def call_claude  [prompt: string, cfg: record] -> record
export def claude_json  [prompt: string, cfg: record] -> record   # parses .result as JSON
export def claude_text  [prompt: string, cfg: record] -> string   # returns .result as text
export def confirm_and_run [cmd: string, --yes, --dry-run] -> int
export def write_file [content: string, out: string, --dry-run]
export def resolve_config [--model, --owner, --repo, --claude, --agent] -> record
```

### Config resolution in scripts

```
CLI flag  →  $env.SNIPX_MODEL / SNIPX_OWNER / SNIPX_REPO / SNIPX_CLAUDE / SNIPX_AGENT  →  default
```

### `scripts/init.nu` subcommands

```
./scripts/init.nu repo              # gh repo create via claude
./scripts/init.nu readme            # generate README.md from PRD.md via claude
./scripts/init.nu skills [query]    # find + install a Claude Code skill via bunx skills
./scripts/init.nu setup             # generate .claude/commands/ files
```

### `scripts/create.nu` subcommands

```
./scripts/create.nu scaffold        # claude reads docs, creates dirs + empty files
./scripts/create.nu add-comments [--include glob] [--exclude glob]
```

`add-comments` takes a second pass over every file matching `--include` (default: all source files in the repo) and calls a `claude -p` agent per file to add JSDoc-style or twoslash-style comments that describe:
- What the file is responsible for
- What the exported types, functions, and constants are
- Type signatures with examples
- Dependencies on other files

The comments prime Next Edit Suggestions — with them in place, a developer starting a new file can produce 80-90% of the implementation by typing 2-3 lines. The comments make intent visible before the fingers start.

This is the `create.nu add-comments` step in the project bootstrap, intended to run after `scaffold` and before the developer starts implementing, so every empty file is a guided exercise rather than a blank slate.

```bash
./scripts/create.nu scaffold
./scripts/create.nu add-comments --exclude "*.test.ts" --exclude "*.spec.ts"
```

`--dry-run` prints the proposed comment blocks without writing.

### Agent pattern for doc fetching

`snipx docs <tool> --fetch` and `snipx ingest <url>` both use the same underlying pattern: a single `claude -p` invocation with broad tool permissions, where the agent orchestrates the entire fetch-curate-organize pipeline. Nushell fires the agent and handles the symlink creation afterward.

```nushell
# what snipx docs dagger --fetch does (no claude involved):
let source = open $"~/.snipx/packages/($tool)/raw/.source.nuon"
if $source.strategy == "submodule" {
  ^git submodule update --remote $"packages/($tool)/raw"
} else {
  # conditional HTTP fetch per URL, respects ETag
  $source.urls | each { |u|
    let res = http get --headers { If-None-Match: $u.etag } $u.url
    if $res.status != 304 { $res.body | save $"raw/($u.path)" }
  }
}

# what snipx docs dagger --curate does (claude involved):
let prompt = $"
  Read the raw documentation files in raw/ for ($tool).
  Distill them into four reference files under references/:
    overview.md  — what it is, when to use it, core concepts (500-800 words)
    api.md       — key APIs, flags, schemas — most important 20%, not everything
    patterns.md  — idioms, anti-patterns, things that surprise people
    grammar.md   — tree-sitter or pest grammar if present in raw/, else omit

  Source files are in: ~/.snipx/packages/($tool)/raw/
  Write output to:     ~/.snipx/packages/($tool)/references/

  Preserve all code examples verbatim. Keep source attribution comments
  referencing which raw/ file each section came from.
  Do not invent information not present in raw/.
"
claude -p --allowedTools "Bash,Read,Write" --output-format json $prompt
```

The agent approach is correct here because the fetch-curate step involves real judgment calls: which docs are authoritative, which examples are worth including, how to sequence by complexity. Nushell cannot verify those decisions meaningfully — Claude orchestrates, Nushell handles the symlinks and index rebuild afterward.

```nushell
# after the agent finishes:
snipx skills dagger --generate     # generate SKILL.md from the fetched references/
snipx index                        # rebuild DuckDB index to include new files
overlay use dagger                 # activate the tool overlay
```

### `scripts/add.nu` subcommands

```
./scripts/add.nu feature <name>     # add a new feature submodule
./scripts/add.nu command <name>     # add a new Nushell subcommand
```

### Pattern

Every subcommand follows the same structure:

1. Build a prompt describing what to generate or run
2. Call `claude_json` (for commands to execute) or `claude_text` (for files to write)
3. Nushell acts on the output — runs the command or saves the file
4. `--dry-run` shows output without side effects on every subcommand

---

## Knowledge structure

A knowledge entry (`[tool]/`) simultaneously satisfies up to three contracts. The directory name is the tool name — lowercase, hyphens for multi-word.

```
[tool]/                            # e.g. bun/, cloudflare/containers/
│
│   # Tier 1 — Claude Code skill (agentskills.io open standard)
├── SKILL.md                       # frontmatter: name, description, allowed-tools
├── agents/
│   ├── tutor.md                   # subagent: interactive tutor REPL
│   ├── ingest.md                  # subagent: fetch + curate docs
│   └── reviewer.md                # subagent: code review
├── references/                    # loaded on-demand into claude context
│   ├── overview.md                # what it is, when to use it, core concepts
│   ├── api.md                     # key APIs, flags, schemas
│   ├── patterns.md                # idioms, anti-patterns, gotchas
│   └── grammar.md                 # from tree-sitter/pest grammar if available
├── scripts/                       # executable — only output enters context
│   ├── fetch-docs.ts              # Bun — fetch + curate official docs
│   ├── gen-completions.nu         # Nushell — generate completions from live CLI
│   └── validate.nu                # Nushell — smoke-test the entry
├── assets/                        # templates, starter kits
│
│   # Tier 2 — Nushell overlay (nupm-compatible)
├── nupm.nuon                      # { name, type, version, description, license }
├── mod.nu                         # overlay entry point — export-env + re-exports
├── completions/
│   ├── mod.nu                     # re-exports all completions (private by default)
│   └── flags.nu                   # completes flag values
├── commands/
│   └── mod.nu                     # re-exports exported commands
├── hooks/
│   └── mod.nu                     # env hooks: detect project, set SNIPX_[TOOL]_*
│
│   # Tier 3 — snipx learning unit
├── snipx.nuon                     # registry manifest
├── snippets/
│   ├── index.nuon                 # { id, title, lang, tags, file }
│   └── [name].[ext]               # one snippet per file
└── tutorials/
    ├── index.nuon                 # { id, title, level, deps }
    └── [level]-[topic]/
        ├── README.md
        └── exercises/
```

No Python. Scripts are TypeScript (Bun) or Nushell only.

### Contribution tiers

| Tier | Contents | What it provides |
|------|----------|-----------------|
| 1 | `SKILL.md` + `references/` + `scripts/` | Claude context for this tool |
| 2 | Tier 1 + `mod.nu` + `completions/` + `hooks/` + `nupm.nuon` | Full Nushell overlay |
| 3 | Tier 2 + `snippets/` + `tutorials/` + `snipx.nuon` | Learning unit |

### Skill installation (XDG + find-up)

snipx walks up from the current directory looking for a git root, then installs the skill at the innermost applicable location. Both agent conventions are supported simultaneously:

```
# Search order (first match wins):
./.agents/skills/[tool]/          # project-local (agentskills.io)
./.claude/skills/[tool]/          # project-local (claude-code)
[parent directories...]
~/.agents/skills/[tool]/          # user-level
~/.claude/skills/[tool]/          # user-level claude-code
~/.snipx/skills/[tool]/           # user-level snipx canonical
```

The skill directory at any location is always thin — `SKILL.md` and symlinks only. All content lives at `~/.snipx/packages/[tool]/`.

On install, `snipx add` prompts:

```
? Install skill at:
  ❯ .agents/skills/[tool]/     (agentskills.io — all agents)
    .claude/skills/[tool]/     (claude-code only)
    both

? Symlink style:
  ❯ relative  (portable, git-friendly)
    absolute
```

Preferences persist to `~/.config/snipx/config.toml`.

### `snipx.nuon` manifest

```nuon
{
  name:        "bun"
  version:     "1.2.0"
  type:        "module"
  license:     "MIT"
  description: "Bun runtime — scripts, tests, bundler, package manager"
  topics:      ["runtime", "typescript", "bundler", "testing"]
  deps:        []
  snippets:    "snippets/index.nuon"
  tutorials:   "tutorials/index.nuon"
  skill:       "SKILL.md"
  overlay:     "mod.nu"
  difficulty:  1
}
```

`difficulty` is 1-5. 1 is foundational and widely used; 5 is highly specialized. It feeds tutorial sequencing and learning path ordering.

---

## Web platform (snipx.dev)

### Routing

```
snipx.dev                                          → marketing / demo
snipx.dev/docs/[...]                               → documentation
snipx.dev/explore                                  → browse the official knowledge base
snipx.dev/u/[username]                             → github.com/[username]/snipx (public, no auth)
snipx.dev/u/[username]/[repo]                      → any named repo (auth required if private)
snipx.dev/u/[username]/[repo]/tree/[branch]/[...path] → specific path within a repo
```

Everything after `/u/[username]` is optional and progressively more specific:
- `/u/danielbodnar` — resolves to `github.com/danielbodnar/snipx` (convention default)
- `/u/danielbodnar/notes` — resolves to `github.com/danielbodnar/notes`
- `/u/danielbodnar/notes/tree/main/snippets/rust` — resolves to the `snippets/rust/` directory within that repo on the `main` branch

The `/u/` prefix keeps the router unambiguous. Reserved top-level paths (`/docs`, `/explore`, `/api`, `/auth`, `/health`) can never be mistaken for GitHub usernames. New top-level routes can be added without risk of collision.

The Worker resolves the request as follows:
1. Strip `/u/` prefix and parse `[username]`, optional `[repo]` (default: `snipx`), optional `[branch]` (default: `main`), optional `[...path]`
2. Attempt a public GitHub API fetch for that repo
3. If 404 or 403 — redirect to auth flow
4. If public — serve the snipx web interface with that repo as the data source

### Tutorial playground (snipx.dev)

The web version of the Learn tab uses Monaco Editor with real in-browser TypeScript execution via Sucrase + Rollup + Web Worker. This is identical to the ElysiaJS tutorial architecture.

For TypeScript/Bun/ElysiaJS lessons:
- Monaco Editor with full IntelliSense via `monaco-editor-auto-typings`
- In-browser transpilation via Sucrase
- Module bundling via Rollup
- Execution sandboxed in a Web Worker
- HTTP test cases validate response shape and status codes

For Nushell/Rust/VyOS lessons:
- Monaco Editor with syntax highlighting only
- Validation via regex or AST structure checks — no execution
- Tests verify shape, keywords, and patterns

The snipx.dev tutorial playground is built in Vue 3 (same as the desktop app) to share component code. Lesson content is sourced from the installed knowledge repos at `~/.snipx/packages/[tool]/tutorials/` when running locally, or from the official snipx knowledge base when running on snipx.dev.

---

## The longer arc (v2 scope)

These features are documented here so v1 architecture decisions do not preclude them.

### Doc corpus ingestion

Automatic downloading, parsing, and vectorization of official docs, API schemas, and tree-sitter / pest grammars into a local index. Feeds search, completions, and the tutorial generator. Doubles as the training corpus for whole-file ghost text suggestions.

### Auto-generated interactive tutorials

Extract and sequence every code example from an ingested doc corpus into a typing interface where the learner produces each example rather than reads it. Ghost text provides scaffolding. Completed examples are saved directly to the snippet library. Learning and building the personal knowledge base happen simultaneously.

### Progressive speed-run challenges (extended)

Same tutorial content, multiple passes, increasing difficulty, stripping scaffolding each time. A level 5 pass means it is genuinely second nature. Applies to Vim motions, shell patterns, CLI flags, Nushell pipelines, Emmet abbreviations — anything with a learnable motor pattern.

### Whole-file ghost text

Project-aware inline suggestions that model what the entire file should become, not the next token. Accuracy grounded in the ingested doc corpus for the specific library version in use. The developer is still the author — the ghost text is intent made visible ahead of the fingers.

---

## Feature requirements

### P0 — Launch blockers

- [ ] Snippet CRUD with language, category, tag, description, code body
- [ ] Doc entry CRUD with URL, language, category, topics, tags, personal notes
- [ ] Bookmark CRUD with URL, category, tags, date added, personal notes
- [ ] Collections — named groups that can contain snippets, docs, and bookmarks; nested folders supported; items can belong to multiple collections
- [ ] Full-text + tag search across all three types simultaneously, with optional scope to a collection
- [ ] Syntax-highlighted code viewer (shiki, Tokyo Night theme)
- [ ] Copy-to-clipboard from viewer
- [ ] Favorite / star any item
- [ ] Persistent local storage (SQLite via `bun:sqlite`, `snipx.db`)
- [ ] Git-backed sync — content is plain files, sync is `git add -A && git commit && git push`; `snipx sync --pull` does `git pull --rebase`; no custom merge logic; any git host works
- [ ] SQLite sync state (`~/.snipx/.snipx/sync.db`) — last push/pull timestamps, remote URL, GitHub API cache for snipx.dev
- [ ] Persistent local storage (SQLite via `bun:sqlite`, `snipx.db`)
- [ ] Eden typed client — no hand-written fetch wrapper
- [ ] Nushell module with tab-completion backed by the API
- [ ] REPL panel with command history, arrow-key navigation, full command set
- [ ] Learn mode with 3 chapters, 7 lessons, ghost text editor, task system
- [ ] Speed run levels 1-5 with timer and progress bar
- [ ] Ask Claude panel in Learn mode

### P1 — High value

- [ ] Import from JSON / TOML / CSV
- [ ] Export to JSON / TOML / Markdown
- [ ] Keyboard navigation: `j`/`k` in list, `/` to focus search, `Esc` to clear, `Enter` to open
- [ ] `snipx` CLI binary installable via `cargo install` or `bun run build`
- [ ] Tag autocomplete in add/edit form
- [ ] Configurable storage path and git remote via `~/.config/snipx/config.toml`
- [ ] Tag autocomplete in add/edit form
- [ ] `snipx add <tool>` — adds knowledge entry, installs skill + overlay
- [ ] Progress persistence across Learn sessions

### P2 — Future scope

- [ ] Auto-generated tutorials triggered automatically from ingested corpus (v1 requires `--generate` flag)
- [ ] Whole-file ghost text (NES)
- [ ] MCP server exposing snippets as agent tools
- [ ] Cloudflare Workers deployment for cross-device sync
- [ ] VS Code / Neovim plugin
- [ ] `snipx add <tool> --mcp` — generate MCP server scaffold

---

## Non-goals for v1

- No cloud sync
- No team or multi-user features
- No CSS framework in the desktop app
- No Python scripts anywhere
- No React, ReactDOM, or JSX anywhere
- No SSR — Tauri requires a static SPA

---

## Implementation phases

Work phases in order. Do not begin phase N+1 until phase N passes all done-when checks.

### Phase 0 — Scaffold (0.5 days)

- [ ] `bunx create-tauri-app snipx` with Vue template and Vite
- [ ] `mise.toml` with pinned Bun, Rust, Node versions
- [ ] `api/` directory with `bun init`
- [ ] `nu/` directory with empty `snipx.nu` skeleton
- [ ] `.gitignore`: `target/`, `node_modules/`, `*.db`, `dist/`
- [ ] `biome.json` for TS/JS formatting
- [ ] `rustfmt.toml` with `edition = "2021"`

**Done when:** `bun run dev` and `bun run api:dev` both start without errors.

### Phase 1 — File system, index, and API (1.5 days)

- [ ] `api/db/adapter.ts` — `SnipxAdapter` interface definition
- [ ] `api/db/adapters/sqlite.ts` — local default using `bun:sqlite` with FTS5
- [ ] `api/db/adapters/memory.ts` — in-memory adapter for tests
- [ ] `api/db/index.ts` — adapter factory reading `config.toml`
- [ ] `api/fs.ts` — parse and write Markdown + YAML frontmatter, NUON collections, `.source.nuon`
- [ ] `api/indexer.ts` — scan `~/.snipx/`, populate adapter via `SnipxAdapter.index()`
- [ ] File watcher using `chokidar` — incremental index updates on file change
- [ ] All route files — single-item fetches read files directly; list/search queries the adapter
- [ ] `api/index.ts` — routes, CORS, error middleware, exported `App` type
- [ ] `src/lib/types.ts` — Zod schemas matching the frontmatter format
- [ ] `src/lib/client.ts` — Eden client
- [ ] `api/seed.ts` — write 10+10+10 sample markdown files to `~/.snipx/`

**Done when:** `bun test api/` passes all route tests; deleting `~/.snipx/.snipx/index.db` and running `snipx index` produces identical query results; swapping `adapter = "memory"` in config runs all tests without touching the filesystem.

### Phase 2 — Frontend core (1.5 days)

- [ ] `src/lib/theme.ts` — Tokyo Night `T` object
- [ ] `src/stores/` — Pinia stores for snippets, docs, bookmarks
- [ ] Three-pane layout: sidebar (186px) + list (275px) + detail (flex-1)
- [ ] `window.innerHeight` for full height with resize listener
- [ ] Header: mode tabs (Snippets / Docs / Bookmarks / Learn), search, Add button, REPL toggle
- [ ] Sidebar: category filter with live counts, Favorites section
- [ ] Status bar
- [ ] All three non-Learn modes with live API data via Eden client
- [ ] shiki syntax highlighting, lazy-loaded per language, Tokyo Night theme
- [ ] Inline add/edit form for all three types
- [ ] Zod client-side validation before submit

**Done when:** all three modes show live API data, search works, items persist across restarts.

### Phase 3 — REPL (0.5 days)

- [ ] Drag-to-resize panel (min 130px, max 480px)
- [ ] Command history with arrow-key navigation
- [ ] Full command set implemented
- [ ] `show <id>` navigates to correct mode
- [ ] `open <id>` calls Tauri shell open

**Done when:** all commands work, history persists, `open` launches browser.

### Phase 4 — Learn mode (1.5 days)

- [ ] `src/stores/learn.ts` — Pinia store for current chapter/lesson, editor code, completed lessons
- [ ] `LearnSidebar.vue` — chapter nav, lesson list with completion circles, progress bar
- [ ] `LessonContent.vue` — ContentBlock renderer (h2, p, code, tip) + TaskList
- [ ] `GhostEditor.vue` — overlay + textarea ghost text editor (see spec above)
- [ ] `SpeedBar.vue` — level buttons, timer, progress bar
- [ ] `OutputPanel.vue` — terminal-style simulated output
- [ ] `AskPanel.vue` — Ask Claude chat panel (Anthropic API call)
- [ ] All 3 chapters, 7 lessons authored and wired up
- [ ] Task check functions validated against all lesson solutions
- [ ] Level transitions reset editor and timer correctly

**Done when:** all 7 lessons run correctly, all tasks check correctly at level 1, timer fires at levels 2-5, Ask Claude panel sends and receives messages.

### Phase 5 — Tauri integration (0.5 days)

- [ ] API as Tauri sidecar in `tauri.conf.json`
- [ ] `commands.rs` — `start_api`, `stop_api`, `api_health`
- [ ] Tauri clipboard plugin replacing `navigator.clipboard`
- [ ] System tray: "Show snipx", "Toggle REPL", "Quit"
- [ ] Window state persistence
- [ ] Config read on startup, values passed to sidecar

**Done when:** app launches API automatically, tray works, clipboard works on all platforms.

### Phase 6 — Nushell module (0.5 days)

- [ ] `nu/snipx.nu` — all CRUD subcommands: `list`, `get`, `copy`, `search`, `tags`, `docs list/open`, `bm list/open`, `collections`, `sync`, `index`
- [ ] Completions backed by `GET /api/v1/tags`, filesystem scan for tool names, and ID completions
- [ ] `snipx get <id>` pipeable to stdout
- [ ] `snipx list` returns structured Nushell table
- [ ] `snipx activate` / `snipx deactivate` — generates `~/.config/snipx/active.nu` and instructs sourcing
- [ ] Install instructions for `config.nu`

**Done when:** `snipx list | where lang == "rust"` works in a fresh Nushell session; `snipx get nu-pipeline | pbcopy` works.

### Phase 7 — Agent pipeline commands (1 day)

- [ ] `snipx docs <tool> --fetch` — `claude -p` agent with WebFetch + Write permissions
- [ ] `snipx docs <tool> --curate` — second claude pass to distill fetched content into `references/`
- [ ] `snipx ingest <url> [--type] [--skill] [--tool] [--collection]`
- [ ] `snipx skills <tool> --generate` — generates `SKILL.md` + `agents/` from `references/`
- [ ] `snipx tutorials <tool> --generate` — generates tutorial sequence from `references/`
- [ ] `snipx add <tool>` — composition over the above atomic commands
- [ ] All `--include`/`--exclude` flags on `snipx add`
- [ ] `snipx index --watch` — incremental DuckDB updates on file change
- [ ] `create.nu add-comments` — per-file claude agent adds JSDoc/twoslash comments

**Done when:** `snipx add bun` runs all steps end-to-end; `~/.snipx/packages/bun/references/` is populated with distilled docs; `snipx learn bun` opens the desktop Learn tab with the bun chapter.

### Phase 8 — REPL tutor (0.5 days)

- [ ] `snipx learn <tool> --repl` — terminal tutor with ANSI ghost text rendering
- [ ] Task evaluation inline in the terminal
- [ ] `snipx tutor <tool>` alias
- [ ] `snipx learn <tool> --speed-run --level 1-5`

**Done when:** `snipx tutor nushell` launches an interactive terminal session that walks through the Data Pipelines lesson with ghost text and task checking.

### Phase 9 — Polish and release (0.5 days)

- [ ] Keyboard navigation throughout
- [ ] `snipx export --format json` and `snipx import`
- [ ] `cargo tauri build` produces `.dmg` / `.AppImage` / `.msi`
- [ ] README verified against actual build
- [ ] Seed data stripped from production build (`SNIPX_SEED=1 bun run api:dev`)

**Done when:** `cargo tauri build` produces a working artifact on all three platforms.

---

## Milestone summary

| Phase | Name | Duration | Cumulative |
|-------|------|----------|-----------|
| 0 | Scaffold | 0.5d | 0.5d |
| 1 | File system + index + API | 1.5d | 2.0d |
| 2 | Frontend | 1.5d | 3.5d |
| 3 | REPL | 0.5d | 4.0d |
| 4 | Learn mode | 1.5d | 5.5d |
| 5 | Tauri | 0.5d | 6.0d |
| 6 | Nushell module | 0.5d | 6.5d |
| 7 | Agent pipeline | 1.0d | 7.5d |
| 8 | REPL tutor | 0.5d | 8.0d |
| 9 | Polish | 0.5d | 8.5d |

---

## What not to do

- Do not introduce new dependencies without checking with the user first
- Do not use React, ReactDOM, JSX, or styled-components anywhere
- Do not use `localStorage` or `sessionStorage` in the desktop app
- Do not write platform-specific code without `#[cfg(...)]` or a runtime check
- Do not add Prettier/ESLint configs that conflict with the biome config
- Do not rename or restructure directories without explicit instruction
- Do not commit `snipx.db`, `node_modules/`, or `target/`
- Do not use `unwrap()` in production Rust
- Do not use `100vh` for layout height — use `window.innerHeight`
- Do not add Python scripts — TypeScript (Bun) or Nushell only
- Do not anticipate v2 features with v1 schema changes, routes, or abstractions
- Do not use the Options API in Vue — Composition API with `<script setup>` only
- Do not write a hand-crafted API client — use Eden

---

## Startup sequence

```bash
bun install && cargo fetch      # install all dependencies
bun run api:dev                 # start API on port 7878
bun run dev                     # start Tauri + Vite (second terminal)
```

Or bootstrap with Claude:

```bash
./scripts/init.nu setup
```

---

*snipx.sh · snipx.dev · MIT · Daniel Bodnar — daniel@bodnar.sh*
