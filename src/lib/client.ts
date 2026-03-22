import { treaty } from "@elysiajs/eden"
import type { App } from "../../api/index.ts"

export const client = treaty<App>("localhost:7878")
