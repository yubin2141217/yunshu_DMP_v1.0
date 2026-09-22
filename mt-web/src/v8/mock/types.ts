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
/** 数据概览全局时间范围：今日 / 近3天 / 近7天 / 近1个月 / 近2个月 / 近3个月 */
export type OverviewRange = 'today' | '3d' | '7d' | '1m' | '2m' | '3m'

export interface OverviewTrendPoint {
  date: string
  inbound: number
  reject: number
}

/** 趋势点内单个供方在此时段的入库 / 拒收明细（簇状展示用） */
export interface OverviewTrendSupplierPoint {
  supplierId: string
  supplierName: string
  inbound: number
  reject: number
}

/** 随时间范围联动的趋势点（含按供方拆分明细） */
export interface OverviewTrendSeriesPoint {
  date: string
  inbound: number
  reject: number
  suppliers: OverviewTrendSupplierPoint[]
}

/** 接入数据量趋势的横坐标粒度 */
export type TrendGranularity = 'hour' | '12h' | 'day' | 'month'

/** 随时间范围联动的趋势序列（粒度由所选时间范围决定，点内含按供方拆分明细） */
export interface OverviewTrendSeries {
  granularity: TrendGranularity
  points: OverviewTrendSeriesPoint[]
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
/** 接入日志时间范围：最多仅支持 3 天（今日 / 近3天 / 自定义≤3天） */
export type StatsRange = 'today' | '3d' | 'custom'
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
  /** 来源 URL 模糊匹配 */
  sourceUrl: string
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

/* ===================== 供数方能力五维评估（P04 详情雷达，纯前端派生，不入库） ===================== */

/** 评分维度 key */
export type ScoreDimension = 'volume' | 'activity' | 'quality' | 'stability' | 'freshness'
/** 综合等级 */
export type ScoreGrade = 'excellent' | 'good' | 'medium' | 'poor'

/** 评分阈值（与 HEALTH_RULE 对齐），全部为 0–100 口径 */
export const SCORE_RULE = {
  /** 演示固定时钟：评分「当前时刻」锚点，禁止使用 Date.now()，避免随真实日期漂移 */
  nowBase: '2026-09-21 00:00:00',
  /** 数据量满分所需近 7 日累计入库量（=活跃阈值） */
  volumeFullCount: HEALTH_RULE.activeWeekCount,
  /** 时效性分段（小时） */
  freshFullHours: 24,
  freshMidHours: 72,
  freshZeroHours: 24 * 7,
} as const

export interface SupplierScore {
  /** 数据量：近 7 日累计入库规模 */
  volume: number
  /** 活跃度：近 7 日有入库天数占比 */
  activity: number
  /** 数据质量：今日拒收率反向得分 */
  quality: number
  /** 供给稳定性：有入库日入库量平稳度 */
  stability: number
  /** 时效性：最近推送距基准时间 */
  freshness: number
  /** 综合总分（五维等权平均，0–100） */
  total: number
  /** 综合等级 */
  grade: ScoreGrade
  /** 最低分维度（短板） */
  weakest: ScoreDimension
}

export const scoreDimensionMeta: Record<ScoreDimension, { label: string; tip: string }> = {
  volume: { label: '数据量', tip: '近 7 日累计入库量，达到 10,000 条（活跃量级）记满分。' },
  activity: { label: '活跃度', tip: '近 7 日中有数据接入的天数占比，7 天全接入记满分。' },
  quality: { label: '数据质量', tip: '按今日拒收率反向计分：拒收 0% 记满分，每升高 1% 扣 10 分，≥10% 记 0 分。当前基于今日拒收率。' },
  stability: { label: '供给稳定性', tip: '有接入数据的日期里，每日入库量是否平稳（变异系数越小越稳）；仅 1 天有数据时取中性 50 分。' },
  freshness: { label: '时效性', tip: '最近一次推送距当前的时间：≤24 小时满分，72 小时约 60 分，超过 7 天或从未推送记 0 分。' },
}

export const scoreGradeMeta: Record<ScoreGrade, { label: string; color: string }> = {
  excellent: { label: '优', color: 'green' },
  good: { label: '良', color: 'blue' },
  medium: { label: '中', color: 'orange' },
  poor: { label: '差', color: 'red' },
}

/** 各维度低于该分时给出短板提示 */
export const SCORE_WEAK_LINE = 60

const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

/** 两个时间点相差小时数（b - a） */
function hoursBetween(a: string, b: string): number {
  return (new Date(b.replace(/-/g, '/')).getTime() - new Date(a.replace(/-/g, '/')).getTime()) / 3_600_000
}

/**
 * 供数方五维能力评分（纯函数）。
 * 数据来源全部为 Supplier 现有字段：weekTrend / todayRejectRate / lastPushAt。
 */
export function computeSupplierScore(s: Pick<Supplier, 'lastPushAt' | 'todayRejectRate' | 'weekTrend'>): SupplierScore {
  const trend = (s.weekTrend || []).map((n) => Number(n) || 0)
  const weekTotal = trend.reduce((sum, n) => sum + n, 0)
  const positiveDays = trend.filter((n) => n > 0)

  // 数据量：累计量 / 活跃阈值
  const volume = clamp100((weekTotal / SCORE_RULE.volumeFullCount) * 100)
  // 活跃度：有入库天数 / 7
  const activity = clamp100((positiveDays.length / 7) * 100)
  // 数据质量：拒收率反向
  const quality = clamp100(100 - s.todayRejectRate * 10)
  // 供给稳定性：有入库日的变异系数 CV（总体标准差/均值），仅 1 天取中性 50，全 0 记 0
  let stability = 0
  if (positiveDays.length >= 2) {
    const mean = positiveDays.reduce((sum, n) => sum + n, 0) / positiveDays.length
    const variance = positiveDays.reduce((sum, n) => sum + (n - mean) ** 2, 0) / positiveDays.length
    const cv = Math.sqrt(variance) / mean
    stability = clamp100((1 - cv) * 100)
  } else if (positiveDays.length === 1) {
    stability = 50
  }
  // 时效性：按距基准时刻的小时数分段线性
  let freshness = 0
  if (s.lastPushAt) {
    const h = hoursBetween(s.lastPushAt, SCORE_RULE.nowBase)
    if (h <= SCORE_RULE.freshFullHours) {
      freshness = 100
    } else if (h <= SCORE_RULE.freshMidHours) {
      freshness = 100 - ((h - SCORE_RULE.freshFullHours) / (SCORE_RULE.freshMidHours - SCORE_RULE.freshFullHours)) * 40
    } else if (h < SCORE_RULE.freshZeroHours) {
      freshness = 60 - ((h - SCORE_RULE.freshMidHours) / (SCORE_RULE.freshZeroHours - SCORE_RULE.freshMidHours)) * 60
    }
  }
  freshness = clamp100(freshness)

  const dims: Record<ScoreDimension, number> = { volume, activity, quality, stability, freshness }
  const total = clamp100((volume + activity + quality + stability + freshness) / 5)
  const weakest = (Object.keys(dims) as ScoreDimension[]).reduce((min, k) => (dims[k] < dims[min] ? k : min), 'volume' as ScoreDimension)
  return { volume, activity, quality, stability, freshness, total, grade: gradeOf(total), weakest }
}

/** 综合总分 → 等级：优≥85 / 良70-84 / 中55-69 / 差<55 */
export function gradeOf(total: number): ScoreGrade {
  if (total >= 85) return 'excellent'
  if (total >= 70) return 'good'
  if (total >= 55) return 'medium'
  return 'poor'
}

/** 机构内启用供方的五维均值（停用供方不纳入），用于雷达参照层 */
export function averageSupplierScores(scores: SupplierScore[]): SupplierScore {
  const empty: SupplierScore = { volume: 0, activity: 0, quality: 0, stability: 0, freshness: 0, total: 0, grade: 'poor', weakest: 'volume' }
  if (!scores.length) return empty
  const sum = scores.reduce(
    (acc, sc) => {
      acc.volume += sc.volume
      acc.activity += sc.activity
      acc.quality += sc.quality
      acc.stability += sc.stability
      acc.freshness += sc.freshness
      return acc
    },
    { volume: 0, activity: 0, quality: 0, stability: 0, freshness: 0 },
  )
  const n = scores.length
  const avg: SupplierScore = {
    volume: clamp100(sum.volume / n),
    activity: clamp100(sum.activity / n),
    quality: clamp100(sum.quality / n),
    stability: clamp100(sum.stability / n),
    freshness: clamp100(sum.freshness / n),
    total: 0,
    grade: 'poor',
    weakest: 'volume',
  }
  avg.total = clamp100((avg.volume + avg.activity + avg.quality + avg.stability + avg.freshness) / 5)
  avg.grade = gradeOf(avg.total)
  return avg
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
