/* ============================================================
 * V8 业务 API：消息 / 接入规范 / 机构授权 / 用户权限 / 个人设置
 * ============================================================ */
import { delay, v8Service } from '@/v8/mock/service'
import { currentScope, currentUserName } from './scope'
import type {
  DownloadLog,
  OrgInfo,
  OrgUser,
  ProfileSetting,
  SpecVersion,
  UpdateUserPermissionPayload,
  V8Message,
  V8UserInfo,
} from '@/v8/mock/types'

// ── 消息中心 ──
export async function getMessages(): Promise<V8Message[]> {
  await delay(120)
  return v8Service.messages(currentScope())
}

export async function getUnreadCount(): Promise<number> {
  await delay(60)
  return v8Service.unreadCount(currentScope())
}

export async function markMessageRead(id: string): Promise<V8Message | null> {
  await delay(100)
  return v8Service.markRead(id, currentScope())
}

export async function markAllMessagesRead(): Promise<void> {
  await delay(100)
  v8Service.markAllRead(currentScope())
}

// ── 接入规范 ──
export async function getSpecVersions(): Promise<SpecVersion[]> {
  await delay(120)
  return v8Service.specVersions()
}

export async function getActiveSpec(): Promise<SpecVersion> {
  await delay(120)
  return v8Service.activeSpec()
}

/** 下载规范（生成留痕记录） */
export async function logSpecDownload(version: string): Promise<DownloadLog> {
  await delay(120)
  return v8Service.logDownload(version, currentUserName())
}

/** 规范下载留痕记录 */
export function getDownloadLogs(): DownloadLog[] {
  return v8Service.downloadLogs()
}

// ── 机构与授权信息 ──
export async function getOrgInfo(): Promise<OrgInfo> {
  await delay(120)
  return v8Service.orgInfo()
}

// ── 用户与数据权限 ──
export async function getOrgUsers(): Promise<OrgUser[]> {
  await delay(140)
  return v8Service.orgUsers()
}

export async function updateUserPermission(userId: string, payload: UpdateUserPermissionPayload): Promise<OrgUser | null> {
  await delay(180)
  return v8Service.updateUserPermission(userId, payload)
}

export async function toggleUserStatus(userId: string): Promise<OrgUser | null> {
  await delay(140)
  return v8Service.toggleUserStatus(userId)
}

// ── 个人设置 ──
export async function getProfile(user: V8UserInfo): Promise<ProfileSetting> {
  await delay(100)
  return v8Service.profile(user)
}

export async function saveProfile(setting: ProfileSetting): Promise<void> {
  await delay(140)
  v8Service.saveProfile(setting)
}
