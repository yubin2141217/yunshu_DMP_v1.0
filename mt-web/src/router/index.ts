import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useUserStore as useV8UserStore } from '@/v8/store/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 默认入口：三端门户选择页（独立全屏，不套后台布局）
    {
      path: '/',
      name: 'Portal',
      component: () => import('@/views/Portal/index.vue'),
      meta: { title: '云数中台原型设计门户' },
    },
    // 后台运营端（MtLayout）；子路由使用绝对路径，保证各页 URL 与历史一致
    {
      path: '/',
      component: () => import('@/layouts/MtLayout.vue'),
      children: [
        { path: '/stats', name: 'Stats', component: () => import('@/views/Stats/index.vue'), meta: { title: '综合看板' } },
        {
          path: '/org/open',
          name: 'OrgOpen',
          component: () => import('@/views/Org/index.vue'),
          meta: { title: '机构管理', group: 'orgGroup' },
        },
        {
          path: '/org/open/:id',
          name: 'OrgDetail',
          component: () => import('@/views/Org/detail.vue'),
          meta: { title: '机构授权管理', group: 'orgGroup' },
        },
        {
          path: '/org/users',
          name: 'OrgUsers',
          component: () => import('@/views/Org/Users.vue'),
          meta: { title: '机构用户管理', group: 'orgGroup' },
        },
        { path: '/data-query', redirect: '/standard/access-data' },
        { path: '/suppliers', name: 'Suppliers', component: () => import('@/views/Suppliers/index.vue'), meta: { title: '供数方管理', group: 'standardGroup' } },
        { path: '/org-config', redirect: '/standard' },
        { path: '/standard', name: 'Standard', component: () => import('@/views/Standard/index.vue'), meta: { title: '接入方案管理', group: 'standardGroup' } },
        {
          path: '/standard/access-data',
          name: 'AccessDataQuery',
          component: () => import('@/views/Standard/AccessDataQuery.vue'),
          meta: { title: '接入数据明细', group: 'standardGroup' },
        },
        { path: '/standard/edit', name: 'StandardCreate', component: () => import('@/views/Standard/Edit.vue'), meta: { title: '新增接入方案', group: 'standardGroup' } },
        { path: '/standard/edit/:id', name: 'StandardEdit', component: () => import('@/views/Standard/Edit.vue'), meta: { title: '编辑接入方案', group: 'standardGroup' } },
        { path: '/standard/:id', name: 'StandardDetail', component: () => import('@/views/Standard/detail.vue'), meta: { title: '接入方案详情', group: 'standardGroup' } },
        { path: '/dict', name: 'Dict', component: () => import('@/views/Dict/index.vue'), meta: { title: '数据字典', group: 'settingsGroup' } },
        { path: '/metadata', name: 'Metadata', component: () => import('@/views/Metadata/index.vue'), meta: { title: '字段库管理', group: 'standardGroup' } },
        { path: '/metadata/create', name: 'MetadataCreate', component: () => import('@/views/Metadata/Create.vue'), meta: { title: '新增字段', group: 'standardGroup' } },
        {
          path: '/metadata/batch-edit',
          name: 'MetadataBatchEdit',
          component: () => import('@/views/Metadata/BatchEdit.vue'),
          meta: { title: '批量编辑字段', group: 'standardGroup' },
        },
        {
          path: '/metadata/templates/edit',
          name: 'MetadataTemplateCreate',
          component: () => import('@/views/Metadata/TemplateEdit.vue'),
          meta: { title: '新增快速模板', group: 'standardGroup' },
        },
        {
          path: '/metadata/templates/edit/:id',
          name: 'MetadataTemplateEdit',
          component: () => import('@/views/Metadata/TemplateEdit.vue'),
          meta: { title: '编辑快速模板', group: 'standardGroup' },
        },
        {
          path: '/metadata/templates/:id',
          name: 'MetadataTemplateDetail',
          component: () => import('@/views/Metadata/TemplateDetail.vue'),
          meta: { title: '快速模板详情', group: 'standardGroup' },
        },
        { path: '/metadata/:id', name: 'MetadataDetail', component: () => import('@/views/Metadata/detail.vue'), meta: { title: '字段详情', group: 'standardGroup' } },
        { path: '/scheme', name: 'Scheme', component: () => import('@/views/Scheme/index.vue'), meta: { title: '接入方案', group: 'standardGroup', hidden: true } },
        { path: '/scheme/:id', name: 'SchemeDetail', component: () => import('@/views/Scheme/detail.vue'), meta: { title: '接入方案详情', group: 'standardGroup', hidden: true } },
        { path: '/whitelist', name: 'Whitelist', component: () => import('@/views/Whitelist/index.vue'), meta: { title: 'IP 白名单', group: 'standardGroup' } },
        {
          path: '/push',
          redirect: '/push/schemes',
          meta: { title: '数据推送管理', group: 'pushGroup', hidden: true },
        },
        {
          path: '/push/schemes',
          name: 'PushSchemes',
          component: () => import('@/views/Push/Schemes.vue'),
          meta: { title: '推送方案管理', group: 'pushGroup' },
        },
        {
          path: '/push/push-data',
          name: 'PushDataQuery',
          component: () => import('@/views/Push/PushDataQuery.vue'),
          meta: { title: '推送数据明细', group: 'pushGroup' },
        },
        {
          path: '/push/receivers',
          redirect: '/push/schemes',
        },
        {
          path: '/push/schemes/edit',
          name: 'PushSchemeCreate',
          component: () => import('@/views/Push/SchemeEdit.vue'),
          meta: { title: '新增推送方案', group: 'pushGroup' },
        },
        {
          path: '/push/schemes/edit/:id',
          name: 'PushSchemeEdit',
          component: () => import('@/views/Push/SchemeEdit.vue'),
          meta: { title: '编辑推送方案', group: 'pushGroup' },
        },
        {
          path: '/push/schemes/:id',
          name: 'PushSchemeDetail',
          component: () => import('@/views/Push/SchemeDetail.vue'),
          meta: { title: '推送方案详情', group: 'pushGroup' },
        },
        { path: '/push/tasks', redirect: '/push/schemes' },
        {
          path: '/monitor/rules',
          name: 'AlertRules',
          component: () => import('@/views/AlertRules/index.vue'),
          meta: { title: '告警规则', group: 'monitorGroup' },
        },
      ],
    },
    // V8 机构端子系统：登录页独立全屏，其余页面套 V8Layout
    {
      path: '/v8/login',
      name: 'V8Login',
      component: () => import('@/v8/views/auth/login.vue'),
      meta: { title: '机构端登录' },
    },
    {
      path: '/v8/restricted',
      name: 'V8Restricted',
      component: () => import('@/v8/views/Restricted/index.vue'),
      meta: { title: '访问受限' },
    },
    {
      path: '/v8',
      component: () => import('@/v8/layouts/V8Layout.vue'),
      children: [
        { path: '', redirect: '/v8/overview' },
        { path: 'overview', name: 'V8Overview', component: () => import('@/v8/views/Overview/index.vue'), meta: { title: '首页', menuKey: 'overview' } },
        {
          path: 'stats',
          // 供数统计已并入「接入日志」，旧地址保留并透传查询参数（range/result/supplierId）
          redirect: (to) => ({ path: '/v8/data-check', query: to.query }),
        },
        { path: 'data-check', name: 'V8DataCheck', component: () => import('@/v8/views/DataCheck/index.vue'), meta: { title: '接入日志', menuKey: 'dataCheck' } },
        { path: 'suppliers', name: 'V8Suppliers', component: () => import('@/v8/views/Suppliers/index.vue'), meta: { title: '供数方查看', menuKey: 'suppliers' } },
        { path: 'monitor', name: 'V8Monitor', component: () => import('@/v8/views/Monitor/index.vue'), meta: { title: '供数监控', menuKey: 'monitor' } },
        { path: 'pushback', name: 'V8Pushback', component: () => import('@/v8/views/Pushback/index.vue'), meta: { title: '推送回流查看', menuKey: 'pushback' } },
        { path: 'message', name: 'V8Message', component: () => import('@/v8/views/Message/index.vue'), meta: { title: '消息中心', menuKey: 'message' } },
        { path: 'spec', name: 'V8Spec', component: () => import('@/v8/views/Spec/index.vue'), meta: { title: '接入规范', menuKey: 'spec' } },
        { path: 'organization', name: 'V8Organization', component: () => import('@/v8/views/Organization/index.vue'), meta: { title: '机构与授权信息', menuKey: 'organization' } },
        { path: 'permissions', name: 'V8Permissions', component: () => import('@/v8/views/Permissions/index.vue'), meta: { title: '用户与数据权限', menuKey: 'permissions' } },
        { path: 'settings', name: 'V8Settings', component: () => import('@/v8/views/Settings/index.vue'), meta: { title: '个人设置', menuKey: 'settings' } },
      ],
    },
    { path: '/login', redirect: '/stats' },
    { path: '/:pathMatch(.*)*', redirect: '/stats' },
  ],
})

router.beforeEach((to) => {
  // V8 机构端子系统使用独立登录态
  if (to.path.startsWith('/v8')) {
    const v8UserStore = useV8UserStore()

    // 第一层：未建立有效会话（token 与用户信息缺一不可）→ 登录页并带回跳
    if (to.name !== 'V8Login' && !v8UserStore.isLoggedIn) {
      return { name: 'V8Login', query: { redirect: to.fullPath } }
    }
    // 已登录访问登录页 → 进概览
    if (to.name === 'V8Login' && v8UserStore.isLoggedIn) {
      return { name: 'V8Overview' }
    }

    if (to.name !== 'V8Login' && to.name !== 'V8Restricted') {
      const user = v8UserStore.userInfo
      // 第二层：无机构归属 / 账号停用 → 受限态
      if (!user || !user.orgId || user.status === 'disabled') {
        return { name: 'V8Restricted', query: { type: 'no-org' } }
      }
      // 第三层：菜单模块权限（个人设置为所有登录用户的基础页，不纳入菜单授权）
      const menuKey = to.meta.menuKey as import('@/v8/mock/types').MenuKey | undefined
      if (menuKey && menuKey !== 'settings' && !v8UserStore.can(menuKey)) {
        return { name: 'V8Restricted', query: { type: 'forbidden' } }
      }
    }
  }
  useUserStore().ensureDemoSession()
  // 门户页使用独立标题；其余后台页统一加应用后缀
  if (to.name === 'Portal') {
    document.title = '云数中台-yunshuDMP.cn-V1.0'
  } else {
    document.title = `${(to.meta.title as string) || '云数中台'} - ${import.meta.env.VITE_APP_TITLE}`
  }
  return true
})

export default router
