import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { Snippet, CreateSnippet } from "../lib/types"
import { client, patchById } from "../lib/client"

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
      const { data, error: fetchError } = await client.api.v1.snippets.get()
      if (fetchError) throw new Error(String(fetchError))
      items.value = (data as Snippet[]) ?? []
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch"
    } finally {
      isLoading.value = false
    }
  }

  const add = async (data: CreateSnippet) => {
    error.value = null
    try {
      const { error: addError } = await client.api.v1.snippets.post({ body: data })
      if (addError) {
        throw new Error(String(addError))
      }
      await fetchAll()
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to add snippet"
    }
  }

  const toggleFav = async (id: string, fav: boolean) => {
    error.value = null
    try {
      const { error: toggleError } = await patchById(client.api.v1.snippets, id, { fav: !fav })
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
