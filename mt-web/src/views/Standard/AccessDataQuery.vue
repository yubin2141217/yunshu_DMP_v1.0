<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <h2 class="page-title">接入数据明细</h2>
        <p class="page-desc">按接入方案与时间段查看中台已接入的明细数据。</p>
      </div>
      <a-button @click="$router.push('/standard')">返回列表</a-button>
    </div>

    <a-card class="content-card" :bordered="false">
      <div class="page-search">
        <FuzzySuggestSelect
          :key="`scheme-${filterEpoch}`"
          v-model="form.schemeId"
          v-model:keyword="form.schemeName"
          :options="schemeOptions"
          placeholder="接入方案"
          all-label="全部方案"
          width="220px"
        />
        <a-range-picker
          :key="`date-${filterEpoch}`"
          v-model="dateRange"
          show-time
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          allow-clear
          :placeholder="['开始时间', '结束时间']"
          style="width: 380px"
          @change="onDateChange"
        />
        <a-button type="primary" @click="fetchData(1)">查询</a-button>
        <a-button @click="onReset">重置</a-button>
        <div class="page-search-actions">
          <a-button :loading="loading" @click="fetchData(pagination.current)">刷新</a-button>
        </div>
      </div>

      <div v-if="activeFieldFilterTips.length" class="field-filter-bar">
        <span class="field-filter-bar__label">字段筛选：</span>
        <a-tag
          v-for="tip in activeFieldFilterTips"
          :key="tip.key"
          closable
          color="arcoblue"
          @close="clearFieldFilter(tip.key)"
        >
          {{ tip.key }} ≈ {{ tip.value }}
        </a-tag>
        <a-button type="text" size="mini" @click="clearAllFieldFilters">清空字段筛选</a-button>
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
        <template #org="{ record }">
          <div class="org-cell">
            <div class="cell-main">{{ record.orgName || '—' }}</div>
            <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
          </div>
        </template>
        <template v-for="f in stringFields" :key="f.key" #[`hdr_${f.key}`]>
          <button type="button" class="col-filter-btn" @click.stop="openFieldFilter(f.key)">
            <span>{{ f.title }}</span>
            <IconFilter
              class="col-filter-btn__icon"
              :class="{ 'is-on': !!fieldFilters[f.key] }"
            />
          </button>
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

    <a-modal
      v-model:visible="filterVisible"
      :title="`字段筛选 · ${filterKey}`"
      :width="420"
      @ok="applyFieldFilter"
      @cancel="filterVisible = false"
    >
      <p class="filter-tip">字符型字段支持模糊匹配（不区分大小写）</p>
      <a-input
        v-model="filterDraft"
        allow-clear
        :placeholder="`输入 ${filterKey} 关键字`"
        @press-enter="applyFieldFilter"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconFilter } from '@arco-design/web-vue/es/icon'
import FuzzySuggestSelect from '@/components/FuzzySuggestSelect.vue'
import {
  dataQueryRangeOptions,
  getDataQuerySchemeOptions,
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
function rangeFromPreset(range: DataQueryRange): [string, string] {
  const end = new Date()
  end.setHours(23, 59, 59, 0)
  const start = new Date()
  if (range === 'today') start.setHours(0, 0, 0, 0)
  else if (range === 'd3') {
    start.setDate(start.getDate() - 3)
    start.setHours(0, 0, 0, 0)
  } else if (range === 'w1') {
    start.setDate(start.getDate() - 7)
    start.setHours(0, 0, 0, 0)
  } else if (range === 'm1') {
    start.setDate(start.getDate() - 30)
    start.setHours(0, 0, 0, 0)
  } else if (range === 'total') {
    start.setFullYear(start.getFullYear() - 5)
    start.setHours(0, 0, 0, 0)
  } else {
    start.setDate(start.getDate() - 30)
    start.setHours(0, 0, 0, 0)
  }
  return [formatDt(start), formatDt(end)]
}

const form = reactive({
  schemeId: '',
  schemeName: '',
})
const dateRange = ref<string[] | undefined>(undefined)
/** 与列表「接入数据量」时间窗对齐：优先用路由 range，避免仅靠日期推断偏差 */
const volumeRange = ref<DataQueryRange>('total')

const schemeOptions = computed(() => getDataQuerySchemeOptions('inbound'))

const loading = ref(false)
const rows = ref<DataQueryRow[]>([])
const fields = ref<DataQueryFieldMeta[]>([])
const fieldFilters = reactive<Record<string, string>>({})
const pagination = reactive({ current: 1, pageSize: 20, total: 0 })

const filterVisible = ref(false)
const filterKey = ref('')
const filterDraft = ref('')

const stringFields = computed(() => fields.value.filter((f) => f.dataType !== 'Int'))

const activeFieldFilterTips = computed(() =>
  Object.entries(fieldFilters)
    .filter(([, v]) => String(v || '').trim())
    .map(([key, value]) => ({ key, value: String(value).trim() })),
)

const tableColumns = computed(() => {
  const base = [
    { title: '方案名称', dataIndex: 'schemeName', width: 180, ellipsis: true, tooltip: true },
    { title: '机构', dataIndex: 'orgName', slotName: 'org', width: 150 },
    { title: '供数方', dataIndex: 'supplierName', width: 110, ellipsis: true, tooltip: true },
    { title: '接入时间', dataIndex: 'accessAt', width: 168 },
  ]
  const dynamic = fields.value.map((f) => {
    const isString = f.dataType !== 'Int'
    return {
      title: f.title,
      dataIndex: f.key,
      width: 140,
      ellipsis: true,
      tooltip: true,
      ...(isString ? { titleSlotName: `hdr_${f.key}` } : {}),
    }
  })
  return [...base, ...dynamic]
})

function onDateChange() {
  if (dateRange.value?.[0] && dateRange.value?.[1]) volumeRange.value = 'custom'
  else volumeRange.value = 'total'
}

function applyRouteQuery() {
  const q = route.query
  form.schemeId = ''
  form.schemeName = ''
  dateRange.value = undefined
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
  if (q.dateFrom && q.dateTo) {
    dateRange.value = [String(q.dateFrom), String(q.dateTo)]
    volumeRange.value = 'custom'
  } else {
    const range = String(q.range || '')
    if (rangeOptions.some((o) => o.value === range)) {
      volumeRange.value = range as DataQueryRange
      dateRange.value = rangeFromPreset(range as DataQueryRange)
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
      orgId: '',
      supplierId: '',
      schemeId: form.schemeId,
      schemeName: form.schemeId ? '' : form.schemeName,
      range: from && to ? volumeRange.value : 'total',
      dateFrom: from,
      dateTo: to,
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
  Object.keys(fieldFilters).forEach((k) => delete fieldFilters[k])
  dateRange.value = undefined
  volumeRange.value = 'total'
  filterEpoch.value += 1
  await nextTick()

  if (Object.keys(route.query).length) {
    await router.replace({ path: '/standard/access-data' })
    return
  }
  await fetchData(1)
}

function openFieldFilter(key: string) {
  filterKey.value = key
  filterDraft.value = fieldFilters[key] || ''
  filterVisible.value = true
}

function applyFieldFilter() {
  const key = filterKey.value
  const val = filterDraft.value.trim()
  if (val) fieldFilters[key] = val
  else delete fieldFilters[key]
  filterVisible.value = false
  fetchData(1)
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
.field-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.field-filter-bar__label {
  font-size: 12px;
  color: #86909c;
}
.col-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  color: inherit;
  font: inherit;
}
.col-filter-btn__icon {
  font-size: 12px;
  color: #c9cdd4;
}
.col-filter-btn__icon.is-on,
.col-filter-btn:hover .col-filter-btn__icon {
  color: var(--mt-primary, #165dff);
}
.filter-tip {
  margin: 0 0 12px;
  font-size: 12px;
  color: #86909c;
}
.org-cell {
  min-width: 0;
}
.cell-main {
  font-size: 13px;
  color: #1d2129;
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
