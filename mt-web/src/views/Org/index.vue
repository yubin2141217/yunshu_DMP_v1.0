<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <h2 class="page-title">机构管理</h2>
        <p class="page-desc">查看已开通机构的授权状态、到期日与所属销售，支持快捷开通新机构</p>
      </div>
      <div v-if="kpis.expiringSoon" class="expire-banner">即将到期：建议尽快续费，避免影响机构使用</div>
    </div>

    <div class="org-kpi-row">
      <button
        v-for="card in kpiCards"
        :key="card.key"
        type="button"
        class="org-kpi"
        :class="[card.tone, { 'is-active': kpiFilter === card.key }]"
        @click="filterByKpi(card.key)"
      >
        <div class="org-kpi__head">
          <span>{{ card.label }}</span>
          <component :is="card.icon" class="org-kpi__icon" />
        </div>
        <div class="org-kpi__value">
          {{ card.value }}
          <span class="org-kpi__unit">家</span>
        </div>
        <div class="org-kpi__hint">{{ card.hint }}</div>
      </button>
    </div>

    <a-card class="content-card" :bordered="false">
      <div class="page-search">
        <div class="search-field">
          <span class="search-field__label">统计单元</span>
          <a-select
            v-model="form.statUnit"
            :options="statUnitOptions"
            allow-clear
            style="width: 160px"
          />
        </div>
        <div class="search-field">
          <span class="search-field__label">关键字</span>
          <a-input
            v-model="form.keyword"
            allow-clear
            style="width: 280px"
          />
        </div>
        <div class="search-field">
          <span class="search-field__label">所属销售</span>
          <a-select
            v-model="form.salesName"
            :options="salesOptions"
            allow-clear
            style="width: 140px"
          />
        </div>
        <div class="search-field">
          <span class="search-field__label">授权版本</span>
          <a-select
            v-model="form.openVersion"
            :options="versionOptions"
            allow-clear
            style="width: 130px"
          />
        </div>
        <div class="search-field">
          <span class="search-field__label">授权状态</span>
          <a-select
            v-model="form.authStatus"
            :options="authOptions"
            allow-clear
            style="width: 130px"
          />
        </div>
        <a-button type="primary" @click="fetchData(1)">搜索</a-button>
        <a-button @click="onReset">重置</a-button>
        <div class="page-search-actions">
          <a-button type="primary" @click="openCreate">
            <template #icon><IconPlus /></template>
            快捷开通新机构
          </a-button>
        </div>
      </div>

      <a-table
        :columns="columns"
        :data="data"
        :loading="loading"
        row-key="id"
        :pagination="false"
        :bordered="false"
        stripe
      >
        <template #org="{ record }">
          <button type="button" class="org-name" @click="goDetail(record.id)">{{ record.name }}</button>
          <div class="cell-sub">{{ record.region || '—' }} · {{ record.statUnit || '—' }}</div>
        </template>
        <template #sales="{ record }">
          <span class="sales-cell">
            <IconUser class="sales-icon" />
            {{ record.salesName || '—' }}
          </span>
        </template>
        <template #version="{ record }">
          <a-tag :color="record.openVersion === 'trial' ? 'orangered' : 'purple'" size="small">
            {{ versionText(record.openVersion) }}
          </a-tag>
        </template>
        <template #auth="{ record }">
          <a-tag :color="authColor(record.authStatus)" size="small">{{ authText(record.authStatus) }}</a-tag>
        </template>
        <template #expire="{ record }">
          <div class="expire-main" :class="{ 'is-overdue': isOverdue(record.expireAt) }">
            到期：{{ record.expireAt || '—' }}
          </div>
          <div v-if="remainDays(record.expireAt) != null" class="expire-sub" :class="{ 'is-overdue': isOverdue(record.expireAt) }">
            <template v-if="!isOverdue(record.expireAt)">还剩 {{ remainDays(record.expireAt) }} 天</template>
            <template v-else>
              已逾期 {{ overdueDays(record.expireAt) }} 天
              <a-tag color="red" size="small" class="overdue-tag">已到期</a-tag>
            </template>
          </div>
        </template>
        <template #operations="{ record }">
          <a-button type="text" size="small" @click="goDetail(record.id)">管理</a-button>
        </template>
      </a-table>
      <div class="table-footer">
        <a-pagination
          v-model:current="pagination.current"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          show-total
          show-page-size
          show-jumper
          @change="fetchData"
          @page-size-change="onPageSize"
        />
      </div>
    </a-card>

    <a-modal v-model:visible="visible" title="快捷开通新机构" :on-before-ok="onSubmit" @cancel="visible = false">
      <a-form ref="formRef" :model="editor" :rules="rules" layout="vertical">
        <a-form-item field="name" label="机构名称" required>
          <a-input v-model="editor.name" :max-length="50" placeholder="请输入机构名称" />
        </a-form-item>
        <a-form-item field="code" label="机构编码" required>
          <a-input v-model="editor.code" :max-length="32" placeholder="供数方 org_id 将填此值" />
        </a-form-item>
        <a-form-item field="statUnit" label="统计单元">
          <a-input v-model="editor.statUnit" :max-length="32" placeholder="如 陕西大区" />
        </a-form-item>
        <a-form-item field="salesName" label="所属销售">
          <a-input v-model="editor.salesName" :max-length="20" placeholder="请输入" />
        </a-form-item>
        <a-form-item field="region" label="所在区划">
          <a-input v-model="editor.region" :max-length="40" placeholder="如 西安市/雁塔区" />
        </a-form-item>
        <a-form-item field="openVersion" label="开通版本" required>
          <a-select v-model="editor.openVersion" :options="versionOptions.filter((o) => o.value)" />
        </a-form-item>
        <a-form-item field="expireAt" label="授权到期日期" required>
          <a-date-picker v-model="editor.expireAt" value-format="YYYY-MM-DD" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message, type FormInstance } from '@arco-design/web-vue'
import {
  IconCheckCircle,
  IconCloseCircle,
  IconMinusCircle,
  IconPlus,
  IconStorage,
  IconUser,
} from '@arco-design/web-vue/es/icon'
import { createManagedOrg, listManagedOrgs } from '@/api/mt'
import type { Org, OrgAuthStatus, OrgOpenVersion } from '@/mock/mt'
import { AUTH_STATUS_LABEL, daysUntil, OPEN_VERSION_LABEL } from '@/utils/orgLicense'
import { clearFormValidate, validateForm } from '@/utils/formValidate'

type KpiKey = '' | OrgAuthStatus

const router = useRouter()
const versionOptions = [
  { label: '全部授权', value: '' },
  { label: '正式版', value: 'formal' },
  { label: '试用版', value: 'trial' },
]
const authOptions = [
  { label: '全部状态', value: '' },
  { label: '已开通', value: 'running' },
  { label: '已到期', value: 'expired' },
  { label: '已关闭', value: 'closed' },
  { label: '已禁用', value: 'disabled' },
]
const form = reactive({ keyword: '', statUnit: '', salesName: '', openVersion: '', authStatus: '' })
const kpiFilter = ref<KpiKey>('')
const data = ref<Org[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const kpis = reactive({ total: 0, running: 0, expired: 0, closed: 0, disabled: 0, expiringSoon: 0 })
const statUnitOptions = ref<{ label: string; value: string }[]>([])
const salesOptions = ref<{ label: string; value: string }[]>([])
const visible = ref(false)
const formRef = ref<FormInstance>()
const editor = reactive({
  name: '',
  code: '',
  statUnit: '陕西大区',
  salesName: '',
  region: '',
  openVersion: 'formal' as OrgOpenVersion,
  expireAt: '',
})
const rules = {
  name: [{ required: true, message: '请填写机构名称' }],
  code: [{ required: true, message: '请填写机构编码' }],
  openVersion: [{ required: true, message: '请选择开通版本' }],
  expireAt: [{ required: true, message: '请选择授权到期日期' }],
}
const columns = [
  { title: '机构名称 / 统计单元', dataIndex: 'name', slotName: 'org', ellipsis: true },
  { title: '所属销售', dataIndex: 'salesName', slotName: 'sales', width: 140 },
  { title: '开通版本', dataIndex: 'openVersion', slotName: 'version', width: 100 },
  { title: '授权状态', dataIndex: 'authStatus', slotName: 'auth', width: 100 },
  { title: '授权到期日期', dataIndex: 'expireAt', slotName: 'expire', width: 200 },
  { title: '操作', dataIndex: 'operations', slotName: 'operations', width: 88 },
]

const kpiCards = computed(() => [
  { key: '' as KpiKey, label: '机构总数', value: kpis.total, hint: '全部管理机构', tone: 'tone-total', icon: IconStorage },
  { key: 'running' as KpiKey, label: '已开通数（运行中）', value: kpis.running, hint: '正在使用中', tone: 'tone-running', icon: IconCheckCircle },
  { key: 'expired' as KpiKey, label: '已到期数', value: kpis.expired, hint: '请尽快续费', tone: 'tone-expired', icon: IconCloseCircle },
  { key: 'closed' as KpiKey, label: '已关闭数', value: kpis.closed, hint: '暂停使用的机构', tone: 'tone-closed', icon: IconMinusCircle },
  { key: 'disabled' as KpiKey, label: '已禁用数', value: kpis.disabled, hint: '已接入但冻结', tone: 'tone-disabled', icon: IconMinusCircle },
])

function versionText(v?: OrgOpenVersion) {
  return OPEN_VERSION_LABEL[v || 'formal']
}
function authText(v?: OrgAuthStatus) {
  return AUTH_STATUS_LABEL[v || 'running']
}
function authColor(v?: OrgAuthStatus) {
  if (v === 'expired') return 'orangered'
  if (v === 'closed') return 'gray'
  if (v === 'disabled') return 'red'
  return 'green'
}
function remainDays(expireAt?: string) {
  return daysUntil(expireAt)
}
function isOverdue(expireAt?: string) {
  const days = daysUntil(expireAt)
  return days != null && days < 0
}
function overdueDays(expireAt?: string) {
  const days = daysUntil(expireAt)
  return days == null ? 0 : Math.abs(days)
}

function filterByKpi(key: KpiKey) {
  kpiFilter.value = key
  form.authStatus = key
  fetchData(1)
}

async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const res = await listManagedOrgs({
      keyword: form.keyword,
      statUnit: form.statUnit,
      salesName: form.salesName,
      openVersion: form.openVersion,
      authStatus: form.authStatus,
      page,
      pageSize: pagination.pageSize,
    })
    data.value = res.list
    pagination.current = page
    pagination.total = res.total
    Object.assign(kpis, res.kpis)
    kpiFilter.value = (form.authStatus || '') as KpiKey
    statUnitOptions.value = res.filterOptions.statUnits
    salesOptions.value = res.filterOptions.salesNames
  } finally {
    loading.value = false
  }
}

function onReset() {
  form.keyword = ''
  form.statUnit = ''
  form.salesName = ''
  form.openVersion = ''
  form.authStatus = ''
  kpiFilter.value = ''
  fetchData(1)
}

function onPageSize(size: number) {
  pagination.pageSize = size
  fetchData(1)
}

function goDetail(orgId: string) {
  router.push(`/org/open/${orgId}`)
}

function nextYear() {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function openCreate() {
  editor.name = ''
  editor.code = ''
  editor.statUnit = '陕西大区'
  editor.salesName = ''
  editor.region = ''
  editor.openVersion = 'formal'
  editor.expireAt = nextYear()
  visible.value = true
  clearFormValidate(formRef.value)
}

async function onSubmit() {
  const ok = await validateForm(formRef.value)
  if (!ok) return false
  try {
    await createManagedOrg({ ...editor })
    Message.success('机构已开通')
    visible.value = false
    await fetchData(1)
    return true
  } catch (e) {
    Message.error(e instanceof Error ? e.message : '开通失败')
    return false
  }
}

onMounted(() => fetchData(1))
</script>

<style scoped>
.expire-banner {
  max-width: 420px;
  padding: 8px 14px;
  border-radius: 999px;
  background: #fff7e8;
  border: 1px solid #ffcf8b;
  color: #d25f00;
  font-size: 13px;
  line-height: 1.45;
}
.org-kpi-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}
.org-kpi {
  text-align: left;
  padding: 16px 18px 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e6eb;
  cursor: pointer;
  box-shadow: var(--mt-card-shadow, 0 1px 2px rgba(15, 23, 42, 0.04));
}
.org-kpi__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #86909c;
}
.org-kpi__icon {
  font-size: 16px;
}
.org-kpi__value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
  color: #1d2129;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}
.org-kpi__unit {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #86909c;
}
.org-kpi__hint {
  margin-top: 6px;
  font-size: 12px;
  color: #c9cdd4;
}
.tone-total .org-kpi__icon { color: #165dff; }
.tone-running { border-color: #b7eb8f; }
.tone-running .org-kpi__icon,
.tone-running .org-kpi__value { color: #00b42a; }
.tone-expired { border-color: #ffd591; }
.tone-expired .org-kpi__icon,
.tone-expired .org-kpi__value { color: #d25f00; }
.tone-closed .org-kpi__icon { color: #86909c; }
.tone-disabled { border-color: #ffccc7; background: #fff2f0; }
.tone-disabled .org-kpi__icon,
.tone-disabled .org-kpi__value { color: #f53f3f; }
.org-kpi.is-active.tone-total,
.org-kpi.is-active.tone-running,
.org-kpi.is-active.tone-expired,
.org-kpi.is-active.tone-closed,
.org-kpi.is-active.tone-disabled {
  box-shadow: 0 0 0 1px currentColor inset, var(--mt-card-shadow);
}
.tone-total.is-active { color: #165dff; border-color: #165dff; }
.tone-running.is-active { color: #00b42a; }
.tone-expired.is-active { color: #d25f00; }
.tone-closed.is-active { color: #4e5969; border-color: #86909c; }
.tone-disabled.is-active { color: #f53f3f; }
.org-name {
  padding: 0;
  border: 0;
  background: none;
  color: #1d2129;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  line-height: 1.4;
}
.org-name:hover { color: var(--mt-primary, #165dff); }
.cell-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.35;
}
.sales-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #4e5969;
}
.sales-icon { color: #c9cdd4; }
.expire-main { font-size: 13px; color: #1d2129; }
.expire-main.is-overdue { color: #f53f3f; font-weight: 600; }
.expire-sub { margin-top: 2px; font-size: 12px; color: #86909c; }
.expire-sub.is-overdue { color: #f53f3f; }
.overdue-tag { margin-left: 6px; }
@media (max-width: 1200px) {
  .org-kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
