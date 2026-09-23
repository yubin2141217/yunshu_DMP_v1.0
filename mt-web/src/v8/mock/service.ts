/* ============================================================
 * V8 机构端 Mock 服务：内存 + localStorage 持久化 + 供方范围过滤
 * ============================================================ */
import type {
  AlertQuery,
  AlertRecord,
  AlertRule,
  AlertRuleCondition,
  AlertRulePayload,
  AlertSubscription,
  AlertType,
  DataEntry,
  DataEntryQuery,
  DataSubmission,
  DisposePayload,
  DownloadLog,
  Health,
  OrgUser,
  Overview,
  OverviewRange,
  PageResult,
  ProfileSetting,
  PushBatch,
  PushBatchQuery,
  PushFailReason,
  SpecVersion,
  StatsQuery,
  StatsRow,
  StatsSummary,
  Supplier,
  SupplierQuery,
  UpdateUserPermissionPayload,
  V8Message,
  V8UserInfo,
} from './types'
import {
  alertsSeed,
  buildHourlyTrend,
  buildOverviewTrend,
  buildRejectReasons,
  buildSiteDistTop5,
  buildTrend,
  inScope,
  messagesSeed,
  orgInfoSeed,
  orgUsersSeed,
  pushBatchesSeed,
  rejectReasonOf,
  rulesSeed,
  scopeSupplierIds,
  specVersionsSeed,
  submissionsSeed,
  subscriptionsSeed,
  suppliersSeed,
} from './data'
import { defaultCondition, describeCondition } from './types'

const LS = {
  alerts: 'yunshu-v8-alerts-v2',
  subs: 'yunshu-v8-subscriptions',
  rules: 'yunshu-v8-alert-rules',
  messages: 'yunshu-v8-messages',
  users: 'yunshu-v8-org-users',
  profile: 'yunshu-v8-profile',
  downloads: 'yunshu-v8-download-logs',
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

function paginate<T>(list: T[], page: number, pageSize: number): PageResult<T> {
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total: list.length }
}

/**
 * 入库条目聚合（列表口径：一条数据 = 一行）。
 * 同一来源数据（同 URL，缺 URL 时以「标题|作者|发布时间」兜底）的多家报送合并到 suppliers，
 * 按推送时间升序排列（1st = 最早推送），条目本身取首发时间；
 * 列表整体按首发时间倒序，新数据在前。
 */
function buildEntries(scope: string[] | '*', source: DataSubmission[]): DataEntry[] {
  const groups = new Map<string, DataSubmission[]>()
  for (const s of source) {
    if (!inScope(s.supplierId, scope)) continue
    const key = s.sourceUrl || `${s.title}|${s.authorName}|${s.publishedAt}`
    const arr = groups.get(key)
    if (arr) arr.push(s)
    else groups.set(key, [s])
  }
  return [...groups.values()]
    .map((subs) => {
      const sorted = [...subs].sort((a, b) => (a.inboundAt < b.inboundAt ? -1 : a.inboundAt > b.inboundAt ? 1 : 0))
      const first = sorted[0]
      return {
        id: first.id,
        title: first.title,
        authorName: first.authorName,
        publishedAt: first.publishedAt,
        sourceSite: first.sourceSite,
        sourceUrl: first.sourceUrl,
        inboundAt: first.inboundAt,
        suppliers: sorted.map((s) => ({
          supplierId: s.supplierId,
          supplierName: s.supplierName,
          inboundAt: s.inboundAt,
        })),
      }
    })
    .sort((a, b) => (a.inboundAt < b.inboundAt ? 1 : a.inboundAt > b.inboundAt ? -1 : 0))
}

function nowText(): string {
  const d = new Date()
  const p = (n: number) => (n < 10 ? `0${n}` : String(n))
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/**
 * 接入日志时间窗口对应的趋势点：
 * - 近3天 → 含今天在内最近 3 天
 * - 今日 → 仅今天
 * - 昨日 → 仅今天前一天
 * 同时按 query.supplierIds 收窄供方范围，使统计卡随供方切换联动。
 */
function logTrend(q: StatsQuery, scope: string[] | '*') {
  if (q.range === 'yesterday') return buildTrend(2, scope, q.supplierIds).slice(0, 1)
  return buildTrend(q.range === '3d' ? 3 : 1, scope, q.supplierIds)
}

/** 概览时间范围对应的自然天数（今日=1，与 MT 管理端口径一致；3m=历时全量，按近 90 天建模） */
function rangeDays(range: OverviewRange): number {
  if (range === 'today') return 1
  if (range === '3d') return 3
  if (range === '7d') return 7
  if (range === '1m') return 30
  if (range === '2m') return 60
  return 90
}

/**
 * 供数方列表各时间范围起点（含起点当天），按最近推送时间 lastPushAt 过滤。
 * 演示数据锚定基准日 2026-09-20：今日/近3天保留当日有推送的供方，近7天起含断流供方，近3月含已停用供方。
 */
const SUPPLIER_RANGE_START: Record<OverviewRange, string> = {
  today: '2026-09-20 00:00:00',
  '3d': '2026-09-18 00:00:00',
  '7d': '2026-09-14 00:00:00',
  '1m': '2026-08-21 00:00:00',
  '2m': '2026-07-22 00:00:00',
  '3m': '2026-06-22 00:00:00',
}

export const v8Service = {
  paginate,

  // ── 概览 ──
  overview(scope: string[] | '*', range: OverviewRange = '7d'): Overview {
    const ids = scopeSupplierIds(scope)
    const scopedSuppliers = suppliersSeed.filter((s) => ids.includes(s.id))
    const days = rangeDays(range)
    const trend7 = buildTrend(7, scope)
    const trend = buildTrend(days, scope)

    // 入库总量同比 / 环比：当前周期 vs 上一等长周期（环比）、去年同期等长周期（同比）
    const periodInbound = trend.reduce((s, p) => s + p.inbound, 0)
    const prevWindow = buildTrend(days * 2, scope)
    const prevPeriodInbound = prevWindow.slice(0, days).reduce((s, p) => s + p.inbound, 0)
    const yearWindow = buildTrend(365 + days, scope)
    const yearAgoInbound = yearWindow.slice(0, days).reduce((s, p) => s + p.inbound, 0)
    const pctChange = (cur: number, base: number): number | null => {
      if (!base) return null
      return Number((((cur - base) / base) * 100).toFixed(1))
    }
    const inboundMom = pctChange(periodInbound, prevPeriodInbound)
    const inboundYoy = pctChange(periodInbound, yearAgoInbound)
    // 接入数据量趋势专用序列（随时间范围决定横坐标粒度）
    const trendSeries = buildOverviewTrend(range, scope)
    const today = trend7[trend7.length - 1]
    const yesterday = trend7[trend7.length - 2] || { inbound: 0, reject: 0 }
    // 运行良好供方：活跃 + 健康（均为启用且非异常）
    const goodSuppliers = scopedSuppliers.filter((s) => s.health === 'active' || s.health === 'healthy').length

    // 固定基准：近 24h 推送批次窗口（种子锚定 2026-09-20 09:00）
    const dayStart = '2026-09-20 00:00:00'
    const day24hStart = '2026-09-19 09:00:00'
    const scopedBatches = pushBatchesSeed.filter((b) => inScope(b.supplierId, scope))
    const rangeBatches = range === 'today'
      ? scopedBatches.filter((b) => b.pushedAt >= dayStart)
      : scopedBatches
    const batches24h = scopedBatches.filter((b) => b.pushedAt >= day24hStart)

    // 拒收原因分布：各供方拒收量按其主拒收原因归集（六类枚举）
    const rejectReasons = buildRejectReasons(days, scope)

    // 供方入库量 TOP 榜（降序 TOP 8；停用供方为 0）
    const topSuppliers = scopedSuppliers
      .map((s, si) => {
        const share = s.id === 's1' ? 0.52 : s.id === 's2' ? 0.22 : s.id === 's4' ? 0.14 : s.id === 's5' ? 0.12 : 0
        const inbound = trend.reduce((sum, p) => sum + Math.round(p.inbound * share), 0)
        const reject = trend.reduce((sum, p) => sum + Math.round(p.reject * share), 0)
        void si
        return { supplierId: s.id, supplierName: s.name, inbound, reject }
      })
      .sort((a, b) => b.inbound - a.inbound)
      .slice(0, 8)

    // 供数方状态四态分布（停用 / 异常 / 活跃 / 健康）
    const healthDist = { active: 0, healthy: 0, error: 0, disabled: 0 } as Record<Health, number>
    scopedSuppliers.forEach((s) => { healthDist[s.health] += 1 })

    // 推送批次指标条
    const pSum = rangeBatches.reduce(
      (acc, b) => {
        acc.success += b.success
        acc.fail += b.fail
        acc.cost += b.costMs
        acc.retry += b.retryCount
        if (b.receiptStatus === 'waiting') acc.waiting += 1
        return acc
      },
      { success: 0, fail: 0, cost: 0, retry: 0, waiting: 0 },
    )
    const pushSummary = {
      batchCount: rangeBatches.length,
      success: pSum.success,
      fail: pSum.fail,
      waitingReceipt: pSum.waiting,
      avgCostMs: rangeBatches.length ? Math.round(pSum.cost / rangeBatches.length) : 0,
      retryCount: pSum.retry,
    }

    // 推送量/成功率趋势（随时间范围）
    const pushTrend = trend.map((p, i) => {
      const pushed = Math.round(p.inbound * 0.82)
      const rate = Number((99.4 - (i % 4) * 0.5 - (p.reject / Math.max(p.inbound, 1)) * 18).toFixed(1))
      return { date: p.date, pushed, successRate: Math.min(99.9, Math.max(95, rate)) }
    })

    // 推送失败原因聚合
    const failReasonMap: Record<string, number> = {}
    rangeBatches.forEach((b) => b.failReasons.forEach((r) => {
      failReasonMap[r.reason] = (failReasonMap[r.reason] || 0) + r.count
    }))
    const pushFailReasons: PushFailReason[] = Object.entries(failReasonMap)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)

    // 最近推送批次（固定最近 5 条）
    const recentBatches = [...scopedBatches]
      .sort((a, b) => (a.pushedAt < b.pushedAt ? 1 : -1))
      .slice(0, 5)

    // 待办与告警
    const scopedAlerts = this.alerts(scope)
    const scopedMessages = this.messages(scope)
    // 各告警类型按处置进度堆叠：待处理 / 处理中 / 已处置（ignored 并入已处置）
    const alertTypeDist = {
      break: { pending: 0, processing: 0, resolved: 0 },
      reject: { pending: 0, processing: 0, resolved: 0 },
      delay: { pending: 0, processing: 0, resolved: 0 },
      field: { pending: 0, processing: 0, resolved: 0 },
    } as Record<AlertType, { pending: number; processing: number; resolved: number }>
    scopedAlerts.forEach((a) => {
      if (a.status === 'pending') alertTypeDist[a.type].pending += 1
      else if (a.status === 'processing') alertTypeDist[a.type].processing += 1
      else alertTypeDist[a.type].resolved += 1
    })
    const waitingReceiptAll = scopedBatches.filter((b) => b.receiptStatus === 'waiting').length

    // 最近入库动态（固定最近 8 条，与列表同口径：一条数据 = 一行）
    const recentEntries = buildEntries(scope, submissionsSeed).slice(0, 8)

    // 来源平台分布 TOP 5（随时间范围给不同量级）
    const siteDist = buildSiteDistTop5(range, scope)

    const org = orgInfoSeed
    const spec = this.activeSpec()
    const pushTotal24h = batches24h.reduce((s, b) => s + b.total, 0)
    const pushOk24h = batches24h.reduce((s, b) => s + b.success, 0)

    return {
      supplierCount: scopedSuppliers.length,
      inboundTotal: 12840 + ids.length * 4200,
      inboundYoy,
      inboundMom,
      lastInboundAt: '2026-09-20 09:12:00',
      todayCount: today.inbound,
      yesterdayCount: yesterday.inbound,
      todayRejectRate: today.inbound ? Number(((today.reject / today.inbound) * 100).toFixed(1)) : 0,
      healthRate: scopedSuppliers.length ? Math.round((goodSuppliers / scopedSuppliers.length) * 100) : 100,
      pushSuccessRate: pushTotal24h ? Number(((pushOk24h / pushTotal24h) * 100).toFixed(1)) : 100,
      pendingAlertCount: scopedAlerts.filter((a) => a.status === 'pending').length,
      trend,
      trendSeries,
      rejectReasons,
      topSuppliers,
      healthDist,
      hourlyTrend: buildHourlyTrend(scope),
      pushSummary,
      pushTrend,
      pushFailReasons,
      recentBatches,
      todoSummary: {
        pendingAlert: scopedAlerts.filter((a) => a.status === 'pending').length,
        unreadMessage: scopedMessages.filter((m) => !m.isRead).length,
        waitingReceipt: waitingReceiptAll,
      },
      alertTypeDist,
      recentEntries,
      quota: { used: org.usedQuota, total: org.totalQuota },
      activeSpec: { version: spec.version, publishedAt: spec.publishedAt, status: 'active' as const },
      siteDist,
    }
  },

  // ── 供数统计 ──
  statsSummary(q: StatsQuery, scope: string[] | '*'): StatsSummary {
    const trend = logTrend(q, scope)
    const total = trend.reduce((s, p) => s + p.inbound, 0)
    const reject = trend.reduce((s, p) => s + p.reject, 0)
    return { total, success: total - reject, reject, rejectRate: total ? Number(((reject / total) * 100).toFixed(2)) : 0 }
  },
  statsRows(q: StatsQuery, scope: string[] | '*', page: number, pageSize: number): PageResult<StatsRow> & { trend: ReturnType<typeof buildTrend>; reasons: { reason: string; count: number }[] } {
    const trend = logTrend(q, scope)
    const days = trend.length
    const ids = scopeSupplierIds(scope).filter((id) => !q.supplierIds.length || q.supplierIds.includes(id))
    const rows: StatsRow[] = []
    ids.forEach((sid, si) => {
      const supplier = suppliersSeed.find((x) => x.id === sid)!
      const agg = trend.reduce(
        (acc, p, i) => {
          const share = sid === 's1' ? 0.6 : sid === 's2' ? 0.24 : sid === 's4' ? 0.16 : 0
          acc.total += Math.round(p.inbound * share)
          acc.reject += Math.round(p.reject * share)
          void i
          return acc
        },
        { total: 0, reject: 0 },
      )
      const mainReason = rejectReasonOf(si + days)
      rows.push({
        id: `${sid}-${days}`,
        name: supplier.name,
        date: '',
        supplierId: sid,
        supplierName: supplier.name,
        total: agg.total,
        success: agg.total - agg.reject,
        reject: agg.reject,
        rejectRate: agg.total ? Number(((agg.reject / agg.total) * 100).toFixed(2)) : 0,
        mainReason,
        count: agg.total,
      })
    })
    const filtered = q.result === 'success'
      ? rows.filter((r) => r.success > 0)
      : q.result === 'reject'
        ? rows.filter((r) => r.reject > 0)
        : rows
    const reasons = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.mainReason] = (acc[r.mainReason] || 0) + r.reject
      return acc
    }, {})
    return {
      ...paginate(filtered, page, pageSize),
      trend,
      reasons: Object.entries(reasons).map(([reason, count]) => ({ reason, count })),
    }
  },

  // ── 供方选项 ──
  supplierOptions(scope: string[] | '*') {
    return suppliersSeed
      .filter((s) => inScope(s.id, scope))
      .map((s) => ({ label: s.name, value: s.id }))
  },

  // ── 入库条目 ──
  entries(q: DataEntryQuery, scope: string[] | '*'): PageResult<DataEntry> {
    let list = buildEntries(scope, submissionsSeed)
    const kw = q.keyword.trim()
    if (kw) list = list.filter((e) => e.title.includes(kw))
    // 供方筛选：保留该供方参与的数据；供数方列仍展示该条数据的全部报送供方
    if (q.supplierId && q.supplierId !== 'all') {
      list = list.filter((e) => e.suppliers.some((s) => s.supplierId === q.supplierId))
    }
    if (q.authorName.trim()) list = list.filter((e) => e.authorName.includes(q.authorName.trim()))
    // 来源 URL：忽略大小写的模糊匹配
    const urlKw = (q.sourceUrl || '').trim().toLowerCase()
    if (urlKw) list = list.filter((e) => e.sourceUrl.toLowerCase().includes(urlKw))
    if (q.publishStart) list = list.filter((e) => e.publishedAt >= q.publishStart)
    if (q.publishEnd) list = list.filter((e) => e.publishedAt <= q.publishEnd)
    // 入库时间：任一供数方的推送时间落在区间内即命中该条数据
    // （起止值均为「YYYY-MM-DD HH:mm:ss」，与种子同格式，可直接字符串比较）
    if (q.inboundStart) list = list.filter((e) => e.suppliers.some((s) => s.inboundAt >= q.inboundStart))
    if (q.inboundEnd) list = list.filter((e) => e.suppliers.some((s) => s.inboundAt <= q.inboundEnd))
    return paginate(list, q.page, q.pageSize)
  },

  // ── 供数方 ──
  suppliers(q: SupplierQuery, scope: string[] | '*'): PageResult<Supplier> & { list: Supplier[] } {
    let list = suppliersSeed.filter((s) => inScope(s.id, scope))
    // 时间范围：最近推送时间落在范围内才保留（演示数据基准日 2026-09-20）
    const rangeStart = SUPPLIER_RANGE_START[q.range || 'today']
    if (rangeStart) list = list.filter((s) => s.lastPushAt && s.lastPushAt >= rangeStart)
    // 供数方名称（独立模糊匹配）
    const kw = (q.keyword || '').trim().toLowerCase()
    if (kw) list = list.filter((s) => s.name.toLowerCase().includes(kw))
    // 供数方编码（独立模糊匹配）
    const codeKw = (q.code || '').trim().toLowerCase()
    if (codeKw) list = list.filter((s) => s.code.toLowerCase().includes(codeKw))
    if (q.health) list = list.filter((s) => s.health === q.health)
    const page = paginate(list, q.page, q.pageSize)
    return { ...page, list }
  },
  allSuppliers(scope: string[] | '*'): Supplier[] {
    return suppliersSeed.filter((s) => inScope(s.id, scope))
  },

  // ── 告警 ──
  alerts(scope: string[] | '*'): AlertRecord[] {
    return load<AlertRecord[]>(LS.alerts, alertsSeed).filter((a) => inScope(a.supplierId, scope))
  },
  alertPage(q: AlertQuery, scope: string[] | '*'): PageResult<AlertRecord> {
    let list = this.alerts(scope)
    if (q.supplierId && q.supplierId !== 'all') list = list.filter((a) => a.supplierId === q.supplierId)
    if (q.level) list = list.filter((a) => a.level === q.level)
    if (q.status) list = list.filter((a) => a.status === q.status)
    if (q.type) list = list.filter((a) => a.type === q.type)
    list = [...list].sort((a, b) => (a.triggeredAt < b.triggeredAt ? 1 : -1))
    return paginate(list, q.page, q.pageSize)
  },
  disposeAlert(id: string, payload: DisposePayload, operator: string, scope: string[] | '*') {
    const all = load<AlertRecord[]>(LS.alerts, alertsSeed)
    const target = all.find((a) => a.id === id)
    if (!target || !inScope(target.supplierId, scope)) return null
    const status = payload.action === 'ignore' ? 'ignored' : payload.action === 'processing' ? 'processing' : 'resolved'
    const actionLabel =
      payload.action === 'confirm' ? '确认异常' : payload.action === 'transfer' ? '转供方整改' : payload.action === 'ignore' ? '忽略' : '标记处理中'
    target.status = status
    target.assigneeName = payload.action === 'processing' ? operator : target.assigneeName || operator
    if (status !== 'processing') target.disposedAt = nowText()
    target.timeline.push({ at: nowText(), action: actionLabel, note: payload.note, operator })
    save(LS.alerts, all)
    return target
  },

  // ── 订阅 ──
  subscriptions(): AlertSubscription[] {
    // 兼容旧缓存：历史数据可能缺少 receiverIds，读取时按种子补齐
    const list = load<AlertSubscription[]>(LS.subs, subscriptionsSeed)
    return list.map((s) => {
      const seed = subscriptionsSeed.find((x) => x.id === s.id)
      return { ...seed, ...s, receiverIds: s.receiverIds ?? seed?.receiverIds ?? [] }
    })
  },
  saveSubscriptions(list: AlertSubscription[]) {
    save(LS.subs, list)
  },

  // ── 告警规则（MT 管理端统一配置下发，机构端只读） ──
  rules(): AlertRule[] {
    // 兼容旧缓存：历史规则可能缺少 level / condition，读取时按种子或类型默认补齐
    const list = load<AlertRule[]>(LS.rules, rulesSeed)
    return list.map((r) => {
      const seed = rulesSeed.find((x) => x.id === r.id)
      const level = r.level ?? seed?.level ?? 'mid'
      const type = (r.type ?? seed?.type ?? 'break') as AlertType
      const condition: AlertRuleCondition = r.condition ?? seed?.condition ?? defaultCondition(type)
      // threshold 始终以结构化 condition 为准重新派生，保证与配置一致
      return { ...seed, ...r, level, type, condition, threshold: describeCondition(condition) }
    })
  },
  saveRule(payload: AlertRulePayload): AlertRule {
    const list = this.rules()
    const threshold = describeCondition(payload.condition)
    if (payload.id) {
      const target = list.find((r) => r.id === payload.id)
      if (!target) throw new Error('告警规则不存在')
      Object.assign(target, {
        name: payload.name,
        type: payload.type,
        level: payload.level,
        condition: payload.condition,
        threshold,
        enabled: payload.enabled,
        updatedAt: nowText(),
      })
      save(LS.rules, list)
      return target
    }
    const created: AlertRule = {
      id: `r${Date.now()}`,
      name: payload.name,
      type: payload.type,
      level: payload.level,
      condition: payload.condition,
      threshold,
      enabled: payload.enabled,
      updatedAt: nowText(),
    }
    list.unshift(created)
    save(LS.rules, list)
    return created
  },
  toggleRule(id: string, enabled: boolean): AlertRule {
    const list = this.rules()
    const target = list.find((r) => r.id === id)
    if (!target) throw new Error('告警规则不存在')
    target.enabled = enabled
    target.updatedAt = nowText()
    save(LS.rules, list)
    return target
  },
  removeRule(id: string) {
    const list = this.rules().filter((r) => r.id !== id)
    save(LS.rules, list)
  },

  // ── 推送回流 ──
  pushBatches(q: PushBatchQuery, scope: string[] | '*'): PageResult<PushBatch> {
    let list = pushBatchesSeed.filter((b) => inScope(b.supplierId, scope))
    if (q.supplierId && q.supplierId !== 'all') list = list.filter((b) => b.supplierId === q.supplierId)
    if (q.result === 'success') list = list.filter((b) => b.fail === 0)
    if (q.result === 'fail') list = list.filter((b) => b.fail > 0)
    list = [...list].sort((a, b) => (a.pushedAt < b.pushedAt ? 1 : -1))
    return paginate(list, q.page, q.pageSize)
  },

  // ── 消息 ──
  messages(scope: string[] | '*'): V8Message[] {
    const all = load<V8Message[]>(LS.messages, messagesSeed)
    const validAlert = new Set(this.alerts(scope).map((a) => a.id))
    return all.filter((m) => m.type !== 'alert' || !m.refId || validAlert.has(m.refId))
  },
  unreadCount(scope: string[] | '*'): number {
    return this.messages(scope).filter((m) => !m.isRead).length
  },
  markRead(id: string, scope: string[] | '*'): V8Message | null {
    const all = load<V8Message[]>(LS.messages, messagesSeed)
    const target = all.find((m) => m.id === id)
    if (!target) return null
    target.isRead = true
    save(LS.messages, all)
    void scope
    return target
  },
  markAllRead(scope: string[] | '*') {
    const all = load<V8Message[]>(LS.messages, messagesSeed)
    const ids = new Set(this.messages(scope).map((m) => m.id))
    all.forEach((m) => {
      if (ids.has(m.id)) m.isRead = true
    })
    save(LS.messages, all)
  },

  // ── 接入规范 ──
  specVersions(): SpecVersion[] {
    return specVersionsSeed
  },
  activeSpec(): SpecVersion {
    return specVersionsSeed.find((s) => s.status === 'active') || specVersionsSeed[0]
  },
  logDownload(version: string, operator: string): DownloadLog {
    const logs = load<DownloadLog[]>(LS.downloads, [])
    const log: DownloadLog = { id: `dl${logs.length + 1}`, version, operator, downloadedAt: nowText() }
    logs.unshift(log)
    save(LS.downloads, logs)
    return log
  },
  downloadLogs(): DownloadLog[] {
    return load<DownloadLog[]>(LS.downloads, [])
  },

  // ── 机构 ──
  orgInfo() {
    return orgInfoSeed
  },

  // ── 机构用户与权限 ──
  orgUsers(): OrgUser[] {
    return load<OrgUser[]>(LS.users, orgUsersSeed)
  },
  updateUserPermission(userId: string, payload: UpdateUserPermissionPayload): OrgUser | null {
    const list = load<OrgUser[]>(LS.users, orgUsersSeed)
    const target = list.find((u) => u.id === userId)
    if (!target) return null
    target.role = payload.role
    target.menus = payload.menus
    target.supplierScope = payload.supplierScope
    target.menuCount = payload.menus.length
    target.supplierCount = payload.supplierScope === '*' ? suppliersSeed.length : payload.supplierScope.length
    save(LS.users, list)
    return target
  },
  toggleUserStatus(userId: string): OrgUser | null {
    const list = load<OrgUser[]>(LS.users, orgUsersSeed)
    const target = list.find((u) => u.id === userId)
    if (!target) return null
    target.status = target.status === 'enabled' ? 'disabled' : 'enabled'
    save(LS.users, list)
    return target
  },

  // ── 个人设置 ──
  profile(user: V8UserInfo): ProfileSetting {
    return load<ProfileSetting>(LS.profile, { name: user.name, personalChannels: ['inbox'] })
  },
  saveProfile(setting: ProfileSetting) {
    save(LS.profile, setting)
  },
}

export function delay(ms = 220): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
