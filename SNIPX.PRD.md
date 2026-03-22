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

The instinctive response is hoarding — bookmarks, stars, open tabs — an enormous accumulation of declarative knowledge that never converts into capability. You end up familiar with tools without having internalized them. Understanding everything without memorizing anything.

Three distinct problems:

**Collection without absorption.** Recognition is cheap. Reproduction is what's missing. The gap between "I know this exists" and "I can reach for it without thinking" is enormous, and nothing in a typical developer's workflow bridges it.

**Availability with too much friction.** Even things genuinely learned are hard to reach in the moment. The retrieval cost is just high enough that you muddle through instead, and every slow retrieval is a missed chance to reinforce what you already know.

**No pipeline from syntax to muscle memory.** Reading docs doesn't build it. Bookmarking doesn't. Even using something occasionally doesn't get you there. The right kind of repetition, in context, at the right time, for developer tooling specifically — Vim motions, shell patterns, CLI flags, API idioms — doesn't exist yet.

snipx addresses all three. v1 is a knowledge manager and retrieval tool. The longer arc is a system that moves knowledge from collection through procedural familiarity into tacit, automatic execution.

---

## Repositories

| Repo | Purpose |
|------|---------|
| `github.com/snipx-sh/snipx.sh` | Core — Tauri desktop app, HTTP API, Nushell module, bootstrap scripts |
| `github.com/snipx-sh/snipx.dev` | Web app — hosted interface + official docs, deployed on Cloudflare |
| `github.com/snipx-sh/snipx` | Official knowledge base — community-maintained knowledge for tools and frameworks |

Personal knowledge repos follow the convention `github.com/[user]/snipx` and are served automatically at `https://snipx.dev/[username]`.

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
| Frontend (desktop) | React 19, Vite, TypeScript strict |
| Frontend (tutorial playground) | Vue 3 SFCs, `<script setup lang="ts">`, VitePress |
| Styling (desktop) | Inline styles, Tokyo Night palette (`src/lib/theme.ts`) |
| Styling (playground) | Tailwind CSS, Catppuccin + Tokyo Night themes |
| Syntax highlight (desktop) | shiki (WASM, lazy-loaded per language) |
| Editor (playground) | Monaco Editor + `monaco-editor-auto-typings` |
| Transpilation (playground) | Sucrase + Rollup |
| Sandbox execution | Web Worker |
| Panel layout (playground) | Reka UI |
| State (playground) | Pinia |
| API server | Bun + Hono |
| Validation | Zod (shared between frontend and API) |
| Database | SQLite via `bun:sqlite` (API) + `rusqlite` (Tauri) |
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

**API** (`api/`) — Bun + Hono HTTP server on `localhost:7878`. Single source of truth. Owns the SQLite database. Validates all writes with Zod. Runs as a Tauri sidecar when the desktop app is open, or standalone as a systemd user service.

**Frontend** (`src/`) — React app rendering data from the API. Local UI state only (selected item, search query, REPL visibility). All network calls go through `src/lib/api.ts`. No business logic.

**Tauri shell** (`src-tauri/`) — thin Rust wrapper. Launches the API as a sidecar, manages the window, provides native clipboard and system tray access. No business logic.

**Nushell module** (`nu/snipx.nu`) — talks directly to the API over HTTP. Does not use Tauri IPC. Works independently — the desktop app does not need to be running.

### Data flow

```
Nushell shell     →  snipx.nu module  →  HTTP API (localhost:7878)
Tauri frontend    →  Tauri IPC        →  HTTP API (localhost:7878)
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

### File locations

```
~/.local/share/snipx/snipx.db    database
~/.config/snipx/config.toml      configuration
~/.config/snipx/snipx.nu         Nushell module (installed copy)
~/.snipx/packages/               installed knowledge content
~/.snipx/skills/                 user-level skill symlink dirs
```

All paths follow XDG. Each is independently overridable:

```
SNIPX_HOME           overrides ~/.snipx/
SNIPX_CONFIG_DIR     overrides ~/.config/snipx/
SNIPX_CONFIG_FILE    overrides ~/.config/snipx/config.toml
SNIPX_CONFIG         alias for SNIPX_CONFIG_FILE
```

### Config resolution

```
CLI flag  →  $env.SNIPX_*  →  ~/.config/snipx/config.toml  →  default
```

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
├── src/                    # React frontend
│   ├── app.tsx
│   ├── components/         # one file per component, PascalCase
│   ├── hooks/              # one hook per file, camelCase, use prefix
│   └── lib/
│       ├── api.ts          # typed fetch client only — no business logic
│       ├── theme.ts        # Tokyo Night T object — canonical
│       └── types.ts        # Zod schemas + inferred types
├── api/                    # Bun + Hono HTTP API
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

### TypeScript

- Strict mode, no `any`
- Zod for all I/O boundaries — infer types from schemas, never write separate interfaces for validated data
- Named imports only, no default imports from library code
- No barrel files — import directly from source

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

- 2-space indent (TS/JS/Nu), 4-space (Rust)
- No trailing whitespace, trailing newline on all files

### Database

- Schema in `api/db.ts` only — no inline SQL anywhere else
- Migrations: append-only numbered functions `migrate_001`, `migrate_002`
- Every table: `id TEXT PRIMARY KEY` (nanoid), `created TEXT`, `updated TEXT` (ISO 8601)
- Tags: JSON array in `TEXT` column — no join tables in v1
- No ORM — raw `bun:sqlite` prepared statements only

### API

- Every handler uses `zValidator` for request bodies
- Every handler returns `c.json(...)` — no raw `Response` construction
- Errors: `c.json({ error: "message" }, statusCode)`
- 404 for unknown IDs, 400 for validation failures, 500 for unexpected errors
- No authentication in v1 — API binds to `127.0.0.1` only

### Frontend (React)

- No CSS framework — Tokyo Night tokens in `src/lib/theme.ts` as `const T`
- All layout: inline styles only
- All API calls via `src/lib/api.ts` — components never call `fetch` directly
- React Query for server state, `useState` for local UI state
- No `useEffect` for data fetching — React Query only
- `window.innerHeight` for layout height, never `100vh`
- Pure function components only

---

## API specification

Base URL: `http://localhost:7878/api/v1`

### Snippets

| Method | Path | Description |
|--------|------|-------------|
| GET | `/snippets` | List. Query: `?q=`, `?lang=`, `?cat=`, `?tag=`, `?fav=true` |
| GET | `/snippets/:id` | Get one |
| POST | `/snippets` | Create |
| PATCH | `/snippets/:id` | Update |
| DELETE | `/snippets/:id` | Delete |

### Docs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/docs` | List. Query: `?q=`, `?lang=`, `?cat=`, `?topic=`, `?tag=` |
| GET | `/docs/:id` | Get one |
| POST | `/docs` | Create |
| PATCH | `/docs/:id` | Update |
| DELETE | `/docs/:id` | Delete |

### Bookmarks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/bookmarks` | List. Query: `?q=`, `?cat=`, `?tag=`, `?fav=true` |
| GET | `/bookmarks/:id` | Get one |
| POST | `/bookmarks` | Create |
| PATCH | `/bookmarks/:id` | Update |
| DELETE | `/bookmarks/:id` | Delete |

### Shared

| Method | Path | Description |
|--------|------|-------------|
| GET | `/search?q=` | Search across all three types |
| GET | `/tags` | All unique tags with counts |
| GET | `/health` | `{ ok: true, version: "..." }` |

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

### Three modes

**Snippets** — syntax-highlighted code viewer with language badge, tag pills, copy-to-clipboard, Run (fires REPL), and favorite toggle.

**Docs** — documentation references with URL, language/topic/tag badges, Quick Notes callout with personal annotations, and direct Open link.

**Bookmarks** — saved URLs with category badge, tags, notes, and date added.

Each mode has its own sidebar category filter with live counts, a Starred section, and a list panel with animated entry. Mode tabs in the header switch between all three.

### Add form

Inline in the right panel — no floating modals. Full field validation via Zod before submit. Auto-selects newly created item after save.

### REPL

Full command set: `help`, `list`, `docs`, `bookmarks`, `show`, `search`, `copy`, `fav`, `run`, `open`, `tags`, `clear`. Command history with arrow-key navigation. `show <id>` navigates to the correct mode. `open <id>` calls the Tauri shell open API.

### Tokyo Night token system

All color values defined as `const T` in `src/lib/theme.ts`. Never hardcode hex values in components. The object is canonical — do not modify or extend without updating the source.

```typescript
// excerpt — full object in src/lib/theme.ts
const T = {
  bg:'#1a1b26', bgDark:'#13131a', bgPanel:'#16161e', bgHL:'#1e2030',
  bgHover:'#252637', bgActive:'#2a2d3e',
  border:'#3b4261', borderBrt:'#545c7e',
  fg:'#c0caf5', fgDim:'#a9b1d6', fgMuted:'#565f89',
  blue:'#7aa2f7', cyan:'#7dcfff', green:'#9ece6a', green1:'#73daca',
  purple:'#bb9af7', orange:'#ff9e64', yellow:'#e0af68', red:'#f7768e', teal:'#2ac3de',
}
```

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
snipx learn <tool>                  # open interactive tutor
```

### Composability

```nushell
snipx get nu-pipeline | save my-script.nu
snipx list --lang nushell | where fav == true | get id | each { snipx get $in }
snipx search "axum" | where type == "snippet" | get id | first | snipx copy $in
```

### Overlay system

Each tool knowledge entry provides a Nushell overlay. `snipx activate bun cloudflare` loads each tool's `mod.nu` via `overlay use`. Tools are resolved from `$NU_LIB_DIRS` which includes `~/.snipx/packages/` (set in `export-env`).

Because `overlay use` resolves paths at parse time, tool overlays must live at a known path in `$NU_LIB_DIRS` — they cannot be loaded from a runtime variable. `snipx activate` writes an activation file and sources it.

```nushell
# snipx activate writes ~/.config/snipx/active.nu then sources it
overlay use bun
overlay use cloudflare
```

### Module structure

```
nu/
├── snipx.nu        # main module — re-exports everything, export-env sets NU_LIB_DIRS
├── lib.nu          # shared helpers — also used by scripts/
└── tools/          # generated tool overlays
    ├── mod.nu      # re-exports all installed tool overlays
    ├── bun/
    │   └── mod.nu  # export-env + completions + commands for bun
    └── ...
```

The full module is also a nupm-compatible package:

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
export def call_claude [prompt: string, cfg: record] -> record
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
                                    # claude adds JSDoc/twoslash pre-context comments
                                    # to each empty file to prime NES suggestions
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

## Skill installation

Skills are resolved by walking up from the current directory (find-up), then falling back to user-level paths. First match wins.

```
./.agents/skills/[tool]/          project-local (agentskills.io)
./.claude/skills/[tool]/          project-local (claude-code)
[parent directories...]
~/.agents/skills/[tool]/          user-level
~/.claude/skills/[tool]/          user-level claude-code
~/.snipx/skills/[tool]/           user-level snipx canonical
```

The skill directory at any location is always thin — `SKILL.md` and symlinks. All content lives at `~/.snipx/packages/[tool]/`. Content exists in exactly one place.

```bash
# adding knowledge
snipx add cloudflare/containers
snipx add danielbodnar/neovim
bunx snipx@latest add dagger
bunx skills add snipx-sh/snipx --skill dagger -a claude-code -y
```

On install, `snipx add`:
1. Fetches content to `~/.snipx/packages/[tool]/`
2. Prompts for skill location (`.agents/`, `.claude/`, or both)
3. Prompts for symlink style (relative or absolute)
4. Creates the thin skill dir with `SKILL.md` + symlinks
5. Persists preferences to `~/.config/snipx/config.toml`

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
├── tutorials/
│   ├── index.nuon                 # { id, title, level, deps }
│   └── [level]-[topic]/
│       ├── README.md
│       └── exercises/
│
│   # Optional
└── mcp/
    └── server.ts                  # MCP server exposing this tool's knowledge
```

### Contribution tiers

| Tier | Contents | What it provides |
|------|----------|-----------------|
| 1 | `SKILL.md` + `references/` + `scripts/` | Claude context for this tool |
| 2 | Tier 1 + `mod.nu` + `completions/` + `hooks/` + `nupm.nuon` | Full Nushell overlay |
| 3 | Tier 2 + `snippets/` + `tutorials/` + `snipx.nuon` | Learning unit + MCP |

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
  mcp:         "mcp/server.ts"
  difficulty:  1
}
```

`difficulty` is 1-5. 1 is foundational and widely used; 5 is highly specialized. It feeds tutorial sequencing and learning path ordering.

---

## Web platform (snipx.dev)

### Routing

```
snipx.dev                        → marketing / demo
snipx.dev/docs/[...]             → documentation
snipx.dev/[username]             → github.com/[username]/snipx (public, no auth)
snipx.dev/[username]/[repo]      → any named repo (auth required if private)
snipx.dev/explore                → browse the official knowledge base
```

No account required to view a public repo. Authentication is GitHub OAuth only, required only for private repo access. The desktop app, CLI, and Nushell module work entirely without a snipx.dev account.

### Cloudflare stack

- **Pages** — hosts the web app
- **Workers** — routing, GitHub API proxy, auth middleware
- **KV** — session storage, public content cache. Keys: `user:[username]`, `repo:[owner]:[repo]:[path]`
- **R2** — vector index sync, knowledge content mirror. Keys: `packages/[tool]/[file]`

### `snipx.dev/[username]` implementation

The Worker determines auth requirements by attempting a public GitHub API fetch. A 404 or 403 triggers the auth redirect. No user content is stored in KV or R2 — only cached and indexed.

---

## Tutorial playground

The tutorial playground is a separate feature from the main React desktop UI. It is built in Vue 3 and lives in `snipx.dev`. **Do not use React, ReactDOM, styled-components, or inline styles in this feature.**

### Stack

| Concern | Technology |
|---------|-----------|
| Components | Vue 3 SFCs, `<script setup lang="ts">` |
| Docs shell | VitePress or Vite SPA |
| State | Pinia |
| Editor | Monaco Editor |
| Browser types | `monaco-editor-auto-typings` via Unpkg |
| Transpilation | Sucrase |
| Module resolution | Rollup |
| Sandboxed execution | Web Worker |
| Panel layout | Reka UI |
| Styling | Tailwind CSS |
| Theme | Catppuccin (default) + Tokyo Night (user-selectable, persisted to localStorage) |

Reference implementation to model: https://github.com/elysiajs/documentation/tree/main/docs/components/xiao/playground

### Execution modes

**Execute mode** (TypeScript / Hono / Zod)
- Monaco editor with full IntelliSense
- In-browser transpilation via Sucrase + Rollup
- Execution sandboxed in Web Worker
- Test validation via HTTP test cases

**Validate mode** (Nushell / Rust / Bash / YAML / VyOS)
- Monaco editor with syntax highlighting
- No execution — validation via regex or AST structure checks
- Tests verify shape, keywords, patterns — not runtime behavior
- Each language has its own validator module

Both modes share the same lesson format, UI shell, and test runner. The distinction is only in how tests are evaluated.

### Lesson format

```typescript
interface Lesson {
  id:        string
  title:     string
  lang:      'typescript' | 'nushell' | 'rust' | 'bash' | 'yaml' | 'vyos'
  mode:      'execute' | 'validate'
  code:      string          // starting code shown in editor
  solution:  string          // used for hint reveal and auto-solve
  hints:     string[]        // progressive hints, revealed one at a time
  tests:     LessonTest[]
  nav: {
    prev:    string | null   // lesson id
    next:    string | null   // lesson id
  }
}

interface LessonTest {
  description: string
  type:        'exec' | 'regex' | 'ast'
  value:       string        // regex pattern, HTTP assertion, or AST selector
  expected?:   unknown
}
```

Lessons live at `lessons/[id].ts` — one per file, imported individually to keep the bundle lean.

### Vue components

All components modular and reusable. Follow Elysia's decomposition where it applies.

- **`<EditorPane>`** — Monaco instance, language-aware, ghost text support, theme sync
- **`<TestRunner>`** — runs tests, shows pass/fail per case, handles both exec and validate modes
- **`<LessonNav>`** — previous/next navigation, progress indicator
- **`<HintPanel>`** — reveals hints one at a time, shows solution on demand
- **`<SplitLayout>`** — Reka UI resizable panels (editor left, output/tests right)
- **`<ThemeToggle>`** — switches Catppuccin / Tokyo Night, persists to localStorage

### State and persistence

- Pinia for all lesson state: current lesson id, editor content, test results, hint index, theme
- Persist to localStorage: current lesson id, per-lesson editor content, theme preference
- On reload, resume the last active lesson with the last editor state

### Reference lessons (all four required)

1. **Welcome** — Monaco TypeScript playground, edit code, see output. Entry point, no prior knowledge assumed.
2. **Nushell pipelines** — validate mode only. User writes a `ps | where cpu > 5 | sort-by cpu --reverse` pipeline. Regex tests verify pipeline operators and command names.
3. **Rust axum handler** — validate mode. Tests check for `async fn`, `State(`, `Path(`, `Ok(`, `StatusCode`.
4. **TypeScript Hono + Zod API** — execute mode. User builds a Hono route with Zod validation. HTTP test cases validate response shape and status codes.

### Relationship to the snipx learning system

When a user completes a lesson, the exercise is saved as a tagged snippet in their local snipx library via the API (`localhost:7878`). Lesson content is sourced from `~/.snipx/packages/[tool]/tutorials/`. The same lesson format is used for the progressive speed-run system (future scope) — each difficulty pass strips scaffolding from the same base exercise. Design the lesson format and component architecture so this extension is possible without structural changes.

---

## The longer arc (v2 scope)

These features are not in scope for v1. They are documented here so v1 architecture decisions do not preclude them.

### Doc corpus ingestion

Automatic downloading, parsing, and vectorization of official docs, API schemas, and tree-sitter / pest grammars into a local index. Feeds search, completions, and the tutorial generator. Doubles as the training corpus for whole-file ghost text suggestions.

### Auto-generated interactive tutorials

Extract and sequence every code example from an ingested doc corpus into a typing interface where the learner produces each example rather than reads it. Ghost text provides scaffolding. Completed examples are saved directly to the snippet library. Learning and building the personal knowledge base happen simultaneously.

### Progressive speed-run challenges

Same tutorial content, multiple passes, increasing difficulty, stripping scaffolding each time.

```
Level 1 — full ghost text, unlimited completions, no time pressure
Level 2 — partial ghost text, limited completions, relaxed par time
Level 3 — first line only, no completions, normal par time
Level 4 — blank file, no hints, tight par time
Level 5 — blank file, no hints, no errors, fast par time
```

Scoring on speed, accuracy, and scaffold usage. A level 5 pass means it is genuinely second nature. Applies to Vim motions, shell patterns, CLI flags, Nushell pipelines, Emmet abbreviations — anything with a learnable motor pattern.

### Whole-file ghost text

Project-aware inline suggestions that model what the entire file should become, not the next token. Accuracy grounded in the ingested doc corpus for the specific library version in use. The developer is still the author — the ghost text is intent made visible ahead of the fingers.

---

## Feature requirements

### P0 — Launch blockers

- [ ] Snippet CRUD with language, category, tag, description, code body
- [ ] Doc entry CRUD with URL, language, category, topics, tags, personal notes
- [ ] Bookmark CRUD with URL, category, tags, date added, personal notes
- [ ] Full-text + tag search across all three types simultaneously
- [ ] Syntax-highlighted code viewer (shiki, Tokyo Night theme)
- [ ] Copy-to-clipboard from viewer
- [ ] Favorite / star any item
- [ ] Persistent local storage (SQLite via `bun:sqlite`, `snipx.db`)
- [ ] HTTP API on `localhost:7878` as Tauri sidecar
- [ ] Nushell module with tab-completion backed by the API
- [ ] REPL panel with command history, arrow-key navigation, full command set

### P1 — High value

- [ ] Import from JSON / TOML / CSV
- [ ] Export to JSON / TOML / Markdown
- [ ] Keyboard navigation: `j`/`k` in list, `/` to focus search, `Esc` to clear, `Enter` to open
- [ ] `snipx` CLI binary installable via `cargo install` or `bun run build`
- [ ] Tag autocomplete in add/edit form
- [ ] Configurable storage path via `~/.config/snipx/config.toml`
- [ ] Tutorial playground (four reference lessons)
- [ ] `snipx add <tool>` — adds knowledge entry, installs skill + overlay

### P2 — Future scope

- [ ] Doc corpus ingestion pipeline
- [ ] Auto-generated interactive tutorials from doc corpus
- [ ] Progressive speed-run challenges
- [ ] Whole-file ghost text (NES)
- [ ] Collections / folders
- [ ] Git-backed sync
- [ ] MCP server exposing snippets as agent tools
- [ ] Cloudflare Workers deployment for cross-device sync
- [ ] VS Code / Neovim plugin

---

## Non-goals for v1

- No cloud sync
- No team or multi-user features
- No AI-powered features in the core app (tutorial playground uses Monaco/Worker infrastructure only)
- No Electron
- No CSS framework in the desktop app
- No Python scripts anywhere

---

## Implementation phases

Work phases in order. Do not begin phase N+1 until phase N passes all done-when checks.

### Phase 0 — Scaffold (0.5 days)

- [ ] `cargo create-tauri-app snipx --template react-ts` with Bun
- [ ] `mise.toml` with pinned Bun, Rust, Node versions
- [ ] `api/` directory with `bun init`
- [ ] `nu/` directory with empty `snipx.nu` skeleton
- [ ] `.gitignore`: `target/`, `node_modules/`, `*.db`, `dist/`
- [ ] `biome.json` for TS/JS formatting
- [ ] `rustfmt.toml` with `edition = "2021"`

**Done when:** `bun run dev` and `bun run api:dev` both start without errors.

### Phase 1 — Database and API (1 day)

- [ ] `api/db.ts` — `snippets`, `docs`, `bookmarks` tables, `migrate_001`
- [ ] `api/lib/id.ts` — nanoid wrapper
- [ ] All five route files with full CRUD and filters
- [ ] `api/index.ts` — routes, CORS, error middleware
- [ ] `src/lib/types.ts` — Zod schemas
- [ ] `src/lib/api.ts` — typed fetch client
- [ ] `api/seed.ts` — 10+10+10 sample items

**Done when:** `bun test api/` passes all route tests including filters and 404s.

### Phase 2 — Frontend (1.5 days)

- [ ] `src/lib/theme.ts` — Tokyo Night `T` object
- [ ] Three-pane layout: sidebar (186px) + list (275px) + detail (flex-1)
- [ ] `window.innerHeight` for full height with resize listener
- [ ] Header: mode tabs, search, Add button, REPL toggle
- [ ] Sidebar: category filter with live counts, Favorites section
- [ ] Status bar
- [ ] All three modes (snippets, docs, bookmarks) with live API data
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

### Phase 4 — Tauri integration (0.5 days)

- [ ] API as Tauri sidecar in `tauri.conf.json`
- [ ] `commands.rs` — `start_api`, `stop_api`, `api_health`
- [ ] Tauri clipboard plugin replacing `navigator.clipboard`
- [ ] System tray: "Show snipx", "Toggle REPL", "Quit"
- [ ] Window state persistence
- [ ] Config read on startup, values passed to sidecar

**Done when:** app launches API automatically, tray works, clipboard works on all platforms.

### Phase 5 — Nushell module (0.5 days)

- [ ] `nu/snipx.nu` — all subcommands per spec above
- [ ] Completions backed by `GET /tags` and hardcoded enums
- [ ] `snipx get <id>` pipeable to stdout
- [ ] `snipx list` returns structured Nushell table
- [ ] `snipx add` interactive prompt
- [ ] Install instructions for `config.nu`

**Done when:** `snipx list | where lang == "rust"` works in a fresh Nushell session.

### Phase 6 — Tutorial playground (1 day)

- [ ] Vue 3 + VitePress or Vite SPA setup in `snipx.dev/`
- [ ] Monaco Editor with language-aware configuration
- [ ] Web Worker execution sandbox
- [ ] Sucrase + Rollup transpilation pipeline
- [ ] All six Vue components (EditorPane, TestRunner, LessonNav, HintPanel, SplitLayout, ThemeToggle)
- [ ] Lesson format implemented with TypeScript interfaces
- [ ] Execute mode and validate mode both working
- [ ] Catppuccin and Tokyo Night themes, persisted to localStorage
- [ ] All four reference lessons implemented and passing

**Done when:** all four reference lessons run correctly, themes persist, state resumes on reload.

### Phase 7 — Polish and release (0.5 days)

- [ ] Keyboard navigation throughout
- [ ] `snipx export --format json` and `snipx import`
- [ ] `cargo tauri build` produces `.dmg` / `.AppImage` / `.msi`
- [ ] README verified against actual build
- [ ] Seed data stripped from production build (`SNIPX_SEED=1 bun run api:dev`)

**Done when:** `cargo tauri build` produces a working artifact on all three platforms.

---

## What not to do

- Do not introduce new dependencies without checking with the user first
- Do not use `localStorage` or `sessionStorage` in the desktop app
- Do not write platform-specific code without `#[cfg(...)]` or a runtime check
- Do not add Prettier/ESLint configs that conflict with the biome config
- Do not rename or restructure directories without explicit instruction
- Do not commit `snipx.db`, `node_modules/`, or `target/`
- Do not use `unwrap()` in production Rust
- Do not use `100vh` for layout height — use `window.innerHeight`
- Do not use React, ReactDOM, styled-components, or inline styles in the tutorial playground
- Do not add Python scripts — TypeScript (Bun) or Nushell only
- Do not anticipate v2 features with v1 schema changes, routes, or abstractions

---

## Startup sequence

```bash
bun install && cargo fetch      # install all dependencies
bun run api:dev                 # start API on port 7878
bun run dev                     # start Tauri + Vite (second terminal)
```

Or:

```bash
./scripts/init.nu setup         # bootstraps the project using claude
```

---

*snipx.sh · snipx.dev · MIT · Daniel Bodnar — daniel@bodnar.sh*
