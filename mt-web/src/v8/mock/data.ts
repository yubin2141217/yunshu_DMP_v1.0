/* ============================================================
 * V8 机构端 Mock 数据集
 * - 内存种子数据 + localStorage 持久化（用户权限/订阅/消息已读/告警处置/下载留痕/个人设置）
 * - 统一按会话用户 supplierScope 过滤供方维度
 * ============================================================ */
import type {
  AlertRecord,
  AlertRule,
  AlertSubscription,
  DataEntry,
  OrgInfo,
  OrgUser,
  OverviewRange,
  OverviewRejectReason,
  OverviewTrendSeriesPoint,
  OverviewTrendSupplierPoint,
  PushBatch,
  RejectReason,
  SpecVersion,
  Supplier,
  V8Message,
} from './types'
import { computeHealth, rejectReasonLabels } from './types'

export const ORG_ID = 'org-wxb-01'

/**
 * 供数方原始种子（不含 health）；health 由统一口径 computeHealth 派生，
 * 全工程不再人工指定，确保停用/异常/活跃/健康四态口径一致。
 */
const rawSuppliers: Omit<Supplier, 'health'>[] = [
  {
    id: 's1', name: '清博智能', code: 'QB001', status: 'enabled', updatedAt: '2026-09-01 14:20:00',
    schemeName: '舆情库表增量接入', schemeVersion: 'v2.3', appKeyMasked: 'ak-qb••••6688',
    // 近 1 周 7 天均有接入（活跃天数达标）→ 活跃
    todayCount: 1286, lastPushAt: '2026-09-20 09:12:00', todayRejectRate: 1.2, weekTrend: [980, 1024, 1102, 968, 1205, 1320, 1286],
  },
  {
    id: 's2', name: '智慧星光', code: 'ZX001', status: 'enabled', updatedAt: '2026-08-28 09:10:00',
    schemeName: '接口实时推送', schemeVersion: 'v1.8', appKeyMasked: 'ak-zx••••2046',
    // 拒收率 6.8% > 5% 阈值 → 异常
    todayCount: 402, lastPushAt: '2026-09-20 08:58:00', todayRejectRate: 6.8, weekTrend: [520, 488, 460, 510, 470, 440, 402],
  },
  {
    id: 's3', name: '数美科技', code: 'SM001', status: 'disabled', updatedAt: '2026-09-02 18:06:00',
    schemeName: '舆情库表全量接入', schemeVersion: 'v1.1', appKeyMasked: 'ak-sm••••9132',
    // MT 端已关停 → 停用
    todayCount: 0, lastPushAt: '2026-09-02 18:06:00', todayRejectRate: 0, weekTrend: [0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: 's4', name: '百度舆情', code: 'BD001', status: 'enabled', updatedAt: '2026-08-15 11:00:00',
    schemeName: '接口实时推送', schemeVersion: 'v3.0', appKeyMasked: 'ak-bd••••5570',
    // 最后接入 09-17，近 3 天无数据接入且拒收率 100% → 异常
    todayCount: 0, lastPushAt: '2026-09-17 22:40:00', todayRejectRate: 100, weekTrend: [300, 320, 280, 210, 120, 40, 0],
  },
  {
    id: 's5', name: '人民众云', code: 'RM001', status: 'enabled', updatedAt: '2026-09-10 10:30:00',
    schemeName: '舆情库表增量接入', schemeVersion: 'v1.5', appKeyMasked: 'ak-rm••••3321',
    // 近 1 周仅近 3 天有量（<5 天）且累计 <1 万，拒收率低 → 健康（非活跃、非异常）
    todayCount: 216, lastPushAt: '2026-09-20 09:05:00', todayRejectRate: 0.8, weekTrend: [0, 0, 0, 0, 190, 210, 216],
  },
]

export const suppliersSeed: Supplier[] = rawSuppliers.map((s) => ({ ...s, health: computeHealth(s) }))

const rejectReasons: RejectReason[] = [
  'scheme_disabled', 'appkey_invalid', 'ip_denied', 'field_invalid', 'owner_mismatch', 'other',
]

const sites: Record<string, string> = {
  s1: '微信公众平台',
  s2: '新浪微博',
  s3: '今日头条',
  s4: '百度百家号',
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const titlePool: Record<string, string[]> = {
  s1: ['某市启动网络空间清朗专项行动', '政务新媒体传播力周榜发布', '某地数据要素改革方案解读', '城市数字化治理典型案例公布'],
  s2: ['网传某路段交通管制信息核实', '一民生政策调整引发网友讨论', '某行业协会发布消费提示', '本地文旅活动宣传稿受热捧'],
  s3: ['某企业产品质量舆情追踪', '区域营商环境优化措施盘点', '社区便民服务升级获好评', '一不实信息被依法处置'],
  s4: ['某热点事件多平台传播分析', '政务服务满意度调查结果', '城市品牌形象传播报告', '一网络谣言澄清通告'],
}

const authors = ['城市观察员', '民生直通车', '舆情放大镜', '政务前沿', '网友爆料', '热点追踪员']

// 生成 60 条入库条目（仅索引）
export const entriesSeed: DataEntry[] = (() => {
  const list: DataEntry[] = []
  const sids = ['s1', 's2', 's3', 's4']
  let seq = 1000
  for (let i = 0; i < 60; i += 1) {
    const sid = sids[i % sids.length]
    const titles = titlePool[sid]
    const title = titles[i % titles.length]
    const inbound = new Date(2026, 8, 20, 9, 12, 0)
    inbound.setMinutes(inbound.getMinutes() - i * 47)
    const published = new Date(inbound.getTime())
    published.setMinutes(published.getMinutes() - 30 - (i % 5) * 12)
    const hasUrl = i % 9 !== 0
    list.push({
      id: `e${seq + i}`,
      title: i % 7 === 0 ? `${title}（多地网友持续关注事件进展）` : title,
      supplierId: sid,
      supplierName: suppliersSeed.find((s) => s.id === sid)?.name || '',
      authorName: authors[i % authors.length],
      publishedAt: fmt(published),
      inboundAt: fmt(inbound),
      sourceSite: sites[sid],
      sourceUrl: hasUrl ? `https://source.example.com/article/${seq + i}` : '',
    })
  }
  return list
})()

/**
 * 告警种子：按「类型 × 处置状态」生成，确保 供数断流/拒收率突增/入库延迟/字段异常
 * 四类在 待处理/处理中/已处置 三段均有数据，供概览堆叠柱状图展示。
 * ignored（已忽略）在分布图中并入「已处置」。
 */
export const alertsSeed: AlertRecord[] = (() => {
  const list: AlertRecord[] = []
  const p2 = (n: number) => String(n).padStart(2, '0')
  const fmtAt = (day: number, hh: number, mm: number) =>
    `2026-09-${p2(day)} ${p2(hh)}:${p2(mm)}:00`
  let seq = 0
  const nextId = () => `a${++seq}`

  interface Spec {
    type: AlertRecord['type']
    ruleName: string
    level: AlertRecord['level']
    trigger: (i: number) => { value: string; threshold: string }
    // [供数方id, 名称]
    suppliers: [string, string][]
    // 三段数量：待处理 / 处理中 / 已处置（另附少量已忽略并入已处置口径）
    counts: [number, number, number]
  }

  const specs: Spec[] = [
    {
      type: 'break', level: 'high', ruleName: '供数断流告警',
      trigger: (i) => ({ value: `已连续 ${6 + i * 2} 小时无入库`, threshold: '连续 6 小时无入库' }),
      suppliers: [['s4', '百度舆情'], ['s3', '数美科技'], ['s2', '智慧星光']],
      counts: [3, 2, 3],
    },
    {
      type: 'reject', level: 'mid', ruleName: '拒收率突增告警',
      trigger: (i) => ({ value: `拒收率 ${(5.6 + i * 0.7).toFixed(1)}%`, threshold: '拒收率 > 5%' }),
      suppliers: [['s2', '智慧星光'], ['s1', '清博智能'], ['s5', '人民众云']],
      counts: [2, 3, 4],
    },
    {
      type: 'delay', level: 'mid', ruleName: '入库延迟告警',
      trigger: (i) => ({ value: `平均延迟 ${16 + i * 4} 分钟`, threshold: '平均延迟 > 15 分钟' }),
      suppliers: [['s1', '清博智能'], ['s5', '人民众云'], ['s2', '智慧星光']],
      counts: [2, 1, 4],
    },
    {
      type: 'field', level: 'low', ruleName: '字段异常告警',
      trigger: (i) => ({ value: `关键字段缺失率 ${(3.4 + i * 0.6).toFixed(1)}%`, threshold: '缺失率 > 3%' }),
      suppliers: [['s2', '智慧星光'], ['s4', '百度舆情'], ['s1', '清博智能']],
      counts: [1, 2, 3],
    },
  ]

  const statusSeq: { status: AlertRecord['status']; n: number; assignee: string }[] = [
    { status: 'pending', n: 0, assignee: '' },
    { status: 'processing', n: 0, assignee: '王值班' },
    { status: 'resolved', n: 0, assignee: '李机构' },
  ]

  specs.forEach((spec, si) => {
    statusSeq[0].n = spec.counts[0]
    statusSeq[1].n = spec.counts[1]
    statusSeq[2].n = spec.counts[2]

    statusSeq.forEach((seg) => {
      for (let i = 0; i < seg.n; i += 1) {
        const [supplierId, supplierName] = spec.suppliers[(si + i) % spec.suppliers.length]
        const t = spec.trigger(i)
        // 时间倒序拉开：待处理最新，已处置较早
        const day = seg.status === 'pending' ? 20 : seg.status === 'processing' ? 19 : 18 - (i % 3)
        const hh = 8 + ((si * 2 + i) % 10)
        const mm = (i * 13 + si * 7) % 60
        const triggeredAt = fmtAt(Math.max(15, day), hh, mm)
        const timeline: AlertRecord['timeline'] = [
          { at: triggeredAt, action: '系统触发告警', note: `监控引擎检测到${spec.ruleName.replace('告警', '')}`, operator: '系统' },
        ]
        let disposedAt = ''
        if (seg.status === 'processing') {
          timeline.push({ at: fmtAt(day, Math.min(20, hh + 1), mm), action: '标记处理中', note: '已联系供方排查，等待反馈', operator: seg.assignee })
        }
        if (seg.status === 'resolved') {
          disposedAt = fmtAt(day, Math.min(21, hh + 2), mm)
          timeline.push({ at: disposedAt, action: '确认异常', note: '问题已定位并恢复，关闭告警', operator: seg.assignee })
        }
        list.push({
          id: nextId(),
          level: spec.level,
          type: spec.type,
          supplierId,
          supplierName,
          ruleName: spec.ruleName,
          triggerValue: t.value,
          threshold: t.threshold,
          triggeredAt,
          status: seg.status,
          assigneeName: seg.assignee,
          disposedAt,
          timeline,
        })
      }
    })
  })

  // 额外补 2 条「已忽略」，分布上并入已处置；保留 ignored 原始状态供监控页筛选
  const ignoredSpec: Spec = specs[3]
  for (let i = 0; i < 2; i += 1) {
    const [supplierId, supplierName] = ignoredSpec.suppliers[i % ignoredSpec.suppliers.length]
    const t = ignoredSpec.trigger(i + 5)
    const triggeredAt = fmtAt(17, 10 + i, 20)
    const disposedAt = fmtAt(17, 11 + i, 5)
    list.push({
      id: nextId(),
      level: 'low',
      type: 'field',
      supplierId,
      supplierName,
      ruleName: ignoredSpec.ruleName,
      triggerValue: t.value,
      threshold: t.threshold,
      triggeredAt,
      status: 'ignored',
      assigneeName: '李机构',
      disposedAt,
      timeline: [
        { at: triggeredAt, action: '系统触发告警', note: '监控引擎检测到字段异常', operator: '系统' },
        { at: disposedAt, action: '忽略', note: '经核实为来源本身缺失，属可接受范围', operator: '李机构' },
      ],
    })
  }

  // 按触发时间倒序
  return list.sort((a, b) => (a.triggeredAt < b.triggeredAt ? 1 : -1))
})()

export const subscriptionsSeed: AlertSubscription[] = [
  { id: 'sub1', type: 'break', levels: ['high', 'mid'], channels: ['inbox', 'wechat'], receiverIds: ['u1', 'u2'], quietStart: '22:00', quietEnd: '08:00', enabled: true },
  { id: 'sub2', type: 'reject', levels: ['high', 'mid', 'low'], channels: ['inbox'], receiverIds: ['u1', 'u2', 'u3'], quietStart: '', quietEnd: '', enabled: true },
  { id: 'sub3', type: 'delay', levels: ['high'], channels: ['inbox', 'email'], receiverIds: ['u2'], quietStart: '', quietEnd: '', enabled: false },
  { id: 'sub4', type: 'field', levels: ['mid', 'low'], channels: ['inbox'], receiverIds: ['u1'], quietStart: '', quietEnd: '', enabled: true },
]

export const rulesSeed: AlertRule[] = [
  { id: 'r1', name: '供数断流告警', type: 'break', level: 'high', condition: { type: 'break', noDataValue: 6, noDataUnit: 'hour' }, threshold: '连续 6 小时无入库', enabled: true, updatedAt: '2026-09-01 10:00:00' },
  { id: 'r2', name: '拒收率突增告警', type: 'reject', level: 'mid', condition: { type: 'reject', ratePercent: 5, windowHours: 1, minVolume: 1000 }, threshold: '近 1 小时拒收率 > 5%（样本量 ≥ 1000）', enabled: true, updatedAt: '2026-09-01 10:00:00' },
  { id: 'r3', name: '入库延迟告警', type: 'delay', level: 'mid', condition: { type: 'delay', metric: 'avg', minutes: 15 }, threshold: '平均延迟 > 15 分钟', enabled: true, updatedAt: '2026-08-20 10:00:00' },
  { id: 'r4', name: '字段异常告警', type: 'field', level: 'low', condition: { type: 'field', fieldKey: '', missingRatePercent: 3 }, threshold: '关键字段缺失率 > 3%', enabled: false, updatedAt: '2026-08-20 10:00:00' },
]

export const pushBatchesSeed: PushBatch[] = (() => {
  const list: PushBatch[] = []
  const schemes = ['网信办舆情库推送', '网安态势数据推送']
  for (let i = 0; i < 18; i += 1) {
    const sid = ['s1', 's2', 's4'][i % 3]
    const fail = i % 4 === 0 ? Math.floor(12 + i * 3) : 0
    const total = 800 + i * 37
    const pushed = new Date(2026, 8, 20, 9, 0, 0)
    pushed.setMinutes(pushed.getMinutes() - i * 96)
    list.push({
      id: `pb${i + 1}`,
      batchNo: `B20260920${String(1000 + i)}`,
      schemeName: schemes[i % 2],
      supplierId: sid,
      supplierName: suppliersSeed.find((s) => s.id === sid)?.name || '',
      pushedAt: fmt(pushed),
      total,
      success: total - fail,
      fail,
      costMs: 820 + i * 53,
      receiptStatus: fail > 0 || i % 5 === 0 ? 'waiting' : 'received',
      retryCount: fail > 0 ? (i % 2) + 1 : 0,
      failReasons: fail
        ? [
            { reason: '接收端响应超时', count: Math.round(fail * 0.6) },
            { reason: '接口返回错误码', count: Math.round(fail * 0.3) },
            { reason: '数据格式不符', count: fail - Math.round(fail * 0.6) - Math.round(fail * 0.3) },
          ]
        : [],
      lastReceiptAt: fail > 0 ? '' : fmt(new Date(pushed.getTime() + 1000 * 6)),
    })
  }
  return list
})()

export const messagesSeed: V8Message[] = [
  { id: 'm1', type: 'alert', title: '【供数断流】百度舆情已连续 10 小时无入库', summary: '监控引擎检测到百度舆情供数断流，请及时处置。', refId: 'a1', isRead: false, createdAt: '2026-09-20 08:40:00' },
  { id: 'm2', type: 'alert', title: '【拒收率突增】智慧星光拒收率达 6.8%', summary: '拒收率超过 5% 阈值，请关注字段格式问题。', refId: 'a2', isRead: false, createdAt: '2026-09-20 07:30:00' },
  { id: 'm3', type: 'auth', title: '机构授权将于 30 天后到期', summary: '您所在机构的服务授权将于 2026-10-20 到期，请及时联系运营续费。', refId: '', isRead: false, createdAt: '2026-09-19 09:00:00' },
  { id: 'm4', type: 'system', title: '接入规范发布新版本 v3.1', summary: '接入规范已更新，新增字段口径说明与拒收原因对照表。', refId: '', isRead: true, createdAt: '2026-09-18 15:00:00' },
  { id: 'm5', type: 'alert', title: '【入库延迟】清博智能平均延迟超阈值', summary: '平均延迟 18 分钟，超过 15 分钟阈值。', refId: 'a3', isRead: true, createdAt: '2026-09-19 21:10:00' },
]

export const specVersionsSeed: SpecVersion[] = [
  {
    version: 'v3.1', publishedAt: '2026-09-18 15:00:00', status: 'active',
    changelog: '1. 新增拒收原因对照表；2. 明确正文不下发口径；3. 补充 AppKey 鉴权与 IP 白名单说明。',
    fields: [
      { name: 'supplier_code', type: 'String(32)', required: true, desc: '供数方编码，标识来源厂商', example: 'QB001' },
      { name: 'org_id', type: 'String(64)', required: true, desc: '归属机构编码，一条只归属一个机构', example: 'org-wxb-01' },
      { name: 'news_uuid', type: 'String(64)', required: true, desc: '文章唯一标识', example: 'a1b2c3d4' },
      { name: 'news_title', type: 'String(512)', required: false, desc: '信息标题（机构端仅展示标题）', example: '某市启动清朗专项行动' },
      { name: 'media_name', type: 'String', required: false, desc: '发布者昵称', example: '城市观察员' },
      { name: 'source_url', type: 'String', required: false, desc: '来源链接，机构端外链跳转用', example: 'https://source.example.com/a1' },
      { name: 'content_time', type: 'DateTime', required: true, desc: '来源发布时间', example: '2026-09-20 08:30:00' },
      { name: 'content', type: '—', required: false, desc: '正文不下发（机构端不提供），平台不留存、不渲染', example: '—' },
    ],
    errorCodes: [
      { code: '4001', desc: 'AppKey 无效', advice: '核对 AppKey，联系运营确认接入方案' },
      { code: '4003', desc: 'IP 不在白名单', advice: '将出口 IP 报送运营加入白名单' },
      { code: '4221', desc: '必填字段缺失', advice: '按字段口径补齐后重推' },
      { code: '4222', desc: '数据归属不符', advice: '核对 org_id 与供数方绑定关系' },
    ],
  },
  {
    version: 'v3.0', publishedAt: '2026-07-10 10:00:00', status: 'history',
    changelog: '新增 source_url 字段；调整推送批次上限为 100。',
    fields: [], errorCodes: [],
  },
]

export const orgInfoSeed: OrgInfo = {
  id: ORG_ID,
  name: '某市互联网信息办公室',
  code: 'WXB-330100',
  industry: '政府 / 网信',
  region: '浙江省 杭州市',
  authStart: '2025-10-20',
  authEnd: '2026-10-20',
  modules: ['数据概览', '接入日志', '供数监控', '推送回流', '接入规范'],
  usedQuota: 42600,
  totalQuota: 100000,
  appKeyMasked: 'ak-org••••0021',
  contactName: '张运营',
  contactPhoneMasked: '138****6688',
}

export const orgUsersSeed: OrgUser[] = [
  {
    id: 'u1', name: '李机构', accountMasked: 'wx_li••••', phoneMasked: '138****6688', role: 'admin',
    menus: '*', supplierScope: '*', menuCount: 10, supplierCount: 5, status: 'enabled', lastLoginAt: '2026-09-20 09:00:00',
  },
  {
    id: 'u2', name: '王值班', accountMasked: 'wx_wang••••', phoneMasked: '139****2046', role: 'duty',
    menus: ['overview', 'dataCheck', 'suppliers', 'monitor', 'message'], supplierScope: ['s1', 's2'],
    menuCount: 5, supplierCount: 2, status: 'enabled', lastLoginAt: '2026-09-19 18:20:00',
  },
  {
    id: 'u3', name: '赵查看', accountMasked: 'wx_zhao••••', phoneMasked: '137****9132', role: 'readonly',
    menus: ['overview', 'dataCheck'], supplierScope: ['s1'],
    menuCount: 2, supplierCount: 1, status: 'enabled', lastLoginAt: '2026-09-18 09:30:00',
  },
]

/** 概览趋势的「今天」锚点：取系统当天 00:00，保证横坐标与真实日历一致 */
function trendToday(): Date {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

/** 近 N 天（含今天）的入库/拒收趋势，按供方范围 */
export function buildTrend(days: number, scope: string[] | '*') {
  const scoped = scopeSupplierIds(scope)
  const anchor = trendToday()
  const points: { date: string; inbound: number; reject: number }[] = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(anchor.getTime())
    d.setDate(d.getDate() - i)
    const inbound = scoped.reduce((sum, sid, idx) => {
      const base = sid === 's1' ? 1200 : sid === 's2' ? 480 : sid === 's4' ? 240 : sid === 's5' ? 210 : 0
      return sum + Math.round(base * (0.85 + ((i + idx) % 5) * 0.06))
    }, 0)
    const reject = Math.round(inbound * (0.01 + ((i % 6) * 0.004)))
    points.push({ date: `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, inbound, reject })
  }
  return points
}

/**
 * 概览「接入数据量趋势」专用构建器，按时间范围决定横坐标粒度：
 * - today：今日 00:00 至当前整点（每小时一个点）
 * - 3d：最近 3 天每天 00:00 / 12:00 两个点（共 6 个）
 * - 7d / 1m / 2m / 3m：按天（近 7 / 30 / 60 / 90 天）
 */
export type OverviewGranularity = 'hour' | '12h' | 'day' | 'month'

/** 各供方单位时段入库基数（用于分时 / 12 小时点估算） */
function supplierHourBase(sid: string): number {
  return sid === 's1' ? 96 : sid === 's2' ? 40 : sid === 's4' ? 20 : sid === 's5' ? 17 : 0
}

/** 单个供方某自然日的入库基准（与 buildTrend 日量口径一致） */
function supplierDayBase(sid: string): number {
  return sid === 's1' ? 1200 : sid === 's2' ? 480 : sid === 's4' ? 240 : sid === 's5' ? 210 : 0
}

/** 单个供方在某个整点的入库量（夜间低峰、白天高峰的真实分时波动） */
function hourInboundOf(sid: string, h: number, idx: number): number {
  const factor = h >= 9 && h <= 21 ? 1 : h === 7 || h === 8 || h === 22 ? 0.55 : 0.18
  return Math.round(supplierHourBase(sid) * factor * (0.8 + ((h + idx) % 4) * 0.1))
}

/** 计算若干供方在某个整点的入库量合计 */
function hourInbound(scoped: string[], d: Date): number {
  const h = d.getHours()
  return scoped.reduce((sum, sid, idx) => sum + hourInboundOf(sid, h, idx), 0)
}

function supplierNameOf(sid: string): string {
  return suppliersSeed.find((s) => s.id === sid)?.name || ''
}

export function buildOverviewTrend(
  range: OverviewRange,
  scope: string[] | '*',
): { granularity: OverviewGranularity; points: OverviewTrendSeriesPoint[] } {
  const scoped = scopeSupplierIds(scope)
  const today = trendToday()
  const currentHour = new Date().getHours()
  const points: OverviewTrendSeriesPoint[] = []

  if (range === 'today') {
    // 今日 00:00 到当前整点（含），共 currentHour+1 个点；每小时各供方入库/拒收明细
    for (let h = 0; h <= currentHour; h += 1) {
      const d = new Date(today.getTime())
      d.setHours(h)
      const suppliers: OverviewTrendSupplierPoint[] = scoped.map((sid, idx) => {
        const inbound = hourInboundOf(sid, h, idx)
        const reject = Math.round(inbound * (0.008 + (h % 5) * 0.004))
        return { supplierId: sid, supplierName: supplierNameOf(sid), inbound, reject }
      })
      points.push({
        date: `${pad(h)}:00`,
        inbound: suppliers.reduce((s, p) => s + p.inbound, 0),
        reject: suppliers.reduce((s, p) => s + p.reject, 0),
        suppliers,
      })
    }
    return { granularity: 'hour', points }
  }

  if (range === '3d') {
    // 3 天（含今天），每天 00:00 / 12:00 两个点
    for (let i = 2; i >= 0; i -= 1) {
      const day = new Date(today.getTime())
      day.setDate(day.getDate() - i)
      ;[0, 12].forEach((h, k) => {
        const d = new Date(day.getTime())
        d.setHours(h)
        // 00:00 点代表前 12 小时（夜间）累计，12:00 点代表白天 12 小时累计
        const suppliers: OverviewTrendSupplierPoint[] = scoped.map((sid, idx) => {
          const base = supplierHourBase(sid) * 12 * (h === 0 ? 0.45 : 1)
          const inbound = Math.round(base * (0.85 + ((i + idx + k) % 5) * 0.06))
          const reject = Math.round(inbound * (0.008 + ((i + k) % 5) * 0.004))
          return { supplierId: sid, supplierName: supplierNameOf(sid), inbound, reject }
        })
        points.push({
          date: `${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(h)}:00`,
          inbound: suppliers.reduce((s, p) => s + p.inbound, 0),
          reject: suppliers.reduce((s, p) => s + p.reject, 0),
          suppliers,
        })
      })
    }
    return { granularity: '12h', points }
  }

  // 按天：近 7 天 / 近 1 月 30 天 / 近 2 月 60 天 / 近 3 月 90 天
  const days = range === '7d' ? 7 : range === '1m' ? 30 : range === '2m' ? 60 : 90
  // 平滑的月级 + 周级波动包络（确定性，避免刷新跳变；长周期不再呈规则锯齿）
  const dayWave = (i: number, seed: number) =>
    0.92 + Math.sin(((i + seed) / 27) * Math.PI) * 0.1 + Math.sin(((i + seed) / 7) * Math.PI) * 0.05
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today.getTime())
    d.setDate(d.getDate() - i)
    const suppliers: OverviewTrendSupplierPoint[] = scoped.map((sid, idx) => {
      const inbound = Math.round(supplierDayBase(sid) * dayWave(i, idx))
      const reject = Math.round(inbound * (0.01 + ((i % 6) * 0.004)))
      return { supplierId: sid, supplierName: supplierNameOf(sid), inbound, reject }
    })
    points.push({
      date: `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      inbound: suppliers.reduce((s, p) => s + p.inbound, 0),
      reject: suppliers.reduce((s, p) => s + p.reject, 0),
      suppliers,
    })
  }
  return { granularity: 'day', points }
}

/** 来源平台分布 TOP 5（固定 5 个平台的演示数据，随时间范围给不同量级） */
export function buildSiteDistTop5(range: OverviewRange, _scope: string[] | '*'): { site: string; count: number }[] {
  const factor = range === 'today' ? 0.06 : range === '3d' ? 0.3 : range === '7d' ? 1 : range === '1m' ? 4 : range === '2m' ? 8 : 12
  const list = [
    { site: '微信公众平台', count: 986 },
    { site: '新浪微博', count: 642 },
    { site: '今日头条', count: 530 },
    { site: '百度百家号', count: 418 },
    { site: '人民众云', count: 255 },
  ]
  return list
    .map((r) => ({ site: r.site, count: Math.max(0, Math.round(r.count * factor)) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

export function scopeSupplierIds(scope: string[] | '*'): string[] {
  if (scope === '*') return suppliersSeed.map((s) => s.id)
  const allow = new Set(scope)
  return suppliersSeed.map((s) => s.id).filter((id) => allow.has(id))
}

/** 近 24 小时（以基准时刻 2026-09-20 09:00 为当前时点）24 个整点的入库/拒收，按供方范围 */
export function buildHourlyTrend(scope: string[] | '*') {
  const scoped = scopeSupplierIds(scope)
  const base = new Date(2026, 8, 20, 9, 0, 0)
  const points: { hour: string; inbound: number; reject: number }[] = []
  for (let i = 23; i >= 0; i -= 1) {
    const d = new Date(base.getTime() - i * 3600 * 1000)
    // 夜间（0-6 点）低峰，白天高峰，模拟真实分时波动
    const h = d.getHours()
    const factor = h >= 9 && h <= 21 ? 1 : h >= 7 || h <= 22 ? 0.55 : 0.18
    const inbound = scoped.reduce((sum, sid, idx) => {
      const baseHourly = sid === 's1' ? 96 : sid === 's2' ? 36 : sid === 's4' ? 18 : 0
      return sum + Math.round(baseHourly * factor * (0.8 + ((h + idx) % 4) * 0.1))
    }, 0)
    const reject = Math.round(inbound * (0.008 + (h % 5) * 0.004))
    points.push({ hour: `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(h)}:00`, inbound, reject })
  }
  return points
}

export function inScope(supplierId: string, scope: string[] | '*'): boolean {
  return scope === '*' || scope.includes(supplierId)
}

export function rejectReasonOf(seed: number): RejectReason {
  return rejectReasons[seed % rejectReasons.length]
}

/**
 * 拒收原因分布：按给定自然天数内的趋势量，将各供方拒收量按其主拒收原因归集（六类枚举）。
 * 概览页（随全局时间范围）与供数方查看页（近 7 天口径）共用。
 */
export function buildRejectReasons(days: number, scope: string[] | '*'): OverviewRejectReason[] {
  const scoped = scopeSupplierIds(scope)
  const scopedSuppliers = suppliersSeed.filter((s) => scoped.includes(s.id))
  const trend = buildTrend(days, scope)
  const rejectTotal = trend.reduce((s, p) => s + p.reject, 0)
  const reasonAgg = {} as Record<RejectReason, number>
  ;(Object.keys(rejectReasonLabels) as RejectReason[]).forEach((r) => { reasonAgg[r] = 0 })
  scopedSuppliers.forEach((s, si) => {
    const share = s.id === 's1' ? 0.52 : s.id === 's2' ? 0.22 : s.id === 's4' ? 0.14 : s.id === 's5' ? 0.12 : 0
    reasonAgg[rejectReasonOf(si + days)] += Math.round(rejectTotal * share)
  })
  return (Object.keys(rejectReasonLabels) as RejectReason[])
    .map((reason) => ({ reason, count: reasonAgg[reason] }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
}
