<template>
  <div class="workplace-page">
    <!-- 页头：标题 + 全局时间范围 + 摘要 -->
    <div class="workplace-header">
      <div>
        <h2 class="workplace-title">数据概览</h2>
        <p class="workplace-desc">数据接入情况统计分析总览，包括入库数据量、供数方等统计总览指标以及运营管理相关的数据概览。</p>
      </div>
      <div class="v8-overview-head-right">
        <a-radio-group v-model:model-value="range" type="button" @change="onRangeChange">
          <a-radio value="today">今日</a-radio>
          <a-radio value="3d">近3天</a-radio>
          <a-radio value="1w">近1周</a-radio>
          <a-radio value="1m">近1月</a-radio>
          <a-radio value="all">历史全量</a-radio>
        </a-radio-group>
        <div class="v8-summary-stats">
          <span>更新时间<strong>{{ lastInbound }}</strong></span>
        </div>
      </div>
    </div>

    <a-spin :loading="loading" style="width: 100%">
      <a-empty
        v-if="!loading && !summary.supplierCount"
        class="v8-overview-empty"
        description="暂未分配供数方，请联系机构管理员在「用户与数据权限」中配置"
      />

      <template v-else>
        <!-- 核心指标（无分区标题，卡片可下钻） -->
        <section class="v8-zone v8-zone-kpi">
          <a-row :gutter="[16, 16]" class="kpi-row">
            <a-col v-for="item in kpis" :key="item.key" :xs="12" :sm="8" :lg="4" class="kpi-col">
              <a-card
                class="kpi-card"
                :class="{ 'v8-kpi-clickable': item.to }"
                :bordered="false"
                @click="item.to && $router.push(item.to)"
              >
                <div class="kpi-body">
                  <span class="kpi-icon" :style="{ background: item.accent }">
                    <component :is="item.icon" />
                  </span>
                  <div style="min-width: 0">
                    <div class="kpi-title">
                      {{ item.title }}
                      <a-tooltip :content="item.tip" mini>
                        <IconQuestionCircle class="kpi-title-info" @click.stop />
                      </a-tooltip>
                    </div>
                    <div class="kpi-value">
                      {{ item.value }}
                      <div v-if="item.key === 'total' && range !== 'all' && range !== 'today'" class="kpi-compare">
                        <span v-for="c in inboundCompare" :key="c.label" class="kpi-compare-item">
                          {{ c.label }}
                          <component
                            :is="c.up ? IconArrowUp : IconArrowDown"
                            v-if="!c.isNull"
                            :class="['kpi-compare-arrow', c.up ? 'is-up' : 'is-down']"
                          />
                          <em :class="['kpi-compare-val', c.isNull ? 'is-null' : c.up ? 'is-up' : 'is-down']">
                            {{ c.text }}
                          </em>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </a-card>
            </a-col>
          </a-row>
        </section>

        <!-- 分区① 接入分析 -->
        <section class="v8-zone">
          <div class="v8-zone-head">
            <span class="v8-zone-title">接入分析</span>
            <span class="v8-zone-hint">本机构数据接入汇总分析，数据随上方时间范围联动（除供数方状态分布外）</span>
          </div>
          <!-- 上排：突出展示，趋势宽度对齐 KPI 第 3 张「供数方健康度」右边界（整行 60%），两图等高加高 -->
          <a-row :gutter="[16, 16]">
            <a-col :xs="24" class="v8-col-60">
              <a-card class="content-card v8-panel-card v8-feature-card" :bordered="false">
                <div class="v8-card-head">
                  <span class="v8-card-title-tip">
                    <span class="section-title">接入数据量趋势</span>
                    <a-tooltip content="展示所选时间范围内入库量与拒收量的变化趋势，随上方时间范围联动；历史全量下可切换按天/按月查看。" mini>
                      <IconQuestionCircle class="v8-card-title-info" />
                    </a-tooltip>
                  </span>
                  <a-radio-group
                    v-if="range === 'all'"
                    v-model:model-value="allGranularity"
                    type="button"
                    size="small"
                    @change="load"
                  >
                    <a-radio value="day">按天</a-radio>
                    <a-radio value="month">按月</a-radio>
                  </a-radio-group>
                </div>
                <V8Chart v-if="trendPoints.length" :option="trendOption" height="340px" />
                <div v-else class="v8-chart-empty v8-chart-empty-lg"><a-empty description="暂无趋势数据" /></div>
              </a-card>
            </a-col>
            <a-col :xs="24" class="v8-col-40">
              <a-card class="content-card v8-panel-card v8-feature-card" :bordered="false">
                <div class="v8-card-head">
                  <span class="v8-card-title-tip">
                    <span class="section-title">供数方供数TOP 5</span>
                    <a-tooltip content="按所选时间范围统计入库量排名前 5 的供数方；点击柱条可查看供方明细。" mini>
                      <IconQuestionCircle class="v8-card-title-info" />
                    </a-tooltip>
                  </span>
                </div>
                <V8Chart
                  v-if="top5Suppliers.length"
                  :option="topSupplierOption"
                  height="340px"
                  class="v8-click-chart"
                  @chart-click="onTopSupplierClick"
                />
                <div v-else class="v8-chart-empty v8-chart-empty-lg"><a-empty description="暂无入库数据" /></div>
              </a-card>
            </a-col>
          </a-row>
          <!-- 下排：常规高度 -->
          <a-row :gutter="[16, 16]">
            <a-col :xs="24" :lg="12">
              <a-card class="content-card v8-panel-card" :bordered="false">
                <div class="v8-card-head v8-card-head--inline">
                  <span class="section-title">供数方状态分布</span>
                  <span class="v8-card-head-sub">按供方实时接入状态统计</span>
                </div>
                <V8Chart :option="healthOption" height="240px" @chart-click="onHealthClick" />
              </a-card>
            </a-col>
            <a-col :xs="24" :lg="12">
              <a-card class="content-card v8-panel-card" :bordered="false">
                <div class="v8-card-head v8-card-head--inline">
                  <span class="v8-card-title-tip">
                    <span class="section-title">拒收原因分布</span>
                    <span class="v8-card-head-sub">接入失败原因统计分析</span>
                    <a-tooltip content="按所选时间范围统计各拒收原因的分布情况；点击图块可查看拒收明细。" mini>
                      <IconQuestionCircle class="v8-card-title-info" />
                    </a-tooltip>
                  </span>
                </div>
                <V8Chart
                  v-if="rejectReasonTotal"
                  :option="rejectReasonOption"
                  height="240px"
                  class="v8-click-chart"
                  @chart-click="goStatsReject"
                />
                <div v-else class="v8-chart-empty v8-chart-empty-sm"><a-empty description="暂无拒收" /></div>
              </a-card>
            </a-col>
          </a-row>
        </section>

        <!-- 分区② 运营管理（运营信息置顶 + 待办 + 动态） -->
        <section class="v8-zone">
          <div class="v8-zone-head">
            <span class="v8-zone-title">运营管理</span>
            <span class="v8-zone-hint">本机构运营管理情况概览，数据以累计/静态为主，不随上方时间范围联动</span>
          </div>

          <!-- 运营信息（置顶）：配额(28%) + 接入方案(32%) 合计 60% 与趋势右边界对齐，来源站点 40% -->
          <a-row :gutter="[16, 16]">
            <a-col :xs="24" class="v8-col-28">
              <a-card class="content-card v8-panel-card v8-stretch-card" :bordered="false">
                <div class="v8-card-head"><span class="section-title">机构配额用量</span></div>
                <div class="v8-quota-num">
                  {{ num(summary.quota.used) }}
                  <span class="v8-quota-sep">/</span>
                  <span class="v8-quota-total">{{ num(summary.quota.total) }}</span>
                </div>
                <a-progress
                  :percent="quotaRatio"
                  :color="quotaColor"
                  :stroke-width="10"
                  :show-text="false"
                  style="margin: 12px 0 8px"
                />
                <div class="v8-quota-sub" :style="{ color: quotaColor }">
                  已用 {{ quotaPercent }}%{{ quotaPercent >= 95 ? '，配额即将用尽，请联系运营扩容' : quotaPercent >= 80 ? '，用量较高，请关注' : '，用量正常' }}
                </div>
              </a-card>
            </a-col>
            <a-col :xs="24" class="v8-col-32">
              <a-card class="content-card v8-panel-card v8-stretch-card" :bordered="false">
                <div class="v8-card-head">
                  <span class="section-title">接入方案</span>
                  <a-button type="text" size="small" @click="$router.push('/v8/spec')">全部 &gt;</a-button>
                </div>
                <a-empty v-if="!schemes.length" class="v8-scheme-empty" description="暂无接入方案" />
                <ul v-else class="v8-scheme-list">
                  <li v-for="s in recentSchemes" :key="s.id" class="v8-scheme-item">
                    <div class="v8-scheme-name" :title="s.name">{{ s.name }}</div>
                    <div class="v8-scheme-meta">
                      <a-tag size="small" :color="s.scope === 'org' ? 'arcoblue' : 'green'">
                        {{ s.scope === 'org' ? '机构' : '全局' }}
                      </a-tag>
                      <span>{{ s.fields?.length || 0 }} 字段</span>
                      <span class="v8-scheme-date">{{ (s.publishedAt || '').slice(0, 10) }}</span>
                    </div>
                  </li>
                </ul>
              </a-card>
            </a-col>
            <a-col :xs="24" class="v8-col-40">
              <a-card class="content-card v8-panel-card v8-stretch-card" :bordered="false">
                <div class="v8-card-head"><span class="section-title">来源平台 TOP 5</span></div>
                <V8Chart v-if="summary.siteDist.length" :option="siteOption" height="200px" />
                <div v-else class="v8-chart-empty v8-chart-empty-xs"><a-empty description="暂无来源数据" /></div>
              </a-card>
            </a-col>
          </a-row>

          <!-- 动态：最近入库动态 60% 与趋势右边界对齐 + 告警类型分布 40% -->
          <a-row :gutter="[16, 16]">
            <a-col :xs="24" class="v8-col-60">
              <a-card class="content-card v8-panel-card v8-stretch-card" :bordered="false">
                <div class="v8-card-head">
                  <span class="section-title">最近入库动态</span>
                  <a-button type="text" size="small" @click="$router.push('/v8/data-check')">入库核对 &gt;</a-button>
                </div>
                <a-empty v-if="!summary.recentEntries.length" description="暂无入库动态" />
                <ul v-else class="v8-feed-list">
                  <li v-for="e in summary.recentEntries" :key="e.id" class="v8-feed-item">
                    <span class="v8-feed-time">{{ e.inboundAt.slice(5, 16) }}</span>
                    <a-tag size="small" color="arcoblue" class="v8-feed-supplier">{{ e.supplierName }}</a-tag>
                    <span class="v8-feed-title" :title="e.title">{{ e.title }}</span>
                  </li>
                </ul>
              </a-card>
            </a-col>
            <a-col :xs="24" class="v8-col-40">
              <a-card class="content-card v8-panel-card v8-stretch-card" :bordered="false">
                <div class="v8-card-head">
                  <span class="section-title">告警类型分布</span>
                </div>
                <V8Chart
                  :option="alertTypeOption"
                  height="264px"
                  class="v8-alert-type-chart"
                  @chart-click="onAlertTypeClick"
                />
              </a-card>
            </a-col>
          </a-row>
        </section>
      </template>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconArrowDown,
  IconArrowUp,
  IconBarChart,
  IconCheckCircle,
  IconExclamationCircle,
  IconHeart,
  IconQuestionCircle,
  IconUserGroup,
} from '@arco-design/web-vue/es/icon'
import * as echarts from 'echarts/core'
import type { EChartsCoreOption } from 'echarts/core'
import V8Chart from '@/v8/components/V8Chart.vue'
import { getOverview } from '@/v8/api/data'
import { getEnabledStandards } from '@/v8/api/v8'
import type { Standard } from '@/v8/mock/v8'
import {
  alertStackStatusMeta,
  alertTypeLabels,
  healthMeta,
  rejectReasonLabels,
  type AlertStackStatus,
  type AlertType,
  type Health,
  type Overview,
  type OverviewRange,
  type RejectReason,
} from '@/v8/mock/types'

const router = useRouter()
const loading = ref(false)
const range = ref<OverviewRange>('today')
/** 历时全量下的趋势粒度切换：按天 / 按月（最大近 1 年） */
const allGranularity = ref<'day' | 'month'>('day')

/** 切换时间范围：离开历史全量时重置粒度，避免下次进入仍按月 */
function onRangeChange() {
  if (range.value !== 'all') allGranularity.value = 'day'
  load()
}

/** 下钻到供数统计页时的时间范围映射：该页不支持「历时全量」，兜底为近 1 月 */
const statsRange = computed(() => (range.value === 'all' ? '1m' : range.value))

function emptyOverview(): Overview {
  return {
    supplierCount: 0,
    inboundTotal: 0,
    lastInboundAt: '',
    inboundYoy: null,
    inboundMom: null,
    todayCount: 0,
    yesterdayCount: 0,
    todayRejectRate: 0,
    healthRate: 100,
    pushSuccessRate: 0,
    pendingAlertCount: 0,
    trend: [],
    trendSeries: { granularity: 'day', points: [] },
    rejectReasons: [],
    topSuppliers: [],
    healthDist: { active: 0, healthy: 0, error: 0, disabled: 0 },
    hourlyTrend: [],
    pushSummary: { batchCount: 0, success: 0, fail: 0, waitingReceipt: 0, avgCostMs: 0, retryCount: 0 },
    pushTrend: [],
    pushFailReasons: [],
    recentBatches: [],
    todoSummary: { pendingAlert: 0, unreadMessage: 0, waitingReceipt: 0 },
    alertTypeDist: {
      break: { pending: 0, processing: 0, resolved: 0 },
      reject: { pending: 0, processing: 0, resolved: 0 },
      delay: { pending: 0, processing: 0, resolved: 0 },
      field: { pending: 0, processing: 0, resolved: 0 },
    },
    recentEntries: [],
    quota: { used: 0, total: 0 },
    activeSpec: { version: '', publishedAt: '', status: 'active' },
    siteDist: [],
  }
}
const summary = ref<Overview>(emptyOverview())
// 接入方案列表（MT 管理端桥接下发，V8 只读）
const schemes = ref<Standard[]>([])
// 概览卡片按发布时间倒序展示最新 3 个方案，完整列表见「接入规范」页
const recentSchemes = computed(() =>
  schemes.value
    .slice()
    .sort((a, b) => (a.publishedAt || '').localeCompare(b.publishedAt || ''))
    .reverse()
    .slice(0, 3),
)

const C = {
  ok: '#00b42a',
  bad: '#f53f3f',
  warn: '#ff7d00',
  blue: '#1677ff',
  cyan: '#13c2c2',
  purple: '#722ed1',
  gray: '#86909c',
}
const REASON_COLORS = ['#f53f3f', '#ff7d00', '#ffb400', '#1677ff', '#13c2c2', '#86909c']
const HEALTH_COLOR: Record<Health, string> = {
  healthy: C.ok,
  active: C.blue,
  error: C.bad,
  disabled: C.gray,
}
const HEALTH_ORDER: Health[] = ['healthy', 'active', 'error', 'disabled']

function num(n: number) {
  return Number(n || 0).toLocaleString('zh-CN')
}

const inboundText = computed(() => num(summary.value.inboundTotal))
const lastInbound = computed(() => summary.value.lastInboundAt || '暂无入库')

interface CompareItem {
  label: string
  /** 比值为正箭头向上、为负箭头向下；isNull 表示缺少对比基数 */
  up: boolean
  isNull: boolean
  text: string
}
function formatCompare(value: number | null): Omit<CompareItem, 'label'> {
  if (value === null) return { up: false, isNull: true, text: '暂无基数' }
  const up = value >= 0
  return { up, isNull: false, text: `${up ? '+' : ''}${value}%` }
}
/** 入库总量同比（较去年同期）/ 环比（较上一等长周期） */
const inboundCompare = computed<CompareItem[]>(() => [
  { label: '同比', ...formatCompare(summary.value.inboundYoy) },
  { label: '环比', ...formatCompare(summary.value.inboundMom) },
])

const disabledSupplierCount = computed(() => summary.value.healthDist.disabled)
const rejectRateOver = computed(() => summary.value.todayRejectRate > 5)

const kpis = computed(() => [
  {
    key: 'total', title: '入库总量', value: inboundText.value,
    tip: '所选时间范围内通过校验并成功入库的数据总条数；同比为较去年同期、环比为较上一等长周期的变化幅度，点击进入接入数据对账。',
    accent: 'linear-gradient(135deg, #73d897 0%, #38b864 100%)', icon: IconBarChart,
    to: { path: '/v8/data-check', query: { range: statsRange.value } },
  },
  {
    key: 'suppliers', title: '供数方数量', value: String(summary.value.supplierCount),
    tip: `当前已接入配置的供数方总数，其中含停用供方 ${disabledSupplierCount.value} 个；按您的数据可见范围统计，点击查看供数方列表。`,
    accent: 'linear-gradient(135deg, #69b1ff 0%, #4096ff 100%)', icon: IconUserGroup, to: '/v8/suppliers',
  },
  {
    key: 'health', title: '供数方健康度', value: `${summary.value.healthRate}%`,
    tip: '活跃+健康供数方占全部供数方的比例：活跃指启用且近 1 周累计接入≥1万条或至少5天有接入；健康指启用且非异常、非活跃；异常指启用但近3天无接入或拒收率>5%。点击查看供数方状态分布。',
    accent: 'linear-gradient(135deg, #5fe0d4 0%, #20bdb0 100%)', icon: IconHeart, to: '/v8/suppliers',
  },
  {
    key: 'reject', title: '今日拒收率', value: `${summary.value.todayRejectRate}%`,
    tip: `今日被拒收数据条数 ÷ 今日请求总量 × 100%，未通过校验（如 AppKey 无效、IP 不在白名单等）即计为拒收；当前${rejectRateOver.value ? '已超出 5% 阈值（橙色预警）' : '处于正常区间（未超 5% 阈值）'}，点击查看拒收明细。`,
    accent: 'linear-gradient(135deg, #ffc96b 0%, #ff9f40 100%)', icon: IconExclamationCircle,
    to: { path: '/v8/data-check', query: { result: 'reject', range: statsRange.value } },
  },
  {
    key: 'todo', title: '异常待办', value: String(summary.value.pendingAlertCount),
    tip: '当前待处置告警数量，即尚未处置完成的供给异常告警（如接入中断、拒收突增等），点击进入供数监控查看待处置告警。',
    accent: 'linear-gradient(135deg, #ff8f8f 0%, #ff6b6b 100%)', icon: IconCheckCircle,
    to: { path: '/v8/monitor', query: { status: 'pending' } },
  },
])

// ── 分区② 图表 ──────────────────────────────────────────────
const rejectReasonTotal = computed(() => summary.value.rejectReasons.reduce((s, r) => s + r.count, 0))

const rejectReasonOption = computed<EChartsCoreOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: {
    orient: 'vertical', right: 0, top: 'middle', itemWidth: 10, itemHeight: 10,
    textStyle: { fontSize: 12, color: '#4e5969' },
    formatter: (name: string) => {
      const item = summary.value.rejectReasons.find((r) => rejectReasonLabels[r.reason] === name)
      const total = rejectReasonTotal.value
      const pct = item && total ? ((item.count / total) * 100).toFixed(1) : '0'
      return `${name}  ${num(item?.count || 0)} (${pct}%)`
    },
  },
  color: REASON_COLORS,
  series: [
    {
      type: 'pie', radius: ['52%', '74%'], center: ['34%', '50%'], avoidLabelOverlap: false,
      label: { show: false }, labelLine: { show: false },
      data: summary.value.rejectReasons.map((r) => ({
        name: rejectReasonLabels[r.reason],
        value: r.count,
      })),
    },
  ],
}))

// 供数方供数 TOP 5：按入库量降序取前 5
const top5Suppliers = computed(() => summary.value.topSuppliers.slice(0, 5))

const topSupplierOption = computed<EChartsCoreOption>(() => {
  const list = [...top5Suppliers.value].reverse()
  return {
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const arr = params as { dataIndex: number }[]
        const idx = arr[0]?.dataIndex ?? 0
        const s = list[idx]
        return `${s.supplierName}<br/>入库量：${num(s.inbound)}<br/>拒收量：${num(s.reject)}`
      },
    },
    grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#f2f3f5' } }, axisLabel: { color: '#86909c' } },
    yAxis: {
      type: 'category', data: list.map((s) => s.supplierName),
      axisLine: { lineStyle: { color: '#e5e6eb' } }, axisTick: { show: false },
      axisLabel: { color: '#4e5969', fontSize: 12 },
    },
    series: [
      {
        type: 'bar', barMaxWidth: 16, data: list.map((s) => s.inbound),
        itemStyle: { color: C.blue, borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: '#4e5969', fontSize: 12, formatter: (p: { value: number }) => num(p.value) },
      },
    ],
  }
})

const healthOption = computed<EChartsCoreOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} 家 ({d}%)' },
  legend: {
    orient: 'vertical', right: 0, top: 'middle', itemWidth: 10, itemHeight: 10,
    textStyle: { fontSize: 12, color: '#4e5969' },
  },
  color: HEALTH_ORDER.map((h) => HEALTH_COLOR[h]),
  series: [
    {
      type: 'pie', radius: ['52%', '74%'], center: ['34%', '50%'], avoidLabelOverlap: false,
      label: { show: false }, labelLine: { show: false },
      data: HEALTH_ORDER.map((h) => ({ name: healthMeta[h].label, value: summary.value.healthDist[h] })),
    },
  ],
}))

// 接入数据量趋势：随时间范围联动横坐标粒度（今日整点 / 近3天12小时 / 按天 / 按月）
const trendSeriesData = computed(() => summary.value.trendSeries)
const trendPoints = computed(() => trendSeriesData.value.points || [])
const trendGranularity = computed(() => trendSeriesData.value.granularity)

/** 横坐标刻度稀疏化：点较多（按天近 1 月/近 1 年）时只展示部分标签，避免拥挤重叠 */
function xLabelInterval(): number | ((index: number, value: string) => boolean) {
  const len = trendPoints.value.length
  if (trendGranularity.value === 'month') return 0
  if (len <= 14) return 0
  // 近 1 月（30）约隔日显示；近 1 年（365）约每 30 天显示一个（≈12 个标签）
  const step = len > 60 ? 30 : 2
  return (index: number) => index % step === 0 || index === len - 1
}

const trendOption = computed<EChartsCoreOption>(() => {
  const points = trendPoints.value
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      valueFormatter: (v: unknown) => `${num(Number(v))} 条`,
    },
    legend: {
      data: ['入库', '拒收'], top: 0, right: 0, itemWidth: 14, itemHeight: 8,
      textStyle: { fontSize: 12, color: '#4e5969' },
    },
    grid: { left: 56, right: 20, top: 36, bottom: 30 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: points.map((p) => p.date),
      axisLine: { lineStyle: { color: '#e5e6eb' } },
      axisTick: { show: false },
      axisLabel: { color: '#86909c', fontSize: 11, interval: xLabelInterval() },
    },
    yAxis: {
      type: 'value',
      name: '单位：条',
      nameTextStyle: { color: '#86909c', fontSize: 11, padding: [0, 0, 0, 28] },
      splitLine: { lineStyle: { color: '#f2f3f5' } },
      axisLabel: { color: '#86909c', formatter: (v: number) => num(v) },
    },
    series: [
      {
        name: '入库', type: 'line', smooth: true, showSymbol: points.length <= 14,
        symbolSize: 6,
        data: points.map((p) => p.inbound),
        lineStyle: { width: 2, color: C.blue },
        itemStyle: { color: C.blue },
        areaStyle: { color: 'rgba(22,119,255,0.10)' },
      },
      {
        name: '拒收', type: 'line', smooth: true, showSymbol: points.length <= 14,
        symbolSize: 6,
        data: points.map((p) => p.reject),
        lineStyle: { width: 2, color: C.warn },
        itemStyle: { color: C.warn },
        areaStyle: { color: 'rgba(255,125,0,0.08)' },
      },
    ],
  }
})

// ── 分区③ 运营管理：告警类型分布（竖向堆叠：待处理/处理中/已处置）────
const ALERT_STACK_ORDER: AlertStackStatus[] = ['pending', 'processing', 'resolved']
// x 轴自左向右：供数断流 → 字段异常
const alertTypeOrder = Object.keys(alertTypeLabels) as AlertType[]
// 各段柱条的柔和竖向微渐变（顶略亮、底略深，低饱和不刺眼）与圆角：底段圆下角、顶段圆上角、中段直角
const ALERT_STACK_STYLE: Record<AlertStackStatus, { from: string; to: string; radius: [number, number, number, number] }> = {
  pending: { from: '#ffce8f', to: '#f5a04c', radius: [0, 0, 6, 6] },
  processing: { from: '#9dc6fb', to: '#5b9bf0', radius: [0, 0, 0, 0] },
  resolved: { from: '#9fe6c2', to: '#46c484', radius: [6, 6, 0, 0] },
}

const alertTypeOption = computed<EChartsCoreOption>(() => {
  const dist = summary.value.alertTypeDist
  const categories = alertTypeOrder.map((k) => alertTypeLabels[k])
  const series = ALERT_STACK_ORDER.map((st) => {
    const s = ALERT_STACK_STYLE[st]
    return {
      name: alertStackStatusMeta[st].label,
      type: 'bar' as const,
      stack: 'total',
      barMaxWidth: 30,
      itemStyle: {
        borderRadius: s.radius,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: s.from },
          { offset: 1, color: s.to },
        ]),
      },
      label: {
        show: true,
        position: 'inside' as const,
        fontSize: 11,
        fontWeight: 600,
        color: '#ffffff',
        textBorderColor: 'rgba(31,35,41,0.18)',
        textBorderWidth: 2,
        formatter: (p: { value: number }) => (Number(p.value) > 0 ? p.value : ''),
      },
      emphasis: { focus: 'series' as const },
      data: alertTypeOrder.map((k) => dist[k][st]),
    }
  })
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(22,119,255,0.06)' } },
      backgroundColor: '#ffffff',
      borderColor: '#e5e6eb',
      borderWidth: 1,
      padding: [9, 12],
      textStyle: { color: '#4e5969', fontSize: 12 },
      extraCssText: 'box-shadow: 0 6px 20px rgba(29,33,41,0.10);border-radius:8px;',
      formatter: (params: unknown) => {
        const arr = params as { name: string; seriesName: string; value: number }[]
        if (!arr.length) return ''
        const total = arr.reduce((sum, it) => sum + (Number(it.value) || 0), 0)
        const lines = arr
          .filter((it) => Number(it.value) > 0)
          .map((it, i) => {
            const c = ALERT_STACK_STYLE[ALERT_STACK_ORDER[i]].to
            return `<div style="display:flex;align-items:center;margin-top:3px"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${c};margin-right:6px"></span><span style="flex:1;color:#4e5969">${it.seriesName}</span><span style="font-weight:600;color:#1d2129;margin-left:16px">${it.value}</span></div>`
          })
          .join('')
        return `<div style="font-weight:600;color:#1d2129;margin-bottom:2px">${arr[0].name} · 共 ${total} 条</div>${lines || '暂无'}`
      },
    },
    legend: {
      top: 0,
      right: 4,
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 8,
      itemGap: 16,
      data: ALERT_STACK_ORDER.map((st) => alertStackStatusMeta[st].label),
      textStyle: { fontSize: 12, color: '#4e5969' },
    },
    grid: { left: 8, right: 16, top: 40, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#e5e6eb' } },
      axisTick: { show: false },
      axisLabel: { color: '#4e5969', fontSize: 12, interval: 0 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#86909c', fontSize: 11 },
      splitLine: { lineStyle: { color: '#eef0f3', type: 'dashed' } },
    },
    series,
  }
})

function onAlertTypeClick(p: { dataIndex?: number }) {
  const idx = p.dataIndex
  if (idx === undefined || idx < 0) return
  const type = alertTypeOrder[idx]
  if (type) router.push({ path: '/v8/monitor', query: { type } })
}

// ── 分区④ 运营 ──────────────────────────────────────────────
const quotaPercent = computed(() =>
  summary.value.quota.total ? Math.round((summary.value.quota.used / summary.value.quota.total) * 100) : 0,
)
/** 进度条占比（0–1）：Arco Progress 的 percent 接收比例值 */
const quotaRatio = computed(() =>
  summary.value.quota.total ? Math.min(1, summary.value.quota.used / summary.value.quota.total) : 0,
)
const quotaColor = computed(() =>
  quotaPercent.value >= 95 ? C.bad : quotaPercent.value >= 80 ? C.warn : C.blue,
)

const siteOption = computed<EChartsCoreOption>(() => {
  const list = [...summary.value.siteDist].reverse()
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c} 条' },
    grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#f2f3f5' } }, axisLabel: { color: '#86909c' } },
    yAxis: {
      type: 'category', data: list.map((s) => s.site),
      axisLine: { lineStyle: { color: '#e5e6eb' } }, axisTick: { show: false },
      axisLabel: { color: '#4e5969', fontSize: 12 },
    },
    series: [
      {
        type: 'bar', barMaxWidth: 14, data: list.map((s) => s.count),
        itemStyle: { color: C.cyan, borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: '#4e5969', fontSize: 12 },
      },
    ],
  }
})

// ── 下钻 ────────────────────────────────────────────────────
function goStatsReject() {
  router.push({ path: '/v8/data-check', query: { result: 'reject', range: statsRange.value } })
}
function onTopSupplierClick(p: { dataIndex?: number }) {
  // 图表为逆序展示，dataIndex 需映射回降序原数组；下钻至接入数据对账并带上时间范围 + 供方
  const list = top5Suppliers.value
  if (p.dataIndex == null || !list.length) return
  const target = list[list.length - 1 - p.dataIndex]
  if (target) {
    router.push({
      path: '/v8/data-check',
      query: { range: statsRange.value, supplierId: target.supplierId },
    })
  }
}
function onHealthClick(p: { dataIndex?: number }) {
  if (p.dataIndex == null) return
  const h = HEALTH_ORDER[p.dataIndex]
  if (h) router.push({ path: '/v8/suppliers', query: { health: h } })
}

async function load() {
  loading.value = true
  try {
    const [ov, list] = await Promise.all([
      getOverview(range.value, allGranularity.value),
      getEnabledStandards(),
    ])
    summary.value = ov
    schemes.value = list
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style lang="scss" scoped>
/* 页头右侧：撑满左侧标题区高度，时间切换与标题顶对齐、更新时间与描述底对齐，形成整齐两行 */
.v8-overview-head-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  align-self: stretch;
}

/* 右列内更新时间右对齐并去掉全局上内边距，与上方按钮组右边缘、左列描述底部对齐 */
.v8-overview-head-right .v8-summary-stats {
  justify-content: flex-end;
  padding-top: 0;
}

.v8-overview-head-right .v8-summary-stats span {
  text-align: right;
}

.v8-overview-empty {
  margin: 72px 0;
}

/* 核心指标现为 5 卡：大屏（lg 及以上）均分整行，取代默认 1/6 固定宽度 */
@media (min-width: 992px) {
  .kpi-row .kpi-col {
    flex: 1 1 0;
    max-width: 20%;
  }
}

/* ── 分区容器：统一序号 + 标题行 ── */
.v8-zone {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
/* 分区标题与上一分区内容保持明显间距，避免贴住 */
.v8-zone + .v8-zone {
  margin-top: 24px;
}
.v8-zone-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 2px;
}
.v8-zone-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}
.v8-zone-hint {
  font-size: 12px;
  color: #a9aeb8;
}
.v8-zone-head :deep(.arco-btn) {
  margin-left: auto;
}

/* ── KPI 卡等高 ── */
:deep(.kpi-card) {
  width: 100%;
  height: 100%;
  /* 比值块绝对定位于数字右侧，允许其在卡片间距区域展示而不被圆角裁切 */
  overflow: visible;
}
:deep(.kpi-card .arco-card-body) {
  display: flex;
  align-items: center;
  min-height: 108px;
}
.kpi-icon {
  align-self: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 18px;
}
.kpi-body {
  gap: 12px;
}
:deep(.kpi-card .arco-card-body) {
  padding: 16px;
}
/* 标题单行省略；副标题保留最多两行，避免环比信息丢失 */
.kpi-title {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kpi-title-info {
  flex: 0 0 auto;
  font-size: 13px;
  color: #c9cdd4;
  cursor: help;
  transition: color 0.18s ease;
}
.kpi-title-info:hover {
  color: #4096ff;
}
/* 入库总量：同比 / 环比绝对定位于主数字右侧，脱离文档流，
   不挤占主数字位置，保证 5 张卡片主数字中心对齐；
   比值为正箭头向上（涨/绿）、为负箭头向下（跌/红）。 */
.kpi-value {
  position: relative;
  width: fit-content;
}
.kpi-compare {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  margin-left: 10px;
  white-space: nowrap;
}
.kpi-compare-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  line-height: 1.4;
  color: #86909c;
  white-space: nowrap;
}
.kpi-compare-arrow {
  font-size: 12px;
}
.kpi-compare-val {
  font-style: normal;
  font-weight: 500;
}
.kpi-compare-arrow.is-up,
.kpi-compare-val.is-up {
  color: #00b42a;
}
.kpi-compare-arrow.is-down,
.kpi-compare-val.is-down {
  color: #f53f3f;
}
.kpi-compare-val.is-null {
  color: #a9aeb8;
  font-weight: 400;
}

/* ── 分区内卡片 / 卡片头 ── */
:deep(.v8-panel-card .arco-card-body) {
  padding: 18px 20px;
}
.v8-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 26px;
  margin-bottom: 12px;
}
.v8-card-head .section-title {
  margin: 0;
  font-size: 15px;
}
.v8-card-head-sub {
  font-size: 12px;
  color: #a9aeb8;
}
/* 说明紧跟模块标题后方（不两端撑开），与分区标题「名称 + 说明」风格一致 */
.v8-card-head--inline {
  justify-content: flex-start;
  gap: 8px;
}
.v8-card-head--inline .v8-card-head-sub {
  white-space: nowrap;
}
/* 模块标题 + tooltip 提示图标成组（说明文案并入 tooltip） */
.v8-card-title-tip {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}
.v8-card-title-info {
  position: relative;
  top: 1px;
  font-size: 13px;
  color: #c9cdd4;
  cursor: help;
  transition: color 0.18s ease;
}
.v8-card-title-info:hover {
  color: #4096ff;
}
.v8-chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
}
.v8-chart-empty-lg {
  height: 340px;
}
.v8-chart-empty-sm {
  height: 240px;
}
.v8-chart-empty-xs {
  height: 200px;
}

/* 上排突出图表：可点击图表给出指针反馈 */
:deep(.v8-feature-card) {
  border-color: rgba(22, 119, 255, 0.16);
  box-shadow: 0 6px 20px rgba(22, 119, 255, 0.08);
}
.v8-click-chart {
  cursor: pointer;
}

/* 通用列宽（lg 及以上）：60% 与「接入数据量趋势」右边界（即 KPI 第 3 张右缘）对齐；
   40% 为其右侧；28% + 32% 组合计 60%。窄屏各占整行。 */
@media (min-width: 992px) {
  .v8-zone :deep(.v8-col-60) {
    flex: 0 0 60%;
    max-width: 60%;
  }
  .v8-zone :deep(.v8-col-40) {
    flex: 0 0 40%;
    max-width: 40%;
  }
  .v8-zone :deep(.v8-col-32) {
    flex: 0 0 32%;
    max-width: 32%;
  }
  .v8-zone :deep(.v8-col-28) {
    flex: 0 0 28%;
    max-width: 28%;
  }
}

/* 同行卡等高对齐 */
.v8-zone :deep(.arco-row) {
  align-items: stretch;
}
.v8-zone :deep(.arco-col) {
  display: flex;
}
:deep(.v8-panel-card) {
  width: 100%;
  height: 100%;
}
:deep(.v8-stretch-card .arco-card-body) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ── 告警类型分布（堆叠柱状图） ── */
.v8-alert-type-chart {
  width: 100%;
}

/* ── 最近入库动态时间流 ── */
.v8-feed-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.v8-feed-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid #f7f8fa;
}
.v8-feed-item:last-child {
  border-bottom: none;
}
.v8-feed-time {
  flex-shrink: 0;
  width: 78px;
  font-size: 12px;
  color: #a9aeb8;
  font-variant-numeric: tabular-nums;
}
.v8-feed-supplier {
  flex-shrink: 0;
}
.v8-feed-title {
  min-width: 0;
  flex: 1;
  font-size: 13px;
  color: #4e5969;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 运营管理：配额 / 规范版本 ── */
.v8-quota-num {
  font-size: 30px;
  font-weight: 700;
  color: #1d2129;
  line-height: 1.1;
}
.v8-quota-sep {
  margin: 0 4px;
  color: #c9cdd4;
  font-weight: 500;
}
.v8-quota-total {
  font-size: 18px;
  font-weight: 500;
  color: #86909c;
}
.v8-quota-sub {
  font-size: 12px;
  color: #86909c;
}
/* ── 接入方案列表 ── */
.v8-scheme-empty {
  padding: 24px 0;
}
.v8-scheme-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.v8-scheme-item {
  padding: 10px 0;
  border-bottom: 1px solid #f7f8fa;
}
.v8-scheme-item:last-child {
  border-bottom: none;
}
.v8-scheme-name {
  font-size: 13px;
  font-weight: 500;
  color: #1d2129;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.v8-scheme-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 12px;
  color: #86909c;
}
.v8-scheme-date {
  margin-left: auto;
  color: #a9aeb8;
  font-variant-numeric: tabular-nums;
}

.v8-text-ok { color: #00b42a; }
.v8-text-bad { color: #f53f3f; }

/* 中窄屏页头换行后：右侧恢复自然间距并左对齐，避免更新时间与按钮组贴边、错位 */
@media (max-width: 991px) {
  .v8-overview-head-right {
    align-items: flex-start;
    justify-content: flex-start;
    gap: 10px;
  }

  .v8-overview-head-right .v8-summary-stats {
    justify-content: flex-start;
  }

  .v8-overview-head-right .v8-summary-stats span {
    text-align: left;
  }
}
</style>
