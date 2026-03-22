# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

snipx - a local-first developer knowledge manager. Snippets, docs, bookmarks, and interactive tutorials searchable from your shell.

Three repositories under `github.com/snipx-sh`:
- `snipx.sh` (this repo) - Tauri desktop app, ElysiaJS API, Nushell module, bootstrap scripts
- `snipx.dev` - Web app, hosted interface, official docs (Cloudflare)
- `snipx` - Official knowledge base, community-maintained packages

## Build and Dev Commands

```
bun install                    # install JS/TS dependencies
cargo fetch                    # install Rust dependencies
bun run api:dev                # start API on localhost:7878
bun run dev                    # start Tauri + Vite (second terminal)
bun test api/                  # run API tests
cargo tauri build              # production build (.dmg / .AppImage / .msi)
./scripts/init.nu setup        # bootstrap project using claude
```

Seed the database for development: `SNIPX_SEED=1 bun run api:dev`

## Architecture

Four decoupled layers. All business logic lives in the API. Other layers are thin clients.

**API** (`api/`) - Bun + ElysiaJS HTTP server on `localhost:7878`. Single source of truth. Validates all writes with ElysiaJS.t + Zod. Reads files directly for single-item fetches. Queries DuckDB for list and search operations. Runs as a Tauri sidecar or standalone.

**Frontend** (`src/`) - Vue 3 SFCs rendering data from the API via the Eden typed client. Pinia for server state. Local component state for UI-only concerns (selected item, search query, REPL visibility). No business logic.

**Tauri shell** (`src-tauri/`) - Thin Rust wrapper. Launches the API as a sidecar, manages the window, provides native clipboard and system tray access.

**Nushell module** (`nu/snipx.nu`) - Talks directly to the API over HTTP. Does not use Tauri IPC. Works independently of the desktop app.

```
Nushell shell     ->  snipx.nu module  ->  HTTP API (localhost:7878)
Tauri frontend    ->  Eden client      ->  HTTP API (localhost:7878)
snipx CLI         ->                   ->  HTTP API (localhost:7878)
                                              |
                                   Files (~/.snipx/) + DuckDB index
```

## Storage Model

Files are the source of truth. Every snippet, doc, bookmark, and collection is a plain Markdown file with YAML frontmatter (or NUON for collections). SQLite and DuckDB are derived layers - never the canonical store. Deleting `.snipx/index.db` loses nothing. The files are the database.

- **Content files** - Markdown + YAML frontmatter in `~/.snipx/snippets/`, `docs/`, `bookmarks/`
- **Collections** - NUON files in `~/.snipx/collections/`
- **DuckDB index** (`~/.snipx/.snipx/index.db`) - FTS, filtered queries, tag aggregation. Regenerable via `snipx index`.
- **SQLite** (`~/.snipx/.snipx/sync.db`) - Sync state, GitHub API cache. Never stores content.

## Repository Structure

```
snipx.sh/
├── src-tauri/              # Rust - Tauri shell
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands.rs     # Tauri IPC (thin - delegates to API)
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
│       ├── client.ts       # Eden typed client - no manual fetch
│       ├── theme.ts        # Tokyo Night T object - canonical
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
│   ├── snipx.nu            # main module - all commands + completions
│   └── lib.nu              # shared helpers (used by scripts/ too)
├── scripts/                # bootstrap tooling
│   ├── init.nu             # repo setup, readme, skills, scaffold
│   ├── create.nu           # scaffold dirs, add-comments
│   └── add.nu              # add features and subcommands
└── nupm.nuon               # nupm package manifest
```

## File Locations

```
~/.snipx/
├── snippets/                    content - Markdown + YAML frontmatter
│   ├── nushell/
│   ├── rust/
│   └── typescript/
├── docs/                        content - Markdown + YAML frontmatter
├── bookmarks/                   content - Markdown + YAML frontmatter
├── collections/                 NUON files
└── .snipx/                      operational - all regenerable or deletable
    ├── index.db                 DuckDB - FTS, filtered queries, search cache
    ├── sync.db                  SQLite - sync state, git metadata
    └── cache/
        └── github-api/          SQLite-backed GitHub API response cache
```

Config: `~/.config/snipx/config.toml`

Overrides: `SNIPX_HOME`, `SNIPX_CONFIG_DIR`, `SNIPX_CONFIG_FILE`

Config resolution: CLI flag -> `$env.SNIPX_*` -> `~/.config/snipx/config.toml` -> default

## API Specification

Base URL: `http://localhost:7878/api/v1`

ElysiaJS exposes a fully typed Eden client. Import it in `src/lib/client.ts`:

```typescript
import { treaty } from '@elysiajs/eden'
import type { App } from '../../api/index'

export const client = treaty<App>('localhost:7878')
```

All frontend API calls go through this client. Type safety is end-to-end with no code generation.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/snippets` | List. Query: `?q=`, `?lang=`, `?cat=`, `?tag=`, `?fav=true` |
| GET/POST/PATCH/DELETE | `/snippets/:id` | CRUD |
| GET | `/docs` | List. Query: `?q=`, `?lang=`, `?cat=`, `?topic=`, `?tag=` |
| GET/POST/PATCH/DELETE | `/docs/:id` | CRUD |
| GET | `/bookmarks` | List. Query: `?q=`, `?cat=`, `?tag=`, `?fav=true` |
| GET/POST/PATCH/DELETE | `/bookmarks/:id` | CRUD |
| GET | `/collections` | List all (nested tree structure) |
| GET/POST/PATCH/DELETE | `/collections/:id` | CRUD |
| POST | `/collections/:id/items` | Add item `{ itemId, itemType }` |
| DELETE | `/collections/:id/items/:itemId` | Remove item |
| POST | `/sync/push` | Export and push to configured git remote |
| POST | `/sync/pull` | Pull from remote and merge |
| GET | `/sync/status` | `{ ahead, behind, lastSync, remote }` |
| GET | `/search?q=` | Search across all types |
| GET | `/tags` | All unique tags with counts |
| GET | `/health` | `{ ok: true, version: "..." }` |

Every response includes `id` (nanoid), `created`, `updated` (ISO 8601).

## Code Conventions

### TypeScript / Vue

- Strict mode, no `any`
- Zod + ElysiaJS.t for all I/O boundaries - infer types from schemas
- Named imports only, no default imports from library code
- No barrel files - import directly from source
- Vue SFCs use `<script setup lang="ts">` - no Options API
- Props defined with `defineProps<{...}>()` - no runtime prop declarations
- Emits defined with `defineEmits<{...}>()`
- 2-space indent

### API (ElysiaJS)

- Every handler uses ElysiaJS's built-in validation (`.t` schema on body/query/params)
- Every handler returns typed responses via ElysiaJS - no raw Response construction
- Errors: structured `{ error: "message" }` with appropriate status codes
- 404 for unknown IDs, 400 for validation failures, 500 for unexpected errors
- No authentication in v1 - API binds to `127.0.0.1` only

### Frontend (Vue 3)

- No CSS framework - Tokyo Night tokens in `src/lib/theme.ts` as `const T`
- All layout: inline styles only (`:style="{ ... }"` binding)
- All API calls via Eden client in stores - components never call fetch directly
- Pinia for all server state and shared UI state
- `window.innerHeight` for layout height, never `100vh`
- Composition API only - no Options API

### Rust

- No `unwrap()` in production paths - use `?` and proper error types
- `#[cfg(...)]` for platform-specific code
- 4-space indent

### Nushell (>= 0.111.0)

- kebab-case commands, snake_case variables, SCREAMING_SNAKE_CASE env vars
- Shebangs: `#!/usr/bin/env -S nu --stdin`
- Boolean flags: no `: bool` annotation, no `= false` default
- `each` not `for` when a return value is needed
- Full help text and at least one `# Example:` in every exported command
- 2-space indent

### Database

- Schema in `api/db.ts` only - no inline SQL anywhere else
- Migrations: append-only numbered functions `migrate_001`, `migrate_002`
- Every table: `id TEXT PRIMARY KEY` (nanoid), `created TEXT`, `updated TEXT` (ISO 8601)
- Tags: JSON array in `TEXT` column - no join tables in v1
- No ORM - raw `bun:sqlite` prepared statements only

### Naming

- Binary and CLI subcommands: `snipx`
- App wordmark in header UI: `SNIPX` - lowercase `snipx` everywhere else
- PascalCase types, camelCase vars/fns, kebab-case files, SCREAMING_SNAKE_CASE constants

## Desktop UI Layout

Three-pane: fixed sidebar (186px) + fixed list panel (275px) + flex-1 detail panel. Header (48px). Status bar (26px). REPL panel (resizable, min 130px, max 480px, drag handle on top border).

Four modes: Snippets (code viewer), Docs (references), Bookmarks (URLs), Learn (interactive tutorials). Each non-Learn mode has sidebar category filter with live counts, a Starred section, and list panel with animated entry.

REPL commands: `help`, `list`, `docs`, `bookmarks`, `show`, `search`, `copy`, `fav`, `run`, `open`, `tags`, `clear`.

## Learn Mode

An interactive tutorial system for converting knowledge into muscle memory. Three-panel layout: lesson sidebar (186px) + lesson content with task list (340px) + ghost text editor with output panel (flex-1).

Features: ghost text editor with five speed-run difficulty levels, task checking system, Ask Claude panel for hints, chapter/lesson navigation with progress tracking. Progress stored in the `learn` Pinia store.

Three chapters ship with v1: Nushell (3 lessons), Bun (1 lesson), Cloudflare Workers (1 lesson).

## Tokyo Night Theme

All color values defined as `const T` in `src/lib/theme.ts`. Never hardcode hex values in components.

```typescript
export const T = {
  bg:'#1a1b26', bgDark:'#13131a', bgPanel:'#16161e', bgHL:'#1e2030',
  bgHover:'#252637', bgActive:'#2a2d3e',
  border:'#3b4261', borderBrt:'#545c7e',
  fg:'#c0caf5', fgDim:'#a9b1d6', fgMuted:'#565f89',
  blue:'#7aa2f7', cyan:'#7dcfff', green:'#9ece6a', green1:'#73daca',
  purple:'#bb9af7', orange:'#ff9e64', yellow:'#e0af68', red:'#f7768e', teal:'#2ac3de',
} as const
```

## What Not To Do

- Do not introduce new dependencies without checking with the user first
- Do not use React, ReactDOM, JSX, or styled-components anywhere
- Do not write a hand-crafted API client - use Eden
- Do not use the Options API in Vue - Composition API with `<script setup>` only
- Do not use `localStorage` or `sessionStorage` in the desktop app
- Do not write platform-specific code without `#[cfg(...)]` or a runtime check
- Do not add Prettier/ESLint configs that conflict with the biome config
- Do not rename or restructure directories without explicit instruction
- Do not commit `snipx.db`, `node_modules/`, or `target/`
- Do not use `unwrap()` in production Rust
- Do not use `100vh` for layout height - use `window.innerHeight`
- Do not add Python scripts - TypeScript (Bun) or Nushell only
- Do not anticipate v2 features with v1 schema changes, routes, or abstractions

## Prose Style

Write in plain direct prose. No theatrical pivots. No em-dashes anywhere in code, comments, strings, UI copy, or documentation. Use ` - ` or restructure the sentence.

## Implementation Phases

| Phase | Scope | Done When |
|-------|-------|-----------|
| 0 | Scaffold: Tauri + Vue, mise.toml, api/, nu/, biome.json | `bun run dev` and `bun run api:dev` start |
| 1 | File system + DuckDB index + API: routes, seed, Zod, Eden client | `bun test api/` passes |
| 2 | Frontend: Tokyo Night, 3-pane, all 4 modes, shiki, forms, Pinia stores | All modes show live API data |
| 3 | REPL: resize, history, full command set | All commands work, history persists |
| 4 | Learn: ghost editor, 3 chapters, 7 lessons, speed levels, Ask Claude | All lessons run, tasks check correctly |
| 5 | Tauri: sidecar API, clipboard, tray, window state | App launches API automatically |
| 6 | Nushell: subcommands, completions, pipeable output | `snipx list \| where lang == "rust"` works |
| 7 | Polish: keyboard nav, import/export, build artifacts | `cargo tauri build` produces artifact |

Work phases in order. Do not begin phase N+1 until phase N passes all done-when checks.
