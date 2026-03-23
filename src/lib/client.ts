import { treaty } from "@elysiajs/eden"
import type { App } from "../../api/index.ts"

export const client = treaty<App>("localhost:7878")

type PatchByIdEndpoint = Record<
  string,
  { patch: (opts: { body: Record<string, unknown> }) => Promise<{ error: unknown }> }
>

type GetByIdEndpoint = Record<
  string,
  { get: () => Promise<{ data: unknown; error: unknown }> }
>

export async function patchById(
  endpoint: unknown,
  id: string,
  body: Record<string, unknown>,
): Promise<{ error: unknown }> {
  const handler = (endpoint as PatchByIdEndpoint)[id]
  if (!handler) return { error: `No endpoint for id: ${id}` }
  return handler.patch({ body })
}

export async function getById(
  endpoint: unknown,
  id: string,
): Promise<{ data: unknown; error: unknown }> {
  const handler = (endpoint as GetByIdEndpoint)[id]
  if (!handler) return { data: null, error: `No endpoint for id: ${id}` }
  return handler.get()
}
