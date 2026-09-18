import type { Org, OrgAuthStatus, OrgOpenVersion } from '@/mock/mt'
import { daysUntil } from '@/utils/orgLicense'

export type OrgAppStatus = 'closed_reopen' | 'running' | 'pending'
export type OrgAppEdition = 'formal' | 'replica'
export type OrgManageTab = 'apps' | 'usage' | 'logs'

export interface OrgManageProfile {
  id: string
  name: string
  code: string
  fullName: string
  address: string
  creditCode: string
  region: string
  statUnit: string
  salesName: string
  openVersion: OrgOpenVersion
  authStatus: OrgAuthStatus
  expireAt: string
  trialExpireText: string
  activateExpireText: string
  grantExpireText: string
  remainDays: number | null
}

export interface OrgAuthorizedApp {
  id: string
  name: string
  desc: string
  groupLabel: string
  edition: OrgAppEdition
  status: OrgAppStatus
  nodeCount?: number
}

export interface OrgAppUsageRow {
  id: string
  appName: string
  lastUsedAt: string
  activeUsers: number
  callCount: number
}

export interface OrgManageLog {
  id: string
  action: string
  summary: string
  operator: string
  operatedAt: string
}

const STORAGE_KEY = 'yunshu-mt-org-apps-v1'

const PROFILE_EXTRA: Record<string, Partial<Pick<OrgManageProfile, 'address' | 'creditCode' | 'fullName' | 'trialExpireText' | 'activateExpireText' | 'grantExpireText'>>> = {
  o5: {
    fullName: '西安高新教育集团（高新一中教育集团）',
    address: '西安高新区丈八街道科技二路软件新城',
    creditCode: '91610131MA6F8113XA',
    trialExpireText: '未设置',
    activateExpireText: '未激活',
    grantExpireText: '未使用',
  },
}

function defaultApps(): OrgAuthorizedApp[] {
  return [
    {
      id: 'app-account',
      name: '机构账号中心',
      groupLabel: '系统底座',
      desc: '授权后可在该应用中管理下属人员账号、组织节点与登录权限。',
      edition: 'formal',
      status: 'closed_reopen',
      nodeCount: 189,
    },
    {
      id: 'app-opinion',
      name: '独立舆情情报系统',
      groupLabel: '业务应用',
      desc: '面向机构的独立舆情监测副本，开通后按授权节点使用。',
      edition: 'replica',
      status: 'pending',
    },
    {
      id: 'app-command',
      name: '指令流转中心',
      groupLabel: '业务应用',
      desc: '机构侧指令下发与反馈协同，需先完成账号中心授权。',
      edition: 'formal',
      status: 'running',
      nodeCount: 36,
    },
  ]
}

function defaultUsage(): OrgAppUsageRow[] {
  return [
    { id: 'u1', appName: '指令流转中心', lastUsedAt: '2026-09-14 18:22:10', activeUsers: 11, callCount: 1280 },
    { id: 'u2', appName: '机构账号中心', lastUsedAt: '2026-09-12 09:08:41', activeUsers: 3, callCount: 86 },
    { id: 'u3', appName: '独立舆情情报系统', lastUsedAt: '—', activeUsers: 0, callCount: 0 },
  ]
}

function defaultLogs(orgName: string): OrgManageLog[] {
  return [
    {
      id: 'l1',
      action: '开通',
      summary: `开通机构「${orgName}」正式版授权`,
      operator: '王运营',
      operatedAt: '2026-08-01 10:12:00',
    },
    {
      id: 'l2',
      action: '授权',
      summary: '关闭机构账号中心授权（可重新授权）',
      operator: '王运营',
      operatedAt: '2026-08-20 15:40:22',
    },
    {
      id: 'l3',
      action: '修改',
      summary: '更新授权服务到期时间为 2027-12-31',
      operator: '吕小诺',
      operatedAt: '2026-09-01 11:06:18',
    },
  ]
}

interface Store {
  apps: Record<string, OrgAuthorizedApp[]>
}

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

function loadStore(): Store {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Store
      if (parsed && parsed.apps) return parsed
    }
  } catch {
    /* ignore */
  }
  return { apps: {} }
}

let store = loadStore()

function persist() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function buildOrgProfile(org: Org): OrgManageProfile {
  const extra = PROFILE_EXTRA[org.id] || {}
  const region = org.region || ''
  return {
    id: org.id,
    name: org.name,
    code: org.code,
    fullName: extra.fullName || org.fullName || org.name,
    address: extra.address || (region ? `${region}（演示地址）` : '—'),
    creditCode: extra.creditCode || org.creditCode || org.code,
    region,
    statUnit: org.statUnit || '',
    salesName: org.salesName || '',
    openVersion: org.openVersion || 'formal',
    authStatus: org.authStatus || 'running',
    expireAt: org.expireAt || '',
    trialExpireText: extra.trialExpireText || '未设置',
    activateExpireText: extra.activateExpireText || '未激活',
    grantExpireText: extra.grantExpireText || '未使用',
    remainDays: daysUntil(org.expireAt),
  }
}

export function getOrgApps(orgId: string) {
  if (!store.apps[orgId]) {
    const list = clone(defaultApps())
    if (orgId !== 'o5') {
      const n = Math.max(8, (orgId.charCodeAt(orgId.length - 1) % 9) * 12 + 20)
      list[0].nodeCount = n
      list[1].status = orgId === 'o2' || orgId === 'o6' ? 'pending' : 'running'
      if (list[1].status === 'running') list[1].nodeCount = Math.round(n / 4)
    }
    store.apps[orgId] = list
    persist()
  }
  return clone(store.apps[orgId])
}

export function openOrgApp(orgId: string, appId: string) {
  const list = getOrgApps(orgId)
  const item = list.find((a) => a.id === appId)
  if (!item) return null
  item.status = 'running'
  if (item.nodeCount == null) item.nodeCount = 1
  store.apps[orgId] = list
  persist()
  return clone(item)
}

export function saveOrgApps(orgId: string, apps: OrgAuthorizedApp[]) {
  store.apps[orgId] = clone(apps)
  persist()
  return clone(store.apps[orgId])
}

export function getOrgAppUsage(orgId: string): OrgAppUsageRow[] {
  const apps = getOrgApps(orgId)
  const base = defaultUsage()
  return base.map((row) => {
    const app = apps.find((a) => a.name === row.appName)
    if (!app || app.status === 'pending') {
      return { ...row, lastUsedAt: '—', activeUsers: 0, callCount: 0 }
    }
    if (app.status === 'closed_reopen') {
      return { ...row, activeUsers: Math.min(row.activeUsers, 2), callCount: Math.min(row.callCount, 40) }
    }
    return row
  })
}

export function getOrgManageLogs(org: Org): OrgManageLog[] {
  return defaultLogs(org.name)
}
