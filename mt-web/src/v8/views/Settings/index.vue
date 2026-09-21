<template>
  <div class="workplace-page">
    <div class="workplace-header">
      <div>
        <h2 class="workplace-title">个人设置</h2>
        <p class="workplace-desc">维护个人通知偏好；账号、实名与微信绑定信息来自公司统一扫码认证，如需变更请在认证中心操作。</p>
      </div>
    </div>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="9">
        <a-card class="content-card" :bordered="false">
          <div class="section-title v8-block-title">账号信息</div>
          <div class="v8-profile-user">
            <a-avatar :size="56" style="background: rgb(var(--primary-6)); font-size: 22px">
              {{ (userStore.userInfo?.name || '机').slice(0, 1) }}
            </a-avatar>
            <div class="v8-profile-meta">
              <div class="v8-profile-name">{{ userStore.userInfo?.name }}</div>
              <div class="v8-profile-sub">{{ userStore.userInfo?.orgName }}</div>
            </div>
          </div>
          <a-descriptions :column="1" bordered size="large" class="v8-profile-desc">
            <a-descriptions-item label="登录账号">{{ userStore.userInfo?.userName }}</a-descriptions-item>
            <a-descriptions-item label="手机尾号">{{ userStore.userInfo?.phoneTail }}</a-descriptions-item>
            <a-descriptions-item label="角色">{{ roleText }}</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>

      <a-col :xs="24" :lg="15">
        <a-card class="content-card" :bordered="false">
          <div class="section-title v8-block-title">个人通知偏好</div>
          <a-spin :loading="loading" style="width: 100%">
            <div class="v8-form-label">告警通知渠道</div>
            <a-checkbox-group v-model="channels" direction="horizontal" class="v8-channel-grid">
              <a-checkbox value="inbox">站内信（消息中心）</a-checkbox>
              <a-checkbox value="wechat">微信（扫码绑定账号）</a-checkbox>
              <a-checkbox value="email">邮件</a-checkbox>
            </a-checkbox-group>
            <a-alert type="info" class="v8-channel-note">
              机构级订阅（按告警类型/级别/免打扰）在「供数监控 - 订阅设置」中维护；此处为您个人的接收渠道开关。
            </a-alert>
            <div class="v8-save-bar">
              <a-button type="primary" :loading="saving" @click="onSave">保存设置</a-button>
            </div>
          </a-spin>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { getProfile, saveProfile } from '@/v8/api/system'
import { useUserStore } from '@/v8/store/user'

const userStore = useUserStore()
const loading = ref(false)
const saving = ref(false)
const name = ref('')
const channels = ref<string[]>([])

const roleText = computed(() => {
  const r = userStore.userInfo?.role
  return r === 'admin' ? '机构管理员' : r === 'duty' ? '值班人员' : '只读人员'
})

async function onSave() {
  saving.value = true
  try {
    await saveProfile({
      name: name.value,
      personalChannels: channels.value as ProfileChannel[],
    })
    Message.success('个人设置已保存')
  } finally {
    saving.value = false
  }
}

type ProfileChannel = 'inbox' | 'wechat' | 'email'

onMounted(async () => {
  loading.value = true
  try {
    const u = userStore.userInfo
    if (u) {
      const p = await getProfile(u)
      name.value = p.name
      channels.value = [...p.personalChannels]
    }
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.v8-block-title {
  margin: 0 0 18px;
}
.v8-profile-user {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}
.v8-profile-name {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}
.v8-profile-sub {
  margin-top: 4px;
  font-size: 13px;
  color: #86909c;
}
.v8-form-label {
  font-size: 13px;
  color: #4e5969;
  margin-bottom: 12px;
}
.v8-channel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}
.v8-channel-note {
  margin-top: 18px;
}
.v8-save-bar {
  margin-top: 22px;
  text-align: right;
}
</style>
