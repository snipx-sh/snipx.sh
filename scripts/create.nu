#!/usr/bin/env -S nu --stdin

# create.nu - scaffold and annotate project files using the claude CLI
#
# Subcommands:
#   scaffold              create project directories and empty files
#   add-comments          add JSDoc/context comments to empty files
#
# Global flags:
#   --model <string>      override SNIPX_MODEL
#   --claude <string>     override SNIPX_CLAUDE
#   --dry-run             show output without side effects

# ---------------------------------------------------------------------------
# config
# ---------------------------------------------------------------------------

# Resolve config from flags and env
def resolve_config [
  --model: string   # override SNIPX_MODEL
  --claude: string  # override SNIPX_CLAUDE
]: nothing -> record {
  {
    model: ($model | default ($env.SNIPX_MODEL? | default "claude-sonnet-4-6"))
    claude: ($claude | default ($env.SNIPX_CLAUDE? | default "claude"))
  }
}

# ---------------------------------------------------------------------------
# core helpers
# ---------------------------------------------------------------------------

# Send a prompt to claude, return the parsed JSON envelope.
def call_claude [
  prompt: string
  cfg:    record  # resolved config from resolve_config
]: nothing -> record {
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

# Call claude and return .result as raw text.
def claude_text [prompt: string  cfg: record]: nothing -> string {
  let envelope = (call_claude $prompt $cfg)
  print $"(ansi dim)cost: $($envelope.cost_usd)(ansi reset)"
  $envelope.result
}

# Write text to a file, with optional dry-run preview.
def write_file [content: string  out: string  --dry-run] {
  if $dry_run {
    print $content
    return
  }
  $content | save --force $out
  let size = ($content | str length)
  print $"(ansi green)wrote(ansi reset) ($out) ($size) bytes"
}

# ---------------------------------------------------------------------------
# main scaffold
# ---------------------------------------------------------------------------

# Scaffold project directories and starter files
#
# Creates the standard directory structure and empty placeholder files.
# Does not overwrite existing files.
#
# # Example:
# > ./scripts/create.nu scaffold
# > ./scripts/create.nu scaffold --dry-run
def "main scaffold" [
  --model: string   # override SNIPX_MODEL
  --claude: string  # override SNIPX_CLAUDE
  --dry-run         # show output without side effects
] {
  let dirs = [
    "api/routes"
    "api/lib"
    "api/__tests__"
    "src/components"
    "src/hooks"
    "src/lib"
    "src-tauri/src"
    "nu"
    "scripts"
    "docs"
  ]

  for dir in $dirs {
    if $dry_run {
      print $"would create: ($dir)/"
    } else {
      mkdir $dir
      print $"created: ($dir)/"
    }
  }
}

# ---------------------------------------------------------------------------
# main add-comments
# ---------------------------------------------------------------------------

# Add JSDoc and context comments to empty source files
#
# Walks the project tree, finds empty .ts/.tsx/.rs/.nu files,
# and asks claude to add priming comments.
#
# # Example:
# > ./scripts/create.nu add-comments
# > ./scripts/create.nu add-comments --include "src/**/*.tsx"
def "main add-comments" [
  --model: string    # override SNIPX_MODEL
  --claude: string   # override SNIPX_CLAUDE
  --include: string  # glob pattern to include
  --exclude: string  # glob pattern to exclude
  --dry-run          # show output without side effects
] {
  let cfg = (resolve_config --model=$model --claude=$claude)

  let pattern = ($include | default "**/*.{ts,tsx,rs,nu}")
  let files = (glob $pattern | where { |f|
    let size = ($f | path expand | open --raw | str length)
    $size < 50
  })

  if ($exclude != null) {
    let files = ($files | where { |f|
      not ($f | str contains $exclude)
    })
  }

  if ($files | is-empty) {
    print "No empty files found matching pattern"
    return
  }

  print $"Found ($files | length) empty files"

  for file in $files {
    let ext = ($file | path parse | get extension)
    let comment_style = match $ext {
      "rs" => "rust doc comments (///)"
      "nu" => "nushell doc comments (#)"
      _ => "JSDoc comments"
    }

    if $dry_run {
      print $"would annotate: ($file) with ($comment_style)"
    } else {
      print $"annotating: ($file)"

      let rel = ($file | path relative-to (pwd))
      let content = (claude_text $"Write a priming comment for a new source file at ($rel).
The file is part of snipx - a local-first developer knowledge manager.
Use ($comment_style) style. Include the file path, a brief purpose description,
and any relevant type stubs or function signatures based on the file name
and location in the project tree.
Return ONLY the comment text, no markdown fences." $cfg)

      write_file $content ($file | into string)
    }
  }
}

# ---------------------------------------------------------------------------
# main (help)
# ---------------------------------------------------------------------------

def main [] {
  print "usage: ./scripts/create.nu <subcommand> [--flags]"
  print ""
  print "subcommands:"
  print "  scaffold              create project directories and empty files"
  print "  add-comments          add JSDoc/context comments to empty files"
  print ""
  print "flags:"
  print "  --model <m>           claude model (env: SNIPX_MODEL)"
  print "  --claude <path>       claude binary (env: SNIPX_CLAUDE)"
  print "  --dry-run             show output without side effects"
}
