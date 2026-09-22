/* V8 机构端导航菜单定义（顺序即展示顺序），权限点与路由 meta.menuKey 对应 */
import type { MenuKey } from '@/v8/mock/types'

export interface V8MenuItem {
  key: MenuKey
  title: string
  path: string
}

/**
 * 一级导航结构：
 * - message / settings 不在主导航展示，分别由顶栏铃铛、头像入口直达；
 * - 「系统设置」为分组，本身无独立页面，下挂「机构与授权」「用户与权限」。
 */
export interface V8NavGroup {
  key: string
  title: string
  /** 分组无独立页面；叶子路径用于高亮与跳转 */
  children: V8MenuItem[]
}

export type V8NavNode = V8MenuItem | V8NavGroup

export const V8_NAV: V8NavNode[] = [
  { key: 'overview', title: '首页', path: '/v8/overview' },
  { key: 'dataCheck', title: '接入日志', path: '/v8/data-check' },
  { key: 'suppliers', title: '供数方管理', path: '/v8/suppliers' },
  { key: 'spec', title: '接入规范', path: '/v8/spec' },
  { key: 'monitor', title: '供数监控', path: '/v8/monitor' },
  // 推送回流（pushback）本期主导航隐藏：路由与权限点保留，供数据概览推送对账分区下钻
  {
    key: 'system',
    title: '系统设置',
    children: [
      { key: 'organization', title: '机构与授权', path: '/v8/organization' },
      { key: 'permissions', title: '用户与权限', path: '/v8/permissions' },
    ],
  },
]

/** 扁平化的权限点清单（供权限管理页勾选 / 名称回显，不含入口隐藏项 message/settings） */
export const V8_MENUS: V8MenuItem[] = [
  { key: 'overview', title: '首页', path: '/v8/overview' },
  { key: 'dataCheck', title: '接入日志', path: '/v8/data-check' },
  { key: 'suppliers', title: '供数方管理', path: '/v8/suppliers' },
  { key: 'spec', title: '接入规范', path: '/v8/spec' },
  { key: 'monitor', title: '供数监控', path: '/v8/monitor' },
  { key: 'pushback', title: '推送回流', path: '/v8/pushback' },
  { key: 'message', title: '消息中心', path: '/v8/message' },
  { key: 'organization', title: '机构与授权', path: '/v8/organization' },
  { key: 'permissions', title: '用户与权限', path: '/v8/permissions' },
  { key: 'settings', title: '个人设置', path: '/v8/settings' },
]

export function isNavGroup(node: V8NavNode): node is V8NavGroup {
  return (node as V8NavGroup).children !== undefined
}

/** 判断节点是否为叶子菜单（有独立可跳转路径） */
export function isNavItem(node: V8NavNode): node is V8MenuItem {
  return !isNavGroup(node)
}

export function findMenuByPath(path: string): V8MenuItem | undefined {
  return V8_MENUS.find((m) => path.startsWith(m.path))
}
