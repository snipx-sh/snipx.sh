import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { Doc, CreateDoc } from "../lib/types"
import { client, patchById } from "../lib/client"

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
      const { data, error: fetchError } = await client.api.v1.docs.get()
      if (fetchError) throw new Error(String(fetchError))
      items.value = (data as Doc[]) ?? []
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch"
    } finally {
      isLoading.value = false
    }
  }

  const add = async (data: CreateDoc) => {
    error.value = null
    try {
      const { error: addError } = await client.api.v1.docs.post({ body: data })
      if (addError) {
        error.value = String(addError)
        return
      }
      await fetchAll()
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to add document"
    }
  }

  const toggleFav = async (id: string, fav: boolean) => {
    error.value = null
    try {
      const { error: patchError } = await patchById(client.api.v1.docs, id, {
        fav: !fav,
      })
      if (patchError) {
        error.value = String(patchError)
        return
      }
      await fetchAll()
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to update favorite"
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
    add,
    toggleFav,
  }
})
