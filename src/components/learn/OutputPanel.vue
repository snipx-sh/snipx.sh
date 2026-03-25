<script setup lang="ts">
import { T } from "../../lib/theme"

defineProps<{
  output: string
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div
    v-if="visible"
    :style="{
      background: T.bgDark,
      borderRadius: '6px',
      border: `1px solid ${T.border}`,
      overflow: 'hidden',
    }"
  >
    <div
      :style="{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: T.bgHL,
        borderBottom: `1px solid ${T.border}`,
      }"
    >
      <span :style="{ fontSize: '12px', fontWeight: 600, color: T.fgMuted }">
        Output
      </span>
      <button
        :style="{
          background: 'none',
          border: 'none',
          color: T.fgMuted,
          cursor: 'pointer',
          fontSize: '14px',
          padding: '0 4px',
          fontFamily: 'inherit',
        }"
        @click="emit('close')"
      >
        X
      </button>
    </div>

    <pre
      :style="{
        margin: 0,
        padding: '12px',
        fontFamily: 'monospace',
        fontSize: '13px',
        lineHeight: 1.5,
        color: T.green1,
        height: '150px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }"
    >{{ output }}</pre>
  </div>
</template>
