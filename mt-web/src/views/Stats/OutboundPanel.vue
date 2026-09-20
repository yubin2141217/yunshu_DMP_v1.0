<template>
  <div class="outbound-panel">
    <a-row :gutter="14" class="kpi-row">
      <a-col :xs="24" :sm="12" :lg="6">
        <div class="kpi-card">
          <span class="kpi-card__label">推送成功量</span>
          <div class="kpi-card__value">{{ data.successTotal.toLocaleString() }}</div>
        </div>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <div class="kpi-card">
          <span class="kpi-card__label">推送失败量</span>
          <div class="kpi-card__value num-fail">{{ data.failTotal.toLocaleString() }}</div>
        </div>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <div class="kpi-card">
          <span class="kpi-card__label">成功率</span>
          <div class="kpi-card__value">{{ rateText }}</div>
        </div>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <div class="kpi-card">
          <span class="kpi-card__label">待推积压 / 开启方案</span>
          <div class="kpi-card__value">
            {{ data.backlogSum.toLocaleString() }}
            <span class="kpi-card__sub">/ {{ data.enabledSchemeCount }}</span>
          </div>
        </div>
      </a-col>
    </a-row>

    <a-card class="content-card chart-card" :bordered="false">
      <div class="chart-card__head">
        <h3 class="chart-card__title">推送趋势</h3>
        <p class="chart-card__desc">成功量与失败量</p>
      </div>
      <div class="chart-box-wrap" :class="{ 'is-loading': loading }">
        <div ref="trendEl" class="chart-box" />
      </div>
    </a-card>

    <a-row :gutter="14">
      <a-col :xs="24" :lg="12">
        <a-card class="content-card dim-card" :bordered="false">
          <div class="dim-card__head">
            <h3 class="dim-card__title">按机构</h3>
          </div>
          <div class="chart-box-wrap" :class="{ 'is-loading': loading }">
            <div ref="orgEl" class="dim-chart" />
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card class="content-card dim-card" :bordered="false">
          <div class="dim-card__head">
            <h3 class="dim-card__title">按推送方案</h3>
          </div>
          <div class="chart-box-wrap" :class="{ 'is-loading': loading }">
            <div ref="schemeEl" class="dim-chart" />
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-card class="content-card" :bordered="false">
      <div class="chart-card__head">
        <h3 class="chart-card__title">方案明细</h3>
      </div>
      <a-table
        :columns="columns"
        :data="data.details"
        :loading="loading"
        row-key="id"
        :pagination="data.details.length > 10 ? { pageSize: 10 } : false"
        :bordered="false"
        stripe
      >
        <template #scheme="{ record }">
          <button type="button" class="link-btn" @click="goScheme(record.schemeId)">
            {{ record.schemeName }}
          </button>
        </template>
        <template #org="{ record }">
          <div class="org-cell">
            <div class="cell-main">{{ record.orgName || '—' }}</div>
            <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
          </div>
        </template>
        <template #channel="{ record }">
          {{ channelLabel(record.channelType) }}
        </template>
        <template #ops="{ record }">
          <a-space>
            <a-button type="text" size="mini" @click="goScheme(record.schemeId)">详情</a-button>
            <a-button type="text" size="mini" @click="goData(record.schemeId, record.schemeName)">明细</a-button>
          </a-space>
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
import type { PushDimRow, PushStatsOverview } from '@/api/dashboard'
import { channelLabel } from '@/api/push'
import { formatOrgSub } from '@/utils/orgDisplay'

echarts.use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const props = defineProps<{
  data: PushStatsOverview
  loading: boolean
}>()

const router = useRouter()
const trendEl = ref<HTMLDivElement | null>(null)
const orgEl = ref<HTMLDivElement | null>(null)
const schemeEl = ref<HTMLDivElement | null>(null)
let trendChart: ECharts | null = null
let orgChart: ECharts | null = null
let schemeChart: ECharts | null = null

const rateText = computed(() => (props.data.successRate == null ? '—' : `${props.data.successRate}%`))

const columns = [
  { title: '推送方案', dataIndex: 'schemeName', slotName: 'scheme', ellipsis: true },
  { title: '机构', dataIndex: 'orgName', slotName: 'org', width: 150 },
  { title: '推送方式', dataIndex: 'channelType', slotName: 'channel', width: 160, ellipsis: true, tooltip: true },
  { title: '成功', dataIndex: 'successCount', width: 90, align: 'center' as const },
  { title: '失败', dataIndex: 'failCount', width: 80, align: 'center' as const },
  { title: '积压', dataIndex: 'backlogCount', width: 80, align: 'center' as const },
  { title: '最近推送', dataIndex: 'lastPushAt', width: 160 },
  { title: '操作', slotName: 'ops', width: 120 },
]

function goScheme(id: string) {
  router.push(`/push/schemes/${id}`)
}

function goData(schemeId: string, schemeName: string) {
  router.push({ path: '/push/push-data', query: { schemeId, schemeName } })
}

function ensure(el: HTMLDivElement | null, chart: ECharts | null) {
  if (!el) return null
  if (!chart || chart.getDom() !== el) {
    chart?.dispose()
    return echarts.init(el)
  }
  return chart
}

function barOption(rows: PushDimRow[]) {
  const list = rows.slice(0, 8)
  return {
    color: ['#00b42a', '#f53f3f'],
    tooltip: { trigger: 'axis' },
    legend: { data: ['成功', '失败'], bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 44, right: 12, top: 28, bottom: 40 },
    xAxis: {
      type: 'category',
      data: list.map((r) => r.name),
      axisLabel: {
        color: '#86909c',
        fontSize: 11,
        interval: 0,
        rotate: list.length > 3 ? 24 : 0,
        formatter: (v: string) => (v.length > 6 ? `${v.slice(0, 6)}…` : v),
      },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f2f3f5', type: 'dashed' } },
    },
    series: [
      { name: '成功', type: 'bar', barMaxWidth: 28, data: list.map((r) => r.successCount) },
      { name: '失败', type: 'bar', barMaxWidth: 28, data: list.map((r) => r.failCount) },
    ],
  }
}

function render() {
  trendChart = ensure(trendEl.value, trendChart)
  orgChart = ensure(orgEl.value, orgChart)
  schemeChart = ensure(schemeEl.value, schemeChart)
  trendChart?.setOption(
    {
      color: ['#00b42a', '#f53f3f'],
      tooltip: { trigger: 'axis' },
      legend: { data: ['成功', '失败'], bottom: 0 },
      grid: { left: 52, right: 24, top: 24, bottom: 44 },
      xAxis: { type: 'category', boundaryGap: false, data: props.data.trend.dates },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f2f3f5', type: 'dashed' } } },
      series: [
        { name: '成功', type: 'line', smooth: true, showSymbol: false, data: props.data.trend.success },
        { name: '失败', type: 'line', smooth: true, showSymbol: false, data: props.data.trend.fail },
      ],
    },
    true,
  )
  orgChart?.setOption(barOption(props.data.byOrg), true)
  schemeChart?.setOption(barOption(props.data.byScheme), true)
  requestAnimationFrame(() => {
    trendChart?.resize()
    orgChart?.resize()
    schemeChart?.resize()
  })
}

watch(
  () => props.data,
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
  schemeChart?.dispose()
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
.kpi-card__sub {
  font-size: 14px;
  font-weight: 500;
  color: #86909c;
}
.num-fail {
  color: #f53f3f;
}
.chart-card,
.dim-card {
  margin-bottom: 14px;
}
.chart-card__head,
.dim-card__head {
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
.chart-box {
  height: 260px;
}
.dim-chart {
  height: 220px;
}
.chart-box-wrap.is-loading {
  opacity: 0.55;
}
.link-btn {
  border: none;
  background: transparent;
  padding: 0;
  color: var(--mt-primary, #165dff);
  cursor: pointer;
  font: inherit;
}
.link-btn:hover {
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
