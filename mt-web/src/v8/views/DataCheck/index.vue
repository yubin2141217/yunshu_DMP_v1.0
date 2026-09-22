<template>
  <div class="workplace-page">
    <div class="workplace-header">
      <div>
        <h2 class="workplace-title">接入日志</h2>
        <p class="workplace-desc">查看数据接入的请求总量、入库与拒收情况，支持按时间范围（最长 3 天）、供数方、来源 URL 等维度筛选明细日志。</p>
      </div>
    </div>

    <!-- 单模块：汇总口径（供数方 + 时间范围）→ 统计卡 → 明细筛选 → 列表 -->
    <a-card class="content-card" :bordered="false">
      <div class="recon-summary-bar">
        <div class="recon-supplier">
          <label>供数方</label>
          <div class="v8-supplier-tabs">
            <a-button
              size="small"
              :type="query.supplierId === '' ? 'primary' : 'outline'"
              @click="onSupplierPick('')"
            >
              全部
            </a-button>
            <a-button
              v-for="o in supplierOpts"
              :key="o.value"
              size="small"
              :type="query.supplierId === o.value ? 'primary' : 'outline'"
              @click="onSupplierPick(o.value)"
            >
              {{ o.label }}
            </a-button>
          </div>
        </div>
        <a-radio-group v-model="aggForm.range" type="button" @change="onRangeChange">
          <a-radio value="today">今日</a-radio>
          <a-radio value="yesterday">昨日</a-radio>
          <a-radio value="3d">近3天</a-radio>
        </a-radio-group>
      </div>

      <!-- 统计卡：仅随供数方 / 时间范围联动，不随下方明细筛选条件变化 -->
      <a-spin class="recon-summary-stats" :loading="aggLoading">
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :sm="12" :lg="6">
            <div class="v8-stat-box">
              <div class="v8-stat-label">
                请求总量
                <a-tooltip content="所选供数方在所选时间范围内的数据请求总条数（单位：条）" mini>
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
      </a-spin>

      <!-- 明细筛选：仅驱动下方列表，不影响上方统计卡 -->
      <div class="v8-filter-grid recon-detail-filter">
        <div class="v8-filter-item">
          <label>标题</label>
          <a-input v-model="query.keyword" placeholder="请输入标题" allow-clear @press-enter="fetchDetail(1)" />
        </div>
        <div class="v8-filter-item">
          <label>来源 URL</label>
          <a-input
            v-model="query.sourceUrl"
            placeholder="请输入来源 URL 关键词"
            allow-clear
            @press-enter="fetchDetail(1)"
          />
        </div>
        <div class="v8-filter-item">
          <label>作者</label>
          <a-input v-model="query.authorName" placeholder="作者/来源署名" allow-clear @press-enter="fetchDetail(1)" />
        </div>
        <div class="v8-filter-item">
          <label>
            发布时间
            <a-tooltip content="时间跨度最大支持 3 天（含起止日期），且结束日期不可晚于今天" mini>
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
            <a-tooltip content="最早支持 1 年内数据查询，时间跨度最大支持 3 天（含起止日期），且结束日期不可晚于今天" mini>
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
          <a-button @click="resetAll">重置</a-button>
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
          <div class="v8-supplier-cell">
            <a-avatar
              :size="24"
              class="v8-supplier-logo"
              :image-url="logoOf((record as DataEntry).supplierId)"
            >
              {{ avatarText((record as DataEntry).supplierName) }}
            </a-avatar>
            <a-link class="v8-supplier-link" @click="openSupplier(record as DataEntry)">
              {{ (record as DataEntry).supplierName }}
            </a-link>
          </div>
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
  type StatsRange,
  type StatsSummary,
  type Supplier,
} from '@/v8/mock/types'

const route = useRoute()

const supplierOpts = ref<{ label: string; value: string }[]>([])

// ── 汇总统计：时间范围 + 供数方，仅驱动统计卡；供数方同时驱动下方列表 ──
const aggLoading = ref(false)
const summary = ref<StatsSummary>({ total: 0, success: 0, reject: 0, rejectRate: 0 })

/** 概览「拒收」下钻：高亮拒收指标卡并定位 */
const rejectDrill = ref(false)
const rejectStatRef = ref<HTMLElement | null>(null)

const aggForm = reactive<{ range: StatsRange }>({ range: 'today' })

function num(n: number) {
  return Number(n || 0).toLocaleString('zh-CN')
}

function buildAggQuery(): StatsQuery {
  return {
    range: aggForm.range,
    supplierIds: query.supplierId ? [query.supplierId] : [],
    result: 'all',
  }
}

/** 切换时间范围仅刷新统计卡，明细列表不受影响 */
function onRangeChange() {
  fetchAgg()
}

/** 切换供数方：汇总统计与下方明细列表同步刷新（本页唯一的供方筛选入口） */
function onSupplierPick(id: string) {
  query.supplierId = id
  fetchAgg()
  fetchDetail(1)
}

async function fetchAgg() {
  aggLoading.value = true
  try {
    summary.value = await getStatsSummary(buildAggQuery())
  } finally {
    aggLoading.value = false
  }
}

// ── 明细列表：筛选仅驱动列表，不影响上方统计卡 ─────────────
const data = ref<DataEntry[]>([])
const detailLoading = ref(false)
const publishRange = ref<string[]>([])
const inboundRange = ref<string[]>([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })

const query = reactive({
  keyword: '',
  supplierId: '',
  authorName: '',
  sourceUrl: '',
  publishStart: '',
  publishEnd: '',
  inboundStart: '',
  inboundEnd: '',
})

// ── 明细日期范围限制：跨度≤3天、不可选未来；入库时间最早1年内 ──
const MAX_SPAN_DAYS = 3
function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
/** 日期加减天数（用于收窄终点可选范围，保证含首尾最多 3 天） */
function addDays(base: Date, delta: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + delta)
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

// ── 明细「发布时间」：最晚今天、跨度 ≤3 天（不限最早时间） ──
const publishPickedStart = ref<Date | null>(null)
function disabledPublishDate(current: Date, type: 'start' | 'end') {
  const day = startOfDay(current)
  if (day.getTime() > todayStart().getTime()) return true
  if (type === 'end' && publishPickedStart.value) {
    if (
      day.getTime() < publishPickedStart.value.getTime() ||
      day.getTime() > addDays(publishPickedStart.value, MAX_SPAN_DAYS - 1).getTime()
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

// ── 明细「入库时间」：最早 1 年前、最晚今天、跨度 ≤3 天 ──
const inboundPickedStart = ref<Date | null>(null)
function disabledInboundDate(current: Date, type: 'start' | 'end') {
  const day = startOfDay(current)
  if (day.getTime() < oneYearAgoStart().getTime() || day.getTime() > todayStart().getTime()) {
    return true
  }
  if (type === 'end' && inboundPickedStart.value) {
    if (
      day.getTime() < inboundPickedStart.value.getTime() ||
      day.getTime() > addDays(inboundPickedStart.value, MAX_SPAN_DAYS - 1).getTime()
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
  if (end.getTime() > addDays(start, MAX_SPAN_DAYS - 1).getTime()) {
    Message.warning(`${label}时间跨度最大支持 3 天`)
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

/** 查询前兜底校验（防止异常值绕过 change 校验） */
function validateRange(label: string, range: string[], withOneYear: boolean) {
  return checkRange(label, range, withOneYear)
}

const columns = [
  { title: '标题', dataIndex: 'title', slotName: 'title', ellipsis: true, tooltip: true },
  { title: '供数方', dataIndex: 'supplierName', slotName: 'supplierName', width: 180, ellipsis: true, tooltip: true },
  { title: '来源 URL', dataIndex: 'sourceUrl', slotName: 'sourceUrl', width: 220 },
  { title: '作者', dataIndex: 'authorName', slotName: 'authorName', width: 180 },
  { title: '发布时间', dataIndex: 'publishedAt', width: 160 },
  { title: '入库时间', dataIndex: 'inboundAt', width: 160 },
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

/** 供数方 logo：由 MT 管理端维护，机构端按供方 id 取用；缺图时回退首字头像 */
function logoOf(supplierId: string) {
  return getAllSuppliers().find((s) => s.id === supplierId)?.logo || ''
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
      sourceUrl: query.sourceUrl,
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

/** 重置本模块全部筛选：时间范围恢复「今日」、供方恢复「全部」，明细条件清空 */
function resetAll() {
  aggForm.range = 'today'
  query.supplierId = ''
  query.keyword = ''
  query.authorName = ''
  query.sourceUrl = ''
  publishRange.value = []
  inboundRange.value = []
  publishPickedStart.value = null
  inboundPickedStart.value = null
  rejectDrill.value = false
  fetchAgg()
  fetchDetail(1)
}

function onDetailPageSize(size: number) {
  pagination.pageSize = size
  fetchDetail(1)
}

onMounted(() => {
  supplierOpts.value = supplierOptions()
  const q = route.query
  // 首页下钻回填：?range=today|3d 驱动时间范围（本页最多仅支持 3 天）
  if (['today', '3d'].includes(String(q.range))) {
    aggForm.range = q.range as StatsRange
  }
  // TOP 供方下钻：供方筛选唯一入口，统计卡与明细列表同时生效（无效 id 忽略）
  const drillSupplierId = String(q.supplierId || '')
  if (drillSupplierId && supplierOpts.value.some((o) => o.value === drillSupplierId)) {
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

/* 汇总口径行：供数方按钮组靠左、时间范围靠右，同一行展示 */
.recon-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-bottom: 16px;
}
.recon-supplier {
  display: flex;
  align-items: center;
  min-width: 0;
}
.recon-supplier > label {
  flex: none;
  margin-right: 12px;
  font-size: 13px;
  color: #4e5969;
}

/* 供数方改为横向按钮切换：按供方数量自动换行 */
.v8-supplier-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 统计卡容器：显式块级 + padding-top，阻断 Arco a-row 的 -8px 负边距与容器外边距合并 */
.recon-summary-stats {
  display: block;
  padding-top: 12px;
  padding-bottom: 4px;
}

/* 明细筛选：以分隔线区隔统计卡，突出「仅驱动下方列表」的边界 */
.recon-detail-filter {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f1f3;
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
/* 供数方：logo + 名称，logo 便于在密集列表中快速区分供稿来源 */
.v8-supplier-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.v8-supplier-logo {
  flex: none;
  background: #f2f3f5;
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
