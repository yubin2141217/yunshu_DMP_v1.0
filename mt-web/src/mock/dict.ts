/** 数据字典：字段业务分类 / 内容平台 / 字段数据类型 */

export type DictTypeCode = 'field_biz_category' | 'content_platform' | 'field_data_type'
export type DictItemStatus = 'enabled' | 'disabled'

export interface DictItem {
  id: string
  type: DictTypeCode
  code: string
  name: string
  sort: number
  status: DictItemStatus
  builtin: boolean
  updatedAt: string
}

export const dictTypeOptions: { label: string; value: DictTypeCode }[] = [
  { label: '字段业务分类', value: 'field_biz_category' },
  { label: '内容平台', value: 'content_platform' },
  { label: '字段数据类型', value: 'field_data_type' },
]

export function dictTypeLabel(code: string) {
  return dictTypeOptions.find((t) => t.value === code)?.label || code
}

const STORAGE_KEY = 'yunshu-mt-dict-v1'

function nowText() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function seed(): DictItem[] {
  const at = '2026-09-16 10:00:00'
  const rows: Array<Omit<DictItem, 'id' | 'updatedAt' | 'builtin' | 'status'> & { id: string }> = [
    { id: 'd-cat-1', type: 'field_biz_category', code: '运维管理', name: '运维管理', sort: 10 },
    { id: 'd-cat-2', type: 'field_biz_category', code: '文章', name: '文章', sort: 20 },
    { id: 'd-cat-3', type: 'field_biz_category', code: '作者', name: '作者', sort: 30 },
    { id: 'd-cat-4', type: 'field_biz_category', code: '平台', name: '平台', sort: 40 },
    { id: 'd-cat-5', type: 'field_biz_category', code: '标注', name: '标注', sort: 50 },
    { id: 'd-cat-6', type: 'field_biz_category', code: '其它', name: '其它', sort: 60 },
    { id: 'd-plat-1', type: 'content_platform', code: 'weibo', name: '微博', sort: 10 },
    { id: 'd-plat-2', type: 'content_platform', code: 'wechat', name: '微信公众号', sort: 20 },
    { id: 'd-plat-3', type: 'content_platform', code: 'toutiao', name: '今日头条', sort: 30 },
    { id: 'd-plat-4', type: 'content_platform', code: 'douyin', name: '抖音', sort: 40 },
    { id: 'd-plat-5', type: 'content_platform', code: 'web', name: '网站', sort: 50 },
    { id: 'd-type-1', type: 'field_data_type', code: 'String', name: 'String', sort: 10 },
    { id: 'd-type-2', type: 'field_data_type', code: 'Int', name: 'Int', sort: 20 },
  ]
  return rows.map((r) => ({ ...r, status: 'enabled' as const, builtin: true, updatedAt: at }))
}

function load(): DictItem[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DictItem[]
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    /* ignore */
  }
  return seed()
}

let state = load()

function persist() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function paginateDict<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total: list.length }
}

export const dictMock = {
  list(params: { type?: string; keyword?: string; status?: string }) {
    let list = [...state]
    if (params.type) list = list.filter((i) => i.type === params.type)
    const q = (params.keyword || '').trim()
    if (q) list = list.filter((i) => i.name.includes(q) || i.code.includes(q))
    if (params.status) list = list.filter((i) => i.status === params.status)
    list.sort((a, b) => a.sort - b.sort || a.code.localeCompare(b.code))
    return list
  },

  enabledOptions(type: DictTypeCode) {
    return this.list({ type, status: 'enabled' }).map((i) => ({ label: i.name, value: i.code }))
  },

  save(payload: {
    id?: string
    type: DictTypeCode
    code: string
    name: string
    sort: number
    status: DictItemStatus
  }) {
    const code = payload.code.trim()
    const name = payload.name.trim()
    if (!code) throw new Error('请填写编码')
    if (!name) throw new Error('请填写名称')
    if (state.some((i) => i.type === payload.type && i.code === code && i.id !== payload.id)) {
      throw new Error('同一字典类型下编码不可重复')
    }
    const now = nowText()
    if (payload.id) {
      const idx = state.findIndex((i) => i.id === payload.id)
      if (idx < 0) throw new Error('字典项不存在')
      const prev = state[idx]
      if (prev.builtin && prev.code !== code) throw new Error('预置项编码不可修改')
      state[idx] = {
        ...prev,
        code: prev.builtin ? prev.code : code,
        name,
        sort: Number(payload.sort) || prev.sort,
        status: payload.status,
        updatedAt: now,
      }
      persist()
      return state[idx]
    }
    const item: DictItem = {
      id: `d-${Date.now()}`,
      type: payload.type,
      code,
      name,
      sort: Number(payload.sort) || 0,
      status: payload.status,
      builtin: false,
      updatedAt: now,
    }
    state.push(item)
    persist()
    return item
  },

  toggle(id: string, status: DictItemStatus) {
    const item = state.find((i) => i.id === id)
    if (!item) throw new Error('字典项不存在')
    item.status = status
    item.updatedAt = nowText()
    persist()
    return item
  },

  remove(id: string) {
    const item = state.find((i) => i.id === id)
    if (!item) throw new Error('字典项不存在')
    if (item.builtin) throw new Error('预置字典项不可删除')
    if (item.status === 'enabled') throw new Error('开启状态的字典项不可删除，请先停用')
    state = state.filter((i) => i.id !== id)
    persist()
  },
}
