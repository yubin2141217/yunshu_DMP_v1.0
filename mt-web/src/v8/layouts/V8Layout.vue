<template>
  <div class="v8-layout">
    <header class="chrome-top">
      <div class="chrome-inner">
        <!-- 左侧品牌区：平台 logo + 平台名 + V8 角标 + 分隔线 + 机构名称 -->
        <div class="chrome-brand">
          <span class="pro-logo-mark" aria-hidden="true"><IconThunderbolt /></span>
          <span class="chrome-logo">云数中台</span>
          <span class="chrome-logo-badge">V8</span>
          <span class="chrome-brand-divider" aria-hidden="true"></span>
          <span class="chrome-org-name">{{ orgName }}</span>
        </div>
        <div class="chrome-top-actions">
          <!-- 保留既有「MT管理端」入口，样式不变 -->
          <button type="button" class="chrome-mt-entry" title="进入 MT 管理端综合看板" @click="goMtAdmin">
            <IconDashboard :size="14" />
            <span>MT管理端</span>
          </button>

          <!-- 待办通知 -->
          <a-tooltip content="待办通知" mini position="br">
            <button type="button" class="chrome-icon-btn" @click="goTodo">
              <IconCalendar :size="18" />
            </button>
          </a-tooltip>

          <!-- 消息通知 -->
          <a-tooltip content="消息通知" mini position="br">
            <button type="button" class="chrome-icon-btn" @click="goMessage">
              <IconNotification :size="18" />
            </button>
          </a-tooltip>

          <!-- 联系客户经理 -->
          <a-tooltip content="联系客户经理" mini position="br">
            <button type="button" class="chrome-icon-btn" @click="contactManager">
              <IconCustomerService :size="18" />
            </button>
          </a-tooltip>

          <!-- 个人中心：头像 + 姓名 + 下拉 -->
          <a-dropdown trigger="click" position="br">
            <button type="button" class="chrome-user" title="个人中心">
              <a-avatar :size="30" class="chrome-user-avatar">{{ userInitial }}</a-avatar>
              <span class="chrome-user-name">{{ userStore.userInfo?.name }}</span>
              <IconDown class="chrome-user-caret" />
            </button>
            <template #content>
              <a-doption @click="goSettings">
                <IconUser class="chrome-doption-icon" />个人中心
              </a-doption>
              <a-doption @click="switchOrg">
                <IconSwap class="chrome-doption-icon" />切换机构
              </a-doption>
              <a-doption @click="onLogout">
                <IconExport class="chrome-doption-icon" />退出登录
              </a-doption>
            </template>
          </a-dropdown>
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconCalendar,
  IconCustomerService,
  IconDashboard,
  IconDown,
  IconExport,
  IconNotification,
  IconSwap,
  IconThunderbolt,
  IconUser,
} from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/v8/store/user'
import { V8_NAV, isNavItem, type V8NavGroup } from '@/v8/config/menus'
import V8Watermark from '@/v8/components/V8Watermark.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const orgName = computed(() => userStore.userInfo?.orgName || '本机构')
const watermark = computed(() => userStore.watermarkText)

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

function goMtAdmin() {
  router.push('/stats')
}
function goMessage() {
  router.push('/v8/message')
}
/** 待办通知：待处理告警进入供数监控，无权限则进入首页待办分区 */
function goTodo() {
  if (userStore.can('monitor')) {
    router.push('/v8/monitor')
  } else {
    router.push('/v8/overview')
  }
}
function goSettings() {
  router.push('/v8/settings')
}
/** 切换机构：本期为单机构演示，给出轻提示 */
function switchOrg() {
  Message.info('当前账号仅绑定一个机构，如需切换请联系平台管理员')
}
/** 联系客户经理：原型阶段弹出联系方式提示 */
function contactManager() {
  Modal.info({
    title: '联系客户经理',
    content: '客户经理：王经理　服务热线：400-800-1688（工作日 9:00–18:00）',
    okText: '我知道了',
  })
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
</script>
