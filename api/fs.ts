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
    return JSON.parse(content.replace(/(\w+):/g, '"$1":').replace(/\n/g, " "))
  } catch {
    return { raw: content }
  }
}
