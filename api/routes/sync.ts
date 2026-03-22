import { Elysia } from "elysia"
import { paths } from "../fs.ts"

async function runGit(...args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["git", ...args], {
    cwd: paths.root,
    stdout: "pipe",
    stderr: "pipe",
  })
  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  const exitCode = await proc.exited
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode }
}

export const syncRoutes = new Elysia({ prefix: "/api/v1" })
  .post("/sync/push", async ({ set }) => {
    const add = await runGit("add", "-A")
    if (add.exitCode !== 0) { set.status = 500; return { error: `git add failed: ${add.stderr}` } }

    const commit = await runGit("commit", "-m", "snipx: sync")
    if (commit.exitCode !== 0 && !commit.stdout.includes("nothing to commit")) {
      set.status = 500
      return { error: `git commit failed: ${commit.stderr}` }
    }

    const push = await runGit("push")
    if (push.exitCode !== 0) { set.status = 500; return { error: `git push failed: ${push.stderr}` } }

    return { ok: true, message: "Pushed successfully" }
  })
  .post("/sync/pull", async ({ set }) => {
    const pull = await runGit("pull", "--rebase")
    if (pull.exitCode !== 0) { set.status = 500; return { error: `git pull failed: ${pull.stderr}` } }
    return { ok: true, message: pull.stdout }
  })
  .get("/sync/status", async () => {
    const status = await runGit("status", "--porcelain")
    const log = await runGit("rev-list", "--left-right", "--count", "HEAD...@{upstream}")

    let ahead = 0
    let behind = 0
    if (log.exitCode === 0) {
      const parts = log.stdout.split(/\s+/)
      ahead = parseInt(parts[0] ?? "0", 10)
      behind = parseInt(parts[1] ?? "0", 10)
    }

    const remote = await runGit("remote", "get-url", "origin")

    return {
      ahead,
      behind,
      dirty: status.stdout.length > 0,
      remote: remote.stdout || null,
    }
  })
