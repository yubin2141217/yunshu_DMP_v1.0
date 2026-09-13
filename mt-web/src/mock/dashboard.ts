/** 综合看板：接入 + 推送双流聚合（Mock） */
import { mtMock, type SupplyTimeRange } from '@/mock/mt'
import { pushMock, type PushScheme } from '@/mock/push'

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
  value: number
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
  inboundByStandard: { id: string; name: string; inboundCount: number; backlogCount: number }[]
  inboundBySupplier: { id: string; name: string; inboundCount: number; backlogCount: number }[]
  pushByScheme: {
    id: string
    name: string
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
  const backlog = Math.max(0, Math.round((scheme.stats?.backlog || 0) * Math.min(1.4, s * 1.5 + 0.2)))
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
    failRows.push({ id: s.id, name: s.name, value: scaled.fail })
    backlogRows.push({ id: s.id, name: s.name, value: scaled.backlog })
    pushByScheme.push({
      id: s.id,
      name: s.name,
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
  let zeroInboundAlerts = standards
    .filter((st) => st.status === 'enabled')
    .filter((st) => !orgSet || orgSet.has(st.orgId || ''))
    .filter((st) => !st.accessStats || Number(st.accessStats.today) === 0)
    .slice(0, 8)
    .map((st) => ({
      id: st.id,
      name: st.name,
      orgName: st.orgName || orgNameOf(st.orgId),
      ...resolveOrgMeta(st.orgId),
      lastAccessAt: st.lastAccessAt || '—',
    }))

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
  }

  const fieldIdSet = new Set<string>()
  for (const st of enabledInbound) {
    const ids = st.fieldIds?.length ? st.fieldIds : st.metadataId ? [st.metadataId] : []
    ids.forEach((id) => fieldIdSet.add(id))
  }

  const schemeCountByOrg = new Map<string, number>()
  for (const st of enabledInbound) {
    const oid = st.orgId || ''
    if (!oid) continue
    schemeCountByOrg.set(oid, (schemeCountByOrg.get(oid) || 0) + 1)
  }

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
    failTopN: failRows.filter((r) => r.value > 0).slice(0, 8),
    backlogTopN: backlogRows.filter((r) => r.value > 0).slice(0, 8),
    zeroInboundAlerts,
    inboundByOrg: inbound.byOrg.slice(0, 12).map((r) => ({
      id: r.id,
      name: r.name,
      ...resolveOrgMeta(r.id),
      inboundCount: r.inboundCount,
      backlogCount: r.backlogCount,
      schemeCount: schemeCountByOrg.get(r.id) || 0,
    })),
    inboundByStandard: inbound.byStandard.slice(0, 12).map((r) => ({
      id: r.id,
      name: r.name,
      inboundCount: r.inboundCount,
      backlogCount: r.backlogCount,
    })),
    inboundBySupplier: inbound.bySupplier.slice(0, 12).map((r) => ({
      id: r.id,
      name: r.name,
      inboundCount: r.inboundCount,
      backlogCount: r.backlogCount,
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
