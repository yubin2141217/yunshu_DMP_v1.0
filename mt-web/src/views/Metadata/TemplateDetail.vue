<template>
  <div class="page-shell detail-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">快速模板详情</h2>
        <p class="page-desc">查看模板基本信息与字段配置（含供数方字段映射）。</p>
      </div>
      <a-button @click="goBack">返回</a-button>
    </div>

    <template v-if="record">
      <a-card class="content-card detail-block" :bordered="false" title="基本信息">
        <a-descriptions :column="2" bordered size="large" :label-style="descLabelStyle">
          <a-descriptions-item label="模板名称">{{ record.name }}</a-descriptions-item>
          <a-descriptions-item label="模板说明" :span="2">{{ record.desc || '—' }}</a-descriptions-item>
        </a-descriptions>
      </a-card>
      <a-card class="content-card detail-block" :bordered="false" title="字段配置">
        <a-table
          :columns="fieldColumns"
          :data="fields"
          row-key="id"
          :pagination="false"
          :bordered="false"
          stripe
        />
        <a-empty v-if="!fields.length" description="该模板未配置字段" />
      </a-card>
    </template>
    <a-card v-else class="content-card" :bordered="false">
      <a-empty description="未找到该快速模板">
        <a-button type="primary" style="margin-top: 12px" @click="$router.push({ path: '/metadata', query: { tab: 'templates' } })">
          返回列表
        </a-button>
      </a-empty>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getFieldTemplate, listMetadata } from '@/api/mt'
import { usePageBack } from '@/composables/useUnsavedLeave'
import type { FieldTemplate, Metadata } from '@/mock/mt'

type TplFieldRow = Metadata & { supplierFieldName: string; supplierDataType: string }

const route = useRoute()
const { goBack } = usePageBack({ path: '/metadata', query: { tab: 'templates' } })
const record = ref<FieldTemplate | null>(null)
const fields = ref<TplFieldRow[]>([])
const descLabelStyle = { width: '148px', minWidth: '148px', maxWidth: '148px' }
const fieldColumns = [
  { title: '字段名', dataIndex: 'name', width: 140 },
  { title: '字段描述', dataIndex: 'description', ellipsis: true, tooltip: true },
  { title: '平台字段类型', dataIndex: 'dataType', width: 110 },
  { title: '业务分类', dataIndex: 'bizCategory', width: 96 },
  { title: '字段名', dataIndex: 'supplierFieldName', width: 140, ellipsis: true, tooltip: true },
  { title: '供数方字段类型', dataIndex: 'supplierDataType', width: 120 },
]

onMounted(async () => {
  const item = await getFieldTemplate(String(route.params.id || ''))
  record.value = item
  if (!item) return
  const all = await listMetadata({ name: '', status: '', page: 1, pageSize: 500 })
  const byId = new Map(all.list.map((f) => [f.id, f]))
  const mapById = new Map((item.fieldMaps || []).map((m) => [m.fieldId, m]))
  fields.value = (item.fieldIds || [])
    .map((id) => {
      const f = byId.get(id)
      if (!f) return null
      const m = mapById.get(id)
      return {
        ...f,
        supplierFieldName: m?.supplierFieldName || f.name,
        supplierDataType: m?.supplierDataType || f.dataType,
      }
    })
    .filter(Boolean) as TplFieldRow[]
})
</script>

<style scoped>
.detail-block {
  margin-bottom: 14px;
}
</style>
