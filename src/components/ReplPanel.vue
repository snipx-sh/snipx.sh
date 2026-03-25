<script setup lang="ts">
import { ref, nextTick } from "vue"
import { T } from "../lib/theme"
import { client, getById } from "../lib/client"
import { useSnippetsStore } from "../stores/snippets"
import { useDocsStore } from "../stores/docs"
import { useBookmarksStore } from "../stores/bookmarks"
import type { Snippet, Doc, Bookmark, SearchResult, TagCount } from "../lib/types"

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

const snippetsStore = useSnippetsStore()
const docsStore = useDocsStore()
const bookmarksStore = useBookmarksStore()

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
          "Commands: help, list, docs, bookmarks, show <id>, search <query>, copy <id>, fav <id>, open <id>, tags, clear"
        break
      case "list": {
        await snippetsStore.fetchAll()
        output = snippetsStore.items
          .map((s: Snippet) => `${s.id.padEnd(14)} ${s.title.padEnd(40)} ${s.lang}`)
          .join("\n")
        break
      }
      case "docs": {
        await docsStore.fetchAll()
        output = docsStore.items
          .map((d: Doc) => `${d.id.padEnd(14)} ${d.title.padEnd(40)} ${d.lang}`)
          .join("\n")
        break
      }
      case "bookmarks": {
        await bookmarksStore.fetchAll()
        output = bookmarksStore.items
          .map((b: Bookmark) => `${b.id.padEnd(14)} ${b.title.padEnd(40)} ${b.cat}`)
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
        const { data, error: fetchError } = await client.api.v1.search.get({ query: { q } })
        if (fetchError) throw new Error(String(fetchError))
        const results = (data as SearchResult[]) ?? []
        output = results
          .map((r: SearchResult) => `[${r.type}] ${r.id.padEnd(14)} ${r.title}`)
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
        const snipRes = await getById(client.api.v1.snippets, id)
        if (!snipRes.error) {
          emit("navigate", "snippets", id)
          output = `Navigating to snippets/${id}`
          break
        }
        const docRes = await getById(client.api.v1.docs, id)
        if (!docRes.error) {
          emit("navigate", "docs", id)
          output = `Navigating to docs/${id}`
          break
        }
        const bmRes = await getById(client.api.v1.bookmarks, id)
        if (!bmRes.error) {
          emit("navigate", "bookmarks", id)
          output = `Navigating to bookmarks/${id}`
          break
        }
        output = `Not found: ${id}`
        isError = true
        break
      }
      case "copy": {
        const id = args[0]
        if (!id) {
          output = "Usage: copy <id>"
          isError = true
          break
        }
        const snippet = snippetsStore.items.find((s: Snippet) => s.id === id)
        if (snippet) {
          await navigator.clipboard.writeText(snippet.code)
          output = `Copied code from snippet "${snippet.title}"`
        } else {
          const doc = docsStore.items.find((d: Doc) => d.id === id)
          const bm = bookmarksStore.items.find((b: Bookmark) => b.id === id)
          const item = doc ?? bm
          if (item) {
            await navigator.clipboard.writeText(item.url)
            output = `Copied URL from "${item.title}"`
          } else {
            output = `Not found: ${id}`
            isError = true
          }
        }
        break
      }
      case "fav": {
        const id = args[0]
        if (!id) {
          output = "Usage: fav <id>"
          isError = true
          break
        }
        const snippet = snippetsStore.items.find((s: Snippet) => s.id === id)
        const doc = docsStore.items.find((d: Doc) => d.id === id)
        const bm = bookmarksStore.items.find((b: Bookmark) => b.id === id)
        if (snippet) {
          await snippetsStore.toggleFav(id, snippet.fav)
          output = `Toggled favorite for snippet "${snippet.title}"`
        } else if (doc) {
          await docsStore.toggleFav(id, doc.fav)
          output = `Toggled favorite for doc "${doc.title}"`
        } else if (bm) {
          await bookmarksStore.toggleFav(id, bm.fav)
          output = `Toggled favorite for bookmark "${bm.title}"`
        } else {
          output = `Not found: ${id}`
          isError = true
        }
        break
      }
      case "open": {
        const id = args[0]
        if (!id) {
          output = "Usage: open <id>"
          isError = true
          break
        }
        const doc = docsStore.items.find((d: Doc) => d.id === id)
        const bm = bookmarksStore.items.find((b: Bookmark) => b.id === id)
        const item = doc ?? bm
        if (item) {
          window.open(item.url, "_blank", "noopener,noreferrer")
          output = `Opened "${item.title}" in browser`
        } else {
          output = `Not found or not a URL item: ${id}`
          isError = true
        }
        break
      }
      case "tags": {
        const { data, error: fetchError } = await client.api.v1.tags.get()
        if (fetchError) throw new Error(String(fetchError))
        const tags = (data as TagCount[]) ?? []
        output = tags
          .map((t: TagCount) => `${String(t.tag).padEnd(20)} ${t.count}`)
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
