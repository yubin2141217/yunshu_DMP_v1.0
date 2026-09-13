<template>
  <div class="mt-layout">
    <header class="mt-topbar">
      <div class="mt-topbar-left">
        <span class="pro-logo-mark" aria-hidden="true"><IconThunderbolt /></span>
        <span class="mt-topbar-brand">云数中台</span>
        <span class="mt-topbar-system">运营管理系统</span>
      </div>
      <div class="mt-topbar-right">
        <span class="mt-topbar-action" title="消息">
          <a-badge :count="3" :dot="false" :max-count="99">
            <IconNotification :size="18" />
          </a-badge>
        </span>
        <div class="mt-user">
          <a-avatar :size="30" style="background: var(--mt-primary, #165dff)">{{ userInitial }}</a-avatar>
          <div class="mt-user-meta">
            <span class="mt-user-name">{{ userStore.userInfo?.name || '运营' }}</span>
            <span class="mt-user-role">{{ userStore.userInfo?.role || '平台运营' }}</span>
          </div>
        </div>
        <button type="button" class="mt-topbar-logout" title="退出登录" @click="onLogout">
          <IconExport :size="16" />
          <span>退出</span>
        </button>
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
            <a-menu-item key="/push/receivers">接收方管理</a-menu-item>
          </a-sub-menu>
        </a-menu>
      </aside>

      <div class="mt-main">
        <main class="mt-content">
          <div v-if="!embedPageCrumb" class="crumb">
            运营工作台<span class="crumb-sep">/</span><span class="crumb-current">{{ currentTitle }}</span>
          </div>
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
  IconBarChart,
  IconExport,
  IconFile,
  IconNotification,
  IconSend,
  IconThunderbolt,
} from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const currentTitle = computed(() => (route.meta.title as string) || '')
const embedPageCrumb = computed(() => route.path.startsWith('/stats'))
const userInitial = computed(() => (userStore.userInfo?.name || '运').slice(0, 1))
const selectedKeys = computed(() => {
  if (route.path.startsWith('/standard/access-data')) return ['/standard/access-data']
  if (route.path.startsWith('/standard')) return ['/standard']
  if (route.path.startsWith('/metadata')) return ['/metadata']
  if (route.path.startsWith('/scheme')) return ['/scheme']
  if (route.path.startsWith('/whitelist')) return ['/whitelist']
  if (route.path.startsWith('/suppliers')) return ['/suppliers']
  if (route.path.startsWith('/push/push-data')) return ['/push/push-data']
  if (route.path.startsWith('/push/receivers')) return ['/push/receivers']
  if (route.path.startsWith('/push/schemes')) return ['/push/schemes']
  if (route.path.startsWith('/push')) return ['/push/schemes']
  if (route.path.startsWith('/stats')) return ['/stats']
  return [route.path]
})
const openKeys = ref<string[]>(['standardGroup', 'pushGroup'])

watch(
  () => route.meta.group,
  (g) => {
    if (g) openKeys.value = [String(g)]
  },
)

function onMenu(key: string) {
  router.push(key)
}

function onLogout() {
  userStore.logout()
  router.push('/login')
}

</script>
