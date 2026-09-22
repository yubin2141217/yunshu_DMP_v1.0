<template>
  <div class="workplace-page">
    <div class="workplace-header">
      <div>
        <h2 class="workplace-title">供数方查看</h2>
        <p class="workplace-desc">查看本机构供数方及其供给状态。</p>
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
          <a-link @click="openDetail(record)">{{ record.name }}</a-link>
        </template>
        <template #code="{ record }">
          <a-link @click="copyCode(record.code)">{{ record.code }}</a-link>
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
          <a-link @click="goDataCheck(record)">{{ record.todayCount }}</a-link>
        </template>
        <template #todayRejectRate="{ record }">
          <span :class="record.todayRejectRate > 5 ? 'v8-text-warn' : ''">{{ record.todayRejectRate }}%</span>
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
          <div>
            <div class="v8-sup-name">{{ current.name }}</div>
            <div class="v8-sup-code">编码：{{ current.code }}</div>
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

          <V8Chart :option="radarOption" height="248px" />

          <div v-if="weakTip" class="v8-sup-eval-weak">
            <IconExclamationCircle class="v8-sup-eval-weak-icon" />
            <span>{{ weakTip }}</span>
          </div>
        </div>

        <div class="v8-sup-trend-title">近 7 日入库趋势</div>
        <V8Chart :option="weekOption" height="180px" />
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
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
import type { EChartsCoreOption } from 'echarts/core'
import V8Chart from '@/v8/components/V8Chart.vue'
import { getAllSuppliers, getSuppliers } from '@/v8/api/data'
import {
  healthMeta,
  scoreGradeMeta,
  averageSupplierScores,
  computeSupplierScore,
  type Health,
  type Supplier,
  type SupplierScore,
} from '@/v8/mock/types'
import { buildRadarOption, weakTipOf } from '@/v8/utils/supplierRadar'

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

const columns = [
  { title: '供数方名称', dataIndex: 'name', slotName: 'name', ellipsis: true, tooltip: true },
  { title: '编码', dataIndex: 'code', slotName: 'code', width: 120 },
  { title: '供数方状态', dataIndex: 'health', slotName: 'health', width: 110 },
  { title: '启用状态', dataIndex: 'status', slotName: 'status', width: 90 },
  { title: '今日入库', dataIndex: 'todayCount', slotName: 'todayCount', width: 110 },
  { title: '今日拒收率', dataIndex: 'todayRejectRate', slotName: 'todayRejectRate', width: 110 },
  { title: '最近推送', dataIndex: 'lastPushAt', width: 160 },
]

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

/** 今日入库：跳转接入数据对账并携带该供数方筛选（上区聚合 + 下区明细同时回填） */
function goDataCheck(row: Supplier) {
  router.push({ path: '/v8/data-check', query: { supplierId: row.id } })
}

const weekOption = computed<EChartsCoreOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 12, top: 16, bottom: 24 },
  xAxis: {
    type: 'category',
    data: (current.value?.weekTrend || []).map((_, i) => `D${i + 1}`),
    axisLine: { lineStyle: { color: '#e5e6eb' } },
  },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f2f3f5' } } },
  series: [
    {
      type: 'line', smooth: true, showSymbol: false,
      data: current.value?.weekTrend || [],
      lineStyle: { width: 2, color: '#1677ff' },
      areaStyle: { color: 'rgba(22,119,255,0.12)' },
    },
  ],
}))

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
const radarOption = computed<EChartsCoreOption>(() =>
  currentScore.value ? buildRadarOption(currentScore.value, orgAvgScore.value, current.value?.name ?? '') : {}
)

onMounted(() => {
  // 数据概览环图下钻回填：?health=active|healthy|error|disabled
  const h = route.query.health
  if (h === 'active' || h === 'healthy' || h === 'error' || h === 'disabled') health.value = h
  fetchData(1)
  // 接入规范列表下钻回填：?supplierId=s1 自动打开对应供方详情
  const sid = route.query.supplierId
  if (typeof sid === 'string' && sid) {
    const target = getAllSuppliers().find((s) => s.id === sid)
    if (target) openDetail(target)
  }
})
</script>

<style lang="scss" scoped>
.v8-text-warn { color: #ff7d00; }

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
.v8-sup-trend-title {
  font-weight: 600;
  color: #1d2129;
  margin: 20px 0 8px;
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
</style>
