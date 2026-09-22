<template>
  <div class="workplace-page">
    <div class="workplace-header">
      <div>
        <h2 class="workplace-title">接入日志</h2>
        <p class="workplace-desc">查看数据接入的请求总量、入库与拒收情况，支持按时间范围（最长 3 天）、供数方、来源 URL 等维度筛选明细日志。同一来源数据被多家供数方分别报送时合为一条记录，供数方按推送时间先后逐行展示。</p>
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
            <a-tooltip content="时间跨度最大支持 3 天（含起止日期），且结束日期不可晚于当前时间" mini>
              <IconExclamationCircle class="v8-date-info" />
            </a-tooltip>
          </label>
          <a-range-picker
            v-model="publishRange"
            style="width: 100%"
            show-time
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="disabledRangeDate"
            :disabled-time="disabledRangeTime"
            @change="onPublishChange"
          />
        </div>
        <div class="v8-filter-item">
          <label>
            入库时间
            <a-tooltip content="时间跨度最大支持 3 天（含起止日期），且结束日期不可晚于当前时间" mini>
              <IconExclamationCircle class="v8-date-info" />
            </a-tooltip>
          </label>
          <a-range-picker
            v-model="inboundRange"
            style="width: 100%"
            show-time
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="disabledRangeDate"
            :disabled-time="disabledRangeTime"
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
        <!-- 供数方：一条数据可被多家报送，逐行展示（按推送时间先后），各带自己的推送时间 -->
        <template #supplierName="{ record }">
          <div class="v8-supplier-cell">
            <div v-for="s in (record as DataEntry).suppliers" :key="s.supplierId" class="v8-supplier-row">
              <a-avatar :size="24" class="v8-supplier-logo" :image-url="logoOf(s.supplierId)">
                {{ avatarText(s.supplierName) }}
              </a-avatar>
              <a-link class="v8-supplier-link" @click="openSupplier(s)">{{ s.supplierName }}</a-link>
              <span class="v8-supplier-time">{{ s.inboundAt }}</span>
            </div>
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
            <div class="v8-supplier-cell">
              <div v-for="s in current.suppliers" :key="s.supplierId" class="v8-supplier-row">
                <a-avatar :size="24" class="v8-supplier-logo" :image-url="logoOf(s.supplierId)">
                  {{ avatarText(s.supplierName) }}
                </a-avatar>
                <a-link class="v8-supplier-link" @click="openSupplier(s)">{{ s.supplierName }}</a-link>
                <span class="v8-supplier-time">{{ s.inboundAt }}</span>
              </div>
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="作者/署名">{{ current.authorName }}</a-descriptions-item>
          <a-descriptions-item label="来源平台">{{ current.sourceSite }}</a-descriptions-item>
          <a-descriptions-item label="发布时间">{{ current.publishedAt }}</a-descriptions-item>
          <a-descriptions-item label="入库时间（首发）">{{ current.inboundAt }}</a-descriptions-item>
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
  type DataEntrySupplier,
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

// ── 明细时间范围限制：跨度 ≤ 3 天，且不早于「当前时间 - 3 天」、不晚于当前时间 ──
/** 跨度上限 3 天（含起止）；因下界＝当前时间 - 3 天，跨度天然不会超限，此处仅作兜底校验 */
const MAX_SPAN_MS = 3 * 24 * 60 * 60 * 1000
function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function todayStart() {
  return startOfDay(new Date())
}
/** 可选时间下界：当前时间往前整 3 天（时刻与当前一致） */
function rangeLowerBound() {
  return new Date(Date.now() - MAX_SPAN_MS)
}

/** 日期粒度限制：只允许落在 [下界当天, 今天] */
function disabledRangeDate(current: Date, _type: 'start' | 'end') {
  const day = startOfDay(current)
  if (day.getTime() > todayStart().getTime()) return true
  return day.getTime() < startOfDay(rangeLowerBound()).getTime()
}

/** 生成 [from, to] 的整数序列（用于禁用时分秒列表） */
function intRange(from: number, to: number, max: number) {
  const res: number[] = []
  for (let i = Math.max(0, from); i <= Math.min(max, to); i += 1) res.push(i)
  return res
}

/**
 * 时刻粒度限制：起点不可早于「当前时间 - 3 天」、终点不可晚于当前时间。
 * 仅当面板所在日期正好是相应边界当天时生效，其余日期全天可选。
 */
function disabledRangeTime(current: Date, type: 'start' | 'end') {
  const bound = type === 'start' ? rangeLowerBound() : new Date()
  if (startOfDay(current).getTime() !== startOfDay(bound).getTime()) return {}
  const h = bound.getHours()
  const m = bound.getMinutes()
  const s = bound.getSeconds()
  const later = type === 'end'
  return {
    disabledHours: () => (later ? intRange(h + 1, 23, 23) : intRange(0, h - 1, 23)),
    disabledMinutes: (hour?: number) =>
      hour === h ? (later ? intRange(m + 1, 59, 59) : intRange(0, m - 1, 59)) : [],
    disabledSeconds: (hour?: number, minute?: number) =>
      hour === h && minute === m ? (later ? intRange(s + 1, 59, 59) : intRange(0, s - 1, 59)) : [],
  }
}

/** 解析 value-format 输出的「YYYY-MM-DD HH:mm:ss」（避免空格分隔在各浏览器的解析差异） */
function parseTime(v: string) {
  return new Date(v.replace(' ', 'T'))
}
/** 提示用短格式：YYYY-MM-DD HH:mm */
function fmtTime(d: Date) {
  const p = (n: number) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 校验一段时间范围是否合规，违规时提示并返回 false */
function checkRange(label: string, range: string[]) {
  const [s, e] = range || []
  if (!s || !e) return true
  const start = parseTime(s)
  const end = parseTime(e)
  const now = new Date()
  const lower = rangeLowerBound()
  if (start.getTime() < lower.getTime()) {
    Message.warning(`${label}最早不能早于 ${fmtTime(lower)}（当前时间前 3 天）`)
    return false
  }
  if (end.getTime() > now.getTime()) {
    Message.warning(`${label}结束时间不能晚于当前时间`)
    return false
  }
  if (end.getTime() - start.getTime() > MAX_SPAN_MS) {
    Message.warning(`${label}时间跨度最大支持 3 天`)
    return false
  }
  return true
}

/** 选择/输入完成即校验（Arco change 第三参为格式化后的字符串区间） */
function onPublishChange(_v: unknown, _d: unknown, dateString?: (string | undefined)[]) {
  const range = (dateString || []).map((x) => x || '')
  if (!checkRange('发布时间', range)) publishRange.value = []
}
function onInboundChange(_v: unknown, _d: unknown, dateString?: (string | undefined)[]) {
  const range = (dateString || []).map((x) => x || '')
  if (!checkRange('入库时间', range)) inboundRange.value = []
}

const columns = [
  { title: '标题', dataIndex: 'title', slotName: 'title', ellipsis: true, tooltip: true },
  { title: '供数方', dataIndex: 'suppliers', slotName: 'supplierName', width: 260 },
  { title: '来源 URL', dataIndex: 'sourceUrl', slotName: 'sourceUrl', width: 220 },
  { title: '作者', dataIndex: 'authorName', slotName: 'authorName', width: 180 },
  { title: '发布时间', dataIndex: 'publishedAt', width: 160 },
  { title: '入库时间（首发）', dataIndex: 'inboundAt', width: 160 },
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
function openSupplier(row: DataEntrySupplier) {
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
    !checkRange('发布时间', publishRange.value || []) ||
    !checkRange('入库时间', inboundRange.value || [])
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
/* 供数方：一条数据可被多家报送，逐行展示 logo + 名称 + 各自推送时间 */
.v8-supplier-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.v8-supplier-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
/* 名称与时间贴得更近：行内 4px，头像另加 margin 补到 8px */
.v8-supplier-time {
  flex: none;
  color: #86909c;
  font-size: 11px;
  white-space: nowrap;
}
.v8-supplier-logo {
  flex: none;
  margin-right: 4px;
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
