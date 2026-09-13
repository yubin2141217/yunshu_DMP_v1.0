import {
  channelLabel,
  dataScopeSummary,
  defaultDataConfig,
  delay,
  emptyFilterRule,
  estimateInboundCount,
  paginate,
  pushDedupeFieldOptions,
  pushFilterFieldOptions,
  pushFilterLogicOptions,
  pushFilterOpOptions,
  pushMock,
  pushModeLabel,
  scheduleSummary,
  type PushDataSourceType,
  type PushFilterRule,
  type PushReceiverOrg,
  type PushReceiverType,
  type PushScheme,
  type PushStatus,
} from '@/mock/push'
import { mtMock } from '@/mock/mt'

export async function listPushSchemes(params: {
  keyword?: string
  schemeId?: string
  orgId?: string
  orgName?: string
  supplierId?: string
  supplierName?: string
  schemeName?: string
  channelType?: string
  pushMode?: string
  status?: string
  page: number
  pageSize: number
}) {
  await delay()
  const orgs = mtMock.getOrgs()
  const receivers = pushMock.listReceivers({})
  const list = pushMock.listSchemes(params).map((s) => {
    const mtOrg = orgs.find((o) => o.id === s.orgId)
    if (mtOrg) {
      return {
        ...s,
        orgName: s.orgName || mtOrg.name,
        orgStatUnit: s.orgStatUnit || mtOrg.statUnit || '',
        orgSalesName: s.orgSalesName || mtOrg.salesName || '',
      }
    }
    const recv = receivers.find((r) => r.id === s.orgId)
    if (recv?.relatedMtOrgId) {
      const related = orgs.find((o) => o.id === recv.relatedMtOrgId)
      return {
        ...s,
        orgStatUnit: s.orgStatUnit || related?.statUnit || '',
        orgSalesName: s.orgSalesName || related?.salesName || '',
      }
    }
    return s
  })
  return paginate(list, params.page, params.pageSize)
}

export async function getPushScheme(id: string) {
  await delay()
  const item = pushMock.getScheme(id)
  if (!item) throw new Error('方案不存在')
  return item
}

export async function getPushSchemeKpis() {
  await delay()
  return pushMock.schemeKpis()
}

export async function savePushScheme(
  payload: Omit<PushScheme, 'id' | 'updatedAt' | 'stats'> & { id?: string },
) {
  await delay()
  const res = pushMock.saveScheme(payload)
  if (!res.ok) {
    const map: Record<string, string> = {
      dup: '方案名称已存在',
      file: '文件通道本期不可配置',
      cron: '请填写合法 Cron 表达式（至少 5 段）',
      interval: '请填写大于 0 的间隔分钟数',
      batch: '批量条数上限须为正整数',
      http: '请完善 HTTP 对端接口地址',
      mq: '请完善消息队列地址与 Topic',
      org: '请选择机构',
      datasource: '请填写数据源 ID',
      standard: '请选择接入方案',
    }
    throw new Error(map[res.reason] || '保存失败')
  }
  return res.item
}

export async function togglePushScheme(id: string, status: PushStatus) {
  await delay()
  const item = pushMock.setSchemeStatus(id, status)
  if (!item) throw new Error('方案不存在')
  return item
}

export function pushOrgOptions() {
  return mtMock.orgOptions()
}

export function pushStandardOptions() {
  return mtMock.getSupplyFilterOptions().standards
}

export function pushSupplierOptions() {
  return mtMock.getSupplyFilterOptions().suppliers
}

export async function estimatePushDataCount(params: {
  dataSourceType?: 'standard' | 'datasource'
  dataSourceId?: string
  orgId?: string
  standardIds: string[]
  supplierIds?: string[]
}) {
  await delay(80)
  return estimateInboundCount(params)
}

/** 接收方机构列表 */
export async function listPushReceivers(params: {
  keyword?: string
  status?: string
  relatedMtOrgId?: string
  page?: number
  pageSize?: number
} = {}) {
  await delay()
  const list = pushMock.listReceivers(params)
  const page = params.page || 1
  const pageSize = params.pageSize || 10
  return paginate(list, page, pageSize)
}

/** 接收方机构下拉（启用） */
export function pushReceiverOptions() {
  return pushMock.receiverOptions(true)
}

/** 保存接收方机构 */
export async function savePushReceiver(
  payload: Omit<PushReceiverOrg, 'id' | 'updatedAt'> & { id?: string },
) {
  await delay()
  const res = pushMock.saveReceiver(payload)
  if (!res.ok) {
    const map = {
      dup_code: '机构 ID 已存在',
      dup_name: '机构名称已存在',
      required: '请完善机构 ID、名称与关联机构',
    }
    throw new Error(map[res.reason] || '保存失败')
  }
  return res.item
}

/** 启停接收方机构 */
export async function togglePushReceiver(id: string, status: PushStatus) {
  await delay()
  const item = pushMock.setReceiverStatus(id, status)
  if (!item) throw new Error('接收方机构不存在')
  return item
}

/** 删除接收方机构 */
export async function deletePushReceiver(id: string) {
  await delay()
  const res = pushMock.deleteReceiver(id)
  if (!res.ok) {
    if (res.reason === 'in_use') throw new Error('已被推送方案引用，无法删除')
    throw new Error('接收方机构不存在')
  }
}

export {
  channelLabel,
  dataScopeSummary,
  pushModeLabel,
  scheduleSummary,
  pushChannelOptions,
  pushFilterFieldOptions,
  pushFilterOpOptions,
  pushFilterLogicOptions,
  pushDedupeFieldOptions,
  emptyFilterRule,
  defaultDataConfig,
}
export type {
  PushScheme,
  PushStatus,
  PushFilterRule,
  PushDataSourceType,
  PushReceiverType,
  PushReceiverOrg,
}
