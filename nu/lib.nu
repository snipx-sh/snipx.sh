# snipx shared helpers
# Used by snipx.nu commands and scripts/

# Get the snipx API base URL.
# Reads SNIPX_API_URL if set, otherwise defaults to localhost:7878.
#
# # Example:
# > api-url
# http://localhost:7878/api/v1
export def api-url []: nothing -> string {
  $env.SNIPX_API_URL? | default "http://localhost:7878/api/v1"
}

# Send a GET request to the snipx API.
# Appends the given path to the API base URL and returns parsed JSON.
#
# # Example:
# > api-get "/health"
export def api-get [
  path: string # API path (e.g. "/snippets")
]: nothing -> any {
  let url = $"(api-url)($path)"
  try {
    http get $url
  } catch {
    error make { msg: $"snipx API request failed: GET ($url)" }
  }
}

# Send a POST request with a JSON body to the snipx API.
# Returns the parsed JSON response.
#
# # Example:
# > api-post "/snippets" { title: "test", code: "echo hi", lang: "bash", cat: "shell" }
export def api-post [
  path: string  # API path (e.g. "/snippets")
  body: record  # JSON body to send
]: nothing -> any {
  let url = $"(api-url)($path)"
  try {
    http post --content-type "application/json" $url $body
  } catch {
    error make { msg: $"snipx API request failed: POST ($url)" }
  }
}

# Send a PATCH request with a JSON body to the snipx API.
# Returns the parsed JSON response.
#
# # Example:
# > api-patch "/snippets/abc123" { title: "updated title" }
export def api-patch [
  path: string  # API path (e.g. "/snippets/abc123")
  body: record  # JSON body with fields to update
]: nothing -> any {
  let url = $"(api-url)($path)"
  try {
    http patch --content-type "application/json" $url $body
  } catch {
    error make { msg: $"snipx API request failed: PATCH ($url)" }
  }
}

# Send a DELETE request to the snipx API.
# Returns the parsed JSON response.
#
# # Example:
# > api-delete "/snippets/abc123"
export def api-delete [
  path: string  # API path (e.g. "/snippets/abc123")
]: nothing -> any {
  let url = $"(api-url)($path)"
  try {
    http delete $url
  } catch {
    error make { msg: $"snipx API request failed: DELETE ($url)" }
  }
}
