<template>
  <div class="workplace-page">
    <div class="workplace-header">
      <div>
        <h2 class="workplace-title">消息中心</h2>
        <p class="workplace-desc">接收供给告警、系统通知与授权变更消息；告警类消息可直接跳转至对应告警处置。</p>
      </div>
      <div class="v8-summary-stats">
        <span>未读<strong>{{ unread }}</strong></span>
      </div>
    </div>

    <a-card class="content-card" :bordered="false">
      <div class="v8-msg-toolbar">
        <a-radio-group v-model:model-value="typeFilter" type="button" size="small" @change="load">
          <a-radio value="all">全部</a-radio>
          <a-radio value="alert">告警</a-radio>
          <a-radio value="system">系统</a-radio>
          <a-radio value="auth">授权</a-radio>
        </a-radio-group>
        <a-button type="text" size="small" :disabled="!unread" @click="onMarkAll">全部标为已读</a-button>
      </div>

      <a-spin :loading="loading" style="width: 100%">
        <a-empty v-if="!filtered.length" description="暂无消息" />
        <div v-else class="v8-msg-list">
          <div
            v-for="m in filtered"
            :key="m.id"
            class="v8-msg-item"
            :class="{ 'is-unread': !m.isRead }"
            @click="onOpen(m)"
          >
            <span class="v8-msg-dot" :class="!m.isRead ? 'show' : ''"></span>
            <a-tag :color="messageTypeMeta[m.type].color" size="small" class="v8-msg-tag">
              {{ messageTypeMeta[m.type].label }}
            </a-tag>
            <div class="v8-msg-body">
              <div class="v8-msg-title-row">
                <span class="v8-msg-title">{{ m.title }}</span>
                <span class="v8-msg-time">{{ m.createdAt }}</span>
              </div>
              <div class="v8-msg-summary">{{ m.summary }}</div>
            </div>
            <IconRight class="v8-msg-arrow" />
          </div>
        </div>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconRight } from '@arco-design/web-vue/es/icon'
import {
  getMessages,
  markAllMessagesRead,
  markMessageRead,
} from '@/v8/api/system'
import { messageTypeMeta, type MessageType, type V8Message } from '@/v8/mock/types'

const router = useRouter()
const loading = ref(false)
const messages = ref<V8Message[]>([])
const typeFilter = ref<'all' | MessageType>('all')

const filtered = computed(() =>
  typeFilter.value === 'all' ? messages.value : messages.value.filter((m) => m.type === typeFilter.value),
)
const unread = computed(() => messages.value.filter((m) => !m.isRead).length)

async function load() {
  loading.value = true
  try {
    messages.value = await getMessages()
  } finally {
    loading.value = false
  }
}

async function onOpen(m: V8Message) {
  if (!m.isRead) {
    const updated = await markMessageRead(m.id)
    if (updated) {
      const idx = messages.value.findIndex((x) => x.id === m.id)
      if (idx > -1) messages.value[idx] = updated
    }
  }
  // 告警类消息跳转到监控告警处置
  if (m.type === 'alert') router.push('/v8/monitor')
}

async function onMarkAll() {
  await markAllMessagesRead()
  messages.value.forEach((m) => {
    m.isRead = true
  })
}

onMounted(load)
</script>

<style lang="scss" scoped>
.v8-msg-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.v8-msg-list {
  display: flex;
  flex-direction: column;
}
.v8-msg-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.v8-msg-item:hover {
  background: #f7f8fa;
}
.v8-msg-item + .v8-msg-item {
  border-top: 1px solid #f2f3f5;
}
.v8-msg-dot {
  width: 8px;
  height: 8px;
  margin-top: 7px;
  border-radius: 50%;
  background: transparent;
  flex-shrink: 0;
}
.v8-msg-dot.show {
  background: #f53f3f;
}
.v8-msg-tag {
  margin-top: 2px;
  flex-shrink: 0;
}
.v8-msg-body {
  flex: 1;
  min-width: 0;
}
.v8-msg-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.v8-msg-title {
  font-size: 14px;
  color: #4e5969;
}
.is-unread .v8-msg-title {
  font-weight: 600;
  color: #1d2129;
}
.v8-msg-time {
  font-size: 12px;
  color: #a9aeb8;
  flex-shrink: 0;
}
.v8-msg-summary {
  margin-top: 4px;
  font-size: 13px;
  color: #86909c;
  line-height: 1.6;
}
.v8-msg-arrow {
  margin-top: 6px;
  color: #c9cdd4;
  flex-shrink: 0;
}
</style>
