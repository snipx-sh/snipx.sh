<script setup lang="ts">
import { computed, ref } from "vue"
import { T } from "../lib/theme"

const props = defineProps<{
  items: Array<{ cat: string; fav: boolean }>
  selectedCat: string | null
  showFavorites: boolean
}>()

const emit = defineEmits<{
  selectCat: [cat: string | null]
  toggleFavorites: []
}>()

const hoveredRow = ref<string | null>(null)

const catCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const item of props.items) {
    counts[item.cat] = (counts[item.cat] ?? 0) + 1
  }
  return counts
})

const sortedCats = computed(() =>
  Object.keys(catCounts.value).sort((a, b) => a.localeCompare(b))
)

const favCount = computed(() => props.items.filter((i) => i.fav).length)

const rowStyle = (key: string, isActive: boolean) => ({
  padding: '6px 14px',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: isActive ? T.bgActive : hoveredRow.value === key ? T.bgHover : 'transparent',
  color: isActive ? T.fg : T.fgDim,
  fontSize: '13px',
})
</script>

<template>
  <div :style="{ padding: '8px 0' }">
    <div
      :style="rowStyle('all', !props.selectedCat && !props.showFavorites)"
      @click="emit('selectCat', null)"
      @mouseenter="hoveredRow = 'all'"
      @mouseleave="hoveredRow = null"
    >
      <span>All</span>
      <span :style="{ fontSize: '11px', color: T.fgMuted }">{{ props.items.length }}</span>
    </div>
    <div
      :style="rowStyle('starred', props.showFavorites)"
      @click="emit('toggleFavorites')"
      @mouseenter="hoveredRow = 'starred'"
      @mouseleave="hoveredRow = null"
    >
      <span :style="{ color: T.yellow }">&#9733; Starred</span>
      <span :style="{ fontSize: '11px', color: T.fgMuted }">{{ favCount }}</span>
    </div>
    <div :style="{ height: '1px', background: T.border, margin: '6px 14px' }" />
    <div
      v-for="cat in sortedCats"
      :key="cat"
      :style="rowStyle(cat, props.selectedCat === cat && !props.showFavorites)"
      @click="emit('selectCat', cat)"
      @mouseenter="hoveredRow = cat"
      @mouseleave="hoveredRow = null"
    >
      <span>{{ cat }}</span>
      <span :style="{ fontSize: '11px', color: T.fgMuted }">{{ catCounts[cat] }}</span>
    </div>
  </div>
</template>
