/* ============================================================
 * V8 业务 API：概览 / 统计 / 入库核对 / 供数方
 * 所有查询强制注入当前用户供方数据范围。
 * ============================================================ */
import { delay, v8Service } from '@/v8/mock/service'
import { currentScope } from './scope'
import type {
  DataEntry,
  DataEntryQuery,
  Overview,
  OverviewRange,
  OverviewRejectReason,
  PageResult,
  StatsQuery,
  StatsRow,
  StatsSummary,
  Supplier,
  SupplierQuery,
} from '@/v8/mock/types'

/** 数据概览（含健康度/环比/拒收率/推送成功率/待办/趋势及 V1.1 五分区聚合） */
export async function getOverview(range: OverviewRange = '7d'): Promise<Overview> {
  await delay()
  return v8Service.overview(currentScope(), range)
}

/** 拒收原因分布（近 7 天口径，供数方查看页用） */
export async function getRejectReasons(): Promise<OverviewRejectReason[]> {
  await delay()
  return v8Service.rejectReasons(currentScope())
}

/** 供数统计：汇总指标 */
export async function getStatsSummary(q: StatsQuery): Promise<StatsSummary> {
  await delay(180)
  return v8Service.statsSummary(q, currentScope())
}

/** 供数统计：明细分页 + 趋势 + 拒收原因分布 */
export async function getStatsRows(q: StatsQuery, page: number, pageSize: number) {
  await delay(180)
  return v8Service.statsRows(q, currentScope(), page, pageSize)
}

/** 当前用户可见供方下拉选项 */
export function supplierOptions(): { label: string; value: string }[] {
  return v8Service.supplierOptions(currentScope())
}

/** 接入日志：入库条目明细分页（仅索引字段） */
export async function getDataEntries(q: DataEntryQuery): Promise<PageResult<DataEntry>> {
  await delay()
  return v8Service.entries(q, currentScope())
}

/** 供数方查看：分页 */
export async function getSuppliers(q: SupplierQuery): Promise<PageResult<Supplier>> {
  await delay()
  return v8Service.suppliers(q, currentScope())
}

/** 供数方查看：不分页（统计/下拉用） */
export function getAllSuppliers(): Supplier[] {
  return v8Service.allSuppliers(currentScope())
}

export type { StatsRow }
