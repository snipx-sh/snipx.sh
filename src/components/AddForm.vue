<script setup lang="ts">
import { ref } from "vue"
import { T } from "../lib/theme"
import { CreateSnippetSchema, CreateDocSchema, CreateBookmarkSchema, SnipxLang } from "../lib/types"

type Mode = "snippets" | "docs" | "bookmarks"

const props = defineProps<{
  mode: Mode
}>()

const emit = defineEmits<{
  submit: [data: Record<string, unknown>]
  cancel: []
}>()

const title = ref("")
const code = ref("")
const url = ref("")
const lang = ref<string>("other")
const cat = ref("")
const topic = ref("")
const tagsStr = ref("")
const desc = ref("")
const notes = ref("")
const fav = ref(false)
const errors = ref<Record<string, string>>({})

const langOptions = SnipxLang.options

const inputStyle = {
  width: "100%",
  padding: "8px",
  fontSize: "13px",
  background: T.bgHL,
  color: T.fg,
  border: `1px solid ${T.border}`,
  borderRadius: "4px",
  outline: "none",
  boxSizing: "border-box" as const,
}

const textareaStyle = {
  ...inputStyle,
  minHeight: "120px",
  resize: "vertical" as const,
  fontFamily: "monospace",
}

const labelStyle = {
  fontSize: "12px",
  color: T.fgDim,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  marginBottom: "4px",
  display: "block",
}

const fieldStyle = {
  marginBottom: "12px",
}

const errorStyle = {
  fontSize: "11px",
  color: T.red,
  marginTop: "3px",
}

const btnBase = {
  padding: "8px 16px",
  fontSize: "13px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
}

const submitBtn = {
  ...btnBase,
  background: T.green,
  color: T.bgDark,
  fontWeight: "600",
}

const cancelBtn = {
  ...btnBase,
  background: "transparent",
  color: T.fgMuted,
  border: `1px solid ${T.border}`,
}

function handleSubmit() {
  const tags = tagsStr.value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
  let raw: Record<string, unknown> = { title: title.value, cat: cat.value, tags, fav: fav.value }

  if (props.mode === "snippets") {
    raw = { ...raw, code: code.value, lang: lang.value, desc: desc.value }
  } else if (props.mode === "docs") {
    raw = { ...raw, url: url.value, lang: lang.value, topic: topic.value, notes: notes.value }
  } else {
    raw = { ...raw, url: url.value, notes: notes.value }
  }

  const schema =
    props.mode === "snippets"
      ? CreateSnippetSchema
      : props.mode === "docs"
        ? CreateDocSchema
        : CreateBookmarkSchema

  const result = schema.safeParse(raw)
  if (!result.success) {
    errors.value = {}
    for (const issue of result.error.issues) {
      const key = issue.path[0]
      if (key) errors.value[String(key)] = issue.message
    }
    return
  }

  emit("submit", result.data as Record<string, unknown>)
}
</script>

<template>
  <div :style="{ padding: '16px', background: T.bgPanel, borderRadius: '6px', border: `1px solid ${T.border}` }">
    <div :style="{ fontSize: '14px', fontWeight: '600', color: T.fg, marginBottom: '16px' }">
      Add {{ mode === 'snippets' ? 'Snippet' : mode === 'docs' ? 'Doc' : 'Bookmark' }}
    </div>

    <!-- Title (all modes) -->
    <div :style="fieldStyle">
      <label :style="labelStyle">Title</label>
      <input v-model="title" :style="inputStyle" placeholder="Title" />
      <div v-if="errors.title" :style="errorStyle">{{ errors.title }}</div>
    </div>

    <!-- Code textarea (snippets only) -->
    <div v-if="mode === 'snippets'" :style="fieldStyle">
      <label :style="labelStyle">Code</label>
      <textarea v-model="code" :style="textareaStyle" placeholder="Paste code here..." />
      <div v-if="errors.code" :style="errorStyle">{{ errors.code }}</div>
    </div>

    <!-- URL (docs and bookmarks) -->
    <div v-if="mode === 'docs' || mode === 'bookmarks'" :style="fieldStyle">
      <label :style="labelStyle">URL</label>
      <input v-model="url" :style="inputStyle" placeholder="https://..." />
      <div v-if="errors.url" :style="errorStyle">{{ errors.url }}</div>
    </div>

    <!-- Lang select (snippets and docs) -->
    <div v-if="mode === 'snippets' || mode === 'docs'" :style="fieldStyle">
      <label :style="labelStyle">Language</label>
      <select v-model="lang" :style="inputStyle">
        <option v-for="opt in langOptions" :key="opt" :value="opt">{{ opt }}</option>
      </select>
      <div v-if="errors.lang" :style="errorStyle">{{ errors.lang }}</div>
    </div>

    <!-- Category (all modes) -->
    <div :style="fieldStyle">
      <label :style="labelStyle">Category</label>
      <input v-model="cat" :style="inputStyle" placeholder="Category" />
      <div v-if="errors.cat" :style="errorStyle">{{ errors.cat }}</div>
    </div>

    <!-- Topic (docs only) -->
    <div v-if="mode === 'docs'" :style="fieldStyle">
      <label :style="labelStyle">Topic</label>
      <input v-model="topic" :style="inputStyle" placeholder="Topic" />
      <div v-if="errors.topic" :style="errorStyle">{{ errors.topic }}</div>
    </div>

    <!-- Tags (all modes) -->
    <div :style="fieldStyle">
      <label :style="labelStyle">Tags (comma-separated)</label>
      <input v-model="tagsStr" :style="inputStyle" placeholder="tag1, tag2, tag3" />
      <div v-if="errors.tags" :style="errorStyle">{{ errors.tags }}</div>
    </div>

    <!-- Desc (snippets only) -->
    <div v-if="mode === 'snippets'" :style="fieldStyle">
      <label :style="labelStyle">Description</label>
      <input v-model="desc" :style="inputStyle" placeholder="Short description" />
      <div v-if="errors.desc" :style="errorStyle">{{ errors.desc }}</div>
    </div>

    <!-- Notes (docs and bookmarks) -->
    <div v-if="mode === 'docs' || mode === 'bookmarks'" :style="fieldStyle">
      <label :style="labelStyle">Notes</label>
      <textarea v-model="notes" :style="{ ...textareaStyle, minHeight: '60px' }" placeholder="Notes..." />
      <div v-if="errors.notes" :style="errorStyle">{{ errors.notes }}</div>
    </div>

    <!-- Fav checkbox (snippets and bookmarks) -->
    <div v-if="mode === 'snippets' || mode === 'bookmarks'" :style="{ ...fieldStyle, display: 'flex', alignItems: 'center', gap: '8px' }">
      <input v-model="fav" type="checkbox" />
      <label :style="{ fontSize: '13px', color: T.fgDim }">Favorite</label>
    </div>

    <!-- Actions -->
    <div :style="{ display: 'flex', gap: '8px', marginTop: '16px' }">
      <button :style="submitBtn" @click="handleSubmit">Save</button>
      <button :style="cancelBtn" @click="emit('cancel')">Cancel</button>
    </div>
  </div>
</template>
