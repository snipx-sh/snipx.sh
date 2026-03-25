import { z } from "zod"

// Language enum

export const SnipxLang = z.enum([
  "nushell", "bash", "rust", "typescript", "javascript",
  "go", "python", "lua", "sql", "yaml", "toml", "json",
  "markdown", "html", "css", "dockerfile", "hcl", "vyos",
  "other",
])

// Snippet schemas

export const CreateSnippetSchema = z.object({
  title: z.string().min(1).max(120),
  code: z.string().min(1),
  lang: SnipxLang,
  cat: z.string().min(1),
  tags: z.array(z.string()).default([]),
  desc: z.string().default(""),
  fav: z.boolean().default(false),
})

export const UpdateSnippetSchema = CreateSnippetSchema.partial()

export const SnippetSchema = CreateSnippetSchema.extend({
  id: z.string(),
  created: z.string(),
  updated: z.string(),
})

// Doc schemas

export const CreateDocSchema = z.object({
  title: z.string().min(1).max(120),
  url: z.url(),
  lang: SnipxLang,
  cat: z.string().min(1),
  topic: z.string().default(""),
  tags: z.array(z.string()).default([]),
  notes: z.string().default(""),
  fav: z.boolean().default(false),
})

export const UpdateDocSchema = CreateDocSchema.partial()

export const DocSchema = CreateDocSchema.extend({
  id: z.string(),
  created: z.string(),
  updated: z.string(),
})

// Bookmark schemas

export const CreateBookmarkSchema = z.object({
  title: z.string().min(1).max(120),
  url: z.url(),
  cat: z.string().min(1),
  tags: z.array(z.string()).default([]),
  notes: z.string().default(""),
  fav: z.boolean().default(false),
})

export const UpdateBookmarkSchema = CreateBookmarkSchema.partial()

export const BookmarkSchema = CreateBookmarkSchema.extend({
  id: z.string(),
  created: z.string(),
  updated: z.string(),
})

// Search result schema

export const SearchResultSchema = z.object({
  id: z.string(),
  type: z.enum(["snippet", "doc", "bookmark"]),
  title: z.string(),
  cat: z.string(),
  tags: z.array(z.string()),
})

// Tag count schema

export const TagCountSchema = z.object({
  tag: z.string(),
  count: z.number(),
})

// Inferred types

export type SnipxLang = z.infer<typeof SnipxLang>
export type Snippet = z.infer<typeof SnippetSchema>
export type CreateSnippet = z.infer<typeof CreateSnippetSchema>
export type UpdateSnippet = z.infer<typeof UpdateSnippetSchema>
export type Doc = z.infer<typeof DocSchema>
export type CreateDoc = z.infer<typeof CreateDocSchema>
export type UpdateDoc = z.infer<typeof UpdateDocSchema>
export type Bookmark = z.infer<typeof BookmarkSchema>
export type CreateBookmark = z.infer<typeof CreateBookmarkSchema>
export type UpdateBookmark = z.infer<typeof UpdateBookmarkSchema>
export type SearchResult = z.infer<typeof SearchResultSchema>
export type TagCount = z.infer<typeof TagCountSchema>
