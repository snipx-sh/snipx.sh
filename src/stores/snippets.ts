import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { Snippet } from "../lib/types"

export const useSnippetsStore = defineStore("snippets", () => {
  const items = ref<Snippet[]>([])
  const selectedId = ref<string | null>(null)
  const selectedCat = ref<string | null>(null)
  const showFavorites = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const selected = computed(() =>
    items.value.find((s) => s.id === selectedId.value) ?? null
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

  const filtered = computed(() => {
    let result = items.value
    if (showFavorites.value) {
      result = result.filter((s) => s.fav)
    }
    if (selectedCat.value) {
      result = result.filter((s) => s.cat === selectedCat.value)
    }
    return result
  })

  const fetchAll = async () => {
    isLoading.value = true
    error.value = null
    try {
      const res = await fetch("http://localhost:7878/api/v1/snippets")
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
    showFavorites,
    isLoading,
    error,
    selected,
    categories,
    filtered,
    fetchAll,
  }
})
