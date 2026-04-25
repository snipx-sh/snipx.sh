import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { Bookmark, CreateBookmark } from "../lib/types"
import { client, patchById } from "../lib/client"

export const useBookmarksStore = defineStore("bookmarks", () => {
  const items = ref<Bookmark[]>([])
  const selectedId = ref<string | null>(null)
  const selectedCat = ref<string | null>(null)
  const showFavorites = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const selected = computed(() =>
    items.value.find((b) => b.id === selectedId.value) ?? null
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
      result = result.filter((b) => b.fav)
    }
    if (selectedCat.value) {
      result = result.filter((b) => b.cat === selectedCat.value)
    }
    return result
  })

  const fetchAll = async () => {
    isLoading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await client.api.v1.bookmarks.get()
      if (fetchError) throw new Error(String(fetchError))
      items.value = (data as Bookmark[]) ?? []
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch"
    } finally {
      isLoading.value = false
    }
  }

  const add = async (data: CreateBookmark) => {
    error.value = null
    try {
      const { error: addError } = await client.api.v1.bookmarks.post({ body: data })
      if (addError) {
        throw new Error(String(addError))
      }
      await fetchAll()
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to add bookmark"
    }
  }

  const toggleFav = async (id: string, fav: boolean) => {
    error.value = null
    try {
      const { error: toggleError } = await patchById(client.api.v1.bookmarks, id, { fav: !fav })
      if (toggleError) {
        throw new Error(String(toggleError))
      }
      await fetchAll()
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to toggle favorite"
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
    add,
    toggleFav,
  }
})
