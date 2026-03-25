<script setup lang="ts">
import { ref, nextTick } from "vue"
import { T } from "../../lib/theme"

const props = defineProps<{
  visible: boolean
  lessonTitle: string
  tasks: Array<{ label: string }>
  editorCode: string
}>()

const emit = defineEmits<{
  close: []
}>()

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const messages = ref<ChatMessage[]>([])
const input = ref("")
const isLoading = ref(false)
const chatArea = ref<HTMLElement | null>(null)

const scrollToBottom = async () => {
  await nextTick()
  if (chatArea.value) {
    chatArea.value.scrollTop = chatArea.value.scrollHeight
  }
}

const sendMessage = async () => {
  const text = input.value.trim()
  if (!text || isLoading.value) return

  messages.value.push({ role: "user", content: text })
  input.value = ""
  isLoading.value = true
  await scrollToBottom()

  // TODO: Replace with actual Anthropic API call
  // POST https://api.anthropic.com/v1/messages
  // model: "claude-sonnet-4-20250514"
  // max_tokens: 600
  // system: "You are helping a student complete a coding exercise. Guide them without giving away the full solution. Be concise."
  // Build prompt with: props.lessonTitle, props.tasks, props.editorCode, text

  await new Promise((resolve) => setTimeout(resolve, 500))

  messages.value.push({
    role: "assistant",
    content:
      "I can help with that! This is a placeholder response. In production, this will call the Anthropic API to provide hints without giving away the solution.",
  })

  isLoading.value = false
  await scrollToBottom()
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div
    v-if="visible"
    :style="{
      width: '290px',
      minWidth: '290px',
      display: 'flex',
      flexDirection: 'column',
      background: T.bgPanel,
      borderLeft: `1px solid ${T.border}`,
      height: '100%',
    }"
  >
    <div
      :style="{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderBottom: `1px solid ${T.border}`,
      }"
    >
      <span :style="{ fontSize: '13px', fontWeight: 600, color: T.fg }">
        Ask Claude
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

    <div
      ref="chatArea"
      :style="{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }"
    >
      <div
        v-if="messages.length === 0"
        :style="{
          color: T.fgMuted,
          fontSize: '12px',
          textAlign: 'center',
          padding: '20px 0',
        }"
      >
        Ask a question about this lesson
      </div>

      <div
        v-for="(msg, i) in messages"
        :key="i"
        :style="{
          alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
          maxWidth: '85%',
          padding: '8px 10px',
          borderRadius: '8px',
          fontSize: '12px',
          lineHeight: 1.5,
          background: msg.role === 'user' ? T.blue : T.bgHL,
          color: msg.role === 'user' ? T.bgDark : T.fg,
          wordBreak: 'break-word',
        }"
      >
        {{ msg.content }}
      </div>

      <div
        v-if="isLoading"
        :style="{
          alignSelf: 'flex-start',
          padding: '8px 10px',
          borderRadius: '8px',
          fontSize: '12px',
          background: T.bgHL,
          color: T.fgMuted,
        }"
      >
        Thinking...
      </div>
    </div>

    <div
      :style="{
        padding: '8px 12px',
        borderTop: `1px solid ${T.border}`,
        display: 'flex',
        gap: '6px',
      }"
    >
      <input
        v-model="input"
        :style="{
          flex: 1,
          padding: '6px 10px',
          borderRadius: '4px',
          border: `1px solid ${T.border}`,
          background: T.bgDark,
          color: T.fg,
          fontSize: '12px',
          fontFamily: 'inherit',
          outline: 'none',
        }"
        placeholder="Ask a question..."
        @keydown="handleKeydown"
      />
      <button
        :style="{
          padding: '6px 12px',
          borderRadius: '4px',
          border: 'none',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: 'inherit',
          background: T.blue,
          color: T.bgDark,
          opacity: isLoading ? 0.5 : 1,
        }"
        :disabled="isLoading"
        @click="sendMessage"
      >
        Send
      </button>
    </div>
  </div>
</template>
