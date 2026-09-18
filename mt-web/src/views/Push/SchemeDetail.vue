<template>
  <div class="page-shell detail-page">
    <div class="page-head detail-page__head">
      <div>
        <h2 class="page-title">推送方案详情</h2>
        <p class="page-desc">查看基础信息、数据来源与推送方式。</p>
      </div>
      <a-space>
        <a-button :disabled="!record" @click="onCopyCreate">复制新增</a-button>
        <a-button @click="goBack">返回</a-button>
      </a-space>
    </div>

    <template v-if="record">
      <a-card class="content-card detail-block" :bordered="false" title="基础信息">
        <a-descriptions :column="2" bordered size="large" :label-style="descLabelStyle">
          <a-descriptions-item label="方案名称" :span="2">{{ record.name }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="record.status === 'enabled' ? 'green' : 'orangered'" size="small">
              {{ record.status === 'enabled' ? '开启' : '停用' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="机构">
            <div class="org-cell">
              <div class="cell-main">{{ record.orgName || '—' }}</div>
              <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="备注" :span="2">{{ record.remark || '—' }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card class="content-card detail-block" :bordered="false" title="选择推送数据">
        <a-descriptions :column="2" bordered size="large" :label-style="descLabelStyle">
          <a-descriptions-item label="数据来源" :span="2">
            <div class="source-with-preview">
              <div class="org-cell">
                <div class="cell-main">{{ dataSourceMainText(record) }}</div>
                <div class="cell-sub">{{ dataSourceSubText(record) }}</div>
              </div>
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="数据去重" :span="2">
            {{
              record.dedupeEnabled
                ? `${record.dedupeWindowHours || 72}h 内 / ${
                    (record.dedupeFields || []).length
                      ? dedupeFieldText
                      : '未选字段'
                  }`
                : '关闭'
            }}
          </a-descriptions-item>
          <a-descriptions-item label="过滤逻辑" :span="2">
            {{
              record.filterRules?.length
                ? `满足${record.filterLogic === 'any' ? '任一' : '全部'}条件才推送`
                : '不过滤'
            }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="field-map-wrap">
          <div class="section-meta">
            选择推送字段（{{ fieldMapRows.length }}）
            <span class="section-meta__tip">云数中台字段 → 接收方字段关联映射</span>
          </div>
          <a-table
          v-if="fieldMapRows.length"
          :columns="fieldMapColumns"
          :data="fieldMapRows"
          row-key="id"
          :pagination="false"
          :bordered="false"
          stripe
          size="small"
        />
          <a-empty v-else description="未配置推送字段" :style="{ padding: '12px 0' }" />
        </div>

        <div class="preview-action">
          <a-button type="outline" size="small" @click="openDataPreview">预览数据</a-button>
          <span class="preview-action__tip">按当前字段映射展示接收方字段名及样例数据，最多展示前 {{ PREVIEW_MAX }} 条</span>
        </div>

        <div v-if="filterRows.length" class="filter-table-wrap">
          <div class="section-meta">过滤条件明细</div>
          <a-table
            :columns="filterColumns"
            :data="filterRows"
            row-key="id"
            :pagination="false"
            :bordered="false"
            stripe
            size="small"
          />
        </div>
      </a-card>

      <a-card class="content-card detail-block" :bordered="false" title="推送方式">
        <a-alert type="info" show-icon class="detail-alert">
          {{ channelLabel(record.channelType) }}：{{ channelTip }}
        </a-alert>

        <a-descriptions :column="2" bordered size="large" :label-style="descLabelStyle">
          <a-descriptions-item label="推送方式">{{ channelLabel(record.channelType) }}</a-descriptions-item>
          <a-descriptions-item label="推送模式">{{ pushModeLabel(record.pushMode) }}</a-descriptions-item>
          <a-descriptions-item v-if="record.pushMode === 'full'" label="选择时间段" :span="2">
            {{ fullTimeRangeText }}
          </a-descriptions-item>

          <template v-if="record.channelType === 'http'">
            <a-descriptions-item label="推送接口地址" :span="2">
              {{ record.httpConfig.endpointUrl || '—' }}
            </a-descriptions-item>
            <a-descriptions-item label="请求方法">{{ record.httpConfig.method }}</a-descriptions-item>
            <a-descriptions-item label="鉴权方式">{{ httpAuthLabel(record.httpConfig.authType) }}</a-descriptions-item>
            <a-descriptions-item label="重试次数">{{ record.httpConfig.retry ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="重试间隔（ms）">{{ record.httpConfig.retryIntervalMs ?? '—' }}</a-descriptions-item>
          </template>

          <template v-else-if="record.channelType === 'mq'">
            <a-descriptions-item label="消息队列种类">
              {{ (record.mqConfig.mqType || '').toUpperCase() }}
            </a-descriptions-item>
            <a-descriptions-item label="鉴权方式">{{ mqAuthLabel(record.mqConfig.authType) }}</a-descriptions-item>
            <a-descriptions-item :label="record.mqConfig.mqType === 'rocketmq' ? 'NameServer 地址' : 'Broker 地址集群'" :span="2">
              {{
                record.mqConfig.mqType === 'rocketmq'
                  ? record.mqConfig.nameServer || '—'
                  : record.mqConfig.brokers || '—'
              }}
            </a-descriptions-item>
            <a-descriptions-item label="Topic / Queue">{{ record.mqConfig.topic || '—' }}</a-descriptions-item>
            <a-descriptions-item label="重试次数">{{ record.mqConfig.retry ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="重试间隔（ms）">{{ record.mqConfig.retryIntervalMs ?? '—' }}</a-descriptions-item>
            <template v-if="record.mqConfig.authType === 'sasl'">
              <a-descriptions-item label="用户名">{{ record.mqConfig.username || '—' }}</a-descriptions-item>
              <a-descriptions-item label="密码">{{ record.mqConfig.password ? '******' : '—' }}</a-descriptions-item>
            </template>
            <a-descriptions-item v-if="record.mqConfig.authType === 'ssl'" label="证书路径">
              {{ record.mqConfig.certPath || '—' }}
            </a-descriptions-item>
          </template>
        </a-descriptions>

        <div v-if="record.channelType === 'http' && record.httpConfig.authType === 'appkey'" class="auth-headers-wrap">
          <div class="section-meta">鉴权 Header</div>
          <a-table
            :columns="authHeaderColumns"
            :data="authHeaderRows"
            row-key="id"
            :pagination="false"
            :bordered="false"
            stripe
            size="small"
          >
            <template #enabled="{ record: row }">
              <a-tag :color="row.enabled === false ? 'gray' : 'green'" size="small">
                {{ row.enabled === false ? '停用' : '启用' }}
              </a-tag>
            </template>
          </a-table>
        </div>
      </a-card>

      <SchemeOpLogCard :logs="record.opLogs" />

      <a-modal
        v-model:visible="previewVisible"
        title="数据预览"
        :width="920"
        :footer="false"
        unmount-on-close
      >
        <a-alert type="info" show-icon style="margin-bottom: 12px">
          仅预览前 {{ PREVIEW_MAX }} 条样例数据；全量明细请前往
          <a-button type="text" class="inline-link" @click="goPushDataDetail">推送数据明细</a-button>
          查看。
        </a-alert>
        <a-spin :loading="previewLoading" style="width: 100%">
          <a-table
            v-if="previewRows.length"
            :columns="previewColumns"
            :data="previewRows"
            row-key="_id"
            :pagination="previewPagination"
            :bordered="false"
            stripe
            size="small"
          />
          <a-empty v-else description="暂无预览数据" />
        </a-spin>
      </a-modal>
    </template>

    <a-card v-else class="content-card" :bordered="false">
      <a-spin :loading="loading" style="width: 100%; min-height: 120px" />
      <a-empty v-if="!loading" description="未找到该推送方案">
        <a-button type="primary" style="margin-top: 12px" @click="$router.push('/push/schemes')">返回列表</a-button>
      </a-empty>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import SchemeOpLogCard from '@/components/SchemeOpLogCard.vue'
import {
  channelLabel,
  dataSourceMainText,
  dataSourceSubText,
  getPushScheme,
  pushFilterFieldOptions,
  pushFilterOpOptions,
  pushModeLabel,
  type PushScheme,
} from '@/api/push'
import { listEnabledMetadata } from '@/api/mt'
import type { PickerField } from '@/components/FieldPicker.vue'
import type { FieldMapItem } from '@/mock/mt'
import { formatOrgSub } from '@/utils/orgDisplay'
import { usePageBack } from '@/composables/useUnsavedLeave'

const route = useRoute()
const router = useRouter()
const { goBack } = usePageBack('/push/schemes')
const record = ref<PushScheme | null>(null)
const loading = ref(false)
const PREVIEW_MAX = 100
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewRows = ref<Record<string, string>[]>([])
const metaFields = ref<PickerField[]>([])
const descLabelStyle = { width: '148px', minWidth: '148px', maxWidth: '148px' }
const previewPagination = {
  pageSize: 10,
  showTotal: true,
  showPageSize: true,
  pageSizeOptions: [10, 20, 50],
}

const channelTip = computed(() => {
  if (!record.value) return ''
  if (record.value.channelType === 'mq') {
    return '中台作为生产端，将数据持续写入对端 Topic / Queue'
  }
  return '中台主动调用对端开放接口，POST JSON 报文推送单条 / 批量数据'
})

/** 字段映射表列定义 */
const fieldMapColumns = [
  { title: '云数中台字段', dataIndex: 'platformName', width: 160, ellipsis: true, tooltip: true },
  { title: '中台字段类型', dataIndex: 'platformDataType', width: 120 },
  { title: '接收方字段', dataIndex: 'receiverName', ellipsis: true, tooltip: true },
  { title: '接收方字段类型', dataIndex: 'receiverDataType', width: 140 },
]

/** 详情展示用的字段映射行 */
const fieldMapRows = computed(() => {
  const r = record.value
  if (!r) return []
  const mapStore = new Map((r.pushFieldMaps || []).map((m) => [m.fieldId, m]))
  const ids = Array.isArray(r.pushFieldIds) && r.pushFieldIds.length
    ? r.pushFieldIds
    : (r.pushFieldMaps || []).map((m) => m.fieldId)
  return ids
    .map((id, idx) => {
      const field = metaFields.value.find((f) => f.id === id)
      const map = mapStore.get(id)
      const platformName = field?.name || map?.supplierFieldName || id
      return {
        id: `${id}-${idx}`,
        platformName,
        platformDataType: field?.dataType || map?.supplierDataType || '—',
        receiverName: map?.supplierFieldName?.trim() || platformName,
        receiverDataType: map?.supplierDataType || field?.dataType || '—',
      }
    })
})

/** 去重字段展示文本 */
const dedupeFieldText = computed(() =>
  (record.value?.dedupeFields || [])
    .map((f) => ({ title: '标题', content: '正文内容', url: '原文链接' }[f] || f))
    .join('、'),
)

/** 全量推送时间段 */
const fullTimeRangeText = computed(() => {
  const r = record.value?.fullTimeRange
  if (Array.isArray(r) && r.length === 2 && r[0] && r[1]) return `${r[0]} ~ ${r[1]}`
  return '—'
})

/** 预览列：按字段映射生成，列名为接收方字段名 */
const previewColumns = computed(() =>
  fieldMapRows.value.map((c) => ({
    title: c.receiverName,
    dataIndex: c.id,
    ellipsis: true,
    tooltip: true,
    minWidth: 140,
  })),
)

/** 鉴权 Header 表格 */
const authHeaderColumns = [
  { title: '启用状态', slotName: 'enabled', width: 90 },
  { title: '参数名', dataIndex: 'name', width: 200, ellipsis: true, tooltip: true },
  { title: '参数值', dataIndex: 'value', ellipsis: true, tooltip: true },
  { title: '说明', dataIndex: 'remark', width: 180, ellipsis: true, tooltip: true },
]

const authHeaderRows = computed(() =>
  (record.value?.httpConfig.authHeaders || []).map((h, i) => ({
    id: `${h.name || 'h'}-${i}`,
    enabled: h.enabled,
    name: h.name || '—',
    value: h.value || '—',
    remark: h.remark || '—',
  })),
)

const filterColumns = [
  { title: '字段', dataIndex: 'fieldLabel', width: 120 },
  { title: '条件', dataIndex: 'opLabel', width: 100 },
  { title: '取值', dataIndex: 'value', ellipsis: true, tooltip: true },
]

const filterRows = computed(() =>
  (record.value?.filterRules || []).map((r) => ({
    id: r.id,
    fieldLabel: pushFilterFieldOptions.find((o) => o.value === r.field)?.label || r.field,
    opLabel: pushFilterOpOptions.find((o) => o.value === r.op)?.label || r.op,
    value: r.value || '—',
  })),
)

function httpAuthLabel(t: string) {
  if (t === 'token') return 'Token（历史方案）'
  if (t === 'appkey') return 'AppKey'
  return '无鉴权'
}

function mqAuthLabel(t: string) {
  if (t === 'sasl') return 'SASL'
  if (t === 'ssl') return 'SSL'
  return '无'
}

function onCopyCreate() {
  if (!record.value) return
  router.push({ path: '/push/schemes/edit', query: { copyFrom: record.value.id } })
}

function goPushDataDetail() {
  if (!record.value) return
  previewVisible.value = false
  router.push({
    path: '/push/push-data',
    query: {
      schemeId: record.value.id,
      schemeName: record.value.name,
      orgId: record.value.orgId || undefined,
    },
  })
}

async function openDataPreview() {
  if (!record.value) return
  const cols = fieldMapRows.value
  if (!cols.length) {
    Message.warning('该方案未配置推送字段')
    return
  }
  previewVisible.value = true
  previewLoading.value = true
  previewRows.value = []
  try {
    // 按当前字段映射生成前 100 条样例数据，列名为接收方字段名
    previewRows.value = Array.from({ length: PREVIEW_MAX }).map((_, i) => {
      const day = String((i % 28) + 1).padStart(2, '0')
      const hour = String(8 + (i % 12)).padStart(2, '0')
      const row: Record<string, string> = { _id: `pv-${i}` }
      cols.forEach((c) => {
        const dt = String(c.receiverDataType || '').toLowerCase()
        if (dt.includes('time') || dt.includes('date')) row[c.id] = `2026-09-${day} ${hour}:12:00`
        else if (dt.includes('int') || dt.includes('long') || dt.includes('number')) row[c.id] = String(10000 + i)
        else if (dt.includes('bool')) row[c.id] = i % 2 === 0 ? 'true' : 'false'
        else if (c.platformName.toLowerCase().includes('url')) row[c.id] = `https://example.com/${1000 + i}`
        else row[c.id] = `${c.platformName}_样例${i + 1}`
      })
      return row
    })
  } finally {
    previewLoading.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const [scheme, metadata] = await Promise.all([
      getPushScheme(String(route.params.id)),
      listEnabledMetadata().catch(() => []),
    ])
    record.value = scheme
    metaFields.value = metadata.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description || m.bizCaliber || '',
      dataType: m.dataType,
      bizCategory: m.bizCategory || '',
    }))
  } catch (e) {
    Message.error(e instanceof Error ? e.message : '加载失败')
    router.push('/push/schemes')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.detail-page__head {
  position: sticky;
  top: 0;
  z-index: 20;
  margin-bottom: 16px;
}
.detail-block {
  margin-bottom: 14px;
}
.detail-alert {
  margin-bottom: 16px;
}
.section-meta {
  margin: 14px 0 10px;
  font-size: 13px;
  color: #86909c;
}
.section-meta__tip {
  margin-left: 8px;
  font-size: 12px;
  color: #c9cdd4;
}
.field-map-wrap,
.auth-headers-wrap {
  margin-top: 4px;
}
.preview-action {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}
.preview-action__tip {
  font-size: 12px;
  color: #86909c;
  line-height: 1.5;
}
.filter-table-wrap {
  margin-top: 4px;
}
.org-cell {
  min-width: 0;
}
.cell-main {
  font-size: 13px;
  color: #1d2129;
  line-height: 1.35;
}
.cell-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.35;
}
.source-with-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.source-with-preview .org-cell {
  flex: 1;
  min-width: 0;
}
.inline-link {
  padding: 0 4px;
  height: auto;
  line-height: inherit;
}
</style>
