<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <h2 class="page-title">推送方案管理</h2>
        <p class="page-desc">配置数据范围与推送方式，方案可直接启停，并查看推送数据量统计。</p>
      </div>
      <a-button type="primary" @click="$router.push('/push/schemes/edit')">新增方案</a-button>
    </div>

    <div class="kpi-row">
      <div class="kpi-card kpi-card--scheme">
        <span class="kpi-label">方案总数</span>
        <button type="button" class="kpi-value kpi-value--btn" @click="filterByStatus('')" title="查看全部方案">
          {{ kpis.total }}
        </button>
        <div class="kpi-scheme-break">
          <button type="button" class="kpi-chip kpi-chip--enabled" @click="filterByStatus('enabled')">
            <i class="kpi-chip__dot" aria-hidden="true" />
            <span class="kpi-chip__label">启用</span>
            <span class="kpi-chip__num">{{ kpis.enabled }}</span>
          </button>
          <button type="button" class="kpi-chip kpi-chip--disabled" @click="filterByStatus('disabled')">
            <i class="kpi-chip__dot" aria-hidden="true" />
            <span class="kpi-chip__label">停用</span>
            <span class="kpi-chip__num">{{ kpis.disabled }}</span>
          </button>
        </div>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">
          机构数量
          <a-tooltip content="已配置推送方案的机构去重数">
            <IconInfoCircle class="kpi-tip" />
          </a-tooltip>
        </span>
        <div class="kpi-value">{{ kpis.orgCount }}</div>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">累计成功推送</span>
        <div class="kpi-value">{{ kpis.successTotal.toLocaleString() }}</div>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">
          推送成功率
          <a-tooltip content="成功 / (成功 + 失败)；无推送流量时显示「—」">
            <IconInfoCircle class="kpi-tip" />
          </a-tooltip>
        </span>
        <div class="kpi-value">{{ kpis.successRate == null ? '—' : `${kpis.successRate}%` }}</div>
      </div>
    </div>

    <a-card class="content-card" :bordered="false">
      <div class="page-search">
        <FuzzySuggestSelect
          v-model="query.schemeId"
          v-model:keyword="query.schemeName"
          :options="schemeOptions"
          placeholder="方案"
          all-label="全部方案"
          width="200px"
        />
        <FuzzySuggestSelect
          v-model="query.orgId"
          v-model:keyword="query.orgName"
          :options="orgOptions"
          placeholder="机构"
          all-label="全部机构"
          width="180px"
        />
        <a-select
          v-model="query.channelType"
          :options="channelFilterOpts"
          allow-clear
          placeholder="通道类型"
          style="width: 140px"
        />
        <a-select
          v-model="query.pushMode"
          :options="modeOpts"
          allow-clear
          placeholder="推送模式"
          style="width: 120px"
        />
        <a-select
          v-model="query.status"
          :options="statusOpts"
          allow-clear
          placeholder="状态"
          style="width: 110px"
        />
        <a-button type="primary" @click="fetchData(1)">查询</a-button>
        <a-button @click="onReset">重置</a-button>
        <div class="page-search-actions">
          <a-button :loading="loading" @click="fetchData(pagination.current)">刷新</a-button>
        </div>
      </div>
      <a-table
        :columns="columns"
        :data="data"
        :loading="loading"
        row-key="id"
        :pagination="false"
        :bordered="false"
        stripe
      >
        <template #name="{ record }">
          <button type="button" class="filter-cell" title="点击填入方案筛选" @click="filterByScheme(record)">
            <div class="cell-main">{{ record.name }}</div>
            <div class="cell-sub" :title="record.remark || ''">{{ record.remark || '—' }}</div>
          </button>
        </template>
        <template #org="{ record }">
          <button
            type="button"
            class="filter-cell"
            :disabled="!record.orgId && !record.orgName"
            title="点击填入机构筛选"
            @click="filterByOrg(record)"
          >
            <div class="cell-main">{{ record.orgName || '—' }}</div>
            <div class="cell-sub" :title="orgSubText(record)">{{ orgSubText(record) }}</div>
          </button>
        </template>
        <template #scope="{ record }">
          <span class="scope-text">{{ dataScopeSummary(record) }}</span>
        </template>
        <template #channelType="{ record }">
          <button
            type="button"
            class="filter-cell filter-cell--inline"
            title="点击填入通道类型筛选"
            @click="filterByChannel(record)"
          >
            {{ channelLabel(record.channelType) }}
          </button>
        </template>
        <template #pushMode="{ record }">
          <button
            type="button"
            class="filter-cell filter-cell--inline"
            title="点击填入推送模式筛选"
            @click="filterByMode(record)"
          >
            {{ pushModeLabel(record.pushMode) }}
          </button>
        </template>
        <template #success="{ record }">
          <button type="button" class="num-link" title="查看该方案成功推送明细" @click="goPushData(record, 'success')">
            {{ (record.stats?.successTotal || 0).toLocaleString() }}
          </button>
        </template>
        <template #fail="{ record }">
          <button type="button" class="num-fail-link" title="查看该方案失败推送明细" @click="goPushData(record, 'fail')">
            {{ (record.stats?.failTotal || 0).toLocaleString() }}
          </button>
        </template>
        <template #status="{ record }">
          <button
            type="button"
            class="filter-cell filter-cell--inline"
            title="点击填入状态筛选"
            @click="filterByStatus(record.status)"
          >
            <a-tag size="small" :color="record.status === 'enabled' ? 'green' : 'orangered'">
              {{ record.status === 'enabled' ? '启用' : '停用' }}
            </a-tag>
          </button>
        </template>
        <template #operations="{ record }">
          <a-space class="arco-table-ops" :size="2">
            <a-button type="text" size="small" @click="$router.push('/push/schemes/' + record.id)">详情</a-button>
            <a-button type="text" size="small" @click="$router.push('/push/schemes/edit/' + record.id)">编辑</a-button>
            <a-button
              type="text"
              size="small"
              @click="$router.push({ path: '/push/schemes/edit', query: { copyFrom: record.id } })"
            >
              复制
            </a-button>
            <a-button type="text" size="small" @click="onToggle(record)">
              {{ record.status === 'enabled' ? '停用' : '启用' }}
            </a-button>
          </a-space>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { IconInfoCircle } from '@arco-design/web-vue/es/icon'
import FuzzySuggestSelect from '@/components/FuzzySuggestSelect.vue'
import { listStandards } from '@/api/mt'
import {
  channelLabel,
  dataScopeSummary,
  getPushSchemeKpis,
  listPushReceivers,
  listPushSchemes,
  pushChannelOptions,
  pushModeLabel,
  togglePushScheme,
  type PushScheme,
  type PushStatus,
} from '@/api/push'
import { formatOrgSub } from '@/utils/orgDisplay'

const router = useRouter()

const query = reactive({
  schemeId: '',
  schemeName: '',
  orgId: '',
  orgName: '',
  channelType: undefined as string | undefined,
  pushMode: undefined as string | undefined,
  status: undefined as string | undefined,
})
const data = ref<PushScheme[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const kpis = reactive({
  total: 0,
  enabled: 0,
  disabled: 0,
  orgCount: 0,
  successTotal: 0,
  successRate: null as number | null,
})
const orgOptions = ref<{ label: string; value: string }[]>([])
const schemeOptions = ref<{ label: string; value: string }[]>([])

const channelFilterOpts = [...pushChannelOptions]
const modeOpts = [
  { label: '增量', value: 'incremental' },
  { label: '全量', value: 'full' },
]
const statusOpts = [
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
]

const columns = [
  { title: '方案名称', dataIndex: 'name', slotName: 'name', ellipsis: true, tooltip: true, width: 160 },
  { title: '机构', dataIndex: 'orgName', slotName: 'org', width: 150 },
  { title: '数据范围', dataIndex: 'scope', slotName: 'scope', ellipsis: true, tooltip: true },
  { title: '通道', dataIndex: 'channelType', slotName: 'channelType', width: 160 },
  { title: '模式', dataIndex: 'pushMode', slotName: 'pushMode', width: 80 },
  { title: '成功量', dataIndex: 'success', slotName: 'success', width: 88 },
  { title: '失败量', dataIndex: 'fail', slotName: 'fail', width: 80 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80 },
  { title: '操作', dataIndex: 'operations', slotName: 'operations', width: 200 },
]

function orgSubText(record: PushScheme) {
  return formatOrgSub(record.orgStatUnit, record.orgSalesName)
}

async function refreshKpis() {
  const next = await getPushSchemeKpis()
  kpis.total = next.total || 0
  kpis.enabled = next.enabled || 0
  kpis.disabled = next.disabled ?? Math.max(0, kpis.total - kpis.enabled)
  kpis.orgCount = next.orgCount || 0
  kpis.successTotal = next.successTotal || 0
  kpis.successRate = next.successRate ?? null
}

async function loadFilterOptions() {
  const [stRes, recvRes] = await Promise.all([
    listStandards({ name: '', status: '', page: 1, pageSize: 1 }),
    listPushReceivers({ page: 1, pageSize: 200 }),
  ])
  const map = new Map<string, string>()
  ;(stRes.orgs || []).forEach((o) => map.set(o.value, o.label))
  ;(recvRes.list || []).forEach((r) => map.set(r.id, r.name))
  orgOptions.value = Array.from(map.entries()).map(([value, label]) => ({ value, label }))
}

function filterByStatus(status: '' | 'enabled' | 'disabled') {
  query.status = status || undefined
  fetchData(1)
}

function filterByScheme(record: PushScheme) {
  query.schemeId = record.id
  query.schemeName = record.name
  fetchData(1)
}

function filterByOrg(record: PushScheme) {
  if (!record.orgId && !record.orgName) return
  query.orgId = record.orgId || ''
  query.orgName = record.orgName || ''
  fetchData(1)
}

function filterByChannel(record: PushScheme) {
  query.channelType = record.channelType
  fetchData(1)
}

function filterByMode(record: PushScheme) {
  query.pushMode = record.pushMode
  fetchData(1)
}

function goPushData(record: PushScheme, result: 'success' | 'fail') {
  router.push({
    path: '/push/push-data',
    query: {
      schemeId: record.id,
      schemeName: record.name,
      pushResult: result,
    },
  })
}

async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const res = await listPushSchemes({
      schemeId: query.schemeId || undefined,
      schemeName: query.schemeId ? undefined : query.schemeName || undefined,
      orgId: query.orgId || undefined,
      orgName: query.orgId ? undefined : query.orgName || undefined,
      channelType: query.channelType,
      pushMode: query.pushMode,
      status: query.status,
      page,
      pageSize: pagination.pageSize,
    })
    data.value = res.list
    pagination.current = page
    pagination.total = res.total
    if (!schemeOptions.value.length) {
      schemeOptions.value = (await listPushSchemes({ page: 1, pageSize: 200 })).list.map((s) => ({
        label: s.name,
        value: s.id,
      }))
    }
    await refreshKpis()
  } finally {
    loading.value = false
  }
}

function onPageSize(size: number) {
  pagination.pageSize = size
  fetchData(1)
}
function onReset() {
  query.schemeId = ''
  query.schemeName = ''
  query.orgId = ''
  query.orgName = ''
  query.channelType = undefined
  query.pushMode = undefined
  query.status = undefined
  fetchData(1)
}

function onToggle(record: PushScheme) {
  const next: PushStatus = record.status === 'enabled' ? 'disabled' : 'enabled'
  const tip =
    next === 'disabled'
      ? `停用「${record.name}」后将停止调度推送，历史统计保留。确定停用？`
      : `确定启用「${record.name}」？`
  Modal.confirm({
    title: next === 'disabled' ? '停用方案' : '启用方案',
    content: tip,
    onOk: async () => {
      try {
        await togglePushScheme(record.id, next)
        Message.success(next === 'enabled' ? '已启用' : '已停用')
        await fetchData()
      } catch (e) {
        Message.error(e instanceof Error ? e.message : '操作失败')
      }
    },
  })
}

onMounted(async () => {
  await loadFilterOptions()
  await fetchData(1)
})
</script>

<style scoped>
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.kpi-card {
  padding: 16px 18px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e6eb;
  box-shadow: var(--mt-card-shadow, 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06));
}
.kpi-card--scheme {
  min-height: 108px;
}
.kpi-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #86909c;
  margin-bottom: 8px;
}
.kpi-tip {
  color: #c9cdd4;
  font-size: 14px;
  cursor: help;
  vertical-align: -2px;
}
.kpi-tip:hover {
  color: var(--mt-primary, #165dff);
}
.kpi-value {
  font-size: 22px;
  font-weight: 700;
  color: #1d2129;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.kpi-value--btn {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
  font-size: 26px;
  font-weight: 700;
  color: #1d2129;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}
.kpi-value--btn:hover {
  color: var(--mt-primary, #165dff);
}
.kpi-scheme-break {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.kpi-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.4;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.kpi-chip__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.kpi-chip__label {
  color: #86909c;
}
.kpi-chip__num {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.kpi-chip--enabled {
  background: #e8ffea;
  border-color: #b7f0bf;
}
.kpi-chip--enabled .kpi-chip__dot {
  background: #00b42a;
}
.kpi-chip--enabled .kpi-chip__num {
  color: #00b42a;
}
.kpi-chip--enabled:hover {
  background: #d8f7dc;
}
.kpi-chip--disabled {
  background: #f2f3f5;
  border-color: #e5e6eb;
}
.kpi-chip--disabled .kpi-chip__dot {
  background: #86909c;
}
.kpi-chip--disabled .kpi-chip__num {
  color: #4e5969;
}
.kpi-chip--disabled:hover {
  background: #e5e6eb;
}
.scope-text {
  color: #4e5969;
  font-size: 12px;
}
.num-link {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--mt-primary, #165dff);
  font: inherit;
  font-variant-numeric: tabular-nums;
}
.num-link:hover {
  text-decoration: underline;
}
.num-fail-link {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #f53f3f;
  font: inherit;
  font-variant-numeric: tabular-nums;
}
.num-fail-link:hover {
  text-decoration: underline;
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
.filter-cell {
  display: block;
  width: 100%;
  max-width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
}
.filter-cell:disabled {
  cursor: default;
}
.filter-cell:not(:disabled):hover .cell-main,
.filter-cell--inline:not(:disabled):hover {
  color: var(--mt-primary, #165dff);
}
.filter-cell--inline {
  display: inline-flex;
  align-items: center;
}
.num-fail {
  color: #f53f3f;
  font-variant-numeric: tabular-nums;
}
@media (max-width: 1100px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
