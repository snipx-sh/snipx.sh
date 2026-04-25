<script setup lang="ts">
import { T } from "../lib/theme"
import type { Snippet } from "../lib/types"

const props = defineProps<{
  snippet: Snippet
}>()

const emit = defineEmits<{
  copy: [code: string]
  toggleFav: [id: string, fav: boolean]
}>()
</script>

<template>
  <div :style="{ padding: '16px', overflowY: 'auto', height: '100%' }">
    <!-- Title -->
    <h2 :style="{ fontSize: '18px', fontWeight: 600, color: T.fg, margin: '0 0 12px 0' }">
      {{ snippet.title }}
    </h2>

    <!-- Badges -->
    <div :style="{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }">
      <span :style="{ background: T.blue, color: T.bgDark, padding: '2px 8px', fontSize: '11px', borderRadius: '3px' }">
        {{ snippet.lang }}
      </span>
      <span :style="{ background: T.purple, color: T.bgDark, padding: '2px 8px', fontSize: '11px', borderRadius: '3px' }">
        {{ snippet.cat }}
      </span>
    </div>

    <!-- Tags -->
    <div v-if="snippet.tags.length > 0" :style="{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }">
      <span
        v-for="tag in snippet.tags"
        :key="tag"
        :style="{ background: T.bgHL, color: T.fgDim, fontSize: '11px', padding: '2px 6px', borderRadius: '3px' }"
      >
        {{ tag }}
      </span>
    </div>

    <!-- Description -->
    <p
      v-if="snippet.desc"
      :style="{ color: T.fgDim, fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.5' }"
    >
      {{ snippet.desc }}
    </p>

    <!-- Code viewer -->
    <pre :style="{
      background: T.bgDark,
      border: `1px solid ${T.border}`,
      borderRadius: '4px',
      padding: '12px',
      margin: '0 0 12px 0',
      overflow: 'auto',
      fontFamily: 'monospace',
      fontSize: '13px',
      color: T.fg,
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
    }"><code>{{ snippet.code }}</code></pre>

    <!-- Actions -->
    <div :style="{ display: 'flex', gap: '8px', marginBottom: '16px' }">
      <button
        :style="{
          padding: '6px 14px',
          fontSize: '12px',
          borderRadius: '4px',
          cursor: 'pointer',
          background: T.green,
          color: T.bgDark,
          border: 'none',
          fontWeight: 600,
        }"
        @click="emit('copy', snippet.code)"
      >
        Copy
      </button>
      <button
        :style="{
          padding: '6px 14px',
          fontSize: '12px',
          borderRadius: '4px',
          cursor: 'pointer',
          background: snippet.fav ? T.yellow : T.bgHL,
          color: snippet.fav ? T.bgDark : T.fgDim,
          border: 'none',
          fontWeight: 600,
        }"
        @click="emit('toggleFav', snippet.id, !snippet.fav)"
      >
        {{ snippet.fav ? '★ Favorited' : '☆ Favorite' }}
      </button>
    </div>

    <!-- Timestamps -->
    <div :style="{ fontSize: '11px', color: T.fgMuted }">
      <div>Created: {{ snippet.created }}</div>
      <div>Updated: {{ snippet.updated }}</div>
    </div>
  </div>
</template>
