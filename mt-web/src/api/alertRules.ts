/* ============================================================
 * MT 管理端「告警规则」API
 * 规则由平台运营统一配置并下发给机构端，数据源与机构端只读视图共用
 * v8Service（localStorage 持久化），保证「平台改 → 机构端即时可见」。
 * ============================================================ */
import { delay, v8Service } from '@/v8/mock/service'
import type { AlertRule, AlertRulePayload } from '@/v8/mock/types'

export interface AlertRuleQuery {
  keyword: string
  type: string
  status: string
}

/** 告警规则列表（内存数据量小，前端筛选，不分页） */
export async function listAlertRules(params: AlertRuleQuery): Promise<AlertRule[]> {
  await delay()
  let list = v8Service.rules()
  const kw = params.keyword.trim()
  if (kw) list = list.filter((r) => r.name.includes(kw) || r.threshold.includes(kw))
  if (params.type) list = list.filter((r) => r.type === params.type)
  if (params.status === 'enabled') list = list.filter((r) => r.enabled)
  if (params.status === 'disabled') list = list.filter((r) => !r.enabled)
  return list
}

/** 新增 / 编辑告警规则 */
export async function saveAlertRule(payload: AlertRulePayload): Promise<AlertRule> {
  await delay(160)
  const list = v8Service.rules()
  // 同一告警类型下规则名称唯一（排除自身）
  const duplicated = list.find(
    (r) => r.type === payload.type && r.name.trim() === payload.name.trim() && r.id !== payload.id,
  )
  if (duplicated) throw new Error('同一告警类型下已存在同名规则')
  return v8Service.saveRule({ ...payload, name: payload.name.trim() })
}

/** 启停规则 */
export async function toggleAlertRule(id: string, enabled: boolean): Promise<AlertRule> {
  await delay(120)
  return v8Service.toggleRule(id, enabled)
}

/** 删除规则 */
export async function deleteAlertRule(id: string): Promise<void> {
  await delay(120)
  v8Service.removeRule(id)
}
