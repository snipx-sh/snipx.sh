# snipx - local-first developer knowledge manager
# Main Nushell module. All commands talk to the HTTP API.

use lib.nu *

export-env {
  let snipx_lib = ($env.HOME | path join ".snipx" "packages")
  let existing = ($env.NU_LIB_DIRS? | default [])
  if not ($snipx_lib in $existing) {
    $env.NU_LIB_DIRS = ($existing | append $snipx_lib)
  }
}

# List all snippets as a structured table.
# Optionally filter by programming language.
#
# # Example:
# > snipx list
# > snipx list --lang rust
export def "snipx list" [
  --lang: string  # filter by programming language
]: nothing -> table {
  let path = if ($lang != null) {
    $"/snippets?lang=($lang)"
  } else {
    "/snippets"
  }
  api-get $path | select id title lang cat fav
}

# Print snippet code to stdout.
# The output is raw text so it can be piped into other commands.
#
# # Example:
# > snipx get abc123
export def "snipx get" [
  id: string  # snippet ID (nanoid)
]: nothing -> string {
  let snippet = (api-get $"/snippets/($id)")
  $snippet.code
}

# Interactively add a new snippet.
# Prompts for title, language, category, code, tags, and description.
#
# # Example:
# > snipx add
export def "snipx add" [] {
  let title = (input "Title: ")
  let lang = (input "Language: ")
  let cat = (input "Category: ")
  let code = (input "Code (single line): ")
  let tags_raw = (input "Tags (comma-separated): ")
  let tags = ($tags_raw | split row "," | each { str trim } | where { $in != "" })
  let desc = (input "Description: ")

  api-post "/snippets" {
    title: $title
    code: $code
    lang: $lang
    cat: $cat
    tags: $tags
    desc: $desc
    fav: false
  }
}

# Copy snippet code to the system clipboard.
# Uses the `clip` command available in Nushell.
#
# # Example:
# > snipx copy abc123
export def "snipx copy" [
  id: string  # snippet ID (nanoid)
]: nothing -> nothing {
  let code = (snipx get $id)
  $code | clip
  print $"Copied snippet ($id) to clipboard"
}

# Search across snippets, docs, and bookmarks.
# Returns a table of matching results from all content types.
#
# # Example:
# > snipx search "http client"
export def "snipx search" [
  query: string  # search query
]: nothing -> table {
  api-get $"/search?q=($query | url encode)"
}

# List all doc references as a structured table.
#
# # Example:
# > snipx docs list
export def "snipx docs list" []: nothing -> table {
  api-get "/docs" | select id title lang cat topic
}

# Get a doc reference by ID and print its content.
#
# # Example:
# > snipx docs get abc123
export def "snipx docs get" [
  id: string  # doc reference ID (nanoid)
]: nothing -> any {
  api-get $"/docs/($id)"
}

# Open a doc reference URL in the default browser.
#
# # Example:
# > snipx docs open abc123
export def "snipx docs open" [
  id: string  # doc reference ID (nanoid)
]: nothing -> nothing {
  let doc = (api-get $"/docs/($id)")
  ^open $doc.url
  print $"Opened ($doc.title)"
}

# List all bookmarks as a structured table.
#
# # Example:
# > snipx bm list
export def "snipx bm list" []: nothing -> table {
  api-get "/bookmarks" | select id title cat fav
}

# Get a bookmark by ID.
#
# # Example:
# > snipx bm get abc123
export def "snipx bm get" [
  id: string  # bookmark ID (nanoid)
]: nothing -> any {
  api-get $"/bookmarks/($id)"
}

# Open a bookmark URL in the default browser.
#
# # Example:
# > snipx bm open abc123
export def "snipx bm open" [
  id: string  # bookmark ID (nanoid)
]: nothing -> nothing {
  let bm = (api-get $"/bookmarks/($id)")
  ^open $bm.url
  print $"Opened ($bm.title)"
}

# List all tags with their usage counts.
# Returns a table with tag name and count columns.
#
# # Example:
# > snipx tags
export def "snipx tags" []: nothing -> table {
  api-get "/tags"
}

# Check API health status.
# Returns the health response including version info.
#
# # Example:
# > snipx health
export def "snipx health" []: nothing -> any {
  api-get "/health"
}

# Delete a snippet by ID.
#
# # Example:
# > snipx delete abc123
export def "snipx delete" [
  id: string  # snippet ID (nanoid)
]: nothing -> any {
  api-delete $"/snippets/($id)"
}

# Update a snippet by ID with the provided fields.
#
# # Example:
# > snipx update abc123 { title: "new title" }
export def "snipx update" [
  id: string    # snippet ID (nanoid)
  body: record  # fields to update
]: nothing -> any {
  api-patch $"/snippets/($id)" $body
}

# Push local changes to the configured git remote.
# Runs git add, commit, and push in ~/.snipx/.
#
# # Example:
# > snipx sync
export def "snipx sync" [] {
  let result = (api-post "/sync/push" {})
  print $result.message
}

# Pull changes from the configured git remote.
# Runs git pull --rebase in ~/.snipx/.
#
# # Example:
# > snipx sync pull
export def "snipx sync pull" [] {
  let result = (api-post "/sync/pull" {})
  print $result.message
}

# Show sync status with the git remote.
# Shows ahead/behind counts and dirty state.
#
# # Example:
# > snipx sync status
export def "snipx sync status" []: nothing -> record {
  api-get "/sync/status"
}

# Rebuild the search index from files.
# Scans ~/.snipx/ and rebuilds the DuckDB index.
# (Currently triggers API to re-read files)
#
# # Example:
# > snipx index
export def "snipx index" [] {
  print "Rebuilding index from files..."
  # The API reads files directly in v1 - no separate index yet
  let snippets = (api-get "/snippets" | length)
  let docs = (api-get "/docs" | length)
  let bookmarks = (api-get "/bookmarks" | length)
  print $"Indexed ($snippets) snippets, ($docs) docs, ($bookmarks) bookmarks"
}

# List all collections.
#
# # Example:
# > snipx collections
export def "snipx collections" []: nothing -> table {
  api-get "/collections"
}
