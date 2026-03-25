import { treaty } from "@elysiajs/eden"
import type { App } from "../../api/index.ts"

export const client = treaty<App>("localhost:7878")

type EdenResponse = {
  data?: unknown
  error?: unknown
  status?: number
  response?: unknown
}

type PatchByIdEndpoint = Record<
  string,
  { patch: (opts: { body: Record<string, unknown> }) => Promise<EdenResponse> }
>

type GetByIdEndpoint = Record<
  string,
  { get: () => Promise<EdenResponse> }
>

export async function patchById(
  endpoint: unknown,
  id: string,
  body: Record<string, unknown>,
): Promise<EdenResponse> {
  const handler = (endpoint as PatchByIdEndpoint)[id]
  if (!handler) return { data: null, error: `No endpoint for id: ${id}`, status: 404 }
  return handler.patch({ body })
}

export async function getById(
  endpoint: unknown,
  id: string,
): Promise<EdenResponse> {
  const handler = (endpoint as GetByIdEndpoint)[id]
  if (!handler) return { data: null, error: `No endpoint for id: ${id}`, status: 404 }
  return handler.get()
}
