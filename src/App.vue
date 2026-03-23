<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue"
import { T } from "./lib/theme"
import AppHeader from "./components/AppHeader.vue"
import Sidebar from "./components/Sidebar.vue"
import SnippetList from "./components/SnippetList.vue"
import SnippetDetail from "./components/SnippetDetail.vue"
import DocList from "./components/DocList.vue"
import DocDetail from "./components/DocDetail.vue"
import BookmarkList from "./components/BookmarkList.vue"
import BookmarkDetail from "./components/BookmarkDetail.vue"
import AddForm from "./components/AddForm.vue"
import ReplPanel from "./components/ReplPanel.vue"
import LearnSidebar from "./components/learn/LearnSidebar.vue"
import LessonContent from "./components/learn/LessonContent.vue"
import GhostEditor from "./components/learn/GhostEditor.vue"
import SpeedBar from "./components/learn/SpeedBar.vue"
import OutputPanel from "./components/learn/OutputPanel.vue"
import AskPanel from "./components/learn/AskPanel.vue"
import { useSnippetsStore } from "./stores/snippets"
import { useDocsStore } from "./stores/docs"
import { useBookmarksStore } from "./stores/bookmarks"
import { useLearnStore } from "./stores/learn"
import { chapters } from "./data/lessons"
import type { CreateSnippet, CreateDoc, CreateBookmark } from "./lib/types"

type Mode = "snippets" | "docs" | "bookmarks" | "learn"

const mode = ref<Mode>("snippets")
const searchQuery = ref("")
const showAdd = ref(false)
const showRepl = ref(false)
const showOutput = ref(false)
const showAsk = ref(false)
const layoutHeight = ref(window.innerHeight)

window.addEventListener("resize", () => {
  layoutHeight.value = window.innerHeight
})

const snippetsStore = useSnippetsStore()
const docsStore = useDocsStore()
const bookmarksStore = useBookmarksStore()
const learnStore = useLearnStore()

// Load lessons into learn store
onMounted(() => {
  learnStore.chapters = chapters
})

const activeStore = computed(() => {
  if (mode.value === "snippets") return snippetsStore
  if (mode.value === "docs") return docsStore
  if (mode.value === "bookmarks") return bookmarksStore
  return null
})

const sidebarItems = computed(() => {
  const store = activeStore.value
  if (!store) return []
  return store.items.map((item: { cat: string; fav: boolean }) => ({
    cat: item.cat,
    fav: item.fav,
  }))
})

const selectedCat = computed({
  get: () => activeStore.value?.selectedCat ?? null,
  set: (val: string | null) => {
    if (activeStore.value) activeStore.value.selectedCat = val
  },
})

const showFavorites = computed({
  get: () => activeStore.value?.showFavorites ?? false,
  set: (val: boolean) => {
    if (activeStore.value) activeStore.value.showFavorites = val
  },
})

watch(mode, (newMode) => {
  searchQuery.value = ""
  showAdd.value = false
  if (newMode === "snippets") snippetsStore.fetchAll()
  else if (newMode === "docs") docsStore.fetchAll()
  else if (newMode === "bookmarks") bookmarksStore.fetchAll()
}, { immediate: true })

const onSelectCat = (cat: string | null) => {
  selectedCat.value = cat
  if (activeStore.value) activeStore.value.showFavorites = false
}

const onToggleFavorites = () => {
  if (activeStore.value) {
    activeStore.value.showFavorites = !activeStore.value.showFavorites
    activeStore.value.selectedCat = null
  }
}

const onSelectItem = (id: string) => {
  if (activeStore.value) activeStore.value.selectedId = id
  showAdd.value = false
}

const onCopy = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
  } catch {
    // Tauri clipboard fallback would go here
  }
}

const onToggleFav = async (id: string, fav: boolean) => {
  if (mode.value === "snippets") await snippetsStore.toggleFav(id, fav)
  else if (mode.value === "docs") await docsStore.toggleFav(id, fav)
  else if (mode.value === "bookmarks") await bookmarksStore.toggleFav(id, fav)
}

const onAddSubmit = async (data: Record<string, unknown>) => {
  if (mode.value === "snippets") await snippetsStore.add(data as CreateSnippet)
  else if (mode.value === "docs") await docsStore.add(data as CreateDoc)
  else if (mode.value === "bookmarks") await bookmarksStore.add(data as CreateBookmark)
  showAdd.value = false
}

const onReplNavigate = (navMode: "snippets" | "docs" | "bookmarks", id: string) => {
  mode.value = navMode
  setTimeout(() => {
    if (activeStore.value) activeStore.value.selectedId = id
  }, 100)
}

const itemCount = computed(() => activeStore.value?.items.length ?? 0)
</script>

<template>
  <div :style="{ height: layoutHeight + 'px', background: T.bg, color: T.fg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }">
    <AppHeader
      :mode="mode"
      :search-query="searchQuery"
      @update:mode="mode = $event"
      @update:search-query="searchQuery = $event"
      @add-click="showAdd = !showAdd"
      @repl-toggle="showRepl = !showRepl"
    />

    <div :style="{ flex: 1, display: 'flex', overflow: 'hidden' }">
      <!-- Sidebar 186px -->
      <div :style="{ width: '186px', flexShrink: 0, borderRight: `1px solid ${T.border}`, background: T.bgDark, overflowY: 'auto' }">
        <div :style="{ padding: '8px 14px', color: T.fgMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }">
          {{ mode }}
        </div>
        <Sidebar
          v-if="mode !== 'learn'"
          :items="sidebarItems"
          :selected-cat="selectedCat"
          :show-favorites="showFavorites"
          @select-cat="onSelectCat"
          @toggle-favorites="onToggleFavorites"
        />
        <LearnSidebar
          v-if="mode === 'learn'"
          :chapters="learnStore.chapters"
          :current-chapter-id="learnStore.currentChapterId"
          :current-lesson-id="learnStore.currentLessonId"
          :completed-lessons="learnStore.completedLessons"
          @select-lesson="(chapterId, lessonId) => learnStore.selectLesson(chapterId, lessonId)"
        />
      </div>

      <!-- Non-learn: List 275px + Detail -->
      <template v-if="mode !== 'learn'">
        <div :style="{ width: '275px', flexShrink: 0, borderRight: `1px solid ${T.border}`, background: T.bgPanel, overflowY: 'auto' }">
          <SnippetList
            v-if="mode === 'snippets'"
            :items="snippetsStore.filtered"
            :selected-id="snippetsStore.selectedId"
            :search-query="searchQuery"
            @select="onSelectItem"
          />
          <DocList
            v-if="mode === 'docs'"
            :items="docsStore.filtered"
            :selected-id="docsStore.selectedId"
            :search-query="searchQuery"
            @select="onSelectItem"
          />
          <BookmarkList
            v-if="mode === 'bookmarks'"
            :items="bookmarksStore.filtered"
            :selected-id="bookmarksStore.selectedId"
            :search-query="searchQuery"
            @select="onSelectItem"
          />
        </div>

        <div :style="{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }">
          <div :style="{ flex: 1, overflow: 'auto', padding: '20px' }">
            <AddForm
              v-if="showAdd && mode !== 'learn'"
              :mode="mode as 'snippets' | 'docs' | 'bookmarks'"
              @submit="onAddSubmit"
              @cancel="showAdd = false"
            />
            <template v-else-if="mode === 'snippets' && snippetsStore.selected">
              <SnippetDetail
                :snippet="snippetsStore.selected"
                @copy="onCopy"
                @toggle-fav="onToggleFav(snippetsStore.selected!.id, snippetsStore.selected!.fav)"
              />
            </template>
            <template v-else-if="mode === 'docs' && docsStore.selected">
              <DocDetail
                :doc="docsStore.selected"
                @toggle-fav="onToggleFav(docsStore.selected!.id, docsStore.selected!.fav)"
              />
            </template>
            <template v-else-if="mode === 'bookmarks' && bookmarksStore.selected">
              <BookmarkDetail
                :bookmark="bookmarksStore.selected"
                @toggle-fav="onToggleFav(bookmarksStore.selected!.id, bookmarksStore.selected!.fav)"
              />
            </template>
            <div v-else :style="{ color: T.fgMuted, fontSize: '13px' }">Select an item</div>
          </div>

          <ReplPanel
            v-if="showRepl"
            :visible="showRepl"
            @navigate="onReplNavigate"
          />
        </div>
      </template>

      <!-- Learn mode: 3-panel layout -->
      <template v-if="mode === 'learn'">
        <div :style="{ width: '340px', flexShrink: 0, borderRight: `1px solid ${T.border}`, background: T.bgPanel, overflowY: 'auto', padding: '16px' }">
          <template v-if="learnStore.currentLesson">
            <LessonContent
              :lesson="learnStore.currentLesson"
              :task-results="learnStore.taskResults"
              :all-passed="learnStore.allTasksPassed"
              @prev="() => {}"
              @next="() => {}"
            />
          </template>
          <div v-else :style="{ color: T.fgMuted, fontSize: '13px' }">Select a lesson from the sidebar</div>
        </div>

        <div :style="{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }">
          <template v-if="learnStore.currentLesson">
            <SpeedBar
              :level="learnStore.level"
              :timer-seconds="learnStore.timerSeconds"
              :timer-running="learnStore.timerRunning"
              :all-passed="learnStore.allTasksPassed"
              @set-level="learnStore.setLevel"
              @start-timer="learnStore.timerRunning = true"
            />
            <div :style="{ flex: 1, display: 'flex', overflow: 'hidden' }">
              <div :style="{ flex: 1, overflow: 'hidden' }">
                <GhostEditor
                  :code="learnStore.editorCode"
                  :solution="learnStore.currentLesson.solution"
                  :show-answer="learnStore.showAnswer"
                  :level="learnStore.level"
                  :lang="learnStore.currentLesson.lang"
                  @update:code="learnStore.editorCode = $event"
                />
              </div>
              <AskPanel
                v-if="showAsk"
                :visible="showAsk"
                :lesson-title="learnStore.currentLesson.title"
                :tasks="learnStore.currentLesson.tasks.map(t => ({ label: t.label }))"
                :editor-code="learnStore.editorCode"
                @close="showAsk = false"
              />
            </div>
            <OutputPanel
              v-if="showOutput"
              :output="learnStore.currentLesson.output"
              :visible="showOutput"
              @close="showOutput = false"
            />
          </template>
          <div v-else :style="{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.fgMuted }">
            Select a lesson to start learning
          </div>
        </div>
      </template>
    </div>

    <div :style="{ height: '26px', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '11px', color: T.fgMuted, background: T.bgDark, borderTop: `1px solid ${T.border}`, gap: '16px' }">
      <span v-if="mode !== 'learn'">{{ itemCount }} {{ mode }}</span>
      <span v-else>Learn mode</span>
      <span :style="{ marginLeft: 'auto' }">snipx v0.1.0</span>
    </div>
  </div>
</template>
