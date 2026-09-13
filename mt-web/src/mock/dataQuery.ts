/** 数据查询：接入 / 推送明细（Mock）— 接入侧与接入方案 accessStats 同源 */
import {
  accessVolumeOf,
  mtMock,
  type AccessVolumeRange,
  type AccessVolumeStats,
  type Standard,
} from '@/mock/mt'
import { pushMock } from '@/mock/push'

export type DataFlow = 'inbound' | 'outbound'
export type DataQueryRange = 'total' | 'today' | 'd3' | 'w1' | 'm1' | 'custom'

export interface DataQueryFieldMeta {
  key: string
  title: string
  /** String | Int | Date 等 */
  dataType: string
}

export interface DataQueryRow {
  _id: string
  flow: DataFlow
  schemeId: string
  schemeName: string
  orgId: string
  orgName: string
  orgStatUnit?: string
  orgSalesName?: string
  supplierId: string
  supplierName: string
  accessAt: string
  [key: string]: string | undefined
}

export interface DataQueryFilter {
  flow: DataFlow | ''
  orgId: string
  orgName?: string
  supplierId: string
  supplierName?: string
  schemeId: string
  schemeName: string
  range: DataQueryRange
  /** custom 时用，格式 YYYY-MM-DD HH:mm:ss */
  dateFrom?: string
  dateTo?: string
  /** 推送结果：成功 / 失败（仅 outbound） */
  pushResult?: 'success' | 'fail' | ''
  /** 表头字段模糊筛选（仅字符型） */
  fieldFilters?: Record<string, string>
  page: number
  pageSize: number
}

export const dataFlowOptions = [
  { label: '接入', value: 'inbound' as const },
  { label: '推送', value: 'outbound' as const },
]

export const dataQueryRangeOptions: { label: string; value: DataQueryRange }[] = [
  { label: '累计', value: 'total' },
  { label: '今日', value: 'today' },
  { label: '近3天', value: 'd3' },
  { label: '近1周', value: 'w1' },
  { label: '近1月', value: 'm1' },
]

const INBOUND_FIELDS: DataQueryFieldMeta[] = [
  { key: 'supplier_code', title: 'supplier_code', dataType: 'String' },
  { key: 'org_id', title: 'org_id', dataType: 'String' },
  { key: 'platform', title: 'platform', dataType: 'String' },
  { key: 'platform_name', title: 'platform_name', dataType: 'String' },
  { key: 'news_uuid', title: 'news_uuid', dataType: 'String' },
  { key: 'news_title', title: 'news_title', dataType: 'String' },
  { key: 'news_content', title: 'news_content', dataType: 'String' },
  { key: 'news_read_count', title: 'news_read_count', dataType: 'Int' },
]

const OUTBOUND_FIELDS: DataQueryFieldMeta[] = [
  { key: 'supplier_code', title: 'supplier_code', dataType: 'String' },
  { key: 'org_id', title: 'org_id', dataType: 'String' },
  { key: 'platform', title: 'platform', dataType: 'String' },
  { key: 'news_uuid', title: 'news_uuid', dataType: 'String' },
  { key: 'news_title', title: 'news_title', dataType: 'String' },
  { key: 'push_batch_id', title: 'push_batch_id', dataType: 'String' },
  { key: 'push_status', title: 'push_status', dataType: 'String' },
]

const PLATFORMS = ['weibo', 'wechat', 'toutiao', 'douyin', 'web']
const PLATFORM_NAMES = ['微博', '微信公众号', '今日头条', '抖音', '网站']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

/** 将查询条件映射为列表页同源的 accessStats 时间窗 */
function resolveVolumeRange(params: DataQueryFilter): AccessVolumeRange {
  if (params.range && params.range !== 'custom') return params.range
  if (!params.dateFrom || !params.dateTo) return 'total'
  const start = new Date(params.dateFrom.includes(' ') ? params.dateFrom : `${params.dateFrom} 00:00:00`)
  const end = new Date(params.dateTo.includes(' ') ? params.dateTo : `${params.dateTo} 23:59:59`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'total'
  const days = (end.getTime() - start.getTime()) / 86400000
  if (days <= 1.2) return 'today'
  if (days <= 3.5) return 'd3'
  if (days <= 8) return 'w1'
  if (days <= 35) return 'm1'
  return 'total'
}

function orgNameOf(orgId: string) {
  return mtMock.getOrgs().find((o) => o.id === orgId)?.name || orgId || '—'
}

function supplierNameOf(supplierId: string) {
  return mtMock.getSuppliers().find((s) => s.id === supplierId)?.name || supplierId || '—'
}

function supplierCodeOf(supplierId: string) {
  return mtMock.getSuppliers().find((s) => s.id === supplierId)?.code || supplierId || ''
}

function orgCodeOf(orgId: string) {
  return mtMock.getOrgs().find((o) => o.id === orgId)?.code || orgId || ''
}

type SchemeBucket = {
  flow: DataFlow
  id: string
  name: string
  orgId: string
  orgName: string
  orgStatUnit: string
  orgSalesName: string
  supplierId: string
  supplierName: string
  stats?: AccessVolumeStats
  fallbackCount: number
}

function orgMeta(orgId: string) {
  const org = mtMock.getOrgs().find((o) => o.id === orgId)
  if (org) {
    return {
      orgName: org.name,
      orgStatUnit: org.statUnit || '',
      orgSalesName: org.salesName || '',
    }
  }
  const recv = pushMock.listReceivers({}).find((r) => r.id === orgId)
  if (recv?.relatedMtOrgId) {
    const related = mtMock.getOrgs().find((o) => o.id === recv.relatedMtOrgId)
    return {
      orgName: recv.name,
      orgStatUnit: related?.statUnit || '',
      orgSalesName: related?.salesName || '',
    }
  }
  return { orgName: orgId || '—', orgStatUnit: '', orgSalesName: '' }
}

function listInboundBuckets(): SchemeBucket[] {
  return mtMock.getStandards().map((st: Standard) => {
    const meta = orgMeta(st.orgId || '')
    return {
      flow: 'inbound' as const,
      id: st.id,
      name: st.name,
      orgId: st.orgId || '',
      orgName: st.orgName || meta.orgName,
      orgStatUnit: st.orgStatUnit || meta.orgStatUnit,
      orgSalesName: st.orgSalesName || meta.orgSalesName,
      supplierId: st.supplierId || '',
      supplierName: supplierNameOf(st.supplierId || ''),
      stats: st.accessStats,
      fallbackCount: 0,
    }
  })
}

function listOutboundBuckets(): SchemeBucket[] {
  return pushMock.listSchemes({}).map((ps) => {
    const supplierId = ps.supplierIds?.[0] || ''
    const meta = orgMeta(ps.orgId || '')
    return {
      flow: 'outbound' as const,
      id: ps.id,
      name: ps.name,
      orgId: ps.orgId || '',
      orgName: ps.orgName || meta.orgName,
      orgStatUnit: ps.orgStatUnit || meta.orgStatUnit,
      orgSalesName: ps.orgSalesName || meta.orgSalesName,
      supplierId,
      supplierName: supplierNameOf(supplierId),
      fallbackCount: Math.max(40, Number(ps.stats?.successTotal) || 80),
    }
  })
}

function matchBucket(b: SchemeBucket, params: DataQueryFilter) {
  if (params.orgId && b.orgId !== params.orgId) return false
  if (!params.orgId && params.orgName?.trim() && !b.orgName.includes(params.orgName.trim())) return false
  if (params.supplierId && b.supplierId !== params.supplierId) return false
  if (
    !params.supplierId &&
    params.supplierName?.trim() &&
    !b.supplierName.includes(params.supplierName.trim())
  )
    return false
  if (params.schemeId && b.id !== params.schemeId) return false
  if (!params.schemeId && params.schemeName?.trim() && !b.name.includes(params.schemeName.trim()))
    return false
  return true
}

function volumeOfBucket(b: SchemeBucket, range: AccessVolumeRange) {
  if (b.flow === 'inbound') return accessVolumeOf(b.stats, range)
  const total = Math.max(0, b.fallbackCount || 0)
  const ratio: Record<AccessVolumeRange, number> = {
    total: 1,
    today: 0.02,
    d3: 0.06,
    w1: 0.14,
    m1: 0.38,
  }
  return Math.max(0, Math.round(total * (ratio[range] ?? 1)))
}

function accessAtForIndex(index: number, range: AccessVolumeRange, dateFrom?: string, dateTo?: string) {
  if (dateFrom && dateTo) {
    const start = new Date(dateFrom.includes(' ') ? dateFrom : `${dateFrom} 00:00:00`).getTime()
    const end = new Date(dateTo.includes(' ') ? dateTo : `${dateTo} 23:59:59`).getTime()
    if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
      const span = end - start
      const t = start + ((index * 9973) % span)
      return formatDate(new Date(t))
    }
  }
  const dayMap: Record<AccessVolumeRange, number> = {
    total: 40,
    today: 0,
    d3: 3,
    w1: 7,
    m1: 30,
  }
  const maxDay = Math.max(dayMap[range] ?? 30, 1)
  const at = daysAgo(index % maxDay)
  at.setHours(8 + (index % 12), index % 60, index % 60, 0)
  return formatDate(at)
}

function makeRow(
  b: SchemeBucket,
  index: number,
  range: AccessVolumeRange,
  params: DataQueryFilter,
): DataQueryRow {
  const pi = index % PLATFORMS.length
  return {
    _id: `dq-${b.flow}-${b.id}-${index}`,
    flow: b.flow,
    schemeId: b.id,
    schemeName: b.name,
    orgId: b.orgId,
    orgName: b.orgName,
    orgStatUnit: b.orgStatUnit,
    orgSalesName: b.orgSalesName,
    supplierId: b.supplierId,
    supplierName: b.supplierName,
    accessAt: accessAtForIndex(index, range, params.dateFrom, params.dateTo),
    supplier_code: supplierCodeOf(b.supplierId),
    org_id: orgCodeOf(b.orgId),
    platform: PLATFORMS[pi],
    platform_name: PLATFORM_NAMES[pi],
    news_uuid: `uuid-${b.id}-${10000 + index}`,
    news_title: `${b.flow === 'inbound' ? '接入' : '推送'}样例标题_${index + 1}`,
    news_content: `正文摘要_${index + 1}`,
    news_read_count: String(100 + (index % 900)),
    push_batch_id: b.flow === 'outbound' ? `batch-${Math.floor(index / 10)}` : '',
    push_status: b.flow === 'outbound' ? (index % 7 === 0 ? 'fail' : 'success') : '',
  }
}

export function getDataQueryFieldMeta(flow: DataFlow | ''): DataQueryFieldMeta[] {
  if (flow === 'outbound') return OUTBOUND_FIELDS
  return INBOUND_FIELDS
}

export function getDataQuerySchemeOptions(flow: DataFlow | '') {
  const buckets =
    flow === 'outbound'
      ? listOutboundBuckets()
      : flow === 'inbound'
        ? listInboundBuckets()
        : [...listInboundBuckets(), ...listOutboundBuckets()]
  return buckets.map((b) => ({ label: b.name, value: b.id }))
}

export function queryDataRecords(params: DataQueryFilter) {
  const fields = getDataQueryFieldMeta(params.flow || 'inbound')
  const volumeRange = resolveVolumeRange(params)
  const fieldFilters = { ...(params.fieldFilters || {}) }
  if (params.pushResult === 'success' || params.pushResult === 'fail') {
    fieldFilters.push_status = params.pushResult
  }
  const hasFieldFilter = Object.values(fieldFilters).some((v) => String(v || '').trim())

  let buckets =
    params.flow === 'outbound'
      ? listOutboundBuckets()
      : params.flow === 'inbound'
        ? listInboundBuckets()
        : [...listInboundBuckets(), ...listOutboundBuckets()]

  buckets = buckets.filter((b) => matchBucket(b, params))

  const page = Math.max(1, params.page || 1)
  const pageSize = Math.max(1, params.pageSize || 20)
  const from = (page - 1) * pageSize

  if (hasFieldFilter) {
    const SAMPLE_CAP = 400
    let rows: DataQueryRow[] = []
    for (const b of buckets) {
      const count = Math.min(volumeOfBucket(b, volumeRange), SAMPLE_CAP)
      for (let i = 0; i < count; i++) rows.push(makeRow(b, i, volumeRange, params))
    }
    Object.entries(fieldFilters).forEach(([key, raw]) => {
      const q = String(raw || '').trim().toLowerCase()
      if (!q) return
      const meta = fields.find((f) => f.key === key)
      if (!meta || meta.dataType === 'Int') return
      rows = rows.filter((r) => String(r[key] || '').toLowerCase().includes(q))
    })
    return {
      total: rows.length,
      list: rows.slice(from, from + pageSize),
      fields,
      page,
      pageSize,
    }
  }

  const total = buckets.reduce((sum, b) => sum + volumeOfBucket(b, volumeRange), 0)
  const list: DataQueryRow[] = []
  let skip = from
  let take = pageSize
  for (const b of buckets) {
    const count = volumeOfBucket(b, volumeRange)
    if (skip >= count) {
      skip -= count
      continue
    }
    const start = skip
    const end = Math.min(count, start + take)
    for (let i = start; i < end; i++) list.push(makeRow(b, i, volumeRange, params))
    take -= end - start
    skip = 0
    if (take <= 0) break
  }

  return {
    total,
    list,
    fields,
    page,
    pageSize,
  }
}
