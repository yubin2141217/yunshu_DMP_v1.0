<template>
  <div class="page-shell stats-page">
    <div class="stats-sticky">
      <div class="crumb">
        运营工作台<span class="crumb-sep">/</span><span class="crumb-current">综合看板</span>
      </div>
      <div class="page-head">
        <div>
          <h2 class="page-title">综合看板</h2>
          <p class="page-desc">云数中台数据接入和推送情况概览，包括数据统计、动态趋势及分类列表数据。</p>
        </div>
        <div class="page-head__filters">
          <a-select
            v-model="filters.orgIds"
            class="org-select"
            multiple
            allow-clear
            allow-search
            :max-tag-count="1"
            placeholder="机构：全部"
            :options="orgOptions"
            size="small"
          />
          <a-radio-group v-model="filters.timeRange" type="button" size="small" class="range-tabs">
            <a-radio v-for="opt in timeRangeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</a-radio>
          </a-radio-group>
          <a-button type="text" size="small" :loading="loading" @click="reload">刷新</a-button>
        </div>
      </div>
    </div>

    <OverviewPanel
      :data="overviewData"
      :loading="loading"
      :time-range="filters.timeRange"
      :org-ids="filters.orgIds"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  getDashboardFilterOptions,
  getDashboardOverview,
  type DashboardOverview,
  type DashboardTimeRange,
} from '@/api/dashboard'
import OverviewPanel from './OverviewPanel.vue'

const loading = ref(false)

const filters = reactive({
  orgIds: [] as string[],
  timeRange: 'today' as DashboardTimeRange,
})

const orgOptions = ref<{ label: string; value: string }[]>([])

const timeRangeOptions = [
  { label: '今日', value: 'today' },
  { label: '近3天', value: '3d' },
  { label: '近1周', value: '1w' },
  { label: '近1月', value: '1m' },
]

const emptyOverview = (): DashboardOverview => ({
  inboundTotal: 0,
  inboundBacklog: 0,
  inboundSchemeCount: 0,
  inboundOrgCount: 0,
  supplierCount: 0,
  inboundFieldCount: 0,
  pushSuccess: 0,
  pushFail: 0,
  successRate: null,
  pushSchemeCount: 0,
  pushOrgCount: 0,
  backlogSum: 0,
  flowTrend: { dates: [], inbound: [], push: [] },
  failTopN: [],
  backlogTopN: [],
  zeroInboundAlerts: [],
  inboundByOrg: [],
  inboundByStandard: [],
  inboundBySupplier: [],
  pushByScheme: [],
  pushByOrg: [],
})

const overviewData = ref<DashboardOverview>(emptyOverview())

async function loadOptions() {
  const opts = await getDashboardFilterOptions()
  orgOptions.value = opts.orgs || []
}

async function reload() {
  loading.value = true
  try {
    overviewData.value = await getDashboardOverview({
      orgIds: filters.orgIds.length ? [...filters.orgIds] : undefined,
      timeRange: filters.timeRange,
    })
  } catch {
    Message.error('看板数据加载失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => [filters.orgIds.slice(), filters.timeRange] as const,
  () => {
    reload()
  },
)

onMounted(async () => {
  await loadOptions()
  await reload()
})
</script>

<style scoped>
.stats-page {
  padding-bottom: 24px;
  gap: 0;
}

.stats-sticky {
  position: sticky;
  top: 0;
  z-index: 30;
  margin: 0 calc(-1 * var(--mt-content-side-pad, 5%)) 16px;
  padding: 0 var(--mt-content-side-pad, 5%) 14px;
  background: var(--mt-page-bg, #f7f8fa);
  box-shadow: 0 12px 20px -18px rgba(15, 23, 42, 0.45);
}

.stats-sticky .crumb {
  position: static;
  margin: 0 0 10px;
  padding: 2px 0 0;
  background: transparent;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;
  background: transparent;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
}

.page-desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: #86909c;
  max-width: 560px;
  line-height: 1.5;
}

.page-head__filters {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: flex-end;
  gap: 8px;
}

.org-select {
  width: 140px;
  flex-shrink: 0;
}

.range-tabs {
  flex-shrink: 0;
}

.range-tabs :deep(.arco-radio-button-content) {
  padding: 0 10px;
}
</style>
