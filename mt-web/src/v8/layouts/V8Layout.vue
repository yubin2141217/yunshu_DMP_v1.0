<template>
  <div class="v8-layout">
    <header class="chrome-top">
      <div class="chrome-inner">
        <div class="chrome-brand">
          <span class="pro-logo-mark" aria-hidden="true"><IconThunderbolt /></span>
          <span class="chrome-logo">云数中台</span>
          <div class="chrome-tags">
            <a-tag color="arcoblue" size="small">{{ orgName }}</a-tag>
            <a-tag color="arcoblue" size="small">机构端</a-tag>
          </div>
        </div>
        <div class="chrome-top-actions">
          <button type="button" class="chrome-mt-entry" title="进入 MT 管理端综合看板" @click="goMtAdmin">
            <IconDashboard :size="14" />
            <span>MT管理端</span>
          </button>

          <button type="button" class="chrome-bell-btn" title="消息中心" @click="goMessage">
            <a-badge :count="unread" :max-count="99" :dot="false" :offset="[-2, 2]">
              <IconNotification :size="18" />
            </a-badge>
          </button>

          <div class="chrome-user-box">
            <button type="button" class="chrome-user" title="个人设置" @click="goSettings">
              <a-avatar :size="32" style="background: rgb(var(--primary-6))">{{ userInitial }}</a-avatar>
              <span class="chrome-user-name">{{ userStore.userInfo?.name }}</span>
            </button>
            <a-dropdown trigger="click" position="br">
              <button type="button" class="chrome-user-caret-btn" title="更多">
                <IconDown class="chrome-user-caret" />
              </button>
              <template #content>
                <a-doption @click="goSettings">
                  <IconSettings class="chrome-doption-icon" />个人设置
                </a-doption>
                <a-doption @click="onLogout">
                  <IconExport class="chrome-doption-icon" />退出登录
                </a-doption>
              </template>
            </a-dropdown>
          </div>
        </div>
      </div>
    </header>
    <nav class="chrome-nav">
      <div class="chrome-inner chrome-nav-inner">
        <template v-for="node in nav" :key="node.key">
          <!-- 叶子一级菜单 -->
          <router-link v-if="isNavItem(node)" :to="node.path">{{ node.title }}</router-link>
          <!-- 含二级菜单的分组（系统设置） -->
          <div v-else class="chrome-nav-group" :class="{ 'is-active': groupActive(node) }">
            <button type="button" class="chrome-nav-parent">
              {{ node.title }}<IconDown class="chrome-nav-caret" />
            </button>
            <div class="chrome-nav-dropdown">
              <router-link
                v-for="child in node.children"
                :key="child.key"
                :to="child.path"
                class="chrome-nav-sub"
              >
                {{ child.title }}
              </router-link>
            </div>
          </div>
        </template>
      </div>
    </nav>
    <main class="chrome-main">
      <router-view />
    </main>
    <V8Watermark :text="watermark" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal } from '@arco-design/web-vue'
import {
  IconDashboard,
  IconDown,
  IconExport,
  IconNotification,
  IconSettings,
  IconThunderbolt,
} from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/v8/store/user'
import { V8_NAV, isNavItem, isNavGroup, type V8NavGroup } from '@/v8/config/menus'
import { getUnreadCount } from '@/v8/api/system'
import V8Watermark from '@/v8/components/V8Watermark.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const orgName = computed(() => userStore.userInfo?.orgName || '本机构')
const watermark = computed(() => userStore.watermarkText)
const unread = ref(0)

/** 一级导航：按当前用户权限过滤；分组内子项全部无权限时整组隐藏 */
const nav = computed(() =>
  V8_NAV.map((node) => {
    if (isNavItem(node)) return userStore.can(node.key) ? node : null
    const children = node.children.filter((c) => userStore.can(c.key))
    return children.length ? { ...node, children } : null
  }).filter(Boolean) as typeof V8_NAV,
)

const userInitial = computed(() => (userStore.userInfo?.name || '机').slice(0, 1))

function groupActive(group: V8NavGroup) {
  return group.children.some((c) => route.path.startsWith(c.path))
}

async function refreshUnread() {
  if (!userStore.can('message')) {
    unread.value = 0
    return
  }
  unread.value = await getUnreadCount()
}

function goMtAdmin() {
  router.push('/stats')
}
function goMessage() {
  router.push('/v8/message')
}
function goSettings() {
  router.push('/v8/settings')
}

function onLogout() {
  Modal.confirm({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    onOk() {
      userStore.logout()
      router.push('/v8/login')
    },
  })
}

onMounted(refreshUnread)
</script>
