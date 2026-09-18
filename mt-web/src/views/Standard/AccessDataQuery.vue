<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <h2 class="page-title">接入数据明细</h2>
        <p class="page-desc">按接入方案与时间段查看中台已接入的明细数据。</p>
      </div>
    </div>

    <a-card class="content-card" :bordered="false">
      <div class="page-search">
        <div class="search-field">
          <span class="search-field__label">接入方案</span>
          <FuzzySuggestSelect
            :key="`scheme-${filterEpoch}`"
            v-model="form.schemeId"
            v-model:keyword="form.schemeName"
            :options="schemeOptions"
            placeholder="接入方案"
            all-label="全部方案"
            width="220px"
          />
        </div>
        <div class="search-field">
          <span class="search-field__label">机构</span>
          <FuzzySuggestSelect
            :key="`org-${filterEpoch}`"
            v-model="form.orgId"
            v-model:keyword="form.orgName"
            :options="orgOptions"
            placeholder="机构"
            all-label="全部机构"
            width="180px"
          />
        </div>
        <div class="search-field">
          <span class="search-field__label">供数方</span>
          <FuzzySuggestSelect
            :key="`supplier-${filterEpoch}`"
            v-model="form.supplierId"
            v-model:keyword="form.supplierName"
            :options="supplierOptions"
            placeholder="供数方"
            all-label="全部供数方"
            width="180px"
          />
        </div>
        <div class="search-field">
          <span class="search-field__label">内容标题</span>
          <a-input
            :key="`title-${filterEpoch}`"
            v-model="fieldFilters.news_title"
            allow-clear
            style="width: 180px"
          />
        </div>
        <div class="search-field">
          <span class="search-field__label">URL链接</span>
          <a-input
            :key="`url-${filterEpoch}`"
            v-model="fieldFilters.news_url"
            allow-clear
            style="width: 180px"
          />
        </div>
        <div class="search-field">
          <span class="search-field__label">接入时间</span>
          <a-range-picker
            :key="`date-${filterEpoch}`"
            v-model="dateRange"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            allow-clear
            :placeholder="['开始时间', '结束时间']"
            style="width: 340px"
            @change="onDateChange"
          />
        </div>
        <div class="search-field">
          <span class="search-field__label">发布时间</span>
          <a-range-picker
            :key="`pub-${filterEpoch}`"
            v-model="publishRange"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            allow-clear
            :placeholder="['开始时间', '结束时间']"
            style="width: 340px"
          />
        </div>
        <a-button type="primary" @click="fetchData(1)">查询</a-button>
        <a-button @click="onReset">重置</a-button>
      </div>

      <div
        v-if="contextFilterTips.length || activeFieldFilterTips.length"
        class="list-result-bar"
      >
        <span class="list-result-bar__label">筛选：</span>
        <a-tag
          v-for="tip in contextFilterTips"
          :key="tip.key"
          closable
          color="orangered"
          @close="tip.clear()"
        >
          {{ tip.label }}
        </a-tag>
        <a-tag
          v-for="tip in activeFieldFilterTips"
          :key="tip.key"
          closable
          color="arcoblue"
          @close="clearFieldFilter(tip.key)"
        >
          {{ tip.label }} ≈ {{ tip.value }}
        </a-tag>
        <a-button
          v-if="activeFieldFilterTips.length"
          type="text"
          size="mini"
          @click="clearAllFieldFilters"
        >
          清空字段筛选
        </a-button>
      </div>

      <a-table
        :columns="tableColumns"
        :data="rows"
        :loading="loading"
        row-key="_id"
        :pagination="false"
        :bordered="false"
        stripe
        :scroll="{ x: '100%' }"
      >
        <template #scheme="{ record }">
          <button type="button" class="cell-link" title="点击填入方案筛选" @click="filterByScheme(record)">
            <div class="cell-main">{{ record.schemeName || '—' }}</div>
            <div class="cell-sub">{{ record.schemeNo || record.schemeId || '—' }}</div>
          </button>
        </template>
        <template #org="{ record }">
          <button type="button" class="cell-link" title="点击填入机构筛选" @click="filterByOrg(record)">
            <div class="cell-main">{{ record.orgName || '—' }}</div>
            <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
          </button>
        </template>
        <template #supplier="{ record }">
          <button
            type="button"
            class="cell-link"
            :disabled="!record.supplierId && !record.supplierName"
            title="点击填入供数方筛选"
            @click="filterBySupplier(record)"
          >
            {{ record.supplierName || '—' }}
          </button>
        </template>
        <template #title="{ record }">
          <button type="button" class="cell-link" title="点击查看详情" @click="openDetail(record)">
            <div class="cell-main">{{ record.news_title || '—' }}</div>
            <div class="cell-sub">{{ record.news_uuid || '—' }}</div>
          </button>
        </template>
        <template #url="{ record }">
          <a
            v-if="record.news_url"
            class="url-link"
            :href="record.news_url"
            target="_blank"
            rel="noopener noreferrer"
            :title="record.news_url"
          >
            {{ record.news_url }}
          </a>
          <span v-else>—</span>
        </template>
        <template #plainCell="{ record, column }">
          {{ cellText(record, column.dataIndex) }}
        </template>
      </a-table>

      <div class="table-footer">
        <a-pagination
          v-model:current="pagination.current"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          show-total
          show-page-size
          show-jumper
          @change="fetchData"
          @page-size-change="onPageSize"
        />
      </div>
    </a-card>

    <DataRecordDrawer v-model:visible="detailVisible" :record="detailRecord" :fields="fields" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DataRecordDrawer from '@/components/DataRecordDrawer.vue'
import FuzzySuggestSelect from '@/components/FuzzySuggestSelect.vue'
import {
  dataQueryRangeOptions,
  getDataQueryOrgOptions,
  getDataQuerySchemeOptions,
  getDataQuerySupplierOptions,
  listDataQuery,
  type DataQueryFieldMeta,
  type DataQueryRange,
  type DataQueryRow,
} from '@/api/dataQuery'
import { formatOrgSub } from '@/utils/orgDisplay'

const route = useRoute()
const router = useRouter()
const rangeOptions = dataQueryRangeOptions
const filterEpoch = ref(0)

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function formatDt(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
function rangeFromPreset(range: DataQueryRange): [string, string] | [] {
  // 累计：不限制接入时间（空 = 全量数据）
  if (range === 'total') return []
  // 今日：今天 00:00:00 至当前时刻
  const end = new Date()
  const start = new Date()
  if (range === 'today') {
    start.setHours(0, 0, 0, 0)
  } else if (range === 'd3') {
    start.setDate(start.getDate() - 3)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 0)
  } else if (range === 'w1') {
    start.setDate(start.getDate() - 7)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 0)
  } else if (range === 'm1') {
    start.setDate(start.getDate() - 30)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 0)
  } else {
    start.setDate(start.getDate() - 30)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 0)
  }
  return [formatDt(start), formatDt(end)]
}

const form = reactive({
  schemeId: '',
  schemeName: '',
  orgId: '',
  orgName: '',
  supplierId: '',
  supplierName: '',
})
const dateRange = ref<string[] | undefined>(undefined)
const publishRange = ref<string[] | undefined>(undefined)
const volumeRange = ref<DataQueryRange>('total')

const schemeOptions = computed(() => getDataQuerySchemeOptions('inbound'))
const orgOptions = computed(() => getDataQueryOrgOptions('inbound'))
const supplierOptions = computed(() => getDataQuerySupplierOptions())

const loading = ref(false)
const rows = ref<DataQueryRow[]>([])
const fields = ref<DataQueryFieldMeta[]>([])
const fieldFilters = reactive<Record<string, string>>({})
const pagination = reactive({ current: 1, pageSize: 20, total: 0 })
const detailVisible = ref(false)
const detailRecord = ref<DataQueryRow | null>(null)

const contextFilterTips = computed(() => {
  const tips: { key: string; label: string; clear: () => void }[] = []
  if (form.orgId || form.orgName) {
    tips.push({
      key: 'org',
      label: `机构：${form.orgName || form.orgId}`,
      clear: () => {
        form.orgId = ''
        form.orgName = ''
        fetchData(1)
      },
    })
  }
  if (form.supplierId || form.supplierName) {
    tips.push({
      key: 'supplier',
      label: `供数方：${form.supplierName || form.supplierId}`,
      clear: () => {
        form.supplierId = ''
        form.supplierName = ''
        fetchData(1)
      },
    })
  }
  return tips
})

/** 字段筛选 tips：用字段中文名展示（内容标题 / url链接 等） */
const activeFieldFilterTips = computed(() =>
  Object.entries(fieldFilters)
    .filter(([, v]) => String(v || '').trim())
    .map(([key, value]) => ({
      key,
      value: String(value).trim(),
      label: fields.value.find((f) => f.key === key)?.title || key,
    })),
)

const tableColumns = [
  { title: '方案名称', dataIndex: 'schemeName', slotName: 'scheme', width: 200 },
  { title: '机构', dataIndex: 'orgName', slotName: 'org', width: 150 },
  { title: '供数方', dataIndex: 'supplierName', slotName: 'supplier', width: 110 },
  { title: '接入时间', dataIndex: 'accessAt', slotName: 'plainCell', width: 168 },
  { title: '内容标题', dataIndex: 'news_title', slotName: 'title', width: 260 },
  { title: 'URL链接', dataIndex: 'news_url', slotName: 'url', width: 220, ellipsis: true },
  { title: '发布时间', dataIndex: 'news_posttime', slotName: 'plainCell', width: 168 },
  { title: '作者昵称', dataIndex: 'media_name', slotName: 'plainCell', width: 120 },
]

function cellText(record: DataQueryRow, key?: string | string[]) {
  const k = Array.isArray(key) ? key[0] : key
  if (!k) return '—'
  const v = record[k]
  return v == null || String(v).trim() === '' ? '—' : String(v)
}

function openDetail(record: DataQueryRow) {
  detailRecord.value = record
  detailVisible.value = true
}

function filterByScheme(record: DataQueryRow) {
  if (!record.schemeId && !record.schemeName) return
  form.schemeId = record.schemeId || ''
  form.schemeName = record.schemeName || ''
  fetchData(1)
}

function filterByOrg(record: DataQueryRow) {
  if (!record.orgId && !record.orgName) return
  form.orgId = record.orgId || ''
  form.orgName = record.orgName || ''
  fetchData(1)
}

function filterBySupplier(record: DataQueryRow) {
  if (!record.supplierId && !record.supplierName) return
  form.supplierId = record.supplierId || ''
  form.supplierName = record.supplierName || ''
  fetchData(1)
}

function onDateChange() {
  if (dateRange.value?.[0] && dateRange.value?.[1]) volumeRange.value = 'custom'
  else volumeRange.value = 'total'
}

function applyRouteQuery() {
  const q = route.query
  form.schemeId = ''
  form.schemeName = ''
  form.orgId = ''
  form.orgName = ''
  form.supplierId = ''
  form.supplierName = ''
  dateRange.value = undefined
  publishRange.value = undefined
  volumeRange.value = 'total'

  if (q.schemeId) form.schemeId = String(q.schemeId)
  if (q.schemeName) {
    form.schemeName = String(q.schemeName)
    if (!form.schemeId) {
      const hit = schemeOptions.value.find((o) => o.label === form.schemeName)
      if (hit) form.schemeId = hit.value
    }
  }
  if (form.schemeId && !form.schemeName) {
    form.schemeName = schemeOptions.value.find((o) => o.value === form.schemeId)?.label || ''
  }
  if (q.orgId) form.orgId = String(q.orgId)
  if (q.orgName) form.orgName = String(q.orgName)
  if (form.orgId && !form.orgName) {
    form.orgName = orgOptions.value.find((o) => o.value === form.orgId)?.label || ''
  }
  if (q.supplierId) form.supplierId = String(q.supplierId)
  if (q.supplierName) form.supplierName = String(q.supplierName)
  if (form.supplierId && !form.supplierName) {
    form.supplierName = supplierOptions.value.find((o) => o.value === form.supplierId)?.label || ''
  }
  if (q.publishFrom && q.publishTo) {
    publishRange.value = [String(q.publishFrom), String(q.publishTo)]
  }
  if (q.dateFrom && q.dateTo) {
    dateRange.value = [String(q.dateFrom), String(q.dateTo)]
    volumeRange.value = 'custom'
  } else {
    const range = String(q.range || '')
    if (rangeOptions.some((o) => o.value === range)) {
      volumeRange.value = range as DataQueryRange
      const preset = rangeFromPreset(range as DataQueryRange)
      // 累计不回填接入时间（空 = 全量），其余快捷区间回填起止时间
      dateRange.value = preset.length ? preset : undefined
    }
  }
}

async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const from = dateRange.value?.[0] || ''
    const to = dateRange.value?.[1] || ''
    const res = await listDataQuery({
      flow: 'inbound',
      orgId: form.orgId,
      orgName: form.orgId ? '' : form.orgName,
      supplierId: form.supplierId,
      supplierName: form.supplierId ? '' : form.supplierName,
      schemeId: form.schemeId,
      schemeName: form.schemeId ? '' : form.schemeName,
      range: from && to ? volumeRange.value : 'total',
      dateFrom: from,
      dateTo: to,
      publishDateFrom: publishRange.value?.[0] || '',
      publishDateTo: publishRange.value?.[1] || '',
      fieldFilters: { ...fieldFilters },
      page,
      pageSize: pagination.pageSize,
    })
    rows.value = res.list
    fields.value = res.fields
    pagination.current = page
    pagination.total = res.total
  } finally {
    loading.value = false
  }
}

function onPageSize(size: number) {
  pagination.pageSize = size
  fetchData(1)
}

async function onReset() {
  form.schemeId = ''
  form.schemeName = ''
  form.orgId = ''
  form.orgName = ''
  form.supplierId = ''
  form.supplierName = ''
  Object.keys(fieldFilters).forEach((k) => delete fieldFilters[k])
  dateRange.value = undefined
  publishRange.value = undefined
  volumeRange.value = 'total'
  filterEpoch.value += 1
  await nextTick()

  if (Object.keys(route.query).length) {
    await router.replace({ path: '/standard/access-data' })
    return
  }
  await fetchData(1)
}

function clearFieldFilter(key: string) {
  delete fieldFilters[key]
  fetchData(1)
}

function clearAllFieldFilters() {
  Object.keys(fieldFilters).forEach((k) => delete fieldFilters[k])
  fetchData(1)
}

watch(
  () => route.fullPath,
  () => {
    applyRouteQuery()
    fetchData(1)
  },
)

onMounted(() => {
  applyRouteQuery()
  fetchData(1)
})
</script>

<style scoped>
.url-link {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  color: var(--mt-primary, #165dff);
  text-decoration: none;
  font-size: 13px;
}
.url-link:hover {
  text-decoration: underline;
}
.cell-link {
  display: block;
  width: 100%;
  max-width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  text-align: left;
  cursor: pointer;
  color: inherit;
  font: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cell-link:hover {
  color: var(--mt-primary, #165dff);
}
.cell-link:disabled {
  cursor: default;
  color: inherit;
}
.org-cell,
.cell-main {
  font-size: 13px;
  color: inherit;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cell-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
