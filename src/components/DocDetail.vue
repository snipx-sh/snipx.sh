<script setup lang="ts">
import { T } from "../lib/theme"
import type { Doc } from "../lib/types"

const props = defineProps<{
  doc: Doc
}>()

const emit = defineEmits<{
  toggleFav: [id: string, fav: boolean]
}>()
</script>

<template>
  <div :style="{ padding: '16px', overflowY: 'auto', height: '100%' }">
    <!-- Title -->
    <h2 :style="{ fontSize: '18px', fontWeight: 600, color: T.fg, margin: '0 0 8px 0' }">
      {{ doc.title }}
    </h2>

    <!-- URL -->
    <a
      :href="doc.url"
      target="_blank"
      rel="noopener noreferrer"
      :style="{ color: T.blue, fontSize: '13px', textDecoration: 'none', display: 'block', marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }"
    >
      {{ doc.url }}
    </a>

    <!-- Badges -->
    <div :style="{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }">
      <span :style="{ background: T.blue, color: T.bgDark, padding: '2px 8px', fontSize: '11px', borderRadius: '3px' }">
        {{ doc.lang }}
      </span>
      <span :style="{ background: T.purple, color: T.bgDark, padding: '2px 8px', fontSize: '11px', borderRadius: '3px' }">
        {{ doc.cat }}
      </span>
      <span
        v-if="doc.topic"
        :style="{ background: T.teal, color: T.bgDark, padding: '2px 8px', fontSize: '11px', borderRadius: '3px' }"
      >
        {{ doc.topic }}
      </span>
    </div>

    <!-- Tags -->
    <div v-if="doc.tags.length > 0" :style="{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }">
      <span
        v-for="tag in doc.tags"
        :key="tag"
        :style="{ background: T.bgHL, color: T.fgDim, fontSize: '11px', padding: '2px 6px', borderRadius: '3px' }"
      >
        {{ tag }}
      </span>
    </div>

    <!-- Quick Notes -->
    <div
      v-if="doc.notes"
      :style="{
        background: T.bgHL,
        borderLeft: `3px solid ${T.blue}`,
        padding: '12px',
        marginBottom: '16px',
        borderRadius: '0 4px 4px 0',
      }"
    >
      <div :style="{ fontSize: '11px', color: T.fgMuted, marginBottom: '4px', fontWeight: 600 }">Quick Notes</div>
      <div :style="{ fontSize: '13px', color: T.fgDim, lineHeight: '1.5', whiteSpace: 'pre-wrap' }">
        {{ doc.notes }}
      </div>
    </div>

    <!-- Actions -->
    <div :style="{ display: 'flex', gap: '8px', marginBottom: '16px' }">
      <a
        :href="doc.url"
        target="_blank"
        rel="noopener noreferrer"
        :style="{
          padding: '6px 14px',
          fontSize: '12px',
          borderRadius: '4px',
          cursor: 'pointer',
          background: T.blue,
          color: T.bgDark,
          border: 'none',
          fontWeight: 600,
          textDecoration: 'none',
          display: 'inline-block',
        }"
      >
        Open
      </a>
      <button
        :style="{
          padding: '6px 14px',
          fontSize: '12px',
          borderRadius: '4px',
          cursor: 'pointer',
          background: doc.fav ? T.yellow : T.bgHL,
          color: doc.fav ? T.bgDark : T.fgDim,
          border: 'none',
          fontWeight: 600,
        }"
        @click="emit('toggleFav', doc.id, !doc.fav)"
      >
        {{ doc.fav ? '★ Favorited' : '☆ Favorite' }}
      </button>
    </div>

    <!-- Timestamps -->
    <div :style="{ fontSize: '11px', color: T.fgMuted }">
      <div>Created: {{ doc.created }}</div>
      <div>Updated: {{ doc.updated }}</div>
    </div>
  </div>
</template>
