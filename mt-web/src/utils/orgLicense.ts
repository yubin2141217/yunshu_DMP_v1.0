import type { OrgAuthStatus, OrgOpenVersion } from '@/mock/mt'

export const OPEN_VERSION_LABEL: Record<OrgOpenVersion, string> = {
  formal: '正式版',
  trial: '试用版',
}

export const AUTH_STATUS_LABEL: Record<OrgAuthStatus, string> = {
  running: '已开通',
  expired: '已到期',
  closed: '已关闭',
  disabled: '已禁用',
}

export function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function daysUntil(expireAt?: string, from = todayISO()) {
  if (!expireAt) return null
  const a = Date.parse(`${expireAt}T00:00:00`)
  const b = Date.parse(`${from}T00:00:00`)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return Math.round((a - b) / 86400000)
}

export function expireSoon(expireAt?: string, withinDays = 30) {
  const days = daysUntil(expireAt)
  return days != null && days >= 0 && days <= withinDays
}
