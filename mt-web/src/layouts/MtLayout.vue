<template>
  <div class="mt-layout">
    <header class="mt-topbar">
      <div class="mt-topbar-left" role="button" tabindex="0" title="返回主页" @click="router.push('/stats')">
        <span class="pro-logo-mark" aria-hidden="true"><IconThunderbolt /></span>
        <span class="mt-topbar-brand">云数中台</span>
        <span class="mt-topbar-system">运营管理系统</span>
      </div>
      <div class="mt-topbar-right">
        <button type="button" class="mt-topbar-v8-entry" title="进入 V8 机构端" @click="goV8Org">
          <IconApps :size="14" />
          <span>V8机构端</span>
        </button>
        <span class="mt-topbar-action" title="消息">
          <a-badge :count="3" :dot="false" :max-count="99">
            <IconNotification :size="18" />
          </a-badge>
        </span>
        <span class="mt-topbar-action" title="下载中心">
          <IconDownload :size="18" />
        </span>
        <a-dropdown trigger="click">
          <div class="mt-user" role="button" tabindex="0" aria-label="用户菜单">
            <a-avatar :size="30" style="background: var(--mt-primary, #165dff)">{{ userInitial }}</a-avatar>
            <div class="mt-user-meta">
              <span class="mt-user-name">{{ userStore.userInfo?.name || '运营' }}</span>
              <span class="mt-user-role">{{ userStore.userInfo?.dept || userStore.userInfo?.role || '平台运营' }}</span>
            </div>
            <IconDown :size="12" class="mt-user-caret" />
          </div>
          <template #content>
            <a-doption @click="onLogout">
              <template #icon><IconExport /></template>
              退出登录
            </a-doption>
          </template>
        </a-dropdown>
      </div>
    </header>

    <div class="mt-body">
      <aside class="mt-sider">
        <a-menu
          :selected-keys="selectedKeys"
          v-model:open-keys="openKeys"
          @menu-item-click="onMenu"
        >
          <a-menu-item key="/stats">
            <template #icon><IconBarChart /></template>
            综合看板
          </a-menu-item>
          <a-sub-menu key="orgGroup">
            <template #icon><IconUserGroup /></template>
            <template #title>机构管理</template>
            <a-menu-item key="/org/open">机构管理</a-menu-item>
            <a-menu-item key="/org/users">机构用户管理</a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="standardGroup">
            <template #icon><IconFile /></template>
            <template #title>数据接入管理</template>
            <a-menu-item key="/standard">接入方案管理</a-menu-item>
            <a-menu-item key="/standard/access-data">接入数据明细</a-menu-item>
            <a-menu-item key="/metadata">字段库管理</a-menu-item>
            <a-menu-item key="/whitelist">IP 白名单</a-menu-item>
            <a-menu-item key="/suppliers">供数方管理</a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="pushGroup">
            <template #icon><IconSend /></template>
            <template #title>数据推送管理</template>
            <a-menu-item key="/push/schemes">推送方案管理</a-menu-item>
            <a-menu-item key="/push/push-data">推送数据明细</a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="monitorGroup">
            <template #icon><IconExclamationCircleFill /></template>
            <template #title>监控告警</template>
            <a-menu-item key="/monitor/rules">告警规则</a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="settingsGroup">
            <template #icon><IconSettings /></template>
            <template #title>系统设置</template>
            <a-menu-item key="/dict">数据字典</a-menu-item>
          </a-sub-menu>
        </a-menu>
      </aside>

      <div class="mt-main">
        <main class="mt-content">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IconApps,
  IconBarChart,
  IconDownload,
  IconDown,
  IconExport,
  IconExclamationCircleFill,
  IconFile,
  IconNotification,
  IconSend,
  IconSettings,
  IconThunderbolt,
  IconUserGroup,
} from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const userInitial = computed(() => (userStore.userInfo?.name || '运').slice(0, 1))
const selectedKeys = computed(() => {
  if (route.path.startsWith('/org/open')) return ['/org/open']
  if (route.path.startsWith('/org/users')) return ['/org/users']
  if (route.path.startsWith('/org')) return ['/org/open']
  if (route.path.startsWith('/standard/access-data')) return ['/standard/access-data']
  if (route.path.startsWith('/standard')) return ['/standard']
  if (route.path.startsWith('/metadata')) return ['/metadata']
  if (route.path.startsWith('/dict')) return ['/dict']
  if (route.path.startsWith('/scheme')) return ['/scheme']
  if (route.path.startsWith('/whitelist')) return ['/whitelist']
  if (route.path.startsWith('/suppliers')) return ['/suppliers']
  if (route.path.startsWith('/push/push-data')) return ['/push/push-data']
  if (route.path.startsWith('/push/schemes')) return ['/push/schemes']
  if (route.path.startsWith('/push')) return ['/push/schemes']
  if (route.path.startsWith('/monitor/rules')) return ['/monitor/rules']
  if (route.path.startsWith('/stats')) return ['/stats']
  return [route.path]
})
const openKeys = ref<string[]>(['orgGroup', 'standardGroup', 'pushGroup', 'monitorGroup', 'settingsGroup'])

watch(
  () => route.meta.group,
  (g) => {
    if (g) openKeys.value = [String(g)]
  },
)

function onMenu(key: string) {
  router.push(key)
}

// 跳转 V8 机构端：未登录时由 v8 路由守卫引导至其登录页，登录后进入数据概览首页
function goV8Org() {
  router.push('/v8/overview')
}

function onLogout() {
  userStore.logout()
  router.push('/login')
}

</script>
