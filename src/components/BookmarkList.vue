<script setup lang="ts">
import { computed } from "vue"
import { T } from "../lib/theme"
import type { Bookmark } from "../lib/types"

const props = defineProps<{
  items: Bookmark[]
  selectedId: string | null
  searchQuery: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const filtered = computed(() => {
  const q = props.searchQuery.toLowerCase()
  if (!q) return props.items
  return props.items.filter((b) => b.title.toLowerCase().includes(q))
})
</script>

<template>
  <div :style="{ height: '100%', overflowY: 'auto' }">
    <div
      v-for="item in filtered"
      :key="item.id"
      :style="{
        padding: '8px 12px',
        cursor: 'pointer',
        background: item.id === selectedId ? T.bgActive : 'transparent',
        borderBottom: `1px solid ${T.bgHL}`,
      }"
      @click="emit('select', item.id)"
      @mouseenter="($event.currentTarget as HTMLElement).style.background = item.id === selectedId ? T.bgActive : T.bgHover"
      @mouseleave="($event.currentTarget as HTMLElement).style.background = item.id === selectedId ? T.bgActive : 'transparent'"
    >
      <div :style="{ display: 'flex', alignItems: 'center', gap: '6px' }">
        <span :style="{ fontSize: '13px', color: T.fg, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
          {{ item.title }}
        </span>
        <span v-if="item.fav" :style="{ color: T.yellow, fontSize: '12px' }">&#9733;</span>
      </div>
      <div :style="{ display: 'flex', gap: '4px', marginTop: '4px' }">
        <span :style="{ background: T.purple, color: T.bgDark, padding: '2px 8px', fontSize: '11px', borderRadius: '3px' }">
          {{ item.cat }}
        </span>
      </div>
    </div>
    <div
      v-if="filtered.length === 0"
      :style="{ padding: '16px', textAlign: 'center', color: T.fgMuted, fontSize: '12px' }"
    >
      No bookmarks found
    </div>
  </div>
</template>
