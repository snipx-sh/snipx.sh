import { defineStore } from "pinia"
import { ref, computed } from "vue"

export interface LessonTask {
  id: string
  label: string
  check: (code: string) => boolean
}

export interface ContentBlock {
  type: "h2" | "p" | "code" | "tip"
  text: string
  lang?: string
}

export interface Lesson {
  id: string
  title: string
  section: string
  lang: string
  content: ContentBlock[]
  starter: string
  solution: string
  tasks: LessonTask[]
  output: string
}

export interface Chapter {
  id: string
  title: string
  color: string
  lessons: Lesson[]
}

export const useLearnStore = defineStore("learn", () => {
  const chapters = ref<Chapter[]>([])
  const currentChapterId = ref<string | null>(null)
  const currentLessonId = ref<string | null>(null)
  const editorCode = ref("")
  const level = ref(1)
  const completedLessons = ref<Record<string, boolean>>({})
  const showAnswer = ref(false)
  const timerSeconds = ref(0)
  const timerRunning = ref(false)

  const currentChapter = computed(() =>
    chapters.value.find((c) => c.id === currentChapterId.value) ?? null
  )

  const currentLesson = computed(() =>
    currentChapter.value?.lessons.find((l) => l.id === currentLessonId.value) ?? null
  )

  const taskResults = computed(() => {
    if (!currentLesson.value) return []
    return currentLesson.value.tasks.map((task) => ({
      ...task,
      passed: task.check(editorCode.value),
    }))
  })

  const allTasksPassed = computed(() =>
    taskResults.value.length > 0 && taskResults.value.every((t) => t.passed)
  )

  const selectLesson = (chapterId: string, lessonId: string) => {
    currentChapterId.value = chapterId
    currentLessonId.value = lessonId
    const lesson = chapters.value
      .find((c) => c.id === chapterId)
      ?.lessons.find((l) => l.id === lessonId)
    if (lesson) {
      editorCode.value = level.value === 1 ? lesson.starter : ""
      showAnswer.value = false
      timerSeconds.value = 0
    }
  }

  const markComplete = (lessonId: string) => {
    completedLessons.value[lessonId] = true
  }

  const setLevel = (newLevel: number) => {
    level.value = newLevel
    if (currentLesson.value) {
      editorCode.value = newLevel === 1 ? currentLesson.value.starter : ""
      showAnswer.value = false
      timerSeconds.value = 0
    }
  }

  return {
    chapters,
    currentChapterId,
    currentLessonId,
    editorCode,
    level,
    completedLessons,
    showAnswer,
    timerSeconds,
    timerRunning,
    currentChapter,
    currentLesson,
    taskResults,
    allTasksPassed,
    selectLesson,
    markComplete,
    setLevel,
  }
})
