/* ============================================================
 * V8 机构端扩展数据层
 * 类型 / 枚举 / Mock 数据，统一供方数据范围过滤（supplierScope）。
 * 全模块仅含舆情条目的「索引字段」，无正文 content。
 * ============================================================ */

// ── 会话与权限 ───────────────────────────────────────────────
export type V8Role = 'admin' | 'duty' | 'readonly'
export type AccountStatus = 'enabled' | 'disabled'

/** 菜单权限点（与路由 meta.menuKey 对应，顺序即导航顺序） */
export const MENU_KEYS = [
  'overview',
  'dataCheck',
  'suppliers',
  'monitor',
  'pushback',
  'message',
  'spec',
  'organization',
  'permissions',
  'settings',
] as const
export type MenuKey = (typeof MENU_KEYS)[number]

export interface V8UserInfo {
  id: string
  /** 微信关联账号（脱敏展示） */
  userName: string
  /** 姓名/昵称（水印用） */
  name: string
  /** 手机后四位（水印用） */
  phoneTail: string
  orgId: string
  orgName: string
  role: V8Role
  /** 菜单权限点；'*' 表示全部 */
  menus: MenuKey[] | '*'
  /** 可见供方；'*' 表示机构全部 */
  supplierScope: string[] | '*'
  status: AccountStatus
}

// ── 概览 ─────────────────────────────────────────────────────
/** 数据概览全局时间范围（all=历时全量） */
export type OverviewRange = 'today' | '3d' | '1w' | '1m' | 'all'

export interface OverviewTrendPoint {
  date: string
  inbound: number
  reject: number
}

/** 接入数据量趋势的横坐标粒度 */
export type TrendGranularity = 'hour' | '12h' | 'day' | 'month'

/** 随时间范围联动的趋势序列（粒度由所选时间范围 / 历时全量下的按天按月切换决定） */
export interface OverviewTrendSeries {
  granularity: TrendGranularity
  points: OverviewTrendPoint[]
}

/** 拒收原因分布项（随全局时间范围） */
export interface OverviewRejectReason {
  reason: RejectReason
  count: number
}

/** 供方入库量 TOP 榜项（随全局时间范围） */
export interface OverviewTopSupplier {
  supplierId: string
  supplierName: string
  inbound: number
  reject: number
}

/** 近 24h 分时入库点（固定口径） */
export interface OverviewHourlyPoint {
  hour: string
  inbound: number
  reject: number
}

/** 推送批次指标条（随全局时间范围） */
export interface OverviewPushSummary {
  batchCount: number
  success: number
  fail: number
  waitingReceipt: number
  avgCostMs: number
  retryCount: number
}

/** 推送量/成功率趋势点（随全局时间范围） */
export interface OverviewPushTrendPoint {
  date: string
  pushed: number
  successRate: number
}

/** 待办聚合（实时口径，固定） */
export interface OverviewTodoSummary {
  pendingAlert: number
  unreadMessage: number
  waitingReceipt: number
}

export interface Overview {
  supplierCount: number
  inboundTotal: number
  /** 入库总量同比（百分点，正=同比上升，负=同比下降，null=暂无基数） */
  inboundYoy: number | null
  /** 入库总量环比（百分点，正=环比上升，负=环比下降，null=暂无基数） */
  inboundMom: number | null
  lastInboundAt: string
  todayCount: number
  yesterdayCount: number
  todayRejectRate: number
  healthRate: number
  pushSuccessRate: number
  pendingAlertCount: number
  trend: OverviewTrendPoint[]
  /** 接入数据量趋势专用序列（随时间范围联动横坐标粒度） */
  trendSeries: OverviewTrendSeries
  // V1.1 扩充：接入分析
  rejectReasons: OverviewRejectReason[]
  topSuppliers: OverviewTopSupplier[]
  healthDist: Record<Health, number>
  hourlyTrend: OverviewHourlyPoint[]
  // V1.1 扩充：推送对账
  pushSummary: OverviewPushSummary
  pushTrend: OverviewPushTrendPoint[]
  pushFailReasons: PushFailReason[]
  recentBatches: PushBatch[]
  // V1.1 扩充：待办动态
  todoSummary: OverviewTodoSummary
  // 各告警类型按处置状态堆叠：待处理 / 处理中 / 已处置
  alertTypeDist: Record<AlertType, AlertTypeDistItem>
  recentEntries: DataEntry[]
  // V1.1 扩充：运营概览
  quota: { used: number; total: number }
  activeSpec: { version: string; publishedAt: string; status: 'active' }
  siteDist: { site: string; count: number }[]
}

// ── 供数统计 ─────────────────────────────────────────────────
export type StatsRange = 'today' | '3d' | '1w' | '1m' | 'custom'
export type StatsResult = 'all' | 'success' | 'reject'

export interface StatsQuery {
  range: StatsRange
  start?: string
  end?: string
  supplierIds: string[]
  result: StatsResult
}

export type RejectReason =
  | 'scheme_disabled'
  | 'appkey_invalid'
  | 'ip_denied'
  | 'field_invalid'
  | 'owner_mismatch'
  | 'other'

export const rejectReasonLabels: Record<RejectReason, string> = {
  scheme_disabled: '接入方案停用',
  appkey_invalid: 'AppKey 无效',
  ip_denied: 'IP 不在白名单',
  field_invalid: '字段缺失或非法',
  owner_mismatch: '数据归属不符',
  other: '其他',
}

export interface StatsSummary {
  total: number
  success: number
  reject: number
  rejectRate: number
}

export interface StatsRow {
  id: string
  name: string
  date: string
  supplierId: string
  supplierName: string
  total: number
  success: number
  reject: number
  rejectRate: number
  mainReason: RejectReason
  count: number
}

// ── 入库条目（仅索引） ───────────────────────────────────────
export interface DataEntry {
  id: string
  title: string
  supplierId: string
  supplierName: string
  authorName: string
  publishedAt: string
  inboundAt: string
  sourceSite: string
  sourceUrl: string
}

export interface DataEntryQuery {
  keyword: string
  supplierId: string
  authorName: string
  publishStart: string
  publishEnd: string
  inboundStart: string
  inboundEnd: string
  page: number
  pageSize: number
}

// ── 供数方（统一标准口径：停用 / 异常 / 活跃 / 健康） ─────────
export type Health = 'healthy' | 'active' | 'error' | 'disabled'

export const healthMeta: Record<Health, { label: string; color: string }> = {
  healthy: { label: '健康', color: 'green' },
  active: { label: '活跃', color: 'blue' },
  error: { label: '异常', color: 'red' },
  disabled: { label: '停用', color: 'gray' },
}

/** 供数方状态判定口径常量（与 MT 管理端「活跃方案」阈值保持一致） */
export const HEALTH_RULE = {
  /** 活跃：近 1 周累计接入数据量阈值 */
  activeWeekCount: 10000,
  /** 活跃：近 1 周至少有接入数据的天数 */
  activeMinDays: 5,
  /** 异常：拒收率阈值（%），超过即异常 */
  errorRejectRate: 5,
  /** 演示数据的「今日」锚点；近 3 天无接入的自然日窗口起点（含当天） */
  recent3dStart: '2026-09-18 00:00:00',
} as const

/**
 * 统一供数方状态口径（全局唯一判定入口）：
 * 1. 停用：供数商在 MT 端被关停（status=disabled）；
 * 2. 异常：启用状态下，近 3 天无数据接入，或拒收率 > 5%；
 * 3. 活跃：启用且非异常，近 1 周累计接入 ≥ 10,000 条，或至少 5 天有接入数据；
 * 4. 健康：启用状态下，除活跃、异常之外的供数方。
 */
export function computeHealth(s: {
  status: AccountStatus
  lastPushAt: string
  todayRejectRate: number
  weekTrend: number[]
}): Health {
  if (s.status === 'disabled') return 'disabled'
  // 异常优先：近 3 天无数据接入，或拒收率超阈值
  const noRecentData = !s.lastPushAt || s.lastPushAt < HEALTH_RULE.recent3dStart
  if (noRecentData || s.todayRejectRate > HEALTH_RULE.errorRejectRate) return 'error'
  // 活跃：近 1 周累计量达标，或有接入数据的天数达标
  const weekTotal = s.weekTrend.reduce((sum, n) => sum + (Number(n) || 0), 0)
  const activeDays = s.weekTrend.filter((n) => Number(n) > 0).length
  if (weekTotal >= HEALTH_RULE.activeWeekCount || activeDays >= HEALTH_RULE.activeMinDays) return 'active'
  return 'healthy'
}

export interface Supplier {
  id: string
  name: string
  code: string
  status: AccountStatus
  updatedAt: string
  health: Health
  schemeName: string
  schemeVersion: string
  appKeyMasked: string
  todayCount: number
  lastPushAt: string
  todayRejectRate: number
  weekTrend: number[]
}

export interface SupplierQuery {
  keyword: string
  /** 供数方编码（可选，模糊匹配） */
  code?: string
  health: Health | ''
  page: number
  pageSize: number
}

// ── 监控告警 ─────────────────────────────────────────────────
export type AlertLevel = 'high' | 'mid' | 'low'
export type AlertType = 'break' | 'reject' | 'delay' | 'field'
export type AlertStatus = 'pending' | 'processing' | 'resolved' | 'ignored'

export const alertLevelMeta: Record<AlertLevel, { label: string; color: string }> = {
  high: { label: '高', color: 'red' },
  mid: { label: '中', color: 'orange' },
  low: { label: '低', color: 'blue' },
}

export const alertTypeLabels: Record<AlertType, string> = {
  break: '供数断流',
  reject: '拒收率突增',
  delay: '入库延迟',
  field: '字段异常',
}

// 告警类型分布堆叠段（按处置进度）
export type AlertStackStatus = 'pending' | 'processing' | 'resolved'

export interface AlertTypeDistItem {
  /** 待处理 */
  pending: number
  /** 处理中 */
  processing: number
  /** 已处置（含已忽略） */
  resolved: number
}

export const alertStackStatusMeta: Record<AlertStackStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: '#ff7d00' },
  processing: { label: '处理中', color: '#1677ff' },
  resolved: { label: '已处置', color: '#00b42a' },
}

export const alertStatusMeta: Record<AlertStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'orange' },
  processing: { label: '处理中', color: 'blue' },
  resolved: { label: '已处置', color: 'green' },
  ignored: { label: '已忽略', color: 'gray' },
}

export interface AlertTimelineNode {
  at: string
  action: string
  note: string
  operator: string
}

export interface AlertRecord {
  id: string
  level: AlertLevel
  type: AlertType
  supplierId: string
  supplierName: string
  ruleName: string
  triggerValue: string
  threshold: string
  triggeredAt: string
  status: AlertStatus
  assigneeName: string
  disposedAt: string
  timeline: AlertTimelineNode[]
}

export interface AlertQuery {
  supplierId: string
  level: AlertLevel | ''
  status: AlertStatus | ''
  type: AlertType | ''
  page: number
  pageSize: number
}

export type AlertChannel = 'inbox' | 'wechat' | 'email'
export const alertChannelLabels: Record<AlertChannel, string> = {
  inbox: '站内信',
  wechat: '微信',
  email: '邮件',
}

export interface AlertSubscription {
  id: string
  type: AlertType
  /** 接收级别：勾选即推送的并集关系，命中所选任一级别都会推送；为空表示该类型不推送 */
  levels: AlertLevel[]
  channels: AlertChannel[]
  /** 通知对象（机构成员 id）；勾选的所有渠道都投递给这批成员 */
  receiverIds: string[]
  quietStart: string
  quietEnd: string
  enabled: boolean
}

export interface AlertRule {
  id: string
  name: string
  type: AlertType
  /** 规则命中时产生的告警级别 */
  level: AlertLevel
  /** 结构化阈值条件，供系统规范解析；随告警类型不同而结构不同 */
  condition: AlertRuleCondition
  /** 由 condition 派生的可读阈值文案，供列表/详情直接展示 */
  threshold: string
  enabled: boolean
  updatedAt: string
}

/** MT 管理端保存告警规则的入参（新增时无 id）；threshold 由 condition 自动派生，无需提交 */
export interface AlertRulePayload {
  id?: string
  name: string
  type: AlertType
  level: AlertLevel
  condition: AlertRuleCondition
  enabled: boolean
}

// ── 告警规则结构化阈值条件 ───────────────────────────────────
export type DurationUnit = 'minute' | 'hour'
export type DelayMetric = 'avg' | 'p95' | 'max'

export const durationUnitLabels: Record<DurationUnit, string> = {
  minute: '分钟',
  hour: '小时',
}
export const delayMetricLabels: Record<DelayMetric, string> = {
  avg: '平均延迟',
  p95: 'P95 延迟',
  max: '最大延迟',
}

/** 供数断流：连续 N 分钟/小时无入库 */
export interface BreakCondition {
  noDataValue: number
  noDataUnit: DurationUnit
}
/** 拒收率突增：统计窗口内拒收率超阈值，且入库样本量达到最低门槛（避免小样本抖动） */
export interface RejectCondition {
  /** 拒收率阈值（%） */
  ratePercent: number
  /** 统计窗口（小时） */
  windowHours: number
  /** 窗口内最低入库量，低于此量不判定 */
  minVolume: number
}
/** 入库延迟：所选延迟指标超过 N 分钟 */
export interface DelayCondition {
  metric: DelayMetric
  minutes: number
}
/** 字段异常：指定字段（留空表示全部关键字段）缺失率超阈值 */
export interface FieldCondition {
  fieldKey: string
  missingRatePercent: number
}

export type AlertRuleCondition =
  | ({ type: 'break' } & BreakCondition)
  | ({ type: 'reject' } & RejectCondition)
  | ({ type: 'delay' } & DelayCondition)
  | ({ type: 'field' } & FieldCondition)

/** 各告警类型的默认阈值条件（与历史种子文案对齐） */
export function defaultCondition(type: AlertType): AlertRuleCondition {
  switch (type) {
    case 'break':
      return { type: 'break', noDataValue: 6, noDataUnit: 'hour' }
    case 'reject':
      return { type: 'reject', ratePercent: 5, windowHours: 1, minVolume: 1000 }
    case 'delay':
      return { type: 'delay', metric: 'avg', minutes: 15 }
    case 'field':
      return { type: 'field', fieldKey: '', missingRatePercent: 3 }
  }
}

/** 由结构化条件生成人类可读阈值描述（同时作为 AlertRule.threshold） */
export function describeCondition(c: AlertRuleCondition): string {
  switch (c.type) {
    case 'break':
      return `连续 ${c.noDataValue} ${durationUnitLabels[c.noDataUnit]}无入库`
    case 'reject':
      return `近 ${c.windowHours} 小时拒收率 > ${c.ratePercent}%（样本量 ≥ ${c.minVolume}）`
    case 'delay':
      return `${delayMetricLabels[c.metric]} > ${c.minutes} 分钟`
    case 'field':
      return c.fieldKey.trim()
        ? `字段 ${c.fieldKey.trim()} 缺失率 > ${c.missingRatePercent}%`
        : `关键字段缺失率 > ${c.missingRatePercent}%`
  }
}

export type DisposeAction = 'confirm' | 'transfer' | 'ignore' | 'processing'
export const disposeActionLabels: Record<DisposeAction, string> = {
  confirm: '确认异常',
  transfer: '转供方整改',
  ignore: '忽略',
  processing: '标记处理中',
}

export interface DisposePayload {
  action: DisposeAction
  note: string
}

// ── 推送回流 ─────────────────────────────────────────────────
export type ReceiptStatus = 'received' | 'waiting'

export const receiptMeta: Record<ReceiptStatus, { label: string; color: string }> = {
  received: { label: '已回执', color: 'green' },
  waiting: { label: '未回执', color: 'orange' },
}

export interface PushFailReason {
  reason: string
  count: number
}

export interface PushBatch {
  id: string
  batchNo: string
  schemeName: string
  supplierId: string
  supplierName: string
  pushedAt: string
  total: number
  success: number
  fail: number
  costMs: number
  receiptStatus: ReceiptStatus
  retryCount: number
  failReasons: PushFailReason[]
  lastReceiptAt: string
}

export interface PushBatchQuery {
  supplierId: string
  result: 'all' | 'success' | 'fail'
  page: number
  pageSize: number
}

// ── 消息 ─────────────────────────────────────────────────────
export type MessageType = 'alert' | 'system' | 'auth'

export const messageTypeMeta: Record<MessageType, { label: string; color: string }> = {
  alert: { label: '告警', color: 'red' },
  system: { label: '系统', color: 'blue' },
  auth: { label: '授权', color: 'purple' },
}

export interface V8Message {
  id: string
  type: MessageType
  title: string
  summary: string
  refId: string
  isRead: boolean
  createdAt: string
}

// ── 接入规范 ─────────────────────────────────────────────────
export interface SpecField {
  name: string
  type: string
  required: boolean
  desc: string
  example: string
}

export interface SpecErrorCode {
  code: string
  desc: string
  advice: string
}

export interface SpecVersion {
  version: string
  publishedAt: string
  status: 'active' | 'history'
  changelog: string
  fields: SpecField[]
  errorCodes: SpecErrorCode[]
}

export interface DownloadLog {
  id: string
  version: string
  operator: string
  downloadedAt: string
}

// ── 机构与用户授权 ───────────────────────────────────────────
export interface OrgInfo {
  id: string
  name: string
  code: string
  industry: string
  region: string
  authStart: string
  authEnd: string
  modules: string[]
  usedQuota: number
  totalQuota: number
  appKeyMasked: string
  contactName: string
  contactPhoneMasked: string
}

export interface OrgUser {
  id: string
  name: string
  accountMasked: string
  phoneMasked: string
  role: V8Role
  menus: MenuKey[] | '*'
  supplierScope: string[] | '*'
  menuCount: number
  supplierCount: number
  status: AccountStatus
  lastLoginAt: string
}

export interface UpdateUserPermissionPayload {
  role: V8Role
  menus: MenuKey[]
  supplierScope: string[] | '*'
}

// ── 个人设置 ─────────────────────────────────────────────────
export interface ProfileSetting {
  name: string
  personalChannels: AlertChannel[]
}

// ── 通用分页 ─────────────────────────────────────────────────
export interface PageResult<T> {
  list: T[]
  total: number
}

export interface ListResult<T> {
  list: T[]
  total: number
}
