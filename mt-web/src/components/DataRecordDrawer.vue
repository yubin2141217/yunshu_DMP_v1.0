<template>
  <a-drawer
    :visible="visible"
    :title="title"
    :width="520"
    :footer="false"
    unmount-on-close
    @cancel="emit('update:visible', false)"
  >
    <a-descriptions v-if="record" :column="1" bordered size="small" layout="horizontal">
      <a-descriptions-item v-for="item in items" :key="item.key" :label="item.label">
        <span class="drawer-value">{{ item.value }}</span>
      </a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DataQueryFieldMeta, DataQueryRow } from '@/api/dataQuery'
import { formatOrgSub } from '@/utils/orgDisplay'

const props = withDefaults(
  defineProps<{
    visible: boolean
    record: DataQueryRow | null
    fields: DataQueryFieldMeta[]
    title?: string
  }>(),
  { title: '数据详情' },
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

function text(v: unknown) {
  const s = v == null ? '' : String(v)
  return s.trim() ? s : '—'
}

function pushStatusText(v?: string) {
  if (v === 'success') return '成功'
  if (v === 'fail') return '失败'
  return text(v)
}

const items = computed(() => {
  const rec = props.record
  if (!rec) return []
  const base = [
    { key: 'schemeName', label: '方案名称', value: text(rec.schemeName) },
    { key: 'schemeNo', label: '方案 ID', value: text(rec.schemeNo || rec.schemeId) },
    { key: 'orgName', label: '机构', value: text(rec.orgName) },
    { key: 'orgSub', label: '机构补充', value: formatOrgSub(rec.orgStatUnit, rec.orgSalesName) || '—' },
    ...(rec.flow === 'outbound'
      ? []
      : [{ key: 'supplierName', label: '供数方', value: text(rec.supplierName) }]),
    { key: 'accessAt', label: rec.flow === 'outbound' ? '推送时间' : '接入时间', value: text(rec.accessAt) },
  ]
  const dynamic = props.fields.map((f) => ({
    key: f.key,
    label: f.title || f.key,
    value: f.key === 'push_status' ? pushStatusText(rec[f.key]) : text(rec[f.key]),
  }))
  return [...base, ...dynamic]
})
</script>

<style scoped>
.drawer-value {
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
