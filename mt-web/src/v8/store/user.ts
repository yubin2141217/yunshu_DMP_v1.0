import { defineStore } from 'pinia'
import type { MenuKey, V8Role, V8UserInfo } from '@/v8/mock/types'

const TOKEN_KEY = 'yunshu-v8-token'
const USER_KEY = 'yunshu-v8-user'

function readUser(): V8UserInfo | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<V8UserInfo>
    // 兼容旧版账密会话（无 menus/scope 字段）：识别后要求重新扫码登录
    if (!parsed || !parsed.menus || !parsed.supplierScope || !parsed.orgId) return null
    return parsed as V8UserInfo
  } catch {
    return null
  }
}

/**
 * 启动时清洗残缺会话：
 * 旧版账密登录可能只留下 token、却没有新版权限字段，
 * 此时若保留 token，路由守卫会误判为"已登录但无机构"并陷入受限态死循环。
 * token 与完整用户信息不配套时，一并清除。
 */
function sanitizeLegacySession(): { token: string; user: V8UserInfo | null } {
  const token = localStorage.getItem(TOKEN_KEY) || ''
  const user = readUser()
  if (token && !user) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    return { token: '', user: null }
  }
  return { token, user }
}

const initialSession = sanitizeLegacySession()

export const useUserStore = defineStore('v8User', {
  state: () => ({
    token: initialSession.token,
    userInfo: initialSession.user,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token && !!state.userInfo,
    isAdmin: (state) => state.userInfo?.role === 'admin',
    /** 当前用户可见供方范围（数组或 '*'） */
    scope: (state): string[] | '*' => state.userInfo?.supplierScope ?? [],
    /** 水印文本：用户名·手机后四位·日期 */
    watermarkText(state): string {
      const u = state.userInfo
      if (!u) return ''
      const d = new Date()
      const p = (n: number) => (n < 10 ? `0${n}` : String(n))
      const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
      return `${u.name}·${u.phoneTail}·${date}`
    },
  },
  actions: {
    setSession(token: string, userInfo: V8UserInfo) {
      this.token = token
      this.userInfo = userInfo
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(userInfo))
    },
    /** 是否拥有某菜单权限 */
    can(menu: MenuKey): boolean {
      const menus = this.userInfo?.menus
      return menus === '*' || !!menus?.includes(menu)
    },
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
  },
})

export type { V8UserInfo, V8Role }
