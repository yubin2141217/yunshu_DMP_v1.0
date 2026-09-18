<template>
  <div class="page-shell org-detail">
    <button type="button" class="back-link" @click="$router.push('/org/open')">
      <IconLeft />
      返回机构列表
    </button>

    <a-spin :loading="loading" class="org-detail__spin">
      <template v-if="profile">
        <div class="org-hero">
          <div class="org-hero__main">
            <div class="org-hero__title-row">
              <h2 class="org-hero__name">{{ profile.name }}</h2>
              <span class="org-hero__id">机构ID {{ profile.code }}</span>
              <a-tag :color="profile.openVersion === 'trial' ? 'orangered' : 'purple'" size="small">
                {{ versionText(profile.openVersion) }}
              </a-tag>
              <a-tag :color="authColor(profile.authStatus)" size="small">{{ authRunningText(profile.authStatus) }}</a-tag>
            </div>
            <div class="org-hero__full">{{ profile.fullName }}</div>
            <div class="org-hero__meta">
              <span>{{ profile.address }}</span>
              <span>统一社会信用代码 {{ profile.creditCode }}</span>
              <span>试用过期：{{ profile.trialExpireText }}</span>
              <span>激活过期：{{ profile.activateExpireText }}</span>
              <span>授权过期：{{ profile.grantExpireText }}</span>
            </div>
          </div>
          <div class="org-hero__expire">
            <div class="org-hero__expire-label">授权服务到期时间</div>
            <div class="org-hero__expire-value">
              {{ profile.expireAt || '—' }}
              <span v-if="profile.remainDays != null" class="org-hero__remain">（{{ profile.remainDays }}）</span>
            </div>
          </div>
        </div>

        <div class="org-actions">
          <div class="org-actions__left">
            <a-button :type="tab === 'apps' ? 'primary' : 'outline'" @click="tab = 'apps'">应用授权</a-button>
            <a-button :type="tab === 'usage' ? 'primary' : 'outline'" @click="tab = 'usage'">应用使用情况</a-button>
            <a-button :type="tab === 'logs' ? 'primary' : 'outline'" @click="tab = 'logs'">操作日志</a-button>
            <a-button @click="onHint('授权节点')">授权节点（未设置）</a-button>
            <a-button @click="onHint('授权到期')">授权到期（未设置）</a-button>
            <a-button @click="goUsers">账号管控</a-button>
          </div>
        </div>

        <a-card v-if="tab === 'apps'" class="content-card" :bordered="false">
          <div class="apps-head">
            <div class="apps-head__tabs">
              <span class="apps-head__tab is-active">
                应用名称
                <a-tag color="arcoblue" size="small">系统底座</a-tag>
              </span>
              <button type="button" class="apps-head__tab" @click="tab = 'usage'">应用使用情况</button>
            </div>
            <a-button type="primary" @click="onSave">保存配置</a-button>
          </div>
          <p class="apps-desc">为机构开通应用后，可在对应应用中管理下属人员与数据权限。授权变更保存后立即生效。</p>
          <div class="app-list">
            <div v-for="app in apps" :key="app.id" class="app-card">
              <div class="app-card__info">
                <div class="app-card__name">{{ app.name }}</div>
                <div class="app-card__desc">{{ app.desc }}</div>
              </div>
              <a-tag :color="app.edition === 'replica' ? 'green' : 'purple'" size="small">
                {{ app.edition === 'replica' ? '用户独立副本' : '正式版' }}
              </a-tag>
              <div class="app-card__status" :class="'is-' + app.status">{{ statusText(app.status) }}</div>
              <div class="app-card__side">
                <template v-if="app.status === 'pending'">
                  <a-button type="text" size="small" @click="onOpen(app)">待开通（立即开通）</a-button>
                </template>
                <template v-else>{{ app.nodeCount ?? 0 }} 节点</template>
              </div>
            </div>
            <a-empty v-if="!apps.length" description="暂无应用" />
          </div>
        </a-card>

        <a-card v-else-if="tab === 'usage'" class="content-card" :bordered="false" title="应用使用情况">
          <a-table :columns="usageColumns" :data="usage" row-key="id" :pagination="false" :bordered="false" stripe />
        </a-card>

        <a-card v-else class="content-card" :bordered="false" title="操作日志">
          <a-table :columns="logColumns" :data="logs" row-key="id" :pagination="false" :bordered="false" stripe>
            <template #action="{ record }">
              <a-tag size="small" color="arcoblue">{{ record.action }}</a-tag>
            </template>
          </a-table>
        </a-card>
      </template>
      <a-empty v-else-if="!loading" description="机构不存在或已删除">
        <a-button type="primary" @click="$router.push('/org/open')">返回列表</a-button>
      </a-empty>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconLeft } from '@arco-design/web-vue/es/icon'
import { getManagedOrg, openManagedOrgApp, saveManagedOrgApps } from '@/api/mt'
import type { OrgAuthorizedApp, OrgManageLog, OrgManageProfile, OrgAppUsageRow } from '@/mock/orgApps'
import type { OrgAuthStatus, OrgOpenVersion } from '@/mock/mt'
import { AUTH_STATUS_LABEL, OPEN_VERSION_LABEL } from '@/utils/orgLicense'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const tab = ref<'apps' | 'usage' | 'logs'>('apps')
const profile = ref<OrgManageProfile | null>(null)
const apps = ref<OrgAuthorizedApp[]>([])
const usage = ref<OrgAppUsageRow[]>([])
const logs = ref<OrgManageLog[]>([])
const usageColumns = [
  { title: '应用名称', dataIndex: 'appName' },
  { title: '最近使用', dataIndex: 'lastUsedAt', width: 180 },
  { title: '活跃用户', dataIndex: 'activeUsers', width: 110 },
  { title: '调用次数', dataIndex: 'callCount', width: 110 },
]
const logColumns = [
  { title: '操作类型', dataIndex: 'action', slotName: 'action', width: 100 },
  { title: '操作内容', dataIndex: 'summary' },
  { title: '操作人', dataIndex: 'operator', width: 120 },
  { title: '操作时间', dataIndex: 'operatedAt', width: 180 },
]

function versionText(v?: OrgOpenVersion) {
  return OPEN_VERSION_LABEL[v || 'formal']
}
function authRunningText(v?: OrgAuthStatus) {
  if (v === 'running') return '已开通运行中'
  return AUTH_STATUS_LABEL[v || 'running']
}
function authColor(v?: OrgAuthStatus) {
  if (v === 'expired') return 'orangered'
  if (v === 'closed') return 'gray'
  if (v === 'disabled') return 'red'
  return 'green'
}
function statusText(status: OrgAuthorizedApp['status']) {
  if (status === 'closed_reopen') return '已关闭但可重新授权'
  if (status === 'pending') return '待开通'
  return '已开通运行中'
}

async function load() {
  const id = String(route.params.id || '')
  if (!id) {
    profile.value = null
    return
  }
  loading.value = true
  try {
    const res = await getManagedOrg(id)
    profile.value = res.profile
    apps.value = res.apps
    usage.value = res.usage
    logs.value = res.logs
  } catch (e) {
    profile.value = null
    Message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

async function onOpen(app: OrgAuthorizedApp) {
  try {
    const updated = await openManagedOrgApp(String(route.params.id), app.id)
    apps.value = apps.value.map((item) => (item.id === updated.id ? updated : item))
    Message.success(`已开通「${app.name}」`)
    const res = await getManagedOrg(String(route.params.id))
    usage.value = res.usage
    logs.value = res.logs
  } catch (e) {
    Message.error(e instanceof Error ? e.message : '开通失败')
  }
}

async function onSave() {
  try {
    await saveManagedOrgApps(String(route.params.id), apps.value)
    Message.success('授权配置已保存')
  } catch (e) {
    Message.error(e instanceof Error ? e.message : '保存失败')
  }
}

function onHint(name: string) {
  Message.info(`${name}请在正式环境配置，当前为原型演示`)
}

function goUsers() {
  router.push({ path: '/org/users', query: { orgId: String(route.params.id) } })
}

watch(
  () => route.params.id,
  () => {
    tab.value = 'apps'
    load()
  },
  { immediate: true },
)
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: none;
  color: #86909c;
  font-size: 13px;
  cursor: pointer;
  width: fit-content;
}
.back-link:hover { color: var(--mt-primary, #165dff); }
.org-detail__spin { display: block; width: 100%; }
.org-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 22px;
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 12px;
  box-shadow: var(--mt-card-shadow);
}
.org-hero__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.org-hero__name {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1d2129;
  line-height: 1.3;
}
.org-hero__id {
  font-size: 13px;
  color: #86909c;
}
.org-hero__full {
  margin-top: 6px;
  font-size: 13px;
  color: #4e5969;
}
.org-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: 12px;
  font-size: 13px;
  color: #86909c;
}
.org-hero__expire {
  flex-shrink: 0;
  min-width: 200px;
  padding: 12px 16px;
  border: 1px dashed #bedaff;
  border-radius: 10px;
  background: #f7faff;
  text-align: right;
}
.org-hero__expire-label {
  font-size: 12px;
  color: #86909c;
}
.org-hero__expire-value {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 700;
  color: #1d2129;
  font-variant-numeric: tabular-nums;
}
.org-hero__remain { font-size: 13px; font-weight: 500; color: #165dff; }
.org-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.org-actions__left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.apps-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.apps-head__tabs { display: flex; align-items: center; gap: 16px; }
.apps-head__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  border: 0;
  background: none;
  color: #86909c;
  font-size: 14px;
  cursor: pointer;
}
.apps-head__tab.is-active {
  color: #165dff;
  font-weight: 600;
  box-shadow: inset 0 -2px 0 #165dff;
  cursor: default;
}
.apps-desc {
  margin: 0 0 16px;
  font-size: 13px;
  color: #86909c;
  line-height: 1.55;
}
.app-list { display: flex; flex-direction: column; gap: 12px; }
.app-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px 160px 140px;
  gap: 16px;
  align-items: center;
  padding: 16px 18px;
  border: 1px solid #e5e6eb;
  border-radius: 10px;
  background: #fafbfd;
}
.app-card__name { font-size: 15px; font-weight: 600; color: #1d2129; }
.app-card__desc { margin-top: 4px; font-size: 12px; color: #86909c; line-height: 1.5; }
.app-card__status { font-size: 13px; }
.app-card__status.is-running { color: #00b42a; }
.app-card__status.is-closed_reopen { color: #86909c; }
.app-card__status.is-pending { color: #d25f00; }
.app-card__side {
  text-align: right;
  font-size: 13px;
  color: #4e5969;
}
@media (max-width: 960px) {
  .org-hero { flex-direction: column; }
  .org-hero__expire { text-align: left; }
  .app-card { grid-template-columns: 1fr; }
  .app-card__side { text-align: left; }
}
</style>
