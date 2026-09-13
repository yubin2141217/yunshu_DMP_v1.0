import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/MtLayout.vue'),
      redirect: '/stats',
      children: [
        { path: 'stats', name: 'Stats', component: () => import('@/views/Stats/index.vue'), meta: { title: '综合看板' } },
        { path: 'data-query', redirect: '/standard/access-data' },
        { path: 'suppliers', name: 'Suppliers', component: () => import('@/views/Suppliers/index.vue'), meta: { title: '供数方管理', group: 'standardGroup' } },
        { path: 'org-config', redirect: '/standard' },
        { path: 'standard', name: 'Standard', component: () => import('@/views/Standard/index.vue'), meta: { title: '接入方案管理', group: 'standardGroup' } },
        {
          path: 'standard/access-data',
          name: 'AccessDataQuery',
          component: () => import('@/views/Standard/AccessDataQuery.vue'),
          meta: { title: '接入数据明细', group: 'standardGroup' },
        },
        { path: 'standard/edit', name: 'StandardCreate', component: () => import('@/views/Standard/Edit.vue'), meta: { title: '新增接入方案', group: 'standardGroup' } },
        { path: 'standard/edit/:id', name: 'StandardEdit', component: () => import('@/views/Standard/Edit.vue'), meta: { title: '编辑接入方案', group: 'standardGroup' } },
        { path: 'standard/:id', name: 'StandardDetail', component: () => import('@/views/Standard/detail.vue'), meta: { title: '接入方案详情', group: 'standardGroup' } },
        { path: 'metadata', name: 'Metadata', component: () => import('@/views/Metadata/index.vue'), meta: { title: '字段库管理', group: 'standardGroup' } },
        { path: 'metadata/create', name: 'MetadataCreate', component: () => import('@/views/Metadata/Create.vue'), meta: { title: '新增字段', group: 'standardGroup' } },
        { path: 'metadata/:id', name: 'MetadataDetail', component: () => import('@/views/Metadata/detail.vue'), meta: { title: '字段详情', group: 'standardGroup' } },
        { path: 'scheme', name: 'Scheme', component: () => import('@/views/Scheme/index.vue'), meta: { title: '接入方案', group: 'standardGroup', hidden: true } },
        { path: 'scheme/:id', name: 'SchemeDetail', component: () => import('@/views/Scheme/detail.vue'), meta: { title: '接入方案详情', group: 'standardGroup', hidden: true } },
        { path: 'whitelist', name: 'Whitelist', component: () => import('@/views/Whitelist/index.vue'), meta: { title: 'IP 白名单', group: 'standardGroup' } },
        {
          path: 'push',
          redirect: '/push/schemes',
          meta: { title: '数据推送管理', group: 'pushGroup', hidden: true },
        },
        {
          path: 'push/schemes',
          name: 'PushSchemes',
          component: () => import('@/views/Push/Schemes.vue'),
          meta: { title: '推送方案管理', group: 'pushGroup' },
        },
        {
          path: 'push/push-data',
          name: 'PushDataQuery',
          component: () => import('@/views/Push/PushDataQuery.vue'),
          meta: { title: '推送数据明细', group: 'pushGroup' },
        },
        {
          path: 'push/receivers',
          name: 'PushReceivers',
          component: () => import('@/views/Push/Receivers.vue'),
          meta: { title: '接收方管理', group: 'pushGroup' },
        },
        {
          path: 'push/schemes/edit',
          name: 'PushSchemeCreate',
          component: () => import('@/views/Push/SchemeEdit.vue'),
          meta: { title: '新增推送方案', group: 'pushGroup' },
        },
        {
          path: 'push/schemes/edit/:id',
          name: 'PushSchemeEdit',
          component: () => import('@/views/Push/SchemeEdit.vue'),
          meta: { title: '编辑推送方案', group: 'pushGroup' },
        },
        {
          path: 'push/schemes/:id',
          name: 'PushSchemeDetail',
          component: () => import('@/views/Push/SchemeDetail.vue'),
          meta: { title: '推送方案详情', group: 'pushGroup' },
        },
        { path: 'push/tasks', redirect: '/push/schemes' },
      ],
    },
    { path: '/login', redirect: '/stats' },
    { path: '/:pathMatch(.*)*', redirect: '/stats' },
  ],
})

router.beforeEach((to) => {
  useUserStore().ensureDemoSession()
  document.title = `${(to.meta.title as string) || '云数中台'} - ${import.meta.env.VITE_APP_TITLE}`
  return true
})

export default router
