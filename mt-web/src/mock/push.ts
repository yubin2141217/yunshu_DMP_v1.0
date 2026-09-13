export type PushStatus = 'enabled' | 'disabled'
export type PushChannelType = 'http' | 'mq' | 'file'
export type PushMode = 'incremental' | 'full'
export type ScheduleType = 'cron' | 'interval'
export type PushDataSourceType = 'standard' | 'datasource'
export type PushFilterLogic = 'all' | 'any'
export type PushFilterOp = 'contains' | 'equals' | 'not_contains'
/** 推送接收方类型：MT 机构 / 第三方接收方机构 */
export type PushReceiverType = 'mt' | 'third'

export interface PushHttpConfig {
  endpointUrl: string
  protocol: 'HTTPS' | 'HTTP'
  method: 'POST'
  authType: 'none' | 'token' | 'appkey'
  token?: string
  authHeaderName?: string
  appKey?: string
  appSecret?: string
  contentType?: string
  rateLimitQps?: number
  retry: number
  retryIntervalMs?: number
  successHttpCode?: string
  charset?: string
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

export interface PushSchemeStats {
  successTotal: number
  failTotal: number
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
  standardIds: string[]
  standardNames: string[]
  supplierIds: string[]
  supplierNames: string[]
  filterLogic: PushFilterLogic
  filterRules: PushFilterRule[]
  dedupeEnabled: boolean
  dedupeWindowHours: number
  dedupeFields: string[]
  channelType: PushChannelType
  httpConfig: PushHttpConfig
  mqConfig: PushMqConfig
  pushMode: PushMode
  scheduleType: ScheduleType
  cronExpr: string
  intervalMinutes: number
  batchLimit: number
  stats: PushSchemeStats
  updatedAt: string
}

const STORAGE_KEY = 'yunshu-mt-push-v8'

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
    token: '',
    authHeaderName: 'Authorization',
    appKey: '',
    appSecret: '',
    contentType: 'application/json',
    rateLimitQps: 50,
    retry: 3,
    retryIntervalMs: 1000,
    successHttpCode: '200',
    charset: 'UTF-8',
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
    lastPushCount: 0,
    lastPushAt: '',
    backlog: 0,
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
  if (s.scheduleType === 'cron') return `Cron: ${s.cronExpr || '—'}`
  return `每 ${s.intervalMinutes || '—'} 分钟`
}

export function channelLabel(t: PushChannelType) {
  if (t === 'http') return 'HTTP/HTTPS POST 推送'
  if (t === 'mq') return '消息队列推送'
  return '文件传输'
}

/** 推送类型选项（列表 / 筛选 / 表单 / 详情统一） */
export const pushChannelOptions = [
  { label: 'HTTP/HTTPS POST 推送', value: 'http' as const },
  { label: '消息队列推送', value: 'mq' as const },
]

export function pushModeLabel(m: PushMode) {
  return m === 'incremental' ? '增量' : '全量'
}

export function dataScopeSummary(
  s: Pick<PushScheme, 'dataSourceType' | 'dataSourceId' | 'standardNames' | 'supplierNames'>,
) {
  if (s.dataSourceType === 'datasource') {
    return s.dataSourceId?.trim() ? `数据源 ${s.dataSourceId}` : '数据源（未填 ID）'
  }
  const st = s.standardNames?.length ? s.standardNames.join('、') : '未选接入方案'
  return `接入方案 · ${st}`
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
    standardIds: raw.standardIds || [],
    standardNames: raw.standardNames || [],
    supplierIds: raw.supplierIds || [],
    supplierNames: raw.supplierNames || [],
    filterLogic: raw.filterLogic || data.filterLogic,
    filterRules: Array.isArray(raw.filterRules) ? raw.filterRules : [],
    dedupeEnabled: raw.dedupeEnabled ?? data.dedupeEnabled,
    dedupeWindowHours: Number(raw.dedupeWindowHours) > 0 ? Number(raw.dedupeWindowHours) : data.dedupeWindowHours,
    dedupeFields: Array.isArray(raw.dedupeFields) && raw.dedupeFields.length ? raw.dedupeFields : data.dedupeFields,
    channelType: raw.channelType || 'http',
    httpConfig: { ...emptyHttpConfig(), ...raw.httpConfig },
    mqConfig: { ...emptyMqConfig(), ...raw.mqConfig },
    pushMode: raw.pushMode || 'incremental',
    scheduleType: raw.scheduleType || 'interval',
    cronExpr: raw.cronExpr || '0 * * * *',
    intervalMinutes: Number(raw.intervalMinutes) || 30,
    batchLimit: Number(raw.batchLimit) || 500,
    stats: { ...emptyStats(), ...raw.stats },
    updatedAt: raw.updatedAt || nowText(),
  }
}

const seedSchemes: PushScheme[] = [
  normalizeScheme({
    id: 'ps1',
    name: '机构回推-HTTP标准',
    status: 'enabled',
    remark: '默认增量回推',
    receiverType: 'mt',
    orgId: 'o1',
    orgName: '陕西省网信办',
    orgStatUnit: '陕西大区',
    orgSalesName: '张三三',
    dataSourceType: 'standard',
    standardIds: [],
    standardNames: [],
    channelType: 'http',
    httpConfig: {
      ...emptyHttpConfig(),
      endpointUrl: 'https://org-recv.example.gov/api/v1/ingest',
      authType: 'token',
      token: 'demo-token',
      authHeaderName: 'Authorization',
      retry: 3,
    },
    pushMode: 'incremental',
    scheduleType: 'interval',
    cronExpr: '0 * * * *',
    intervalMinutes: 30,
    batchLimit: 500,
    stats: {
      successTotal: 12840,
      failTotal: 26,
      lastPushCount: 486,
      lastPushAt: '2026-09-11 08:30:00',
      backlog: 320,
    },
    updatedAt: '2026-09-08 10:00:00',
  }),
  normalizeScheme({
    id: 'ps2',
    name: '融媒体-MQ异步',
    status: 'enabled',
    remark: '每日凌晨全量',
    receiverType: 'third',
    orgId: 'ro1',
    orgName: '陕西省融媒第三方接收端',
    orgStatUnit: '陕西大区',
    orgSalesName: '王小明',
    dataSourceType: 'standard',
    standardIds: ['st1'],
    standardNames: ['云数中台全局接入方案'],
    channelType: 'mq',
    mqConfig: {
      ...emptyMqConfig(),
      mqType: 'kafka',
      brokers: 'mq.example.gov:9092',
      topic: 'yunshu.org.push',
      authType: 'none',
      retry: 2,
    },
    pushMode: 'full',
    scheduleType: 'cron',
    cronExpr: '0 2 * * *',
    intervalMinutes: 60,
    batchLimit: 1000,
    filterRules: [
      { id: 'fr-seed-1', field: 'title', op: 'contains', value: '舆情' },
    ],
    dedupeEnabled: true,
    dedupeWindowHours: 72,
    dedupeFields: ['title', 'url'],
    stats: {
      successTotal: 4020,
      failTotal: 58,
      lastPushCount: 1000,
      lastPushAt: '2026-09-11 02:05:00',
      backlog: 0,
    },
    updatedAt: '2026-09-07 16:20:00',
  }),
  normalizeScheme({
    id: 'ps3',
    name: '网安协查-HTTP推送',
    status: 'enabled',
    remark: '协查任务回传',
    receiverType: 'third',
    orgId: 'ro2',
    orgName: '网安协查第三方平台',
    orgStatUnit: '陕西大区',
    orgSalesName: '张三三',
    dataSourceType: 'standard',
    standardIds: ['st3'],
    standardNames: ['舆情实时推送方案'],
    channelType: 'http',
    httpConfig: {
      ...emptyHttpConfig(),
      endpointUrl: 'https://sec-recv.example.gov/api/push',
      authType: 'token',
      token: 'demo-sec-token',
      authHeaderName: 'X-Token',
      retry: 2,
    },
    pushMode: 'incremental',
    scheduleType: 'interval',
    intervalMinutes: 15,
    batchLimit: 200,
    stats: {
      successTotal: 2860,
      failTotal: 42,
      lastPushCount: 120,
      lastPushAt: '2026-09-11 09:10:00',
      backlog: 86,
    },
    updatedAt: '2026-09-09 11:00:00',
  }),
  normalizeScheme({
    id: 'ps4',
    name: '宣传部-定时全量',
    status: 'enabled',
    remark: '每日全量归档推送',
    receiverType: 'mt',
    orgId: 'o2',
    orgName: '西安市委宣传部',
    orgStatUnit: '陕西大区',
    orgSalesName: '李四五',
    dataSourceType: 'standard',
    standardIds: ['st1'],
    standardNames: ['云数中台全局接入方案'],
    channelType: 'http',
    httpConfig: {
      ...emptyHttpConfig(),
      endpointUrl: 'https://xcb-recv.example.gov/api/archive',
      authType: 'token',
      token: 'demo-xcb-token',
      authHeaderName: 'Authorization',
      retry: 1,
    },
    pushMode: 'full',
    scheduleType: 'cron',
    cronExpr: '0 3 * * *',
    intervalMinutes: 60,
    batchLimit: 2000,
    stats: {
      successTotal: 9640,
      failTotal: 18,
      lastPushCount: 2000,
      lastPushAt: '2026-09-11 03:05:00',
      backlog: 45,
    },
    updatedAt: '2026-09-08 18:40:00',
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
    relatedMtOrgName: '陕西省网信办',
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

export function paginate<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total: list.length }
}

export type SchemeSaveFail =
  | {
      ok: false
      reason: 'dup' | 'file' | 'cron' | 'interval' | 'batch' | 'http' | 'mq' | 'org' | 'datasource' | 'standard'
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
    if (params.status) list = list.filter((s) => s.status === params.status)
    return list
  },

  getScheme(id: string) {
    const item = state.schemes.find((s) => s.id === id)
    return item ? normalizeScheme(item) : null
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

  saveScheme(payload: Omit<PushScheme, 'id' | 'updatedAt' | 'stats'> & { id?: string; stats?: PushSchemeStats }): SchemeSaveFail {
    if (payload.channelType === 'file') return { ok: false, reason: 'file' }
    const name = payload.name.trim()
    if (state.schemes.some((s) => s.name === name && s.id !== payload.id)) {
      return { ok: false, reason: 'dup' }
    }
    const dataSourceType = payload.dataSourceType || 'standard'
    if (dataSourceType === 'datasource') {
      if (!payload.dataSourceId?.trim()) return { ok: false, reason: 'datasource' }
    }
    if (payload.scheduleType === 'cron' && !isValidCron(payload.cronExpr || '')) {
      return { ok: false, reason: 'cron' }
    }
    if (payload.scheduleType === 'interval' && !(Number(payload.intervalMinutes) > 0)) {
      return { ok: false, reason: 'interval' }
    }
    if (!(Number(payload.batchLimit) > 0)) return { ok: false, reason: 'batch' }

    if (payload.channelType === 'http') {
      if (!payload.httpConfig?.endpointUrl?.trim()) return { ok: false, reason: 'http' }
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
      standardIds: payload.standardIds || [],
      standardNames: payload.standardNames || [],
      supplierIds: payload.supplierIds || [],
      supplierNames: payload.supplierNames || [],
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
      httpConfig: payload.httpConfig,
      mqConfig: payload.mqConfig,
      pushMode: payload.pushMode,
      scheduleType: payload.scheduleType,
      cronExpr: (payload.cronExpr || '').trim(),
      intervalMinutes: Number(payload.intervalMinutes) || 0,
      batchLimit: Number(payload.batchLimit),
      updatedAt: now,
      stats: payload.stats,
    })
    const { id: _drop, stats: _s, ...rest } = base
    void _drop
    void _s

    if (payload.id) {
      const item = state.schemes.find((s) => s.id === payload.id)
      if (!item) return { ok: false, reason: 'dup' }
      Object.assign(item, rest, { updatedAt: now })
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
      stats: payload.stats || { ...emptyStats(), backlog },
    }
    state.schemes.unshift(item)
    save()
    return { ok: true, item }
  },

  setSchemeStatus(id: string, status: PushStatus) {
    const item = state.schemes.find((s) => s.id === id)
    if (!item) return null
    item.status = status
    item.updatedAt = nowText()
    save()
    return item
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
