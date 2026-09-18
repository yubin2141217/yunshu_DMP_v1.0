/** 综合看板：接入 + 推送双流聚合（Mock） */
import { mtMock, type SupplyTimeRange } from '@/mock/mt'
import { pushMock, pushVolumeOf, type PushScheme } from '@/mock/push'

export type DashboardTimeRange = SupplyTimeRange

const TIME_SCALE: Record<DashboardTimeRange, number> = {
  today: 0.08,
  '3d': 0.22,
  '1w': 0.45,
  '1m': 1,
}

export interface DashboardTopRow {
  id: string
  name: string
  /** failTopN 为失败率(%)；backlogTopN 为当前堆积量(条) */
  value: number
  /** 所属机构（推送异常列表展示用） */
  orgName?: string
  orgStatUnit?: string
  orgSalesName?: string
}

export interface DashboardFlowTrend {
  dates: string[]
  inbound: number[]
  push: number[]
}

export interface DashboardOverview {
  inboundTotal: number
  inboundBacklog: number
  inboundSchemeCount: number
  inboundOrgCount: number
  supplierCount: number
  /** 当前筛选范围内接入方案勾选字段去重计数 */
  inboundFieldCount: number
  pushSuccess: number
  pushFail: number
  /** null 表示无流量，UI 展示 — */
  successRate: number | null
  pushSchemeCount: number
  pushOrgCount: number
  backlogSum: number
  flowTrend: DashboardFlowTrend
  failTopN: DashboardTopRow[]
  backlogTopN: DashboardTopRow[]
  zeroInboundAlerts: { id: string; name: string; orgName: string; orgStatUnit?: string; orgSalesName?: string; lastAccessAt: string }[]
  inboundByOrg: {
    id: string
    name: string
    orgStatUnit?: string
    orgSalesName?: string
    inboundCount: number
    backlogCount: number
    schemeCount: number
  }[]
  inboundByStandard: {
    id: string
    name: string
    inboundCount: number
    backlogCount: number
    /** 所属机构 */
    orgName?: string
    orgStatUnit?: string
    orgSalesName?: string
  }[]
  inboundBySupplier: {
    id: string
    name: string
    inboundCount: number
    backlogCount: number
    /** 该供数方关联的接入方案数 */
    schemeCount: number
  }[]
  pushByScheme: {
    id: string
    name: string
    orgId: string
    orgName: string
    orgStatUnit?: string
    orgSalesName?: string
    successCount: number
    failCount: number
    backlogCount: number
    successRate: number | null
  }[]
  pushByOrg: {
    id: string
    name: string
    orgStatUnit?: string
    orgSalesName?: string
    successCount: number
    failCount: number
    backlogCount: number
    successRate: number | null
    /** 该机构下的推送方案数 */
    schemeCount: number
  }[]
}

export interface PushDimRow {
  id: string
  name: string
  successCount: number
  failCount: number
  backlogCount: number
}

export interface PushDetailRow {
  id: string
  schemeId: string
  schemeName: string
  orgId: string
  orgName: string
  orgStatUnit?: string
  orgSalesName?: string
  channelType: string
  successCount: number
  failCount: number
  backlogCount: number
  lastPushAt: string
}

export interface PushStatsOverview {
  successTotal: number
  failTotal: number
  successRate: number | null
  backlogSum: number
  enabledSchemeCount: number
  byOrg: PushDimRow[]
  byScheme: PushDimRow[]
  details: PushDetailRow[]
  trend: { dates: string[]; success: number[]; fail: number[] }
}

export interface DashboardFilter {
  orgIds?: string[]
  standardIds?: string[]
  supplierIds?: string[]
  pushSchemeIds?: string[]
  timeRange?: DashboardTimeRange
}

function scaleStats(scheme: PushScheme, range: DashboardTimeRange) {
  const s = TIME_SCALE[range] ?? 1
  const success = Math.max(0, Math.round((scheme.stats?.successTotal || 0) * s))
  const fail = Math.max(0, Math.round((scheme.stats?.failTotal || 0) * Math.min(1, s * 1.2)))
  // 堆积为当前瞬时值，不随时间跨度缩放
  const backlog = Math.max(0, Math.round(scheme.stats?.backlog || 0))
  return { success, fail, backlog }
}

function resolveOrgMeta(orgId?: string) {
  if (!orgId) return { orgStatUnit: '', orgSalesName: '' }
  const org = mtMock.getOrgs().find((o) => o.id === orgId)
  if (org) return { orgStatUnit: org.statUnit || '', orgSalesName: org.salesName || '' }
  const recv = pushMock.listReceivers({}).find((r) => r.id === orgId)
  if (recv?.relatedMtOrgId) {
    const related = mtMock.getOrgs().find((o) => o.id === recv.relatedMtOrgId)
    return { orgStatUnit: related?.statUnit || '', orgSalesName: related?.salesName || '' }
  }
  return { orgStatUnit: '', orgSalesName: '' }
}

function filterPushSchemes(filter: DashboardFilter): PushScheme[] {
  const orgSet = filter.orgIds?.length ? new Set(filter.orgIds) : null
  const psSet = filter.pushSchemeIds?.length ? new Set(filter.pushSchemeIds) : null
  let list = pushMock.listSchemes({})
  if (orgSet) list = list.filter((s) => orgSet.has(s.orgId))
  if (psSet) list = list.filter((s) => psSet.has(s.id))
  return list
}

function rateOf(success: number, fail: number): number | null {
  const den = success + fail
  if (den <= 0) return null
  return Math.round((success / den) * 1000) / 10
}

function buildFlowTrend(inboundTotal: number, pushTotal: number, range: DashboardTimeRange): DashboardFlowTrend {
  const pointCount = range === 'today' ? 12 : range === '3d' ? 3 : range === '1w' ? 7 : 14
  const dates: string[] = []
  const inbound: number[] = []
  const push: number[] = []
  const baseIn = Math.max(1, Math.round(inboundTotal / pointCount))
  const basePush = Math.max(1, Math.round(pushTotal / pointCount))
  const today = new Date()
  for (let i = pointCount - 1; i >= 0; i--) {
    const d = new Date(today)
    if (range === 'today') {
      d.setHours(today.getHours() - i)
      dates.push(`${String(d.getHours()).padStart(2, '0')}:00`)
    } else {
      d.setDate(today.getDate() - i)
      dates.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
    const waveIn = 0.75 + Math.sin(i / 2.2) * 0.25
    const wavePush = 0.72 + Math.sin((i + 1.2) / 2.4) * 0.22
    inbound.push(Math.max(0, Math.round(baseIn * waveIn)))
    push.push(Math.max(0, Math.round(basePush * wavePush)))
  }
  return { dates, inbound, push }
}

export function getDashboardOverview(filter: DashboardFilter = {}): DashboardOverview {
  const range = filter.timeRange || 'today'
  const inboundFilter = {
    orgIds: filter.orgIds,
    standardIds: filter.standardIds,
    supplierIds: filter.supplierIds,
    timeRange: range,
  }
  const inbound = mtMock.getSupplyStats(inboundFilter)
  const schemes = filterPushSchemes(filter)
  let pushSuccess = 0
  let pushFail = 0
  let backlogSum = 0
  const failRows: DashboardTopRow[] = []
  const backlogRows: DashboardTopRow[] = []
  const pushByScheme: DashboardOverview['pushByScheme'] = []

  const pushByOrgMap = new Map<string, DashboardOverview['pushByOrg'][number]>()

  for (const s of schemes) {
    const scaled = scaleStats(s, range)
    pushSuccess += scaled.success
    pushFail += scaled.fail
    backlogSum += scaled.backlog
    // 高失败率口径：近3天（d3）推送总失败率 = 失败 / (成功 + 失败)，保留一位小数
    const d3Success = pushVolumeOf(s.stats?.successByRange, 'd3')
    const d3Fail = pushVolumeOf(s.stats?.failByRange, 'd3')
    const d3Den = d3Success + d3Fail
    const failRate = d3Den > 0 ? Math.round((d3Fail / d3Den) * 1000) / 10 : 0
    failRows.push({
      id: s.id,
      name: s.name,
      value: failRate,
      orgName: s.orgName || '—',
      ...resolveOrgMeta(s.orgId),
    })
    backlogRows.push({
      id: s.id,
      name: s.name,
      value: scaled.backlog,
      orgName: s.orgName || '—',
      ...resolveOrgMeta(s.orgId),
    })
    pushByScheme.push({
      id: s.id,
      name: s.name,
      orgId: s.orgId,
      orgName: s.orgName || '—',
      ...resolveOrgMeta(s.orgId),
      successCount: scaled.success,
      failCount: scaled.fail,
      backlogCount: scaled.backlog,
      successRate: rateOf(scaled.success, scaled.fail),
    })
    const orgId = s.orgId || 'unknown'
    const hit = pushByOrgMap.get(orgId)
    if (hit) {
      hit.successCount += scaled.success
      hit.failCount += scaled.fail
      hit.backlogCount += scaled.backlog
      hit.schemeCount += 1
      hit.successRate = rateOf(hit.successCount, hit.failCount)
    } else {
      pushByOrgMap.set(orgId, {
        id: orgId,
        name: s.orgName || '未命名机构',
        ...resolveOrgMeta(s.orgId),
        successCount: scaled.success,
        failCount: scaled.fail,
        backlogCount: scaled.backlog,
        successRate: rateOf(scaled.success, scaled.fail),
        schemeCount: 1,
      })
    }
  }

  failRows.sort((a, b) => b.value - a.value)
  backlogRows.sort((a, b) => b.value - a.value)
  pushByScheme.sort((a, b) => b.failCount + b.backlogCount - (a.failCount + a.backlogCount) || b.successCount - a.successCount)

  const standards = mtMock.getStandards()
  const orgSet = filter.orgIds?.length ? new Set(filter.orgIds) : null
  const orgNameOf = (orgId?: string) => {
    if (!orgId) return '—'
    return mtMock.getOrgs().find((o) => o.id === orgId)?.name || '—'
  }
  // 零接入：按最近接入时间降序（无记录排最后）
  const byLastAccessDesc = (
    a: { lastAccessAt: string },
    b: { lastAccessAt: string },
  ) => {
    if (a.lastAccessAt === '—') return 1
    if (b.lastAccessAt === '—') return -1
    return b.lastAccessAt.localeCompare(a.lastAccessAt)
  }

  let zeroInboundAlerts = standards
    .filter((st) => st.status === 'enabled')
    .filter((st) => !orgSet || orgSet.has(st.orgId || ''))
    .filter((st) => !st.accessStats || Number(st.accessStats.d3) === 0)
    .slice(0, 11)
    .map((st) => ({
      id: st.id,
      name: st.name,
      orgName: st.orgName || orgNameOf(st.orgId),
      ...resolveOrgMeta(st.orgId),
      lastAccessAt: st.lastAccessAt || '—',
    }))
    .sort(byLastAccessDesc)

  const enabledInbound = standards.filter((st) => {
    if (st.status !== 'enabled') return false
    if (orgSet && !orgSet.has(st.orgId || '')) return false
    return true
  })

  // 原型演示：若当前无零接入，补低流量方案作为关注示例
  if (zeroInboundAlerts.length === 0) {
    zeroInboundAlerts = enabledInbound
      .slice()
      .sort((a, b) => Number(a.accessStats?.today || 0) - Number(b.accessStats?.today || 0))
      .slice(0, 3)
      .map((st) => ({
        id: st.id,
        name: st.name,
        orgName: st.orgName || orgNameOf(st.orgId),
        ...resolveOrgMeta(st.orgId),
        lastAccessAt: st.lastAccessAt || '—',
      }))
      .sort(byLastAccessDesc)
  }

  const fieldIdSet = new Set<string>()
  for (const st of enabledInbound) {
    const ids = st.fieldIds?.length ? st.fieldIds : st.metadataId ? [st.metadataId] : []
    ids.forEach((id) => fieldIdSet.add(id))
  }

  const schemeCountByOrg = new Map<string, number>()
  const schemeCountBySupplier = new Map<string, number>()
  // 依据当前筛选范围内实际产生接入量的方案明细统计方案数，
  // 保证有接入量的机构 / 供数方方案数必 ≥ 1
  const standardSetByOrg = new Map<string, Set<string>>()
  const standardSetBySupplier = new Map<string, Set<string>>()
  for (const row of inbound.details) {
    if (row.orgId) {
      const set = standardSetByOrg.get(row.orgId) || new Set<string>()
      set.add(row.standardId)
      standardSetByOrg.set(row.orgId, set)
    }
    if (row.supplierId) {
      const set = standardSetBySupplier.get(row.supplierId) || new Set<string>()
      set.add(row.standardId)
      standardSetBySupplier.set(row.supplierId, set)
    }
  }
  standardSetByOrg.forEach((set, oid) => schemeCountByOrg.set(oid, set.size))
  standardSetBySupplier.forEach((set, sid) => schemeCountBySupplier.set(sid, set.size))

  /** 方案 id -> 方案（用于给方案级统计行补机构信息） */
  const standardById = new Map(standards.map((st) => [st.id, st]))

  const pushOrgIds = new Set(schemes.map((s) => s.orgId).filter(Boolean))
  const pushByOrg = [...pushByOrgMap.values()].sort((a, b) => b.successCount - a.successCount)

  return {
    inboundTotal: inbound.totalInbound,
    inboundBacklog: inbound.totalBacklog,
    inboundSchemeCount: Math.max(enabledInbound.length, inbound.byStandard.length),
    inboundOrgCount: inbound.byOrg.length,
    supplierCount: inbound.bySupplier.length,
    inboundFieldCount: fieldIdSet.size,
    pushSuccess,
    pushFail,
    successRate: rateOf(pushSuccess, pushFail),
    pushSchemeCount: schemes.filter((s) => s.status === 'enabled').length || schemes.length,
    pushOrgCount: pushOrgIds.size,
    backlogSum,
    flowTrend: buildFlowTrend(inbound.totalInbound, pushSuccess, range),
    // 高失败率：近3天推送总失败率超过 10% 的方案，按失败率从大到小
    failTopN: failRows.filter((r) => r.value > 10).slice(0, 8),
    // 高堆积：当前推送堆积数据量超过 100 条的方案，按堆积量从大到小
    backlogTopN: backlogRows.filter((r) => r.value > 100).slice(0, 8),
    zeroInboundAlerts,
    inboundByOrg: inbound.byOrg.slice(0, 12).map((r) => ({
      id: r.id,
      name: r.name,
      ...resolveOrgMeta(r.id),
      inboundCount: r.inboundCount,
      backlogCount: r.backlogCount,
      // 有接入量则方案数不可能为 0，缺失统计时兜底为 1
      schemeCount: schemeCountByOrg.get(r.id) || (r.inboundCount > 0 ? 1 : 0),
    })),
    inboundByStandard: inbound.byStandard.slice(0, 12).map((r) => {
      const st = standardById.get(r.id)
      return {
        id: r.id,
        name: r.name,
        inboundCount: r.inboundCount,
        backlogCount: r.backlogCount,
        orgName: st?.orgName || orgNameOf(st?.orgId),
        ...resolveOrgMeta(st?.orgId),
      }
    }),
    inboundBySupplier: inbound.bySupplier.slice(0, 12).map((r) => ({
      id: r.id,
      name: r.name,
      inboundCount: r.inboundCount,
      backlogCount: r.backlogCount,
      // 有接入量则方案数不可能为 0，缺失统计时兜底为 1
      schemeCount: schemeCountBySupplier.get(r.id) || (r.inboundCount > 0 ? 1 : 0),
    })),
    pushByScheme: pushByScheme.slice(0, 12),
    pushByOrg: pushByOrg.slice(0, 12),
  }
}

export function getPushDashboardStats(filter: DashboardFilter = {}): PushStatsOverview {
  const range = filter.timeRange || 'today'
  const schemes = filterPushSchemes(filter)
  const details: PushDetailRow[] = schemes.map((s) => {
    const scaled = scaleStats(s, range)
    return {
      id: s.id,
      schemeId: s.id,
      schemeName: s.name,
      orgId: s.orgId,
      orgName: s.orgName,
      ...resolveOrgMeta(s.orgId),
      channelType: s.channelType,
      successCount: scaled.success,
      failCount: scaled.fail,
      backlogCount: scaled.backlog,
      lastPushAt: s.stats?.lastPushAt || '—',
    }
  })

  const successTotal = details.reduce((n, r) => n + r.successCount, 0)
  const failTotal = details.reduce((n, r) => n + r.failCount, 0)
  const backlogSum = details.reduce((n, r) => n + r.backlogCount, 0)

  const sumBy = (key: 'orgId' | 'schemeId', nameKey: 'orgName' | 'schemeName') => {
    const map = new Map<string, PushDimRow>()
    for (const row of details) {
      const id = row[key]
      const hit = map.get(id)
      if (hit) {
        hit.successCount += row.successCount
        hit.failCount += row.failCount
        hit.backlogCount += row.backlogCount
      } else {
        map.set(id, {
          id,
          name: row[nameKey],
          successCount: row.successCount,
          failCount: row.failCount,
          backlogCount: row.backlogCount,
        })
      }
    }
    return [...map.values()].sort((a, b) => b.successCount - a.successCount)
  }

  const pointCount = range === 'today' ? 12 : range === '3d' ? 3 : range === '1w' ? 7 : 14
  const dates: string[] = []
  const success: number[] = []
  const fail: number[] = []
  const baseS = Math.max(1, Math.round(successTotal / pointCount))
  const baseF = Math.max(0, Math.round(failTotal / pointCount))
  const today = new Date()
  for (let i = pointCount - 1; i >= 0; i--) {
    const d = new Date(today)
    if (range === 'today') {
      d.setHours(today.getHours() - i)
      dates.push(`${String(d.getHours()).padStart(2, '0')}:00`)
    } else {
      d.setDate(today.getDate() - i)
      dates.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
    const wave = 0.75 + Math.sin(i / 2.2) * 0.25
    success.push(Math.max(0, Math.round(baseS * wave)))
    fail.push(Math.max(0, Math.round(baseF * (1.1 - Math.sin((i + 1) / 3) * 0.3))))
  }

  return {
    successTotal,
    failTotal,
    successRate: rateOf(successTotal, failTotal),
    backlogSum,
    enabledSchemeCount: schemes.filter((s) => s.status === 'enabled').length,
    byOrg: sumBy('orgId', 'orgName'),
    byScheme: sumBy('schemeId', 'schemeName'),
    details: details.sort((a, b) => b.successCount - a.successCount),
    trend: { dates, success, fail },
  }
}

export function getDashboardFilterOptions() {
  const base = mtMock.getSupplyFilterOptions()
  const pushSchemes = pushMock.listSchemes({}).map((s) => ({ label: s.name, value: s.id }))
  return { ...base, pushSchemes }
}
