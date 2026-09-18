export type OrgStaffRole = 'admin' | 'member'

export interface OrgStaff {
  id: string
  orgId: string
  name: string
  account: string
  remark: string
  node: string
  role: OrgStaffRole
  phone: string
  enabled: boolean
  activated: boolean
  wecomFollowed: boolean
  avatarColor: string
}

const STORAGE_KEY = 'yunshu-mt-org-staff-v2'
const AVATAR_COLORS = ['#165dff', '#00b42a', '#ff7d00', '#722ed1', '#14c9c9', '#f53f3f', '#3491fa']

function colorOf(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function staff(partial: Omit<OrgStaff, 'avatarColor' | 'account'> & { account?: string }): OrgStaff {
  return {
    ...partial,
    account: partial.account || partial.name,
    avatarColor: colorOf(partial.name),
  }
}

const seed: OrgStaff[] = [
  staff({
    id: 'u1',
    orgId: 'o5',
    name: '小猪猪长征',
    remark: '罗科长（董塘社）',
    node: '董塘社',
    role: 'admin',
    phone: '138****3156',
    enabled: true,
    activated: true,
    wecomFollowed: true,
  }),
  staff({
    id: 'u2',
    orgId: 'o5',
    name: '走乐乐',
    remark: '走乐乐（城联中心）',
    node: '城联中心',
    role: 'admin',
    phone: '185****8812',
    enabled: true,
    activated: true,
    wecomFollowed: true,
  }),
  staff({
    id: 'u3',
    orgId: 'o5',
    name: 'Shaw',
    remark: '肖工（技术运维科）',
    node: '技术运维科',
    role: 'member',
    phone: '186****6789',
    enabled: true,
    activated: true,
    wecomFollowed: false,
  }),
  staff({
    id: 'u4',
    orgId: 'o5',
    name: 'domo',
    remark: '李涛（安管中心）',
    node: '安管中心',
    role: 'member',
    phone: '155****1122',
    enabled: true,
    activated: true,
    wecomFollowed: true,
  }),
  staff({
    id: 'u5',
    orgId: 'o5',
    name: 'THIS',
    remark: '于畅（城联中心）',
    node: '城联中心',
    role: 'member',
    phone: '137****3144',
    enabled: true,
    activated: true,
    wecomFollowed: true,
  }),
  staff({
    id: 'u6',
    orgId: 'o5',
    name: 'anan',
    remark: '安平（网安支队）',
    node: '网安支队',
    role: 'member',
    phone: '187****9266',
    enabled: true,
    activated: false,
    wecomFollowed: true,
  }),
  staff({
    id: 'u7',
    orgId: 'o5',
    name: '张工伟',
    remark: '张工伟（办公室）',
    node: '办公室',
    role: 'member',
    phone: '135****0988',
    enabled: true,
    activated: true,
    wecomFollowed: true,
  }),
  staff({
    id: 'u8',
    orgId: 'o5',
    name: '小林',
    remark: '林潇（政工室）',
    node: '政工室',
    role: 'member',
    phone: '136****4411',
    enabled: true,
    activated: true,
    wecomFollowed: false,
  }),
  staff({
    id: 'u9',
    orgId: 'o5',
    name: '赵天',
    remark: '赵成天（科技支队）',
    node: '科技支队',
    role: 'member',
    phone: '181****7722',
    enabled: true,
    activated: true,
    wecomFollowed: true,
  }),
  staff({
    id: 'u10',
    orgId: 'o5',
    name: '周天',
    remark: '周睿（督察大队）',
    node: '督察大队',
    role: 'member',
    phone: '133****8299',
    enabled: true,
    activated: true,
    wecomFollowed: true,
  }),
  staff({
    id: 'u11',
    orgId: 'o5',
    name: 'Lucy',
    remark: '陈蕾（法制支队）',
    node: '法制支队',
    role: 'member',
    phone: '158****6533',
    enabled: true,
    activated: true,
    wecomFollowed: false,
  }),
  staff({
    id: 'u12',
    orgId: 'o5',
    name: '停用测试员',
    remark: '历史账号（已停用）',
    node: '办公室',
    role: 'member',
    phone: '139****0001',
    enabled: false,
    activated: false,
    wecomFollowed: false,
  }),
  staff({
    id: 'u13',
    orgId: 'o5',
    name: '离职人员甲',
    remark: '已调离',
    node: '城联中心',
    role: 'member',
    phone: '139****0002',
    enabled: false,
    activated: false,
    wecomFollowed: false,
  }),
  staff({
    id: 'u14',
    orgId: 'o1',
    name: '王运营',
    remark: '王运营（综合处）',
    node: '综合处',
    role: 'admin',
    phone: '138****1001',
    enabled: true,
    activated: true,
    wecomFollowed: true,
  }),
  staff({
    id: 'u15',
    orgId: 'o1',
    name: '刘研',
    remark: '刘研（网信处）',
    node: '网信处',
    role: 'admin',
    phone: '139****2002',
    enabled: true,
    activated: true,
    wecomFollowed: true,
  }),
  staff({
    id: 'u16',
    orgId: 'o1',
    name: '陈可',
    remark: '陈可（技术保障科）',
    node: '技术保障科',
    role: 'member',
    phone: '137****3003',
    enabled: true,
    activated: true,
    wecomFollowed: false,
  }),
  staff({
    id: 'u17',
    orgId: 'o1',
    name: '赵倩',
    remark: '赵倩（内容审核组）',
    node: '内容审核组',
    role: 'member',
    phone: '136****4004',
    enabled: true,
    activated: false,
    wecomFollowed: true,
  }),
  staff({
    id: 'u18',
    orgId: 'o1',
    name: '孙停',
    remark: '孙停（已停用）',
    node: '综合处',
    role: 'member',
    phone: '135****5005',
    enabled: false,
    activated: false,
    wecomFollowed: false,
  }),
  staff({
    id: 'u19',
    orgId: 'o2',
    name: '宣传管理员',
    remark: '主账号',
    node: '办公室',
    role: 'admin',
    phone: '158****6106',
    enabled: true,
    activated: true,
    wecomFollowed: true,
  }),
  staff({
    id: 'u20',
    orgId: 'o2',
    name: '李编辑',
    remark: '内容组',
    node: '内容组',
    role: 'member',
    phone: '159****7107',
    enabled: true,
    activated: false,
    wecomFollowed: false,
  }),
  staff({
    id: 'u21',
    orgId: 'o3',
    name: '融媒主官',
    remark: '中心主任',
    node: '中心办公室',
    role: 'admin',
    phone: '186****8108',
    enabled: true,
    activated: true,
    wecomFollowed: true,
  }),
  staff({
    id: 'u22',
    orgId: 'o3',
    name: '采编员',
    remark: '采编中心',
    node: '采编中心',
    role: 'member',
    phone: '187****9109',
    enabled: true,
    activated: true,
    wecomFollowed: true,
  }),
  staff({
    id: 'u23',
    orgId: 'o4',
    name: '咸阳管理员',
    remark: '网信办',
    node: '网信办',
    role: 'admin',
    phone: '133****0110',
    enabled: true,
    activated: true,
    wecomFollowed: false,
  }),
]

const extraOrgIds = ['o6', 'o7', 'o8', 'o9', 'o10', 'o11', 'o12', 'o13', 'o14']
extraOrgIds.forEach((orgId, idx) => {
  seed.push(
    staff({
      id: `ux${idx}a`,
      orgId,
      name: '机构管理员',
      remark: '主账号',
      node: '办公室',
      role: 'admin',
      phone: `139****${String(2000 + idx).slice(-4)}`,
      enabled: true,
      activated: true,
      wecomFollowed: idx % 2 === 0,
    }),
    staff({
      id: `ux${idx}b`,
      orgId,
      name: '业务经办',
      remark: '使用成员',
      node: '业务科',
      role: 'member',
      phone: `138****${String(3000 + idx).slice(-4)}`,
      enabled: true,
      activated: idx % 3 !== 0,
      wecomFollowed: idx % 2 === 1,
    }),
  )
})

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

function load(): OrgStaff[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as OrgStaff[]
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    /* ignore */
  }
  return clone(seed)
}

let list = load()

function persist() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function getOrgStaff(orgId: string) {
  return list.filter((s) => s.orgId === orgId)
}

export function ensureOrgStaff(orgId: string) {
  if (list.some((s) => s.orgId === orgId)) return
  persist()
}

export type OrgStaffKpiFilter = '' | 'activated' | 'inactive' | 'unfollowed'

export function queryOrgStaff(params: {
  orgId: string
  enabled: boolean
  role?: string
  keyword?: string
  kpi?: OrgStaffKpiFilter
  page: number
  pageSize: number
}) {
  let rows = getOrgStaff(params.orgId)
  const kpis = {
    activated: rows.filter((s) => s.activated && s.enabled).length,
    inactive: rows.filter((s) => !s.activated).length,
    unfollowed: rows.filter((s) => !s.wecomFollowed).length,
    enabled: rows.filter((s) => s.enabled).length,
    disabled: rows.filter((s) => !s.enabled).length,
  }
  rows = rows.filter((s) => s.enabled === params.enabled)
  if (params.role === 'admin' || params.role === 'member') {
    rows = rows.filter((s) => s.role === params.role)
  }
  const q = (params.keyword || '').trim()
  if (q) {
    rows = rows.filter(
      (s) =>
        s.name.includes(q) ||
        s.account.includes(q) ||
        s.phone.includes(q) ||
        s.remark.includes(q) ||
        s.node.includes(q),
    )
  }
  if (params.kpi === 'activated') rows = rows.filter((s) => s.activated && s.enabled)
  if (params.kpi === 'inactive') rows = rows.filter((s) => !s.activated)
  if (params.kpi === 'unfollowed') rows = rows.filter((s) => !s.wecomFollowed)
  const start = (params.page - 1) * params.pageSize
  return { list: rows.slice(start, start + params.pageSize), total: rows.length, kpis }
}
