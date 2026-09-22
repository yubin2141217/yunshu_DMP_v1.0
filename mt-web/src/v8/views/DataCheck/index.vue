<template>
  <div class="workplace-page">
    <div class="workplace-header">
      <div>
        <h2 class="workplace-title">接入数据对账</h2>
        <p class="workplace-desc">按时间范围、供数方等维度筛选对账数据接入总量与明细情况。</p>
      </div>
    </div>

    <!-- 上半区：聚合对账指标，时间范围与供方筛选仅驱动本区 -->
    <a-card class="content-card" :bordered="false" :loading="aggLoading">
      <template #title>
        <span class="recon-section-title">对账总览</span>
      </template>
      <div class="v8-filter-grid recon-agg-filter" :class="{ 'is-custom': aggForm.range === 'custom' }">
        <div class="v8-filter-item">
          <label>时间范围</label>
          <a-radio-group v-model="aggForm.range" type="button" @change="onAggRangeChange">
            <a-radio value="today">今日</a-radio>
            <a-radio value="3d">近3天</a-radio>
            <a-radio value="1w">近1周</a-radio>
            <a-radio value="1m">近1月</a-radio>
            <a-radio value="custom">自定义</a-radio>
          </a-radio-group>
        </div>
        <div v-if="aggForm.range === 'custom'" class="v8-filter-item">
          <label>
            自定义区间
            <a-tooltip content="最早支持查询 1 年内的数据，单次时间跨度最大支持 1 个月，且结束日期不可晚于今天" mini>
              <IconExclamationCircle class="v8-date-info" />
            </a-tooltip>
          </label>
          <a-range-picker
            v-model="customRange"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledCustomDate"
            @select="onCustomSelect"
            @popup-visible-change="onCustomPopupToggle"
            @change="onCustomRangeChange"
          />
        </div>
        <div class="v8-filter-item recon-supplier">
          <label>供数方</label>
          <a-select v-model="aggForm.supplierIds" placeholder="全部供数方" multiple allow-clear :max-tag-count="2">
            <a-option v-for="o in supplierOpts" :key="o.value" :value="o.value" :label="o.label" />
          </a-select>
        </div>
        <div class="v8-filter-actions">
          <a-button type="primary" @click="fetchAgg()">查询</a-button>
          <a-button @click="resetAgg">重置</a-button>
        </div>
      </div>

      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :lg="6">
          <div class="v8-stat-box">
            <div class="v8-stat-label">
              请求总量
              <a-tooltip content="所选时间范围内，供数方推送到云数中台的数据请求总条数（单位：条）" mini>
                <IconExclamationCircle class="v8-stat-info" />
              </a-tooltip>
            </div>
            <div class="v8-stat-num">{{ num(summary.total) }}<span class="v8-stat-unit">条</span></div>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <div class="v8-stat-box">
            <div class="v8-stat-label">
              成功入库
              <a-tooltip content="通过全部校验并成功入库的数据条数（单位：条）" mini>
                <IconExclamationCircle class="v8-stat-info" />
              </a-tooltip>
            </div>
            <div class="v8-stat-num v8-text-ok">{{ num(summary.success) }}<span class="v8-stat-unit">条</span></div>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <div ref="rejectStatRef" class="v8-stat-box" :class="{ 'v8-stat-highlight': rejectDrill }">
            <div class="v8-stat-label">
              拒收数量
              <a-tooltip content="未通过校验（如 AppKey 无效、IP 不在白名单等）被拒收的数据条数（单位：条）" mini>
                <IconExclamationCircle class="v8-stat-info" />
              </a-tooltip>
            </div>
            <div class="v8-stat-num v8-text-bad">{{ num(summary.reject) }}<span class="v8-stat-unit">条</span></div>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <div class="v8-stat-box">
            <div class="v8-stat-label">
              拒收率
              <a-tooltip content="拒收数量 ÷ 请求总量 × 100%；超过 5% 将以橙色预警提示（单位：%）" mini>
                <IconExclamationCircle class="v8-stat-info" />
              </a-tooltip>
            </div>
            <div class="v8-stat-num" :class="summary.rejectRate > 5 ? 'v8-text-warn' : ''">{{ summary.rejectRate }}<span class="v8-stat-unit">%</span></div>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <!-- 下半区：入库条目明细，筛选条件独立，仅驱动本区分页列表 -->
    <a-card class="content-card recon-detail-card" :bordered="false">
      <template #title>
        <span class="recon-section-title">入库条目明细</span>
      </template>
      <div class="v8-filter-grid">
        <div class="v8-filter-item">
          <label>标题</label>
          <a-input v-model="query.keyword" placeholder="请输入标题" allow-clear @press-enter="fetchDetail(1)" />
        </div>
        <div class="v8-filter-item">
          <label>供数方</label>
          <a-select v-model="query.supplierId" placeholder="全部供数方" allow-clear>
            <a-option v-for="o in supplierOpts" :key="o.value" :value="o.value" :label="o.label" />
          </a-select>
        </div>
        <div class="v8-filter-item">
          <label>作者</label>
          <a-input v-model="query.authorName" placeholder="作者/来源署名" allow-clear @press-enter="fetchDetail(1)" />
        </div>
        <div class="v8-filter-item">
          <label>
            发布时间
            <a-tooltip content="时间跨度最大支持1个月，且结束日期不可晚于今天" mini>
              <IconExclamationCircle class="v8-date-info" />
            </a-tooltip>
          </label>
          <a-range-picker
            v-model="publishRange"
            style="width: 100%"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledPublishDate"
            @select="onPublishSelect"
            @popup-visible-change="onPublishPopupToggle"
            @change="onPublishChange"
          />
        </div>
        <div class="v8-filter-item">
          <label>
            入库时间
            <a-tooltip content="最早支持1年内数据查询，时间跨度最大支持1个月，且结束日期不可晚于今天" mini>
              <IconExclamationCircle class="v8-date-info" />
            </a-tooltip>
          </label>
          <a-range-picker
            v-model="inboundRange"
            style="width: 100%"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledInboundDate"
            @select="onInboundSelect"
            @popup-visible-change="onInboundPopupToggle"
            @change="onInboundChange"
          />
        </div>
        <div class="v8-filter-actions">
          <a-button type="primary" @click="fetchDetail(1)">查询</a-button>
          <a-button @click="resetDetail">重置</a-button>
        </div>
      </div>

      <a-table
        :columns="columns"
        :data="data"
        :loading="detailLoading"
        row-key="id"
        :pagination="false"
        :bordered="false"
        stripe
      >
        <template #title="{ record }">
          <a-link class="v8-entry-title" @click="openDetail(record as DataEntry)">{{ record.title }}</a-link>
        </template>
        <template #supplierName="{ record }">
          <a-link class="v8-supplier-link" @click="openSupplier(record as DataEntry)">
            {{ (record as DataEntry).supplierName }}
          </a-link>
        </template>
        <template #authorName="{ record }">
          <div class="v8-author">
            <a-avatar :size="30" class="v8-author-avatar">
              {{ avatarText((record as DataEntry).authorName) }}
            </a-avatar>
            <div class="v8-author-meta">
              <span class="v8-author-name">{{ (record as DataEntry).authorName }}</span>
              <span class="v8-author-platform">{{ (record as DataEntry).sourceSite }}</span>
            </div>
          </div>
        </template>
        <template #sourceUrl="{ record }">
          <a-link class="v8-url-cell" @click="openUrl((record as DataEntry).sourceUrl)">
            {{ (record as DataEntry).sourceUrl }}
          </a-link>
        </template>
        <template #empty>
          <a-empty description="暂无符合条件的入库条目" />
        </template>
      </a-table>

      <div class="table-footer">
        <a-pagination
          class="table-footer-right"
          v-model:current="pagination.current"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          show-total
          show-page-size
          show-jumper
          @change="fetchDetail"
          @page-size-change="onDetailPageSize"
        />
      </div>
    </a-card>

    <!-- 条目详情抽屉：仅索引信息 -->
    <a-drawer
      :visible="detailVisible"
      :width="520"
      :footer="false"
      :mask-closable="true"
      @cancel="detailVisible = false"
    >
      <template #title>条目索引详情</template>
      <template v-if="current">
        <a-alert type="info" class="v8-index-note">
          机构端仅展示索引信息，舆情正文不下发；如需查看原文，请通过来源链接前往外部站点。
        </a-alert>
        <a-descriptions :column="1" bordered size="large" class="v8-detail-desc">
          <a-descriptions-item label="标题">{{ current.title }}</a-descriptions-item>
          <a-descriptions-item label="供数方">
            <a-link class="v8-supplier-link" @click="openSupplier(current)">{{ current.supplierName }}</a-link>
          </a-descriptions-item>
          <a-descriptions-item label="作者/署名">{{ current.authorName }}</a-descriptions-item>
          <a-descriptions-item label="来源平台">{{ current.sourceSite }}</a-descriptions-item>
          <a-descriptions-item label="发布时间">{{ current.publishedAt }}</a-descriptions-item>
          <a-descriptions-item label="入库时间">{{ current.inboundAt }}</a-descriptions-item>
          <a-descriptions-item label="来源 URL">
            <a-link class="v8-url-detail" @click="openUrl(current.sourceUrl)">{{ current.sourceUrl }}</a-link>
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </a-drawer>

    <!-- 供数方详情抽屉 -->
    <a-drawer
      :visible="supplierVisible"
      :width="480"
      :footer="false"
      :mask-closable="true"
      @cancel="supplierVisible = false"
    >
      <template #title>供数方详情</template>
      <template v-if="currentSupplier">
        <a-descriptions :column="1" bordered size="large">
          <a-descriptions-item label="供数方名称">{{ currentSupplier.name }}</a-descriptions-item>
          <a-descriptions-item label="供数方编码">{{ currentSupplier.code }}</a-descriptions-item>
          <a-descriptions-item label="接入状态">
            <a-tag :color="currentSupplier.status === 'enabled' ? 'green' : 'gray'" size="small">
              {{ currentSupplier.status === 'enabled' ? '启用' : '停用' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="健康状态">
            <a-badge
              :status="healthBadge(currentSupplier.health).status"
              :text="healthBadge(currentSupplier.health).label"
            />
          </a-descriptions-item>
          <a-descriptions-item label="今日入库量">{{ currentSupplier.todayCount }} 条</a-descriptions-item>
          <a-descriptions-item label="今日拒收率">{{ currentSupplier.todayRejectRate }}%</a-descriptions-item>
          <a-descriptions-item label="最近推送时间">{{ currentSupplier.lastPushAt }}</a-descriptions-item>
          <a-descriptions-item label="信息更新时间">{{ currentSupplier.updatedAt }}</a-descriptions-item>
        </a-descriptions>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconExclamationCircle } from '@arco-design/web-vue/es/icon'
import {
  getDataEntries,
  getStatsSummary,
  getAllSuppliers,
  supplierOptions,
} from '@/v8/api/data'
import {
  healthMeta,
  type DataEntry,
  type Health,
  type StatsQuery,
  type StatsSummary,
  type Supplier,
} from '@/v8/mock/types'

const route = useRoute()

const supplierOpts = ref<{ label: string; value: string }[]>([])

// ── 上半区：聚合对账 ─────────────────────────────────────────
const aggLoading = ref(false)
const customRange = ref<string[]>([])
const summary = ref<StatsSummary>({ total: 0, success: 0, reject: 0, rejectRate: 0 })

/** 概览「拒收」下钻：高亮拒收指标卡并定位 */
const rejectDrill = ref(false)
const rejectStatRef = ref<HTMLElement | null>(null)

const aggForm = reactive<StatsQuery>({
  range: 'today',
  start: '',
  end: '',
  supplierIds: [],
  result: 'all',
})

function num(n: number) {
  return Number(n || 0).toLocaleString('zh-CN')
}

function buildAggQuery(): StatsQuery {
  return {
    range: aggForm.range,
    start: aggForm.range === 'custom' ? customRange.value?.[0] || '' : '',
    end: aggForm.range === 'custom' ? customRange.value?.[1] || '' : '',
    supplierIds: aggForm.supplierIds,
    result: 'all',
  }
}

function onAggRangeChange() {
  fetchAgg()
}

async function fetchAgg() {
  aggLoading.value = true
  try {
    summary.value = await getStatsSummary(buildAggQuery())
  } finally {
    aggLoading.value = false
  }
}

function resetAgg() {
  aggForm.range = 'today'
  aggForm.supplierIds = []
  customRange.value = []
  rejectDrill.value = false
  fetchAgg()
}

// ── 下半区：入库条目明细 ─────────────────────────────────────
const data = ref<DataEntry[]>([])
const detailLoading = ref(false)
const publishRange = ref<string[]>([])
const inboundRange = ref<string[]>([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })

const query = reactive({
  keyword: '',
  supplierId: '',
  authorName: '',
  publishStart: '',
  publishEnd: '',
  inboundStart: '',
  inboundEnd: '',
})

// ── 明细日期范围限制：跨度≤1个月、不可选未来；入库时间最早1年内 ──
const ONE_MONTH = 1
function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
/** 自然月加减，处理月末溢出（如 1/31 + 1 月回退到 2 月末） */
function addMonths(base: Date, delta: number) {
  const d = new Date(base)
  const day = d.getDate()
  d.setMonth(d.getMonth() + delta)
  if (d.getDate() < day) d.setDate(0)
  return startOfDay(d)
}
function todayStart() {
  return startOfDay(new Date())
}
function oneYearAgoStart() {
  const t = todayStart()
  t.setFullYear(t.getFullYear() - 1)
  return t
}

// ── 明细「发布时间」：最晚今天、跨度 ≤1 个月（不限最早时间） ──
const publishPickedStart = ref<Date | null>(null)
function disabledPublishDate(current: Date, type: 'start' | 'end') {
  const day = startOfDay(current)
  if (day.getTime() > todayStart().getTime()) return true
  if (type === 'end' && publishPickedStart.value) {
    if (
      day.getTime() < publishPickedStart.value.getTime() ||
      day.getTime() > addMonths(publishPickedStart.value, ONE_MONTH).getTime()
    ) {
      return true
    }
  }
  return false
}
function onPublishSelect(_v: unknown, date: unknown) {
  const arr = Array.isArray(date) ? (date as (Date | undefined)[]) : []
  publishPickedStart.value = arr[0] && !arr[1] ? startOfDay(arr[0]) : null
}
function onPublishPopupToggle(visible: boolean) {
  if (!visible) publishPickedStart.value = null
}

// ── 明细「入库时间」：最早 1 年前、最晚今天、跨度 ≤1 个月 ──
const inboundPickedStart = ref<Date | null>(null)
function disabledInboundDate(current: Date, type: 'start' | 'end') {
  const day = startOfDay(current)
  if (day.getTime() < oneYearAgoStart().getTime() || day.getTime() > todayStart().getTime()) {
    return true
  }
  if (type === 'end' && inboundPickedStart.value) {
    if (
      day.getTime() < inboundPickedStart.value.getTime() ||
      day.getTime() > addMonths(inboundPickedStart.value, ONE_MONTH).getTime()
    ) {
      return true
    }
  }
  return false
}
function onInboundSelect(_v: unknown, date: unknown) {
  const arr = Array.isArray(date) ? (date as (Date | undefined)[]) : []
  inboundPickedStart.value = arr[0] && !arr[1] ? startOfDay(arr[0]) : null
}
function onInboundPopupToggle(visible: boolean) {
  if (!visible) inboundPickedStart.value = null
}

/** 校验一段日期范围是否合规，违规时提示并返回 false */
function checkRange(label: string, range: string[], withOneYear: boolean) {
  const [s, e] = range || []
  if (!s || !e) return true
  const start = startOfDay(new Date(s))
  const end = startOfDay(new Date(e))
  if (withOneYear && start.getTime() < oneYearAgoStart().getTime()) {
    Message.warning(`${label}最早仅支持查询 1 年内的数据`)
    return false
  }
  if (end.getTime() > todayStart().getTime()) {
    Message.warning(`${label}结束日期不能晚于今天`)
    return false
  }
  if (end.getTime() > addMonths(start, ONE_MONTH).getTime()) {
    Message.warning(`${label}时间跨度最大支持 1 个月`)
    return false
  }
  return true
}

/** 选择/输入完成即校验（Arco change 第三参为格式化后的字符串区间） */
function onPublishChange(_v: unknown, _d: unknown, dateString?: (string | undefined)[]) {
  publishPickedStart.value = null
  const range = (dateString || []).map((x) => x || '')
  if (!checkRange('发布时间', range, false)) publishRange.value = []
}
function onInboundChange(_v: unknown, _d: unknown, dateString?: (string | undefined)[]) {
  inboundPickedStart.value = null
  const range = (dateString || []).map((x) => x || '')
  if (!checkRange('入库时间', range, true)) inboundRange.value = []
}

// ── 对账总览「自定义区间」：最早 1 年前、最晚今天、跨度 ≤1 个月 ──
/** 面板半选起点：选完起点、终点未定态时用于动态收窄终点可选范围 */
const customPickedStart = ref<Date | null>(null)

/**
 * 面板置灰：1 年前之前与今天之后始终禁用；
 * 选定起点后，终点还需落在起点 ~ 起点+1 个月内。
 */
function disabledCustomDate(current: Date, type: 'start' | 'end') {
  const day = startOfDay(current)
  if (day.getTime() < oneYearAgoStart().getTime() || day.getTime() > todayStart().getTime()) {
    return true
  }
  if (type === 'end' && customPickedStart.value) {
    if (
      day.getTime() < customPickedStart.value.getTime() ||
      day.getTime() > addMonths(customPickedStart.value, ONE_MONTH).getTime()
    ) {
      return true
    }
  }
  return false
}

/** 每次点选单元格：仅选中起点（终点空缺）时记录半选起点，选中终点后清空 */
function onCustomSelect(_v: unknown, date: unknown) {
  const arr = Array.isArray(date) ? (date as (Date | undefined)[]) : []
  customPickedStart.value = arr[0] && !arr[1] ? startOfDay(arr[0]) : null
}

/** 面板关闭：清空半选起点 */
function onCustomPopupToggle(visible: boolean) {
  if (!visible) customPickedStart.value = null
}

/** 选择/输入完成即校验（合法后才触发聚合查询） */
function onCustomRangeChange(_v: unknown, _d: unknown, dateString?: (string | undefined)[]) {
  customPickedStart.value = null
  const range = (dateString || []).map((x) => x || '')
  if (range.length < 2 || !range[0] || !range[1]) return
  if (!checkRange('自定义区间', range, true)) customRange.value = []
  else fetchAgg()
}

/** 查询前兜底校验（防止异常值绕过 change 校验） */
function validateRange(label: string, range: string[], withOneYear: boolean) {
  return checkRange(label, range, withOneYear)
}

const columns = [
  { title: '标题', dataIndex: 'title', slotName: 'title', ellipsis: true, tooltip: true },
  { title: '供数方', dataIndex: 'supplierName', slotName: 'supplierName', width: 150, ellipsis: true, tooltip: true },
  { title: '作者', dataIndex: 'authorName', slotName: 'authorName', width: 180 },
  { title: '发布时间', dataIndex: 'publishedAt', width: 160 },
  { title: '入库时间', dataIndex: 'inboundAt', width: 160 },
  { title: '来源 URL', dataIndex: 'sourceUrl', slotName: 'sourceUrl', width: 220 },
]

const detailVisible = ref(false)
const current = ref<DataEntry | null>(null)
const supplierVisible = ref(false)
const currentSupplier = ref<Supplier | null>(null)

/** 作者头像文案：取首字符，空名占位 */
function avatarText(name: string) {
  const trimmed = (name || '').trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
}

function healthBadge(h: Health) {
  const map: Record<Health, { status: 'success' | 'processing' | 'danger' | 'normal'; label: string }> = {
    healthy: { status: 'success', label: healthMeta.healthy.label },
    active: { status: 'processing', label: healthMeta.active.label },
    error: { status: 'danger', label: healthMeta.error.label },
    disabled: { status: 'normal', label: healthMeta.disabled.label },
  }
  return map[h]
}

function openDetail(row: DataEntry) {
  current.value = row
  detailVisible.value = true
}

/** 供数方点击：查出供方详情并打开抽屉 */
function openSupplier(row: DataEntry) {
  const target = getAllSuppliers().find((s) => s.id === row.supplierId)
  if (!target) return
  currentSupplier.value = target
  supplierVisible.value = true
}

/** 来源链接：直接新标签打开，不再二次确认 */
function openUrl(url: string) {
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

async function fetchDetail(page = pagination.current) {
  if (
    !validateRange('发布时间', publishRange.value || [], false) ||
    !validateRange('入库时间', inboundRange.value || [], true)
  ) {
    return
  }
  detailLoading.value = true
  try {
    const res = await getDataEntries({
      keyword: query.keyword,
      supplierId: query.supplierId,
      authorName: query.authorName,
      publishStart: publishRange.value?.[0] || '',
      publishEnd: publishRange.value?.[1] || '',
      inboundStart: inboundRange.value?.[0] || '',
      inboundEnd: inboundRange.value?.[1] || '',
      page,
      pageSize: pagination.pageSize,
    })
    data.value = res.list
    pagination.current = page
    pagination.total = res.total
  } finally {
    detailLoading.value = false
  }
}

function resetDetail() {
  query.keyword = ''
  query.supplierId = ''
  query.authorName = ''
  publishRange.value = []
  inboundRange.value = []
  publishPickedStart.value = null
  inboundPickedStart.value = null
  fetchDetail(1)
}

function onDetailPageSize(size: number) {
  pagination.pageSize = size
  fetchDetail(1)
}

onMounted(() => {
  supplierOpts.value = supplierOptions()
  const q = route.query
  // 数据概览下钻回填：?range=today|3d|1w|1m 驱动上半区时间范围
  if (['today', '3d', '1w', '1m'].includes(String(q.range))) {
    aggForm.range = q.range as StatsQuery['range']
  }
  // TOP 供方下钻：上半区聚合供方与下半区明细供方同时回填（无效/越权 id 忽略）
  const drillSupplierId = String(q.supplierId || '')
  if (drillSupplierId && supplierOpts.value.some((o) => o.value === drillSupplierId)) {
    aggForm.supplierIds = [drillSupplierId]
    query.supplierId = drillSupplierId
  }
  fetchAgg()
  fetchDetail(1)
  // 拒收下钻：高亮拒收指标卡并滚动定位
  if (q.result === 'reject') {
    rejectDrill.value = true
    nextTick(() => {
      rejectStatRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }
})
</script>

<style lang="scss" scoped>
/* 明细区发布/入库时间提示图标 */
.v8-date-info {
  margin-left: 2px;
  font-size: 14px;
  color: #c9cdd4;
  vertical-align: middle;
  cursor: help;
  transition: color 0.18s ease;
}
.v8-date-info:hover {
  color: #4096ff;
}

/* 自定义区间内联在时间范围右侧，宽度与供方下拉一致 */
.recon-agg-filter .arco-picker {
  width: 100%;
}
/* 选中自定义后：供数方固定第 3 列（被推到右侧），按钮第 4 列，布局不跳动 */
.recon-agg-filter.is-custom .recon-supplier {
  grid-column: 3;
}
.recon-agg-filter.is-custom .v8-filter-actions {
  grid-column: 4;
  justify-self: end;
  align-self: end;
}

@media (max-width: 1200px) {
  .recon-agg-filter.is-custom .recon-supplier,
  .recon-agg-filter.is-custom .v8-filter-actions {
    grid-column: auto;
  }
}

.recon-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}

.recon-detail-card {
  margin-top: 16px;
}

/* 拒收下钻时指标卡高亮 */
.v8-stat-highlight {
  border-color: rgba(245, 63, 63, 0.55);
  box-shadow: 0 0 0 3px rgba(245, 63, 63, 0.12);
}

.v8-stat-box {
  border: 1px solid #f0f1f3;
  border-radius: 10px;
  padding: 16px 18px;
  background: linear-gradient(180deg, #fbfcfe 0%, #f7f9fc 100%);
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
.v8-stat-box:hover {
  border-color: rgba(76, 154, 255, 0.35);
  box-shadow: 0 6px 18px rgba(76, 154, 255, 0.12);
  transform: translateY(-2px);
}
.v8-stat-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #86909c;
}
.v8-stat-info {
  font-size: 14px;
  color: #c9cdd4;
  cursor: help;
  transition: color 0.18s ease;
}
.v8-stat-info:hover {
  color: #4096ff;
}
.v8-stat-num {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.2;
}
.v8-stat-unit {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 400;
  color: #86909c;
}
.v8-text-ok { color: #00b42a; }
.v8-text-bad { color: #f53f3f; }
.v8-text-warn { color: #ff7d00; }

.v8-entry-title {
  font-weight: 500;
}
.v8-supplier-link {
  font-size: 13px;
}
/* 来源 URL：最多两行，超长尾部省略号 */
.v8-url-cell {
  max-width: 100%;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  white-space: normal;
  word-break: break-all;
  overflow-wrap: anywhere;
  line-height: 1.5;
  vertical-align: top;
  text-align: left;
}

/* 来源 URL（抽屉详情）：自然换行、完整展示 */
.v8-url-detail {
  white-space: normal;
  word-break: break-all;
  overflow-wrap: anywhere;
  line-height: 1.5;
}

/* 作者：头像 + 主名/平台副信息换行 */
.v8-author {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.v8-author-avatar {
  flex: 0 0 auto;
  background: linear-gradient(135deg, #4c9aff 0%, #165dff 100%);
  color: #fff;
  font-size: 13px;
}
.v8-author-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}
.v8-author-name {
  font-size: 13px;
  color: #1d2129;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.v8-author-platform {
  font-size: 12px;
  color: #86909c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.v8-index-note {
  margin-bottom: 16px;
}
</style>
