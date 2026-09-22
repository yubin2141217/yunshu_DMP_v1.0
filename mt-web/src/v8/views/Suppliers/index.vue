<template>
  <div class="workplace-page">
    <div class="workplace-header">
      <div>
        <h2 class="workplace-title">供数方管理</h2>
        <p class="workplace-desc">管理本机构供数方及其供数表现。</p>
      </div>
    </div>

    <!-- 供数方统计：总数 + 各供给状态（状态口径全局统一），点击卡片联动下方筛选 -->
    <section class="v8-sup-stat">
      <div
        v-for="item in statCards"
        :key="item.key"
        class="v8-sup-stat-col"
      >
        <a-card
          class="kpi-card v8-sup-stat-card"
          :class="{ 'is-active': item.active }"
          :bordered="false"
          @click="item.onClick"
        >
          <div class="kpi-body">
            <span class="kpi-icon" :style="{ background: item.accent }">
              <component :is="item.icon" />
            </span>
            <div style="min-width: 0">
              <div class="kpi-title">
                {{ item.title }}
                <a-tooltip v-if="item.tip" :content="item.tip" mini>
                  <IconQuestionCircle class="kpi-title-info" @click.stop />
                </a-tooltip>
              </div>
              <div class="kpi-value">{{ item.value }}</div>
            </div>
          </div>
        </a-card>
      </div>
    </section>

    <a-card class="content-card" :bordered="false">
      <!-- 时间范围：与首页一致的按钮组样式，点击即切换并联动列表指标，置于筛选区右侧 -->
      <div class="v8-sup-range-bar">
        <a-radio-group v-model:model-value="range" type="button" @change="fetchData(1)">
          <a-radio v-for="o in RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</a-radio>
        </a-radio-group>
      </div>
      <div class="v8-filter-grid">
        <div class="v8-filter-item">
          <label>供数方名称</label>
          <a-input
            v-model="keyword"
            placeholder="请输入供数方名称"
            allow-clear
            @press-enter="fetchData(1)"
          />
        </div>
        <div class="v8-filter-item">
          <label>供数方编码</label>
          <a-input
            v-model="code"
            placeholder="请输入供数方编码"
            allow-clear
            @press-enter="fetchData(1)"
          />
        </div>
        <div class="v8-filter-item">
          <label>供数方状态</label>
          <a-select v-model="health" placeholder="全部状态" allow-clear @change="fetchData(1)">
            <a-option value="active">活跃</a-option>
            <a-option value="healthy">健康</a-option>
            <a-option value="error">异常</a-option>
            <a-option value="disabled">停用</a-option>
          </a-select>
        </div>
        <div class="v8-filter-actions">
          <a-button type="primary" @click="fetchData(1)">
            <template #icon><IconSearch /></template>查询
          </a-button>
        </div>
      </div>

      <a-table :columns="columns" :data="data" :loading="loading" row-key="id" :pagination="false" stripe>
        <template #name="{ record }">
          <div class="v8-sup-cell">
            <a-avatar :size="26" class="v8-sup-logo" :image-url="record.logo">
              {{ record.name.charAt(0) }}
            </a-avatar>
            <div class="v8-sup-cell-main">
              <a-link @click="openDetail(record)">{{ record.name }}</a-link>
              <a class="v8-sup-cell-code" title="点击复制编码" @click="copyCode(record.code)">{{ record.code }}</a>
            </div>
          </div>
        </template>
        <template #health="{ record }">
          <a-badge :status="badgeOf(record.health).status" :text="badgeOf(record.health).label" />
        </template>
        <template #status="{ record }">
          <a-tag :color="record.status === 'enabled' ? 'green' : 'gray'" size="small">
            {{ record.status === 'enabled' ? '启用' : '停用' }}
          </a-tag>
        </template>
        <template #todayCount="{ record }">
          <a-link @click="goDataCheck(record)">{{ Number(metricsOf(record).count).toLocaleString('zh-CN') }}</a-link>
        </template>
        <template #firstRate="{ record }">
          <span>{{ metricsOf(record).firstRate }}%</span>
        </template>
        <template #uniqueRate="{ record }">
          <span>{{ metricsOf(record).uniqueRate }}%</span>
        </template>
        <template #rejectRate="{ record }">
          <span :class="metricsOf(record).rejectRate > 5 ? 'v8-text-warn' : ''">{{ metricsOf(record).rejectRate }}%</span>
        </template>
        <template #empty><a-empty description="尚未配置供数方或不在您的可见范围内" /></template>
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
          @change="fetchData"
          @page-size-change="onPageSize"
        />
      </div>
    </a-card>

    <a-drawer :visible="detailVisible" :width="520" @cancel="detailVisible = false">
      <template #title>供数方详情</template>
      <template v-if="current">
        <div class="v8-sup-head">
          <div class="v8-sup-head-main">
            <a-avatar :size="44" class="v8-sup-logo" :image-url="current.logo">
              {{ current.name.charAt(0) }}
            </a-avatar>
            <div>
              <div class="v8-sup-name">{{ current.name }}</div>
              <div class="v8-sup-code">编码：{{ current.code }}</div>
            </div>
          </div>
          <a-badge :status="badgeOf(current.health).status" :text="badgeOf(current.health).label" />
        </div>

        <a-descriptions :column="1" bordered size="large" class="v8-sup-desc">
          <a-descriptions-item label="启用状态">{{ current.status === 'enabled' ? '启用' : '停用' }}</a-descriptions-item>
          <a-descriptions-item label="今日入库">{{ Number(current.todayCount).toLocaleString('zh-CN') }} 条</a-descriptions-item>
          <a-descriptions-item label="今日拒收率">{{ current.todayRejectRate }}%</a-descriptions-item>
          <a-descriptions-item label="最近推送">{{ current.lastPushAt || '暂无' }}</a-descriptions-item>
          <a-descriptions-item label="信息更新时间">{{ current.updatedAt }}</a-descriptions-item>
        </a-descriptions>

        <!-- 供方能力五维评估：定量体检（与供数方状态标签并存，不替代） -->
        <div class="v8-sup-eval">
          <div class="v8-sup-eval-head">
            <span class="v8-sup-eval-title">供方能力评估</span>
            <span v-if="currentScore" class="v8-sup-eval-score">
              <span class="v8-sup-eval-total">{{ currentScore.total }}</span>
              <span class="v8-sup-eval-total-unit">分</span>
              <a-tag :color="scoreGradeMeta[currentScore.grade].color" size="small" class="v8-sup-eval-grade">
                {{ scoreGradeMeta[currentScore.grade].label }}
              </a-tag>
            </span>
          </div>

          <div v-if="current.status === 'disabled'" class="v8-sup-eval-history">
            供方已停用，以下评分为停用前最后 7 日数据的历史参考
          </div>

          <!-- 雷达图：维度名称由覆盖层渲染（名称后 ⓘ 为口径说明 tooltip），与 canvas 图形对齐 -->
          <div ref="radarWrap" class="v8-radar-wrap">
            <V8Chart :option="radarOption" height="248px" />
            <div
              v-for="(dim, i) in SCORE_DIMS"
              :key="dim"
              class="v8-radar-axis"
              :style="axisStyle(i)"
            >
              <span>{{ scoreDimensionMeta[dim].label }}</span>
              <a-tooltip :content="scoreDimensionMeta[dim].tip" mini position="top">
                <IconQuestionCircle class="v8-radar-axis-info" @click.stop />
              </a-tooltip>
            </div>
          </div>

          <div v-if="weakTip" class="v8-sup-eval-weak">
            <IconExclamationCircle class="v8-sup-eval-weak-icon" />
            <span>{{ weakTip }}</span>
          </div>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import {
  IconSearch,
  IconUserGroup,
  IconHeart,
  IconThunderbolt,
  IconExclamationCircle,
  IconPauseCircle,
  IconQuestionCircle,
} from '@arco-design/web-vue/es/icon'
import V8Chart from '@/v8/components/V8Chart.vue'
import { getAllSuppliers, getSuppliers } from '@/v8/api/data'
import {
  healthMeta,
  scoreDimensionMeta,
  scoreGradeMeta,
  averageSupplierScores,
  computeSupplierScore,
  type Health,
  type Supplier,
  type SupplierScore,
} from '@/v8/mock/types'
import { buildRadarOption, weakTipOf, SCORE_DIMS } from '@/v8/utils/supplierRadar'

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const code = ref('')
const health = ref<Health | ''>('')
const data = ref<Supplier[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })

const badgeMap: Record<Health, { status: 'success' | 'processing' | 'danger' | 'normal' }> = {
  healthy: { status: 'success' },
  active: { status: 'processing' },
  error: { status: 'danger' },
  disabled: { status: 'normal' },
}
const badgeOf = (h: Health) => ({ ...badgeMap[h], label: healthMeta[h].label })

/* ===== 时间范围筛选：列表指标列随范围切换（演示口径：今日为种子值，其余范围按固定系数派生） ===== */
const RANGE_OPTIONS = [
  { value: 'today', label: '今日' },
  { value: '3d', label: '近3天' },
  { value: '7d', label: '近7天' },
  { value: '1m', label: '近1月' },
  { value: 'year', label: '本年度' },
] as const
type SupplierRange = (typeof RANGE_OPTIONS)[number]['value']

const range = ref<SupplierRange>('7d')
const rangeLabel = computed(() => RANGE_OPTIONS.find((o) => o.value === range.value)?.label ?? '')

interface RangeMetrics {
  /** 范围内入库量 */
  count: number
  /** 范围内首发占比（%） */
  firstRate: number
  /** 范围内独有占比（%） */
  uniqueRate: number
  /** 范围内拒收率（%） */
  rejectRate: number
}

/** 列表指标按时间范围派生：今日直接取种子值，更长周期基于近 7 日趋势按系数放大 / 占比小幅回落 */
function metricsOf(s: Supplier): RangeMetrics {
  const week = (s.weekTrend || []).map((n) => Number(n) || 0)
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
  const weekTotal = sum(week)
  const r1 = (n: number) => Math.round(n * 10) / 10
  switch (range.value) {
    case 'today':
      return { count: s.todayCount, firstRate: s.todayFirstRate, uniqueRate: s.todayUniqueRate, rejectRate: s.todayRejectRate }
    case '3d':
      return { count: sum(week.slice(-3)), firstRate: Math.round(s.todayFirstRate * 0.92), uniqueRate: Math.round(s.todayUniqueRate * 0.9), rejectRate: r1(s.todayRejectRate * 0.9) }
    case '7d':
      return { count: weekTotal, firstRate: Math.round(s.todayFirstRate * 0.88), uniqueRate: Math.round(s.todayUniqueRate * 0.86), rejectRate: r1(s.todayRejectRate * 0.85) }
    case '1m':
      return { count: Math.round(weekTotal * 4.3), firstRate: Math.round(s.todayFirstRate * 0.85), uniqueRate: Math.round(s.todayUniqueRate * 0.82), rejectRate: r1(s.todayRejectRate * 0.8) }
    case 'year':
      return { count: Math.round(weekTotal * 52), firstRate: Math.round(s.todayFirstRate * 0.8), uniqueRate: Math.round(s.todayUniqueRate * 0.78), rejectRate: r1(s.todayRejectRate * 0.75) }
  }
}

const columns = computed(() => [
  { title: '供数方名称', dataIndex: 'name', slotName: 'name', ellipsis: true, tooltip: true },
  { title: '供数方状态', dataIndex: 'health', slotName: 'health', width: 110 },
  { title: '启用状态', dataIndex: 'status', slotName: 'status', width: 90 },
  { title: `${rangeLabel.value}入库`, dataIndex: 'todayCount', slotName: 'todayCount', width: 110 },
  { title: `${rangeLabel.value}首发占比`, dataIndex: 'firstRate', slotName: 'firstRate', width: 120 },
  { title: `${rangeLabel.value}独有占比`, dataIndex: 'uniqueRate', slotName: 'uniqueRate', width: 120 },
  { title: '拒收率', dataIndex: 'rejectRate', slotName: 'rejectRate', width: 100 },
  { title: '最近推送', dataIndex: 'lastPushAt', width: 160 },
])

/** 按当前登录机构可见范围汇总供数方状态（口径全局统一：健康/活跃/异常/停用） */
const healthCount = computed<Record<Health, number>>(() => {
  const dist: Record<Health, number> = { healthy: 0, active: 0, error: 0, disabled: 0 }
  getAllSuppliers().forEach((s) => { dist[s.health] += 1 })
  return dist
})
const supplierTotal = computed(() => getAllSuppliers().length)

/** 点击统计卡片：联动下方「供数方状态」筛选；再次点击同一张状态卡可取消筛选 */
function filterByHealth(h: Health | '') {
  health.value = health.value === h ? '' : h
  fetchData(1)
}

const statCards = computed(() => [
  {
    key: 'total',
    title: '供数方总数',
    value: supplierTotal.value,
    accent: 'linear-gradient(135deg, #69b1ff 0%, #4096ff 100%)',
    icon: IconUserGroup,
    active: health.value === '',
    onClick: () => filterByHealth(''),
  },
  {
    key: 'active',
    title: healthMeta.active.label,
    value: healthCount.value.active,
    tip: '活跃供数方：处于启用且非异常状态，近 1 周累计接入数据 ≥ 10,000 条，或近 1 周至少 5 天有数据接入。点击卡片可按此状态筛选列表。',
    accent: 'linear-gradient(135deg, #5fe0d4 0%, #20bdb0 100%)',
    icon: IconThunderbolt,
    active: health.value === 'active',
    onClick: () => filterByHealth('active'),
  },
  {
    key: 'healthy',
    title: healthMeta.healthy.label,
    value: healthCount.value.healthy,
    tip: '健康供数方：处于启用状态，供给正常，但暂未达到「活跃」标准（近 1 周接入量或接入天数不足）的供数方。点击卡片可按此状态筛选列表。',
    accent: 'linear-gradient(135deg, #73d897 0%, #38b864 100%)',
    icon: IconHeart,
    active: health.value === 'healthy',
    onClick: () => filterByHealth('healthy'),
  },
  {
    key: 'error',
    title: healthMeta.error.label,
    value: healthCount.value.error,
    tip: '异常供数方：处于启用状态，但近 3 天无数据接入，或今日拒收率超过 5%，需及时排查处置。点击卡片可按此状态筛选列表。',
    accent: 'linear-gradient(135deg, #ff8f8f 0%, #ff6b6b 100%)',
    icon: IconExclamationCircle,
    active: health.value === 'error',
    onClick: () => filterByHealth('error'),
  },
  {
    key: 'disabled',
    title: healthMeta.disabled.label,
    value: healthCount.value.disabled,
    tip: '停用供数方：在 MT 管理端被关停的供数方，关停后不再接入数据。点击卡片可按此状态筛选列表。',
    accent: 'linear-gradient(135deg, #c9cdd4 0%, #a9aeb8 100%)',
    icon: IconPauseCircle,
    active: health.value === 'disabled',
    onClick: () => filterByHealth('disabled'),
  },
])

async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const res = await getSuppliers({ keyword: keyword.value, code: code.value, health: health.value, page, pageSize: pagination.pageSize })
    data.value = res.list
    pagination.current = page
    pagination.total = res.total
  } finally {
    loading.value = false
  }
}

function onPageSize(size: number) {
  pagination.pageSize = size
  fetchData(1)
}

const detailVisible = ref(false)
const current = ref<Supplier | null>(null)
function openDetail(row: Supplier) {
  current.value = row
  detailVisible.value = true
}

/** 复制兜底：execCommand 兼容无 Clipboard API 权限的嵌入/自动化环境 */
function copyFallback(code: string): boolean {
  try {
    const ta = document.createElement('textarea')
    ta.value = code
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/** 复制供数方编码到剪贴板 */
function copyCode(code: string) {
  const done = () => Message.success(`已复制编码：${code}`)
  const fail = () => Message.error('复制失败，请手动复制')
  if (navigator.clipboard?.writeText) {
    navigator.clipboard
      .writeText(code)
      .then(done)
      .catch(() => (copyFallback(code) ? done() : fail()))
  } else if (copyFallback(code)) {
    done()
  } else {
    fail()
  }
}

/** 今日入库：跳转接入日志并携带该供数方筛选（上区聚合 + 下区明细同时回填） */
function goDataCheck(row: Supplier) {
  router.push({ path: '/v8/data-check', query: { supplierId: row.id } })
}

/* ===== 供方能力五维评估（详情雷达） ===== */
/** 当前供方评分 */
const currentScore = computed<SupplierScore | null>(() => (current.value ? computeSupplierScore(current.value) : null))
/** 机构内启用供方的五维均值（停用供方不纳入），作为雷达参照层 */
const orgAvgScore = computed<SupplierScore>(() => {
  const enabled = getAllSuppliers().filter((s) => s.status === 'enabled')
  return averageSupplierScores(enabled.map((s) => computeSupplierScore(s)))
})
/** 短板针对性提示（最低维 <60 分才提示） */
const weakTip = computed(() => (currentScore.value ? weakTipOf(currentScore.value) : ''))
/** 五维雷达：当前供方 vs 机构均值 */
const radarOption = computed(() =>
  currentScore.value ? buildRadarOption(currentScore.value, orgAvgScore.value, current.value?.name ?? '') : {},
)

/* ===== 雷达维度名称覆盖层：ECharts 自带名称已关闭，名称 + ⓘ 说明由 HTML 渲染以支持 tooltip ===== */
const radarWrap = ref<HTMLDivElement | null>(null)
const radarSize = ref({ w: 0, h: 248 })
let radarRO: ResizeObserver | null = null

function syncRadarSize() {
  if (radarWrap.value) radarSize.value = { w: radarWrap.value.clientWidth, h: radarWrap.value.clientHeight }
}

// 抽屉内容首次挂载后才存在 wrap，故在每次打开时挂观察器（observe 幂等）
watch(detailVisible, (open) => {
  if (!open) return
  nextTick(() => {
    if (!radarWrap.value) return
    radarRO ??= new ResizeObserver(syncRadarSize)
    radarRO.observe(radarWrap.value)
    syncRadarSize()
  })
})
onBeforeUnmount(() => {
  radarRO?.disconnect()
  radarRO = null
})

/**
 * 维度名称定位：与 buildRadarOption 的 center ['50%','48%'] / radius '62%' 几何参数保持一致。
 * ECharts 雷达默认 startAngle=90°、clockwise=false（屏幕逆时针），
 * 第 i 维数学角 = 90° + i·(360/n)，屏幕坐标 y 轴向下（与 echarts coordToPoint 的 y=c-r·sinθ 一致）。
 */
function axisStyle(i: number): Record<string, string> {
  const { w, h } = radarSize.value
  if (!w || !h) return { visibility: 'hidden' }
  const cx = w * 0.5
  const cy = h * 0.48
  const r = (Math.min(w, h) / 2) * 0.62 + 18
  const angle = ((90 + (360 / SCORE_DIMS.length) * i) * Math.PI) / 180
  return {
    left: `${cx + r * Math.cos(angle)}px`,
    top: `${cy - r * Math.sin(angle)}px`,
  }
}

onMounted(() => {
  fetchData(1)
  // URL 深链直达：?supplierId=s1 自动打开对应供方详情
  const sid = route.query.supplierId
  if (typeof sid === 'string' && sid) {
    const target = getAllSuppliers().find((s) => s.id === sid)
    if (target) openDetail(target)
  }
})
</script>

<style lang="scss" scoped>
.v8-text-warn { color: #ff7d00; }

/* 时间范围按钮组工具行：置于筛选区右上，与首页口径一致；窄屏改左对齐避免顶边 */
.v8-sup-range-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 14px;
}
@media (max-width: 640px) {
  .v8-sup-range-bar {
    justify-content: flex-start;
  }
}

/* 供数方统计卡片：flex 均分一行五张，窄屏自动换行；整体可点击，选中态描边+轻微上浮 */
.v8-sup-stat {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}
.v8-sup-stat-col {
  flex: 1 1 0;
  min-width: 150px;
  display: flex;
}
:deep(.v8-sup-stat-card) {
  flex: 1;
  cursor: pointer;
  border: 1px solid transparent;
}
:deep(.v8-sup-stat-card .arco-card-body) {
  min-height: 96px;
}
:deep(.v8-sup-stat-card.is-active) {
  border-color: #4096ff;
  box-shadow: 0 4px 14px rgba(22, 119, 255, 0.16), 0 2px 6px rgba(0, 0, 0, 0.04);
}
:deep(.v8-sup-stat-card.is-active .kpi-value) {
  color: #165dff;
}
/* 标题后的问号提示图标：默认浅灰，hover 变蓝，点击不触发卡片筛选 */
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

.v8-sup-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}
/* 列表名称列与详情头部：logo + 文字横向排列 */
.v8-sup-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.v8-sup-head-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.v8-sup-logo {
  flex: none;
  background: #f2f3f5;
}
/* 名称列：名称 + 编码副信息（编码点击可复制） */
.v8-sup-cell-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.v8-sup-cell-code {
  font-size: 12px;
  line-height: 1.3;
  color: #86909c;
  cursor: pointer;
}
.v8-sup-cell-code:hover {
  color: #165dff;
  text-decoration: underline;
}
.v8-sup-name {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}
.v8-sup-code {
  margin-top: 4px;
  font-size: 13px;
  color: #86909c;
}

/* 供方能力评估区块 */
.v8-sup-eval {
  margin-top: 20px;
  padding: 16px;
  border: 1px solid #f0f1f3;
  border-radius: 10px;
  background: #fcfcfd;
}
.v8-sup-eval-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.v8-sup-eval-title {
  font-weight: 600;
  font-size: 14px;
  color: #1d2129;
}
.v8-sup-eval-score {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
}
.v8-sup-eval-total {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  color: #165dff;
}
.v8-sup-eval-total-unit {
  font-size: 12px;
  color: #86909c;
  margin-right: 6px;
}
.v8-sup-eval-grade {
  margin: 0;
  font-weight: 600;
}
.v8-sup-eval-history {
  margin: 8px 0 4px;
  padding: 6px 10px;
  font-size: 12px;
  color: #86909c;
  background: #f2f3f5;
  border-radius: 6px;
}
.v8-sup-eval-weak {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 10px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #ff7d00;
  background: #fff7e8;
  border-radius: 6px;
}
.v8-sup-eval-weak-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  font-size: 13px;
}

/* 雷达维度名称覆盖层：绝对定位在 canvas 之上，名称后 ⓘ 可查看口径说明 */
.v8-radar-wrap {
  position: relative;
}
.v8-radar-axis {
  position: absolute;
  transform: translate(-50%, -50%);
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  line-height: 1;
  color: #4e5969;
  white-space: nowrap;
}
.v8-radar-axis-info {
  flex: 0 0 auto;
  font-size: 13px;
  color: #c9cdd4;
  cursor: help;
  transition: color 0.18s ease;
}
.v8-radar-axis-info:hover {
  color: #4096ff;
}
</style>
