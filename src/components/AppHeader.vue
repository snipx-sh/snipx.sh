<script setup lang="ts">
import { T } from "../lib/theme"

type Mode = "snippets" | "docs" | "bookmarks" | "learn"

const props = defineProps<{
  mode: Mode
  searchQuery: string
}>()

const emit = defineEmits<{
  "update:mode": [mode: Mode]
  "update:searchQuery": [query: string]
  addClick: []
  replToggle: []
}>()

const modes: Mode[] = ["snippets", "docs", "bookmarks", "learn"]
</script>

<template>
  <div :style="{
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '12px',
    background: T.bgDark,
    borderBottom: `1px solid ${T.border}`,
  }">
    <span :style="{ fontWeight: 700, fontSize: '14px', color: T.blue, letterSpacing: '1px', marginRight: '8px' }">SNIPX</span>
    <div :style="{ display: 'flex', gap: '2px' }">
      <button
        v-for="m in modes"
        :key="m"
        @click="emit('update:mode', m)"
        :style="{
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 500,
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          background: props.mode === m ? T.bgActive : 'transparent',
          color: props.mode === m ? T.fg : T.fgMuted,
        }"
      >
        {{ m.charAt(0).toUpperCase() + m.slice(1) }}
      </button>
    </div>
    <input
      type="text"
      placeholder="Search..."
      :value="props.searchQuery"
      @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      :style="{
        flex: 1,
        maxWidth: '300px',
        padding: '6px 10px',
        fontSize: '13px',
        background: T.bgHL,
        color: T.fg,
        border: `1px solid ${T.border}`,
        borderRadius: '4px',
        outline: 'none',
      }"
    />
    <button
      @click="emit('addClick')"
      :style="{
        padding: '6px 14px',
        fontSize: '12px',
        fontWeight: 600,
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        background: T.blue,
        color: T.bgDark,
      }"
    >
      + Add
    </button>
    <button
      @click="emit('replToggle')"
      :style="{
        padding: '6px 10px',
        fontSize: '12px',
        border: `1px solid ${T.border}`,
        borderRadius: '4px',
        cursor: 'pointer',
        background: 'transparent',
        color: T.fgMuted,
      }"
    >
      REPL
    </button>
  </div>
</template>
