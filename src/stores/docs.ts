import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { Doc } from "../lib/types"

export const useDocsStore = defineStore("docs", () => {
  const items = ref<Doc[]>([])
  const selectedId = ref<string | null>(null)
  const selectedCat = ref<string | null>(null)
  const selectedTopic = ref<string | null>(null)
  const showFavorites = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const selected = computed(() =>
    items.value.find((d) => d.id === selectedId.value) ?? null
  )

  const categories = computed(() => {
    const counts: Record<string, number> = {}
    for (const item of items.value) {
      counts[item.cat] = (counts[item.cat] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  const topics = computed(() => {
    const counts: Record<string, number> = {}
    for (const item of items.value) {
      if (item.topic) {
        counts[item.topic] = (counts[item.topic] ?? 0) + 1
      }
    }
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  const filtered = computed(() => {
    let result = items.value
    if (showFavorites.value) {
      result = result.filter((d) => d.fav)
    }
    if (selectedCat.value) {
      result = result.filter((d) => d.cat === selectedCat.value)
    }
    if (selectedTopic.value) {
      result = result.filter((d) => d.topic === selectedTopic.value)
    }
    return result
  })

  const fetchAll = async () => {
    isLoading.value = true
    error.value = null
    try {
      const res = await fetch("http://localhost:7878/api/v1/docs")
      items.value = await res.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch"
    } finally {
      isLoading.value = false
    }
  }

  return {
    items,
    selectedId,
    selectedCat,
    selectedTopic,
    showFavorites,
    isLoading,
    error,
    selected,
    categories,
    topics,
    filtered,
    fetchAll,
  }
})
