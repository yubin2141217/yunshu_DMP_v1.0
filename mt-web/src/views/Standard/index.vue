<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <h2 class="page-title">接入方案管理</h2>
        <p class="page-desc">
          配置方案名称、字段库（可选用字段模板快速创建）与接入方式，提交后生成接入文档，供机构端预览/下载并同步给各供数方。
        </p>
      </div>
      <a-button type="primary" @click="$router.push('/standard/edit')">新增方案</a-button>
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
          <a-tooltip content="已配置接入方案的机构数">
            <IconInfoCircle class="kpi-tip" />
          </a-tooltip>
        </span>
        <div class="kpi-value">{{ kpis.orgCount }}</div>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">
          供数方数量
          <a-tooltip content="已配置接入方案的供数方数量">
            <IconInfoCircle class="kpi-tip" />
          </a-tooltip>
        </span>
        <div class="kpi-value">{{ kpis.supplierCount }}</div>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">
          活跃方案
          <a-tooltip content="近 1 周累计接入数据量>10,000条或至少5天都有推送数据">
            <IconInfoCircle class="kpi-tip" />
          </a-tooltip>
        </span>
        <div class="kpi-value">{{ kpis.activeSchemeCount }}</div>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">
          活跃机构
          <a-tooltip content="近 1 周累计接入数据量>10,000条或至少5天都有推送数据">
            <IconInfoCircle class="kpi-tip" />
          </a-tooltip>
        </span>
        <div class="kpi-value">{{ kpis.activeOrgCount }}</div>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">
          活跃供数方
          <a-tooltip content="近 1 周累计接入数据量>10,000条或至少5天都有推送数据">
            <IconInfoCircle class="kpi-tip" />
          </a-tooltip>
        </span>
        <div class="kpi-value">{{ kpis.activeSupplierCount }}</div>
      </div>
    </div>

    <a-card class="content-card" :bordered="false">
      <div class="page-search">
        <FuzzySuggestSelect
          v-model="form.schemePickId"
          v-model:keyword="form.name"
          :options="schemeOptions"
          placeholder="方案"
          all-label="全部方案"
          width="200px"
        />
        <FuzzySuggestSelect
          v-model="form.orgId"
          v-model:keyword="form.orgName"
          :options="orgOptions"
          placeholder="机构"
          all-label="全部机构"
          width="180px"
        />
        <FuzzySuggestSelect
          v-model="form.supplierId"
          v-model:keyword="form.supplierName"
          :options="supplierOptions"
          placeholder="供数方"
          all-label="全部供数方"
          width="180px"
        />
        <a-select
          v-model="form.accessMethod"
          :options="accessMethodFilterOptions"
          allow-clear
          placeholder="接入方式"
          style="width: 180px"
        />
        <a-select v-model="form.status" :options="statusOptions" allow-clear placeholder="状态" style="width: 120px" />
        <a-button type="primary" @click="fetchData(1)">查询</a-button>
        <a-button @click="onReset">重置</a-button>
        <div class="page-search-actions">
          <a-button :loading="loading" @click="onRefresh">刷新</a-button>
        </div>
      </div>

      <a-table :columns="columns" :data="data" :loading="loading" row-key="id" :pagination="false" :bordered="false" stripe>
        <template #schemeNo="{ record }">
          <button type="button" class="id-copy" :title="'点击复制 ' + record.schemeNo" @click="copySchemeNo(record)">
            {{ record.schemeNo }}
          </button>
        </template>
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
        <template #supplier="{ record }">
          <button
            type="button"
            class="filter-cell filter-cell--inline"
            :disabled="!record.supplierId && !record.supplierName"
            title="点击填入供数方筛选"
            @click="filterBySupplier(record)"
          >
            {{ record.supplierName || '—' }}
          </button>
        </template>
        <template #accessMethod="{ record }">
          <button
            type="button"
            class="filter-cell filter-cell--inline"
            :disabled="!record.accessMethod"
            title="点击填入接入方式筛选"
            @click="filterByAccessMethod(record)"
          >
            {{ record.schemeName || accessMethodLabel(record.accessMethod) }}
          </button>
        </template>
        <template #accessVolumeTitle>
          <a-dropdown trigger="click" position="bl" :popup-max-height="false">
            <button type="button" class="vol-range-trigger" @click.stop>
              接入数据量（{{ volumeRangeLabel }}）
              <IconDown class="vol-range-trigger__icon" />
            </button>
            <template #content>
              <div class="vol-range-menu">
                <a-doption
                  v-for="opt in rangeOptions"
                  :key="opt.value"
                  :value="opt.value"
                  :class="{ 'is-active': volumeRange === opt.value }"
                  @click="onRangeChange(opt.value)"
                >
                  {{ opt.label }}
                </a-doption>
              </div>
            </template>
          </a-dropdown>
        </template>
        <template #accessVolume="{ record }">
          <button type="button" class="num-link" @click="goAccessDataQuery(record)">
            {{ formatVolume(record) }} 条
          </button>
        </template>
        <template #lastAccess="{ record }">
          <span class="last-access">{{ record.lastAccessAt || '—' }}</span>
        </template>
        <template #status="{ record }">
          <a-switch
            :model-value="record.status === 'enabled'"
            :checked-text="'启用'"
            :unchecked-text="'停用'"
            :loading="togglingId === record.id"
            @change="(v: boolean | string | number) => onStatusSwitch(record, !!v)"
          />
        </template>
        <template #operations="{ record }">
          <a-space class="arco-table-ops" :size="2">
            <a-button type="text" size="small" @click="$router.push('/standard/' + record.id)">详情</a-button>
            <a-button type="text" size="small" @click="openPreview(record)">预览文档</a-button>
            <a-button type="text" size="small" @click="$router.push('/standard/edit/' + record.id)">编辑</a-button>
            <a-button type="text" size="small" @click="onCopyCreate(record)">复制</a-button>
            <a-button type="text" status="danger" size="small" @click="onDelete(record)">删除</a-button>
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

    <a-modal
      v-model:visible="previewVisible"
      :title="previewTitle"
      :width="900"
      :footer="false"
      unmount-on-close
      modal-class="api-doc-modal"
    >
      <div class="doc-stage">
        <article class="doc-sheet">
          <pre class="doc-md">{{ previewMarkdown }}</pre>
        </article>
      </div>
      <div class="doc-actions">
        <a-space>
          <a-button :loading="downloading" @click="downloadDoc">下载 PDF</a-button>
          <a-button type="primary" @click="previewVisible = false">关闭</a-button>
        </a-space>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { IconDown, IconInfoCircle } from '@arco-design/web-vue/es/icon'
import FuzzySuggestSelect from '@/components/FuzzySuggestSelect.vue'
import {
  deleteStandard,
  getStandard,
  listStandards,
  toggleStandard,
} from '@/api/mt'
import {
  accessMethodLabel,
  accessMethodOptions,
  accessVolumeOf,
  accessVolumeRangeOptions,
  resolveStandardApiDoc,
  resolveStandardApiDocHtml,
  type AccessVolumeRange,
  type Standard,
  type Status,
} from '@/mock/mt'
import { downloadApiDocPdf } from '@/utils/downloadApiDocPdf'

const RANGE_STORAGE_KEY = 'yunshu-mt-standard-volume-range'
const rangeOptions = accessVolumeRangeOptions

const route = useRoute()
const router = useRouter()
const statusOptions = [
  { label: '开启', value: 'enabled' },
  { label: '停用', value: 'disabled' },
]
const accessMethodFilterOptions = accessMethodOptions.map((o) => ({
  label: o.label,
  value: o.value,
}))
const supplierOptions = ref<{ label: string; value: string }[]>([])
const orgOptions = ref<{ label: string; value: string }[]>([])
const schemeOptions = ref<{ label: string; value: string }[]>([])

const form = reactive({
  name: '',
  schemePickId: '',
  orgId: '',
  orgName: '',
  supplierId: '',
  supplierName: '',
  accessMethod: '',
  status: '',
})
const data = ref<Standard[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const kpis = reactive({
  total: 0,
  enabled: 0,
  disabled: 0,
  orgCount: 0,
  supplierCount: 0,
  activeSchemeCount: 0,
  activeOrgCount: 0,
  activeSupplierCount: 0,
})

function resolveDefaultRange(): AccessVolumeRange {
  return 'total'
}

const volumeRange = ref<AccessVolumeRange>(resolveDefaultRange())
const volumeRangeLabel = computed(
  () => rangeOptions.find((o) => o.value === volumeRange.value)?.label || '累计',
)

const previewVisible = ref(false)
const previewRecord = ref<Standard | null>(null)
const downloading = ref(false)
const togglingId = ref('')

const columns = computed(() => [
  { title: '方案 ID', dataIndex: 'schemeNo', slotName: 'schemeNo', width: 88 },
  { title: '方案名称', dataIndex: 'name', slotName: 'name', minWidth: 160 },
  { title: '机构', dataIndex: 'orgName', slotName: 'org', minWidth: 140 },
  { title: '供数方', dataIndex: 'supplierName', slotName: 'supplier', width: 100, ellipsis: true },
  { title: '接入方式', dataIndex: 'schemeName', slotName: 'accessMethod', width: 128, ellipsis: true },
  {
    title: '接入数据量',
    dataIndex: 'accessVolume',
    slotName: 'accessVolume',
    titleSlotName: 'accessVolumeTitle',
    width: 168,
  },
  { title: '最近接入', dataIndex: 'lastAccessAt', slotName: 'lastAccess', width: 148 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 88 },
  { title: '更新时间', dataIndex: 'updatedAt', width: 148 },
  { title: '操作', dataIndex: 'operations', slotName: 'operations', width: 280 },
])

const previewTitle = computed(() =>
  previewRecord.value ? `接口文档 · ${previewRecord.value.name}` : '接口文档预览',
)
const previewMarkdown = computed(() =>
  previewRecord.value ? resolveStandardApiDoc(previewRecord.value) : '暂无文档',
)

function orgSubText(record: Standard) {
  const unit = record.orgStatUnit || ''
  const sales = record.orgSalesName || ''
  if (!unit && !sales) return '—'
  if (unit && sales) return `${unit}·${sales}`
  return unit || sales
}

function formatVolume(record: Standard) {
  return accessVolumeOf(record.accessStats, volumeRange.value).toLocaleString()
}

function onRangeChange(val: AccessVolumeRange | string) {
  const next = String(val) as AccessVolumeRange
  if (!rangeOptions.some((o) => o.value === next)) return
  volumeRange.value = next
  sessionStorage.setItem(RANGE_STORAGE_KEY, next)
}

function applyKpis(raw?: Partial<typeof kpis>) {
  if (!raw) return
  kpis.total = raw.total || 0
  kpis.enabled = raw.enabled || 0
  kpis.disabled = raw.disabled ?? Math.max(0, kpis.total - kpis.enabled)
  kpis.orgCount = raw.orgCount || 0
  kpis.supplierCount = raw.supplierCount || 0
  kpis.activeSchemeCount = raw.activeSchemeCount || 0
  kpis.activeOrgCount = raw.activeOrgCount || 0
  kpis.activeSupplierCount = raw.activeSupplierCount || 0
}

function filterByStatus(status: '' | 'enabled' | 'disabled') {
  form.status = status
  fetchData(1)
}

function filterByScheme(record: Standard) {
  form.schemePickId = record.id
  form.name = record.name || ''
  fetchData(1)
}

function filterByOrg(record: Standard) {
  if (!record.orgId && !record.orgName) return
  form.orgId = record.orgId || ''
  form.orgName = record.orgName || ''
  fetchData(1)
}

function filterBySupplier(record: Standard) {
  if (!record.supplierId && !record.supplierName) return
  form.supplierId = record.supplierId || ''
  form.supplierName = record.supplierName || ''
  fetchData(1)
}

function filterByAccessMethod(record: Standard) {
  if (!record.accessMethod) return
  form.accessMethod = record.accessMethod
  fetchData(1)
}

async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const res = await listStandards({
      name: form.schemePickId ? '' : form.name,
      schemeId: form.schemePickId,
      orgId: form.orgId,
      orgName: form.orgName,
      supplierId: form.supplierId,
      supplierName: form.supplierName,
      accessMethod: form.accessMethod,
      status: form.status,
      page,
      pageSize: pagination.pageSize,
    })
    data.value = res.list
    pagination.current = page
    pagination.total = res.total
    if (res.suppliers?.length) supplierOptions.value = res.suppliers
    if (res.orgs?.length) orgOptions.value = res.orgs
    if (!schemeOptions.value.length) {
      const all = await listStandards({ name: '', status: '', page: 1, pageSize: 200 })
      schemeOptions.value = all.list.map((s) => ({
        label: `${s.name}（${s.schemeNo}）`,
        value: s.id,
      }))
    }
    applyKpis(res.kpis)
  } finally {
    loading.value = false
  }
}

function onPageSize(size: number) {
  pagination.pageSize = size
  fetchData(1)
}

function onReset() {
  form.name = ''
  form.schemePickId = ''
  form.orgId = ''
  form.orgName = ''
  form.supplierId = ''
  form.supplierName = ''
  form.accessMethod = ''
  form.status = ''
  fetchData(1)
}

function onRefresh() {
  fetchData(pagination.current)
}

async function copySchemeNo(record: Standard) {
  const text = String(record.schemeNo ?? '')
  try {
    await navigator.clipboard.writeText(text)
    Message.success('已复制方案 ID')
  } catch {
    Message.error('复制失败')
  }
}

function openPreview(record: Standard) {
  previewRecord.value = record
  previewVisible.value = true
}

async function downloadDoc() {
  if (!previewRecord.value) return
  downloading.value = true
  try {
    const html = resolveStandardApiDocHtml(previewRecord.value)
    const fileName = (previewRecord.value.fileName || `${previewRecord.value.name}-接口文档`).replace(/\.md$/i, '.pdf')
    await downloadApiDocPdf(html, fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`)
    Message.success('已开始下载 PDF')
  } catch (e) {
    Message.error((e as Error).message || 'PDF 下载失败')
  } finally {
    downloading.value = false
  }
}

function onCopyCreate(record: Standard) {
  router.push({ path: '/standard/edit', query: { copyFrom: record.id } })
}

async function applyToggle(record: Standard, next: Status) {
  togglingId.value = record.id
  const prev = record.status
  record.status = next
  try {
    await toggleStandard(record.id, next)
    Message.success(next === 'enabled' ? '已启用' : '已停用')
    await fetchData(pagination.current)
  } catch (e) {
    record.status = prev
    Message.error((e as Error).message || '操作失败')
  } finally {
    togglingId.value = ''
  }
}

function onStatusSwitch(record: Standard, enabled: boolean) {
  const next: Status = enabled ? 'enabled' : 'disabled'
  if (next === record.status) return
  if (next === 'disabled') {
    Modal.confirm({
      title: '停用方案',
      content: `确定停用「${record.name}」？`,
      onOk: () => applyToggle(record, next),
    })
    return
  }
  void applyToggle(record, next)
}

function goAccessDataQuery(record: Standard) {
  router.push({
    path: '/standard/access-data',
    query: {
      schemeId: record.id,
      schemeName: record.name,
      orgId: record.orgId || '',
      supplierId: record.supplierId || '',
      range: volumeRange.value,
    },
  })
}

function onDelete(record: Standard) {
  Modal.confirm({
    title: '删除接入方案',
    content: `确定删除「${record.name}」？`,
    async onOk() {
      await deleteStandard(record.id)
      Message.success('已删除')
      fetchData(1)
    },
  })
}

onMounted(async () => {
  await fetchData(1)
  const previewId = String(route.query.preview || '')
  if (previewId) {
    const item = await getStandard(previewId)
    if (item) openPreview(item)
    router.replace({ path: '/standard' })
  }
})
</script>

<style scoped>
.kpi-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}
.kpi-card {
  padding: 14px 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e6eb;
  box-shadow: var(--mt-card-shadow, 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06));
}
.kpi-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #86909c;
  margin-bottom: 6px;
}
.kpi-tip {
  font-size: 14px;
  color: #c9cdd4;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1d2129;
  font-size: 13px;
  line-height: 1.45;
}
.id-copy {
  border: none;
  background: transparent;
  padding: 0;
  color: var(--mt-primary, #165dff);
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
}
.id-copy:hover {
  text-decoration: underline;
}
.vol-range-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;
  color: inherit;
  font: inherit;
  white-space: nowrap;
  line-height: 1.4;
}
.vol-range-trigger:hover {
  color: var(--mt-primary, #165dff);
}
.vol-range-trigger__icon {
  font-size: 12px;
  color: #86909c;
}
.vol-range-menu {
  min-width: 112px;
  padding: 4px 0;
}
.vol-range-menu :deep(.arco-dropdown-option.is-active) {
  color: var(--mt-primary, #165dff);
  font-weight: 600;
  background: var(--color-fill-2, #f2f3f5);
}
.num-link {
  border: none;
  background: transparent;
  padding: 0;
  color: var(--mt-primary, #165dff);
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}
.num-link:hover {
  text-decoration: underline;
}
.last-access {
  font-size: 12px;
  color: #4e5969;
  font-variant-numeric: tabular-nums;
}
.doc-stage {
  max-height: min(64vh, 680px);
  overflow: auto;
  padding: 16px 20px;
  background: #f2f3f5;
}
.doc-sheet {
  max-width: 820px;
  margin: 0 auto;
  padding: 28px 32px;
  background: #fff;
  border: 1px solid #e5e6eb;
  box-shadow: 0 8px 24px rgba(29, 33, 41, 0.06);
}
.doc-md {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.65;
  color: #1d2129;
}
.doc-actions {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid #e5e6eb;
  background: #fff;
}
@media (max-width: 1280px) {
  .kpi-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 720px) {
  .kpi-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

<style>
.api-doc-modal .arco-modal-body {
  padding: 0 !important;
}
</style>
