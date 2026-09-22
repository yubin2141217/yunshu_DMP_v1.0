import {
  delay,
  mtMock,
  type BizCategory,
  type Metadata,
  type Org,
  type OrgAuthStatus,
  type OrgOpenVersion,
  type Scheme,
  type Standard,
  type StandardScope,
  type Status,
  type Supplier,
} from '@/mock/mt'
import { ensureOrgStaff, queryOrgStaff, type OrgStaffKpiFilter } from '@/mock/orgStaff'
import {
  buildOrgProfile,
  getOrgAppUsage,
  getOrgApps,
  getOrgManageLogs,
  openOrgApp,
  saveOrgApps,
  type OrgAuthorizedApp,
} from '@/mock/orgApps'
import { checkLogin } from '@/utils/auth'
import { expireSoon } from '@/utils/orgLicense'

export async function loginApi(account: string, password: string) {
  await delay(180)
  const result = checkLogin(account, password)
  if (!result.ok) throw new Error(result.userNameError || result.passwordError || '用户名或密码不正确')
  return {
    token: 'mt-demo-token',
    userInfo: { name: '王运营', account, role: '平台运营' },
  }
}

export async function listSuppliers(params: { name: string; status: string; page: number; pageSize: number }) {
  await delay()
  let list = mtMock.getSuppliers()
  if (params.name) list = list.filter((s) => s.name.includes(params.name))
  if (params.status) list = list.filter((s) => s.status === params.status)
  return mtMock.paginate(list, params.page, params.pageSize)
}

export async function saveSupplier(payload: { id?: string; name: string; code: string; status: Status; logo: string }) {
  await delay()
  if (mtMock.nameExists(payload.name, payload.id)) throw new Error('供数方名称已存在')
  if (mtMock.codeExists(payload.code, payload.id)) throw new Error('编码已存在')
  return payload.id ? mtMock.updateSupplier(payload.id, payload) : mtMock.createSupplier(payload)
}

export async function toggleSupplier(id: string, status: Status) {
  await delay()
  return mtMock.setSupplierStatus(id, status)
}

export async function rotateAppkey(id: string) {
  await delay()
  const item = mtMock.rotateAppkey(id)
  if (!item) throw new Error('供数方不存在')
  return item
}

/** 供数方页别名 */
export const rotateSupplierAppkey = rotateAppkey

export async function deleteSupplier(id: string) {
  await delay()
  return mtMock.removeSupplier(id)
}

/** 机构管理列表：授权状态 KPI + 筛选分页 */
export async function listManagedOrgs(params: {
  keyword: string
  statUnit: string
  salesName: string
  openVersion: string
  authStatus: string
  page: number
  pageSize: number
}) {
  await delay()
  const all = mtMock.getOrgs()
  const kpis = {
    total: all.length,
    running: all.filter((o) => (o.authStatus || 'running') === 'running').length,
    expired: all.filter((o) => o.authStatus === 'expired').length,
    closed: all.filter((o) => o.authStatus === 'closed').length,
    disabled: all.filter((o) => o.authStatus === 'disabled').length,
    expiringSoon: all.filter((o) => expireSoon(o.expireAt)).length,
  }
  let list = all.slice()
  const q = params.keyword.trim()
  if (q) {
    list = list.filter(
      (o) =>
        o.name.includes(q) ||
        (o.fullName || '').includes(q) ||
        (o.code || '').includes(q) ||
        (o.creditCode || '').includes(q),
    )
  }
  if (params.statUnit) list = list.filter((o) => (o.statUnit || '') === params.statUnit)
  if (params.salesName) list = list.filter((o) => (o.salesName || '') === params.salesName)
  if (params.openVersion) list = list.filter((o) => (o.openVersion || 'formal') === params.openVersion)
  if (params.authStatus) list = list.filter((o) => (o.authStatus || 'running') === params.authStatus)
  const statUnits = [...new Set(all.map((o) => o.statUnit).filter(Boolean))] as string[]
  const salesNames = [...new Set(all.map((o) => o.salesName).filter(Boolean))] as string[]
  return {
    ...mtMock.paginate(list, params.page, params.pageSize),
    kpis,
    filterOptions: {
      statUnits: statUnits.map((v) => ({ label: v, value: v })),
      salesNames: salesNames.map((v) => ({ label: v, value: v })),
    },
  }
}

/** 快捷开通机构（原型：写入本地 Mock） */
export async function createManagedOrg(payload: {
  name: string
  code: string
  statUnit?: string
  salesName?: string
  region?: string
  openVersion?: OrgOpenVersion
  expireAt?: string
}) {
  await delay()
  const res = mtMock.createOrg({
    name: payload.name,
    code: payload.code,
    supplierIds: [],
    statUnit: payload.statUnit,
    salesName: payload.salesName,
    region: payload.region,
    openVersion: payload.openVersion || 'formal',
    authStatus: 'running',
    expireAt: payload.expireAt,
  })
  if (!res.ok) {
    if (res.reason === 'dup') throw new Error('机构名称已存在')
    if (res.reason === 'dupCode') throw new Error('机构编码已存在')
    throw new Error('请完整填写机构名称与编码')
  }
  ensureOrgStaff(res.item.id)
  return res.item
}

/** 机构授权详情（应用授权 / 使用情况 / 操作日志） */
export async function getManagedOrg(id: string) {
  await delay()
  const org = mtMock.getOrgs().find((o) => o.id === id)
  if (!org) throw new Error('机构不存在')
  return {
    profile: buildOrgProfile(org),
    apps: getOrgApps(id),
    usage: getOrgAppUsage(id),
    logs: getOrgManageLogs(org),
  }
}

/** 立即开通某个应用 */
export async function openManagedOrgApp(orgId: string, appId: string) {
  await delay()
  const item = openOrgApp(orgId, appId)
  if (!item) throw new Error('应用不存在')
  return item
}

/** 保存机构应用授权配置 */
export async function saveManagedOrgApps(orgId: string, apps: OrgAuthorizedApp[]) {
  await delay()
  if (!mtMock.getOrgs().some((o) => o.id === orgId)) throw new Error('机构不存在')
  return saveOrgApps(orgId, apps)
}

/** 机构下拉（用户管理切换机构） */
export async function listOrgOptions() {
  await delay(80)
  return mtMock.getOrgs().map((o) => ({
    id: o.id,
    name: o.name,
    code: o.code,
    label: `${o.name}（${o.code}）`,
    value: o.id,
  }))
}

/** 机构用户列表 */
export async function listOrgStaff(params: {
  orgId: string
  enabled: boolean
  role: string
  keyword: string
  kpi: OrgStaffKpiFilter
  page: number
  pageSize: number
}) {
  await delay()
  const org = mtMock.getOrgs().find((o) => o.id === params.orgId) as Org | undefined
  return {
    ...queryOrgStaff(params),
    org: org || null,
  }
}

export type { OrgAuthStatus, OrgOpenVersion, OrgStaffKpiFilter, OrgAuthorizedApp }

export async function listOrgs(params: { name: string; page: number; pageSize: number }) {
  await delay()
  let list = mtMock.getOrgs()
  if (params.name) {
    const q = params.name.trim()
    list = list.filter((o) => o.name.includes(q) || (o.code || '').includes(q))
  }
  return {
    ...mtMock.paginate(list, params.page, params.pageSize),
    enabledSuppliers: mtMock.enabledSuppliers(),
    enabledStandards: mtMock.enabledStandardOptions(),
    availableCatalog: mtMock.availableOrgCatalog(),
  }
}

/** 机构供数配置列表：按接入方案 × 供数方展开 */
export async function listOrgBindings(params: { name: string; page: number; pageSize: number }) {
  await delay()
  let list = mtMock.getOrgBindings()
  if (params.name) {
    const q = params.name.trim()
    list = list.filter(
      (r) =>
        r.orgName.includes(q) ||
        r.orgCode.includes(q) ||
        r.standardName.includes(q) ||
        r.supplierName.includes(q),
    )
  }
  return {
    ...mtMock.paginate(list, params.page, params.pageSize),
    enabledSuppliers: mtMock.enabledSuppliers(),
    enabledStandards: mtMock.enabledStandardOptions(),
    availableCatalog: mtMock.availableOrgCatalog(),
  }
}

export async function getSupplyFilterOptions() {
  await delay()
  return mtMock.getSupplyFilterOptions()
}

export async function getSupplyStats(filter: {
  orgIds?: string[]
  standardIds?: string[]
  supplierIds?: string[]
  timeRange?: 'today' | '3d' | '1w' | '1m'
} = {}) {
  await delay()
  return mtMock.getSupplyStats(filter)
}

export async function getSupplyTrend(filter: {
  orgIds?: string[]
  standardIds?: string[]
  supplierIds?: string[]
  timeRange?: 'today' | '3d' | '1w' | '1m'
} = {}) {
  await delay()
  return mtMock.getSupplyTrend(filter)
}

export async function saveOrg(
  orgId: string,
  payload:
    | string[]
    | {
        supplierIds: string[]
        standardId?: string
        standardIds?: string[]
        code?: string
        remark?: string
      },
) {
  await delay()
  const body = Array.isArray(payload) ? { supplierIds: payload } : payload
  const res = mtMock.saveOrgConfig(orgId, body)
  if (!res) throw new Error('机构不存在')
  if ('ok' in res && res.ok === false) {
    if (res.reason === 'dupCode') throw new Error('机构编码已存在')
    if (res.reason === 'code') throw new Error('请填写机构编码')
    throw new Error('保存失败')
  }
  return 'item' in res ? res.item : res
}

export async function createOrg(payload: {
  name: string
  code: string
  supplierIds: string[]
  standardId?: string
  standardIds?: string[]
  remark?: string
}) {
  await delay()
  if (!payload.name?.trim()) throw new Error('请填写机构名称')
  if (!payload.code?.trim()) throw new Error('请填写机构编码')
  const res = mtMock.createOrg(payload)
  if (!res.ok) {
    if (res.reason === 'dup') throw new Error('机构名称已存在')
    if (res.reason === 'dupCode') throw new Error('机构编码已存在')
    if (res.reason === 'code') throw new Error('请填写机构编码')
    throw new Error('创建失败')
  }
  return res.item
}

export async function toggleOrg(id: string, status: Status) {
  await delay()
  const item = mtMock.setOrgStatus(id, status)
  if (!item) throw new Error('机构不存在')
  return item
}

export async function listMetadata(params: {
  name: string
  status: string
  page: number
  pageSize: number
  bizCategory?: string
}) {
  await delay()
  let list = mtMock.getMetadataWithRefCount()
  if (params.name) {
    const q = params.name.trim()
    list = list.filter(
      (m) =>
        m.name.includes(q) ||
        m.description?.includes(q) ||
        m.code.includes(q),
    )
  }
  if (params.bizCategory) list = list.filter((m) => (m.bizCategory || '') === params.bizCategory)
  if (params.status) list = list.filter((m) => m.status === params.status)
  return mtMock.paginate(list, params.page, params.pageSize)
}

export async function listStandardsByField(fieldId: string) {
  await delay()
  return mtMock.listStandardsByFieldId(fieldId)
}

export async function getMetadata(id: string) {
  await delay()
  return mtMock.findMetadata(id)
}

/** 轻量：全部启用字段（保持最新写入优先顺序），供字段选择器导入后即时刷新 */
export async function listEnabledMetadata() {
  await delay(0)
  return mtMock.enabledMetadata()
}

export async function saveMetadata(payload: Metadata) {
  await delay()
  if (!payload.name?.trim()) throw new Error('请填写字段名')
  if (!payload.description?.trim()) throw new Error('请填写描述')
  if (!payload.dataType?.trim()) throw new Error('请填写数据类型')
  if (mtMock.metadataNameExists(payload.name, payload.id)) throw new Error('字段名已存在')
  return mtMock.saveMetadata(payload)
}

/** 批量新增字段；本批内及库中字段名均不可重复 */
export async function saveMetadataBatch(
  rows: Array<{
    name: string
    description: string
    dataType: string
    length?: string
    defaultValue?: string
    bizCategory?: string
    remark?: string
    status?: Status
  }>,
) {
  await delay()
  if (!rows?.length) throw new Error('请至少填写一条字段')
  const names = rows.map((r) => r.name.trim())
  const emptyIdx = names.findIndex((n) => !n)
  if (emptyIdx >= 0) throw new Error(`第 ${emptyIdx + 1} 行请填写字段名`)
  const seen = new Set<string>()
  for (let i = 0; i < names.length; i++) {
    const n = names[i]
    if (seen.has(n)) throw new Error(`字段名「${n}」在本批中重复，请修改后再提交`)
    seen.add(n)
    if (mtMock.metadataNameExists(n)) throw new Error(`字段名「${n}」已存在，请修改后再提交`)
  }
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row.description?.trim()) throw new Error(`第 ${i + 1} 行请填写描述`)
    if (!row.dataType?.trim()) throw new Error(`第 ${i + 1} 行请选择数据类型`)
  }
  const saved = rows.map((row) =>
    mtMock.saveMetadata({
      name: row.name,
      description: row.description,
      dataType: row.dataType,
      length: row.length || '',
      defaultValue: row.defaultValue || '',
      bizCategory: (row.bizCategory || '') as BizCategory | '',
      remark: row.remark || '',
      status: (row.status || 'enabled') as Status,
    }),
  )
  if (saved.some((item) => !item)) throw new Error('保存失败')
  return saved.filter(Boolean)
}

export async function checkMetadataNameExists(name: string, exceptId?: string) {
  await delay(0)
  return mtMock.metadataNameExists(name, exceptId)
}

export async function toggleMetadata(id: string, status: Status) {
  await delay()
  return mtMock.setMetadataStatus(id, status)
}

export async function toggleMetadataBatch(ids: string[], status: Status) {
  await delay()
  return ids.map((id) => mtMock.setMetadataStatus(id, status)).filter(Boolean)
}

export async function deleteMetadata(id: string) {
  await delay()
  return mtMock.removeMetadata(id)
}

export async function listMetadataByIds(ids: string[]) {
  await delay()
  const order = ids.map(String).filter(Boolean)
  const all = mtMock.getMetadataWithRefCount()
  const map = new Map(all.map((m) => [m.id, m]))
  return order.map((id) => map.get(id)).filter((m): m is NonNullable<typeof m> => Boolean(m))
}

export async function saveMetadataBatchUpdate(
  rows: Array<{
    id: string
    name: string
    description: string
    dataType: string
    length?: string
    defaultValue?: string
    bizCategory?: string
    remark?: string
    status?: Status
  }>,
) {
  await delay()
  if (!rows?.length) throw new Error('请至少保留一条字段')
  const names = rows.map((r) => r.name.trim())
  const emptyIdx = names.findIndex((n) => !n)
  if (emptyIdx >= 0) throw new Error(`第 ${emptyIdx + 1} 行请填写字段名`)
  const seen = new Set<string>()
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const n = names[i]
    if (seen.has(n)) throw new Error(`字段名「${n}」在本批中重复，请修改后再提交`)
    seen.add(n)
    if (!row.id) throw new Error(`第 ${i + 1} 行缺少字段 ID`)
    if (!row.description?.trim()) throw new Error(`第 ${i + 1} 行请填写描述`)
    if (!row.dataType?.trim()) throw new Error(`第 ${i + 1} 行请选择数据类型`)
    if (mtMock.metadataNameExists(n, row.id)) throw new Error(`字段名「${n}」已存在，请修改后再提交`)
  }
  const saved = rows.map((row) =>
    mtMock.saveMetadata({
      id: row.id,
      name: row.name,
      description: row.description,
      dataType: row.dataType,
      length: row.length || '',
      defaultValue: row.defaultValue || '',
      bizCategory: (row.bizCategory || '') as BizCategory | '',
      remark: row.remark || '',
      status: (row.status || 'enabled') as Status,
    }),
  )
  if (saved.some((item) => !item)) throw new Error('保存失败')
  return saved.filter(Boolean)
}

export async function deleteMetadataBatch(ids: string[]) {
  await delay()
  const deleted: string[] = []
  const skipped: string[] = []
  for (const id of ids) {
    const item = mtMock.findMetadata(id)
    if (item?.status === 'enabled') {
      skipped.push(item.name || id)
      continue
    }
    const res = mtMock.removeMetadata(id)
    if (res.ok) deleted.push(item?.name || id)
    else skipped.push(item?.name || id)
  }
  return { deleted, skipped }
}

export async function listFieldTemplates(params?: { name?: string; type?: string }) {
  await delay()
  let list = mtMock.getFieldTemplates()
  if (params?.name?.trim()) {
    const q = params.name.trim()
    list = list.filter((t) => t.name.includes(q) || (t.desc || '').includes(q))
  }
  if (params?.type === 'system' || params?.type === 'custom') {
    list = list.filter((t) => t.type === params.type)
  }
  return list
}

export async function getFieldTemplate(id: string) {
  await delay()
  return mtMock.getFieldTemplates().find((t) => t.id === id) || null
}

export async function saveFieldTemplate(payload: {
  id?: string
  name: string
  desc?: string
  fieldIds: string[]
  fieldMaps?: import('@/mock/mt').FieldMapItem[]
}) {
  await delay()
  const res = mtMock.saveFieldTemplate(payload)
  if (!res.ok) {
    if (res.reason === 'name') throw new Error('请填写模板名称')
    if (res.reason === 'fields') throw new Error('请至少选择一个字段')
    if (res.reason === 'dupName') throw new Error('模板名称已存在')
    if (res.reason === 'dupSet') throw new Error('已存在相同字段组合的模板')
    if (res.reason === 'system') throw new Error('系统内置模板不可修改')
    throw new Error('保存失败')
  }
  return res.item
}

export async function deleteFieldTemplate(id: string) {
  await delay()
  const res = mtMock.removeFieldTemplate(id)
  if (!res.ok) {
    if (res.reason === 'system') throw new Error('系统内置模板不可删除')
    throw new Error('删除失败')
  }
  return true
}

export async function listSchemes(params: {
  name: string
  status: string
  dataSourceType?: string
  page: number
  pageSize: number
}) {
  await delay()
  let list = mtMock.getSchemes()
  if (params.name) list = list.filter((s) => s.name.includes(params.name))
  if (params.status) list = list.filter((s) => s.status === params.status)
  if (params.dataSourceType) list = list.filter((s) => (s.dataSourceType || 'table') === params.dataSourceType)
  return mtMock.paginate(list, params.page, params.pageSize)
}

export async function getScheme(id: string) {
  await delay()
  return mtMock.findScheme(id)
}

export async function saveScheme(payload: Scheme) {
  await delay()
  if (mtMock.schemeNameExists(payload.name, payload.id)) throw new Error('方案名称已存在')
  return mtMock.saveScheme(payload)
}

export async function toggleScheme(id: string, status: Status) {
  await delay()
  return mtMock.setSchemeStatus(id, status)
}

export async function deleteScheme(id: string) {
  await delay()
  return mtMock.removeScheme(id)
}

export async function listStandards(params: {
  name: string
  schemeId?: string
  orgId?: string
  orgName?: string
  supplierId?: string
  supplierName?: string
  accessMethod?: string
  status: string
  page: number
  pageSize: number
}) {
  await delay()
  let list = mtMock.getStandards()
  if (params.schemeId?.trim()) {
    list = list.filter((s) => s.id === params.schemeId)
  } else if (params.name?.trim()) {
    const q = params.name.trim().toLowerCase()
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.schemeNo || '').includes(q) ||
        s.id.toLowerCase().includes(q),
    )
  }
  if (params.orgId?.trim()) {
    list = list.filter((s) => s.orgId === params.orgId)
  } else if (params.orgName?.trim()) {
    const q = params.orgName.trim()
    list = list.filter((s) => (s.orgName || '').includes(q))
  }
  if (params.supplierId) {
    list = list.filter((s) => s.supplierId === params.supplierId)
  } else if (params.supplierName?.trim()) {
    const q = params.supplierName.trim()
    list = list.filter((s) => (s.supplierName || '').includes(q))
  }
  if (params.accessMethod) {
    list = list.filter((s) => (s.accessMethod || 'http_post') === params.accessMethod)
  }
  if (params.status) list = list.filter((s) => s.status === params.status)
  return {
    ...mtMock.paginate(list, params.page, params.pageSize),
    metadata: mtMock.enabledMetadata(),
    schemes: mtMock.enabledSchemes(),
    orgs: mtMock.orgOptions(),
    suppliers: mtMock.enabledSuppliers().map((s) => ({ label: s.name, value: s.id })),
    kpis: mtMock.getStandardListKpis(),
  }
}

export async function getStandardListKpis() {
  await delay(0)
  return mtMock.getStandardListKpis()
}

export async function listAccessVolumePreview(params: {
  standardId: string
  range: import('@/mock/mt').AccessVolumeRange
  page?: number
  pageSize?: number
}) {
  await delay()
  return mtMock.listAccessVolumePreview(
    params.standardId,
    params.range,
    params.page || 1,
    params.pageSize || 20,
  )
}

export async function getStandard(id: string) {
  await delay()
  return mtMock.findStandard(id)
}

/** 方案名称是否已存在（编辑时传 exceptId 排除自身） */
export async function checkStandardNameExists(name: string, exceptId?: string) {
  await delay(0)
  return mtMock.standardNameExists(name, exceptId)
}

export async function checkEndpointUrlExists(url: string, exceptId?: string) {
  await delay(0)
  return mtMock.endpointUrlExists(url, exceptId)
}

export async function saveStandard(
  payload: Partial<Standard> & {
    name: string
    fieldIds?: string[]
    fieldMaps?: import('@/mock/mt').FieldMapItem[]
    metadataId?: string
    scope?: StandardScope
    orgId?: string
    supplierId?: string
    accessMethod?: import('@/mock/mt').AccessMethodType
    apiAccess?: import('@/mock/mt').ApiAccessConfig
    mqAccess?: import('@/mock/mt').MqAccessConfig
    fileAccess?: import('@/mock/mt').FileAccessConfig
    requireIpWhitelist?: boolean
    remark?: string
  },
) {
  await delay()
  if (mtMock.standardNameExists(payload.name, payload.id)) {
    throw new Error('方案名称已存在，不允许添加同名接入方案')
  }
  const res = mtMock.saveStandard(payload)
  if (!res.ok) {
    if (res.reason === 'meta') throw new Error('请勾选已启用的字段库字段')
    if (res.reason === 'api') throw new Error('请完善当前接入方式的必填配置项')
    if (res.reason === 'org') throw new Error('请选择机构')
    if (res.reason === 'supplier') throw new Error('请选择供数方')
    if (res.reason === 'conflict') {
      throw new Error(`同机构 + 同供数方已存在启用方案「${(res as { conflictName?: string }).conflictName || ''}」，请先停用后再启用`)
    }
    throw new Error('保存失败')
  }
  return res.item
}

export async function testAccessConnectivity(payload: {
  accessMethod?: import('@/mock/mt').AccessMethodType
  apiAccess?: import('@/mock/mt').ApiAccessConfig
  mqAccess?: import('@/mock/mt').MqAccessConfig
  fileAccess?: import('@/mock/mt').FileAccessConfig
}) {
  await delay(480)
  return mtMock.testAccessConnectivity(payload)
}

export async function toggleStandard(id: string, status: Status) {
  await delay()
  const res = mtMock.setStandardStatus(id, status)
  if (!res.ok) {
    if (res.reason === 'meta') throw new Error('绑定的字段库字段未启用')
    if (res.reason === 'api') throw new Error('接口接入方式未配置完整，无法启用')
    if (res.reason === 'conflict') {
      throw new Error(`同机构 + 同供数方已存在启用方案「${(res as { conflictName?: string }).conflictName || ''}」，请先停用后再启用`)
    }
    throw new Error('操作失败')
  }
  return res.item
}

export async function deleteStandard(id: string) {
  await delay()
  const res = mtMock.removeStandard(id)
  if (!res.ok) {
    if ((res as { reason?: string }).reason === 'enabled') {
      throw new Error('开启状态的方案不可删除，请先停用')
    }
    throw new Error('删除失败')
  }
  return res
}

export async function listIpWhitelist(params?: {
  ip?: string
  supplierId?: string
  status?: string
  page?: number
  pageSize?: number
}) {
  await delay()
  let list = mtMock.getIpWhitelist()
  if (params?.ip) list = list.filter((x) => x.ip.includes(params.ip!))
  if (params?.supplierId) list = list.filter((x) => x.supplierId === params.supplierId)
  if (params?.status) list = list.filter((x) => x.status === params.status)
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  return mtMock.paginate(list, page, pageSize)
}

export async function addIpWhitelist(ip: string, remark?: string, supplierId?: string) {
  await delay()
  const res = mtMock.addIpWhitelist(ip, remark, supplierId)
  if (!res.ok) {
    if (res.reason === 'dup') throw new Error('该 IP 已在白名单中')
    throw new Error('请填写 IP')
  }
  return res.item
}

/** 按厂商批量添加 IP（换行 / 逗号分隔） */
export async function addIpWhitelistBatch(payload: {
  supplierId: string
  ipsText: string
  remark?: string
  status?: 'enabled' | 'disabled'
}) {
  await delay()
  if (!payload.supplierId) throw new Error('请选择供数方（厂商）')
  const ips = payload.ipsText
    .split(/[\n,，;；\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!ips.length) throw new Error('请至少填写一个 IP')
  const res = mtMock.addIpWhitelistBatch({
    supplierId: payload.supplierId,
    ips,
    remark: payload.remark,
    status: payload.status,
  })
  if (!res.ok) throw new Error('请选择有效的供数方')
  return res
}

export async function toggleIpWhitelist(id: string, status: 'enabled' | 'disabled') {
  await delay()
  const res = mtMock.toggleIpWhitelist(id, status)
  if (!res.ok) throw new Error('白名单不存在')
  return res.item
}

export async function removeIpWhitelist(id: string) {
  await delay()
  return mtMock.removeIpWhitelist(id)
}

/** 白名单页别名 */
export const listWhitelist = listIpWhitelist
export const addWhitelist = addIpWhitelistBatch
export const deleteWhitelist = removeIpWhitelist
export const toggleWhitelist = toggleIpWhitelist

export function supplierSelect() {
  return mtMock.getSuppliers().map((s) => ({ label: s.name, value: s.id }))
}

export type { Supplier }
