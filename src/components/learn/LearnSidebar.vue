<script setup lang="ts">
import { computed } from "vue"
import { T } from "../../lib/theme"
import type { Chapter } from "../../stores/learn"

const props = defineProps<{
  chapters: Chapter[]
  currentChapterId: string | null
  currentLessonId: string | null
  completedLessons: Record<string, boolean>
}>()

const emit = defineEmits<{
  selectLesson: [chapterId: string, lessonId: string]
}>()

const totalLessons = computed(() =>
  props.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0)
)

const completedCount = computed(() =>
  Object.values(props.completedLessons).filter(Boolean).length
)

const progressPct = computed(() =>
  totalLessons.value > 0 ? (completedCount.value / totalLessons.value) * 100 : 0
)
</script>

<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: T.bgPanel,
      borderRight: `1px solid ${T.border}`,
      overflow: 'hidden',
    }"
  >
    <div :style="{ flex: 1, overflowY: 'auto', padding: '12px 0' }">
      <div v-for="chapter in chapters" :key="chapter.id" :style="{ marginBottom: '12px' }">
        <div
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 16px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: T.fgMuted,
          }"
        >
          <span
            :style="{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: chapter.color,
            }"
          />
          {{ chapter.title }}
        </div>

        <div
          v-for="lesson in chapter.lessons"
          :key="lesson.id"
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 16px',
            cursor: 'pointer',
            fontSize: '13px',
            color: currentLessonId === lesson.id ? T.fg : T.fgDim,
            backgroundColor:
              currentChapterId === chapter.id && currentLessonId === lesson.id
                ? T.bgActive
                : 'transparent',
          }"
          @click="emit('selectLesson', chapter.id, lesson.id)"
        >
          <span
            :style="{
              width: '14px',
              height: '14px',
              minWidth: '14px',
              borderRadius: '50%',
              border: `2px solid ${completedLessons[lesson.id] ? T.green : T.border}`,
              backgroundColor: completedLessons[lesson.id] ? T.green : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              color: '#fff',
            }"
          >
            <span v-if="completedLessons[lesson.id]">&#10003;</span>
          </span>
          <span>{{ lesson.title }}</span>
        </div>
      </div>
    </div>

    <div :style="{ padding: '12px 16px', borderTop: `1px solid ${T.border}` }">
      <div
        :style="{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: T.fgMuted,
          marginBottom: '6px',
        }"
      >
        <span>Progress</span>
        <span>{{ completedCount }} / {{ totalLessons }}</span>
      </div>
      <div
        :style="{
          height: '4px',
          borderRadius: '2px',
          backgroundColor: T.bgHL,
          overflow: 'hidden',
        }"
      >
        <div
          :style="{
            height: '100%',
            width: `${progressPct}%`,
            backgroundColor: T.green,
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }"
        />
      </div>
    </div>
  </div>
</template>
