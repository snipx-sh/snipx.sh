import { readdir, readFile, writeFile, mkdir, unlink } from "node:fs/promises"
import { join } from "node:path"
import { existsSync } from "node:fs"
import { homedir } from "node:os"

const SNIPX_HOME = process.env.SNIPX_HOME || join(homedir(), ".snipx")

export const paths = {
  root: SNIPX_HOME,
  snippets: join(SNIPX_HOME, "snippets"),
  docs: join(SNIPX_HOME, "docs"),
  bookmarks: join(SNIPX_HOME, "bookmarks"),
  collections: join(SNIPX_HOME, "collections"),
  operational: join(SNIPX_HOME, ".snipx"),
} as const

export async function ensureDirs(): Promise<void> {
  for (const dir of Object.values(paths)) {
    await mkdir(dir, { recursive: true })
  }
}

export function parseFrontmatter(content: string): {
  meta: Record<string, unknown>
  body: string
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) {
    return { meta: {}, body: content }
  }

  const yamlStr = match[1] ?? ""
  const body = match[2] ?? ""
  const meta: Record<string, unknown> = {}

  for (const line of yamlStr.split("\n")) {
    const colonIdx = line.indexOf(":")
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value: unknown = line.slice(colonIdx + 1).trim()

    if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean)
    } else if (value === "true") {
      value = true
    } else if (value === "false") {
      value = false
    } else if (
      typeof value === "string" &&
      value.startsWith('"') &&
      value.endsWith('"')
    ) {
      value = value.slice(1, -1)
    }

    meta[key] = value
  }

  return { meta, body }
}

export function toFrontmatter(
  meta: Record<string, unknown>,
  body: string,
): string {
  const lines: string[] = ["---"]
  for (const [key, value] of Object.entries(meta)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((v) => String(v)).join(", ")}]`)
    } else if (typeof value === "boolean") {
      lines.push(`${key}: ${value}`)
    } else {
      lines.push(`${key}: ${String(value)}`)
    }
  }
  lines.push("---")
  lines.push("")
  lines.push(body)
  return lines.join("\n")
}

export async function readContentDir(
  dir: string,
): Promise<
  Array<{ meta: Record<string, unknown>; body: string; path: string }>
> {
  if (!existsSync(dir)) return []

  const results: Array<{
    meta: Record<string, unknown>
    body: string
    path: string
  }> = []

  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.name.endsWith(".md")) {
        const content = await readFile(fullPath, "utf-8")
        const parsed = parseFrontmatter(content)
        results.push({ ...parsed, path: fullPath })
      }
    }
  }

  await walk(dir)
  return results
}

export async function writeContentFile(
  dir: string,
  id: string,
  meta: Record<string, unknown>,
  body: string,
  subdir?: string,
): Promise<string> {
  const targetDir = subdir ? join(dir, subdir) : dir
  await mkdir(targetDir, { recursive: true })
  const filePath = join(targetDir, `${id}.md`)
  const content = toFrontmatter(meta, body)
  await writeFile(filePath, content, "utf-8")
  return filePath
}

export async function deleteContentFile(
  dir: string,
  id: string,
): Promise<boolean> {
  async function findAndDelete(currentDir: string): Promise<boolean> {
    if (!existsSync(currentDir)) return false
    const entries = await readdir(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name)
      if (entry.isDirectory()) {
        if (await findAndDelete(fullPath)) return true
      } else if (entry.name === `${id}.md`) {
        await unlink(fullPath)
        return true
      }
    }
    return false
  }
  return findAndDelete(dir)
}

export async function readNuon(
  filePath: string,
): Promise<Record<string, unknown>> {
  const content = await readFile(filePath, "utf-8")
  try {
    const value = parseNuon(content)
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
    return { raw: content }
  } catch {
    return { raw: content }
  }
}

export function parseNuon(input: string): unknown {
  let pos = 0

  function skip() {
    while (pos < input.length && /\s/.test(input[pos]!)) pos++
  }

  function parseValue(): unknown {
    skip()
    if (pos >= input.length) throw new Error("Unexpected end of input")
    const ch = input[pos]!
    if (ch === "{") return parseObject()
    if (ch === "[") return parseArray()
    if (ch === '"') return parseString()
    if (input.startsWith("null", pos)) {
      pos += 4
      return null
    }
    if (input.startsWith("true", pos)) {
      pos += 4
      return true
    }
    if (input.startsWith("false", pos)) {
      pos += 5
      return false
    }
    if (/[-\d]/.test(ch)) return parseNumber()
    throw new Error(`Unexpected character at position ${pos}: ${ch}`)
  }

  function parseObject(): Record<string, unknown> {
    pos++
    const obj: Record<string, unknown> = {}
    skip()
    while (pos < input.length && input[pos] !== "}") {
      skip()
      if (input[pos] === "}") break
      if (pos >= input.length) throw new Error("Unexpected end of input while parsing object: expected '}'")
      let key: string
      if (input[pos] === '"') {
        key = parseString()
      } else {
        const start = pos
        while (pos < input.length && /[\w-]/.test(input[pos]!)) pos++
        key = input.slice(start, pos)
      }
      skip()
      if (input[pos] !== ":") throw new Error(`Expected : after key "${key}"`)
      pos++
      skip()
      obj[key] = parseValue()
      skip()
      if (input[pos] === ",") pos++
      skip()
    }
    if (pos >= input.length) throw new Error("Unexpected end of input while parsing object: expected '}'")
    pos++
    return obj
  }

  function parseArray(): unknown[] {
    pos++
    const arr: unknown[] = []
    skip()
    while (pos < input.length && input[pos] !== "]") {
      skip()
      if (input[pos] === "]") break
      if (pos >= input.length) throw new Error("Unexpected end of input while parsing array: expected ']'")
      arr.push(parseValue())
      skip()
      if (input[pos] === ",") pos++
      skip()
    }
    if (pos >= input.length) throw new Error("Unexpected end of input while parsing array: expected ']'")
    pos++
    return arr
  }

  function parseString(): string {
    pos++
    let str = ""
    while (pos < input.length && input[pos] !== '"') {
      if (input[pos] === "\\") {
        pos++
        if (pos >= input.length) throw new Error("Unexpected end of input: incomplete escape sequence in string")
        const esc = input[pos]!
        if (esc === "n") str += "\n"
        else if (esc === "t") str += "\t"
        else if (esc === "r") str += "\r"
        else if (esc === '"') str += '"'
        else if (esc === "\\") str += "\\"
        else str += esc
      } else {
        str += input[pos]!
      }
      pos++
    }
    if (pos >= input.length) throw new Error("Unterminated string: expected closing '\"'")
    pos++
    return str
  }

  function parseNumber(): number {
    const start = pos
    let hasDigit = false
    let dotCount = 0
    if (input[pos] === "-") pos++
    while (pos < input.length && /[\d.]/.test(input[pos]!)) {
      const ch = input[pos]!
      if (ch === ".") {
        dotCount++
        if (dotCount > 1) throw new Error(`Invalid number at position ${start}: multiple decimal points`)
      } else {
        hasDigit = true
      }
      pos++
    }
    if (!hasDigit) throw new Error(`Invalid number at position ${start}: no digits found`)
    const num = Number(input.slice(start, pos))
    if (Number.isNaN(num)) throw new Error(`Invalid number at position ${start}`)
    return num
  }

  skip()
  const result = parseValue()
  skip()
  if (pos !== input.length) throw new Error(`Unexpected trailing characters in NUON input at position ${pos}`)
  return result
}

export function writeNuon(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent)
  const childPad = "  ".repeat(indent + 1)

  if (value === null) return "null"
  if (typeof value === "boolean") return value.toString()
  if (typeof value === "number") return value.toString()
  if (typeof value === "string") {
    const escaped = value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t")
    return `"${escaped}"`
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]"
    const items = value.map((v) => `${childPad}${writeNuon(v, indent + 1)}`).join("\n")
    return `[\n${items}\n${pad}]`
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return "{}"
    const lines = entries.map(([k, v]) => `${childPad}${k}: ${writeNuon(v, indent + 1)}`).join("\n")
    return `{\n${lines}\n${pad}}`
  }
  return String(value)
}
