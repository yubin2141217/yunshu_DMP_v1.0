<template>
  <div class="v8-restricted">
    <div class="v8-restricted-card">
      <div class="v8-restricted-icon" :class="`is-${type}`">
        <IconStop v-if="type === 'forbidden'" />
        <IconExclamationCircle v-else />
      </div>
      <h2 class="v8-restricted-title">{{ meta.title }}</h2>
      <p class="v8-restricted-desc">{{ meta.desc }}</p>
      <div class="v8-restricted-actions">
        <a-button v-if="type === 'forbidden'" type="primary" @click="goOverview">返回数据概览</a-button>
        <a-button v-else @click="goLogin">重新登录</a-button>
        <a-button type="text" @click="goMt">进入 MT 管理端</a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconExclamationCircle, IconStop } from '@arco-design/web-vue/es/icon'

type RestrictedType = 'no-org' | 'expired' | 'forbidden'

const route = useRoute()
const router = useRouter()
const type = computed<RestrictedType>(() => (route.query.type as RestrictedType) || 'forbidden')

const metaMap: Record<RestrictedType, { title: string; desc: string }> = {
  'no-org': {
    title: '未检测到所属机构',
    desc: '当前账号尚未绑定机构，无法进入机构端。请联系平台运营完成机构开通与绑定后再登录。',
  },
  expired: {
    title: '机构授权已过期',
    desc: '您所在机构的服务授权已到期，数据服务已暂停。请联系平台运营或客户经理办理续费。',
  },
  forbidden: {
    title: '暂无该功能访问权限',
    desc: '当前账号未被授予该模块的访问权限，如需开通请联系本机构管理员在「用户与数据权限」中配置。',
  },
}

const meta = computed(() => metaMap[type.value])

function goOverview() {
  router.replace('/v8/overview')
}
function goLogin() {
  router.replace('/v8/login')
}
function goMt() {
  router.push('/stats')
}
</script>
