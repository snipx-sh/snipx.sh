<script setup lang="ts">
import { computed } from "vue"
import { T } from "../../lib/theme"

const props = defineProps<{
  level: number
  timerSeconds: number
  timerRunning: boolean
  allPassed: boolean
}>()

const emit = defineEmits<{
  setLevel: [level: number]
  startTimer: []
}>()

const parTimes: Record<number, number> = {
  1: 0,
  2: 180,
  3: 120,
  4: 90,
  5: 60,
}

const parTime = computed(() => parTimes[props.level] ?? 0)

const remaining = computed(() => {
  if (parTime.value === 0) return 0
  return Math.max(0, parTime.value - props.timerSeconds)
})

const isLow = computed(() => parTime.value > 0 && remaining.value <= 15)

const timerDisplay = computed(() => {
  if (parTime.value === 0) return "--:--"
  const mins = Math.floor(remaining.value / 60)
  const secs = remaining.value % 60
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
})

const progressPct = computed(() => {
  if (parTime.value === 0) return 100
  return (remaining.value / parTime.value) * 100
})

const levels = [1, 2, 3, 4, 5]
</script>

<template>
  <div :style="{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }">
    <div :style="{ display: 'flex', gap: '4px' }">
      <button
        v-for="l in levels"
        :key="l"
        :style="{
          padding: '4px 10px',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: 'inherit',
          background: l === level ? T.bgActive : 'transparent',
          color: l === level ? T.blue : T.fgMuted,
        }"
        @click="emit('setLevel', l)"
      >
        L{{ l }}
      </button>
    </div>

    <div :style="{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }">
      <div
        :style="{
          flex: 1,
          height: '4px',
          borderRadius: '2px',
          background: T.bgHL,
          overflow: 'hidden',
        }"
      >
        <div
          :style="{
            width: `${progressPct}%`,
            height: '100%',
            borderRadius: '2px',
            background: isLow ? T.red : T.blue,
            transition: 'width 1s linear, background 0.3s',
          }"
        />
      </div>

      <span
        :style="{
          fontFamily: 'monospace',
          fontSize: '13px',
          fontWeight: 600,
          color: isLow ? T.red : T.fgDim,
          minWidth: '42px',
          textAlign: 'right',
        }"
      >
        {{ timerDisplay }}
      </span>
    </div>

    <button
      v-if="parTime > 0 && !timerRunning && !allPassed"
      :style="{
        padding: '4px 12px',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 600,
        fontFamily: 'inherit',
        background: T.blue,
        color: T.bgDark,
      }"
      @click="emit('startTimer')"
    >
      Start
    </button>
  </div>
</template>
