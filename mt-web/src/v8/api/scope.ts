/* API 内部：获取当前会话用户供方范围 */
import { useUserStore } from '@/v8/store/user'

export function currentScope(): string[] | '*' {
  return useUserStore().scope
}

export function currentUserName(): string {
  return useUserStore().userInfo?.name || '当前用户'
}
