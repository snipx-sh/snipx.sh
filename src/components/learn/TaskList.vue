<script setup lang="ts">
import { T } from "../../lib/theme"

defineProps<{
  tasks: Array<{ id: string; label: string; passed: boolean }>
  allPassed: boolean
}>()
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
    <div
      v-for="task in tasks"
      :key="task.id"
      :style="{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '4px 0',
      }"
    >
      <div
        :style="{
          width: '18px',
          height: '18px',
          minWidth: '18px',
          borderRadius: '50%',
          border: `2px solid ${task.passed ? T.green : T.border}`,
          backgroundColor: task.passed ? T.green : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          color: '#fff',
        }"
      >
        <span v-if="task.passed">&#10003;</span>
      </div>
      <span
        :style="{
          fontSize: '13px',
          textDecoration: task.passed ? 'line-through' : 'none',
          color: task.passed ? T.fgMuted : T.fg,
        }"
      >
        {{ task.label }}
      </span>
    </div>

    <div
      v-if="allPassed"
      :style="{
        marginTop: '8px',
        padding: '8px 12px',
        borderRadius: '4px',
        backgroundColor: `${T.green}1a`,
        color: T.green,
        fontSize: '13px',
        fontWeight: 600,
      }"
    >
      All tasks complete
    </div>
  </div>
</template>
