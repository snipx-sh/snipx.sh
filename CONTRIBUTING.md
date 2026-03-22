# Contributing to the snipx registry

This is a content repo. Contributing means adding or improving packages for developer tools, languages, and frameworks — curated knowledge that gives Claude better context and gives snipx users better completions, snippets, and tutorials.

Any tier of contribution is welcome. A well-curated `SKILL.md` and a good `references/` directory is already genuinely useful.

---

## Getting started

```bash
git clone https://github.com/snipx-sh/snipx
cd snipx
```

No build step. Packages are directories of files.

## Three tiers of contribution

**Tier 1 — Skill only.** The minimum viable contribution. Provides Claude with curated context when working with this tool.

```
packages/[tool]/
├── SKILL.md
├── references/
│   ├── overview.md
│   ├── api.md
│   └── patterns.md
└── scripts/
    ├── fetch-docs.ts
    └── validate.nu
```

**Tier 2 — Full overlay.** Adds Nushell integration — completions, commands, and environment hooks.

```
+ mod.nu
+ nupm.nuon
+ completions/
+ commands/
+ hooks/
```

**Tier 3 — Learning unit.** Adds snippets, tutorials, speed-run sequences, and the full registry manifest.

```
+ snipx.nuon
+ snippets/
+ tutorials/
+ mcp/          (optional)
```

## Adding a new package

1. Create `packages/[tool]/` using the tool's canonical lowercase name
2. Copy `packages/_template/` as a starting point
3. Write `SKILL.md` — read [snipx.dev/docs/skill-guide](https://snipx.dev/docs/skill-guide) first
4. Populate `references/` with distilled content from the official docs
5. Run `packages/[tool]/scripts/validate.nu` — it must pass before opening a PR
6. Add an entry to `registry.nuon`

## Improving an existing package

Open a PR with a clear description of what changed and why. For `references/` changes, link to the upstream doc that prompted the update. For `snippets/` changes, verify the snippet runs as written.

## Package naming

- Directory name = tool name = `name` in `snipx.nuon` = Nushell overlay name
- Lowercase, hyphens for multi-word names: `cloudflare-workers`, not `CloudflareWorkers`
- Use the tool's own canonical name

## What makes a good package

**`SKILL.md`**
- Description is specific enough that Claude loads it when the tool is relevant
- Instructions use imperative form
- Examples are concrete and runnable
- Reference files are linked explicitly

**`references/`**
- Distilled from official docs — not copy-pasted
- Each file covers one topic
- `overview.md` answers: what is this, when to use it, core concepts
- `api.md` covers the most-used APIs and flags — not everything, the important parts
- `patterns.md` covers idioms, anti-patterns, and things that surprise people

**`snippets/`**
- Each snippet runs as written
- Tagged accurately in `index.nuon`
- Named descriptively — the filename should tell you what it does

**`tutorials/`**
- Sequenced from simplest to most complex
- `deps` in `snipx.nuon` correctly lists any prerequisite packages
- Each exercise file has enough scaffolding comments to guide without giving it away

Full guides at [snipx.dev/docs](https://snipx.dev/docs).

## Scripts

Use TypeScript (Bun) for `scripts/fetch-docs.ts` and anything needing HTTP or file parsing. Use Nushell for `scripts/validate.nu` and anything shell-native. No Python.

## Review criteria

PRs are reviewed for accuracy (examples run as written), curation quality (`references/` is distilled, not dumped), completeness (`validate.nu` passes, `registry.nuon` is updated), and prose style (plain and direct, per `AGENTS.md`).
