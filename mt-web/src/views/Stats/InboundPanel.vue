<template>
  <div class="inbound-panel">
    <a-row :gutter="14" class="kpi-row">
      <a-col :xs="24" :sm="12" :lg="6">
        <div class="kpi-card">
          <span class="kpi-card__label">接入总量</span>
          <div class="kpi-card__value">{{ overview.totalInbound.toLocaleString() }}</div>
          <span class="kpi-card__hint">当前筛选范围累计</span>
        </div>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <div class="kpi-card">
          <span class="kpi-card__label">当前堆积</span>
          <div class="kpi-card__value">{{ overview.totalBacklog.toLocaleString() }}</div>
          <span class="kpi-card__hint">待消费 / 待处理</span>
        </div>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <div class="kpi-card">
          <span class="kpi-card__label">覆盖机构</span>
          <div class="kpi-card__value">{{ overview.byOrg.length }}</div>
          <span class="kpi-card__hint">有接入数据的机构数</span>
        </div>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <div class="kpi-card">
          <span class="kpi-card__label">供数方数</span>
          <div class="kpi-card__value">{{ overview.bySupplier.length }}</div>
          <span class="kpi-card__hint">当前范围内供数方</span>
        </div>
      </a-col>
    </a-row>

    <a-card class="content-card chart-card" :bordered="false">
      <div class="chart-card__head">
        <h3 class="chart-card__title">{{ trendTitle }}</h3>
        <p class="chart-card__desc">接入量与堆积量变化</p>
      </div>
      <div class="chart-box-wrap" :class="{ 'is-loading': loading }">
        <div ref="trendEl" class="chart-box" />
      </div>
    </a-card>

    <a-row :gutter="14" class="dim-row">
      <a-col :xs="24" :lg="8">
        <a-card class="content-card dim-card" :bordered="false">
          <div class="dim-card__head">
            <h3 class="dim-card__title">按机构</h3>
            <span class="dim-card__count">{{ overview.byOrg.length }} 个</span>
          </div>
          <div class="chart-box-wrap" :class="{ 'is-loading': loading }">
            <div ref="orgEl" class="dim-chart" />
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="8">
        <a-card class="content-card dim-card" :bordered="false">
          <div class="dim-card__head">
            <h3 class="dim-card__title">按接入方案</h3>
            <span class="dim-card__count">{{ overview.byStandard.length }} 个</span>
          </div>
          <div class="chart-box-wrap" :class="{ 'is-loading': loading }">
            <div ref="standardEl" class="dim-chart" />
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="8">
        <a-card class="content-card dim-card" :bordered="false">
          <div class="dim-card__head">
            <h3 class="dim-card__title">按供数方</h3>
            <span class="dim-card__count">{{ overview.bySupplier.length }} 个</span>
          </div>
          <div class="chart-box-wrap" :class="{ 'is-loading': loading }">
            <div ref="supplierEl" class="dim-chart" />
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-card class="content-card" :bordered="false">
      <div class="chart-card__head">
        <h3 class="chart-card__title">组合明细</h3>
        <p class="chart-card__desc">机构 × 接入方案 × 供数方</p>
      </div>
      <a-table
        :columns="detailColumns"
        :data="overview.details"
        :loading="loading"
        row-key="id"
        :pagination="overview.details.length > 10 ? { pageSize: 10 } : false"
        :bordered="false"
        stripe
      >
        <template #org="{ record }">
          <div class="org-cell">
            <div class="cell-main">{{ record.orgName || '—' }}</div>
            <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
          </div>
        </template>
        <template #inbound="{ record }">
          <button type="button" class="num-link" @click="goDetail(record)">
            {{ record.inboundCount.toLocaleString() }}
          </button>
        </template>
        <template #backlog="{ record }">
          <span class="num" :class="{ 'num--warn': record.backlogCount > 500 }">
            {{ record.backlogCount.toLocaleString() }}
          </span>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ECharts } from 'echarts/core'
import type { SupplyAggregateTrend, SupplyDimRow, SupplyStatsOverview, SupplyTimeRange } from '@/mock/mt'
import { formatOrgSub } from '@/utils/orgDisplay'

echarts.use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const props = defineProps<{
  overview: SupplyStatsOverview
  trend: SupplyAggregateTrend
  timeRange: SupplyTimeRange
  loading: boolean
}>()

const router = useRouter()
const trendEl = ref<HTMLDivElement | null>(null)
const orgEl = ref<HTMLDivElement | null>(null)
const standardEl = ref<HTMLDivElement | null>(null)
const supplierEl = ref<HTMLDivElement | null>(null)
let trendChart: ECharts | null = null
let orgChart: ECharts | null = null
let standardChart: ECharts | null = null
let supplierChart: ECharts | null = null

const detailColumns = [
  { title: '机构', dataIndex: 'orgName', slotName: 'org', width: 150 },
  { title: '接入方案', dataIndex: 'standardName', ellipsis: true, tooltip: true },
  { title: '供数方', dataIndex: 'supplierName', width: 120, ellipsis: true, tooltip: true },
  { title: '接入量', dataIndex: 'inboundCount', slotName: 'inbound', width: 110, align: 'center' as const },
  { title: '堆积量', dataIndex: 'backlogCount', slotName: 'backlog', width: 110, align: 'center' as const },
  { title: '最近入库', dataIndex: 'lastInboundAt', width: 168 },
]

const trendTitle = computed(() => {
  const map: Record<SupplyTimeRange, string> = {
    today: '今日趋势',
    '3d': '近3天趋势',
    '1w': '近1周趋势',
    '1m': '近1月趋势',
  }
  return map[props.timeRange] || '趋势'
})

function goDetail(record: { standardId: string; orgId: string; supplierId: string }) {
  router.push({
    path: '/standard/access-data',
    query: {
      schemeId: record.standardId,
      orgId: record.orgId,
      supplierId: record.supplierId,
      range:
        props.timeRange === '3d'
          ? 'd3'
          : props.timeRange === '1w'
            ? 'w1'
            : props.timeRange === '1m'
              ? 'm1'
              : 'today',
    },
  })
}

function shorten(name: string, max = 6) {
  return name.length <= max ? name : `${name.slice(0, max)}…`
}

function ensure(el: HTMLDivElement | null, chart: ECharts | null) {
  if (!el) return null
  if (!chart || chart.getDom() !== el) {
    chart?.dispose()
    return echarts.init(el)
  }
  return chart
}

function stackedOption(rows: SupplyDimRow[]) {
  const categories = rows.slice(0, 8).map((r) => r.name)
  return {
    color: ['#2f6bff', '#f77234'],
    tooltip: { trigger: 'axis' },
    legend: { data: ['接入量', '堆积量'], bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 44, right: 12, top: 28, bottom: categories.length > 4 ? 48 : 36 },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        color: '#86909c',
        fontSize: 11,
        interval: 0,
        rotate: categories.length > 3 ? 28 : 0,
        formatter: (v: string) => shorten(v, 5),
      },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f2f3f5', type: 'dashed' } },
      axisLabel: { color: '#86909c', fontSize: 11 },
    },
    series: [
      { name: '接入量', type: 'bar', stack: 'vol', barMaxWidth: 36, data: rows.slice(0, 8).map((r) => r.inboundCount) },
      { name: '堆积量', type: 'bar', stack: 'vol', barMaxWidth: 36, data: rows.slice(0, 8).map((r) => r.backlogCount) },
    ],
  }
}

function render() {
  trendChart = ensure(trendEl.value, trendChart)
  orgChart = ensure(orgEl.value, orgChart)
  standardChart = ensure(standardEl.value, standardChart)
  supplierChart = ensure(supplierEl.value, supplierChart)
  trendChart?.setOption(
    {
      color: ['#2f6bff', '#f77234'],
      tooltip: { trigger: 'axis' },
      legend: { data: ['接入量', '堆积量'], bottom: 0 },
      grid: { left: 52, right: 24, top: 24, bottom: 44 },
      xAxis: { type: 'category', boundaryGap: false, data: props.trend.dates },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f2f3f5', type: 'dashed' } } },
      series: [
        { name: '接入量', type: 'line', smooth: true, showSymbol: false, data: props.trend.inbound },
        { name: '堆积量', type: 'line', smooth: true, showSymbol: false, data: props.trend.backlog },
      ],
    },
    true,
  )
  orgChart?.setOption(stackedOption(props.overview.byOrg), true)
  standardChart?.setOption(stackedOption(props.overview.byStandard), true)
  supplierChart?.setOption(stackedOption(props.overview.bySupplier), true)
  requestAnimationFrame(() => {
    trendChart?.resize()
    orgChart?.resize()
    standardChart?.resize()
    supplierChart?.resize()
  })
}

watch(
  () => [props.overview, props.trend],
  async () => {
    await nextTick()
    render()
  },
  { deep: true },
)

onMounted(async () => {
  await nextTick()
  render()
  window.addEventListener('resize', render)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', render)
  trendChart?.dispose()
  orgChart?.dispose()
  standardChart?.dispose()
  supplierChart?.dispose()
})
</script>

<style scoped>
.kpi-card {
  padding: 14px 16px;
  margin-bottom: 12px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e6eb;
}
.kpi-card__label {
  font-size: 13px;
  color: #86909c;
}
.kpi-card__value {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.kpi-card__hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #c9cdd4;
}
.chart-card,
.dim-card {
  margin-bottom: 14px;
}
.chart-card__head,
.dim-card__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}
.chart-card__title,
.dim-card__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.chart-card__desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: #86909c;
}
.dim-card__count {
  font-size: 12px;
  color: #86909c;
}
.chart-box {
  height: 260px;
}
.dim-chart {
  height: 220px;
}
.chart-box-wrap.is-loading {
  opacity: 0.55;
}
.num {
  font-variant-numeric: tabular-nums;
}
.num--warn {
  color: #f77234;
}
.num-link {
  border: none;
  background: transparent;
  padding: 0;
  color: #1d2129;
  cursor: pointer;
  font: inherit;
  font-variant-numeric: tabular-nums;
}
.num-link:hover {
  text-decoration: underline;
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
