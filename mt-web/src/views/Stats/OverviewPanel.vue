<template>
  <div class="overview-panel">
    <div class="kpi-panels">
      <section class="kpi-panel kpi-panel--inbound">
        <header class="kpi-panel__head">
          <div class="kpi-panel__title-wrap">
            <span class="kpi-panel__badge" aria-hidden="true"><IconFile /></span>
            <div>
              <h3 class="kpi-panel__title">接入概况</h3>
              <p class="kpi-panel__sub">当前筛选范围内的接入侧核心指标</p>
            </div>
          </div>
        </header>
        <div class="kpi-grid kpi-grid--primary">
          <button
            v-for="card in inboundPrimary"
            :key="card.key"
            type="button"
            class="kpi-card"
            :class="[`kpi-card--${card.tone}`, { 'kpi-card--clickable': !!card.onClick }]"
            @click="card.onClick?.()"
          >
            <div class="kpi-card__top">
              <span class="kpi-card__icon" aria-hidden="true"><component :is="card.icon" /></span>
              <span class="kpi-card__label">
                {{ card.label }}
                <a-tooltip :content="card.tip">
                  <IconInfoCircle class="kpi-card__tip" @click.stop />
                </a-tooltip>
              </span>
            </div>
            <div class="kpi-card__value">{{ card.display }}</div>
            <div class="kpi-card__hint">{{ card.hint }}</div>
          </button>
        </div>
        <div class="kpi-meta kpi-meta--inbound">
          <div v-for="item in inboundMeta" :key="item.key" class="kpi-meta__card" :class="`kpi-meta__card--${item.tone}`">
            <div class="kpi-meta__card-top">
              <span class="kpi-meta__icon" aria-hidden="true"><component :is="item.icon" /></span>
              <span class="kpi-meta__label">
                {{ item.label }}
                <a-tooltip :content="item.tip">
                  <IconInfoCircle class="kpi-meta__tip" />
                </a-tooltip>
              </span>
            </div>
            <div class="kpi-meta__value" :class="{ 'is-fail': item.danger }">{{ item.display }}</div>
          </div>
        </div>
      </section>

      <section class="kpi-panel kpi-panel--push">
        <header class="kpi-panel__head">
          <div class="kpi-panel__title-wrap">
            <span class="kpi-panel__badge kpi-panel__badge--green" aria-hidden="true"><IconSend /></span>
            <div>
              <h3 class="kpi-panel__title">推送概况</h3>
              <p class="kpi-panel__sub">当前筛选范围内的推送侧吞吐与质量</p>
            </div>
          </div>
        </header>
        <div class="kpi-grid kpi-grid--primary">
          <button
            v-for="card in pushPrimary"
            :key="card.key"
            type="button"
            class="kpi-card"
            :class="[`kpi-card--${card.tone}`, { 'kpi-card--clickable': !!card.onClick }]"
            @click="card.onClick?.()"
          >
            <div class="kpi-card__top">
              <span class="kpi-card__icon" aria-hidden="true"><component :is="card.icon" /></span>
              <span class="kpi-card__label">
                {{ card.label }}
                <a-tooltip :content="card.tip">
                  <IconInfoCircle class="kpi-card__tip" @click.stop />
                </a-tooltip>
              </span>
            </div>
            <div class="kpi-card__value" :class="{ 'is-fail': card.tone === 'danger' }">{{ card.display }}</div>
            <div class="kpi-card__hint">{{ card.hint }}</div>
          </button>
        </div>
        <div class="kpi-meta kpi-meta--push">
          <div v-for="item in pushMeta" :key="item.key" class="kpi-meta__card" :class="`kpi-meta__card--${item.tone}`">
            <div class="kpi-meta__card-top">
              <span class="kpi-meta__icon" aria-hidden="true"><component :is="item.icon" /></span>
              <span class="kpi-meta__label">
                {{ item.label }}
                <a-tooltip :content="item.tip">
                  <IconInfoCircle class="kpi-meta__tip" />
                </a-tooltip>
              </span>
            </div>
            <div class="kpi-meta__value" :class="{ 'is-fail': item.danger }">{{ item.display }}</div>
          </div>
        </div>
      </section>
    </div>

    <a-card class="content-card chart-card" :bordered="false">
      <div class="chart-card__head">
        <div>
          <h3 class="chart-card__title">数据接入 vs 推送趋势</h3>
          <p class="chart-card__desc">当前时间跨度与机构筛选下的接入量与推送成功量对比</p>
        </div>
      </div>
      <div class="chart-box-wrap" :class="{ 'is-loading': loading }">
        <div ref="flowTrendEl" class="chart-box" />
      </div>
    </a-card>

    <!-- ===== 综合看板下半区：仅本页 Overview ===== -->
    <!-- 1) 接入/推送明细（无「维度明细」总标题） -->
    <section class="section-block">
      <div class="section-block__grid">
        <a-card class="content-card detail-card detail-card--tall" :bordered="false">
          <div class="detail-card__head detail-card__head--row">
            <h3 class="detail-card__title">接入统计</h3>
            <button type="button" class="text-link" @click="goAccessData()">查看接入数据 →</button>
          </div>
          <a-tabs v-model:active-key="inboundDimTab" type="rounded" size="small" class="dim-tabs dim-tabs--nav-only">
            <a-tab-pane key="org" title="按机构" />
            <a-tab-pane key="scheme" title="按方案" />
            <a-tab-pane key="supplier" title="按供数方" />
          </a-tabs>
          <div class="dim-chart-wrap" :class="{ 'is-loading': loading }">
            <div ref="inboundDimChartEl" class="dim-chart" />
          </div>
          <a-table
            class="roomy-table linked-height-table"
            :columns="inboundDimColumns"
            :data="inboundDimRows"
            :pagination="false"
            row-key="id"
            :bordered="false"
            :scroll="{ y: linkedBodyHeight }"
            :style="{ '--linked-body-h': `${linkedBodyHeight}px` }"
          >
            <template #name="{ record }">
              <button
                v-if="inboundDimTab === 'scheme'"
                type="button"
                class="link-btn"
                @click="goStandard(record.id)"
              >
                {{ record.name }}
              </button>
              <button
                v-else-if="inboundDimTab === 'org'"
                type="button"
                class="link-btn org-cell-btn"
                @click="goAccessData(record.id, record.name)"
              >
                <div class="cell-main">{{ record.name }}</div>
                <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
              </button>
              <button
                v-else
                type="button"
                class="link-btn"
                @click="drillInboundDim(record)"
              >
                {{ record.name }}
              </button>
            </template>
            <template #inbound="{ record }">
              <button
                type="button"
                class="link-btn"
                @click="drillInboundDim(record)"
              >
                {{ Number(record.inboundCount || 0).toLocaleString() }}
              </button>
            </template>
            <template #schemeCount="{ record }">
              <button
                type="button"
                class="link-btn num"
                @click="goStandardListByDim(record)"
              >
                {{ Number(record.schemeCount || 0).toLocaleString() }}
              </button>
            </template>
          </a-table>
          <a-empty v-if="!inboundDimRows.length" description="暂无接入数据" />
        </a-card>

        <a-card class="content-card detail-card detail-card--tall" :bordered="false">
          <div class="detail-card__head detail-card__head--row">
            <h3 class="detail-card__title">推送统计</h3>
            <button type="button" class="text-link" @click="router.push('/push/push-data')">查看推送数据 →</button>
          </div>
          <a-tabs v-model:active-key="pushDimTab" type="rounded" size="small" class="dim-tabs dim-tabs--nav-only">
            <a-tab-pane key="org" title="按机构" />
            <a-tab-pane key="scheme" title="按方案" />
          </a-tabs>
          <div class="dim-chart-wrap" :class="{ 'is-loading': loading }">
            <div ref="pushDimChartEl" class="dim-chart" />
          </div>
          <a-table
            class="roomy-table linked-height-table"
            :columns="pushDimColumns"
            :data="pushDimRows"
            :pagination="false"
            row-key="id"
            :bordered="false"
            :scroll="{ y: linkedBodyHeight }"
            :style="{ '--linked-body-h': `${linkedBodyHeight}px` }"
          >
            <template #name="{ record }">
              <button
                v-if="pushDimTab === 'scheme'"
                type="button"
                class="link-btn"
                @click="drillPushDim(record)"
              >
                {{ record.name }}
              </button>
              <button
                v-else
                type="button"
                class="link-btn org-cell-btn"
                @click="drillPushDim(record)"
              >
                <div class="cell-main">{{ record.name }}</div>
                <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
              </button>
            </template>
            <template #pushSchemeCount="{ record }">
              <button
                type="button"
                class="link-btn num"
                @click="goPushSchemeList(record)"
              >
                {{ Number(record.schemeCount || 0).toLocaleString() }}
              </button>
            </template>
            <template #pushCount="{ record }">
              <button
                type="button"
                class="link-btn num"
                @click="drillPushDim(record, '推送量')"
              >
                {{ pushTotalOf(record).toLocaleString() }}
              </button>
            </template>
            <template #success="{ record }">
              <button
                type="button"
                class="link-btn num"
                @click="drillPushDim(record, '成功')"
              >
                {{ Number(record.successCount || 0).toLocaleString() }}
              </button>
            </template>
            <template #fail="{ record }">
              <button
                type="button"
                class="link-btn"
                :class="Number(record.failCount) > 0 ? 'num-fail' : 'num'"
                @click="drillPushDim(record, '失败')"
              >
                {{ Number(record.failCount || 0).toLocaleString() }}
              </button>
            </template>
            <template #rate="{ record }">
              <span class="num">{{ record.successRate == null ? '—' : `${record.successRate}%` }}</span>
            </template>
            <template #pushOrg="{ record }">
              <button
                type="button"
                class="link-btn org-cell-btn"
                @click="goPushDataByOrg(record)"
              >
                <div class="org-cell">
                  <div class="cell-main">{{ record.orgName || '—' }}</div>
                  <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
                </div>
              </button>
            </template>
            <template #org="{ record }">
              <div class="org-cell">
                <div class="cell-main">{{ record.orgName || '—' }}</div>
                <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
              </div>
            </template>
          </a-table>
          <a-empty v-if="!pushDimRows.length" description="暂无推送数据" />
        </a-card>
      </div>
    </section>

    <!-- 接入异常 / 推送异常 -->
    <section class="section-block section-block--last">
      <div class="section-block__grid">
        <a-card class="content-card detail-card" :bordered="false">
          <div class="detail-card__head detail-card__head--row">
            <div>
              <h3 class="detail-card__title">接入异常</h3>
              <p class="detail-card__desc">零接入方案与高堆积方案，优先排查接入链路</p>
            </div>
            <span class="detail-chip">{{ inboundAlertCount }} 项</span>
          </div>
          <a-tabs v-model:active-key="inboundAlertTab" type="rounded" size="small" class="dim-tabs">
            <a-tab-pane key="zero" :title="`零接入 ${data.zeroInboundAlerts.length}`">
              <p class="alert-tab-tip">近3天无数据接入的方案</p>
              <a-table
                v-if="data.zeroInboundAlerts.length"
                class="roomy-table fixed-height-table"
                :columns="zeroInboundColumns"
                :data="data.zeroInboundAlerts"
                :pagination="false"
                :scroll="{ y: 520 }"
                row-key="id"
                :bordered="false"
              >
                <template #name="{ record }">
                  <button type="button" class="link-btn" @click="goStandard(record.id)">{{ record.name }}</button>
                </template>
                <template #org="{ record }">
                  <div class="org-cell">
                    <div class="cell-main">{{ record.orgName || '—' }}</div>
                    <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
                  </div>
                </template>
              </a-table>
              <a-empty v-else description="暂无零接入方案" />
            </a-tab-pane>
            <a-tab-pane key="backlog" :title="`高堆积 ${inboundBacklogTop.length}`">
              <p class="alert-tab-tip">当前接入堆积数据量超过100条的方案</p>
              <a-table
                v-if="inboundBacklogTop.length"
                class="roomy-table fixed-height-table"
                :columns="inboundBacklogColumns"
                :data="inboundBacklogTop"
                :pagination="false"
                :scroll="{ y: 520 }"
                row-key="id"
                :bordered="false"
              >
                <template #name="{ record }">
                  <button type="button" class="link-btn" @click="goStandard(record.id)">{{ record.name }}</button>
                </template>
                <template #org="{ record }">
                  <div class="org-cell">
                    <div class="cell-main">{{ record.orgName || '—' }}</div>
                    <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
                  </div>
                </template>
                <template #backlog="{ record }">
                  <span class="num-warn">{{ record.backlogCount.toLocaleString() }}</span>
                </template>
              </a-table>
              <a-empty v-else description="暂无高堆积方案" />
            </a-tab-pane>
          </a-tabs>
        </a-card>

        <a-card class="content-card detail-card" :bordered="false">
          <div class="detail-card__head detail-card__head--row">
            <div>
              <h3 class="detail-card__title">推送异常</h3>
              <p class="detail-card__desc">关注高失败率与高积压方案，便于值班排障</p>
            </div>
            <span class="push-alert-count">{{ pushAlertSchemeCount }} 项</span>
          </div>
          <a-tabs v-model:active-key="pushAlertTab" type="rounded" size="small" class="dim-tabs">
            <a-tab-pane key="fail" :title="`高失败率 ${data.failTopN.length}`">
              <p class="alert-tab-tip">近3天推送总失败率超过10%的方案</p>
              <a-table
                v-if="data.failTopN.length"
                class="roomy-table fixed-height-table"
                :columns="failTopColumns"
                :data="data.failTopN"
                :pagination="false"
                :scroll="{ y: 520 }"
                row-key="id"
                :bordered="false"
              >
                <template #name="{ record }">
                  <button type="button" class="link-btn" @click="goPushScheme(record.id)">{{ record.name }}</button>
                </template>
                <template #org="{ record }">
                  <div class="org-cell">
                    <div class="cell-main">{{ record.orgName || '—' }}</div>
                    <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
                  </div>
                </template>
                <template #value="{ record }">
                  <span class="num-fail">{{ record.value }}%</span>
                </template>
              </a-table>
              <a-empty v-else description="暂无失败数据" />
            </a-tab-pane>
            <a-tab-pane key="backlog" :title="`高堆积 ${data.backlogTopN.length}`">
              <p class="alert-tab-tip">当前推送堆积数据量超过100条的方案</p>
              <a-table
                v-if="data.backlogTopN.length"
                class="roomy-table fixed-height-table"
                :columns="backlogTopColumns"
                :data="data.backlogTopN"
                :pagination="false"
                :scroll="{ y: 520 }"
                row-key="id"
                :bordered="false"
              >
                <template #name="{ record }">
                  <button type="button" class="link-btn" @click="goPushScheme(record.id)">{{ record.name }}</button>
                </template>
                <template #org="{ record }">
                  <div class="org-cell">
                    <div class="cell-main">{{ record.orgName || '—' }}</div>
                    <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
                  </div>
                </template>
                <template #value="{ record }">
                  <span class="num-warn">{{ record.value.toLocaleString() }}</span>
                </template>
              </a-table>
              <a-empty v-else description="暂无积压" />
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ECharts } from 'echarts/core'
import {
  IconApps,
  IconCheckCircle,
  IconCloseCircle,
  IconCommon,
  IconFile,
  IconInfoCircle,
  IconList,
  IconSend,
  IconStorage,
  IconUserGroup,
} from '@arco-design/web-vue/es/icon'
import type { DashboardOverview } from '@/api/dashboard'
import { formatOrgSub } from '@/utils/orgDisplay'

echarts.use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const props = defineProps<{
  data: DashboardOverview
  loading: boolean
  timeRange: string
  orgIds: string[]
}>()

const router = useRouter()
const flowTrendEl = ref<HTMLDivElement | null>(null)
const inboundDimChartEl = ref<HTMLDivElement | null>(null)
const pushDimChartEl = ref<HTMLDivElement | null>(null)
let flowChart: ECharts | null = null
let inboundDimChart: ECharts | null = null
let pushDimChart: ECharts | null = null
const inboundDimTab = ref('org')
const pushDimTab = ref('org')
const inboundAlertTab = ref('zero')
const pushAlertTab = ref('fail')

interface KpiCard {
  key: string
  label: string
  display: string
  tip: string
  hint: string
  tone: 'blue' | 'cyan' | 'violet' | 'orange' | 'green' | 'danger' | 'slate'
  icon: Component
  onClick?: () => void
}

interface KpiMetaItem {
  key: string
  label: string
  display: string
  tip: string
  tone: 'blue' | 'cyan' | 'violet' | 'orange' | 'green' | 'danger' | 'slate'
  icon: Component
  danger?: boolean
}

const failTopColumns = [
  { title: '推送方案', dataIndex: 'name', slotName: 'name', ellipsis: true, width: 200 },
  { title: '机构', dataIndex: 'orgName', slotName: 'org', ellipsis: true, width: 170 },
  { title: '失败率', dataIndex: 'value', slotName: 'value', width: 96 },
]

const backlogTopColumns = [
  { title: '推送方案', dataIndex: 'name', slotName: 'name', ellipsis: true, width: 200 },
  { title: '机构', dataIndex: 'orgName', slotName: 'org', ellipsis: true, width: 170 },
  { title: '堆积量', dataIndex: 'value', slotName: 'value', width: 96 },
]

const zeroInboundColumns = [
  { title: '接入方案', dataIndex: 'name', slotName: 'name', ellipsis: true, width: 200 },
  { title: '机构', dataIndex: 'orgName', slotName: 'org', ellipsis: true, width: 170 },
  { title: '最近接入', dataIndex: 'lastAccessAt', width: 136 },
]

const inboundBacklogColumns = [
  { title: '接入方案', dataIndex: 'name', slotName: 'name', ellipsis: true, width: 200 },
  { title: '机构', dataIndex: 'orgName', slotName: 'org', ellipsis: true, width: 170 },
  { title: '接入量', dataIndex: 'inboundCount', width: 104 },
  { title: '堆积量', dataIndex: 'backlogCount', slotName: 'backlog', width: 96 },
]

const inboundDimColumns = computed(() => {
  const tab = inboundDimTab.value
  const showSchemeCount = tab !== 'scheme'
  const nameTitle = tab === 'scheme' ? '接入方案' : tab === 'supplier' ? '供数方' : '机构'
  return [
    {
      title: nameTitle,
      dataIndex: 'name',
      slotName: 'name',
      ellipsis: true,
      ...(tab === 'org' ? { width: 120 } : {}),
    },
    ...(showSchemeCount
      ? [{ title: '方案数', dataIndex: 'schemeCount', slotName: 'schemeCount', width: 88 }]
      : []),
    { title: '接入量', dataIndex: 'inboundCount', slotName: 'inbound', width: 108 },
    { title: '堆积', dataIndex: 'backlogCount', width: 88 },
  ]
})

const inboundDimRows = computed(() => {
  if (inboundDimTab.value === 'scheme') return props.data.inboundByStandard || []
  if (inboundDimTab.value === 'supplier') return props.data.inboundBySupplier || []
  return props.data.inboundByOrg || []
})

const pushDimColumns = computed(() => {
  if (pushDimTab.value === 'org') {
    return [
      { title: '机构', dataIndex: 'name', slotName: 'name', ellipsis: true, width: 120 },
      { title: '方案数', dataIndex: 'schemeCount', slotName: 'pushSchemeCount', width: 72 },
      { title: '推送量', dataIndex: 'pushCount', slotName: 'pushCount', width: 88 },
      { title: '成功', dataIndex: 'successCount', slotName: 'success', width: 72 },
      { title: '失败', dataIndex: 'failCount', slotName: 'fail', width: 64 },
      { title: '积压', dataIndex: 'backlogCount', width: 64 },
      { title: '成功率', dataIndex: 'successRate', slotName: 'rate', width: 76 },
    ]
  }
  return [
    { title: '推送方案', dataIndex: 'name', slotName: 'name', ellipsis: true },
    { title: '机构', dataIndex: 'orgName', slotName: 'pushOrg', ellipsis: true, width: 120 },
    { title: '推送量', dataIndex: 'pushCount', slotName: 'pushCount', width: 88 },
    { title: '成功', dataIndex: 'successCount', slotName: 'success', width: 72 },
    { title: '失败', dataIndex: 'failCount', slotName: 'fail', width: 64 },
    { title: '积压', dataIndex: 'backlogCount', width: 64 },
    { title: '成功率', dataIndex: 'successRate', slotName: 'rate', width: 76 },
  ]
})

const pushDimRows = computed(() =>
  pushDimTab.value === 'org' ? props.data.pushByOrg || [] : props.data.pushByScheme || [],
)

const ROW_HEIGHT = 52
const linkedRowCount = computed(() => {
  const maxLen = Math.max(inboundDimRows.value.length, pushDimRows.value.length)
  return maxLen > 4 ? 8 : 4
})
const linkedBodyHeight = computed(() => linkedRowCount.value * ROW_HEIGHT)

// 高堆积：当前接入堆积数据量超过 100 条的方案，按堆积量从大到小
const inboundBacklogTop = computed(() =>
  props.data.inboundByStandard
    .filter((r) => r.backlogCount > 100)
    .slice()
    .sort((a, b) => b.backlogCount - a.backlogCount)
    .slice(0, 11),
)

const inboundAlertCount = computed(
  () => props.data.zeroInboundAlerts.length + inboundBacklogTop.value.length,
)

const pushAlertSchemeCount = computed(() => {
  const ids = new Set<string>()
  props.data.failTopN.forEach((r) => ids.add(r.id))
  props.data.backlogTopN.forEach((r) => ids.add(r.id))
  return ids.size
})

const inboundPrimary = computed<KpiCard[]>(() => {
  const d = props.data
  return [
    {
      key: 'in-total',
      label: '接入数据总量',
      display: d.inboundTotal.toLocaleString(),
      tip: '当前时间跨度与机构筛选下，各接入方案累计入库条数之和',
      hint: '可下钻至接入数据明细',
      tone: 'blue',
      icon: IconFile,
      onClick: () =>
        router.push({
          path: '/standard/access-data',
          query: { range: mapRange(props.timeRange), ...(props.orgIds[0] ? { orgId: props.orgIds[0] } : {}) },
        }),
    },
    {
      key: 'in-scheme',
      label: '接入方案数',
      display: String(d.inboundSchemeCount),
      tip: '当前筛选范围内开启的接入方案数量',
      hint: '含有流量或已开启方案',
      tone: 'cyan',
      icon: IconFile,
      onClick: () => router.push('/standard'),
    },
    {
      key: 'in-backlog',
      label: '当前堆积量',
      display: d.inboundBacklog.toLocaleString(),
      tip: '待消费 / 待处理的接入侧积压条数，反映消费滞后程度',
      hint: '待消费积压',
      tone: 'orange',
      icon: IconStorage,
    },
  ]
})

const inboundMeta = computed<KpiMetaItem[]>(() => {
  const d = props.data
  return [
    {
      key: 'in-org',
      label: '机构',
      display: String(d.inboundOrgCount),
      tip: '覆盖机构数：当前筛选范围内有接入数据的机构去重计数',
      tone: 'blue',
      icon: IconApps,
    },
    {
      key: 'in-supplier',
      label: '供数方',
      display: String(d.supplierCount),
      tip: '供数方数：当前筛选范围内有接入数据的供数方去重计数',
      tone: 'cyan',
      icon: IconUserGroup,
    },
    {
      key: 'in-field',
      label: '字段',
      display: String(d.inboundFieldCount),
      tip: '接入字段数：开启接入方案勾选字段的去重总数',
      tone: 'violet',
      icon: IconList,
    },
  ]
})

const pushPrimary = computed<KpiCard[]>(() => {
  const d = props.data
  const rateText = d.successRate == null ? '—' : `${d.successRate}%`
  return [
    {
      key: 'out-success',
      label: '推送成功总量',
      display: d.pushSuccess.toLocaleString(),
      tip: '当前时间跨度与机构筛选下，各推送方案成功推送条数之和',
      hint: '可下钻至推送数据明细',
      tone: 'green',
      icon: IconCheckCircle,
      onClick: () => router.push('/push/push-data'),
    },
    {
      key: 'out-scheme',
      label: '推送方案数',
      display: String(d.pushSchemeCount),
      tip: '当前筛选范围内的推送方案数量（优先统计开启态）',
      hint: '跳转推送方案列表',
      tone: 'cyan',
      icon: IconSend,
      onClick: () => router.push('/push/schemes'),
    },
    {
      key: 'out-rate',
      label: '推送成功率',
      display: rateText,
      tip: '成功 / (成功 + 失败)；无推送流量时显示「—」',
      hint: '成功 ÷ (成功+失败)',
      tone: 'green',
      icon: IconCommon,
      onClick: () => router.push('/push/schemes'),
    },
  ]
})

const pushMeta = computed<KpiMetaItem[]>(() => {
  const d = props.data
  return [
    {
      key: 'out-org',
      label: '机构',
      display: String(d.pushOrgCount),
      tip: '覆盖机构数：推送方案所属机构去重计数',
      tone: 'green',
      icon: IconApps,
    },
    {
      key: 'out-backlog',
      label: '积压',
      display: d.backlogSum.toLocaleString(),
      tip: '待推积压量：各推送方案 backlog 合计',
      tone: 'orange',
      icon: IconStorage,
    },
    {
      key: 'out-fail',
      label: '失败',
      display: d.pushFail.toLocaleString(),
      tip: '推送失败量：当前筛选范围内失败条数合计',
      tone: 'danger',
      icon: IconCloseCircle,
      danger: true,
    },
  ]
})

function mapRange(r: string) {
  if (r === 'today') return 'today'
  if (r === '3d') return 'd3'
  if (r === '1w') return 'w1'
  if (r === '1m') return 'm1'
  return 'total'
}

function goPushScheme(id: string) {
  router.push(`/push/schemes/${id}`)
}

/** 推送方案管理列表：携带机构筛选条件 */
function goPushSchemeList(row: { id: string; name: string }) {
  if (!row?.id || row.id === 'unknown') return
  router.push({ path: '/push/schemes', query: { orgId: row.id, orgName: row.name } })
}

/** 推送量 = 成功 + 失败 */
function pushTotalOf(record: { successCount?: number; failCount?: number }) {
  return Number(record?.successCount || 0) + Number(record?.failCount || 0)
}

function goStandard(id: string) {
  router.push(`/standard/${id}`)
}

function goStandardListByDim(row: { id: string; name: string }) {
  const query: Record<string, string> = {}
  if (inboundDimTab.value === 'org') {
    query.orgId = row.id
    query.orgName = row.name
  } else if (inboundDimTab.value === 'supplier') {
    query.supplierId = row.id
    query.supplierName = row.name
  }
  if (!Object.keys(query).length) return
  router.push({ path: '/standard', query })
}

function goAccessData(orgId?: string, orgName?: string) {
  router.push({
    path: '/standard/access-data',
    query: {
      ...(orgId ? { orgId, ...(orgName ? { orgName } : {}) } : {}),
      range: mapRange(props.timeRange),
    },
  })
}

function drillInboundDim(row: { id: string; name: string }) {
  const query: Record<string, string> = { range: mapRange(props.timeRange) }
  if (inboundDimTab.value === 'org') {
    query.orgId = row.id
    query.orgName = row.name
  } else if (inboundDimTab.value === 'scheme') {
    query.schemeId = row.id
    query.schemeName = row.name
    if (props.orgIds[0]) query.orgId = props.orgIds[0]
  } else {
    query.supplierId = row.id
    query.supplierName = row.name
    if (props.orgIds[0]) query.orgId = props.orgIds[0]
  }
  router.push({ path: '/standard/access-data', query })
}

function drillPushDim(
  row: { id: string; name: string; orgId?: string; orgName?: string },
  seriesName?: string,
) {
  const query: Record<string, string> = { range: mapRange(props.timeRange) }
  if (pushDimTab.value === 'org') {
    query.orgId = row.id
    query.orgName = row.name
  } else {
    query.schemeId = row.id
    query.schemeName = row.name
    if (row.orgId) {
      query.orgId = row.orgId
      if (row.orgName && row.orgName !== '—') query.orgName = row.orgName
    } else if (props.orgIds[0]) {
      query.orgId = props.orgIds[0]
    }
  }
  if (seriesName === '失败') query.pushResult = 'fail'
  else if (seriesName === '成功') query.pushResult = 'success'
  router.push({ path: '/push/push-data', query })
}

function goPushDataByOrg(record: { orgId?: string; orgName?: string }) {
  if (!record.orgId) return
  const query: Record<string, string> = { range: mapRange(props.timeRange), orgId: record.orgId }
  if (record.orgName && record.orgName !== '—') query.orgName = record.orgName
  router.push({ path: '/push/push-data', query })
}

function shortenLabel(name: string, max = 6) {
  return name.length <= max ? name : `${name.slice(0, max)}…`
}

function ensureChart(el: HTMLDivElement | null, chart: ECharts | null) {
  if (!el) return null
  if (!chart || chart.getDom() !== el) {
    chart?.dispose()
    return echarts.init(el)
  }
  return chart
}

function renderFlowTrend() {
  if (!flowTrendEl.value) return
  flowChart = ensureChart(flowTrendEl.value, flowChart)
  if (!flowChart) return
  const { dates, inbound, push } = props.data.flowTrend
  flowChart.setOption(
    {
      color: ['#165dff', '#00b42a'],
      tooltip: { trigger: 'axis' },
      legend: { data: ['数据接入', '推送成功'], bottom: 0 },
      grid: { left: 48, right: 24, top: 24, bottom: 48 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLabel: { color: '#86909c', fontSize: 11 },
        axisLine: { lineStyle: { color: '#e5e6eb' } },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f2f3f5', type: 'dashed' } },
        axisLabel: { color: '#86909c', fontSize: 11 },
      },
      series: [
        {
          name: '数据接入',
          type: 'line',
          data: inbound,
          smooth: true,
          showSymbol: false,
          areaStyle: { color: 'rgba(22,93,255,0.08)' },
        },
        {
          name: '推送成功',
          type: 'line',
          data: push,
          smooth: true,
          showSymbol: false,
          areaStyle: { color: 'rgba(0,180,42,0.08)' },
        },
      ],
    },
    true,
  )
  flowChart.resize()
}

function renderInboundDimChart() {
  if (!inboundDimChartEl.value) return
  inboundDimChart = ensureChart(inboundDimChartEl.value, inboundDimChart)
  if (!inboundDimChart) return
  const rows = inboundDimRows.value.slice(0, 8)
  const cats = rows.map((r) => shortenLabel(r.name, 5))
  inboundDimChart.setOption(
    {
      color: ['#165dff', '#ff7d00'],
      tooltip: { trigger: 'axis' },
      legend: { data: ['接入量', '堆积'], top: 0, right: 0, textStyle: { fontSize: 11, color: '#86909c' } },
      grid: { left: 44, right: 12, top: 28, bottom: 28 },
      xAxis: {
        type: 'category',
        data: cats,
        axisLabel: { color: '#86909c', fontSize: 11 },
        axisLine: { lineStyle: { color: '#e5e6eb' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f2f3f5', type: 'dashed' } },
        axisLabel: { color: '#86909c', fontSize: 11 },
      },
      series: [
        {
          name: '接入量',
          type: 'bar',
          stack: 'in',
          barMaxWidth: 28,
          cursor: 'pointer',
          data: rows.map((r) => r.inboundCount),
          itemStyle: { borderRadius: [0, 0, 0, 0] },
        },
        {
          name: '堆积',
          type: 'bar',
          stack: 'in',
          barMaxWidth: 28,
          cursor: 'pointer',
          data: rows.map((r) => r.backlogCount),
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
    },
    true,
  )
  inboundDimChart.off('click')
  inboundDimChart.on('click', (params) => {
    if (params.componentType !== 'series') return
    const row = rows[params.dataIndex]
    if (!row?.id) return
    drillInboundDim(row)
  })
  inboundDimChart.resize()
}

function renderPushDimChart() {
  if (!pushDimChartEl.value) return
  pushDimChart = ensureChart(pushDimChartEl.value, pushDimChart)
  if (!pushDimChart) return
  const rows = pushDimRows.value
    .slice()
    .sort((a, b) => b.successCount + b.failCount - (a.successCount + a.failCount))
    .slice(0, 8)
  const cats = rows.map((r) => shortenLabel(r.name, 5))
  pushDimChart.setOption(
    {
      color: ['#00b42a', '#f53f3f', '#ff7d00'],
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['成功', '失败', '积压'],
        top: 0,
        right: 0,
        textStyle: { fontSize: 11, color: '#86909c' },
      },
      grid: { left: 44, right: 12, top: 28, bottom: 28 },
      xAxis: {
        type: 'category',
        data: cats,
        axisLabel: { color: '#86909c', fontSize: 11 },
        axisLine: { lineStyle: { color: '#e5e6eb' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f2f3f5', type: 'dashed' } },
        axisLabel: { color: '#86909c', fontSize: 11 },
      },
      series: [
        {
          name: '成功',
          type: 'bar',
          stack: 'out',
          barMaxWidth: 28,
          cursor: 'pointer',
          data: rows.map((r) => r.successCount),
        },
        {
          name: '失败',
          type: 'bar',
          stack: 'out',
          barMaxWidth: 28,
          cursor: 'pointer',
          data: rows.map((r) => r.failCount),
        },
        {
          name: '积压',
          type: 'bar',
          stack: 'out',
          barMaxWidth: 28,
          cursor: 'pointer',
          data: rows.map((r) => r.backlogCount),
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
    },
    true,
  )
  pushDimChart.off('click')
  pushDimChart.on('click', (params) => {
    if (params.componentType !== 'series') return
    const row = rows[params.dataIndex]
    if (!row?.id) return
    drillPushDim(row, String(params.seriesName || ''))
  })
  pushDimChart.resize()
}

function renderDimCharts() {
  renderInboundDimChart()
  renderPushDimChart()
}

function onResize() {
  flowChart?.resize()
  inboundDimChart?.resize()
  pushDimChart?.resize()
}

watch(
  () => props.data,
  async () => {
    await nextTick()
    renderFlowTrend()
    renderDimCharts()
  },
  { deep: true },
)

watch([inboundDimTab, pushDimTab], async () => {
  await nextTick()
  renderDimCharts()
})

onMounted(async () => {
  await nextTick()
  renderFlowTrend()
  renderDimCharts()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  flowChart?.dispose()
  inboundDimChart?.dispose()
  pushDimChart?.dispose()
  flowChart = null
  inboundDimChart = null
  pushDimChart = null
})
</script>

<style scoped>
.kpi-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
  align-items: stretch;
}

@media (max-width: 1200px) {
  .kpi-panels {
    grid-template-columns: 1fr;
  }
}

.kpi-panel {
  margin-bottom: 0;
  padding: 18px 16px 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e8eaef;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.03);
  min-width: 0;
  position: relative;
  overflow: hidden;
}

.kpi-panel::after {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  pointer-events: none;
}

.kpi-panel--inbound {
  background: linear-gradient(165deg, #f5f9ff 0%, #fff 42%);
}

.kpi-panel--inbound::after {
  background: linear-gradient(90deg, #165dff, #69b1ff);
}

.kpi-panel--push {
  background: linear-gradient(165deg, #f4fff8 0%, #fff 42%);
}

.kpi-panel--push::after {
  background: linear-gradient(90deg, #00b42a, #7be188);
}

.kpi-panel__head {
  margin-bottom: 14px;
}

.kpi-panel__title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kpi-panel__badge {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #165dff;
  background: linear-gradient(145deg, rgba(22, 93, 255, 0.14), rgba(22, 93, 255, 0.06));
  box-shadow: inset 0 0 0 1px rgba(22, 93, 255, 0.08);
  flex-shrink: 0;
}

.kpi-panel__badge--green {
  color: #00b42a;
  background: linear-gradient(145deg, rgba(0, 180, 42, 0.14), rgba(0, 180, 42, 0.06));
  box-shadow: inset 0 0 0 1px rgba(0, 180, 42, 0.1);
}

.kpi-panel__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}

.kpi-panel__sub {
  margin: 2px 0 0;
  font-size: 12px;
  color: #86909c;
}

.kpi-grid {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}

.kpi-grid--primary {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 720px) {
  .kpi-grid--primary {
    grid-template-columns: 1fr;
  }
}

.kpi-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 2px;
  padding: 0;
  background: transparent;
  border: none;
}

@media (max-width: 720px) {
  .kpi-meta {
    grid-template-columns: 1fr;
  }
}

.kpi-meta__card {
  min-width: 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e8eaef;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.kpi-meta__card:hover {
  border-color: #d9dde5;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.kpi-meta__card--blue {
  background: linear-gradient(180deg, #f7faff 0%, #fff 70%);
  border-color: #e6eefb;
}
.kpi-meta__card--cyan {
  background: linear-gradient(180deg, #f5fcfc 0%, #fff 70%);
  border-color: #def5f4;
}
.kpi-meta__card--violet {
  background: linear-gradient(180deg, #faf7ff 0%, #fff 70%);
  border-color: #eee6fa;
}
.kpi-meta__card--green {
  background: linear-gradient(180deg, #f6fcf7 0%, #fff 70%);
  border-color: #e3f4e8;
}
.kpi-meta__card--orange {
  background: linear-gradient(180deg, #fff9f3 0%, #fff 70%);
  border-color: #ffe8d1;
}
.kpi-meta__card--danger {
  background: linear-gradient(180deg, #fff7f7 0%, #fff 70%);
  border-color: #fde3e3;
}
.kpi-meta__card--slate {
  background: linear-gradient(180deg, #f8f9fa 0%, #fff 70%);
}

.kpi-meta__card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.kpi-meta__icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  background: #f2f3f5;
  color: #4e5969;
}

.kpi-meta__card--blue .kpi-meta__icon {
  background: rgba(22, 93, 255, 0.1);
  color: #165dff;
}
.kpi-meta__card--cyan .kpi-meta__icon {
  background: rgba(15, 198, 194, 0.12);
  color: #0fc6c2;
}
.kpi-meta__card--violet .kpi-meta__icon {
  background: rgba(114, 46, 209, 0.1);
  color: #722ed1;
}
.kpi-meta__card--green .kpi-meta__icon {
  background: rgba(0, 180, 42, 0.1);
  color: #00b42a;
}
.kpi-meta__card--orange .kpi-meta__icon {
  background: rgba(255, 125, 0, 0.12);
  color: #ff7d00;
}
.kpi-meta__card--danger .kpi-meta__icon {
  background: rgba(245, 63, 63, 0.1);
  color: #f53f3f;
}

.kpi-meta__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.3;
  min-width: 0;
}

.kpi-meta__tip {
  font-size: 12px;
  color: #c9cdd4;
  cursor: help;
  flex-shrink: 0;
}

.kpi-meta__tip:hover {
  color: #86909c;
}

.kpi-meta__value {
  margin-top: 10px;
  font-size: 22px;
  font-weight: 700;
  color: #1d2129;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.kpi-meta__value.is-fail {
  color: #f53f3f;
}

.kpi-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 108px;
  padding: 14px 14px 12px;
  border-radius: 12px;
  border: 1px solid #e8eaef;
  background: rgba(255, 255, 255, 0.92);
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: default;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.kpi-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #c9cdd4;
}

.kpi-card--blue::before {
  background: linear-gradient(180deg, #4080ff, #165dff);
}
.kpi-card--cyan::before {
  background: linear-gradient(180deg, #37d4cf, #0fc6c2);
}
.kpi-card--violet::before {
  background: #722ed1;
}
.kpi-card--orange::before {
  background: linear-gradient(180deg, #ff9a2e, #ff7d00);
}
.kpi-card--green::before {
  background: linear-gradient(180deg, #23c343, #00b42a);
}
.kpi-card--danger::before {
  background: #f53f3f;
}
.kpi-card--slate::before {
  background: #4e5969;
}

.kpi-card--clickable {
  cursor: pointer;
}

.kpi-card--clickable:hover {
  border-color: #bedaff;
  box-shadow: 0 6px 16px rgba(22, 93, 255, 0.1);
  transform: translateY(-1px);
}

.kpi-card__top {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.kpi-card__icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
  background: #f2f3f5;
  color: #4e5969;
}

.kpi-card--blue .kpi-card__icon {
  background: rgba(22, 93, 255, 0.1);
  color: #165dff;
}
.kpi-card--cyan .kpi-card__icon {
  background: rgba(15, 198, 194, 0.12);
  color: #0fc6c2;
}
.kpi-card--violet .kpi-card__icon {
  background: rgba(114, 46, 209, 0.1);
  color: #722ed1;
}
.kpi-card--orange .kpi-card__icon {
  background: rgba(255, 125, 0, 0.12);
  color: #ff7d00;
}
.kpi-card--green .kpi-card__icon {
  background: rgba(0, 180, 42, 0.1);
  color: #00b42a;
}
.kpi-card--danger .kpi-card__icon {
  background: rgba(245, 63, 63, 0.1);
  color: #f53f3f;
}
.kpi-card--slate .kpi-card__icon {
  background: rgba(78, 89, 105, 0.1);
  color: #4e5969;
}

.kpi-card__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #86909c;
  min-width: 0;
  line-height: 1.3;
}

.kpi-card__tip {
  color: #c9cdd4;
  font-size: 13px;
  cursor: help;
  flex-shrink: 0;
}

.kpi-card__tip:hover {
  color: #86909c;
}

.kpi-card__value {
  margin-top: 10px;
  font-size: 24px;
  font-weight: 700;
  color: #1d2129;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.kpi-card__value.is-fail {
  color: #f53f3f;
}

.kpi-card__hint {
  margin-top: auto;
  padding-top: 8px;
  font-size: 11px;
  color: #c9cdd4;
  line-height: 1.3;
}

.chart-card {
  margin-bottom: 14px;
  border-radius: 14px !important;
  border: 1px solid #e8eaef !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.03);
}
.chart-card__head {
  margin-bottom: 8px;
}
.chart-card__title,
.detail-card__title,
.section-block__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}
.chart-card__desc,
.detail-card__desc,
.section-block__desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: #86909c;
}
.chart-box {
  width: 100%;
  height: 300px;
}
.chart-box-wrap.is-loading {
  opacity: 0.55;
}

.section-block {
  margin-bottom: 18px;
}
.section-block--last {
  margin-bottom: 0;
}
.section-block__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  padding: 0 2px;
}
.section-block__grid {
  display: grid;
  /* minmax(0,1fr) 而非 1fr：1fr 的最小值是 auto，表格 min-content 较大的一侧
     会把所在列撑宽，导致同一行左右两卡宽度不等、与上方模块错位 */
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px;
  align-items: stretch;
}
@media (max-width: 1200px) {
  .section-block__grid {
    grid-template-columns: 1fr;
  }
}

.detail-card {
  margin-bottom: 0;
  min-height: 260px;
  height: 100%;
  border-radius: 14px !important;
  border: 1px solid #e8eaef !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.03);
}
.detail-card--tall {
  min-height: 420px;
}
.detail-card__head {
  margin-bottom: 10px;
}
.detail-card__head--row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.dim-chart-wrap {
  margin: 4px 0 12px;
  padding: 8px 4px 0;
  border-radius: 10px;
  background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
  border: 1px solid #f2f3f5;
}
.dim-chart-wrap.is-loading {
  opacity: 0.55;
}
.dim-chart {
  width: 100%;
  height: 180px;
  cursor: pointer;
}
.roomy-table :deep(.arco-table-th) {
  padding: 12px 14px;
  font-size: 13px;
  color: #86909c;
  background: #fafbfc;
  font-weight: 500;
}
.roomy-table :deep(.arco-table-td) {
  padding: 14px;
  font-size: 13px;
  line-height: 1.5;
}
.roomy-table :deep(.arco-table-tr) {
  height: 52px;
}
.roomy-table :deep(.arco-table-body .arco-table-td) {
  border-bottom-color: #f2f3f5;
}
.roomy-table :deep(.arco-table-tr:hover .arco-table-td) {
  background: #f7f8fa;
}
/* 接入异常 / 推送异常：高度固定 10 行（10 × 52px），超出部分滚动查看 */
.fixed-height-table :deep(.arco-table-body) {
  height: 520px;
  max-height: 520px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.fixed-height-table :deep(.arco-table-body)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.fixed-height-table :deep(.arco-table-body)::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: #d9dde5;
}
.fixed-height-table :deep(.arco-table-body)::-webkit-scrollbar-thumb:hover {
  background: #c9cdd4;
}
.fixed-height-table :deep(.arco-table-body)::-webkit-scrollbar-track {
  background: transparent;
}
/* 接入统计 / 推送统计：双列表联动固定高度（4或8行），不足留白，超出滚动 */
.linked-height-table :deep(.arco-table-body) {
  min-height: var(--linked-body-h, 208px);
  max-height: var(--linked-body-h, 208px);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.linked-height-table :deep(.arco-table-body)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.linked-height-table :deep(.arco-table-body)::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: #d9dde5;
}
.linked-height-table :deep(.arco-table-body)::-webkit-scrollbar-thumb:hover {
  background: #c9cdd4;
}
.linked-height-table :deep(.arco-table-body)::-webkit-scrollbar-track {
  background: transparent;
}
.detail-chip-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}
.push-alert-count {
  font-size: 13px;
  font-weight: 600;
  color: #f53f3f;
  white-space: nowrap;
}
.detail-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  color: #4e5969;
  background: #f2f3f5;
  white-space: nowrap;
}
.detail-chip--danger {
  color: #f53f3f;
  background: rgba(245, 63, 63, 0.08);
}
.detail-chip--warn {
  color: #ff7d00;
  background: rgba(255, 125, 0, 0.1);
}
.text-link {
  border: none;
  background: transparent;
  padding: 0;
  color: #86909c;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  white-space: nowrap;
}
.text-link:hover {
  color: var(--mt-primary, #165dff);
}
.dim-tabs {
  margin-top: 2px;
}
/* 接入异常 / 推送异常：tab 分类名称下的提示说明 */
.alert-tab-tip {
  margin: 0 0 8px;
  font-size: 12px;
  color: #86909c;
}
.dim-tabs :deep(.arco-tabs-nav) {
  margin-bottom: 8px;
}
.dim-tabs :deep(.arco-tabs-content) {
  padding-top: 0;
}
.dim-tabs--nav-only :deep(.arco-tabs-content) {
  display: none;
}
.link-btn {
  border: none;
  background: transparent;
  padding: 0;
  color: var(--mt-primary, #165dff);
  cursor: pointer;
  font: inherit;
  text-align: left;
}
.link-btn:hover {
  text-decoration: underline;
}
.org-cell-btn {
  display: block;
  width: 100%;
  max-width: 100%;
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
.org-cell-btn .cell-main,
.link-btn .cell-main {
  color: inherit;
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
.num,
.num-fail {
  font-variant-numeric: tabular-nums;
}
.num-fail {
  color: #f53f3f;
}
.num-warn {
  color: #ff7d00;
  font-variant-numeric: tabular-nums;
}
.alert-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.alert-list li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 0;
  border-bottom: 1px solid #f2f3f5;
}
.alert-list__meta {
  font-size: 12px;
  color: #86909c;
}
</style>
