<script setup lang="ts">
import { computed } from "vue"
import { T } from "../../lib/theme"

const props = defineProps<{
  code: string
  solution: string
  showAnswer: boolean
  level: number
  lang: string
}>()

const emit = defineEmits<{
  "update:code": [code: string]
}>()

const ghostRemainder = computed(() => {
  if (props.showAnswer) return ""
  if (props.level >= 4) return ""
  if (props.level === 3) {
    const firstLine = props.solution.split("\n")[0] ?? ""
    if (props.code.length === 0) return firstLine
    if (firstLine.startsWith(props.code.trimEnd())) {
      return firstLine.slice(props.code.trimEnd().length)
    }
    return ""
  }
  if (props.code.length === 0) return props.solution
  if (props.solution.startsWith(props.code.trimEnd())) {
    return props.solution.slice(props.code.trimEnd().length)
  }
  return ""
})

const onInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  emit("update:code", target.value)
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Tab") {
    e.preventDefault()
    const target = e.target as HTMLTextAreaElement
    const start = target.selectionStart
    const end = target.selectionEnd
    const value = target.value
    const newValue = value.substring(0, start) + "  " + value.substring(end)
    emit("update:code", newValue)
    requestAnimationFrame(() => {
      target.selectionStart = start + 2
      target.selectionEnd = start + 2
    })
  }
}
</script>

<template>
  <div
    :style="{
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: T.bgPanel,
      borderRadius: '4px',
      overflow: 'hidden',
    }"
  >
    <pre
      :style="{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: '12px',
        fontFamily: 'monospace',
        fontSize: '13px',
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        pointerEvents: 'none',
        color: 'transparent',
        overflow: 'auto',
      }"
    ><span :style="{ color: T.fg }">{{ code }}</span><span :style="{ color: T.fg, opacity: 0.32 }">{{ ghostRemainder }}</span></pre>

    <textarea
      :value="code"
      :style="{
        position: 'relative',
        width: '100%',
        height: '100%',
        margin: 0,
        padding: '12px',
        fontFamily: 'monospace',
        fontSize: '13px',
        lineHeight: 1.5,
        color: T.fg,
        backgroundColor: 'transparent',
        border: 'none',
        outline: 'none',
        resize: 'none',
        caretColor: T.blue,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        WebkitTextFillColor: 'transparent',
      }"
      spellcheck="false"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      @input="onInput"
      @keydown="onKeydown"
    />
  </div>
</template>
