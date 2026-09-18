import {
  dictMock,
  paginateDict,
  type DictItemStatus,
  type DictTypeCode,
} from '@/mock/dict'
import { delay } from '@/mock/mt'

export async function listDictItems(params: {
  type?: string
  keyword?: string
  status?: string
  page: number
  pageSize: number
}) {
  await delay()
  const list = dictMock.list(params)
  return paginateDict(list, params.page, params.pageSize)
}

export async function saveDictItem(payload: {
  id?: string
  type: DictTypeCode
  code: string
  name: string
  sort: number
  status: DictItemStatus
}) {
  await delay()
  return dictMock.save(payload)
}

export async function toggleDictItem(id: string, status: DictItemStatus) {
  await delay()
  return dictMock.toggle(id, status)
}

export async function deleteDictItem(id: string) {
  await delay()
  dictMock.remove(id)
}

/** 开启态选项，供字段库 / 明细筛选等下拉使用 */
export function dictSelectOptions(type: DictTypeCode) {
  return dictMock.enabledOptions(type)
}

export {
  dictTypeLabel,
  dictTypeOptions,
  type DictItem,
  type DictItemStatus,
  type DictTypeCode,
} from '@/mock/dict'
