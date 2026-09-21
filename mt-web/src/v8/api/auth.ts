/* ============================================================
 * V8 认证适配层
 * 真实环境对接公司统一微信扫码认证 + V8 应用集成中心；
 * 本期 Mock：扫码确认后以机构管理员身份建立会话（全菜单 + 全供方）。
 * ============================================================ */
import { delay } from '@/v8/mock/service'
import type { V8UserInfo } from '@/v8/mock/types'
import { MENU_KEYS } from '@/v8/mock/types'

export type QrStatus = 'waiting' | 'scanned' | 'confirmed' | 'expired'

export interface QrSession {
  qrToken: string
  status: QrStatus
  /** 倒计时剩余秒数 */
  ttl: number
}

/** 申请登录二维码（Mock：返回一个会话令牌与有效期） */
export async function createQrSession(): Promise<{ qrToken: string; ttl: number; qrPayload: string }> {
  await delay(160)
  const qrToken = `qr-${Date.now()}`
  return {
    qrToken,
    ttl: 60,
    qrPayload: `https://v8.example.com/scan-login?token=${qrToken}`,
  }
}

/** 轮询扫码状态。Mock 通过内存状态机推进，见 scanMock/confirmMock。 */
const qrState = new Map<string, QrStatus>()

export async function pollQrStatus(qrToken: string): Promise<QrStatus> {
  await delay(120)
  return qrState.get(qrToken) || 'waiting'
}

/** 演示：模拟用户用微信扫码 */
export function simulateScan(qrToken: string) {
  qrState.set(qrToken, 'scanned')
}

/** 演示：模拟用户在微信端确认登录 */
export function simulateConfirm(qrToken: string) {
  qrState.set(qrToken, 'confirmed')
}

export function expireQr(qrToken: string) {
  qrState.set(qrToken, 'expired')
}

/** 扫码确认后换取会话（机构管理员） */
export async function exchangeSession(qrToken: string): Promise<{ token: string; userInfo: V8UserInfo }> {
  await delay(200)
  if (qrState.get(qrToken) !== 'confirmed') {
    throw new Error('扫码尚未确认，请在微信端完成确认')
  }
  const userInfo: V8UserInfo = {
    id: 'u1',
    userName: 'wx_li••••',
    name: '李机构',
    phoneTail: '6688',
    orgId: 'org-wxb-01',
    orgName: '某市互联网信息办公室',
    role: 'admin',
    menus: [...MENU_KEYS],
    supplierScope: '*',
    status: 'enabled',
  }
  return { token: `v8-token-${Date.now()}`, userInfo }
}

/** 演示专用：一键以机构管理员登录（原型演示，正式环境隐藏） */
export async function demoAdminLogin(): Promise<{ token: string; userInfo: V8UserInfo }> {
  await delay(160)
  const userInfo: V8UserInfo = {
    id: 'u1',
    userName: 'wx_li••••',
    name: '李机构',
    phoneTail: '6688',
    orgId: 'org-wxb-01',
    orgName: '某市互联网信息办公室',
    role: 'admin',
    menus: [...MENU_KEYS],
    supplierScope: '*',
    status: 'enabled',
  }
  return { token: `v8-token-${Date.now()}`, userInfo }
}
