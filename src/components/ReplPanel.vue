<script setup lang="ts">
import { ref, nextTick } from "vue"
import { T } from "../lib/theme"

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  navigate: [mode: "snippets" | "docs" | "bookmarks", id: string]
}>()

const height = ref(200)
const input = ref("")
const history = ref<Array<{ input: string; output: string; isError: boolean }>>([])
const inputHistory = ref<string[]>([])
const historyIdx = ref(-1)
const isDragging = ref(false)
const outputEl = ref<HTMLDivElement | null>(null)

async function execute() {
  const cmd = input.value.trim()
  if (!cmd) return

  inputHistory.value.push(cmd)
  historyIdx.value = -1

  const parts = cmd.split(/\s+/)
  const command = parts[0]?.toLowerCase()
  const args = parts.slice(1)

  let output = ""
  let isError = false

  try {
    switch (command) {
      case "help":
        output =
          "Commands: help, list, docs, bookmarks, show <id>, search <query>, copy <id>, fav <id>, run <id>, open <id>, tags, clear"
        break
      case "list": {
        const res = await fetch("http://localhost:7878/api/v1/snippets")
        const items = await res.json()
        output = items
          .map((s: Record<string, string>) => `${s.id.padEnd(14)} ${s.title.padEnd(40)} ${s.lang}`)
          .join("\n")
        break
      }
      case "docs": {
        const res = await fetch("http://localhost:7878/api/v1/docs")
        const items = await res.json()
        output = items
          .map((d: Record<string, string>) => `${d.id.padEnd(14)} ${d.title.padEnd(40)} ${d.lang}`)
          .join("\n")
        break
      }
      case "bookmarks": {
        const res = await fetch("http://localhost:7878/api/v1/bookmarks")
        const items = await res.json()
        output = items
          .map((b: Record<string, string>) => `${b.id.padEnd(14)} ${b.title.padEnd(40)} ${b.cat}`)
          .join("\n")
        break
      }
      case "search": {
        const q = args.join(" ")
        if (!q) {
          output = "Usage: search <query>"
          isError = true
          break
        }
        const res = await fetch(`http://localhost:7878/api/v1/search?q=${encodeURIComponent(q)}`)
        const items = await res.json()
        output = items
          .map((r: Record<string, string>) => `[${r.type}] ${r.id.padEnd(14)} ${r.title}`)
          .join("\n")
        break
      }
      case "show": {
        const id = args[0]
        if (!id) {
          output = "Usage: show <id>"
          isError = true
          break
        }
        let found = false
        for (const type of ["snippets", "docs", "bookmarks"] as const) {
          const res = await fetch(`http://localhost:7878/api/v1/${type}/${id}`)
          if (res.ok) {
            emit("navigate", type, id)
            output = `Navigating to ${type}/${id}`
            found = true
            break
          }
        }
        if (!found) {
          output = `Not found: ${id}`
          isError = true
        }
        break
      }
      case "tags": {
        const res = await fetch("http://localhost:7878/api/v1/tags")
        const tags = await res.json()
        output = tags
          .map((t: Record<string, string | number>) => `${String(t.tag).padEnd(20)} ${t.count}`)
          .join("\n")
        break
      }
      case "clear":
        history.value = []
        input.value = ""
        return
      default:
        output = `Unknown command: ${command}. Type "help" for available commands.`
        isError = true
    }
  } catch (err) {
    output = `Error: ${err instanceof Error ? err.message : "Unknown error"}`
    isError = true
  }

  history.value.push({ input: cmd, output, isError })
  input.value = ""
  await nextTick()
  if (outputEl.value) outputEl.value.scrollTop = outputEl.value.scrollHeight
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    execute()
    return
  }
  if (e.key === "ArrowUp") {
    e.preventDefault()
    if (historyIdx.value < inputHistory.value.length - 1) {
      historyIdx.value++
      input.value = inputHistory.value[inputHistory.value.length - 1 - historyIdx.value] ?? ""
    }
  }
  if (e.key === "ArrowDown") {
    e.preventDefault()
    if (historyIdx.value > 0) {
      historyIdx.value--
      input.value = inputHistory.value[inputHistory.value.length - 1 - historyIdx.value] ?? ""
    } else {
      historyIdx.value = -1
      input.value = ""
    }
  }
}

function startDrag(e: MouseEvent) {
  isDragging.value = true
  const startY = e.clientY
  const startH = height.value
  const onMove = (me: MouseEvent) => {
    height.value = Math.max(130, Math.min(480, startH + (startY - me.clientY)))
  }
  const onUp = () => {
    isDragging.value = false
    document.removeEventListener("mousemove", onMove)
    document.removeEventListener("mouseup", onUp)
  }
  document.addEventListener("mousemove", onMove)
  document.addEventListener("mouseup", onUp)
}
</script>

<template>
  <div
    v-show="visible"
    :style="{
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      height: height + 'px',
      background: T.bgDark,
      borderTop: `1px solid ${T.border}`,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }"
  >
    <!-- Drag handle -->
    <div
      :style="{
        height: '6px',
        cursor: 'ns-resize',
        background: isDragging ? T.bgActive : 'transparent',
        flexShrink: 0,
      }"
      @mousedown="startDrag"
    />

    <!-- Output area -->
    <div
      ref="outputEl"
      :style="{
        flex: 1,
        overflow: 'auto',
        padding: '8px 12px',
        fontFamily: 'monospace',
        fontSize: '13px',
        lineHeight: '1.5',
      }"
    >
      <div v-for="(entry, i) in history" :key="i" :style="{ marginBottom: '8px' }">
        <div :style="{ color: T.green }">
          <span :style="{ color: T.green, marginRight: '6px' }">&gt;</span>
          <span :style="{ color: T.fg }">{{ entry.input }}</span>
        </div>
        <pre
          :style="{
            margin: '2px 0 0 0',
            padding: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: entry.isError ? T.red : T.fgDim,
            fontFamily: 'monospace',
            fontSize: '13px',
          }"
        >{{ entry.output }}</pre>
      </div>
    </div>

    <!-- Input area -->
    <div
      :style="{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        borderTop: `1px solid ${T.border}`,
        flexShrink: 0,
        background: T.bgPanel,
      }"
    >
      <span :style="{ color: T.green, marginRight: '8px', fontFamily: 'monospace', fontSize: '14px', fontWeight: '700' }">&gt;</span>
      <input
        v-model="input"
        :style="{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: T.fg,
          fontFamily: 'monospace',
          fontSize: '13px',
        }"
        placeholder="Type a command... (help for list)"
        @keydown="handleKeydown"
      />
    </div>
  </div>
</template>
