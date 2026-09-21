<template>
  <a-card class="content-card detail-block scheme-op-log" :bordered="false" title="操作记录">
    <p class="scheme-op-log__desc">记录本方案的新建、修改与开启/停用等审计信息</p>
    <a-table
      v-if="rows.length"
      :columns="columns"
      :data="rows"
      row-key="id"
      :pagination="pagination"
      :bordered="false"
      stripe
      size="small"
    >
      <template #action="{ record }">
        <a-tag :color="actionColor(record.action)" size="small">{{ schemeOpActionLabel(record.action) }}</a-tag>
      </template>
    </a-table>
    <a-empty v-else description="暂无操作记录" />
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  schemeOpActionLabel,
  type SchemeOpAction,
  type SchemeOpLog,
} from '@/utils/schemeOpLog'

const props = defineProps<{
  logs?: SchemeOpLog[] | null
}>()

const columns = [
  { title: '操作类型', dataIndex: 'action', slotName: 'action', width: 100 },
  { title: '操作内容', dataIndex: 'summary', ellipsis: true, tooltip: true, minWidth: 200 },
  { title: '操作人', dataIndex: 'operator', width: 110 },
  { title: '操作时间', dataIndex: 'operatedAt', width: 170, cellStyle: { whiteSpace: 'nowrap' } },
]

const rows = computed(() => props.logs || [])

const pagination = computed(() =>
  rows.value.length > 8
    ? { pageSize: 8, showTotal: true, showPageSize: false }
    : false,
)

function actionColor(action: SchemeOpAction) {
  if (action === 'enable') return 'green'
  if (action === 'disable') return 'orangered'
  if (action === 'create') return 'arcoblue'
  if (action === 'download') return 'purple'
  return 'gray'
}
</script>

<style scoped>
.scheme-op-log__desc {
  margin: 0 0 12px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.5;
}
</style>
