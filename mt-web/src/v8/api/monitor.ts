/* ============================================================
 * V8 业务 API：监控告警（记录/处置/订阅/规则） + 推送回流
 * ============================================================ */
import { delay, v8Service } from '@/v8/mock/service'
import { currentScope, currentUserName } from './scope'
import type {
  AlertQuery,
  AlertRecord,
  AlertRule,
  AlertSubscription,
  DisposePayload,
  PageResult,
  PushBatch,
  PushBatchQuery,
} from '@/v8/mock/types'

/** 告警记录分页（供方范围内） */
export async function getAlerts(q: AlertQuery): Promise<PageResult<AlertRecord>> {
  await delay()
  return v8Service.alertPage(q, currentScope())
}

/** 告警处置闭环（确认/整改/忽略/处理中） */
export async function disposeAlert(id: string, payload: DisposePayload): Promise<AlertRecord | null> {
  await delay(180)
  return v8Service.disposeAlert(id, payload, currentUserName(), currentScope())
}

/** 订阅设置（读） */
export async function getSubscriptions(): Promise<AlertSubscription[]> {
  await delay(120)
  return v8Service.subscriptions()
}

/** 订阅设置（写，持久化） */
export async function saveSubscriptions(list: AlertSubscription[]): Promise<void> {
  await delay(160)
  v8Service.saveSubscriptions(list)
}

/** 告警规则（MT 下发，只读） */
export async function getAlertRules(): Promise<AlertRule[]> {
  await delay(120)
  return v8Service.rules()
}

/** 推送回流批次分页 */
export async function getPushBatches(q: PushBatchQuery): Promise<PageResult<PushBatch>> {
  await delay()
  return v8Service.pushBatches(q, currentScope())
}
