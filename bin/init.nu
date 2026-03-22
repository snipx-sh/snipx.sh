#!/usr/bin/env -S nu --stdin

# init.nu — bootstrap a snipx project using the claude CLI
#
# Configuration is read from environment variables, with per-subcommand
# flags available to override for a single invocation.
#
# Environment variables (all optional — defaults shown):
#   SNIPX_MODEL    claude model to use          (default: claude-sonnet-4-6)
#   SNIPX_OWNER    GitHub owner / org           (default: danielbodnar)
#   SNIPX_REPO     repository name              (default: snipx)
#   SNIPX_CLAUDE   path or name of claude CLI   (default: claude)
#   SNIPX_AGENT    target agent for skills      (default: claude-code)
#
# Usage:
#   ./init.nu <subcommand> [--flags] [positional]
#
# Subcommands:
#   repo              ask claude for the gh repo create command and run it
#   readme            ask claude to generate README.md from PRD.md
#   skills [query]    find and install a Claude Code skill via bunx skills
#   setup             generate .claude/commands/ slash command files (stub)
#
# Global override flags (accepted by every subcommand):
#   --model <string>   override SNIPX_MODEL for this invocation
#   --owner <string>   override SNIPX_OWNER for this invocation
#   --repo  <string>   override SNIPX_REPO  for this invocation
#   --claude <string>  override SNIPX_CLAUDE for this invocation
#
# Common flags:
#   --dry-run          show output without side effects
#   --yes              skip confirmation prompts

# ---------------------------------------------------------------------------
# config
# ---------------------------------------------------------------------------

# Build the resolved config record for a single invocation.
# Flag values take precedence over environment variables, which take
# precedence over the hard-coded defaults.
def resolve_config [
    --model:  string   # override SNIPX_MODEL
    --owner:  string   # override SNIPX_OWNER
    --repo:   string   # override SNIPX_REPO
    --claude: string   # override SNIPX_CLAUDE
    --agent:  string   # override SNIPX_AGENT
] -> record {
    {
        model:  ($model  | default ($env.SNIPX_MODEL?  | default "claude-sonnet-4-6"))
        owner:  ($owner  | default ($env.SNIPX_OWNER?  | default "danielbodnar"))
        repo:   ($repo   | default ($env.SNIPX_REPO?   | default "snipx"))
        claude: ($claude | default ($env.SNIPX_CLAUDE? | default "claude"))
        agent:  ($agent  | default ($env.SNIPX_AGENT?  | default "claude-code"))
    }
}

# ---------------------------------------------------------------------------
# core helpers
# ---------------------------------------------------------------------------

# Send a prompt to claude, return the parsed JSON envelope.
def call_claude [
    prompt: string
    cfg:    record  # resolved config from resolve_config
] -> record {
    let flags = [
        "--print"
        "--output-format" "json"
        "--model" $cfg.model
    ]
    let raw      = (^($cfg.claude) ...$flags $prompt)
    let envelope = ($raw | from json)
    if $envelope.is_error {
        error make {
            msg:   "claude returned an error"
            label: { text: $envelope.result  span: (metadata $prompt).span }
        }
    }
    $envelope
}

# Call claude and parse .result as a JSON object.
def claude_json [prompt: string  cfg: record] -> record {
    let envelope = (call_claude $prompt $cfg)
    print $"(ansi dim)cost: $($envelope.cost_usd)(ansi reset)"
    $envelope.result | from json
}

# Call claude and return .result as raw text.
def claude_text [prompt: string  cfg: record] -> string {
    let envelope = (call_claude $prompt $cfg)
    print $"(ansi dim)cost: $($envelope.cost_usd)(ansi reset)"
    $envelope.result
}

# Print a shell command, optionally confirm, then execute it.
def confirm_and_run [
    cmd: string
    --yes
    --dry-run
] -> int {
    print $"(ansi cyan)command:(ansi reset) ($cmd)"
    if $dry_run {
        print $"(ansi yellow)--dry-run — not executing(ansi reset)"
        return 0
    }
    if not $yes {
        let answer = (input $"(ansi yellow)run this? [y/N] (ansi reset)")
        if ($answer | str downcase | str trim) != "y" {
            print "aborted"
            return 1
        }
    }
    ^sh -c $cmd
    0
}

# Write text to a file, with optional dry-run preview.
def write_file [content: string  out: string  --dry-run] {
    if $dry_run {
        print $content
        return
    }
    $content | save --force $out
    print $"(ansi green)wrote(ansi reset) ($out) (($content | str length) bytes)"
}

# ---------------------------------------------------------------------------
# main repo
# ---------------------------------------------------------------------------

# Ask claude for the gh CLI command to create the snipx repo, then run it.
def "main repo" [
    --model:  string   # override SNIPX_MODEL
    --owner:  string   # override SNIPX_OWNER
    --repo:   string   # override SNIPX_REPO
    --claude: string   # override SNIPX_CLAUDE
    --yes              # skip confirmation
    --dry-run          # print without executing
] {
    let cfg = (resolve_config
        --model=$model --owner=$owner --repo=$repo --claude=$claude)

    let payload = (claude_json $"Return ONLY a JSON object — no markdown fences,
no explanation, no extra keys — with exactly these two fields:
  \"command\"     the complete, non-interactive gh CLI invocation to create a private
                  GitHub repository named ($cfg.owner)/($cfg.repo) with description
                  'A local-first developer knowledge manager. Snippets, docs,
                  and bookmarks — searchable from your shell.'
                  Do NOT initialize a README.
  \"description\" one sentence describing what the command does.

Shape \(values are illustrative\):
{ \"command\": \"gh repo create owner/name --private --description '...' --no-readme\",
  \"description\": \"Creates a private GitHub repository with no initial files.\" }" $cfg)

    print $"(ansi dim)($payload.description)(ansi reset)"
    confirm_and_run $payload.command --yes=$yes --dry-run=$dry_run
    if not $dry_run { print $"(ansi green)done(ansi reset)" }
}

# ---------------------------------------------------------------------------
# main readme
# ---------------------------------------------------------------------------

# Ask claude to generate README.md from PRD.md, then write it to disk.
def "main readme" [
    --model:  string            # override SNIPX_MODEL
    --claude: string            # override SNIPX_CLAUDE
    --prd:    string = "PRD.md" # path to PRD used as context
    --out:    string = "README.md"
    --dry-run
] {
    let cfg = (resolve_config --model=$model --claude=$claude)

    if not ($prd | path exists) {
        error make { msg: $"PRD not found at '($prd)' — run from the repo root" }
    }

    let prd_text = (open $prd)
    let content  = (claude_text $"You are writing README.md for snipx \(snipx.sh / snipx.dev\).

Use the PRD below as the authoritative source for every claim, command, path,
and URL. Do not invent or hallucinate details. Write in plain, direct prose —
no theatrical pivots, no dramatic setups, no preamble before a point.

Return ONLY the raw README.md content. No markdown code fences wrapping the
whole file. No explanation. Start directly with # snipx.

---
($prd_text)
---" $cfg)

    write_file $content $out --dry-run=$dry_run
}

# ---------------------------------------------------------------------------
# main skills
# ---------------------------------------------------------------------------

# Find and install a Claude Code skill using `bunx skills`.
#
# Two-step process:
#   1. Ask claude which `bunx skills add <repo> --list` command best matches
#      the query, run it, capture the listing.
#   2. Feed the listing back to claude to pick the best skill and build the
#      final install command.
def "main skills" [
    query?: string              # what kind of skill to find (positional, optional)
    --model:  string            # override SNIPX_MODEL
    --claude: string            # override SNIPX_CLAUDE
    --agent:  string            # override SNIPX_AGENT
    --yes                       # skip confirmation
    --dry-run
] {
    let cfg = (resolve_config --model=$model --claude=$claude --agent=$agent)
    let q   = ($query | default "bun runtime documentation and development workflows")

    # ── step 1: locate the right skills repo ────────────────────────────
    print $"(ansi dim)step 1/2 — finding skills repo for: ($q)(ansi reset)"

    let list_payload = (claude_json $"Return ONLY a JSON object — no markdown fences,
no extra keys — with exactly these fields:
  \"command\"     a `bunx skills add <owner/repo> --list` command most likely to
                  surface skills matching this query: ($q)
                  For bun.sh runtime / development workflow skills the correct
                  repo is laurigates/claude-plugins. Use that unless a clearly
                  more appropriate repo exists for the query.
  \"description\" one sentence on why this repo is the right source.

Shape:
{ \"command\": \"bunx skills add laurigates/claude-plugins --list\",
  \"description\": \"laurigates/claude-plugins contains a bun-development skill.\" }" $cfg)

    print $"(ansi dim)($list_payload.description)(ansi reset)"
    print $"(ansi cyan)listing:(ansi reset) ($list_payload.command)"

    let listing = (^sh -c $list_payload.command | complete)
    if $listing.exit_code != 0 {
        error make { msg: $"bunx skills list failed: ($listing.stderr)" }
    }

    # ── step 2: pick best match and build install command ────────────────
    print $"(ansi dim)step 2/2 — selecting best match(ansi reset)"

    let add_payload = (claude_json $"Below is the output of `($list_payload.command)`.
Return ONLY a JSON object — no markdown fences, no extra keys — with:
  \"skill\"       the exact skill name to install
  \"command\"     the complete `bunx skills add` install command, non-interactive
                  \(include -y\), targeting agent ($cfg.agent)
  \"description\" one sentence on why this is the best match for: ($q)

Listing:
---
($listing.stdout)
---

Shape:
{ \"skill\": \"bun-development\",
  \"command\": \"bunx skills add laurigates/claude-plugins --skill bun-development -a ($cfg.agent) -y\",
  \"description\": \"bun-development covers the bun runtime, bunx, and project init patterns.\" }" $cfg)

    print $"(ansi dim)selected: ($add_payload.skill) — ($add_payload.description)(ansi reset)"
    confirm_and_run $add_payload.command --yes=$yes --dry-run=$dry_run
    if not $dry_run {
        print $"(ansi green)skill installed: ($add_payload.skill)(ansi reset)"
    }
}

# ---------------------------------------------------------------------------
# main setup  (stub)
# ---------------------------------------------------------------------------

# Generate .claude/commands/ slash command files via the same
# Nushell -> claude -> write_file pattern used by other subcommands.
def "main setup" [
    --model:  string  # override SNIPX_MODEL
    --claude: string  # override SNIPX_CLAUDE
    --dry-run
] {
    let cfg = (resolve_config --model=$model --claude=$claude)
    mkdir --verbose .claude/commands

    # example: /project:prd-context — injects PRD.md into conversation context
    # let content = (claude_text "Write a Claude slash command markdown file whose
    # sole purpose is to inject the contents of PRD.md into the conversation so
    # subsequent prompts can reference it without re-pasting. Return only the raw
    # markdown body with no code fences." $cfg)
    # write_file $content ".claude/commands/prd-context.md" --dry-run=$dry_run

    print "setup stub — uncomment and extend for your slash commands"
}

# ---------------------------------------------------------------------------
# main (help)
# ---------------------------------------------------------------------------

def main [] {
    print "usage: ./init.nu <subcommand> [--flags] [positional]"
    print ""
    print "subcommands:"
    print "  repo              create the GitHub repo via gh CLI"
    print "  readme            generate README.md from PRD.md"
    print "  skills [query]    find and install a Claude Code skill"
    print "  setup             generate .claude/commands/ files (stub)"
    print ""
    print "global overrides (accepted by every subcommand):"
    print "  --model <m>       claude model  (env: SNIPX_MODEL,  default: claude-sonnet-4-6)"
    print "  --owner <o>       GitHub owner  (env: SNIPX_OWNER,  default: danielbodnar)"
    print "  --repo  <r>       repo name     (env: SNIPX_REPO,   default: snipx)"
    print "  --claude <path>   claude binary (env: SNIPX_CLAUDE, default: claude)"
    print "  --agent <a>       target agent  (env: SNIPX_AGENT,  default: claude-code)"
    print ""
    print "common flags:"
    print "  --dry-run         show output without side effects"
    print "  --yes             skip confirmation prompts"
    print ""
    print "environment variables take precedence over defaults."
    print "flags take precedence over environment variables."
}
