<template>
  <div class="page-shell stats-page">
    <div class="stats-sticky">
      <div class="page-head">
        <div class="page-head__text">
          <h2 class="page-title">综合看板</h2>
          <p class="page-desc">云数中台数据接入和推送情况概览，包括数据统计、动态趋势及分类列表数据。</p>
        </div>
        <div class="page-head__filters">
          <div
            ref="orgFilterRef"
            class="org-filter"
            :class="{ 'is-open': orgOpen, 'has-value': filters.orgIds.length > 0 }"
          >
            <button type="button" class="org-filter__trigger" @click="toggleOrgPanel">
              <span v-if="!filters.orgIds.length" class="org-filter__placeholder">机构：全部</span>
              <span v-else class="org-filter__tags">
                <span class="org-filter__tag" :title="firstSelectedLabel">{{ firstSelectedLabel }}</span>
                <span v-if="filters.orgIds.length > 1" class="org-filter__more">+{{ filters.orgIds.length - 1 }}</span>
              </span>
              <span class="org-filter__suffix">
                <span
                  v-if="filters.orgIds.length"
                  class="org-filter__clear"
                  title="清空已选"
                  role="button"
                  tabindex="0"
                  aria-label="清空已选机构"
                  @click.stop="clearOrgSelection"
                  @keydown.enter.prevent.stop="clearOrgSelection"
                  @keydown.space.prevent.stop="clearOrgSelection"
                >
                  <IconClose />
                </span>
                <IconSearch class="org-filter__icon" />
              </span>
            </button>
            <div v-show="orgOpen" class="org-filter__panel" @click.stop>
              <a-input
                v-model="orgKeyword"
                allow-clear
                size="mini"
                placeholder="搜索机构"
                class="org-filter__search"
              />
              <div class="org-filter__list">
                <button
                  v-for="opt in filteredOrgOptions"
                  :key="opt.value"
                  type="button"
                  class="org-filter__item"
                  :title="opt.label"
                  @click="toggleOrg(opt.value, !filters.orgIds.includes(opt.value))"
                >
                  <span
                    class="org-filter__check"
                    :class="{ 'is-checked': filters.orgIds.includes(opt.value) }"
                    aria-hidden="true"
                  />
                  <span class="org-filter__item-text">{{ opt.label }}</span>
                </button>
                <div v-if="!filteredOrgOptions.length" class="org-filter__empty">无匹配机构</div>
              </div>
            </div>
          </div>
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
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconClose, IconSearch } from '@arco-design/web-vue/es/icon'
import {
  getDashboardFilterOptions,
  getDashboardOverview,
  type DashboardOverview,
  type DashboardTimeRange,
} from '@/api/dashboard'
import OverviewPanel from './OverviewPanel.vue'

const loading = ref(false)
const orgOpen = ref(false)
const orgKeyword = ref('')
const orgFilterRef = ref<HTMLElement | null>(null)

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

const filteredOrgOptions = computed(() => {
  const q = orgKeyword.value.trim().toLowerCase()
  if (!q) return orgOptions.value
  return orgOptions.value.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
})

const firstSelectedLabel = computed(() => {
  const id = filters.orgIds[0]
  return orgOptions.value.find((o) => o.value === id)?.label || id || ''
})

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

function toggleOrgPanel() {
  orgOpen.value = !orgOpen.value
  if (!orgOpen.value) orgKeyword.value = ''
}

function toggleOrg(id: string, checked: boolean) {
  if (checked) {
    if (!filters.orgIds.includes(id)) filters.orgIds.push(id)
  } else {
    filters.orgIds = filters.orgIds.filter((x) => x !== id)
  }
}

function clearOrgSelection() {
  if (!filters.orgIds.length) return
  filters.orgIds = []
}

function onDocClick(e: MouseEvent) {
  const el = orgFilterRef.value
  if (!el || !orgOpen.value) return
  if (!el.contains(e.target as Node)) {
    orgOpen.value = false
    orgKeyword.value = ''
  }
}

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
  document.addEventListener('mousedown', onDocClick)
  await loadOptions()
  await reload()
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onDocClick)
})
</script>

<style scoped>
.stats-page {
  gap: 16px;
}

.stats-sticky {
  position: sticky;
  top: 0;
  z-index: 30;
  margin: 0 calc(-1 * var(--mt-content-side-pad, 5%)) 0;
  padding: 0 var(--mt-content-side-pad, 5%) 12px;
  background: var(--mt-page-bg, #f7f8fa);
  box-shadow: 0 10px 16px -16px rgba(15, 23, 42, 0.4);
}

.stats-sticky .page-head {
  margin: 0;
}

.page-head__text {
  min-width: 0;
  flex: 1;
}

.page-head__filters {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.org-filter {
  --org-filter-w: 240px;
  position: relative;
  width: var(--org-filter-w);
  flex: 0 0 var(--org-filter-w);
  max-width: var(--org-filter-w);
  z-index: 40;
}

.org-filter__trigger {
  position: relative;
  width: var(--org-filter-w);
  max-width: var(--org-filter-w);
  height: 28px;
  min-height: 28px;
  max-height: 28px;
  padding: 0 28px 0 10px;
  border: 1px solid var(--color-border-2, #e5e6eb);
  border-radius: var(--border-radius-small, 2px);
  background: #fff;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  cursor: pointer;
  box-sizing: border-box;
  overflow: hidden;
  text-align: left;
  line-height: 26px;
  transition: border-color 0.15s;
}

.org-filter.is-open .org-filter__trigger,
.org-filter__trigger:hover {
  border-color: rgb(var(--primary-6, 22, 93, 255));
}

.org-filter__placeholder {
  flex: 1 1 0;
  min-width: 0;
  color: var(--color-text-3, #c9cdd4);
  font-size: 12px;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.org-filter__tags {
  flex: 1 1 0;
  min-width: 0;
  max-width: 100%;
  height: 20px;
  max-height: 20px;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  overflow: hidden;
}

.org-filter__tag {
  flex: 1 1 0;
  min-width: 0;
  max-width: 100%;
  height: 20px;
  max-height: 20px;
  padding: 0 6px;
  border-radius: 2px;
  background: var(--color-fill-2, #f2f3f5);
  color: var(--color-text-1, #1d2129);
  font-size: 12px;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.org-filter__more {
  flex: 0 0 auto;
  height: 20px;
  max-height: 20px;
  padding: 0 6px;
  border-radius: 2px;
  background: rgb(var(--primary-1, 232, 243, 255));
  color: rgb(var(--primary-6, 22, 93, 255));
  font-size: 12px;
  line-height: 20px;
  white-space: nowrap;
}

.org-filter__suffix {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.org-filter__icon {
  color: var(--color-text-3, #c9cdd4);
  font-size: 12px;
  pointer-events: none;
}

.org-filter__clear {
  display: none;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--color-fill-3, #e5e6eb);
  color: var(--color-text-2, #4e5969);
  font-size: 10px;
  line-height: 1;
  cursor: pointer;
}

.org-filter__clear:hover {
  background: var(--color-text-3, #c9cdd4);
  color: #fff;
}

.org-filter.has-value:hover .org-filter__icon,
.org-filter.is-open.has-value .org-filter__icon {
  display: none;
}

.org-filter.has-value:hover .org-filter__clear,
.org-filter.is-open.has-value .org-filter__clear {
  display: inline-flex;
}

.org-filter__panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: var(--org-filter-w);
  max-width: var(--org-filter-w);
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--color-fill-3, #e5e6eb);
  border-radius: var(--border-radius-medium, 4px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 8px;
  z-index: 50;
}

.org-filter__search {
  display: block;
  width: 100%;
  max-width: 100%;
  margin-bottom: 8px;
  box-sizing: border-box;
}

.org-filter__search :deep(.arco-input-wrapper) {
  width: 100%;
  max-width: 100%;
}

.org-filter__list {
  width: 100%;
  max-width: 100%;
  max-height: 200px;
  overflow-x: hidden;
  overflow-y: auto;
}

.org-filter__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 32px;
  margin: 0;
  padding: 0 4px;
  border: 0;
  border-radius: 2px;
  background: transparent;
  box-sizing: border-box;
  cursor: pointer;
  overflow: hidden;
  text-align: left;
}

.org-filter__item:hover {
  background: var(--color-fill-1, #f7f8fa);
}

.org-filter__check {
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
  border: 1px solid var(--color-border-3, #c9cdd4);
  border-radius: 2px;
  background: #fff;
  box-sizing: border-box;
  position: relative;
}

.org-filter__check.is-checked {
  border-color: rgb(var(--primary-6, 22, 93, 255));
  background: rgb(var(--primary-6, 22, 93, 255));
}

.org-filter__check.is-checked::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 0;
  width: 5px;
  height: 9px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.org-filter__item-text {
  flex: 1 1 0;
  min-width: 0;
  max-width: 100%;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--color-text-1, #1d2129);
  line-height: 1.4;
}

.org-filter__empty {
  padding: 12px 4px;
  text-align: center;
  color: var(--color-text-3, #c9cdd4);
  font-size: 12px;
}

.range-tabs {
  flex-shrink: 0;
}

.range-tabs :deep(.arco-radio-button-content) {
  padding: 0 10px;
}
</style>
