# snipx.sh

Source code for [snipx](https://snipx.sh) — a local-first developer knowledge manager.

**snipx.sh · snipx.dev**

---

## What's in this repo

```
snipx.sh/
├── src-tauri/          # Tauri v2 app shell (Rust)
├── src/                # React frontend (TypeScript)
├── api/                # Bun + Hono HTTP API
├── nu/                 # Nushell module (snipx.nu)
├── scripts/            # Bootstrap + development tooling
│   ├── init.nu         # repo setup, readme generation, skill installation
│   ├── create.nu       # scaffold, add-comments
│   └── add.nu          # add new features and subcommands
└── docs/               # architecture and API reference
```

## Prerequisites

- [Rust](https://rustup.rs/) stable
- [Bun](https://bun.sh/) >= 1.1
- [Nushell](https://www.nushell.sh/) >= 0.111.0
- [mise](https://mise.jdx.dev/) — recommended for toolchain management
- Tauri v2 CLI: `cargo install tauri-cli --version "^2"`

## Dev setup

```bash
git clone https://github.com/snipx-sh/snipx.sh
cd snipx.sh
bun install && cargo fetch
bun run api:dev      # API on localhost:7878
bun run dev          # Tauri + Vite (second terminal)
```

Or use the bootstrap script:

```bash
./scripts/init.nu setup
```

## Nushell module

```nushell
use ~/.config/snipx/snipx.nu *
snipx list --lang rust
snipx get nu-pipeline | pbcopy
snipx search "axum handler"
```

## Configuration

`~/.config/snipx/config.toml`:

```toml
[api]
port = 7878
host = "127.0.0.1"

[storage]
db_path = "~/.local/share/snipx/snipx.db"
```

Environment overrides: `SNIPX_HOME`, `SNIPX_CONFIG_DIR`, `SNIPX_CONFIG_FILE`.

## Docs

Full documentation at [snipx.dev/docs](https://snipx.dev/docs).

- [Architecture](https://snipx.dev/docs/architecture)
- [API reference](https://snipx.dev/docs/api)
- [Nushell module](https://snipx.dev/docs/nushell)
- [Scripts](https://snipx.dev/docs/scripts)

## License

MIT
