<template>
  <div class="workplace-page">
    <div class="workplace-header">
      <div>
        <h2 class="workplace-title">机构与授权信息</h2>
        <p class="workplace-desc">查看本机构基础信息、授权期限、已开通模块与用量配额。</p>
      </div>
    </div>

    <a-spin :loading="loading" style="width: 100%">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :lg="14">
          <a-card class="content-card" :bordered="false">
            <div class="section-title v8-block-title">机构信息</div>
            <a-descriptions :column="2" bordered size="large">
              <a-descriptions-item label="机构名称">{{ info.name }}</a-descriptions-item>
              <a-descriptions-item label="机构编码">{{ info.code }}</a-descriptions-item>
              <a-descriptions-item label="所在区域">{{ info.region }}</a-descriptions-item>
              <a-descriptions-item label="联系人">{{ info.contactName }}</a-descriptions-item>
              <a-descriptions-item label="联系电话">{{ info.contactPhoneMasked }}</a-descriptions-item>
              <a-descriptions-item label="授权开始">{{ info.authStart }}</a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="10">
          <a-card class="content-card" :bordered="false">
            <div class="section-title v8-block-title">用量配额</div>
            <div class="v8-quota-num">
              {{ Number(info.usedQuota).toLocaleString('zh-CN') }}
              <span class="v8-quota-total">/ {{ Number(info.totalQuota).toLocaleString('zh-CN') }} 条</span>
            </div>
            <a-progress
              :percent="quotaRatio"
              :status="quotaPercent >= 90 ? 'danger' : quotaPercent >= 75 ? 'warning' : 'normal'"
            />
            <div class="v8-quota-tip">
              <IconInfoCircle /> 配额不足时请联系平台运营扩容。
            </div>

            <a-divider />

            <div class="section-title v8-block-title">授权有效期</div>
            <a-range-picker
              :model-value="authRange"
              disabled
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
            <a-tag
              :color="authActive ? 'green' : 'red'"
              size="large"
              class="v8-auth-tag"
            >
              {{ authActive ? '授权生效中' : '授权已到期' }}
            </a-tag>
          </a-card>
        </a-col>
      </a-row>

      <a-card class="content-card" :bordered="false">
        <div class="section-title v8-block-title">已开通模块</div>
        <div class="v8-modules">
          <a-tag v-for="m in info.modules" :key="m" color="arcoblue" size="large" class="v8-module-tag">
            {{ m }}
          </a-tag>
          <span v-if="!info.modules.length" class="v8-no-module">暂未开通业务模块</span>
        </div>
      </a-card>
    </a-spin>

    <!-- 模块内容引用 V8 集成应用中心，暂不可关闭；提供返回按钮回到上一页 -->
    <a-modal
      :visible="true"
      :closable="false"
      :mask-closable="false"
      :esc-to-close="false"
      :mask="true"
      width="420px"
      title="机构与授权信息"
      class="v8-pending-modal"
    >
      <div class="v8-pending-body">
        <IconInfoCircle class="v8-pending-icon" />
        <span>该模块内容引用自 V8 集成应用中心，具体内容待定。</span>
      </div>
      <template #footer>
        <a-button @click="goBack">
          <template #icon><IconLeft /></template>
          返回
        </a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconInfoCircle, IconLeft } from '@arco-design/web-vue/es/icon'
import { getOrgInfo } from '@/v8/api/system'
import type { OrgInfo } from '@/v8/mock/types'

const router = useRouter()

/** 回退上个页面；无历史记录时兜底回数据概览 */
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/v8/overview')
  }
}

const loading = ref(false)
const info = ref<OrgInfo>({
  id: '',
  name: '',
  code: '',
  industry: '',
  region: '',
  authStart: '',
  authEnd: '',
  modules: [],
  usedQuota: 0,
  totalQuota: 0,
  appKeyMasked: '',
  contactName: '',
  contactPhoneMasked: '',
})

const authRange = computed(() => [info.value.authStart, info.value.authEnd])
/** 已用百分比（0–100），用于状态阈值 */
const quotaPercent = computed(() =>
  info.value.totalQuota ? Math.min(100, Math.round((info.value.usedQuota / info.value.totalQuota) * 100)) : 0,
)
/** 进度条占比（0–1）：Arco Progress 的 percent 接收比例值，内部自行 ×100 */
const quotaRatio = computed(() =>
  info.value.totalQuota ? Math.min(1, info.value.usedQuota / info.value.totalQuota) : 0,
)
const authActive = computed(() => {
  const now = new Date().toISOString().slice(0, 10)
  return info.value.authStart <= now && now <= info.value.authEnd
})

onMounted(async () => {
  loading.value = true
  try {
    info.value = await getOrgInfo()
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.v8-block-title {
  margin: 0 0 16px;
}
.v8-quota-num {
  font-size: 28px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 10px;
}
.v8-quota-total {
  font-size: 14px;
  font-weight: 400;
  color: #86909c;
}
.v8-quota-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #a9aeb8;
  display: flex;
  align-items: center;
  gap: 4px;
}
.v8-auth-tag {
  margin-top: 14px;
}
.v8-modules {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.v8-module-tag {
  border-radius: 8px;
  padding: 4px 12px;
}
.v8-no-module {
  color: #a9aeb8;
  font-size: 13px;
}
.v8-pending-body {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0 4px;
  font-size: 14px;
  line-height: 22px;
  color: #4e5969;
}
.v8-pending-icon {
  flex: 0 0 auto;
  margin-top: 3px;
  color: #165dff;
  font-size: 18px;
}
</style>
