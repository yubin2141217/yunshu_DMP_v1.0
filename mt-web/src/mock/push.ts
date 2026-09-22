import {
  ensureSchemeOpLogs,
  makeOpLog,
  prependOpLog,
  type SchemeOpLog,
} from '@/utils/schemeOpLog'
import { genSchemeAppKey, type FieldMapItem } from '@/mock/mt'

export type { FieldMapItem }

/** 鉴权 Header 行：AppKey 鉴权时以键值对列表方式配置请求头 */
export interface PushAuthHeader {
  /** 是否启用该 Header（默认启用） */
  enabled?: boolean
  name: string
  value: string
  /** 参数说明（可选，仅配置侧备注） */
  remark?: string
}

/** 选中 AppKey 鉴权时的默认行：参数名 AppKey，参数值为系统生成的 32 位字母数字组合 */
export function defaultAppKeyAuthHeader(): PushAuthHeader {
  return { enabled: true, name: 'AppKey', value: genSchemeAppKey(), remark: '' }
}

export type PushStatus = 'enabled' | 'disabled'
export type PushChannelType = 'http' | 'mq' | 'file'
export type PushMode = 'incremental' | 'full'
export type ScheduleType = 'realtime' | 'cron' | 'interval'
export type PushDataSourceType = 'standard' | 'datasource'
export type PushFilterLogic = 'all' | 'any'
export type PushFilterOp = 'contains' | 'equals' | 'not_contains'
/** 推送接收方类型：MT 机构 / 第三方接收方机构 */
export type PushReceiverType = 'mt' | 'third'

export interface PushHttpConfig {
  endpointUrl: string
  protocol: 'HTTPS' | 'HTTP'
  method: 'POST'
  /** 表单仅提供 none / appkey；token 为历史数据兼容 */
  authType: 'none' | 'token' | 'appkey'
  /** @deprecated 历史 Token 鉴权字段，新表单不再配置 */
  token?: string
  /** @deprecated 历史字段 */
  authHeaderName?: string
  /** @deprecated 历史 AppKey 字段，新表单改为 authHeaders 列表 */
  appKey?: string
  /** @deprecated 历史字段 */
  appSecret?: string
  /** @deprecated 历史字段，新表单不再展示 */
  contentType?: string
  /** @deprecated 已删除「最大 QPS 上限」，保留兼容历史数据 */
  rateLimitQps?: number
  retry: number
  retryIntervalMs?: number
  /** @deprecated 已删除「成功响应码」，保留兼容历史数据 */
  successHttpCode?: string
  /** @deprecated 已删除「数据配置」模块，保留兼容历史数据 */
  charset?: string
  /** AppKey 鉴权时配置的鉴权 Header 键值对列表 */
  authHeaders?: PushAuthHeader[]
}

export interface PushMqConfig {
  mqType: 'kafka' | 'bmq' | 'rocketmq'
  brokers: string
  nameServer: string
  topic: string
  authType: 'none' | 'sasl' | 'ssl'
  username?: string
  password?: string
  certPath?: string
  retry: number
  retryIntervalMs?: number
}

export interface PushVolumeStats {
  total: number
  today: number
  d3: number
  w1: number
  m1: number
}

export type PushVolumeRange = keyof PushVolumeStats

export interface PushSchemeStats {
  successTotal: number
  failTotal: number
  /** 成功量分时间跨度（列表表头筛选） */
  successByRange: PushVolumeStats
  /** 失败量分时间跨度 */
  failByRange: PushVolumeStats
  lastPushCount: number
  lastPushAt: string
  backlog: number
}

export interface PushFilterRule {
  id: string
  field: string
  op: PushFilterOp
  value: string
}

/** 第三方接收方机构（非 MT 机构） */
export interface PushReceiverOrg {
  id: string
  /** 机构 ID（业务编码，唯一） */
  code: string
  name: string
  /** 关联的 MT 机构 */
  relatedMtOrgId: string
  relatedMtOrgName: string
  contactName: string
  contactPhone: string
  contactEmail: string
  remark: string
  status: PushStatus
  updatedAt: string
}

export interface PushScheme {
  id: string
  /** 业务方案编号，列表展示可复制 */
  schemeNo: number
  name: string
  status: PushStatus
  remark: string
  /** 接收方类型 */
  receiverType: PushReceiverType
  orgId: string
  orgName: string
  /** 机构副信息：所属统计单元（列表展示） */
  orgStatUnit?: string
  /** 机构副信息：所属销售（列表展示） */
  orgSalesName?: string
  /** 数据来源：接入方案 / 外部数据源 */
  dataSourceType: PushDataSourceType
  /** dataSourceType=datasource 时填写 */
  dataSourceId: string
  /** dataSourceType=datasource 时按 ID 回显的数据源名称 */
  dataSourceName?: string
  standardIds: string[]
  standardNames: string[]
  supplierIds: string[]
  supplierNames: string[]
  /** 选择推送字段：中台字段库 id 列表 */
  pushFieldIds: string[]
  /** 中台字段 → 接收方字段映射（与 pushFieldIds 对应） */
  pushFieldMaps: FieldMapItem[]
  filterLogic: PushFilterLogic
  filterRules: PushFilterRule[]
  dedupeEnabled: boolean
  dedupeWindowHours: number
  dedupeFields: string[]
  channelType: PushChannelType
  httpConfig: PushHttpConfig
  mqConfig: PushMqConfig
  pushMode: PushMode
  /** 全量推送时选择的接入数据时间跨度 [开始时间, 结束时间] */
  fullTimeRange?: [string, string] | string[]
  scheduleType: ScheduleType
  cronExpr: string
  intervalMinutes: number
  batchLimit: number
  stats: PushSchemeStats
  updatedAt: string
  /** 操作审计记录 */
  opLogs?: SchemeOpLog[]
}

const STORAGE_KEY = 'yunshu-mt-push-v13'

export const pushVolumeRangeOptions: { label: string; value: PushVolumeRange }[] = [
  { label: '累计', value: 'total' },
  { label: '今日', value: 'today' },
  { label: '近3天', value: 'd3' },
  { label: '近1周', value: 'w1' },
  { label: '近1月', value: 'm1' },
]

export function emptyVolumeStats(): PushVolumeStats {
  return { total: 0, today: 0, d3: 0, w1: 0, m1: 0 }
}

export function normalizeVolumeStats(raw?: Partial<PushVolumeStats> | null): PushVolumeStats {
  const base = emptyVolumeStats()
  if (!raw) return base
  return {
    total: Number(raw.total) || 0,
    today: Number(raw.today) || 0,
    d3: Number(raw.d3) || 0,
    w1: Number(raw.w1) || 0,
    m1: Number(raw.m1) || 0,
  }
}

/** 仅有总量时按固定比例拆分各时间窗（mock） */
export function deriveVolumeStats(total: number): PushVolumeStats {
  const t = Math.max(0, Math.round(Number(total) || 0))
  return {
    total: t,
    today: Math.round(t * 0.02),
    d3: Math.round(t * 0.06),
    w1: Math.round(t * 0.14),
    m1: Math.round(t * 0.38),
  }
}

export function pushVolumeOf(stats: PushVolumeStats | undefined, range: PushVolumeRange) {
  return normalizeVolumeStats(stats)[range] || 0
}

export const pushFilterFieldOptions = [
  { label: '标题', value: 'title' },
  { label: '关键词', value: 'keyword' },
  { label: '正文内容', value: 'content' },
  { label: '原文链接', value: 'url' },
]

export const pushFilterOpOptions = [
  { label: '包含', value: 'contains' as const },
  { label: '等于', value: 'equals' as const },
  { label: '不包含', value: 'not_contains' as const },
]

export const pushFilterLogicOptions = [
  { label: '全部', value: 'all' as const },
  { label: '任一', value: 'any' as const },
]

export const pushDedupeFieldOptions = [
  { label: '标题', value: 'title' },
  { label: '正文内容', value: 'content' },
  { label: '原文链接', value: 'url' },
]

function nowText() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

export function emptyHttpConfig(): PushHttpConfig {
  return {
    endpointUrl: '',
    protocol: 'HTTPS',
    method: 'POST',
    authType: 'none',
    retry: 3,
    retryIntervalMs: 1000,
    authHeaders: [],
  }
}

/** 兼容历史 HTTP 配置：保留旧字段，归一化 authHeaders 列表 */
export function normalizeHttpConfig(raw?: Partial<PushHttpConfig> | null): PushHttpConfig {
  const base = emptyHttpConfig()
  if (!raw) return base
  return {
    ...base,
    ...raw,
    authHeaders: Array.isArray(raw.authHeaders)
      ? raw.authHeaders.map((h) => ({
          enabled: h?.enabled ?? true,
          name: h?.name || '',
          value: h?.value || '',
          remark: h?.remark || '',
        }))
      : [],
  }
}

export function emptyMqConfig(): PushMqConfig {
  return {
    mqType: 'kafka',
    brokers: '',
    nameServer: '',
    topic: '',
    authType: 'none',
    username: '',
    password: '',
    certPath: '',
    retry: 3,
    retryIntervalMs: 1000,
  }
}

export function emptyStats(): PushSchemeStats {
  return {
    successTotal: 0,
    failTotal: 0,
    successByRange: emptyVolumeStats(),
    failByRange: emptyVolumeStats(),
    lastPushCount: 0,
    lastPushAt: '',
    backlog: 0,
  }
}

export function normalizeSchemeStats(raw?: Partial<PushSchemeStats> | null): PushSchemeStats {
  const base = emptyStats()
  if (!raw) return base
  const successTotal = Number(raw.successTotal) || 0
  const failTotal = Number(raw.failTotal) || 0
  const successByRange = raw.successByRange
    ? normalizeVolumeStats(raw.successByRange)
    : deriveVolumeStats(successTotal)
  const failByRange = raw.failByRange ? normalizeVolumeStats(raw.failByRange) : deriveVolumeStats(failTotal)
  if (!raw.successByRange) successByRange.total = successTotal
  if (!raw.failByRange) failByRange.total = failTotal
  return {
    successTotal: successByRange.total || successTotal,
    failTotal: failByRange.total || failTotal,
    successByRange,
    failByRange,
    lastPushCount: Number(raw.lastPushCount) || 0,
    lastPushAt: raw.lastPushAt || '',
    backlog: Number(raw.backlog) || 0,
  }
}

export function emptyFilterRule(): PushFilterRule {
  return {
    id: `fr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    field: 'title',
    op: 'contains',
    value: '',
  }
}

export function defaultDataConfig() {
  return {
    dataSourceType: 'standard' as PushDataSourceType,
    dataSourceId: '',
    filterLogic: 'all' as PushFilterLogic,
    filterRules: [] as PushFilterRule[],
    dedupeEnabled: false,
    dedupeWindowHours: 72,
    dedupeFields: ['title'] as string[],
  }
}

export function scheduleSummary(s: Pick<PushScheme, 'scheduleType' | 'cronExpr' | 'intervalMinutes'>) {
  if (s.scheduleType === 'realtime') return '实时'
  if (s.scheduleType === 'cron') return `Cron: ${s.cronExpr || '—'}`
  return `每 ${s.intervalMinutes || '—'} 分钟`
}

export function scheduleTypeLabel(t: ScheduleType) {
  if (t === 'realtime') return '实时'
  if (t === 'cron') return 'Cron'
  return '固定间隔'
}

export const scheduleTypeOptions: { label: string; value: ScheduleType }[] = [
  { label: '实时', value: 'realtime' },
  { label: 'Cron', value: 'cron' },
  { label: '固定间隔', value: 'interval' },
]

export function channelLabel(t: PushChannelType) {
  if (t === 'http') return 'HTTP/HTTPS POST 推送'
  if (t === 'mq') return '消息队列推送'
  return '文件传输'
}

/** 推送报文样例（按当前常见推送字段） */
function samplePushPayloadJson() {
  return JSON.stringify(
    {
      items: [
        {
          title: '示例标题',
          keyword: '示例关键词',
          content: '示例正文内容…',
          url: 'https://example.com/article/1',
          accessAt: '2026-09-14 10:00:00',
        },
      ],
      pushMode: 'incremental',
      batchSize: 1,
    },
    null,
    2,
  )
}

export function buildPushHttpExample(http: PushHttpConfig): string {
  let host = 'recv.example.com'
  let path = '/api/v1/ingest'
  const rawUrl = (http.endpointUrl || '').trim()
  try {
    const u = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    host = u.host
    path = u.pathname || path
  } catch {
    if (rawUrl) {
      const noProto = rawUrl.replace(/^https?:\/\//i, '')
      const slash = noProto.indexOf('/')
      host = slash >= 0 ? noProto.slice(0, slash) : noProto
      path = slash >= 0 ? noProto.slice(slash) : path
    }
  }
  const headers = [
    `${http.method || 'POST'} ${path} HTTP/1.1`,
    `Host: ${host || 'recv.example.com'}`,
    `Content-Type: application/json; charset=UTF-8`,
  ]
  if (http.authType === 'token') {
    headers.push(`${http.authHeaderName || 'Authorization'}: Bearer <your-token>`)
  } else if (http.authType === 'appkey') {
    const list = http.authHeaders?.filter((h) => h.enabled !== false && h.name?.trim()) || []
    if (list.length) {
      list.forEach((h) => headers.push(`${h.name}: ${h.value || '<header-value>'}`))
    } else {
      headers.push('X-App-Key: <your-appkey>')
    }
  }
  return `${headers.join('\n')}\n\n${samplePushPayloadJson()}`
}

export function buildPushMqExample(mq: PushMqConfig): string {
  const addr = mq.mqType === 'rocketmq' ? mq.nameServer || mq.brokers : mq.brokers
  return [
    `# 消息队列推送示例（${(mq.mqType || 'kafka').toUpperCase()}）`,
    `Brokers/NameServer: ${addr || '<cluster-address>'}`,
    `Topic: ${mq.topic || '<topic>'}`,
    `Auth: ${mq.authType || 'none'}`,
    '',
    '## 消息体示例',
    samplePushPayloadJson(),
  ].join('\n')
}

/** 按当前推送方式参数生成请求 / 投递示例 */
export function buildPushExample(
  channelType: PushChannelType,
  http: PushHttpConfig,
  mq: PushMqConfig,
): string {
  if (channelType === 'mq') return buildPushMqExample(mq)
  return buildPushHttpExample(http)
}

export function successCodeOfPush(channelType: PushChannelType, _http: PushHttpConfig) {
  if (channelType === 'mq') return 'OK'
  return '200'
}

export function isPushConfigReady(
  channelType: PushChannelType,
  http: PushHttpConfig,
  mq: PushMqConfig,
) {
  if (channelType === 'mq') {
    const addr = mq.mqType === 'rocketmq' ? mq.nameServer || mq.brokers : mq.brokers
    return !!(addr?.trim() && mq.topic?.trim())
  }
  return !!http.endpointUrl?.trim()
}

/** 推送方式选项（列表 / 筛选 / 表单 / 详情统一）；消息队列推送新建时禁用不可选 */
export const pushChannelOptions = [
  { label: 'HTTP/HTTPS POST 推送', value: 'http' as const },
  { label: '消息队列推送', value: 'mq' as const, disabled: true },
]

export function pushModeLabel(m: PushMode) {
  return m === 'incremental' ? '增量' : '全量'
}

/** 纯数字数据源 ID 回显的示例名称；非数字则提示未查询到 */
export const DATA_SOURCE_NOT_FOUND_TEXT = '未查询到相关数据源，请更改数据源ID'

export function exampleDataSourceName(id: string) {
  const key = id.trim()
  if (!/^\d+$/.test(key)) return ''
  return '示例数据源'
}

export function lookupDataSourceName(id: string) {
  const key = id.trim()
  if (!key) return ''
  return exampleDataSourceName(key) || DATA_SOURCE_NOT_FOUND_TEXT
}

export function dataSourceMainText(
  s: Pick<PushScheme, 'dataSourceType' | 'dataSourceId' | 'standardNames'>,
) {
  if (s.dataSourceType === 'datasource') {
    return exampleDataSourceName(s.dataSourceId) || '—'
  }
  return s.standardNames?.length ? s.standardNames.join('、') : '—'
}

export function dataSourceSubText(
  s: Pick<PushScheme, 'dataSourceType' | 'dataSourceId' | 'standardNames'>,
) {
  if (s.dataSourceType === 'datasource') {
    const id = s.dataSourceId?.trim()
    return id ? `数据源 · ${id}` : '数据源'
  }
  const names = s.standardNames?.filter(Boolean).join('、')
  return names ? `接入方案 · ${names}` : '接入方案'
}

export function dataScopeSummary(
  s: Pick<PushScheme, 'dataSourceType' | 'dataSourceId' | 'dataSourceName' | 'standardNames'>,
) {
  return dataSourceMainText(s)
}

/** mock：按筛选估算命中条数 */
export function estimateInboundCount(params: {
  dataSourceType?: PushDataSourceType
  dataSourceId?: string
  orgId?: string
  standardIds: string[]
  supplierIds?: string[]
}) {
  if (params.dataSourceType === 'datasource') {
    const id = (params.dataSourceId || '').trim()
    if (!id) return 0
    let h = 0
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
    return 800 + (h % 4200)
  }
  if (!params.standardIds.length && !params.orgId) return 0
  let n = 12000
  if (params.orgId) n += (params.orgId.charCodeAt(params.orgId.length - 1) % 7) * 1300
  if (params.standardIds.length) n = Math.round(n * (0.35 + 0.12 * Math.min(params.standardIds.length, 4)))
  if (params.supplierIds?.length) n = Math.round(n * (0.4 + 0.15 * Math.min(params.supplierIds.length, 3)))
  return Math.max(80, n)
}

function isValidCron(expr: string) {
  const parts = expr.trim().split(/\s+/)
  return parts.length >= 5 && parts.length <= 7
}

function normalizeScheme(raw: Partial<PushScheme> & { id: string }): PushScheme {
  const data = defaultDataConfig()
  return {
    id: raw.id,
    schemeNo: Number(raw.schemeNo) || 0,
    name: raw.name || '',
    status: raw.status || 'enabled',
    remark: raw.remark || '',
    receiverType: raw.receiverType === 'third' ? 'third' : 'mt',
    orgId: raw.orgId || '',
    orgName: raw.orgName || '',
    orgStatUnit: raw.orgStatUnit || '',
    orgSalesName: raw.orgSalesName || '',
    dataSourceType: raw.dataSourceType || data.dataSourceType,
    dataSourceId: raw.dataSourceId || '',
    dataSourceName: exampleDataSourceName(raw.dataSourceId || ''),
    standardIds: raw.standardIds || [],
    standardNames: raw.standardNames || [],
    supplierIds: raw.supplierIds || [],
    supplierNames: raw.supplierNames || [],
    pushFieldIds: Array.isArray(raw.pushFieldIds) ? raw.pushFieldIds : [],
    pushFieldMaps: Array.isArray(raw.pushFieldMaps) ? raw.pushFieldMaps : [],
    filterLogic: raw.filterLogic || data.filterLogic,
    filterRules: Array.isArray(raw.filterRules) ? raw.filterRules : [],
    dedupeEnabled: raw.dedupeEnabled ?? data.dedupeEnabled,
    dedupeWindowHours: Number(raw.dedupeWindowHours) > 0 ? Number(raw.dedupeWindowHours) : data.dedupeWindowHours,
    dedupeFields: Array.isArray(raw.dedupeFields) && raw.dedupeFields.length ? raw.dedupeFields : data.dedupeFields,
    channelType: raw.channelType || 'http',
    httpConfig: normalizeHttpConfig(raw.httpConfig),
    mqConfig: { ...emptyMqConfig(), ...raw.mqConfig },
    pushMode: raw.pushMode || 'incremental',
    fullTimeRange: Array.isArray(raw.fullTimeRange) && raw.fullTimeRange.length === 2 ? raw.fullTimeRange : undefined,
    scheduleType: raw.scheduleType === 'realtime' || raw.scheduleType === 'cron' ? raw.scheduleType : 'interval',
    cronExpr: raw.cronExpr || '0 * * * *',
    intervalMinutes: Number(raw.intervalMinutes) || 30,
    batchLimit: Number(raw.batchLimit) || 500,
    stats: normalizeSchemeStats(raw.stats),
    updatedAt: raw.updatedAt || nowText(),
    opLogs: Array.isArray(raw.opLogs) ? raw.opLogs : [],
  }
}

function makePushStats(success: number, fail: number, lastPushCount: number, lastPushAt: string, backlog: number) {
  const successByRange = deriveVolumeStats(success)
  const failByRange = deriveVolumeStats(fail)
  return {
    successTotal: success,
    failTotal: fail,
    successByRange,
    failByRange,
    lastPushCount,
    lastPushAt,
    backlog,
  }
}

const seedSchemes: PushScheme[] = [
  normalizeScheme({
    id: 'ps1', schemeNo: 20001, name: '机构回推-HTTP标准', status: 'enabled', remark: '默认增量回推',
    receiverType: 'mt', orgId: 'o1', orgName: '榆林市互联网信息办公室', orgStatUnit: '陕西大区', orgSalesName: '张三三',
    dataSourceType: 'standard', standardIds: ['st1'], standardNames: ['清博智能榆林市舆情数据推送'], channelType: 'http',
    httpConfig: { ...emptyHttpConfig(), endpointUrl: 'https://org-recv.example.gov/api/v1/ingest', authType: 'token', token: 'demo-token', authHeaderName: 'Authorization', retry: 3 },
    pushMode: 'incremental', scheduleType: 'realtime', cronExpr: '0 * * * *', intervalMinutes: 30, batchLimit: 500,
    stats: makePushStats(12840, 26, 486, '2026-09-11 08:30:00', 320), updatedAt: '2026-09-08 10:00:00',
  }),
  normalizeScheme({
    id: 'ps2', schemeNo: 20002, name: '融媒体-MQ异步', status: 'enabled', remark: '每日凌晨全量',
    receiverType: 'third', orgId: 'ro1', orgName: '陕西省融媒第三方接收端', orgStatUnit: '陕西大区', orgSalesName: '王小明',
    dataSourceType: 'standard', standardIds: ['st1'], standardNames: ['清博智能榆林市舆情数据推送'], channelType: 'mq',
    mqConfig: { ...emptyMqConfig(), mqType: 'kafka', brokers: 'mq.example.gov:9092', topic: 'yunshu.org.push', authType: 'none', retry: 2 },
    pushMode: 'full', scheduleType: 'cron', cronExpr: '0 2 * * *', intervalMinutes: 60, batchLimit: 1000,
    filterRules: [{ id: 'fr-seed-1', field: 'title', op: 'contains', value: '舆情' }],
    dedupeEnabled: true, dedupeWindowHours: 72, dedupeFields: ['title', 'url'],
    stats: makePushStats(4020, 58, 1000, '2026-09-11 02:05:00', 0), updatedAt: '2026-09-07 16:20:00',
  }),
  normalizeScheme({
    id: 'ps3', schemeNo: 20003, name: '网安协查-HTTP推送', status: 'enabled', remark: '协查任务回传',
    receiverType: 'third', orgId: 'ro2', orgName: '网安协查第三方平台', orgStatUnit: '陕西大区', orgSalesName: '张三三',
    dataSourceType: 'standard', standardIds: ['st3'], standardNames: ['清博智能西安市委宣传部舆情数据推送'], channelType: 'http',
    httpConfig: { ...emptyHttpConfig(), endpointUrl: 'https://sec-recv.example.gov/api/push', authType: 'token', token: 'demo-sec-token', authHeaderName: 'X-Token', retry: 2 },
    pushMode: 'incremental', scheduleType: 'interval', intervalMinutes: 15, batchLimit: 200,
    stats: makePushStats(2860, 330, 120, '2026-09-11 09:10:00', 86), updatedAt: '2026-09-09 11:00:00',
  }),
  normalizeScheme({
    id: 'ps4', schemeNo: 20004, name: '宣传部-定时全量', status: 'enabled', remark: '每日全量归档推送',
    receiverType: 'mt', orgId: 'o2', orgName: '西安市委宣传部', orgStatUnit: '陕西大区', orgSalesName: '李四五',
    dataSourceType: 'standard', standardIds: ['st1'], standardNames: ['清博智能榆林市舆情数据推送'], channelType: 'http',
    httpConfig: { ...emptyHttpConfig(), endpointUrl: 'https://xcb-recv.example.gov/api/archive', authType: 'token', token: 'demo-xcb-token', authHeaderName: 'Authorization', retry: 1 },
    pushMode: 'full', scheduleType: 'cron', cronExpr: '0 3 * * *', intervalMinutes: 60, batchLimit: 2000,
    stats: makePushStats(9640, 18, 2000, '2026-09-11 03:05:00', 45), updatedAt: '2026-09-08 18:40:00',
  }),
  normalizeScheme({
    id: 'ps5', schemeNo: 20005, name: '咸阳网信-增量回推', status: 'enabled', remark: '区县汇总增量',
    receiverType: 'mt', orgId: 'o4', orgName: '咸阳市网信办', orgStatUnit: '陕西大区', orgSalesName: '赵六六',
    dataSourceType: 'standard', standardIds: ['st1'], standardNames: ['清博智能榆林市舆情数据推送'], channelType: 'http',
    httpConfig: { ...emptyHttpConfig(), endpointUrl: 'https://xy-recv.example.gov/api/v1/push', authType: 'appkey', appKey: 'xy-demo-key', appSecret: 'xy-demo-secret', retry: 2 },
    pushMode: 'incremental', scheduleType: 'interval', intervalMinutes: 20, batchLimit: 300,
    stats: makePushStats(6120, 31, 210, '2026-09-13 10:20:00', 112), updatedAt: '2026-09-12 09:30:00',
  }),
  normalizeScheme({
    id: 'ps6', schemeNo: 20006, name: '雁塔融媒-Kafka推送', status: 'enabled', remark: '融媒内容分发',
    receiverType: 'mt', orgId: 'o3', orgName: '西安市雁塔区融媒体中心', orgStatUnit: '陕西大区', orgSalesName: '王小明',
    dataSourceType: 'standard', standardIds: ['st5'], standardNames: ['智慧星光西安市委宣传部宣传口径数据推送'], channelType: 'mq',
    mqConfig: { ...emptyMqConfig(), mqType: 'kafka', brokers: 'kafka-yt.example.gov:9092', topic: 'yt.media.push', authType: 'sasl', username: 'yt_push', password: 'demo', retry: 3 },
    pushMode: 'incremental', scheduleType: 'interval', intervalMinutes: 10, batchLimit: 400,
    stats: makePushStats(15880, 64, 380, '2026-09-13 11:05:00', 56), updatedAt: '2026-09-11 14:00:00',
  }),
  normalizeScheme({
    id: 'ps7', schemeNo: 20007, name: '建设局-专项回传', status: 'disabled', remark: '临时停用待改造',
    receiverType: 'mt', orgId: 'o2', orgName: '西安市委宣传部', orgStatUnit: '陕西大区', orgSalesName: '李四五',
    dataSourceType: 'standard', standardIds: ['st4'], standardNames: ['西安市建设局专属接入'], channelType: 'http',
    httpConfig: { ...emptyHttpConfig(), endpointUrl: 'https://jsj-recv.example.gov/api/push', authType: 'token', token: 'jsj-token', retry: 1 },
    pushMode: 'full', scheduleType: 'cron', cronExpr: '0 1 * * 1', intervalMinutes: 60, batchLimit: 800,
    stats: makePushStats(920, 12, 0, '2026-08-28 01:10:00', 0), updatedAt: '2026-09-01 16:00:00',
  }),
  normalizeScheme({
    id: 'ps8', schemeNo: 20008, name: '省局-RocketMQ快推', status: 'enabled', remark: '高优实时通道',
    receiverType: 'mt', orgId: 'o1', orgName: '榆林市互联网信息办公室', orgStatUnit: '陕西大区', orgSalesName: '张三三',
    dataSourceType: 'standard', standardIds: ['st3'], standardNames: ['清博智能西安市委宣传部舆情数据推送'], channelType: 'mq',
    mqConfig: { ...emptyMqConfig(), mqType: 'rocketmq', nameServer: 'rmq.example.gov:9876', topic: 'SX_YX_PUSH', authType: 'none', retry: 2 },
    pushMode: 'incremental', scheduleType: 'interval', intervalMinutes: 5, batchLimit: 150,
    stats: makePushStats(22400, 88, 140, '2026-09-13 11:40:00', 210), updatedAt: '2026-09-12 20:10:00',
  }),
  normalizeScheme({
    id: 'ps9', schemeNo: 20009, name: '第三方-轻量归档', status: 'enabled', remark: '低频全量备份',
    receiverType: 'third', orgId: 'ro1', orgName: '陕西省融媒第三方接收端', orgStatUnit: '陕西大区', orgSalesName: '王小明',
    dataSourceType: 'datasource', dataSourceId: '10001', dataSourceName: '示例数据源', channelType: 'http',
    httpConfig: { ...emptyHttpConfig(), endpointUrl: 'https://archive-recv.example.gov/api/batch', authType: 'none', retry: 1 },
    pushMode: 'full', scheduleType: 'cron', cronExpr: '0 4 * * 0', intervalMinutes: 120, batchLimit: 5000,
    stats: makePushStats(3560, 9, 5000, '2026-09-07 04:20:00', 0), updatedAt: '2026-09-07 08:00:00',
  }),
  normalizeScheme({
    id: 'ps10', schemeNo: 20010, name: '咸阳-MQ旁路', status: 'disabled', remark: '灰度通道已停',
    receiverType: 'mt', orgId: 'o4', orgName: '咸阳市网信办', orgStatUnit: '陕西大区', orgSalesName: '赵六六',
    dataSourceType: 'standard', standardIds: ['st1', 'st3'], standardNames: ['清博智能榆林市舆情数据推送', '清博智能西安市委宣传部舆情数据推送'], channelType: 'mq',
    mqConfig: { ...emptyMqConfig(), mqType: 'bmq', brokers: 'bmq.xy.example.gov:9092', topic: 'xy.bypass', authType: 'none', retry: 1 },
    pushMode: 'incremental', scheduleType: 'interval', intervalMinutes: 45, batchLimit: 250,
    stats: makePushStats(1480, 55, 0, '2026-08-20 15:00:00', 0), updatedAt: '2026-08-21 10:00:00',
  }),
  normalizeScheme({
    id: 'ps11', schemeNo: 20011, name: '宣传部-增量补推', status: 'enabled', remark: '失败重推专用',
    receiverType: 'mt', orgId: 'o2', orgName: '西安市委宣传部', orgStatUnit: '陕西大区', orgSalesName: '李四五',
    dataSourceType: 'standard', standardIds: ['st5'], standardNames: ['智慧星光西安市委宣传部宣传口径数据推送'], channelType: 'http',
    httpConfig: { ...emptyHttpConfig(), endpointUrl: 'https://xcb-recv.example.gov/api/retry', authType: 'token', token: 'xcb-retry', retry: 5, retryIntervalMs: 2000 },
    pushMode: 'incremental', scheduleType: 'interval', intervalMinutes: 60, batchLimit: 100,
    stats: makePushStats(780, 120, 36, '2026-09-13 09:50:00', 48), updatedAt: '2026-09-10 11:25:00',
  }),
  normalizeScheme({
    id: 'ps12', schemeNo: 20012, name: '全局-BMQ广播', status: 'enabled', remark: '多机构共享广播主题',
    receiverType: 'mt', orgId: 'o1', orgName: '榆林市互联网信息办公室', orgStatUnit: '陕西大区', orgSalesName: '张三三',
    dataSourceType: 'standard', standardIds: ['st1'], standardNames: ['清博智能榆林市舆情数据推送'], channelType: 'mq',
    mqConfig: { ...emptyMqConfig(), mqType: 'bmq', brokers: 'bmq.global.example.gov:9092', topic: 'yunshu.broadcast', authType: 'ssl', certPath: '/certs/push-client.pem', retry: 2 },
    pushMode: 'incremental', scheduleType: 'interval', intervalMinutes: 8, batchLimit: 600,
    stats: makePushStats(18920, 47, 520, '2026-09-13 11:55:00', 180), updatedAt: '2026-09-13 08:15:00',
  }),
]

function normalizeReceiver(raw: Partial<PushReceiverOrg> & { id: string }): PushReceiverOrg {
  return {
    id: raw.id,
    code: (raw.code || '').trim(),
    name: (raw.name || '').trim(),
    relatedMtOrgId: raw.relatedMtOrgId || '',
    relatedMtOrgName: raw.relatedMtOrgName || '',
    contactName: (raw.contactName || '').trim(),
    contactPhone: (raw.contactPhone || '').trim(),
    contactEmail: (raw.contactEmail || '').trim(),
    remark: raw.remark || '',
    status: raw.status || 'enabled',
    updatedAt: raw.updatedAt || nowText(),
  }
}

const seedReceivers: PushReceiverOrg[] = [
  normalizeReceiver({
    id: 'ro1',
    code: 'TP-MEDIA-01',
    name: '陕西省融媒第三方接收端',
    relatedMtOrgId: 'o3',
    relatedMtOrgName: '西安市雁塔区融媒体中心',
    contactName: '李接收',
    contactPhone: '13800001111',
    contactEmail: 'recv@media.example.gov',
    remark: '演示第三方接收方',
    status: 'enabled',
    updatedAt: '2026-09-10 09:00:00',
  }),
  normalizeReceiver({
    id: 'ro2',
    code: 'TP-SAFE-02',
    name: '网安协查第三方平台',
    relatedMtOrgId: 'o1',
    relatedMtOrgName: '榆林市互联网信息办公室',
    contactName: '王对接',
    contactPhone: '13900002222',
    contactEmail: '',
    remark: '',
    status: 'enabled',
    updatedAt: '2026-09-11 11:20:00',
  }),
]

interface State {
  schemes: PushScheme[]
  receivers: PushReceiverOrg[]
}

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

function loadState(): State {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>
      return {
        schemes: Array.isArray(parsed.schemes) ? parsed.schemes : clone(seedSchemes),
        receivers: Array.isArray(parsed.receivers) ? parsed.receivers : clone(seedReceivers),
      }
    }
  } catch {
    /* ignore */
  }
  return clone({ schemes: seedSchemes, receivers: seedReceivers })
}

function save() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const state = loadState()

function nextSchemeNo() {
  const max = state.schemes.reduce((m, s) => Math.max(m, Number(s.schemeNo) || 0), 20000)
  return max + 1
}

export function paginate<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total: list.length }
}

export type SchemeSaveFail =
  | {
      ok: false
      reason: 'dup' | 'file' | 'cron' | 'interval' | 'batch' | 'http' | 'mq' | 'org' | 'datasource' | 'standard' | 'fullrange' | 'authheader'
      detail?: string
    }
  | { ok: true; item: PushScheme }

export const pushMock = {
  listSchemes(params: {
    keyword?: string
    schemeId?: string
    orgId?: string
    orgName?: string
    supplierId?: string
    supplierName?: string
    schemeName?: string
    channelType?: string
    pushMode?: string
    scheduleType?: string
    status?: string
  }) {
    let list = state.schemes.map((s) => normalizeScheme(s))
    const q = (params.keyword || '').trim()
    if (q) list = list.filter((s) => s.name.includes(q) || s.orgName.includes(q))
    if (params.schemeId) list = list.filter((s) => s.id === params.schemeId)
    else if (params.schemeName?.trim()) {
      const nq = params.schemeName.trim()
      list = list.filter((s) => s.name.includes(nq))
    }
    if (params.orgId) list = list.filter((s) => s.orgId === params.orgId)
    else if (params.orgName?.trim()) {
      const oq = params.orgName.trim()
      list = list.filter((s) => s.orgName.includes(oq))
    }
    if (params.supplierId) {
      list = list.filter((s) => (s.supplierIds || []).includes(params.supplierId!))
    } else if (params.supplierName?.trim()) {
      const sq = params.supplierName.trim()
      list = list.filter((s) => (s.supplierNames || []).some((n) => n.includes(sq)))
    }
    if (params.channelType) list = list.filter((s) => s.channelType === params.channelType)
    if (params.pushMode) list = list.filter((s) => s.pushMode === params.pushMode)
    if (params.scheduleType) list = list.filter((s) => s.scheduleType === params.scheduleType)
    if (params.status) list = list.filter((s) => s.status === params.status)
    return list
  },

  getScheme(id: string) {
    const item = state.schemes.find((s) => s.id === id)
    if (!item) return null
    if (!item.opLogs?.length) {
      item.opLogs = ensureSchemeOpLogs(undefined, {
        kind: 'push',
        status: item.status === 'disabled' ? 'disabled' : 'enabled',
        createdAt: item.updatedAt,
        updatedAt: item.updatedAt,
        creator: '平台运营',
      })
    }
    return normalizeScheme(item)
  },

  schemeKpis() {
    const list = state.schemes.map((s) => normalizeScheme(s))
    const enabled = list.filter((s) => s.status === 'enabled').length
    const disabled = list.length - enabled
    const successTotal = list.reduce((n, s) => n + (s.stats.successTotal || 0), 0)
    const failTotal = list.reduce((n, s) => n + (s.stats.failTotal || 0), 0)
    const den = successTotal + failTotal
    const successRate = den > 0 ? Math.round((successTotal / den) * 1000) / 10 : null
    const orgIds = new Set(list.map((s) => s.orgId).filter(Boolean))
    return {
      total: list.length,
      enabled,
      disabled,
      orgCount: orgIds.size,
      successTotal,
      failTotal,
      successRate,
    }
  },

  saveScheme(payload: Omit<PushScheme, 'id' | 'updatedAt' | 'stats' | 'schemeNo'> & { id?: string; schemeNo?: number; stats?: PushSchemeStats }): SchemeSaveFail {
    if (payload.channelType === 'file') return { ok: false, reason: 'file' }
    const name = payload.name.trim()
    if (state.schemes.some((s) => s.name === name && s.id !== payload.id)) {
      return { ok: false, reason: 'dup' }
    }
    const dataSourceType = payload.dataSourceType || 'standard'
    if (dataSourceType === 'datasource') {
      if (!payload.dataSourceId?.trim()) return { ok: false, reason: 'datasource' }
    }
    // 全量推送必须选择接入数据的时间跨度
    if (payload.pushMode === 'full') {
      const range = payload.fullTimeRange
      if (!Array.isArray(range) || range.length !== 2 || !range[0] || !range[1]) {
        return { ok: false, reason: 'fullrange' }
      }
    }
    // 频次类型/间隔/批量字段已从表单删除：增量默认实时，全量默认每日凌晨 Cron，缺失值自动兜底
    const pushMode = payload.pushMode || 'incremental'
    const scheduleType: ScheduleType = pushMode === 'full' ? 'cron' : 'realtime'
    const cronExpr = pushMode === 'full' ? payload.cronExpr?.trim() || '0 2 * * *' : payload.cronExpr || '0 * * * *'
    if (scheduleType === 'cron' && !isValidCron(cronExpr)) {
      return { ok: false, reason: 'cron' }
    }
    const intervalMinutes = Number(payload.intervalMinutes) > 0 ? Number(payload.intervalMinutes) : 30
    const batchLimit = Number(payload.batchLimit) > 0 ? Number(payload.batchLimit) : 500

    if (payload.channelType === 'http') {
      if (!payload.httpConfig?.endpointUrl?.trim()) return { ok: false, reason: 'http' }
      if (payload.httpConfig.authType === 'appkey') {
        const headers = payload.httpConfig.authHeaders || []
        if (!headers.some((h) => h.enabled !== false && h.name?.trim())) {
          return { ok: false, reason: 'authheader' }
        }
      }
    }
    if (payload.channelType === 'mq') {
      const mq = payload.mqConfig
      const addr = mq?.mqType === 'rocketmq' ? mq.nameServer : mq?.brokers
      if (!addr?.trim() || !mq?.topic?.trim()) return { ok: false, reason: 'mq' }
    }

    const now = nowText()
    if (!payload.orgId?.trim()) return { ok: false, reason: 'org' }
    const base = normalizeScheme({
      id: payload.id || 'tmp',
      schemeNo: payload.id
        ? Number(state.schemes.find((s) => s.id === payload.id)?.schemeNo) || nextSchemeNo()
        : nextSchemeNo(),
      name,
      status: payload.status,
      remark: (payload.remark || '').trim(),
      receiverType: payload.receiverType === 'third' ? 'third' : 'mt',
      orgId: payload.orgId || '',
      orgName: payload.orgName || '',
      orgStatUnit: payload.orgStatUnit || '',
      orgSalesName: payload.orgSalesName || '',
      dataSourceType,
      dataSourceId: (payload.dataSourceId || '').trim(),
      dataSourceName: exampleDataSourceName(payload.dataSourceId || ''),
      standardIds: payload.standardIds || [],
      standardNames: payload.standardNames || [],
      supplierIds: payload.supplierIds || [],
      supplierNames: payload.supplierNames || [],
      pushFieldIds: Array.isArray(payload.pushFieldIds) ? payload.pushFieldIds : [],
      pushFieldMaps: Array.isArray(payload.pushFieldMaps) ? payload.pushFieldMaps : [],
      filterLogic: payload.filterLogic || 'all',
      filterRules: (payload.filterRules || []).map((r) => ({
        id: r.id || emptyFilterRule().id,
        field: r.field || 'title',
        op: r.op || 'contains',
        value: (r.value || '').trim(),
      })),
      dedupeEnabled: Boolean(payload.dedupeEnabled),
      dedupeWindowHours: Number(payload.dedupeWindowHours) || 72,
      dedupeFields: payload.dedupeFields || [],
      channelType: payload.channelType,
      httpConfig: normalizeHttpConfig(payload.httpConfig),
      mqConfig: payload.mqConfig,
      pushMode,
      fullTimeRange: Array.isArray(payload.fullTimeRange) ? (payload.fullTimeRange as [string, string]) : undefined,
      scheduleType,
      cronExpr,
      intervalMinutes,
      batchLimit,
      updatedAt: now,
      stats: payload.stats,
    })
    const { id: _drop, stats: _s, ...rest } = base
    void _drop
    void _s

    if (payload.id) {
      const item = state.schemes.find((s) => s.id === payload.id)
      if (!item) return { ok: false, reason: 'dup' }
      const prevStatus = item.status
      const baseLogs = ensureSchemeOpLogs(item.opLogs, {
        kind: 'push',
        status: prevStatus === 'disabled' ? 'disabled' : 'enabled',
        createdAt: item.updatedAt,
        updatedAt: item.updatedAt,
        creator: '平台运营',
      })
      let opLogs = prependOpLog(baseLogs, makeOpLog('update', '修改推送方案配置'))
      if (rest.status !== prevStatus) {
        opLogs = prependOpLog(
          opLogs,
          makeOpLog(
            rest.status === 'enabled' ? 'enable' : 'disable',
            rest.status === 'enabled' ? '开启推送方案' : '停用推送方案',
          ),
        )
      }
      Object.assign(item, rest, { updatedAt: now, opLogs })
      save()
      return { ok: true, item: normalizeScheme(item) }
    }

    const backlog = estimateInboundCount({
      dataSourceType: rest.dataSourceType,
      dataSourceId: rest.dataSourceId,
      orgId: rest.orgId,
      standardIds: rest.standardIds,
      supplierIds: rest.supplierIds,
    })
    const item: PushScheme = {
      id: 'ps' + Date.now(),
      ...rest,
      schemeNo: rest.schemeNo || nextSchemeNo(),
      stats: payload.stats || { ...emptyStats(), backlog },
      opLogs: [
        makeOpLog(
          rest.status === 'enabled' ? 'enable' : 'disable',
          rest.status === 'enabled' ? '开启推送方案' : '停用推送方案',
          { operatedAt: now },
        ),
        makeOpLog('create', '新建推送方案', { operatedAt: now }),
      ],
    }
    state.schemes.unshift(item)
    save()
    return { ok: true, item }
  },

  testPushConnectivity(payload: {
    channelType?: PushChannelType
    httpConfig?: PushHttpConfig
    mqConfig?: PushMqConfig
  }) {
    const channelType = (payload.channelType || 'http') as PushChannelType
    const httpConfig = { ...emptyHttpConfig(), ...(payload.httpConfig || {}) }
    const mqConfig = { ...emptyMqConfig(), ...(payload.mqConfig || {}) }
    const successCode = successCodeOfPush(channelType, httpConfig)
    const ready = isPushConfigReady(channelType, httpConfig, mqConfig)
    const latencyMs = 120 + Math.floor(Math.random() * 280)
    if (!ready) {
      return {
        ok: false as const,
        successCode,
        latencyMs,
        responseText: JSON.stringify(
          {
            code: 'CONN_FAIL',
            message: '连通性测试失败：请先完善必填推送配置后再试',
            channelType: channelLabel(channelType),
            expectSuccessCode: successCode,
          },
          null,
          2,
        ),
      }
    }
    const target =
      channelType === 'mq'
        ? `${mqConfig.mqType}://${(mqConfig.mqType === 'rocketmq' ? mqConfig.nameServer : mqConfig.brokers) || ''}/${mqConfig.topic}`
        : httpConfig.endpointUrl.trim()
    return {
      ok: true as const,
      successCode,
      latencyMs,
      responseText: JSON.stringify(
        {
          code: successCode,
          message: '连通性测试成功',
          channelType: channelLabel(channelType),
          target,
          latencyMs,
          checkedAt: nowText(),
        },
        null,
        2,
      ),
    }
  },

  setSchemeStatus(id: string, status: PushStatus) {
    const item = state.schemes.find((s) => s.id === id)
    if (!item) return null
    const prevStatus = item.status
    item.status = status
    item.updatedAt = nowText()
    const baseLogs = ensureSchemeOpLogs(item.opLogs, {
      kind: 'push',
      status: prevStatus === 'disabled' ? 'disabled' : 'enabled',
      createdAt: item.updatedAt,
      updatedAt: item.updatedAt,
      creator: '平台运营',
    })
    item.opLogs = prependOpLog(
      baseLogs,
      makeOpLog(status === 'enabled' ? 'enable' : 'disable', status === 'enabled' ? '开启推送方案' : '停用推送方案'),
    )
    save()
    return item
  },

  deleteScheme(id: string): { ok: true } | { ok: false; reason: 'not_found' | 'enabled' } {
    const item = state.schemes.find((s) => s.id === id)
    if (!item) return { ok: false, reason: 'not_found' }
    if (item.status === 'enabled') return { ok: false, reason: 'enabled' }
    state.schemes = state.schemes.filter((s) => s.id !== id)
    save()
    return { ok: true }
  },

  listReceivers(params: { keyword?: string; status?: string; relatedMtOrgId?: string } = {}) {
    let list = (state.receivers || []).map((r) => normalizeReceiver(r))
    const q = (params.keyword || '').trim()
    if (q) {
      list = list.filter(
        (r) => r.name.includes(q) || r.code.includes(q) || r.contactName.includes(q) || r.relatedMtOrgName.includes(q),
      )
    }
    if (params.status) list = list.filter((r) => r.status === params.status)
    if (params.relatedMtOrgId) list = list.filter((r) => r.relatedMtOrgId === params.relatedMtOrgId)
    return list
  },

  receiverOptions(enabledOnly = true) {
    return this.listReceivers({})
      .filter((r) => !enabledOnly || r.status === 'enabled')
      .map((r) => ({ label: `${r.name}（${r.code}）`, value: r.id }))
  },

  getReceiver(id: string) {
    const item = (state.receivers || []).find((r) => r.id === id)
    return item ? normalizeReceiver(item) : null
  },

  saveReceiver(
    payload: Omit<PushReceiverOrg, 'id' | 'updatedAt'> & { id?: string },
  ): { ok: true; item: PushReceiverOrg } | { ok: false; reason: 'dup_code' | 'dup_name' | 'required' } {
    const code = (payload.code || '').trim()
    const name = (payload.name || '').trim()
    if (!code || !name || !payload.relatedMtOrgId) return { ok: false, reason: 'required' }
    if (!state.receivers) state.receivers = []
    if (state.receivers.some((r) => r.code === code && r.id !== payload.id)) return { ok: false, reason: 'dup_code' }
    if (state.receivers.some((r) => r.name === name && r.id !== payload.id)) return { ok: false, reason: 'dup_name' }
    const now = nowText()
    const next = normalizeReceiver({
      id: payload.id || `ro${Date.now()}`,
      code,
      name,
      relatedMtOrgId: payload.relatedMtOrgId,
      relatedMtOrgName: payload.relatedMtOrgName || '',
      contactName: payload.contactName || '',
      contactPhone: payload.contactPhone || '',
      contactEmail: payload.contactEmail || '',
      remark: payload.remark || '',
      status: payload.status || 'enabled',
      updatedAt: now,
    })
    if (payload.id) {
      const item = state.receivers.find((r) => r.id === payload.id)
      if (!item) return { ok: false, reason: 'required' }
      Object.assign(item, next, { id: item.id })
      save()
      return { ok: true, item: normalizeReceiver(item) }
    }
    state.receivers.unshift(next)
    save()
    return { ok: true, item: next }
  },

  setReceiverStatus(id: string, status: PushStatus) {
    const item = (state.receivers || []).find((r) => r.id === id)
    if (!item) return null
    item.status = status
    item.updatedAt = nowText()
    save()
    return normalizeReceiver(item)
  },

  deleteReceiver(id: string): { ok: true } | { ok: false; reason: 'not_found' | 'in_use' } {
    const idx = (state.receivers || []).findIndex((r) => r.id === id)
    if (idx < 0) return { ok: false, reason: 'not_found' }
    const used = state.schemes.some((s) => s.receiverType === 'third' && s.orgId === id)
    if (used) return { ok: false, reason: 'in_use' }
    state.receivers.splice(idx, 1)
    save()
    return { ok: true }
  },
}

export function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
