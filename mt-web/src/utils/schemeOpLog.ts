/** 方案审计操作日志（接入 / 推送方案共用） */
export type SchemeOpAction = 'create' | 'update' | 'enable' | 'disable' | 'download'

export interface SchemeOpLog {
  id: string
  /** 操作类型 */
  action: SchemeOpAction
  /** 操作内容 / 修改说明 */
  summary: string
  /** 操作人 */
  operator: string
  /** 操作时间 */
  operatedAt: string
}

export function schemeOpActionLabel(action: SchemeOpAction) {
  if (action === 'create') return '新建'
  if (action === 'update') return '修改'
  if (action === 'enable') return '开启'
  if (action === 'download') return '下载'
  return '停用'
}

export function resolveOperatorName() {
  try {
    const raw = localStorage.getItem('yunshu-mt-user')
    const u = raw ? (JSON.parse(raw) as { name?: string; account?: string } | null) : null
    return (u?.name || u?.account || '').trim() || '平台运营'
  } catch {
    return '平台运营'
  }
}

export function makeOpLog(
  action: SchemeOpAction,
  summary: string,
  opts?: { operator?: string; operatedAt?: string; id?: string },
): SchemeOpLog {
  return {
    id: opts?.id || `oplog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action,
    summary,
    operator: (opts?.operator || resolveOperatorName()).trim() || '平台运营',
    operatedAt: opts?.operatedAt || formatOpTime(),
  }
}

export function prependOpLog(logs: SchemeOpLog[] | undefined, log: SchemeOpLog, max = 50): SchemeOpLog[] {
  return [log, ...(logs || [])].slice(0, max)
}

/** 无历史日志时按创建/更新时间补一条演示审计记录 */
export function ensureSchemeOpLogs(
  logs: SchemeOpLog[] | undefined,
  seed: {
    kind: 'access' | 'push'
    status: 'enabled' | 'disabled'
    createdAt?: string
    updatedAt?: string
    creator?: string
  },
): SchemeOpLog[] {
  if (logs?.length) return logs
  const kindLabel = seed.kind === 'access' ? '接入方案' : '推送方案'
  const creator = seed.creator || '平台运营'
  const createdAt = seed.createdAt || seed.updatedAt || formatOpTime()
  const updatedAt = seed.updatedAt || createdAt
  const result: SchemeOpLog[] = [
    makeOpLog('create', `新建${kindLabel}`, { operator: creator, operatedAt: createdAt, id: `seed_create_${createdAt}` }),
  ]
  if (updatedAt !== createdAt) {
    result.unshift(
      makeOpLog('update', `修改${kindLabel}配置`, {
        operator: creator,
        operatedAt: updatedAt,
        id: `seed_update_${updatedAt}`,
      }),
    )
  }
  result.unshift(
    makeOpLog(seed.status === 'enabled' ? 'enable' : 'disable', seed.status === 'enabled' ? `开启${kindLabel}` : `停用${kindLabel}`, {
      operator: creator,
      operatedAt: updatedAt,
      id: `seed_status_${updatedAt}`,
    }),
  )
  return result
}

function formatOpTime(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
