#!/usr/bin/env -S nu --stdin

# add.nu - add features and subcommands to the snipx project
#
# Subcommands:
#   feature <name>    add a new feature module
#   command <name>    add a new Nushell subcommand
#
# Global flags:
#   --model <string>      override SNIPX_MODEL
#   --claude <string>     override SNIPX_CLAUDE
#   --dry-run             show output without side effects
#
# Example:
#   ./scripts/add.nu feature import-export
#   ./scripts/add.nu command "snipx export"

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
# main feature
# ---------------------------------------------------------------------------

# Add a new feature module to the project
#
# Creates the necessary files for a new feature:
# API route, frontend component, and test file.
# Optionally asks claude to generate priming content for each file.
#
# # Example:
# > ./scripts/add.nu feature import-export
# > ./scripts/add.nu feature import-export --dry-run
def "main feature" [
  name: string        # feature name (kebab-case)
  --model: string     # override SNIPX_MODEL
  --claude: string    # override SNIPX_CLAUDE
  --dry-run           # show output without side effects
] {
  let cfg = (resolve_config --model=$model --claude=$claude)

  # Convert kebab-case to PascalCase for the component name
  let pascal_name = ($name | split row "-" | each { |w|
    let first = ($w | str substring 0..1 | str upcase)
    let rest = ($w | str substring 1..)
    $"($first)($rest)"
  } | str join "")

  let files = [
    $"api/routes/($name).ts"
    $"src/components/($pascal_name).tsx"
    $"api/__tests__/($name).test.ts"
  ]

  for file in $files {
    if $dry_run {
      print $"would create: ($file)"
    } else {
      let dir = ($file | path dirname)
      mkdir $dir
      "" | save --force $file
      print $"created: ($file)"
    }
  }

  print $"Feature '($name)' scaffolded. Run create.nu add-comments to annotate."
}

# ---------------------------------------------------------------------------
# main command
# ---------------------------------------------------------------------------

# Add a new Nushell subcommand to snipx.nu
#
# Appends a command skeleton to nu/snipx.nu with proper help text
# and example block ready to fill in.
#
# # Example:
# > ./scripts/add.nu command "snipx export"
# > ./scripts/add.nu command "snipx import" --dry-run
def "main command" [
  name: string        # full command name (e.g. "snipx export")
  --model: string     # override SNIPX_MODEL
  --claude: string    # override SNIPX_CLAUDE
  --dry-run           # show output without side effects
] {
  let cfg = (resolve_config --model=$model --claude=$claude)

  let skeleton = [
    ""
    $"# ($name) - TODO: add description"
    "#"
    $"# # Example:"
    $"# > ($name)"
    $"export def \"($name)\" [] {"
    $"  print \"($name): not yet implemented\""
    "}"
    ""
  ] | str join "\n"

  if $dry_run {
    print "Would append to nu/snipx.nu:"
    print $skeleton
  } else {
    if not ("nu/snipx.nu" | path exists) {
      error make { msg: "nu/snipx.nu not found - run from the repo root" }
    }
    $skeleton | save --append nu/snipx.nu
    print $"Added '($name)' to nu/snipx.nu"
  }
}

# ---------------------------------------------------------------------------
# main (help)
# ---------------------------------------------------------------------------

def main [] {
  print "usage: ./scripts/add.nu <subcommand> [--flags] <name>"
  print ""
  print "subcommands:"
  print "  feature <name>    add a new feature module"
  print "  command <name>    add a new Nushell subcommand"
  print ""
  print "flags:"
  print "  --model <m>       claude model (env: SNIPX_MODEL)"
  print "  --claude <path>   claude binary (env: SNIPX_CLAUDE)"
  print "  --dry-run         show output without side effects"
}
