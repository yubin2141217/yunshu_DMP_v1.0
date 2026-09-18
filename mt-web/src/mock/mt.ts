import {
  ensureSchemeOpLogs,
  makeOpLog,
  prependOpLog,
  type SchemeOpLog,
} from '@/utils/schemeOpLog'
import { dictMock } from './dict'

export type Status = 'enabled' | 'disabled'
export type StandardScope = 'global' | 'org'

export interface Supplier {
  id: string
  name: string
  code: string
  status: Status
  appkey: string
  updatedAt: string
}

export type OrgOpenVersion = 'formal' | 'trial'
export type OrgAuthStatus = 'running' | 'expired' | 'closed' | 'disabled'

export interface Org {
  id: string
  name: string
  /** 机构编码：供数方送数时 org_id 字段须填此值 */
  code: string
  status: Status
  supplierIds: string[]
  /** 绑定的接入方案（表单为单选，存储仍用数组兼容） */
  standardIds: string[]
  /** @deprecated 兼容旧单选 */
  standardId?: string
  remark?: string
  /** 所属统计单元 */
  statUnit?: string
  /** 所属销售 */
  salesName?: string
  supplierNames?: string[]
  standardName?: string
  standardNames?: string[]
  /** 机构全称 */
  fullName?: string
  /** 统一社会信用代码 */
  creditCode?: string
  /** 统计单元副文案，如 西安市/雁塔区 */
  region?: string
  /** 开通版本 */
  openVersion?: OrgOpenVersion
  /** 授权状态 */
  authStatus?: OrgAuthStatus
  /** 授权到期日 YYYY-MM-DD */
  expireAt?: string
}

function orgRecord(p: {
  id: string
  name: string
  code: string
  supplierIds?: string[]
  standardIds?: string[]
  remark?: string
  statUnit?: string
  salesName?: string
  fullName?: string
  creditCode?: string
  region?: string
  openVersion?: OrgOpenVersion
  authStatus?: OrgAuthStatus
  expireAt?: string
  status?: Status
}): Org {
  const standardIds = p.standardIds || []
  const authStatus = p.authStatus || 'running'
  return {
    id: p.id,
    name: p.name,
    code: p.code,
    fullName: p.fullName || p.name,
    creditCode: p.creditCode || p.code,
    region: p.region || '',
    statUnit: p.statUnit || '陕西大区',
    salesName: p.salesName || '',
    openVersion: p.openVersion || 'formal',
    authStatus,
    expireAt: p.expireAt || '2027-12-31',
    status: p.status ?? (authStatus === 'closed' || authStatus === 'disabled' ? 'disabled' : 'enabled'),
    supplierIds: p.supplierIds || [],
    standardIds,
    standardId: standardIds[0] || '',
    remark: p.remark || '',
  }
}

/** 业务分类（数据标准字段） */
export type BizCategory = '文章' | '作者' | '平台' | '标注' | '其它' | '运维管理'

/** 数据标准条目 */
export interface Metadata {
  id: string
  /** 字段名（唯一） */
  name: string
  /** 与 name 同步，供唯一校验兼容 */
  code: string
  /** 描述 */
  description: string
  /** 兼容旧桥接字段：等同 description */
  bizCaliber: string
  dataType: string
  /** 是否必填；未设置表示未填 */
  required?: boolean | null
  length?: string
  defaultValue?: string
  /** 业务分类 */
  bizCategory?: BizCategory | ''
  remark: string
  status: Status
  updatedAt: string
  /** 列表扩展：被多少接入方案引用 */
  refSchemeCount?: number
}

export type DataSourceType = 'table' | 'api' | 'unstructured' | 'queue'
export type JdbcDbType = 'mysql' | 'postgresql' | 'oracle' | 'dm' | 'sqlserver'

export interface Scheme {
  id: string
  name: string
  /** 数据源类型 */
  dataSourceType: DataSourceType
  /** 兼容旧字段，表单已移除 */
  supplierId?: string
  supplierName?: string
  /** JDBC：数据库类型 */
  jdbcDbType: JdbcDbType | string
  /** JDBC：主机 */
  jdbcHost: string
  /** JDBC：端口 */
  jdbcPort: string
  /** JDBC：库名 */
  jdbcDatabase: string
  /** JDBC：Schema / 模式（可选） */
  jdbcSchema: string
  /** JDBC：用户名 */
  jdbcUsername: string
  /** JDBC：密码（演示脱敏存储） */
  jdbcPassword: string
  /** 兼容旧桥接字段：映射自 JDBC 主机等 */
  frontHost?: string
  frontPort?: string
  protocol?: string
  path?: string
  frequency: string
  frequencyLabel?: string
  updateMode: string
  updateModeLabel?: string
  incrementField: string
  retry: number
  requireIpWhitelist: boolean
  remark: string
  status: Status
  updatedAt: string
  dataSourceTypeLabel?: string
  jdbcDbTypeLabel?: string
  jdbcUrlPreview?: string
}

export interface Standard {
  id: string
  /** 后台自增数字方案 ID（展示与搜索用） */
  schemeNo: number
  name: string
  /** @deprecated 业务上已统一为机构绑定；保存时固定为 org */
  scope: StandardScope
  orgId?: string
  orgName?: string
  /** 机构副信息：统计单元 */
  orgStatUnit?: string
  /** 机构副信息：所属销售 */
  orgSalesName?: string
  /** 绑定供数方（与机构一对一绑定到本方案） */
  supplierId?: string
  supplierName?: string
  /** 勾选的字段库 id 列表 */
  fieldIds: string[]
  /** 供数方字段映射（与 fieldIds 对应，非必填覆盖） */
  fieldMaps?: FieldMapItem[]
  /** 兼容旧字段：取 fieldIds[0] */
  metadataId: string
  /** @deprecated 已内嵌 apiAccess，保留兼容 */
  schemeId?: string
  metadataName?: string
  fieldNames?: string
  fieldSummary?: string
  schemeName?: string
  fields?: Metadata[]
  scheme?: Scheme | null
  metadata?: Metadata | null
  /** IP 白名单管控 */
  requireIpWhitelist: boolean
  remark: string
  /** 接口接入方式配置（HTTP POST） */
  apiAccess: ApiAccessConfig
  /** 接入方式类型 */
  accessMethod?: AccessMethodType
  /** 消息队列接入配置 */
  mqAccess?: MqAccessConfig
  /** 文件传输接入配置 */
  fileAccess?: FileAccessConfig
  /** 提交后生成的接口文档（Markdown） */
  apiDocMarkdown: string
  fileName: string
  fileSize: string
  fileUrl: string
  status: Status
  uploader: string
  /** 创建时间 */
  uploadedAt: string
  /** 更新时间 */
  updatedAt?: string
  type?: string
  publishedAt?: string
  /** 各时间跨度接入条数 */
  accessStats?: AccessVolumeStats
  /** 最近接入时间 */
  lastAccessAt?: string
  /** 近 1 周有接入数据的天数（用于活跃判定） */
  accessActiveDaysW1?: number
  /** 操作审计记录（新建 / 修改 / 开启 / 停用） */
  opLogs?: SchemeOpLog[]
}

/** 接入数据量时间跨度 */
export type AccessVolumeRange = 'total' | 'today' | 'd3' | 'w1' | 'm1'

export interface AccessVolumeStats {
  total: number
  today: number
  d3: number
  w1: number
  m1: number
}

export const accessVolumeRangeOptions: { label: string; value: AccessVolumeRange }[] = [
  { label: '累计', value: 'total' },
  { label: '今日', value: 'today' },
  { label: '近3天', value: 'd3' },
  { label: '近1周', value: 'w1' },
  { label: '近1月', value: 'm1' },
]

/** 活跃：近 1 周累计接入 > 1 万条，或近 1 周至少 5 天有接入数据 */
export const ACTIVE_ACCESS_W1_THRESHOLD = 10000
export const ACTIVE_ACCESS_DAYS_THRESHOLD = 5

export function isStandardActive(item: {
  accessStats?: AccessVolumeStats | null
  accessActiveDaysW1?: number
}) {
  const days = Number(item.accessActiveDaysW1) || 0
  return (
    accessVolumeOf(item.accessStats || undefined, 'w1') > ACTIVE_ACCESS_W1_THRESHOLD ||
    days >= ACTIVE_ACCESS_DAYS_THRESHOLD
  )
}

export function emptyAccessStats(): AccessVolumeStats {
  return { total: 0, today: 0, d3: 0, w1: 0, m1: 0 }
}

export function normalizeAccessStats(raw?: Partial<AccessVolumeStats> | null): AccessVolumeStats {
  const base = emptyAccessStats()
  if (!raw) return base
  return {
    total: Number(raw.total) || 0,
    today: Number(raw.today) || 0,
    d3: Number(raw.d3) || 0,
    w1: Number(raw.w1) || 0,
    m1: Number(raw.m1) || 0,
  }
}

export function accessVolumeOf(stats: AccessVolumeStats | undefined, range: AccessVolumeRange) {
  const s = normalizeAccessStats(stats)
  return s[range] || 0
}

export type ApiAuthType = 'none' | 'appkey' | 'token' | 'signature' | 'appkey_header' | 'bearer'

export type AccessMethodType = 'http_post' | 'mq' | 'file'

export const accessMethodOptions = [
  { label: 'HTTP/HTTPS POST 推送', value: 'http_post' },
  { label: '消息队列订阅', value: 'mq' },
]

export const accessMethodTips: Record<AccessMethodType, string> = {
  http_post:
    '供数方主动调用中台前置机开放接口，POST JSON 报文推送单条 / 批量数据记录（REST API）',
  mq: '供数方把数据消息持续写入 Topic，我方前置机作为消费端订阅 Topic 拉取数据；支持 BMQ / Kafka / RocketMQ',
  file: '厂商定时生成文件（json、csv、parquet）放到 SFTP 服务器；前置机定时去拉取文件解析入库',
}

/** 接口类型接入方式（HTTP/HTTPS POST） */
export interface ApiAccessConfig {
  protocol: 'HTTPS' | 'HTTP'
  method: 'POST' | 'PUT' | 'PATCH'
  /** 接口地址（前置机对外 URL） */
  endpointUrl: string
  baseUrl: string
  path: string
  contentType: string
  charset: string
  authType: ApiAuthType
  authHeaderName: string
  /** Token 静态串（鉴权=token 时） */
  staticToken: string
  /** 自定义请求头，多行 key: value */
  customHeaders: string
  timeoutSec: number
  retry: number
  retryIntervalMs: number
  rateLimitQps: number
  rateLimitStrategy: 'reject' | 'queue'
  idempotencyHeader: string
  batchMaxSize: number
  successCodePath: string
  successCodeValue: string
  /** 连通性测试成功响应码，默认 200 */
  successHttpCode: string
  payloadRootPath: string
  enableFieldValidate: boolean
  dedupeEnabled: boolean
  dedupeField: string
  pushTimeoutMs: number
  alertFailThreshold: number
  /** HTTP 推送鉴权凭证（方案级，可手动改） */
  appKey: string
  appSecret: string
  /** AppKey 鉴权时配置的鉴权 Header 键值对列表（与推送方案页一致） */
  authHeaders?: AccessAuthHeader[]
  /** 接口响应码列表 */
  responseCodes: { code: string; desc: string }[]
}

/** 鉴权 Header 行：AppKey 鉴权时以键值对列表方式配置请求头 */
export interface AccessAuthHeader {
  /** 是否启用该 Header（默认启用） */
  enabled?: boolean
  name: string
  value: string
  /** 参数说明（可选，仅配置侧备注） */
  remark?: string
}

/** 选中 AppKey 鉴权时的默认行：参数名 AppKey，参数值为系统生成的 32 位字母数字组合 */
export function defaultAccessAppKeyHeader(): AccessAuthHeader {
  return { enabled: true, name: 'AppKey', value: genSchemeAppKey(), remark: '' }
}

export type MqType = 'bmq' | 'kafka' | 'rocketmq'
export type MqAuthType = 'none' | 'sasl' | 'ssl'

export interface MqAccessConfig {
  mqType: MqType
  /** 接入地址集群，逗号分隔；RocketMQ 时作为 NameServer */
  brokers: string
  topic: string
  consumerGroup: string
  authType: MqAuthType
  username: string
  password: string
  certPath: string
  startOffset: 'latest' | 'earliest'
  concurrency: number
  maxPullSize: number
  retryCount: number
  deadLetterEnabled: boolean
  dataFormat: string
  enableFieldValidate: boolean
  dedupeField: string
  lagAlertThreshold: number
  failAlertThreshold: number
  /** BMQ */
  saslMechanism: 'PLAIN' | 'SCRAM'
  /** Kafka */
  autoCommit: boolean
  autoCommitIntervalMs: number
  /** RocketMQ */
  nameServer: string
  tagFilter: string
  consumeMode: 'clustering' | 'broadcasting'
  consumeTimeoutMs: number
  successCode: string
}

export interface FileAccessConfig {
  protocol: 'SFTP' | 'FTP'
  host: string
  port: number
  loginType: 'password' | 'key'
  username: string
  password: string
  privateKeyPath: string
  remoteDir: string
  fileNamePattern: string
  encoding: 'UTF-8' | 'GBK'
  fileFormat: 'JSON' | 'CSV' | 'Parquet'
  maxFilesPerPull: number
  pollInterval: string
  afterProcess: 'delete' | 'archive' | 'keep'
  resumeEnabled: boolean
  enableFieldValidate: boolean
  dedupeField: string
  fileTimeoutAlert: boolean
  parseFailAlert: boolean
  successCode: string
}

export function defaultApiAccess(): ApiAccessConfig {
  return {
    protocol: 'HTTPS',
    method: 'POST',
    endpointUrl: 'https://ingress.yunshu.example.com/api/v1/push',
    baseUrl: 'https://api.yunshu.example.com',
    path: '/api/v1/articles/push',
    contentType: 'application/json',
    charset: 'UTF-8',
    authType: 'appkey',
    authHeaderName: 'X-App-Key',
    staticToken: '',
    customHeaders: 'Content-Type: application/json',
    timeoutSec: 30,
    retry: 3,
    retryIntervalMs: 1000,
    rateLimitQps: 50,
    rateLimitStrategy: 'reject',
    idempotencyHeader: 'X-Idempotency-Key',
    batchMaxSize: 100,
    successCodePath: 'code',
    successCodeValue: '0',
    successHttpCode: '200',
    payloadRootPath: 'data.records',
    enableFieldValidate: false,
    dedupeEnabled: false,
    dedupeField: '',
    pushTimeoutMs: 5000,
    alertFailThreshold: 3,
    appKey: '',
    appSecret: '',
    authHeaders: [],
    responseCodes: [] as { code: string; desc: string }[],
  }
}

/** 接口响应码默认示例（新增方案时预填） */
export const DEFAULT_RESPONSE_CODES: { code: string; desc: string }[] = [
  { code: '200', desc: '成功' },
  { code: '400', desc: '请求参数错误' },
  { code: '401', desc: '鉴权失败' },
  { code: '403', desc: '禁止访问' },
  { code: '500', desc: '服务端错误' },
]

/** 新增接入方案表单用：不预填接口地址 / 限流重试 / 成功码等 */
export function emptyApiAccess(): ApiAccessConfig {
  const route = genDefaultRoute()
  const defaultHeader = defaultAccessAppKeyHeader()
  return {
    ...defaultApiAccess(),
    endpointUrl: `${SYSTEM_GATEWAY}${route}`,
    baseUrl: SYSTEM_GATEWAY,
    path: route,
    authType: 'appkey',
    customHeaders: 'Content-Type: application/json',
    contentType: 'application/json',
    rateLimitQps: undefined as unknown as number,
    retry: undefined as unknown as number,
    retryIntervalMs: undefined as unknown as number,
    successHttpCode: '',
    payloadRootPath: '',
    idempotencyHeader: '',
    appKey: defaultHeader.value,
    appSecret: '',
    authHeaders: [defaultHeader],
    responseCodes: DEFAULT_RESPONSE_CODES.map((r) => ({ ...r })),
  }
}

export function defaultMqAccess(): MqAccessConfig {
  return {
    mqType: 'kafka',
    brokers: '',
    topic: '',
    consumerGroup: '',
    authType: 'none',
    username: '',
    password: '',
    certPath: '',
    startOffset: 'latest',
    concurrency: 4,
    maxPullSize: 100,
    retryCount: 3,
    deadLetterEnabled: true,
    dataFormat: 'JSON',
    enableFieldValidate: false,
    dedupeField: '',
    lagAlertThreshold: 10000,
    failAlertThreshold: 3,
    saslMechanism: 'PLAIN',
    autoCommit: true,
    autoCommitIntervalMs: 5000,
    nameServer: '',
    tagFilter: '',
    consumeMode: 'clustering',
    consumeTimeoutMs: 15000,
    successCode: 'OK',
  }
}

export function defaultFileAccess(): FileAccessConfig {
  return {
    protocol: 'SFTP',
    host: '',
    port: 22,
    loginType: 'password',
    username: '',
    password: '',
    privateKeyPath: '',
    remoteDir: '',
    fileNamePattern: 'op_data_*.json',
    encoding: 'UTF-8',
    fileFormat: 'JSON',
    maxFilesPerPull: 50,
    pollInterval: '5min',
    afterProcess: 'archive',
    resumeEnabled: true,
    enableFieldValidate: false,
    dedupeField: '',
    fileTimeoutAlert: true,
    parseFailAlert: true,
    successCode: 'OK',
  }
}

export const apiAuthTypeOptions = [
  { label: '无鉴权', value: 'none' },
  { label: 'AppKey', value: 'appkey' },
]

/** HTTP 请求头预设（下拉） */
export const requestHeaderOptions = [
  { label: 'Content-Type: application/json', value: 'Content-Type: application/json' },
  { label: 'Content-Type: text/plain', value: 'Content-Type: text/plain' },
  { label: 'Content-Type: application/xml', value: 'Content-Type: application/xml' },
]

export function normalizeAuthType(t?: string): ApiAuthType {
  if (t === 'none') return 'none'
  if (t === 'appkey_header' || t === 'appkey') return 'appkey'
  // 历史 Token / 签名等选项已下线，统一归一为 AppKey
  return 'appkey'
}

export function accessMethodLabel(method?: AccessMethodType | string) {
  const hit = accessMethodOptions.find((o) => o.value === method)
  return hit?.label || 'HTTP/HTTPS POST 推送'
}

export function normalizeApiAccess(raw?: Partial<ApiAccessConfig> | null): ApiAccessConfig {
  const api = { ...defaultApiAccess(), ...(raw || {}) }
  api.authType = normalizeAuthType(api.authType)
  api.method = 'POST'
  if (!requestHeaderOptions.some((o) => o.value === api.customHeaders)) {
    const ct = (api.contentType || '').trim().toLowerCase()
    const hit = requestHeaderOptions.find((o) => o.value.toLowerCase().includes(ct) && ct)
    api.customHeaders = hit?.value || 'Content-Type: application/json'
  }
  const ctMatch = api.customHeaders.match(/content-type\s*:\s*(.+)/i)
  if (ctMatch?.[1]) api.contentType = ctMatch[1].trim()
  api.authHeaders = Array.isArray(raw?.authHeaders)
    ? raw.authHeaders.map((h) => ({
        enabled: h?.enabled ?? true,
        name: h?.name || '',
        value: h?.value || '',
        remark: h?.remark || '',
      }))
    : normalizeAuthType(raw?.authType) === 'appkey' && raw?.appKey?.trim()
      ? // 历史方案：由 AppKey 凭证 + 请求头名迁移为鉴权 Header 列表
        [{ enabled: true, name: raw.authHeaderName || 'AppKey', value: raw.appKey, remark: '' }]
      : []
  if (!api.endpointUrl?.trim() && (api.baseUrl || api.path)) {
    api.endpointUrl = buildApiEndpoint(api)
  }
  if (!Array.isArray(api.responseCodes) || api.responseCodes.length === 0) {
    api.responseCodes = DEFAULT_RESPONSE_CODES.map((r) => ({ ...r }))
  }
  return api
}

export function normalizeMqAccess(raw?: Partial<MqAccessConfig> | null): MqAccessConfig {
  return { ...defaultMqAccess(), ...(raw || {}) }
}

export function normalizeFileAccess(raw?: Partial<FileAccessConfig> | null): FileAccessConfig {
  const file = { ...defaultFileAccess(), ...(raw || {}) }
  if (!raw?.port) {
    file.port = file.protocol === 'FTP' ? 21 : 22
  }
  return file
}

/** 由接口地址同步 baseUrl/path，或反向补全 endpointUrl */
export function syncEndpointParts(api: ApiAccessConfig): ApiAccessConfig {
  const next = { ...api }
  const url = (next.endpointUrl || '').trim()
  if (url) {
    try {
      const u = new URL(url.includes('://') ? url : `${next.protocol === 'HTTP' ? 'http' : 'https'}://${url}`)
      next.protocol = u.protocol === 'http:' ? 'HTTP' : 'HTTPS'
      next.baseUrl = `${u.protocol}//${u.host}`
      next.path = u.pathname || '/'
      next.endpointUrl = u.toString().replace(/\/$/, u.pathname === '/' ? '/' : '')
    } catch {
      /* keep raw */
    }
  } else if (next.baseUrl || next.path) {
    next.endpointUrl = buildApiEndpoint(next)
  }
  return next
}

export function buildApiEndpoint(api: ApiAccessConfig) {
  if (api.endpointUrl?.trim()) {
    const url = api.endpointUrl.trim()
    if (/^https?:\/\//i.test(url)) return url
    return `${api.protocol === 'HTTP' ? 'http' : 'https'}://${url.replace(/^\/\//, '')}`
  }
  const base = (api.baseUrl || '').replace(/\/$/, '')
  const path = api.path?.startsWith('/') ? api.path : `/${api.path || ''}`
  return `${api.protocol.toLowerCase() === 'http' ? 'http' : 'https'}://${base.replace(/^https?:\/\//, '')}${path}`
}

type DocField = {
  name: string
  description?: string
  dataType?: string
  required?: boolean | null
  length?: string
  bizCategory?: string
}

function jsonSampleLiteral(value: string | number | boolean | null): string {
  if (value === null) return 'null'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

/** 按字段名 / 类型 / 业务含义生成报文示例值（JSON 字面量片段） */
export function sampleValueForField(field: DocField): string {
  const name = String(field.name || '').trim().toLowerCase()
  const desc = `${field.description || ''}${field.bizCategory || ''}`.toLowerCase()
  const type = String(field.dataType || 'String').trim().toLowerCase()
  const text = `${name} ${desc}`

  const byName: Record<string, string | number | boolean> = {
    supplier_code: 'QB001',
    org_id: 'ORG_WXB_001',
    platform: 'weibo',
    platform_name: '新浪微博',
    platform_domain_pri: 'weibo.com',
    platform_domain_sec: 'm.weibo.cn',
    platform_province: '浙江省',
    platform_city: '杭州市',
    platform_county: '西湖区',
    media_name: '云数观察',
    media_id: 'media_10086',
    media_followers_count: 12860,
    media_friends_count: 326,
    media_statues_count: 1842,
    media_is_verified: '是',
    media_verifiedtype: '机构认证',
    news_uuid: 'nws_20260910_001',
    news_url: 'https://example.com/news/20260910/001',
    news_title: '陕西推进数字化治理取得新进展',
    news_posttime: '2026-09-10 09:30:00',
    news_digest: '当地持续推进数字化治理，提升公共服务效率。',
    news_content: '近日，陕西省网信办表示将持续完善数据汇聚与协同机制，推动重点领域数字化转型落地。',
    news_keywords: '数字化,治理,公共服务',
    news_author: '记者张三',
    news_origin: '陕西日报',
    news_origin_url: 'https://example.com/origin/001',
    news_is_origin: '是',
    news_read_count: 3560,
    news_like_count: 128,
    news_comment_count: 36,
    news_reposts_count: 18,
    news_fetch_time: '2026-09-10 10:05:00',
    news_headimg_url: 'https://cdn.example.com/img/cover_001.jpg',
    news_emotion: '中性',
    news_postdate: '2026-09-10',
    news_origin_content: '原文内容示例，供联调对照。',
    news_origin_title: '原文标题示例',
    news_content_ip_location: '浙江',
    solr_create_time: '2026-09-10 10:06:12',
    news_ocr: '图片文字识别结果示例',
  }
  if (name && Object.prototype.hasOwnProperty.call(byName, name)) {
    return jsonSampleLiteral(byName[name])
  }

  if (/uuid/.test(text)) return jsonSampleLiteral(`uuid_${Date.now().toString(36)}`)
  if (/(^|_)url($|_)|链接|href|link/.test(text)) return jsonSampleLiteral('https://example.com/demo')
  if (/email|邮箱/.test(text)) return jsonSampleLiteral('demo@example.com')
  if (/phone|mobile|手机|电话/.test(text)) return jsonSampleLiteral('13800138000')
  if (/province|省/.test(text)) return jsonSampleLiteral('浙江省')
  if (/city|市/.test(text) && !/county|县|区/.test(text)) return jsonSampleLiteral('杭州市')
  if (/county|district|县|区/.test(text)) return jsonSampleLiteral('西湖区')
  if (/title|标题/.test(text)) return jsonSampleLiteral('示例标题')
  if (/keyword|关键词/.test(text)) return jsonSampleLiteral('关键词A,关键词B')
  if (/emotion|情感|sentiment/.test(text)) return jsonSampleLiteral('中性')
  if (/digest|摘要/.test(text)) return jsonSampleLiteral('这是一条示例摘要。')
  if (/content|正文|ocr/.test(text)) return jsonSampleLiteral('这是示例正文内容，用于联调对照。')
  if (/author|作者|昵称/.test(text)) return jsonSampleLiteral('示例作者')
  if (/origin|来源/.test(text) && !/url/.test(text)) return jsonSampleLiteral('示例来源')
  if (/platform/.test(text) && /name|名称/.test(text)) return jsonSampleLiteral('示例平台')
  if (/platform/.test(text)) return jsonSampleLiteral('wechat')
  if (/domain/.test(text)) return jsonSampleLiteral('example.com')
  if (/ip.*属|属地/.test(text)) return jsonSampleLiteral('浙江')
  if (/(^|_)date($|_)|日期/.test(text)) return jsonSampleLiteral('2026-09-10')
  if (/time|时间|posttime|fetch/.test(text)) return jsonSampleLiteral('2026-09-10 12:00:00')
  if (/count|数量|次数|粉丝|阅读|点赞|评论|转发/.test(text)) return jsonSampleLiteral(100)
  if (/is_|是否|开关|认证/.test(text)) return jsonSampleLiteral('是')
  if (/(^|_)id($|_)/.test(name)) return jsonSampleLiteral('ID_10001')
  if (/code|编码/.test(text)) return jsonSampleLiteral('CODE_001')

  if (['int', 'integer', 'long', 'number', 'float', 'double', 'decimal', 'bigint'].includes(type)) {
    return jsonSampleLiteral(0)
  }
  if (['bool', 'boolean'].includes(type)) return jsonSampleLiteral(true)
  if (['array', 'list', 'json'].includes(type)) return '[]'
  return jsonSampleLiteral('示例值')
}

function buildSampleJsonBody(fields: DocField[]): string {
  const bodyFields = fields.length ? fields : [{ name: 'field', dataType: 'String' }]
  return `{\n${bodyFields.map((f) => `  "${f.name}": ${sampleValueForField(f)}`).join(',\n')}\n}`
}

function apiAuthDesc(api: ApiAccessConfig): string {
  const t = normalizeAuthType(api.authType)
  if (t === 'none') return '无鉴权'
  const headerNames = (api.authHeaders || [])
    .filter((h) => h.enabled !== false && h.name?.trim())
    .map((h) => h.name.trim())
  if (headerNames.length) return `AppKey（Header：${headerNames.join('、')}）`
  return `AppKey（Header：${api.authHeaderName || 'X-App-Key'}）`
}

function dash(v: string | number | undefined | null) {
  if (v === undefined || v === null || v === '') return '—'
  return String(v)
}

function mqAuthLabel(t: MqAuthType) {
  if (t === 'sasl') return 'SASL 账号密码'
  if (t === 'ssl') return 'SSL 证书'
  return '无'
}

function mqOffsetLabel(v: MqAccessConfig['startOffset']) {
  return v === 'earliest' ? '最早位点' : '最新位点'
}

function buildSecurityNotice(
  scope: StandardScope,
  orgName: string | undefined,
  authType: ApiAuthType,
  requireIpWhitelist: boolean,
): string {
  const scopePart =
    scope === 'org'
      ? `本方案适用范围为机构${orgName ? `（${orgName}）` : ''}`
      : '本方案适用范围为全局（未选择机构）'
  if (normalizeAuthType(authType) === 'none') {
    return `${scopePart}：当前为无鉴权接入，请做好网络侧访问控制${
      requireIpWhitelist ? '（已启用 IP 白名单）' : '（建议启用 IP 白名单）'
    }，凭证与接口地址请勿通过公开渠道传播。`
  }
  const contact =
    scope === 'org' ? '请联系机构负责人获取 AppKey' : '请联系康奈公司对接人获取 AppKey'
  return `${scopePart}：${contact}，请妥善保管，勿通过公开渠道传播。`
}

/** 按已选字段与接入参数生成请求报文示例（HTTP + JSON） */
export function buildRequestExample(api: ApiAccessConfig, fields: DocField[]): string {
  const synced = syncEndpointParts(api)
  let host = (synced.baseUrl || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
  let path = synced.path?.startsWith('/') ? synced.path : `/${synced.path || ''}`
  try {
    const u = new URL(buildApiEndpoint(synced))
    host = u.host
    path = u.pathname || path
  } catch {
    /* keep */
  }
  const authType = normalizeAuthType(synced.authType)
  const sampleBody = buildSampleJsonBody(fields)
  const headers = [
    `${synced.method || 'POST'} ${path || '/'} HTTP/1.1`,
    `Host: ${host || 'api.example.com'}`,
    `Content-Type: ${synced.contentType || 'application/json'}; charset=${synced.charset || 'UTF-8'}`,
  ]
  if (authType === 'appkey') {
    const customHeaders = (synced.authHeaders || []).filter((h) => h.enabled !== false && h.name?.trim())
    if (customHeaders.length) {
      customHeaders.forEach((h) => {
        headers.push(`${h.name.trim()}: ${h.value?.trim() || '<your-appkey>'}`)
      })
    } else {
      headers.push(`${synced.authHeaderName || 'X-App-Key'}: <your-appkey>`)
    }
  }
  if (synced.customHeaders?.trim()) {
    synced.customHeaders
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        if (!headers.some((h) => h.toLowerCase().startsWith(line.split(':')[0].toLowerCase()))) {
          headers.push(line)
        }
      })
  }
  return `${headers.join('\n')}\n\n${sampleBody}`
}

export function buildMqExample(mq: MqAccessConfig, fields: DocField[]): string {
  const sample = buildSampleJsonBody(fields)
  const addr =
    mq.mqType === 'rocketmq' ? mq.nameServer || mq.brokers : mq.brokers
  return [
    `# 消息队列订阅示例（${mq.mqType.toUpperCase()}）`,
    `Brokers/NameServer: ${addr || '<cluster-address>'}`,
    `Topic: ${mq.topic || '<topic>'}`,
    `ConsumerGroup: ${mq.consumerGroup || '<group>'}`,
    mq.mqType === 'rocketmq' && mq.tagFilter ? `Tag: ${mq.tagFilter}` : '',
    `StartOffset: ${mq.startOffset}`,
    `DataFormat: ${mq.dataFormat || 'JSON'}`,
    '',
    '## 消息体示例',
    sample,
  ]
    .filter((l) => l !== '')
    .join('\n')
}

export function buildFileExample(file: FileAccessConfig, fields: DocField[]): string {
  const sample = buildSampleJsonBody(fields)
  return [
    `# 文件传输类拉取示例（${file.protocol}）`,
    `Host: ${file.host || '<host>'}:${file.port || (file.protocol === 'FTP' ? 21 : 22)}`,
    `RemoteDir: ${file.remoteDir || '/data/inbox'}`,
    `FilePattern: ${file.fileNamePattern || 'op_data_*.json'}`,
    `Format: ${file.fileFormat} / Encoding: ${file.encoding}`,
    `PollInterval: ${file.pollInterval}`,
    `AfterProcess: ${file.afterProcess}`,
    '',
    '## 单文件内容示例（JSON）',
    sample,
  ].join('\n')
}

export function buildAccessExample(
  method: AccessMethodType,
  api: ApiAccessConfig,
  mq: MqAccessConfig,
  file: FileAccessConfig,
  fields: DocField[],
): string {
  if (method === 'mq') return buildMqExample(mq, fields)
  if (method === 'file') return buildFileExample(file, fields)
  return buildRequestExample(api, fields)
}

export function successCodeOfAccess(
  method: AccessMethodType,
  api: ApiAccessConfig,
  mq: MqAccessConfig,
  file: FileAccessConfig,
) {
  if (method === 'mq') return mq.successCode || 'OK'
  if (method === 'file') return file.successCode || 'OK'
  return api.successHttpCode || '200'
}

export function isAccessConfigReady(
  method: AccessMethodType,
  api: ApiAccessConfig,
  mq: MqAccessConfig,
  file: FileAccessConfig,
) {
  if (method === 'mq') {
    const addr = mq.mqType === 'rocketmq' ? mq.nameServer || mq.brokers : mq.brokers
    return !!(addr?.trim() && mq.topic?.trim() && mq.consumerGroup?.trim())
  }
  if (method === 'file') {
    return !!(file.host?.trim() && file.remoteDir?.trim() && file.fileNamePattern?.trim())
  }
  const synced = syncEndpointParts(api)
  return !!(synced.endpointUrl?.trim() || (synced.baseUrl?.trim() && synced.path?.trim()))
}

export function buildApiDocMarkdown(input: {
  name: string
  scope: StandardScope
  orgName?: string
  requireIpWhitelist: boolean
  remark: string
  fields: DocField[]
  api: ApiAccessConfig
  accessMethod?: AccessMethodType
  mq?: MqAccessConfig
  file?: FileAccessConfig
}): string {
  const scopeLabel = input.scope === 'org' ? `机构${input.orgName ? `（${input.orgName}）` : ''}` : '全局'
  const method = input.accessMethod || 'http_post'
  const api = normalizeApiAccess(input.api)
  const mq = input.mq || defaultMqAccess()
  const file = input.file || defaultFileAccess()
  const requestExample = buildAccessExample(method, api, mq, file, input.fields)
  const successCode = successCodeOfAccess(method, api, mq, file)
  const securityNotice =
    method === 'http_post'
      ? buildSecurityNotice(input.scope, input.orgName, api.authType, input.requireIpWhitelist)
      : `${
          input.scope === 'org'
            ? `本方案适用范围为机构${input.orgName ? `（${input.orgName}）` : ''}`
            : '本方案适用范围为全局（未选择机构）'
        }：请妥善保管接入地址与鉴权凭证，勿通过公开渠道传播${
          input.requireIpWhitelist ? '；已启用 IP 白名单' : ''
        }。`

  let accessSection = ''
  const responseNotice =
    method === 'http_post'
      ? (api.responseCodes || []).some((r) => r.code)
        ? '接口响应码以「3.1 接口响应码」所列为准。'
        : '未配置接口响应码时，默认 `200` 视为接入成功。'
      : `连通性测试成功响应码为 \`${successCode}\`。`
  if (method === 'mq') {
    const addr = mq.mqType === 'rocketmq' ? mq.nameServer || mq.brokers : mq.brokers
    // 鉴权凭证行：SASL 展示用户名/密码（脱敏），SSL 展示证书路径（与新增/详情页一致）
    const mqAuthCredRows =
      mq.authType === 'sasl'
        ? `\n| 用户名 | ${dash(mq.username)} |\n| 密码 | ${mq.password ? '******' : '—'} |`
        : mq.authType === 'ssl'
          ? `\n| 证书路径 | ${dash(mq.certPath)} |`
          : ''
    accessSection = `## 3. 消息队列配置
| 项 | 说明 |
| --- | --- |
| 队列类型 | ${mq.mqType.toUpperCase()} |
| 接入地址 | ${dash(addr)} |
| Topic | ${dash(mq.topic)} |
| 消费组 | ${dash(mq.consumerGroup)} |
| 鉴权方式 | ${mqAuthLabel(mq.authType)} |${mqAuthCredRows}
| 起始消费位点 | ${mqOffsetLabel(mq.startOffset)} |
| 消费并发数 | ${dash(mq.concurrency)} |
| 单次拉取最大条数 | ${dash(mq.maxPullSize)} |
| 消息重试次数 | ${dash(mq.retryCount)} |
| 死信开关 | ${mq.deadLetterEnabled ? '开启' : '关闭'} |
| 数据格式 | ${dash(mq.dataFormat)} |
| 字段校验 | ${mq.enableFieldValidate ? '开启' : '关闭'} |
| 去重主键 | ${dash(mq.dedupeField)} |
| 堆积告警阈值 | ${dash(mq.lagAlertThreshold)} |
| 失败告警阈值 | ${dash(mq.failAlertThreshold)} |
| 成功响应码 | ${dash(mq.successCode)} |`
    if (mq.mqType === 'bmq') {
      accessSection += `\n| SASL 机制 | ${mq.saslMechanism} |`
    }
    if (mq.mqType === 'kafka') {
      accessSection += `\n| Offset 自动提交 | ${mq.autoCommit ? '是' : '否'} |\n| 自动提交间隔（ms） | ${dash(mq.autoCommitIntervalMs)} |`
    }
    if (mq.mqType === 'rocketmq') {
      accessSection += `\n| Tag 过滤 | ${dash(mq.tagFilter)} |\n| 消费模式 | ${mq.consumeMode === 'broadcasting' ? '广播消费' : '集群消费'} |\n| 单消息消费超时（ms） | ${dash(mq.consumeTimeoutMs)} |`
    }
  } else if (method === 'file') {
    accessSection = `## 3. 文件传输配置
| 项 | 说明 |
| --- | --- |
| 传输协议 | ${file.protocol} |
| 服务器地址 | ${dash(file.host)} |
| 端口号 | ${dash(file.port)} |
| 登录方式 | ${file.loginType === 'key' ? '密钥登录' : '用户名密码'} |
| 用户名 | ${dash(file.username)} |
| ${file.loginType === 'key' ? '私钥路径' : '密码'} | ${file.loginType === 'key' ? dash(file.privateKeyPath) : file.password ? '******' : '—'} |
| 文件目录路径 | ${dash(file.remoteDir)} |
| 文件命名匹配规则 | ${dash(file.fileNamePattern)} |
| 文件编码 | ${dash(file.encoding)} |
| 文件格式 | ${dash(file.fileFormat)} |
| 单次拉取最大文件数 | ${dash(file.maxFilesPerPull)} |
| 轮询扫描周期 | ${dash(file.pollInterval)} |
| 文件处理完成动作 | ${file.afterProcess === 'delete' ? '删除远程文件' : file.afterProcess === 'archive' ? '移动到归档目录' : '保留'} |
| 断点续传 | ${file.resumeEnabled ? '开启' : '关闭'} |
| 字段校验 | ${file.enableFieldValidate ? '开启' : '关闭'} |
| 去重主键 | ${dash(file.dedupeField)} |
| 文件超时告警 | ${file.fileTimeoutAlert ? '开启' : '关闭'} |
| 文件解析失败告警 | ${file.parseFailAlert ? '开启' : '关闭'} |
| 成功响应码 | ${dash(file.successCode)} |`
  } else {
    const responseCodesRows = (api.responseCodes || [])
      .map((r) => `| \`${dash(r.code)}\` | ${dash(r.desc)} |`)
      .join('\n')
    accessSection = `## 3. 接口信息
| 项 | 说明 |
| --- | --- |
| 接口地址 | \`${dash(buildApiEndpoint(api))}\` |
| 请求方法 | ${dash(api.method || 'POST')} |
| 鉴权方式 | ${apiAuthDesc(api)} |
| 最大 QPS 上限 | ${dash(api.rateLimitQps)} |

## 3.1 接口响应码
| 响应码 | 说明 |
| --- | --- |
${responseCodesRows || '| — | — |'}`
    // 鉴权方式为 AppKey 时展示鉴权 Header 明细（与新增/详情页一致）
    if (normalizeAuthType(api.authType) === 'appkey') {
      const authHeaderRows = (api.authHeaders || [])
        .filter((h) => h.name?.trim())
        .map(
          (h) =>
            `| \`${h.name.trim()}${h.enabled === false ? '（停用）' : ''}\` | ${h.value?.trim() || '—'} | ${dash(h.remark)} |`,
        )
        .join('\n')
      if (authHeaderRows) {
        accessSection += `

## 3.2 鉴权 Header
以键值对列表配置请求头，接入时将随报文一并校验。
| 参数名 | 参数值 | 说明 |
| --- | --- | --- |
${authHeaderRows}`
      }
    }
  }

  return `# ${input.name} · 接入文档

## 1. 概要
- 生效范围：${scopeLabel}
- 接入方式：${accessMethodLabel(method)}
- IP 白名单管控：${input.requireIpWhitelist ? '是' : '否'}
- 备注：${input.remark || '—'}

## 2. 安全说明
${securityNotice}

${accessSection}

## 4. 请求体字段
| 序号 | 字段名 | 描述 | 类型 | 长度 | 业务分类 |
| --- | --- | --- | --- | --- | --- |
${
  input.fields
    .map(
      (f, i) =>
        `| ${i + 1} | \`${f.name}\` | ${f.description || '—'} | ${f.dataType || '—'} | ${f.length || '—'} | ${f.bizCategory || '—'} |`,
    )
    .join('\n') || '| — | — | — | — | — | — |'
}

## 5. 请求示例
\`\`\`http
${requestExample}
\`\`\`

## 6. 响应约定
${responseNotice}
失败时返回可读错误信息；需白名单时来源 IP 未登记将拒收。
`
}

/** 由接入方案对象生成最新接口文档（含安全说明） */
export function resolveStandardApiDoc(item: {
  name: string
  scope?: StandardScope
  orgName?: string
  requireIpWhitelist?: boolean
  remark?: string
  fields?: DocField[]
  apiAccess?: ApiAccessConfig | null
  accessMethod?: AccessMethodType
  mqAccess?: MqAccessConfig | null
  fileAccess?: FileAccessConfig | null
  apiDocMarkdown?: string
}): string {
  return buildApiDocMarkdown({
    name: item.name,
    scope: item.scope || 'global',
    orgName: item.orgName || '',
    requireIpWhitelist: !!item.requireIpWhitelist,
    remark: item.remark || '',
    fields: item.fields || [],
    api: normalizeApiAccess(item.apiAccess),
    accessMethod: item.accessMethod || 'http_post',
    mq: normalizeMqAccess(item.mqAccess),
    file: normalizeFileAccess(item.fileAccess),
  })
}

/** 接口文档 HTML（用于导出 PDF） */
export function buildApiDocHtml(input: {
  name: string
  scope: StandardScope
  orgName?: string
  requireIpWhitelist: boolean
  remark: string
  fields: DocField[]
  api: ApiAccessConfig
  accessMethod?: AccessMethodType
  mq?: MqAccessConfig
  file?: FileAccessConfig
}): string {
  const scopeLabel = input.scope === 'org' ? `机构${input.orgName ? `（${input.orgName}）` : ''}` : '全局'
  const method = input.accessMethod || 'http_post'
  const api = normalizeApiAccess(input.api)
  const mq = input.mq || defaultMqAccess()
  const file = input.file || defaultFileAccess()
  const successCode = successCodeOfAccess(method, api, mq, file)
  const securityNotice =
    method === 'http_post'
      ? buildSecurityNotice(input.scope, input.orgName, api.authType, input.requireIpWhitelist)
      : `${
          input.scope === 'org'
            ? `本方案适用范围为机构${input.orgName ? `（${input.orgName}）` : ''}`
            : '本方案适用范围为全局（未选择机构）'
        }：请妥善保管接入地址与鉴权凭证，勿通过公开渠道传播${
          input.requireIpWhitelist ? '；已启用 IP 白名单' : ''
        }。`
  const fieldRows = input.fields
    .map(
      (f, i) =>
        `<tr><td>${i + 1}</td><td><code>${escapeHtml(f.name)}</code></td><td>${escapeHtml(f.description || '—')}</td><td>${escapeHtml(f.dataType || '—')}</td><td>${escapeHtml(f.length || '—')}</td><td>${escapeHtml(f.bizCategory || '—')}</td></tr>`,
    )
    .join('')
  const example = escapeHtml(buildAccessExample(method, api, mq, file, input.fields))

  const kv = (rows: [string, string][]) =>
    rows
      .map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${v}</td></tr>`)
      .join('')

  let accessHtml = ''
  if (method === 'mq') {
    const addr = mq.mqType === 'rocketmq' ? mq.nameServer || mq.brokers : mq.brokers
    const rows: [string, string][] = [
      ['队列类型', escapeHtml(mq.mqType.toUpperCase())],
      ['接入地址', escapeHtml(dash(addr))],
      ['Topic', escapeHtml(dash(mq.topic))],
      ['消费组', escapeHtml(dash(mq.consumerGroup))],
      ['鉴权方式', escapeHtml(mqAuthLabel(mq.authType))],
      // 鉴权凭证行：SASL 展示用户名/密码（脱敏），SSL 展示证书路径（与新增/详情页一致）
      ...(mq.authType === 'sasl'
        ? ([
            ['用户名', escapeHtml(dash(mq.username))],
            ['密码', mq.password ? '******' : '—'],
          ] as [string, string][])
        : []),
      ...(mq.authType === 'ssl'
        ? ([['证书路径', escapeHtml(dash(mq.certPath))]] as [string, string][])
        : []),
      ['起始消费位点', escapeHtml(mqOffsetLabel(mq.startOffset))],
      ['消费并发数', escapeHtml(dash(mq.concurrency))],
      ['单次拉取最大条数', escapeHtml(dash(mq.maxPullSize))],
      ['消息重试次数', escapeHtml(dash(mq.retryCount))],
      ['死信开关', mq.deadLetterEnabled ? '开启' : '关闭'],
      ['数据格式', escapeHtml(dash(mq.dataFormat))],
      ['字段校验', mq.enableFieldValidate ? '开启' : '关闭'],
      ['去重主键', escapeHtml(dash(mq.dedupeField))],
      ['堆积告警阈值', escapeHtml(dash(mq.lagAlertThreshold))],
      ['失败告警阈值', escapeHtml(dash(mq.failAlertThreshold))],
      ['成功响应码', escapeHtml(dash(mq.successCode))],
    ]
    if (mq.mqType === 'bmq') rows.push(['SASL 机制', escapeHtml(mq.saslMechanism)])
    if (mq.mqType === 'kafka') {
      rows.push(['Offset 自动提交', mq.autoCommit ? '是' : '否'])
      rows.push(['自动提交间隔（ms）', escapeHtml(dash(mq.autoCommitIntervalMs))])
    }
    if (mq.mqType === 'rocketmq') {
      rows.push(['Tag 过滤', escapeHtml(dash(mq.tagFilter))])
      rows.push(['消费模式', mq.consumeMode === 'broadcasting' ? '广播消费' : '集群消费'])
      rows.push(['单消息消费超时（ms）', escapeHtml(dash(mq.consumeTimeoutMs))])
    }
    accessHtml = `<h2>3. 消息队列配置</h2><table><tbody>${kv(rows)}</tbody></table>`
  } else if (method === 'file') {
    accessHtml = `<h2>3. 文件传输配置</h2><table><tbody>${kv([
      ['传输协议', escapeHtml(file.protocol)],
      ['服务器地址', escapeHtml(dash(file.host))],
      ['端口号', escapeHtml(dash(file.port))],
      ['登录方式', file.loginType === 'key' ? '密钥登录' : '用户名密码'],
      ['用户名', escapeHtml(dash(file.username))],
      [
        file.loginType === 'key' ? '私钥路径' : '密码',
        file.loginType === 'key' ? escapeHtml(dash(file.privateKeyPath)) : file.password ? '******' : '—',
      ],
      ['文件目录路径', escapeHtml(dash(file.remoteDir))],
      ['文件命名匹配规则', escapeHtml(dash(file.fileNamePattern))],
      ['文件编码', escapeHtml(dash(file.encoding))],
      ['文件格式', escapeHtml(dash(file.fileFormat))],
      ['单次拉取最大文件数', escapeHtml(dash(file.maxFilesPerPull))],
      ['轮询扫描周期', escapeHtml(dash(file.pollInterval))],
      [
        '文件处理完成动作',
        file.afterProcess === 'delete'
          ? '删除远程文件'
          : file.afterProcess === 'archive'
            ? '移动到归档目录'
            : '保留',
      ],
      ['断点续传', file.resumeEnabled ? '开启' : '关闭'],
      ['字段校验', file.enableFieldValidate ? '开启' : '关闭'],
      ['去重主键', escapeHtml(dash(file.dedupeField))],
      ['文件超时告警', file.fileTimeoutAlert ? '开启' : '关闭'],
      ['文件解析失败告警', file.parseFailAlert ? '开启' : '关闭'],
      ['成功响应码', escapeHtml(dash(file.successCode))],
    ])}</tbody></table>`
  } else {
    const responseCodesRows = (api.responseCodes || [])
      .filter((r) => r.code || r.desc)
      .map((r) => `<tr><td><code>${escapeHtml(dash(r.code))}</code></td><td>${escapeHtml(dash(r.desc))}</td></tr>`)
      .join('')
    const responseCodesTable = `<h2>3.1 接口响应码</h2><table><thead><tr><th>响应码</th><th>说明</th></tr></thead><tbody>${
      responseCodesRows || '<tr><td>—</td><td>—</td></tr>'
    }</tbody></table>`
    // 鉴权方式为 AppKey 时展示鉴权 Header 明细（与新增/详情页一致）
    let authHeadersTable = ''
    if (normalizeAuthType(api.authType) === 'appkey') {
      const authHeaderRowsHtml = (api.authHeaders || [])
        .filter((h) => h.name?.trim())
        .map(
          (h) =>
            `<tr><td><code>${escapeHtml(h.name.trim())}${h.enabled === false ? '（停用）' : ''}</code></td><td>${escapeHtml(h.value?.trim() || '—')}</td><td>${escapeHtml(dash(h.remark))}</td></tr>`,
        )
        .join('')
      if (authHeaderRowsHtml) {
        authHeadersTable = `<h2>3.2 鉴权 Header</h2><p class="security">以键值对列表配置请求头，接入时将随报文一并校验。</p><table><thead><tr><th>参数名</th><th>参数值</th><th>说明</th></tr></thead><tbody>${authHeaderRowsHtml}</tbody></table>`
      }
    }
    accessHtml = `<h2>3. 接口信息</h2><table><tbody>${kv([
      ['接口地址', `<code>${escapeHtml(dash(buildApiEndpoint(api)))}</code>`],
      ['请求方法', escapeHtml(dash(api.method || 'POST'))],
      ['鉴权方式', escapeHtml(apiAuthDesc(api))],
      ['最大 QPS 上限', escapeHtml(dash(api.rateLimitQps))],
    ])}</tbody></table>${responseCodesTable}${authHeadersTable}`
  }

  return `<div class="api-doc-pdf">
  <h1>${escapeHtml(input.name)} · 接入文档</h1>
  <h2>1. 概要</h2>
  <ul>
    <li>生效范围：${escapeHtml(scopeLabel)}</li>
    <li>接入方式：${escapeHtml(accessMethodLabel(method))}</li>
    <li>IP 白名单管控：${input.requireIpWhitelist ? '是' : '否'}</li>
    <li>备注：${escapeHtml(input.remark || '—')}</li>
  </ul>
  <h2>2. 安全说明</h2>
  <p class="security">${escapeHtml(securityNotice)}</p>
  ${accessHtml}
  <h2>4. 请求体字段</h2>
  <table>
    <thead><tr><th>序号</th><th>字段名</th><th>描述</th><th>类型</th><th>长度</th><th>业务分类</th></tr></thead>
    <tbody>${fieldRows || '<tr><td colspan="6">—</td></tr>'}</tbody>
  </table>
  <h2>5. 请求示例</h2>
  <pre>${example}</pre>
  <h2>6. 响应约定</h2>
  <p>${escapeHtml(
    method === 'http_post'
      ? (api.responseCodes || []).some((r) => r.code)
        ? '接口响应码以「3.1 接口响应码」所列为准。失败时返回可读错误信息；需白名单时来源 IP 未登记将拒收。'
        : '未配置接口响应码时，默认 200 视为接入成功。失败时返回可读错误信息；需白名单时来源 IP 未登记将拒收。'
      : `连通性测试成功响应码为 ${successCode}。失败时返回可读错误信息；需白名单时来源 IP 未登记将拒收。`,
  )}</p>
</div>`
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function resolveStandardApiDocHtml(item: {
  name: string
  scope?: StandardScope
  orgName?: string
  requireIpWhitelist?: boolean
  remark?: string
  fields?: DocField[]
  apiAccess?: ApiAccessConfig | null
  accessMethod?: AccessMethodType
  mqAccess?: MqAccessConfig | null
  fileAccess?: FileAccessConfig | null
}): string {
  return buildApiDocHtml({
    name: item.name,
    scope: item.scope || 'global',
    orgName: item.orgName || '',
    requireIpWhitelist: !!item.requireIpWhitelist,
    remark: item.remark || '',
    fields: item.fields || [],
    api: normalizeApiAccess(item.apiAccess),
    accessMethod: item.accessMethod || 'http_post',
    mq: normalizeMqAccess(item.mqAccess),
    file: normalizeFileAccess(item.fileAccess),
  })
}

export interface IpWhitelistItem {
  id: string
  ip: string
  /** 所属供数方（厂商） */
  supplierId: string
  supplierName?: string
  remark: string
  /** 启用后才参与接入校验 */
  status: Status
  createdAt: string
}

const STORAGE_KEY = 'yunshu-mt-mock-v33'
const BRIDGE_KEY = 'yunshu-enabled-standard-v1'
const BRIDGE_LIST_KEY = 'yunshu-enabled-standards-v2'

/** 去掉方案名称中括号及括号内文字（含全角/半角） */
function stripParenInName(name: string) {
  const cleaned = String(name || '')
    .replace(/\s*[（(][^）)]*[）)]\s*/g, '')
    .trim()
  return cleaned || String(name || '').trim()
}
/** V8 演示机构 */
export const DEMO_ORG_ID = 'o1'

export const bizCategoryOptions: { label: string; value: BizCategory }[] = dictMock.enabledOptions(
  'field_biz_category',
) as { label: string; value: BizCategory }[]

/** @deprecated 运维管理字段已改为可选手动勾选，不再强制锁定 */
export const LOCKED_BIZ_CATEGORY: BizCategory = '运维管理'
export const LOCKED_FIELD_IDS = ['supplier_code', 'org_id'] as const

export function ensureLockedFieldIds(fieldIds: string[]): string[] {
  return [...new Set(fieldIds)]
}

export function isLockedFieldId(_id: string) {
  return false
}

/** 接入方案 / 快速模板中的供数方字段映射 */
export interface FieldMapItem {
  fieldId: string
  /** 供数方字段名称（可选，默认同平台字段名） */
  supplierFieldName: string
  /** 供数方字段类型（可选，默认同平台字段类型） */
  supplierDataType: string
}

/** 字段库快速模板 */
export type FieldTemplateType = 'system' | 'custom'

export interface FieldTemplate {
  id: string
  name: string
  /** 模板说明 */
  desc: string
  fieldIds: string[]
  /** 选中字段的供数方映射 */
  fieldMaps?: FieldMapItem[]
  /** 系统内置 / 用户自定义 */
  type: FieldTemplateType
  updatedAt: string
}

/** 系统内置快速模板种子 */
export const builtinFieldTemplates: FieldTemplate[] = [
  {
    id: 'tpl_qb_push',
    name: '清博智能推送字段模板',
    desc: '清博推送常用字段：运维标识 + 平台 + 文章核心 + 情感标注',
    type: 'system',
    updatedAt: '2026-09-01 10:00:00',
    fieldIds: [
      'supplier_code',
      'org_id',
      'platform',
      'platform_name',
      'news_uuid',
      'news_url',
      'news_title',
      'news_posttime',
      'news_content',
      'news_origin',
      'news_is_origin',
      'news_emotion',
    ],
  },
  {
    id: 'tpl_zx_wxb',
    name: '智慧星光推送网信办字段模板',
    desc: '面向网信办报送：地域平台信息 + 作者账号 + 文章全文与互动量',
    type: 'system',
    updatedAt: '2026-09-01 10:00:00',
    fieldIds: [
      'supplier_code',
      'org_id',
      'platform',
      'platform_name',
      'platform_province',
      'platform_city',
      'platform_county',
      'media_name',
      'media_id',
      'media_is_verified',
      'news_uuid',
      'news_title',
      'news_url',
      'news_posttime',
      'news_digest',
      'news_content',
      'news_keywords',
      'news_read_count',
      'news_like_count',
      'news_comment_count',
      'news_emotion',
      'news_content_ip_location',
    ],
  },
  {
    id: 'tpl_qb_common',
    name: '清博智能通用模板',
    desc: '通用轻量集：标识字段 + 平台基础 + 文章标题链接',
    type: 'system',
    updatedAt: '2026-09-01 10:00:00',
    fieldIds: [
      'supplier_code',
      'org_id',
      'platform',
      'platform_name',
      'news_uuid',
      'news_title',
      'news_url',
      'news_posttime',
      'media_name',
    ],
  },
]

/** @deprecated 请用 mtMock.getFieldTemplates() / listFieldTemplates */
export const fieldTemplates = builtinFieldTemplates

export type FieldTemplateId = string

export function sameFieldIdSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((id) => set.has(id))
}

/** 规范化字段映射：仅保留 fieldIds 内项，补全缺省 */
export function normalizeFieldMaps(
  fieldIds: string[],
  maps: FieldMapItem[] | undefined,
  resolveDefault?: (fieldId: string) => { name: string; dataType: string } | null,
): FieldMapItem[] {
  const mapById = new Map((maps || []).map((m) => [m.fieldId, m]))
  return fieldIds.map((fieldId) => {
    const hit = mapById.get(fieldId)
    const def = resolveDefault?.(fieldId)
    return {
      fieldId,
      supplierFieldName: (hit?.supplierFieldName ?? def?.name ?? '').trim(),
      supplierDataType: (hit?.supplierDataType ?? def?.dataType ?? '').trim(),
    }
  })
}

export function sameFieldMaps(a: FieldMapItem[], b: FieldMapItem[]) {
  if (a.length !== b.length) return false
  const mb = new Map(b.map((x) => [x.fieldId, x]))
  return a.every((x) => {
    const y = mb.get(x.fieldId)
    if (!y) return false
    return (
      (x.supplierFieldName || '').trim() === (y.supplierFieldName || '').trim() &&
      (x.supplierDataType || '').trim() === (y.supplierDataType || '').trim()
    )
  })
}

export const dataTypeOptions = dictMock.enabledOptions('field_data_type')

export const dataSourceTypeLabels: Record<DataSourceType, string> = {
  table: '库表数据集',
  api: '接口',
  unstructured: '非结构化',
  queue: '实时队列',
}

export const dataSourceTypeOptions = [
  { label: '库表数据集', value: 'table' },
  { label: '接口', value: 'api' },
  { label: '非结构化', value: 'unstructured' },
  { label: '实时队列', value: 'queue' },
]

export const jdbcDbTypeLabels: Record<string, string> = {
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  oracle: 'Oracle',
  dm: '达梦 DM',
  sqlserver: 'SQL Server',
}

export const jdbcDbTypeOptions = [
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'Oracle', value: 'oracle' },
  { label: '达梦 DM', value: 'dm' },
  { label: 'SQL Server', value: 'sqlserver' },
]

export const jdbcDefaultPorts: Record<string, string> = {
  mysql: '3306',
  postgresql: '5432',
  oracle: '1521',
  dm: '5236',
  sqlserver: '1433',
}

export function buildJdbcUrlPreview(s: Partial<Scheme>) {
  const type = s.jdbcDbType || 'mysql'
  const host = s.jdbcHost || 'host'
  const port = s.jdbcPort || jdbcDefaultPorts[type] || '3306'
  const db = s.jdbcDatabase || 'database'
  const schema = s.jdbcSchema || ''
  if (type === 'postgresql') {
    return schema
      ? `jdbc:postgresql://${host}:${port}/${db}?currentSchema=${schema}`
      : `jdbc:postgresql://${host}:${port}/${db}`
  }
  if (type === 'oracle') return `jdbc:oracle:thin:@${host}:${port}:${db}`
  if (type === 'dm') return `jdbc:dm://${host}:${port}/${db}`
  if (type === 'sqlserver') return `jdbc:sqlserver://${host}:${port};databaseName=${db}`
  return `jdbc:mysql://${host}:${port}/${db}?useSSL=false&serverTimezone=Asia/Shanghai`
}

function fieldSeed(
  name: string,
  dataType: string,
  description: string,
  bizCategory: BizCategory,
  required: boolean | null = null,
  length = '',
): Metadata {
  return {
    id: name,
    name,
    code: name,
    description,
    bizCaliber: description,
    dataType,
    required,
    length,
    defaultValue: '',
    bizCategory,
    remark: '',
    status: 'enabled',
    updatedAt: '2026-09-08 10:00:00',
  }
}
export const frequencyLabels: Record<string, string> = {
  realtime: '实时',
  hourly: '每小时',
  daily: '每日',
}
export const updateModeLabels: Record<string, string> = {
  incremental: '增量',
  full: '全量',
}

function genAppkey(code: string) {
  return `ak_${code}_${Math.random().toString(36).slice(2, 10)}`
}

export const SCHEME_APP_KEY_LEN = 32
export const SCHEME_APP_SECRET_LEN = 16

/** 系统级网关（接口地址前缀，只读） */
export const SYSTEM_GATEWAY = 'https://ingress.yunshu.example.com'

function randomAlnum(len: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export function genSchemeAppKey() {
  return randomAlnum(SCHEME_APP_KEY_LEN)
}

/** 生成默认路由：/api/v1/push/ + 8 位字母数字（可手动修改） */
export function genDefaultRoute() {
  return `/api/v1/push/${randomAlnum(8)}`
}

export function genSchemeAppSecret() {
  return randomAlnum(SCHEME_APP_SECRET_LEN)
}

/** 机构主数据（模拟从 MT 同步） */
export interface OrgCatalogItem {
  id: string
  name: string
  code: string
}

/** 机构供数配置列表行：接入方案 × 供数方 展开 */
export interface OrgBindingRow {
  id: string
  orgId: string
  orgName: string
  orgCode: string
  /** 所属统计单元 */
  orgStatUnit?: string
  /** 所属销售 */
  orgSalesName?: string
  status: Status
  standardId: string
  standardName: string
  supplierId: string
  supplierName: string
  remark?: string
  orgStandardIds: string[]
  orgSupplierIds: string[]
}

export type SupplyTimeRange = 'today' | '3d' | '1w' | '1m'

export interface SupplyStatsFilter {
  /** 多选：指定若干机构，空=全部 */
  orgIds?: string[]
  /** 多选：指定若干接入方案，空=全部 */
  standardIds?: string[]
  /** 多选：指定若干供数方，空=全部 */
  supplierIds?: string[]
  /** 时间跨度：今日 / 近3天 / 近1周 / 近1月 */
  timeRange?: SupplyTimeRange
}

const TIME_RANGE_SCALE: Record<SupplyTimeRange, number> = {
  today: 1 / 30,
  '3d': 3 / 30,
  '1w': 7 / 30,
  '1m': 1,
}

/** 单一维度下的分类汇总行 */
export interface SupplyDimRow {
  id: string
  name: string
  inboundCount: number
  backlogCount: number
}

export interface SupplyStatsRow {
  id: string
  orgId: string
  orgName: string
  orgStatUnit?: string
  orgSalesName?: string
  standardId: string
  standardName: string
  supplierId: string
  supplierName: string
  inboundCount: number
  backlogCount: number
  lastInboundAt: string
}

/** 供数统计总览：总量 + 三个维度分类汇总 + 组合明细 */
export interface SupplyStatsOverview {
  totalInbound: number
  totalBacklog: number
  byOrg: SupplyDimRow[]
  byStandard: SupplyDimRow[]
  bySupplier: SupplyDimRow[]
  details: SupplyStatsRow[]
}

/** 筛选范围内的聚合趋势（仅接入量 / 堆积量两条线） */
export interface SupplyAggregateTrend {
  dates: string[]
  inbound: number[]
  backlog: number[]
}

export interface SupplyTrendPoint {
  date: string
  inbound: number
  backlog: number
}

export interface SupplyTrendSeries {
  name: string
  points: SupplyTrendPoint[]
}

/**
 * 综合看板「接入异常」演示数据：
 * 追加 10 个零接入 / 高堆积方案，使接入异常模块的零接入、高堆积列表各能展示 11 条。
 */
function buildAlertDemoStandards(): Standard[] {
  const demo = [
    { orgId: 'o5', name: '西安高新教育舆情接入方案' },
    { orgId: 'o6', name: '韩川教体舆情接入方案' },
    { orgId: 'o7', name: '渭南农物联数据接入方案' },
    { orgId: 'o8', name: '西安经济智联接入方案' },
    { orgId: 'o9', name: '银川教科舆情接入方案' },
    { orgId: 'o10', name: '延安红网接入方案' },
    { orgId: 'o11', name: '华山云巴生态接入方案' },
    { orgId: 'o12', name: '商洛康养物联接入方案' },
    { orgId: 'o13', name: '咸阳工门联数据接入方案' },
    { orgId: 'o14', name: '汉中新型政务接入方案' },
  ]
  return demo.map((item, idx) => {
    const n = idx + 1
    const suffix = String(n).padStart(2, '0')
    return {
      id: `stA${n}`,
      schemeNo: 10100 + n,
      name: item.name,
      scope: 'org' as StandardScope,
      orgId: item.orgId,
      supplierId: 's1',
      fieldIds: ['supplier_code', 'org_id', 'platform', 'news_uuid', 'news_title'],
      metadataId: 'supplier_code',
      requireIpWhitelist: false,
      remark: '综合看板接入异常演示数据',
      accessMethod: 'http_post' as AccessMethodType,
      apiAccess: {
        ...defaultApiAccess(),
        appKey: `AkAlert${suffix}`,
        appSecret: `SecAlertDemoKey${suffix}`,
      },
      mqAccess: defaultMqAccess(),
      fileAccess: defaultFileAccess(),
      apiDocMarkdown: '',
      fileName: `接入异常演示方案${suffix}-接口文档.pdf`,
      fileSize: '6 KB',
      fileUrl: '#',
      status: 'enabled' as Status,
      uploader: '平台运营',
      uploadedAt: '2026-09-10 10:00:00',
      accessStats: {
        total: 1800 + n * 260,
        today: 0,
        // 前5个近3天无接入（零接入演示），其余近3天有少量接入
        d3: n <= 5 ? 0 : 90 + n * 12,
        w1: 420 + n * 36,
        m1: 1600 + n * 120,
      },
      lastAccessAt: `2026-09-${String((n % 9) + 1).padStart(2, '0')} 0${n % 9}:30:00`,
      accessActiveDaysW1: n % 4,
    }
  })
}

const seed = {
  orgCatalog: [
    { id: 'oc1', name: '陕西省网信办', code: 'ORG_WXB_001' },
    { id: 'oc2', name: '西安市委宣传部', code: 'ORG_XCB_002' },
    { id: 'oc3', name: '西安市雁塔区融媒体中心', code: 'ORG_RMT_003' },
    { id: 'oc4', name: '咸阳市网信办', code: 'ORG_SWXB_004' },
    { id: 'oc5', name: '礼泉县融媒体中心', code: 'ORG_XRMT_005' },
    { id: 'oc6', name: '西安高新教育', code: 'CUST-SN-XA-007' },
    { id: 'oc7', name: '韩川教体', code: 'CUST-SN-HC-008' },
    { id: 'oc8', name: '渭南农物联', code: 'CUST-SN-WN-009' },
    { id: 'oc9', name: '银川教科', code: 'CUST-NX-YC-010' },
  ] as OrgCatalogItem[],
  suppliers: [
    { id: 's1', name: '清博智能', code: 'QB001', status: 'enabled' as Status, appkey: 'ak_QB001_demo01', updatedAt: '2026-09-01 14:20:00' },
    { id: 's2', name: '智慧星光', code: 'ZX001', status: 'enabled' as Status, appkey: 'ak_ZX001_demo02', updatedAt: '2026-08-28 09:10:00' },
    { id: 's3', name: '数美科技', code: 'SM001', status: 'disabled' as Status, appkey: 'ak_SM001_demo03', updatedAt: '2026-09-02 18:06:00' },
    { id: 's4', name: '百度舆情', code: 'BD001', status: 'enabled' as Status, appkey: 'ak_BD001_demo04', updatedAt: '2026-08-15 11:00:00' },
  ] as Supplier[],
  orgs: [
    orgRecord({
      id: 'o1',
      name: '陕西省网信办',
      code: 'ORG_WXB_001',
      supplierIds: ['s1', 's2', 's3'],
      standardIds: ['st1'],
      remark: '',
      region: '西安市/新城区',
      salesName: '张三三',
      openVersion: 'formal',
      authStatus: 'running',
      expireAt: '2028-04-09',
    }),
    orgRecord({
      id: 'o2',
      name: '西安市委宣传部',
      code: 'ORG_XCB_002',
      supplierIds: ['s1'],
      standardIds: ['st1'],
      remark: '宣传口径供数',
      region: '西安市/莲湖区',
      salesName: '李四五',
      openVersion: 'trial',
      authStatus: 'expired',
      expireAt: '2026-07-01',
    }),
    orgRecord({
      id: 'o3',
      name: '西安市雁塔区融媒体中心',
      code: 'ORG_RMT_003',
      supplierIds: ['s2', 's4'],
      standardIds: ['st3'],
      remark: '',
      region: '西安市/雁塔区',
      salesName: '王小明',
      openVersion: 'formal',
      authStatus: 'running',
      expireAt: '2027-12-31',
    }),
    orgRecord({
      id: 'o4',
      name: '咸阳市网信办',
      code: 'ORG_SWXB_004',
      supplierIds: ['s1', 's4'],
      standardIds: ['st1', 'st5'],
      remark: '市级双方案接入',
      region: '咸阳市/秦都区',
      salesName: '赵六',
      openVersion: 'formal',
      authStatus: 'closed',
      expireAt: '2025-08-01',
    }),
    orgRecord({
      id: 'o5',
      name: '西安高新教育',
      code: 'CUST-SN-XA-007',
      creditCode: '91610131MA7CXA07',
      region: '咸阳市/秦都区',
      salesName: '吕小诺',
      openVersion: 'formal',
      authStatus: 'running',
      expireAt: '2027-12-31',
    }),
    orgRecord({
      id: 'o6',
      name: '韩川教体',
      code: 'CUST-SN-HC-008',
      region: '韩城市/金城区',
      salesName: '唐磊',
      openVersion: 'trial',
      authStatus: 'expired',
      expireAt: '2026-05-14',
    }),
    orgRecord({
      id: 'o7',
      name: '渭南农物联',
      code: 'CUST-SN-WN-009',
      region: '渭南市/临渭区',
      salesName: '徐德荣',
      openVersion: 'formal',
      authStatus: 'running',
      expireAt: '2026-05-31',
    }),
    orgRecord({
      id: 'o8',
      name: '西安经济智联',
      code: 'CUST-SN-XA-011',
      region: '西安市/经开区',
      salesName: '谢纪光',
      openVersion: 'trial',
      authStatus: 'expired',
      expireAt: '2026-07-01',
    }),
    orgRecord({
      id: 'o9',
      name: '银川教科',
      code: 'CUST-NX-YC-010',
      statUnit: '宁夏大区',
      region: '银川市/兴庆区',
      salesName: '周主管',
      openVersion: 'formal',
      authStatus: 'closed',
      expireAt: '2025-08-01',
    }),
    orgRecord({
      id: 'o10',
      name: '延安红网',
      code: 'CUST-SN-YA-012',
      region: '延安市/宝塔区',
      salesName: '李明',
      openVersion: 'formal',
      authStatus: 'expired',
      expireAt: '2027-01-31',
    }),
    orgRecord({
      id: 'o11',
      name: '华山云巴生态',
      code: 'CUST-SN-HS-013',
      region: '渭南市/华阴市',
      salesName: '吴萍',
      openVersion: 'formal',
      authStatus: 'running',
      expireAt: '2028-04-09',
    }),
    orgRecord({
      id: 'o12',
      name: '商洛康养物联',
      code: 'CUST-SN-SL-014',
      region: '商洛市/商州区',
      salesName: '张伟',
      openVersion: 'formal',
      authStatus: 'running',
      expireAt: '2027-01-14',
    }),
    orgRecord({
      id: 'o13',
      name: '咸阳工门联',
      code: 'CUST-SN-XY-015',
      region: '咸阳市/渭城区',
      salesName: '刘洋',
      openVersion: 'trial',
      authStatus: 'expired',
      expireAt: '2025-11-01',
    }),
    orgRecord({
      id: 'o14',
      name: '汉中新型政务',
      code: 'CUST-SN-HZ-016',
      region: '汉中市/汉台区',
      salesName: '赵敏',
      openVersion: 'formal',
      authStatus: 'disabled',
      expireAt: '2026-02-20',
    }),
  ] as Org[],
  metadata: [
    fieldSeed('supplier_code', 'String', '供数方编码，对应供数方管理中的编码；库表路径据此识别来源厂商', '运维管理', true, '32'),
    fieldSeed('org_id', 'String', '归属机构编码；对应「机构供数配置」中的机构编码，一条只归属一个机构', '运维管理', true, '64'),
    fieldSeed('platform', 'String', '平台类型', '平台', true),
    fieldSeed('platform_name', 'String', '平台名称', '平台', true),
    fieldSeed('platform_domain_pri', 'String', '一级域名', '平台'),
    fieldSeed('platform_domain_sec', 'String', '二级域名', '平台'),
    fieldSeed('platform_province', 'String', '平台所属省份', '平台'),
    fieldSeed('platform_county', 'String', '平台所属县区', '平台'),
    fieldSeed('platform_city', 'String', '平台所属城市', '平台'),
    fieldSeed('media_name', 'String', '发布者昵称', '作者', false),
    fieldSeed('media_id', 'String', '发布者id', '作者'),
    fieldSeed('media_followers_count', 'Int', '发布者粉丝数', '作者'),
    fieldSeed('media_friends_count', 'Int', '发布者关注数', '作者'),
    fieldSeed('media_statues_count', 'Int', '发布者作品数', '作者'),
    fieldSeed('media_is_verified', 'String', '是否认证', '作者'),
    fieldSeed('media_verifiedtype', 'String', '认证类型', '作者'),
    fieldSeed('news_uuid', 'String', '文章唯一的标识', '文章', true, '64'),
    fieldSeed('news_url', 'String', '信息链接', '文章'),
    fieldSeed('news_title', 'String', '信息标题', '文章', false, '512'),
    fieldSeed('news_posttime', 'String', '信息发布时间', '文章'),
    fieldSeed('news_digest', 'String', '信息摘要', '文章'),
    fieldSeed('news_content', 'String', '信息正文', '文章'),
    fieldSeed('news_keywords', 'String', '文章关键词', '文章'),
    fieldSeed('news_author', 'String', '作者(唯一)', '文章'),
    fieldSeed('news_origin', 'String', '来源', '文章'),
    fieldSeed('news_origin_url', 'String', '来源url', '文章'),
    fieldSeed('news_is_origin', 'String', '是否原创', '标注', false),
    fieldSeed('news_read_count', 'Int', '信息阅读数', '标注'),
    fieldSeed('news_like_count', 'Int', '信息点赞数', '标注'),
    fieldSeed('news_comment_count', 'Int', '信息评论数', '标注'),
    fieldSeed('news_reposts_count', 'Int', '信息转发数', '标注'),
    fieldSeed('news_fetch_time', 'String', '文章抓取时间', '标注'),
    fieldSeed('news_headimg_url', 'String', '信息头图', '标注'),
    fieldSeed('news_emotion', 'String', '文章情感属性：中性、负面、正面', '标注'),
    fieldSeed('news_postdate', 'String', '文章发布日期', '文章'),
    fieldSeed('news_origin_content', 'String', '原文内容', '文章'),
    fieldSeed('news_origin_title', 'String', '原文标题', '文章'),
    fieldSeed('news_content_ip_location', 'String', '文章ip属地', '文章'),
    fieldSeed('solr_create_time', 'String', '入库时间', '文章'),
    fieldSeed('news_ocr', 'String', 'ocr识别内容', '文章'),
  ] as Metadata[],
  schemes: [
    {
      id: 'p1',
      name: '舆情库表增量接入',
      dataSourceType: 'table' as DataSourceType,
      jdbcDbType: 'mysql',
      jdbcHost: '10.0.1.12',
      jdbcPort: '3306',
      jdbcDatabase: 'yunshu_ods',
      jdbcSchema: '',
      jdbcUsername: 'yunshu_rw',
      jdbcPassword: 'Demo@123456',
      frequency: 'hourly',
      updateMode: 'incremental',
      incrementField: 'content_time',
      retry: 3,
      requireIpWhitelist: true,
      remark: 'MySQL JDBC 增量抽取，开启 IP 白名单',
      status: 'enabled' as Status,
      updatedAt: '2026-09-01 14:20:00',
    },
    {
      id: 'p2',
      name: '日终全量库表接入',
      dataSourceType: 'table' as DataSourceType,
      jdbcDbType: 'postgresql',
      jdbcHost: 'db.example.local',
      jdbcPort: '5432',
      jdbcDatabase: 'yunshu_dw',
      jdbcSchema: 'public',
      jdbcUsername: 'etl_reader',
      jdbcPassword: 'Demo@123456',
      frequency: 'daily',
      updateMode: 'full',
      incrementField: '',
      retry: 1,
      requireIpWhitelist: false,
      remark: 'PostgreSQL 日终全量抽取',
      status: 'enabled' as Status,
      updatedAt: '2026-08-28 09:10:00',
    },
  ] as Scheme[],
  standards: [
    {
      id: 'st1',
      schemeNo: 10001,
      name: '云数中台全局接入方案',
      scope: 'org' as StandardScope,
      orgId: 'o1',
      supplierId: 's1',
      fieldIds: ['supplier_code', 'org_id', 'platform', 'platform_name', 'news_uuid', 'news_title', 'media_name', 'news_is_origin'],
      metadataId: 'supplier_code',
      requireIpWhitelist: true,
      remark: '全局默认接口推送方案',
      accessMethod: 'http_post' as AccessMethodType,
      apiAccess: {
        ...defaultApiAccess(),
        appKey: 'AkGlo8x1',
        appSecret: 'SecGlo16DemoKey1',
      },
      mqAccess: defaultMqAccess(),
      fileAccess: defaultFileAccess(),
      apiDocMarkdown: '',
      fileName: '云数中台全局接入方案-接口文档.pdf',
      fileSize: '12 KB',
      fileUrl: '#',
      status: 'enabled' as Status,
      uploader: '平台运营',
      uploadedAt: '2026-09-03 11:00:00',
      accessStats: { total: 186420, today: 4280, d3: 12600, w1: 31200, m1: 98400 },
      lastAccessAt: '2026-09-11 13:42:18',
      accessActiveDaysW1: 7,
    },
    {
      id: 'st2',
      schemeNo: 10002,
      name: '陕西省网信办机构接入方案',
      scope: 'org' as StandardScope,
      orgId: 'o1',
      supplierId: 's2',
      fieldIds: ['supplier_code', 'org_id', 'platform', 'news_uuid', 'news_title'],
      metadataId: 'supplier_code',
      requireIpWhitelist: false,
      remark: '',
      accessMethod: 'http_post' as AccessMethodType,
      apiAccess: {
        ...defaultApiAccess(),
        path: '/api/v1/org/o1/articles/push',
        rateLimitQps: 20,
        appKey: 'AkOrg8o1',
        appSecret: 'SecOrg16DemoKey01',
      },
      mqAccess: defaultMqAccess(),
      fileAccess: defaultFileAccess(),
      apiDocMarkdown: '',
      fileName: '陕西省网信办机构接入方案-接口文档.pdf',
      fileSize: '10 KB',
      fileUrl: '#',
      status: 'disabled' as Status,
      uploader: '平台运营',
      uploadedAt: '2026-08-15 10:00:00',
      accessStats: { total: 820, today: 0, d3: 12, w1: 46, m1: 210 },
      lastAccessAt: '2026-08-20 09:12:00',
      accessActiveDaysW1: 1,
    },
    {
      id: 'st3',
      schemeNo: 10003,
      name: '舆情实时推送方案',
      scope: 'org' as StandardScope,
      orgId: 'o2',
      supplierId: 's1',
      fieldIds: ['supplier_code', 'org_id', 'platform', 'news_uuid', 'news_title', 'news_content', 'news_posttime'],
      metadataId: 'supplier_code',
      requireIpWhitelist: true,
      remark: '面向实时舆情入库的高 QPS 推送',
      accessMethod: 'http_post' as AccessMethodType,
      apiAccess: {
        ...defaultApiAccess(),
        path: '/api/v1/opinion/realtime/push',
        rateLimitQps: 200,
        appKey: 'AkRt8yx2',
        appSecret: 'SecRt16DemoKey002',
      },
      mqAccess: defaultMqAccess(),
      fileAccess: defaultFileAccess(),
      apiDocMarkdown: '',
      fileName: '舆情实时推送方案-接口文档.pdf',
      fileSize: '11 KB',
      fileUrl: '#',
      status: 'enabled' as Status,
      uploader: '平台运营',
      uploadedAt: '2026-09-05 09:20:00',
      accessStats: { total: 256800, today: 6120, d3: 18400, w1: 45800, m1: 142000 },
      lastAccessAt: '2026-09-11 14:01:06',
      accessActiveDaysW1: 7,
    },
    {
      id: 'st4',
      schemeNo: 10004,
      name: 'Kafka 舆情订阅方案',
      scope: 'org' as StandardScope,
      orgId: 'o1',
      supplierId: 's3',
      fieldIds: ['supplier_code', 'org_id', 'platform', 'news_uuid', 'news_title', 'news_digest'],
      metadataId: 'supplier_code',
      requireIpWhitelist: false,
      remark: '通过 Kafka Topic 订阅供数方增量',
      accessMethod: 'mq' as AccessMethodType,
      apiAccess: defaultApiAccess(),
      mqAccess: {
        ...defaultMqAccess(),
        mqType: 'kafka',
        brokers: 'kafka-1.yunshu.local:9092,kafka-2.yunshu.local:9092',
        topic: 'yunshu.opinion.inbound',
        consumerGroup: 'cg-yunshu-mt',
        startOffset: 'latest',
        concurrency: 4,
        maxPullSize: 200,
      },
      fileAccess: defaultFileAccess(),
      apiDocMarkdown: '',
      fileName: 'Kafka舆情订阅方案-接口文档.pdf',
      fileSize: '9 KB',
      fileUrl: '#',
      status: 'enabled' as Status,
      uploader: '数据接入组',
      uploadedAt: '2026-09-01 16:40:00',
      accessStats: { total: 38400, today: 960, d3: 2800, w1: 7200, m1: 24600 },
      lastAccessAt: '2026-09-11 12:18:44',
      accessActiveDaysW1: 5,
    },
    {
      id: 'st5',
      schemeNo: 10005,
      name: '西安市委宣传部专属推送方案',
      scope: 'org' as StandardScope,
      orgId: 'o2',
      supplierId: 's2',
      fieldIds: ['supplier_code', 'org_id', 'platform', 'platform_name', 'news_uuid', 'news_title', 'news_origin'],
      metadataId: 'supplier_code',
      requireIpWhitelist: true,
      remark: '宣传口径供数，开启白名单',
      accessMethod: 'http_post' as AccessMethodType,
      apiAccess: {
        ...defaultApiAccess(),
        path: '/api/v1/org/o2/articles/push',
        rateLimitQps: 30,
        appKey: 'AkXcb8p2',
        appSecret: 'SecXcb16DemoKey03',
      },
      mqAccess: defaultMqAccess(),
      fileAccess: defaultFileAccess(),
      apiDocMarkdown: '',
      fileName: '西安市委宣传部专属推送方案-接口文档.pdf',
      fileSize: '10 KB',
      fileUrl: '#',
      status: 'enabled' as Status,
      uploader: '平台运营',
      uploadedAt: '2026-08-28 14:15:00',
      accessStats: { total: 91200, today: 2100, d3: 6400, w1: 16800, m1: 52000 },
      lastAccessAt: '2026-09-11 11:55:02',
      accessActiveDaysW1: 6,
    },
    {
      id: 'st6',
      schemeNo: 10006,
      name: 'RocketMQ 批量接入方案',
      scope: 'org' as StandardScope,
      orgId: 'o2',
      supplierId: 's3',
      fieldIds: ['supplier_code', 'org_id', 'news_uuid', 'news_title', 'news_content', 'news_keywords'],
      metadataId: 'supplier_code',
      requireIpWhitelist: false,
      remark: '适合大批量异步投递',
      accessMethod: 'mq' as AccessMethodType,
      apiAccess: defaultApiAccess(),
      mqAccess: {
        ...defaultMqAccess(),
        mqType: 'rocketmq',
        nameServer: 'rmq-ns.yunshu.local:9876',
        topic: 'TP_YUNSHU_BATCH',
        consumerGroup: 'GID_YUNSHU_MT',
        tagFilter: 'OPINION || NEWS',
        consumeMode: 'clustering',
        concurrency: 8,
        maxPullSize: 500,
      },
      fileAccess: defaultFileAccess(),
      apiDocMarkdown: '',
      fileName: 'RocketMQ批量接入方案-接口文档.pdf',
      fileSize: '8 KB',
      fileUrl: '#',
      status: 'enabled' as Status,
      uploader: '数据接入组',
      uploadedAt: '2026-09-06 10:05:00',
      accessStats: { total: 142600, today: 3800, d3: 11200, w1: 28600, m1: 88000 },
      lastAccessAt: '2026-09-11 13:20:31',
      accessActiveDaysW1: 7,
    },
    {
      id: 'st8',
      schemeNo: 10007,
      name: '融媒体中心轻量推送方案',
      scope: 'org' as StandardScope,
      orgId: 'o3',
      supplierId: 's1',
      fieldIds: ['supplier_code', 'org_id', 'platform', 'news_uuid', 'news_title', 'media_name'],
      metadataId: 'supplier_code',
      requireIpWhitelist: false,
      remark: '区县融媒体轻量接入',
      accessMethod: 'http_post' as AccessMethodType,
      apiAccess: {
        ...defaultApiAccess(),
        path: '/api/v1/org/o3/articles/push',
        rateLimitQps: 10,
        authType: 'none',
        appKey: '',
        appSecret: '',
      },
      mqAccess: defaultMqAccess(),
      fileAccess: defaultFileAccess(),
      apiDocMarkdown: '',
      fileName: '融媒体中心轻量推送方案-接口文档.pdf',
      fileSize: '6 KB',
      fileUrl: '#',
      status: 'enabled' as Status,
      uploader: '平台运营',
      uploadedAt: '2026-09-08 11:45:00',
      accessStats: { total: 1560, today: 0, d3: 80, w1: 260, m1: 900 },
      lastAccessAt: '2026-09-10 18:06:12',
      accessActiveDaysW1: 2,
    },
    ...buildAlertDemoStandards(),
  ] as Standard[],
  ipWhitelist: [
    {
      id: 'ip1',
      ip: '10.0.1.12',
      supplierId: 's2',
      remark: '前置机出口',
      status: 'enabled' as Status,
      createdAt: '2026-09-01 10:00:00',
    },
    {
      id: 'ip2',
      ip: '203.0.113.8',
      supplierId: 's2',
      remark: '联调出口',
      status: 'enabled' as Status,
      createdAt: '2026-09-02 09:00:00',
    },
    {
      id: 'ip3',
      ip: '10.0.2.20',
      supplierId: 's1',
      remark: '库表推送节点',
      status: 'enabled' as Status,
      createdAt: '2026-09-03 11:00:00',
    },
  ] as IpWhitelistItem[],
  fieldTemplates: JSON.parse(JSON.stringify(builtinFieldTemplates)) as FieldTemplate[],
}

// 把「接入异常」演示方案绑定到对应机构，保证方案级高堆积列表能展示 11 条数据
for (const st of seed.standards) {
  if (!st.id.startsWith('stA')) continue
  const org = seed.orgs.find((o) => o.id === st.orgId)
  if (!org) continue
  org.supplierIds = Array.from(new Set([...org.supplierIds, st.supplierId || 's1']))
  org.standardIds = Array.from(new Set([...org.standardIds, st.id]))
}

interface State {
  orgCatalog: OrgCatalogItem[]
  suppliers: Supplier[]
  orgs: Org[]
  metadata: Metadata[]
  schemes: Scheme[]
  standards: Standard[]
  ipWhitelist: IpWhitelistItem[]
  fieldTemplates: FieldTemplate[]
}

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

function loadState(): State {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as State
      parsed.orgCatalog = Array.isArray(parsed.orgCatalog) && parsed.orgCatalog.length
        ? parsed.orgCatalog
        : clone(seed.orgCatalog)
      parsed.suppliers = (parsed.suppliers || []).map((s) => ({
        ...s,
        appkey: s.appkey || genAppkey(s.code || 'x'),
      }))
      parsed.orgs = (parsed.orgs || []).map((o, idx) => {
        const standardIds =
          Array.isArray(o.standardIds) && o.standardIds.length
            ? o.standardIds
            : o.standardId
              ? [o.standardId]
              : []
        const seedOrg = seed.orgs.find((x) => x.id === o.id)
        return {
          ...o,
          code: o.code || `ORG_${String(o.id || idx).toUpperCase()}`,
          status: (o.status === 'disabled' ? 'disabled' : 'enabled') as Status,
          standardIds,
          standardId: standardIds[0] || '',
          remark: o.remark || '',
          statUnit: o.statUnit || seedOrg?.statUnit || '',
          salesName: o.salesName || seedOrg?.salesName || '',
          fullName: o.fullName || seedOrg?.fullName || o.name,
          creditCode: o.creditCode || seedOrg?.creditCode || o.code || '',
          region: o.region || seedOrg?.region || '',
          openVersion: o.openVersion || seedOrg?.openVersion || 'formal',
          authStatus:
            o.authStatus ||
            seedOrg?.authStatus ||
            (o.status === 'disabled' ? 'disabled' : 'running'),
          expireAt: o.expireAt || seedOrg?.expireAt || '',
        }
      })
      parsed.schemes = (parsed.schemes || []).map((s) => {
        const jdbcDbType = s.jdbcDbType || 'mysql'
        const jdbcHost = s.jdbcHost || s.frontHost || ''
        const jdbcPort = s.jdbcPort || s.frontPort || jdbcDefaultPorts[jdbcDbType] || '3306'
        return {
          ...s,
          dataSourceType: (s.dataSourceType || 'table') as DataSourceType,
          jdbcDbType,
          jdbcHost,
          jdbcPort,
          jdbcDatabase: s.jdbcDatabase || s.path || '',
          jdbcSchema: s.jdbcSchema || '',
          jdbcUsername: s.jdbcUsername || '',
          jdbcPassword: s.jdbcPassword || '',
          requireIpWhitelist: !!s.requireIpWhitelist,
        }
      })
      parsed.standards = (parsed.standards || []).map((st, idx) => {
        const fieldIds = st.fieldIds?.length ? st.fieldIds : st.metadataId ? [st.metadataId] : []
        const apiAccess = normalizeApiAccess(st.apiAccess)
        const accessMethod = (st.accessMethod || 'http_post') as AccessMethodType
        const seedSt = seed.standards.find((x) => x.id === st.id)
        return {
          ...st,
          name: stripParenInName(st.name),
          schemeNo: Number(st.schemeNo) || seedSt?.schemeNo || 10001 + idx,
          scope: 'org' as StandardScope,
          orgId: st.orgId || 'o1',
          supplierId: st.supplierId || 's1',
          fieldIds,
          fieldMaps: Array.isArray(st.fieldMaps) ? st.fieldMaps : [],
          metadataId: st.metadataId || fieldIds[0] || '',
          requireIpWhitelist: !!st.requireIpWhitelist,
          remark: st.remark || '',
          accessMethod,
          apiAccess,
          mqAccess: normalizeMqAccess(st.mqAccess),
          fileAccess: normalizeFileAccess(st.fileAccess),
          apiDocMarkdown: st.apiDocMarkdown || '',
          fileName: st.fileName?.replace(/\.md$/i, '.pdf') || `${stripParenInName(st.name)}-接口文档.pdf`,
          accessStats: normalizeAccessStats(st.accessStats || seedSt?.accessStats),
          lastAccessAt: st.lastAccessAt || seedSt?.lastAccessAt || '',
          accessActiveDaysW1:
            Number(st.accessActiveDaysW1) ||
            Number(seedSt?.accessActiveDaysW1) ||
            0,
        }
      })
      parsed.ipWhitelist = (parsed.ipWhitelist || []).map((item) => ({
        ...item,
        supplierId: item.supplierId || '',
        remark: item.remark || '',
        status: (item.status === 'disabled' ? 'disabled' : 'enabled') as Status,
        createdAt: item.createdAt || nowText(),
      }))
      const savedTpls = Array.isArray(parsed.fieldTemplates) ? parsed.fieldTemplates : []
      const customTpls = savedTpls.filter((t) => t.type === 'custom')
      const systemFromSaved = savedTpls.filter((t) => t.type === 'system')
      parsed.fieldTemplates = [
        ...builtinFieldTemplates.map((b) => {
          const hit = systemFromSaved.find((s) => s.id === b.id)
          return hit
            ? { ...b, ...hit, type: 'system' as const, fieldIds: b.fieldIds, fieldMaps: hit.fieldMaps || b.fieldMaps || [] }
            : { ...b, fieldMaps: b.fieldMaps || [] }
        }),
        ...customTpls.map((t) => ({
          ...t,
          type: 'custom' as const,
          fieldIds: Array.isArray(t.fieldIds) ? t.fieldIds : [],
          fieldMaps: Array.isArray(t.fieldMaps) ? t.fieldMaps : [],
          desc: t.desc || '',
          updatedAt: t.updatedAt || '2026-09-08 10:00:00',
        })),
      ]
      return parsed
    }
  } catch {
    /* ignore */
  }
  return clone(seed)
}

let state = loadState()

function nowText() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function save() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  syncEnabledBridge()
}

function findMeta(id: string) {
  return state.metadata.find((m) => m.id === id) || null
}
function findScheme(id: string) {
  return state.schemes.find((s) => s.id === id) || null
}

function supplierNameMap() {
  const map: Record<string, string> = {}
  state.suppliers.forEach((s) => {
    map[s.id] = s.name
  })
  return map
}

function orgName(id?: string) {
  if (!id) return ''
  return state.orgs.find((o) => o.id === id)?.name || ''
}

function hydrateScheme(scheme: Scheme | null) {
  if (!scheme) return null
  const type = (scheme.dataSourceType || 'table') as DataSourceType
  const jdbcDbType = scheme.jdbcDbType || 'mysql'
  const enriched = {
    ...scheme,
    dataSourceType: type,
    dataSourceTypeLabel: dataSourceTypeLabels[type] || type,
    jdbcDbType,
    jdbcDbTypeLabel: jdbcDbTypeLabels[jdbcDbType] || jdbcDbType,
    jdbcHost: scheme.jdbcHost || '',
    jdbcPort: scheme.jdbcPort || '',
    jdbcDatabase: scheme.jdbcDatabase || '',
    jdbcSchema: scheme.jdbcSchema || '',
    jdbcUsername: scheme.jdbcUsername || '',
    jdbcPassword: scheme.jdbcPassword || '',
    jdbcUrlPreview: buildJdbcUrlPreview(scheme),
    frequencyLabel: frequencyLabels[scheme.frequency] || scheme.frequency,
    updateModeLabel: updateModeLabels[scheme.updateMode] || scheme.updateMode,
    requireIpWhitelist: !!scheme.requireIpWhitelist,
    // 桥接兼容：供 V8 旧字段读取
    frontHost: scheme.jdbcHost || scheme.frontHost || '',
    frontPort: scheme.jdbcPort || scheme.frontPort || '',
    protocol: jdbcDbTypeLabels[jdbcDbType] || jdbcDbType,
    path: scheme.jdbcDatabase || scheme.path || '',
  }
  return enriched
}

function hydrateStandard(item: Standard | null): Standard | null {
  if (!item) return null
  const fieldIds = item.fieldIds?.length ? item.fieldIds : item.metadataId ? [item.metadataId] : []
  const fields = fieldIds.map((id) => findMeta(id)).filter(Boolean).map((f) => {
    const map = (item.fieldMaps || []).find((m) => m.fieldId === f!.id)
    return {
      ...f!,
      bizCaliber: f!.description || f!.bizCaliber,
      supplierFieldName: map?.supplierFieldName || f!.name,
      supplierDataType: map?.supplierDataType || f!.dataType,
    }
  }) as (Metadata & { supplierFieldName?: string; supplierDataType?: string })[]
  const fieldMaps = normalizeFieldMaps(fieldIds, item.fieldMaps, (id) => {
    const m = findMeta(id)
    return m ? { name: m.name, dataType: m.dataType } : null
  })
  const apiAccess = normalizeApiAccess(item.apiAccess)
  const mqAccess = normalizeMqAccess(item.mqAccess)
  const fileAccess = normalizeFileAccess(item.fileAccess)
  const accessMethod = (item.accessMethod || 'http_post') as AccessMethodType
  const scheme = item.schemeId ? hydrateScheme(findScheme(item.schemeId)) : null
  const primary = fields[0] || null
  const boundOrg = item.orgId ? state.orgs.find((o) => o.id === item.orgId) : null
  const boundOrgName = orgName(item.orgId)
  const boundSupplierName = item.supplierId ? supplierNameMap()[item.supplierId] || item.supplierName || '' : ''
  if (!item.opLogs?.length) {
    item.opLogs = ensureSchemeOpLogs(undefined, {
      kind: 'access',
      status: item.status === 'disabled' ? 'disabled' : 'enabled',
      createdAt: item.uploadedAt,
      updatedAt: item.updatedAt || item.uploadedAt,
      creator: item.uploader || '平台运营',
    })
  }
  const apiDocMarkdown = buildApiDocMarkdown({
    name: stripParenInName(item.name),
    scope: 'org',
    orgName: boundOrgName,
    requireIpWhitelist: !!item.requireIpWhitelist,
    remark: item.remark || '',
    fields,
    api: apiAccess,
    accessMethod,
    mq: mqAccess,
    file: fileAccess,
  })
  return {
    ...item,
    name: stripParenInName(item.name),
    schemeNo: Number(item.schemeNo) || 0,
    scope: 'org',
    fieldIds,
    fieldMaps,
    metadataId: item.metadataId || fieldIds[0] || '',
    metadataName: fields.map((f) => f.name).join('、') || '—',
    fieldNames: fields.map((f) => f.name).join('、') || '—',
    fieldSummary: fields.map((f) => f.name).join('、') || '—',
    schemeName: accessMethodLabel(accessMethod),
    orgName: boundOrgName,
    orgStatUnit: boundOrg?.statUnit || '',
    orgSalesName: boundOrg?.salesName || '',
    supplierId: item.supplierId || '',
    supplierName: boundSupplierName,
    type: 'API',
    publishedAt: item.uploadedAt,
    updatedAt: item.updatedAt || item.uploadedAt,
    requireIpWhitelist: !!item.requireIpWhitelist,
    remark: item.remark || '',
    accessMethod,
    apiAccess,
    mqAccess,
    fileAccess,
    apiDocMarkdown,
    fileName: `${stripParenInName(item.name)}-接口文档.pdf`,
    accessStats: normalizeAccessStats(item.accessStats),
    lastAccessAt: item.lastAccessAt || '',
    accessActiveDaysW1: Number(item.accessActiveDaysW1) || 0,
    fields,
    metadata: primary,
    scheme,
    opLogs: item.opLogs || [],
  }
}

function resolveOrgStandardIds(org?: Org | null): string[] {
  if (!org) return []
  if (Array.isArray(org.standardIds) && org.standardIds.length) return org.standardIds
  return org.standardId ? [org.standardId] : []
}

function resolveEffectiveList(orgId: string): Standard[] {
  const org = state.orgs.find((o) => o.id === orgId)
  const boundIds = resolveOrgStandardIds(org)
  const bound = boundIds
    .map((id) => state.standards.find((s) => s.id === id && s.status === 'enabled'))
    .filter(Boolean)
    .map((s) => hydrateStandard(s!)!)
  if (bound.length) return bound
  const orgEnabled = state.standards.filter((s) => s.status === 'enabled' && s.orgId === orgId)
  return orgEnabled.map((s) => hydrateStandard(s)!)
}

function resolveEffective(orgId: string): Standard | null {
  return resolveEffectiveList(orgId)[0] || null
}

/** 机构生效标准列表（可多个） */
export function getEffectiveStandards(orgId: string) {
  return resolveEffectiveList(orgId)
}

/** 机构生效标准：有启用机构标准用机构，否则用启用全局 */
export function getEffectiveStandard(orgId: string) {
  return resolveEffective(orgId)
}

function syncEnabledBridge() {
  const list = resolveEffectiveList(DEMO_ORG_ID)
  localStorage.setItem(BRIDGE_LIST_KEY, JSON.stringify(list))
  localStorage.setItem(BRIDGE_KEY, JSON.stringify(list[0] || null))
}

function findOrgSupplierConflict(exceptId: string, orgId?: string, supplierId?: string) {
  if (!orgId || !supplierId) return null
  return (
    state.standards.find(
      (s) =>
        s.id !== exceptId &&
        s.status === 'enabled' &&
        s.orgId === orgId &&
        s.supplierId === supplierId,
    ) || null
  )
}

function nextSchemeNo() {
  const max = state.standards.reduce((m, s) => Math.max(m, Number(s.schemeNo) || 0), 10000)
  return max + 1
}

function buildAccessSampleRows(item: Standard, range: AccessVolumeRange, limit: number) {
  const stats = normalizeAccessStats(item.accessStats)
  const previewCap = Math.min(Math.max(stats[range] || 0, 0), 100)
  const fieldIds = item.fieldIds?.length ? item.fieldIds : item.metadataId ? [item.metadataId] : []
  const fields = fieldIds.map((id) => findMeta(id)).filter(Boolean) as Metadata[]
  const showFields = fields.slice(0, 6)
  const columns = showFields.map((f) => ({
    title: f.name,
    dataIndex: f.id,
    ellipsis: true,
    tooltip: true,
  }))
  const list: Record<string, string>[] = []
  const count = Math.min(limit, previewCap)
  for (let i = 0; i < count; i++) {
    const row: Record<string, string> = { _key: `${item.id}-${range}-${i}` }
    showFields.forEach((f, fi) => {
      if (f.id === 'supplier_code') row[f.id] = item.supplierId || 'QB001'
      else if (f.id === 'org_id') row[f.id] = item.orgId || 'ORG_001'
      else if (f.dataType === 'Int') row[f.id] = String(10 + i * 3 + fi)
      else row[f.id] = `${f.name}_${i + 1}`
    })
    list.push(row)
  }
  return { total: stats[range] || 0, columns, list }
}

export function paginate<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total: list.length }
}

export const mtMock = {
  nowText,
  paginate,
  DEMO_ORG_ID,
  getSuppliers: () => state.suppliers.slice(),
  enabledSuppliers: () => state.suppliers.filter((s) => s.status === 'enabled'),
  nameExists: (name: string, exceptId?: string) =>
    state.suppliers.some((s) => s.name === name.trim() && s.id !== exceptId),
  codeExists: (code: string, exceptId?: string) =>
    state.suppliers.some((s) => s.code === code.trim() && s.id !== exceptId),
  isReferenced: (id: string) => state.orgs.some((org) => org.supplierIds.includes(id)),
  createSupplier(payload: { name: string; code: string; status: Status }) {
    const item: Supplier = {
      id: 's' + Date.now(),
      name: payload.name.trim(),
      code: payload.code.trim(),
      status: payload.status,
      appkey: genAppkey(payload.code.trim()),
      updatedAt: nowText(),
    }
    state.suppliers.unshift(item)
    save()
    return item
  },
  updateSupplier(id: string, payload: { name: string; code: string; status: Status }) {
    const item = state.suppliers.find((s) => s.id === id)
    if (!item) return null
    Object.assign(item, {
      name: payload.name.trim(),
      code: payload.code.trim(),
      status: payload.status,
      updatedAt: nowText(),
    })
    save()
    return item
  },
  setSupplierStatus(id: string, status: Status) {
    const item = state.suppliers.find((s) => s.id === id)
    if (!item) return null
    item.status = status
    item.updatedAt = nowText()
    save()
    return item
  },
  rotateAppkey(id: string) {
    const item = state.suppliers.find((s) => s.id === id)
    if (!item) return null
    item.appkey = genAppkey(item.code)
    item.updatedAt = nowText()
    save()
    return item
  },
  removeSupplier(id: string) {
    if (mtMock.isReferenced(id)) return { ok: false, reason: 'referenced' }
    const before = state.suppliers.length
    state.suppliers = state.suppliers.filter((s) => s.id !== id)
    save()
    return { ok: state.suppliers.length < before }
  },
  getOrgs() {
    const names = supplierNameMap()
    return state.orgs.map((org) => {
      const standardIds = resolveOrgStandardIds(org)
      const standards = standardIds
        .map((id) => state.standards.find((s) => s.id === id))
        .filter(Boolean)
      return {
        ...org,
        standardIds,
        standardId: standardIds[0] || '',
        supplierNames: org.supplierIds.map((id) => names[id]).filter(Boolean),
        standardName: standards.map((s) => s!.name).join('、') || '',
        standardNames: standards.map((s) => s!.name),
      }
    })
  },
  /** 列表按「接入方案 × 供数方」展开（同一方案 3 个供数方 → 3 行） */
  getOrgBindings(): OrgBindingRow[] {
    const rows: OrgBindingRow[] = []
    for (const org of this.getOrgs()) {
      const standardIds = resolveOrgStandardIds(org)
      const supplierIds = org.supplierIds || []
      if (!standardIds.length || !supplierIds.length) continue
      for (const standardId of standardIds) {
        const st = state.standards.find((s) => s.id === standardId)
        for (const supplierId of supplierIds) {
          const sp = state.suppliers.find((s) => s.id === supplierId)
          rows.push({
            id: `${org.id}__${standardId}__${supplierId}`,
            orgId: org.id,
            orgName: org.name,
            orgCode: org.code || '',
            orgStatUnit: org.statUnit || '',
            orgSalesName: org.salesName || '',
            status: org.status,
            standardId,
            standardName: st?.name || '—',
            supplierId,
            supplierName: sp?.name || '—',
            remark: org.remark || '',
            orgStandardIds: standardIds.slice(),
            orgSupplierIds: supplierIds.slice(),
          })
        }
      }
    }
    return rows
  },
  getOrgCatalog: () => state.orgCatalog.slice(),
  /** 尚未配置机构供数的主数据（新增下拉用） */
  availableOrgCatalog(exceptOrgId?: string) {
    const usedCodes = new Set(
      state.orgs.filter((o) => o.id !== exceptOrgId).map((o) => (o.code || '').trim()).filter(Boolean),
    )
    return state.orgCatalog.filter((c) => !usedCodes.has(c.code.trim()))
  },
  getSupplyFilterOptions() {
    return {
      orgs: this.getOrgs().map((o) => ({ label: o.name, value: o.id })),
      standards: state.standards.map((s) => ({ label: s.name, value: s.id })),
      suppliers: state.suppliers.map((s) => ({ label: s.name, value: s.id })),
    }
  },
  /** 组合明细（支持三维多选交叉筛选 + 时间跨度） */
  getSupplyDetailRows(filter: SupplyStatsFilter = {}): SupplyStatsRow[] {
    const hash = (s: string) => {
      let h = 0
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
      return h
    }
    const orgSet = filter.orgIds?.length ? new Set(filter.orgIds) : null
    const stSet = filter.standardIds?.length ? new Set(filter.standardIds) : null
    const spSet = filter.supplierIds?.length ? new Set(filter.supplierIds) : null
    const range: SupplyTimeRange = filter.timeRange || 'today'
    const scale = TIME_RANGE_SCALE[range]

    let bindings = this.getOrgBindings()
    if (orgSet) bindings = bindings.filter((b) => orgSet.has(b.orgId))
    if (stSet) bindings = bindings.filter((b) => stSet.has(b.standardId))
    if (spSet) bindings = bindings.filter((b) => spSet.has(b.supplierId))

    return bindings.map((b) => {
      const h = hash(b.id + range)
      const inboundCount = Math.max(1, Math.round((1200 + (h % 18000)) * scale))
      // 堆积为当前瞬时值，不随时间跨度缩放
      const backlogCount = 40 + (h % 900)
      return {
        id: b.id,
        orgId: b.orgId,
        orgName: b.orgName,
        orgStatUnit: b.orgStatUnit || '',
        orgSalesName: b.orgSalesName || '',
        standardId: b.standardId,
        standardName: b.standardName,
        supplierId: b.supplierId,
        supplierName: b.supplierName,
        inboundCount,
        backlogCount,
        lastInboundAt: nowText(),
      }
    })
  },
  /** 总量 + 按机构/方案/供数方分类汇总 + 组合明细 */
  getSupplyStats(filter: SupplyStatsFilter = {}): SupplyStatsOverview {
    const details = this.getSupplyDetailRows(filter)
    const sumBy = (key: 'orgId' | 'standardId' | 'supplierId', nameKey: 'orgName' | 'standardName' | 'supplierName') => {
      const map = new Map<string, SupplyDimRow>()
      for (const row of details) {
        const id = row[key]
        const hit = map.get(id)
        if (hit) {
          hit.inboundCount += row.inboundCount
          hit.backlogCount += row.backlogCount
        } else {
          map.set(id, {
            id,
            name: row[nameKey],
            inboundCount: row.inboundCount,
            backlogCount: row.backlogCount,
          })
        }
      }
      return [...map.values()].sort((a, b) => b.inboundCount - a.inboundCount)
    }
    const totalInbound = details.reduce((s, r) => s + r.inboundCount, 0)
    const totalBacklog = details.reduce((s, r) => s + r.backlogCount, 0)
    return {
      totalInbound,
      totalBacklog,
      byOrg: sumBy('orgId', 'orgName'),
      byStandard: sumBy('standardId', 'standardName'),
      bySupplier: sumBy('supplierId', 'supplierName'),
      details: details.slice().sort((a, b) => b.inboundCount - a.inboundCount),
    }
  },
  /** 按时间跨度生成聚合趋势：仅「接入量」「堆积量」两条线 */
  getSupplyTrend(filter: SupplyStatsFilter = {}): SupplyAggregateTrend {
    const details = this.getSupplyDetailRows(filter)
    const totalInbound = details.reduce((s, r) => s + r.inboundCount, 0) || 1
    const totalBacklog = details.reduce((s, r) => s + r.backlogCount, 0) || 1
    const range: SupplyTimeRange = filter.timeRange || 'today'
    const today = new Date()
    const dates: string[] = []
    const inbound: number[] = []
    const backlog: number[] = []

    const pushPoint = (label: string, idx: number, pointCount: number, baseIn: number, baseBack: number) => {
      const wave = Math.sin(idx / 2.4) * 0.16 + 1
      const drift = 1 + (idx / Math.max(1, pointCount - 1)) * 0.12
      dates.push(label)
      inbound.push(Math.max(1, Math.round(baseIn * wave * drift)))
      backlog.push(Math.max(0, Math.round(baseBack * (1.15 - Math.sin((idx + 1) / 3.2) * 0.28))))
    }

    if (range === 'today') {
      const hourNow = Math.max(1, today.getHours() || 1)
      const baseIn = Math.max(2, Math.round(totalInbound / hourNow))
      const baseBack = Math.max(1, Math.round(totalBacklog / hourNow))
      for (let h = 0; h <= hourNow; h++) {
        pushPoint(`${String(h).padStart(2, '0')}:00`, h, hourNow + 1, baseIn, baseBack)
      }
    } else if (range === '3d') {
      const baseIn = Math.max(4, Math.round(totalInbound / 3))
      const baseBack = Math.max(1, Math.round(totalBacklog / 3))
      for (let i = 2; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        pushPoint(`${m}-${day}`, 2 - i, 3, baseIn, baseBack)
      }
    } else if (range === '1w') {
      const baseIn = Math.max(8, Math.round(totalInbound / 7))
      const baseBack = Math.max(2, Math.round(totalBacklog / 7))
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        pushPoint(`${m}-${day}`, 6 - i, 7, baseIn, baseBack)
      }
    } else {
      const baseIn = Math.max(8, Math.round(totalInbound / 30))
      const baseBack = Math.max(2, Math.round(totalBacklog / 30))
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        pushPoint(`${m}-${day}`, 29 - i, 30, baseIn, baseBack)
      }
    }
    return { dates, inbound, backlog }
  },
  orgOptions: () => state.orgs.map((o) => ({ label: `${o.name}（${o.code}）`, value: o.id })),
  orgNameExists: (name: string, exceptId?: string) =>
    state.orgs.some((o) => o.name === name.trim() && o.id !== exceptId),
  orgCodeExists: (code: string, exceptId?: string) =>
    state.orgs.some((o) => (o.code || '').trim() === code.trim() && o.id !== exceptId),
  saveOrgConfig(
    orgId: string,
    payload: {
      supplierIds: string[]
      standardId?: string
      standardIds?: string[]
      code?: string
      name?: string
      remark?: string
    },
  ) {
    const org = state.orgs.find((o) => o.id === orgId)
    if (!org) return null
    if (payload.code !== undefined) {
      const code = payload.code.trim()
      if (!code) return { ok: false as const, reason: 'code' as const }
      if (this.orgCodeExists(code, orgId)) return { ok: false as const, reason: 'dupCode' as const }
      org.code = code
    }
    org.supplierIds = (payload.supplierIds || []).slice()
    const standardIds =
      payload.standardIds?.length
        ? payload.standardIds.slice()
        : payload.standardId
          ? [payload.standardId]
          : []
    org.standardIds = standardIds
    org.standardId = standardIds[0] || ''
    if (payload.remark !== undefined) org.remark = String(payload.remark || '').trim()
    save()
    return { ok: true as const, item: org }
  },
  /** @deprecated 兼容旧调用 */
  saveOrgSuppliers(orgId: string, supplierIds: string[]) {
    return this.saveOrgConfig(orgId, { supplierIds })
  },
  createOrg(payload: {
    name: string
    code: string
    supplierIds: string[]
    standardId?: string
    standardIds?: string[]
    remark?: string
    status?: Status
    statUnit?: string
    salesName?: string
    fullName?: string
    creditCode?: string
    region?: string
    openVersion?: OrgOpenVersion
    authStatus?: OrgAuthStatus
    expireAt?: string
  }) {
    const name = payload.name.trim()
    const code = payload.code.trim()
    if (!name) return { ok: false as const, reason: 'name' }
    if (!code) return { ok: false as const, reason: 'code' }
    if (this.orgNameExists(name)) return { ok: false as const, reason: 'dup' }
    if (this.orgCodeExists(code)) return { ok: false as const, reason: 'dupCode' }
    const standardIds =
      payload.standardIds?.length
        ? payload.standardIds.slice()
        : payload.standardId
          ? [payload.standardId]
          : []
    const item = orgRecord({
      id: 'o' + Date.now(),
      name,
      code,
      status: payload.status,
      supplierIds: (payload.supplierIds || []).slice(),
      standardIds,
      remark: String(payload.remark || '').trim(),
      statUnit: payload.statUnit,
      salesName: payload.salesName,
      fullName: payload.fullName,
      creditCode: payload.creditCode,
      region: payload.region,
      openVersion: payload.openVersion,
      authStatus: payload.authStatus || 'running',
      expireAt: payload.expireAt,
    })
    state.orgs.unshift(item)
    save()
    return { ok: true as const, item }
  },
  setOrgStatus(id: string, status: Status) {
    const item = state.orgs.find((o) => o.id === id)
    if (!item) return null
    item.status = status
    save()
    return item
  },
  enabledStandardOptions() {
    return state.standards
      .filter((s) => s.status === 'enabled')
      .map((s) => ({
        label: `${s.name}${s.scope === 'org' ? '（机构）' : '（全局）'}`,
        value: s.id,
      }))
  },
  getMetadata: () => state.metadata.slice(),
  /** 引用指定字段的接入方案列表 */
  listStandardsByFieldId(fieldId: string) {
    return state.standards
      .filter((s) => (s.fieldIds || []).includes(fieldId) || s.metadataId === fieldId)
      .map((s) => hydrateStandard(s)!)
      .filter(Boolean)
  },
  /** 字段被接入方案引用次数 */
  countStandardsByFieldId(fieldId: string) {
    return state.standards.filter(
      (s) => (s.fieldIds || []).includes(fieldId) || s.metadataId === fieldId,
    ).length
  },
  /** 带引用计数的字段列表 */
  getMetadataWithRefCount() {
    return state.metadata.map((m) => ({
      ...m,
      refSchemeCount: this.countStandardsByFieldId(m.id),
    }))
  },
  enabledMetadata: () => state.metadata.filter((m) => m.status === 'enabled'),
  findMetadata: (id: string) => findMeta(id),
  metadataNameExists: (name: string, exceptId?: string) =>
    state.metadata.some((m) => m.name === name.trim() && m.id !== exceptId),
  metadataCodeExists: (code: string, exceptId?: string) =>
    state.metadata.some((m) => m.code === code.trim() && m.id !== exceptId),
  saveMetadata(payload: Partial<Metadata> & { name: string; description: string; dataType: string }) {
    const now = nowText()
    const name = payload.name.trim()
    const description = payload.description.trim()
    const normalized: Partial<Metadata> = {
      ...payload,
      name,
      code: name,
      description,
      bizCaliber: description,
      dataType: payload.dataType.trim(),
      length: payload.length?.trim() || '',
      defaultValue: payload.defaultValue?.trim() || '',
      bizCategory: payload.bizCategory || '',
      remark: payload.remark?.trim() || '',
      required: payload.required ?? null,
    }
    if (payload.id) {
      const item = findMeta(payload.id)
      if (!item) return null
      Object.assign(item, normalized, { updatedAt: now })
      save()
      syncEnabledBridge()
      return item
    }
    const item = {
      ...normalized,
      id: name || 'm' + Date.now(),
      status: (payload.status || 'enabled') as Status,
      updatedAt: now,
    } as Metadata
    state.metadata.unshift(item)
    save()
    syncEnabledBridge()
    return item
  },
  setMetadataStatus(id: string, status: Status) {
    const item = findMeta(id)
    if (!item) return null
    item.status = status
    item.updatedAt = nowText()
    save()
    return item
  },
  removeMetadata(id: string) {
    if (state.standards.some((s) => (s.fieldIds || []).includes(id) || s.metadataId === id)) {
      return { ok: false, reason: 'referenced' }
    }
    const before = state.metadata.length
    state.metadata = state.metadata.filter((m) => m.id !== id)
    save()
    return { ok: state.metadata.length < before }
  },
  getFieldTemplates() {
    if (!state.fieldTemplates?.length) {
      state.fieldTemplates = JSON.parse(JSON.stringify(builtinFieldTemplates)) as FieldTemplate[]
    }
    return state.fieldTemplates.map((t) => ({
      ...t,
      fieldIds: [...(t.fieldIds || [])],
      fieldMaps: normalizeFieldMaps(t.fieldIds || [], t.fieldMaps, (id) => {
        const m = findMeta(id)
        return m ? { name: m.name, dataType: m.dataType } : null
      }),
      fieldCount: (t.fieldIds || []).length,
      typeLabel: t.type === 'system' ? '系统内置' : '用户自定义',
      fieldNames: (t.fieldIds || [])
        .map((id) => findMeta(id)?.name || id)
        .join('、'),
    }))
  },
  findFieldTemplate(id: string) {
    return state.fieldTemplates.find((t) => t.id === id) || null
  },
  fieldTemplateNameExists(name: string, exceptId?: string) {
    return state.fieldTemplates.some((t) => t.name.trim() === name.trim() && t.id !== exceptId)
  },
  /** 是否已存在相同字段集合的模板 */
  fieldTemplateSetExists(fieldIds: string[], exceptId?: string) {
    const ids = [...new Set(fieldIds.filter(Boolean))]
    return state.fieldTemplates.some(
      (t) => t.id !== exceptId && sameFieldIdSet(t.fieldIds || [], ids),
    )
  },
  saveFieldTemplate(payload: {
    id?: string
    name: string
    desc?: string
    fieldIds: string[]
    fieldMaps?: FieldMapItem[]
    type?: FieldTemplateType
  }) {
    const name = payload.name.trim()
    const desc = String(payload.desc || '').trim()
    const fieldIds = [...new Set((payload.fieldIds || []).filter(Boolean))]
    if (!name) return { ok: false as const, reason: 'name' }
    if (!fieldIds.length) return { ok: false as const, reason: 'fields' }
    if (this.fieldTemplateNameExists(name, payload.id)) return { ok: false as const, reason: 'dupName' }
    if (this.fieldTemplateSetExists(fieldIds, payload.id)) return { ok: false as const, reason: 'dupSet' }
    const fieldMaps = normalizeFieldMaps(fieldIds, payload.fieldMaps, (id) => {
      const m = findMeta(id)
      return m ? { name: m.name, dataType: m.dataType } : null
    })
    const now = nowText()
    if (payload.id) {
      const item = state.fieldTemplates.find((t) => t.id === payload.id)
      if (!item) return { ok: false as const, reason: 'missing' }
      if (item.type === 'system') return { ok: false as const, reason: 'system' }
      item.name = name
      item.desc = desc
      item.fieldIds = fieldIds
      item.fieldMaps = fieldMaps
      item.updatedAt = now
      save()
      return { ok: true as const, item: { ...item } }
    }
    const item: FieldTemplate = {
      id: `tpl_c_${Date.now()}`,
      name,
      desc,
      fieldIds,
      fieldMaps,
      type: 'custom',
      updatedAt: now,
    }
    state.fieldTemplates.push(item)
    save()
    return { ok: true as const, item: { ...item } }
  },
  removeFieldTemplate(id: string) {
    const item = state.fieldTemplates.find((t) => t.id === id)
    if (!item) return { ok: false as const, reason: 'missing' }
    if (item.type === 'system') return { ok: false as const, reason: 'system' }
    state.fieldTemplates = state.fieldTemplates.filter((t) => t.id !== id)
    save()
    return { ok: true as const }
  },
  getSchemes() {
    return state.schemes.map((s) => hydrateScheme(s)!)
  },
  enabledSchemes() {
    return this.getSchemes().filter((s) => s.status === 'enabled')
  },
  findScheme(id: string) {
    return hydrateScheme(findScheme(id))
  },
  schemeNameExists: (name: string, exceptId?: string) =>
    state.schemes.some((s) => s.name === name.trim() && s.id !== exceptId),
  saveScheme(payload: Partial<Scheme> & { name: string }) {
    const now = nowText()
    const dataSourceType = (payload.dataSourceType || 'table') as DataSourceType
    const jdbcDbType = payload.jdbcDbType || 'mysql'
    const fields = {
      name: payload.name.trim(),
      dataSourceType,
      supplierId: '',
      jdbcDbType,
      jdbcHost: String(payload.jdbcHost || '').trim(),
      jdbcPort: String(payload.jdbcPort || jdbcDefaultPorts[jdbcDbType] || '').trim(),
      jdbcDatabase: String(payload.jdbcDatabase || '').trim(),
      jdbcSchema: String(payload.jdbcSchema || '').trim(),
      jdbcUsername: String(payload.jdbcUsername || '').trim(),
      jdbcPassword: String(payload.jdbcPassword || '').trim(),
      frequency: payload.frequency || 'daily',
      updateMode: payload.updateMode || 'incremental',
      incrementField: String(payload.incrementField || '').trim(),
      retry: Number(payload.retry) || 0,
      requireIpWhitelist: !!payload.requireIpWhitelist,
      remark: String(payload.remark || '').trim(),
      status: (payload.status || 'enabled') as Status,
      updatedAt: now,
    }
    if (payload.id) {
      const item = findScheme(payload.id)
      if (!item) return null
      Object.assign(item, fields)
      save()
      syncEnabledBridge()
      return item
    }
    const item = { id: 'p' + Date.now(), ...fields } as Scheme
    state.schemes.unshift(item)
    save()
    syncEnabledBridge()
    return item
  },
  setSchemeStatus(id: string, status: Status) {
    const item = findScheme(id)
    if (!item) return null
    item.status = status
    item.updatedAt = nowText()
    save()
    return item
  },
  removeScheme(id: string) {
    if (state.standards.some((s) => s.schemeId === id)) return { ok: false, reason: 'referenced' }
    const before = state.schemes.length
    state.schemes = state.schemes.filter((s) => s.id !== id)
    save()
    return { ok: state.schemes.length < before }
  },
  getStandards: () => state.standards.map((s) => hydrateStandard(s)!),
  findStandard: (id: string) => hydrateStandard(state.standards.find((s) => s.id === id) || null),
  getEffectiveStandard: (orgId = DEMO_ORG_ID) => resolveEffective(orgId),
  getEffectiveStandards: (orgId = DEMO_ORG_ID) => resolveEffectiveList(orgId),
  standardNameExists: (name: string, exceptId?: string) => {
    const n = stripParenInName(name)
    if (!n) return false
    return state.standards.some((s) => stripParenInName(s.name) === n && s.id !== exceptId)
  },
  /** 接口地址全局唯一性校验（与所有接入方案的完整 endpointUrl 比对） */
  endpointUrlExists: (url: string, exceptId?: string) => {
    const u = (url || '').trim().replace(/\/$/, '')
    if (!u) return false
    return state.standards.some((s) => {
      if (s.id === exceptId) return false
      const api = normalizeApiAccess(s.apiAccess)
      const cur = (api.endpointUrl || '').trim().replace(/\/$/, '')
      return cur === u
    })
  },
  saveStandard(
    payload: Partial<Standard> & {
      name: string
      fieldIds?: string[]
      fieldMaps?: FieldMapItem[]
      metadataId?: string
      scope?: StandardScope
      apiAccess?: ApiAccessConfig
      accessMethod?: AccessMethodType
      mqAccess?: MqAccessConfig
      fileAccess?: FileAccessConfig
      requireIpWhitelist?: boolean
      remark?: string
    },
  ) {
    const fieldIds = [
      ...new Set(
        (payload.fieldIds?.length ? payload.fieldIds : payload.metadataId ? [payload.metadataId] : []).filter(Boolean),
      ),
    ]
    if (!fieldIds.length) return { ok: false as const, reason: 'meta' }
    const enabledFields = fieldIds.map((id) => findMeta(id)).filter((m) => m && m.status === 'enabled')
    if (enabledFields.length !== fieldIds.length) return { ok: false as const, reason: 'meta' }
    const fieldMaps = normalizeFieldMaps(fieldIds, payload.fieldMaps, (id) => {
      const m = findMeta(id)
      return m ? { name: m.name, dataType: m.dataType } : null
    })
    const accessMethod = (payload.accessMethod || 'http_post') as AccessMethodType
    let apiAccess = syncEndpointParts(normalizeApiAccess(payload.apiAccess))
    if (accessMethod === 'http_post') {
      if (normalizeAuthType(apiAccess.authType) === 'appkey') {
        // 防御性兜底：AppKey 鉴权至少保留一行默认 AppKey Header
        if (!apiAccess.authHeaders?.some((h) => h.name?.trim())) {
          apiAccess.authHeaders = [defaultAccessAppKeyHeader()]
        }
        // 同步首个 AppKey 行到 appKey，供历史凭证/文档逻辑复用
        const appKeyHeader = apiAccess.authHeaders.find(
          (h) => h.enabled !== false && h.name.trim() === 'AppKey' && h.value.trim(),
        )
        apiAccess.appKey = appKeyHeader?.value || apiAccess.authHeaders.find((h) => h.enabled !== false)?.value || ''
        if (!apiAccess.appKey.trim()) apiAccess.appKey = genSchemeAppKey()
      }
    }
    const mqAccess = normalizeMqAccess(payload.mqAccess)
    const fileAccess = normalizeFileAccess(payload.fileAccess)
    if (!isAccessConfigReady(accessMethod, apiAccess, mqAccess, fileAccess)) {
      return { ok: false as const, reason: 'api' }
    }
    const scope: StandardScope = 'org'
    if (!payload.orgId) return { ok: false as const, reason: 'org' }
    if (!payload.supplierId) return { ok: false as const, reason: 'supplier' }
    const now = nowText()
    const name = stripParenInName(payload.name)
    const requireIpWhitelist = !!payload.requireIpWhitelist
    const remark = String(payload.remark || '').trim()
    const metaFields = fieldIds.map((id) => findMeta(id)!).filter(Boolean)
    const apiDocMarkdown = buildApiDocMarkdown({
      name,
      scope,
      orgName: orgName(payload.orgId),
      requireIpWhitelist,
      remark,
      fields: metaFields,
      api: apiAccess,
      accessMethod,
      mq: mqAccess,
      file: fileAccess,
    })
    const fields = {
      name,
      scope,
      orgId: payload.orgId,
      supplierId: payload.supplierId,
      fieldIds,
      fieldMaps,
      metadataId: fieldIds[0],
      schemeId: undefined as string | undefined,
      requireIpWhitelist,
      remark,
      accessMethod,
      apiAccess,
      mqAccess,
      fileAccess,
      apiDocMarkdown,
      fileName: `${name}-接口文档.pdf`,
      fileSize: `${Math.max(4, Math.round(apiDocMarkdown.length / 1024))} KB`,
      fileUrl: '#',
      status: (payload.status || 'enabled') as Status,
      uploader: '平台运营',
      uploadedAt: now,
      updatedAt: now,
    }
    if (fields.status === 'enabled') {
      const conflict = findOrgSupplierConflict(payload.id || '', fields.orgId, fields.supplierId)
      if (conflict) {
        return { ok: false as const, reason: 'conflict' as const, conflictName: conflict.name }
      }
    }
    if (payload.id) {
      const item = state.standards.find((s) => s.id === payload.id)
      if (!item) return { ok: false as const, reason: 'missing' }
      const prevStatus = item.status
      const baseLogs = ensureSchemeOpLogs(item.opLogs, {
        kind: 'access',
        status: prevStatus === 'disabled' ? 'disabled' : 'enabled',
        createdAt: item.uploadedAt,
        updatedAt: item.updatedAt || item.uploadedAt,
        creator: item.uploader || '平台运营',
      })
      const nextLogs = prependOpLog(baseLogs, makeOpLog('update', '修改接入方案配置'))
      let opLogs = nextLogs
      if (fields.status !== prevStatus) {
        opLogs = prependOpLog(
          opLogs,
          makeOpLog(
            fields.status === 'enabled' ? 'enable' : 'disable',
            fields.status === 'enabled' ? '开启接入方案' : '停用接入方案',
          ),
        )
      }
      Object.assign(item, {
        ...fields,
        schemeNo: item.schemeNo || nextSchemeNo(),
        accessStats: normalizeAccessStats(item.accessStats),
        lastAccessAt: item.lastAccessAt || '',
        accessActiveDaysW1: Number(item.accessActiveDaysW1) || 0,
        uploadedAt: item.uploadedAt || now,
        updatedAt: now,
        opLogs,
      })
      save()
      return { ok: true as const, item: hydrateStandard(item)! }
    }
    const item = {
      id: 'st' + Date.now(),
      schemeNo: nextSchemeNo(),
      accessStats: emptyAccessStats(),
      lastAccessAt: '',
      accessActiveDaysW1: 0,
      ...fields,
      opLogs: [
        makeOpLog(
          fields.status === 'enabled' ? 'enable' : 'disable',
          fields.status === 'enabled' ? '开启接入方案' : '停用接入方案',
          { operatedAt: now },
        ),
        makeOpLog('create', '新建接入方案', { operatedAt: now }),
      ],
    } as Standard
    state.standards.unshift(item)
    save()
    return { ok: true as const, item: hydrateStandard(item)! }
  },
  testAccessConnectivity(payload: {
    accessMethod?: AccessMethodType
    apiAccess?: ApiAccessConfig
    mqAccess?: MqAccessConfig
    fileAccess?: FileAccessConfig
  }) {
    const accessMethod = (payload.accessMethod || 'http_post') as AccessMethodType
    const apiAccess = syncEndpointParts(normalizeApiAccess(payload.apiAccess))
    const mqAccess = normalizeMqAccess(payload.mqAccess)
    const fileAccess = normalizeFileAccess(payload.fileAccess)
    const successCode = successCodeOfAccess(accessMethod, apiAccess, mqAccess, fileAccess)
    const ready = isAccessConfigReady(accessMethod, apiAccess, mqAccess, fileAccess)
    const latencyMs = 120 + Math.floor(Math.random() * 280)
    if (!ready) {
      return {
        ok: false as const,
        successCode,
        latencyMs,
        responseText: JSON.stringify(
          {
            code: 'CONN_FAIL',
            message: '连通性测试失败：请先完善必填接入配置后再试',
            accessMethod: accessMethodLabel(accessMethod),
            expectSuccessCode: successCode,
          },
          null,
          2,
        ),
      }
    }
    const target =
      accessMethod === 'mq'
        ? `${mqAccess.mqType}://${(mqAccess.mqType === 'rocketmq' ? mqAccess.nameServer : mqAccess.brokers) || ''}/${mqAccess.topic}`
        : accessMethod === 'file'
          ? `${fileAccess.protocol.toLowerCase()}://${fileAccess.host}:${fileAccess.port}${fileAccess.remoteDir}`
          : buildApiEndpoint(apiAccess)
    return {
      ok: true as const,
      successCode,
      latencyMs,
      responseText: JSON.stringify(
        {
          code: successCode,
          message: '连通性测试成功',
          accessMethod: accessMethodLabel(accessMethod),
          target,
          latencyMs,
          checkedAt: nowText(),
        },
        null,
        2,
      ),
    }
  },
  setStandardStatus(id: string, status: Status) {
    const item = state.standards.find((s) => s.id === id)
    if (!item) return { ok: false as const, reason: 'missing' }
    if (status === 'enabled') {
      const fieldIds = item.fieldIds?.length ? item.fieldIds : [item.metadataId]
      const okFields = fieldIds.every((fid) => {
        const m = findMeta(fid)
        return m && m.status === 'enabled'
      })
      if (!okFields) return { ok: false as const, reason: 'meta' }
      const accessMethod = (item.accessMethod || 'http_post') as AccessMethodType
      const apiAccess = normalizeApiAccess(item.apiAccess)
      const mqAccess = normalizeMqAccess(item.mqAccess)
      const fileAccess = normalizeFileAccess(item.fileAccess)
      if (!isAccessConfigReady(accessMethod, apiAccess, mqAccess, fileAccess)) {
        return { ok: false as const, reason: 'api' }
      }
      const conflict = findOrgSupplierConflict(id, item.orgId, item.supplierId)
      if (conflict) {
        return { ok: false as const, reason: 'conflict' as const, conflictName: conflict.name }
      }
    }
    const prevStatus = item.status
    item.status = status
    item.updatedAt = nowText()
    const baseLogs = ensureSchemeOpLogs(item.opLogs, {
      kind: 'access',
      status: prevStatus === 'disabled' ? 'disabled' : 'enabled',
      createdAt: item.uploadedAt,
      updatedAt: item.updatedAt,
      creator: item.uploader || '平台运营',
    })
    item.opLogs = prependOpLog(
      baseLogs,
      makeOpLog(status === 'enabled' ? 'enable' : 'disable', status === 'enabled' ? '开启接入方案' : '停用接入方案'),
    )
    save()
    return { ok: true as const, item: hydrateStandard(item)! }
  },
  getStandardListKpis() {
    const list = state.standards.map((s) => hydrateStandard(s)!).filter(Boolean)
    const enabled = list.filter((s) => s.status === 'enabled').length
    const disabled = list.filter((s) => s.status === 'disabled').length
    const orgIds = new Set(list.map((s) => s.orgId).filter(Boolean))
    const supplierIds = new Set(list.map((s) => s.supplierId).filter(Boolean))
    const activeList = list.filter((s) => isStandardActive(s))
    const activeOrgIds = new Set(activeList.map((s) => s.orgId).filter(Boolean))
    const activeSupplierIds = new Set(activeList.map((s) => s.supplierId).filter(Boolean))
    return {
      total: list.length,
      enabled,
      disabled,
      orgCount: orgIds.size,
      supplierCount: supplierIds.size,
      activeSchemeCount: activeList.length,
      activeOrgCount: activeOrgIds.size,
      activeSupplierCount: activeSupplierIds.size,
    }
  },
  listAccessVolumePreview(standardId: string, range: AccessVolumeRange, page = 1, pageSize = 20) {
    const raw = state.standards.find((s) => s.id === standardId)
    const item = hydrateStandard(raw || null)
    if (!item) {
      return { total: 0, columns: [] as { title: string; dataIndex: string }[], list: [] as Record<string, string>[], page, pageSize }
    }
    const built = buildAccessSampleRows(item, range, 100)
    const start = (page - 1) * pageSize
    return {
      total: built.total,
      columns: built.columns,
      list: built.list.slice(start, start + pageSize),
      page,
      pageSize,
    }
  },
  removeStandard(id: string) {
    const item = state.standards.find((s) => s.id === id)
    if (!item) return { ok: false, reason: 'not_found' as const }
    if (item.status === 'enabled') return { ok: false, reason: 'enabled' as const }
    const before = state.standards.length
    state.standards = state.standards.filter((s) => s.id !== id)
    save()
    return { ok: state.standards.length < before }
  },
  getIpWhitelist() {
    return state.ipWhitelist.map((item) => ({
      ...item,
      supplierId: item.supplierId || '',
      supplierName: item.supplierId
        ? state.suppliers.find((s) => s.id === item.supplierId)?.name || item.supplierName || '—'
        : item.supplierName || '—',
      status: (item.status === 'disabled' ? 'disabled' : 'enabled') as Status,
    }))
  },
  /** 仅启用状态白名单（接入校验用） */
  getEnabledIpWhitelist(supplierId?: string) {
    return this.getIpWhitelist().filter((item) => {
      if (item.status !== 'enabled') return false
      if (supplierId && item.supplierId !== supplierId) return false
      return true
    })
  },
  /** 校验来源 IP 是否在启用白名单中 */
  isSourceIpAllowed(ip: string, supplierId?: string) {
    const value = (ip || '').trim()
    if (!value) return false
    return this.getEnabledIpWhitelist(supplierId).some((item) => item.ip === value)
  },
  addIpWhitelist(ip: string, remark = '', supplierId = '', status: Status = 'enabled') {
    const value = ip.trim()
    if (!value) return { ok: false as const, reason: 'empty' as const }
    if (state.ipWhitelist.some((i) => i.ip === value)) return { ok: false as const, reason: 'dup' as const }
    const supplier = supplierId ? state.suppliers.find((s) => s.id === supplierId) : undefined
    const item: IpWhitelistItem = {
      id: 'ip' + Date.now() + Math.random().toString(36).slice(2, 6),
      ip: value,
      supplierId: supplierId || '',
      supplierName: supplier?.name,
      remark: remark.trim(),
      status: status === 'disabled' ? 'disabled' : 'enabled',
      createdAt: nowText(),
    }
    state.ipWhitelist.unshift(item)
    save()
    return { ok: true as const, item }
  },
  /** 按厂商批量添加；返回成功数与失败明细 */
  addIpWhitelistBatch(payload: { supplierId: string; ips: string[]; remark?: string; status?: Status }) {
    const supplier = state.suppliers.find((s) => s.id === payload.supplierId)
    if (!supplier) return { ok: false as const, reason: 'supplier' as const }
    const remark = (payload.remark || '').trim()
    const status: Status = payload.status === 'disabled' ? 'disabled' : 'enabled'
    const added: IpWhitelistItem[] = []
    const skipped: { ip: string; reason: string }[] = []
    const ipv4 =
      /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/
    const seen = new Set<string>()
    payload.ips.forEach((raw) => {
      const ip = raw.trim()
      if (!ip) return
      if (!ipv4.test(ip)) {
        skipped.push({ ip, reason: '格式无效' })
        return
      }
      if (seen.has(ip) || state.ipWhitelist.some((i) => i.ip === ip)) {
        skipped.push({ ip, reason: '已存在' })
        return
      }
      seen.add(ip)
      const item: IpWhitelistItem = {
        id: 'ip' + Date.now() + Math.random().toString(36).slice(2, 8),
        ip,
        supplierId: supplier.id,
        supplierName: supplier.name,
        remark,
        status,
        createdAt: nowText(),
      }
      state.ipWhitelist.unshift(item)
      added.push(item)
    })
    if (added.length) save()
    return { ok: true as const, added, skipped, supplierName: supplier.name }
  },
  toggleIpWhitelist(id: string, status: Status) {
    const item = state.ipWhitelist.find((i) => i.id === id)
    if (!item) return { ok: false as const }
    item.status = status === 'disabled' ? 'disabled' : 'enabled'
    save()
    return { ok: true as const, item: { ...item } }
  },
  removeIpWhitelist(id: string) {
    const before = state.ipWhitelist.length
    state.ipWhitelist = state.ipWhitelist.filter((i) => i.id !== id)
    save()
    return { ok: state.ipWhitelist.length < before }
  },
}

syncEnabledBridge()

export function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
