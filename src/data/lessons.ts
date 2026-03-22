import { T } from "../lib/theme"
import type { Chapter } from "../stores/learn"

export const chapters: Chapter[] = [
  {
    id: "nushell",
    title: "Nushell",
    color: T.blue,
    lessons: [
      {
        id: "nu-data-pipelines",
        title: "Data Pipelines",
        section: "Nushell",
        lang: "nushell",
        content: [
          { type: "h2", text: "Structured Data Pipelines" },
          {
            type: "p",
            text: "Nushell treats all data as structured tables. Every command inputs and outputs structured data, making pipelines composable and predictable.",
          },
          {
            type: "code",
            text: "ps | where cpu > 5.0 | sort-by cpu --reverse | first 10",
            lang: "nushell",
          },
          {
            type: "tip",
            text: "Unlike bash, Nushell pipes structured data between commands. No parsing text output.",
          },
          {
            type: "p",
            text: "Your task: write a pipeline that lists processes, filters to those using more than 5% CPU, sorts by CPU usage descending, and takes the first 10.",
          },
        ],
        starter: "# Filter processes by CPU usage\n",
        solution:
          "ps\n  | where cpu > 5.0\n  | select name pid cpu mem\n  | sort-by cpu --reverse\n  | first 10",
        tasks: [
          {
            id: "t1",
            label: "Use the ps command",
            check: (code: string) => /\bps\b/.test(code),
          },
          {
            id: "t2",
            label: "Filter with where cpu > 5",
            check: (code: string) => /where\s+cpu\s*>\s*5/.test(code),
          },
          {
            id: "t3",
            label: "Sort by cpu in reverse",
            check: (code: string) => /sort-by\s+cpu\s+--reverse/.test(code),
          },
          {
            id: "t4",
            label: "Take first 10 results",
            check: (code: string) => /first\s+10/.test(code),
          },
        ],
        output:
          "name       pid   cpu   mem\nfirefox    1234  45.2  1.2GB\ncode       5678  12.8  800MB\n...",
      },
      {
        id: "nu-http-json",
        title: "HTTP & JSON",
        section: "Nushell",
        lang: "nushell",
        content: [
          { type: "h2", text: "HTTP Requests and JSON" },
          {
            type: "p",
            text: "Nushell's http get returns structured data directly. No need for jq or parsing.",
          },
          {
            type: "code",
            text: 'http get "https://api.github.com/users/octocat" | select login name public_repos',
            lang: "nushell",
          },
          {
            type: "p",
            text: "Fetch a GitHub user profile and extract the login, name, and repos_url fields.",
          },
        ],
        starter: "# Fetch a GitHub profile\n",
        solution:
          'http get "https://api.github.com/users/octocat"\n  | select login name repos_url',
        tasks: [
          {
            id: "t1",
            label: "Use http get",
            check: (code: string) => /http\s+get/.test(code),
          },
          {
            id: "t2",
            label: "Target the GitHub API",
            check: (code: string) => /api\.github\.com/.test(code),
          },
          {
            id: "t3",
            label: "Select specific fields",
            check: (code: string) => /select/.test(code),
          },
        ],
        output:
          "login: octocat\nname: The Octocat\nrepos_url: https://api.github.com/users/octocat/repos",
      },
      {
        id: "nu-custom-commands",
        title: "Custom Commands",
        section: "Nushell",
        lang: "nushell",
        content: [
          { type: "h2", text: "Custom Commands with Types" },
          {
            type: "p",
            text: "Nushell commands have typed signatures with flags, defaults, and doc comments.",
          },
          {
            type: "code",
            text: 'def greet [name: string, --loud] {\n  let msg = $"Hello, ($name)!"\n  if $loud { $msg | str upcase } else { $msg }\n}',
            lang: "nushell",
          },
          {
            type: "tip",
            text: "Boolean flags like --loud don't take a value. They're true when present, false when absent.",
          },
          {
            type: "p",
            text: "Write a command called 'greet' that takes a name and an optional --loud flag.",
          },
        ],
        starter: "# Define a greeting command\n",
        solution:
          'def greet [name: string, --loud] {\n  let msg = $"Hello, ($name)!"\n  if $loud { $msg | str upcase } else { $msg }\n}',
        tasks: [
          {
            id: "t1",
            label: "Define with def keyword",
            check: (code: string) => /\bdef\s+greet\b/.test(code),
          },
          {
            id: "t2",
            label: "Accept name: string parameter",
            check: (code: string) => /name:\s*string/.test(code),
          },
          {
            id: "t3",
            label: "Add --loud flag",
            check: (code: string) => /--loud/.test(code),
          },
          {
            id: "t4",
            label: "Use string interpolation",
            check: (code: string) => /\$"/.test(code),
          },
        ],
        output: "Hello, World!",
      },
    ],
  },
  {
    id: "bun",
    title: "Bun",
    color: T.orange,
    lessons: [
      {
        id: "bun-http-server",
        title: "HTTP Server",
        section: "Bun",
        lang: "typescript",
        content: [
          { type: "h2", text: "Bun.serve HTTP Server" },
          {
            type: "p",
            text: "Bun includes a high-performance HTTP server. No external packages needed.",
          },
          {
            type: "code",
            text: 'Bun.serve({\n  port: 3000,\n  fetch(req) {\n    return new Response("Hello!")\n  },\n})',
            lang: "typescript",
          },
          {
            type: "p",
            text: "Create a server on port 3000 with a /health endpoint that returns JSON.",
          },
        ],
        starter: "// Create a Bun HTTP server\n",
        solution:
          'Bun.serve({\n  port: 3000,\n  fetch(req) {\n    const url = new URL(req.url)\n    if (url.pathname === "/health") {\n      return Response.json({ ok: true })\n    }\n    return new Response("Not Found", { status: 404 })\n  },\n})',
        tasks: [
          {
            id: "t1",
            label: "Use Bun.serve()",
            check: (code: string) => /Bun\.serve/.test(code),
          },
          {
            id: "t2",
            label: "Set port to 3000",
            check: (code: string) => /port:\s*3000/.test(code),
          },
          {
            id: "t3",
            label: "Handle /health endpoint",
            check: (code: string) => /\/health/.test(code),
          },
          {
            id: "t4",
            label: "Return JSON response",
            check: (code: string) => /Response\.json/.test(code),
          },
        ],
        output: '{ "ok": true }',
      },
      {
        id: "bun-test",
        title: "Testing with Bun",
        section: "Bun",
        lang: "typescript",
        content: [
          { type: "h2", text: "Bun Test Runner" },
          {
            type: "p",
            text: "Bun has a built-in test runner compatible with Jest syntax.",
          },
          {
            type: "code",
            text: 'import { describe, test, expect } from "bun:test"\n\ndescribe("math", () => {\n  test("adds numbers", () => {\n    expect(2 + 2).toBe(4)\n  })\n})',
            lang: "typescript",
          },
          {
            type: "p",
            text: "Write a test suite that verifies basic string operations.",
          },
        ],
        starter:
          '// Write a test for string operations\nimport { describe, test, expect } from "bun:test"\n\n',
        solution:
          'import { describe, test, expect } from "bun:test"\n\ndescribe("strings", () => {\n  test("concatenation", () => {\n    expect("hello" + " " + "world").toBe("hello world")\n  })\n  test("includes", () => {\n    expect("hello world".includes("world")).toBe(true)\n  })\n})',
        tasks: [
          {
            id: "t1",
            label: "Use describe block",
            check: (code: string) => /describe\(/.test(code),
          },
          {
            id: "t2",
            label: "Write at least one test",
            check: (code: string) => /test\(/.test(code),
          },
          {
            id: "t3",
            label: "Use expect assertion",
            check: (code: string) => /expect\(/.test(code),
          },
        ],
        output: "2 pass\n0 fail",
      },
    ],
  },
  {
    id: "cloudflare",
    title: "Cloudflare Workers",
    color: T.teal,
    lessons: [
      {
        id: "cf-cache-worker",
        title: "Cache-First Worker",
        section: "Cloudflare Workers",
        lang: "typescript",
        content: [
          { type: "h2", text: "Cache-First with KV" },
          {
            type: "p",
            text: "Workers KV provides a global key-value store. Use it to cache expensive fetches.",
          },
          {
            type: "code",
            text: 'const cached = await env.CACHE.get(key)\nif (cached) return new Response(cached, { headers: { "X-Cache": "HIT" } })',
            lang: "typescript",
          },
          {
            type: "tip",
            text: "Always set X-Cache headers so you can debug cache behavior.",
          },
          {
            type: "p",
            text: "Build a Worker that checks KV first, falls back to origin, and caches the result.",
          },
        ],
        starter:
          "export default {\n  async fetch(req, env, ctx) {\n    const url = new URL(req.url)\n    const key = url.pathname\n\n    // Check cache first\n\n    // Fetch from origin\n\n    // Store in cache\n\n  },\n}",
        solution:
          'export default {\n  async fetch(req, env, ctx) {\n    const url = new URL(req.url)\n    const key = url.pathname\n\n    const cached = await env.CACHE.get(key)\n    if (cached) {\n      return new Response(cached, {\n        headers: { "X-Cache": "HIT" },\n      })\n    }\n\n    const res = await fetch(req)\n    const body = await res.text()\n\n    ctx.waitUntil(env.CACHE.put(key, body))\n\n    return new Response(body, {\n      headers: { "X-Cache": "MISS" },\n    })\n  },\n}',
        tasks: [
          {
            id: "t1",
            label: "Read from KV with env.CACHE.get",
            check: (code: string) => /env\.CACHE\.get/.test(code),
          },
          {
            id: "t2",
            label: "Return HIT response when cached",
            check: (code: string) => /X-Cache.*HIT/.test(code),
          },
          {
            id: "t3",
            label: "Fetch from origin on miss",
            check: (code: string) => /await\s+fetch/.test(code),
          },
          {
            id: "t4",
            label: "Write to KV with ctx.waitUntil",
            check: (code: string) => /ctx\.waitUntil/.test(code),
          },
          {
            id: "t5",
            label: "Set X-Cache: MISS header",
            check: (code: string) => /X-Cache.*MISS/.test(code),
          },
        ],
        output:
          "200 OK\nX-Cache: MISS\n\n(second request)\n200 OK\nX-Cache: HIT",
      },
    ],
  },
]
