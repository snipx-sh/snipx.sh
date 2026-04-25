<script setup lang="ts">
import { T } from "../../lib/theme"
import TaskList from "./TaskList.vue"
import type { Lesson } from "../../stores/learn"

defineProps<{
  lesson: Lesson
  taskResults: Array<{ id: string; label: string; passed: boolean }>
  allPassed: boolean
}>()

defineEmits<{
  prev: []
  next: []
}>()
</script>

<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      gap: '0px',
      padding: '20px 24px',
      overflowY: 'auto',
      height: '100%',
    }"
  >
    <div v-for="(block, i) in lesson.content" :key="i">
      <h2
        v-if="block.type === 'h2'"
        :style="{
          color: T.fg,
          fontSize: '16px',
          fontWeight: 600,
          marginTop: '16px',
          marginBottom: '8px',
        }"
      >
        {{ block.text }}
      </h2>

      <p
        v-else-if="block.type === 'p'"
        :style="{
          color: T.fgDim,
          fontSize: '13px',
          lineHeight: 1.6,
          marginBottom: '8px',
        }"
      >
        {{ block.text }}
      </p>

      <pre
        v-else-if="block.type === 'code'"
        :style="{
          backgroundColor: T.bgPanel,
          color: T.fg,
          fontFamily: 'monospace',
          fontSize: '13px',
          padding: '12px',
          borderRadius: '4px',
          overflow: 'auto',
          marginBottom: '8px',
          lineHeight: 1.5,
        }"
      >{{ block.text }}</pre>

      <div
        v-else-if="block.type === 'tip'"
        :style="{
          backgroundColor: T.bgHL,
          borderLeft: `3px solid ${T.teal}`,
          padding: '12px',
          borderRadius: '0 4px 4px 0',
          color: T.fgDim,
          fontSize: '13px',
          lineHeight: 1.6,
          marginBottom: '8px',
        }"
      >
        {{ block.text }}
      </div>
    </div>

    <div :style="{ marginTop: '24px' }">
      <h2
        :style="{
          color: T.fg,
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '12px',
        }"
      >
        Assignment
      </h2>
      <TaskList :tasks="taskResults" :all-passed="allPassed" />
    </div>

    <div
      :style="{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: `1px solid ${T.border}`,
      }"
    >
      <button
        :style="{
          padding: '6px 16px',
          borderRadius: '4px',
          border: `1px solid ${T.border}`,
          backgroundColor: 'transparent',
          color: T.fgDim,
          fontSize: '13px',
          cursor: 'pointer',
        }"
        @click="$emit('prev')"
      >
        Prev
      </button>
      <button
        :style="{
          padding: '6px 16px',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: allPassed ? T.yellow : T.bgActive,
          color: allPassed ? T.bgDark : T.fgDim,
          fontSize: '13px',
          fontWeight: allPassed ? 600 : 400,
          cursor: 'pointer',
        }"
        @click="$emit('next')"
      >
        Next
      </button>
    </div>
  </div>
</template>
