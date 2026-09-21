import { delay, v8Mock, type Standard } from '@/v8/mock/v8'

/**
 * 读取 MT 管理端桥接下发的生效接入方案（可多份）。
 * 供数方送数方案由 MT 维护，V8 端只读预览/下载。
 */
export async function getEnabledStandard(): Promise<Standard | null> {
  await delay()
  return v8Mock.getEnabledStandard()
}

export async function getEnabledStandards(): Promise<Standard[]> {
  await delay()
  return v8Mock.getEnabledStandards()
}
