import {
  getDashboardFilterOptions as mockFilterOptions,
  getDashboardOverview as mockOverview,
  getPushDashboardStats as mockPushStats,
  type DashboardFilter,
} from '@/mock/dashboard'

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

/** 综合看板筛选选项（含推送方案） */
export async function getDashboardFilterOptions() {
  await delay(80)
  return mockFilterOptions()
}

/** 综合看板：KPI + 接入/推送趋势 + 异常与分维列表 */
export async function getDashboardOverview(filter: DashboardFilter = {}) {
  await delay()
  return mockOverview(filter)
}

/** 推送侧分维统计（可选扩展） */
export async function getPushDashboardStats(filter: DashboardFilter = {}) {
  await delay()
  return mockPushStats(filter)
}

export type {
  DashboardFilter,
  DashboardOverview,
  DashboardFlowTrend,
  DashboardTopRow,
  PushStatsOverview,
  PushDetailRow,
  PushDimRow,
  DashboardTimeRange,
} from '@/mock/dashboard'
