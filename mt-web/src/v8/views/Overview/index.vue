<template>
  <div class="workplace-page">
    <!-- 页头：标题 + 全局时间范围 + 摘要 -->
    <div class="workplace-header">
      <div>
        <h2 class="workplace-title">首页</h2>
        <p class="workplace-desc">数据接入情况统计分析总览，包括入库数据量、供数方等统计总览指标，数据随所选时间范围联动。</p>
      </div>
      <div class="v8-overview-head-right">
        <a-radio-group v-model:model-value="range" type="button" @change="onRangeChange">
          <a-radio value="today">今日</a-radio>
          <a-radio value="3d">近3天</a-radio>
          <a-radio value="7d">近7天</a-radio>
          <a-radio value="1m">近1月</a-radio>
          <a-radio value="2m">近2月</a-radio>
          <a-radio value="3m">近3月</a-radio>
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
                      <div v-if="item.key === 'total' && range !== 'today'" class="kpi-compare">
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
            <span class="v8-zone-hint">本机构数据接入汇总分析，数据随上方时间范围联动</span>
            <a-button type="text" size="mini" @click="goDataCheck()">查看接入明细</a-button>
          </div>
          <!-- 上排：突出展示，趋势宽度对齐 KPI 第 3 张「供数方健康度」右边界（整行 60%），两图等高加高 -->
          <a-row :gutter="[16, 16]">
            <a-col :xs="24" class="v8-col-60">
              <a-card class="content-card v8-panel-card v8-feature-card" :bordered="false">
                <div class="v8-card-head">
                  <span class="v8-card-title-tip">
                    <span class="section-title">接入数据量趋势</span>
                    <a-tooltip content="按所选时间范围以折线图展示各供数方的入库量，一位供数方一条线，便于对比供方之间的数据量差异与走势，随上方时间范围联动。" mini>
                      <IconQuestionCircle class="v8-card-title-info" />
                    </a-tooltip>
                  </span>
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
  IconExclamationCircle,
  IconHeart,
  IconQuestionCircle,
  IconUserGroup,
} from '@arco-design/web-vue/es/icon'
import type { EChartsCoreOption } from 'echarts/core'
import V8Chart from '@/v8/components/V8Chart.vue'
import { getOverview } from '@/v8/api/data'
import type { Overview, OverviewRange } from '@/v8/mock/types'

const router = useRouter()
const loading = ref(false)
const range = ref<OverviewRange>('today')

/** 切换时间范围 */
function onRangeChange() {
  load()
}

/** 下钻到接入日志页时的时间范围映射：该页最多仅支持 3 天（今日/近3天/自定义），超出的范围兜底为近3天 */
const statsRange = computed(() => (range.value === 'today' ? 'today' : '3d'))

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

const C = {
  ok: '#00b42a',
  bad: '#f53f3f',
  warn: '#ff7d00',
  blue: '#1677ff',
  cyan: '#13c2c2',
  purple: '#722ed1',
  gray: '#86909c',
}

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
    tip: '所选时间范围内通过校验并成功入库的数据总条数；同比为较去年同期、环比为较上一等长周期的变化幅度，点击进入接入日志。',
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
])

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

// 接入数据量趋势：随时间范围联动横坐标粒度（今日整点 / 近3天12小时 / 按天）
const trendPoints = computed(() => summary.value.trendSeries.points || [])

/** 横坐标刻度稀疏化：点较多（近 1 月 30 / 近 2 月 60 / 近 3 月 90）时只展示部分标签，避免拥挤重叠 */
function xLabelInterval(len: number): number | ((index: number) => boolean) {
  if (len <= 14) return 0
  const step = len > 60 ? 7 : len > 30 ? 5 : 2
  return (index: number) => index % step === 0 || index === len - 1
}

// 供方折线色板：一位供数方一条线
const TREND_PALETTE = ['#1677ff', '#00b42a', '#ff7d00', '#722ed1', '#13c2c2']

/** 供方顺序与名称（按趋势数据首个出现顺序，避免刷新跳变） */
function trendSupplierMeta() {
  const names: Record<string, string> = {}
  const order: string[] = []
  trendPoints.value.forEach((p) => {
    p.suppliers?.forEach((s) => {
      if (!names[s.supplierId]) {
        names[s.supplierId] = s.supplierName
        order.push(s.supplierId)
      }
    })
  })
  return { names, order }
}

const trendOption = computed<EChartsCoreOption>(() => {
  const points = trendPoints.value
  const { names, order } = trendSupplierMeta()
  const colorOf = (sid: string) => TREND_PALETTE[Math.max(0, order.indexOf(sid)) % TREND_PALETTE.length]
  const series = order.map((sid) => ({
    name: names[sid],
    type: 'line' as const,
    smooth: true,
    showSymbol: points.length <= 14,
    symbolSize: 6,
    lineStyle: { width: 2 },
    itemStyle: { color: colorOf(sid) },
    data: points.map((p) => p.suppliers?.find((s) => s.supplierId === sid)?.inbound ?? 0),
  }))
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#ffffff',
      borderColor: '#e5e6eb',
      borderWidth: 1,
      padding: [9, 12],
      textStyle: { color: '#4e5969', fontSize: 12 },
      extraCssText: 'box-shadow: 0 6px 20px rgba(29,33,41,0.10);border-radius:8px;',
      formatter: (params: unknown) => {
        const arr = params as { seriesName: string; value: number; dataIndex: number }[]
        if (!arr.length) return ''
        const date = points[arr[0].dataIndex]?.date || ''
        const rows = arr
          .map((it) => {
            const sid = order.find((id) => names[id] === it.seriesName)
            const c = sid ? colorOf(sid) : '#86909c'
            return `<div style="display:flex;align-items:center;margin-top:4px">
              <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${c};margin-right:6px"></span>
              <span style="flex:1;color:#4e5969">${it.seriesName}</span>
              <span style="color:#1d2129;font-weight:500;margin-left:14px">入库 ${num(Number(it.value))}</span>
            </div>`
          })
          .join('')
        return `<div style="font-weight:600;color:#1d2129;margin-bottom:2px">${date}</div>${rows}`
      },
    },
    legend: {
      type: 'scroll', top: 0, right: 0, itemWidth: 14, itemHeight: 8,
      textStyle: { fontSize: 12, color: '#4e5969' },
    },
    grid: { left: 56, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: points.map((p) => p.date),
      axisLine: { lineStyle: { color: '#e5e6eb' } },
      axisTick: { show: false },
      axisLabel: { color: '#86909c', fontSize: 11, interval: xLabelInterval(points.length) },
    },
    yAxis: {
      type: 'value',
      name: '单位：条',
      nameTextStyle: { color: '#86909c', fontSize: 11, padding: [0, 0, 0, 28] },
      splitLine: { lineStyle: { color: '#f2f3f5' } },
      axisLabel: { color: '#86909c', formatter: (v: number) => num(v) },
    },
    series,
  }
})

// ── 下钻 ────────────────────────────────────────────────────
/** 查看接入明细：携带当前时间范围跳转接入日志 */
function goDataCheck() {
  router.push({ path: '/v8/data-check', query: { range: statsRange.value } })
}

function onTopSupplierClick(p: { dataIndex?: number }) {
  // 图表为逆序展示，dataIndex 需映射回降序原数组；下钻至接入日志并带上时间范围 + 供方
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

async function load() {
  loading.value = true
  try {
    summary.value = await getOverview(range.value)
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

/* 核心指标现为 4 卡：大屏（lg 及以上）均分整行 */
@media (min-width: 992px) {
  .kpi-row .kpi-col {
    flex: 1 1 0;
    max-width: 25%;
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
   不挤占主数字位置，保证 4 张卡片主数字中心对齐；
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

/* 上排突出图表：可点击图表给出指针反馈 */
:deep(.v8-feature-card) {
  border-color: rgba(22, 119, 255, 0.16);
  box-shadow: 0 6px 20px rgba(22, 119, 255, 0.08);
}
.v8-click-chart {
  cursor: pointer;
}

/* 通用列宽（lg 及以上）：60% 与「接入数据量趋势」右边界（即 KPI 第 3 张右缘）对齐；
   40% 为其右侧。窄屏各占整行。 */
@media (min-width: 992px) {
  .v8-zone :deep(.v8-col-60) {
    flex: 0 0 60%;
    max-width: 60%;
  }
  .v8-zone :deep(.v8-col-40) {
    flex: 0 0 40%;
    max-width: 40%;
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
