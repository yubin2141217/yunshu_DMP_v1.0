<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <h2 class="page-title">机构用户管理</h2>
        <p class="page-desc">统一管理本机构人员开通状态与组织角色</p>
      </div>
      <div class="head-actions">
        <a-dropdown trigger="click" @select="onSwitchOrg">
          <a-button>切换机构</a-button>
          <template #content>
            <a-doption v-for="o in orgOptions" :key="o.value" :value="o.value">{{ o.label }}</a-doption>
          </template>
        </a-dropdown>
        <span class="current-org">{{ currentOrgLabel }}</span>
      </div>
    </div>

    <div class="org-kpi-row">
      <button
        type="button"
        class="org-kpi tone-running"
        :class="{ 'is-active': kpiFilter === 'activated' }"
        @click="filterByKpi('activated')"
      >
        <div class="org-kpi__head">
          <span>已激活已开通</span>
          <IconCheckCircle class="org-kpi__icon" />
        </div>
        <div class="org-kpi__value">{{ kpis.activated }}<span class="org-kpi__unit">人</span></div>
        <div class="org-kpi__hint">已开通且本机构授权人员清单</div>
      </button>
      <button
        type="button"
        class="org-kpi tone-expired"
        :class="{ 'is-active': kpiFilter === 'inactive' }"
        @click="filterByKpi('inactive')"
      >
        <div class="org-kpi__head">
          <span>未开通</span>
          <IconClockCircle class="org-kpi__icon" />
        </div>
        <div class="org-kpi__value">{{ kpis.inactive }}<span class="org-kpi__unit">人</span></div>
        <div class="org-kpi__hint">未开通或还需要授权的人员清单</div>
      </button>
      <button
        type="button"
        class="org-kpi tone-closed"
        :class="{ 'is-active': kpiFilter === 'unfollowed' }"
        @click="filterByKpi('unfollowed')"
      >
        <div class="org-kpi__head">
          <span>未关注企业微信</span>
          <IconWechat class="org-kpi__icon" />
        </div>
        <div class="org-kpi__value">{{ kpis.unfollowed }}<span class="org-kpi__unit">人</span></div>
        <div class="org-kpi__hint">未关注企业公众号【指令中心】，关注后方可授权</div>
      </button>
    </div>

    <a-card class="content-card" :bordered="false">
      <div class="staff-toolbar">
        <div class="staff-tabs">
          <button type="button" class="staff-tab" :class="{ 'is-active': enabledTab }" @click="setEnabled(true)">
            已启用人员列表（共 {{ kpis.enabled }} 人）
          </button>
          <button type="button" class="staff-tab" :class="{ 'is-active': !enabledTab }" @click="setEnabled(false)">
            已停用人员
          </button>
        </div>
        <div class="staff-filters">
          <div class="search-field">
            <span class="search-field__label">角色</span>
            <a-select v-model="form.role" :options="roleOptions" allow-clear style="width: 140px" />
          </div>
          <div class="search-field">
            <span class="search-field__label">关键字</span>
            <a-input
              v-model="form.keyword"
              allow-clear
              style="width: 240px"
            />
          </div>
          <a-button type="primary" @click="fetchData(1)">搜索</a-button>
          <a-button @click="onReset">重置</a-button>
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
        :row-selection="{ type: 'checkbox', showCheckedAll: true, width: 48 }"
        v-model:selectedKeys="selectedKeys"
      >
        <template #index="{ rowIndex }">
          {{ (pagination.current - 1) * pagination.pageSize + rowIndex + 1 }}
        </template>
        <template #name="{ record }">
          <div class="name-cell">
            <a-avatar :size="32" :style="{ background: record.avatarColor }">{{ record.name.slice(0, 1) }}</a-avatar>
            <span class="name-text">{{ record.name }}</span>
          </div>
        </template>
        <template #node="{ record }">
          <a-tag color="arcoblue" size="small">{{ record.node }}</a-tag>
        </template>
        <template #role="{ record }">
          <a-tag :color="record.role === 'admin' ? 'red' : 'gray'" size="small">
            {{ record.role === 'admin' ? '主管理员' : '使用成员' }}
          </a-tag>
        </template>
        <template #status="{ record }">
          <a-tag :color="record.enabled ? 'green' : 'gray'" size="small">
            {{ record.enabled ? '已启用' : '已停用' }}
          </a-tag>
        </template>
      </a-table>
      <div class="table-footer">
        <a-pagination
          v-model:current="pagination.current"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          show-total
          show-page-size
          @change="fetchData"
          @page-size-change="onPageSize"
        />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconCheckCircle, IconClockCircle, IconWechat } from '@arco-design/web-vue/es/icon'
import { listOrgOptions, listOrgStaff } from '@/api/mt'
import type { OrgStaff, OrgStaffKpiFilter } from '@/mock/orgStaff'

const route = useRoute()
const router = useRouter()
const roleOptions = [
  { label: '全部角色', value: '' },
  { label: '主管理员', value: 'admin' },
  { label: '使用成员', value: 'member' },
]
const form = reactive({ role: '', keyword: '' })
const enabledTab = ref(true)
const kpiFilter = ref<OrgStaffKpiFilter>('')
const orgId = computed(() => String(route.query.orgId || ''))
const orgOptions = ref<{ label: string; value: string }[]>([])
const currentOrgLabel = computed(() => orgOptions.value.find((o) => o.value === orgId.value)?.label || '请选择机构')
const data = ref<OrgStaff[]>([])
const loading = ref(false)
const selectedKeys = ref<(string | number)[]>([])
const pagination = reactive({ current: 1, pageSize: 20, total: 0 })
const kpis = reactive({ activated: 0, inactive: 0, unfollowed: 0, enabled: 0, disabled: 0 })
const columns = [
  { title: '序号', slotName: 'index', width: 64 },
  { title: '姓名', dataIndex: 'name', slotName: 'name', width: 180 },
  { title: '名称备注', dataIndex: 'remark', ellipsis: true, tooltip: true },
  { title: '组织节点', dataIndex: 'node', slotName: 'node', width: 140 },
  { title: '角色', dataIndex: 'role', slotName: 'role', width: 110 },
  { title: '电话', dataIndex: 'phone', width: 140 },
  { title: '启用状态', dataIndex: 'enabled', slotName: 'status', width: 100 },
]

function filterByKpi(key: OrgStaffKpiFilter) {
  kpiFilter.value = kpiFilter.value === key ? '' : key
  fetchData(1)
}

function setEnabled(enabled: boolean) {
  enabledTab.value = enabled
  fetchData(1)
}

function onReset() {
  form.role = ''
  form.keyword = ''
  kpiFilter.value = ''
  fetchData(1)
}

function onPageSize(size: number) {
  pagination.pageSize = size
  fetchData(1)
}

function onSwitchOrg(id: string | number | Record<string, any> | undefined) {
  if (typeof id !== 'string' && typeof id !== 'number') return
  router.replace({ path: '/org/users', query: { orgId: String(id) } })
}

async function loadOrgOptions() {
  const list = await listOrgOptions()
  orgOptions.value = list.map((o) => ({ label: o.label, value: o.value }))
  if (!orgId.value && list[0]) {
    const preferred = list.find((o) => o.id === 'o5') || list[0]
    await router.replace({ path: '/org/users', query: { orgId: preferred.id } })
  }
}

async function fetchData(page = pagination.current) {
  if (!orgId.value) return
  loading.value = true
  try {
    const res = await listOrgStaff({
      orgId: orgId.value,
      enabled: enabledTab.value,
      role: form.role,
      keyword: form.keyword,
      kpi: kpiFilter.value,
      page,
      pageSize: pagination.pageSize,
    })
    data.value = res.list
    pagination.current = page
    pagination.total = res.total
    Object.assign(kpis, res.kpis)
    selectedKeys.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => route.query.orgId,
  async () => {
    await loadOrgOptions()
    await fetchData(1)
  },
  { immediate: true },
)
</script>

<style scoped>
.current-org {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}
.org-kpi-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
.org-kpi__icon { font-size: 16px; }
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
  line-height: 1.45;
}
.tone-running { border-color: #b7eb8f; }
.tone-running .org-kpi__icon,
.tone-running .org-kpi__value { color: #00b42a; }
.tone-expired { border-color: #ffd591; }
.tone-expired .org-kpi__icon,
.tone-expired .org-kpi__value { color: #d25f00; }
.tone-closed .org-kpi__icon { color: #00b42a; }
.tone-running.is-active,
.tone-expired.is-active,
.tone-closed.is-active {
  box-shadow: 0 0 0 1px currentColor inset, var(--mt-card-shadow);
}
.tone-running.is-active { color: #00b42a; }
.tone-expired.is-active { color: #d25f00; }
.tone-closed.is-active { color: #00b42a; border-color: #00b42a; }
.staff-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.staff-tabs { display: flex; gap: 8px; }
.staff-tab {
  padding: 8px 4px;
  border: 0;
  background: none;
  color: #86909c;
  font-size: 14px;
  cursor: pointer;
}
.staff-tab.is-active {
  color: #165dff;
  font-weight: 600;
  box-shadow: inset 0 -2px 0 #165dff;
}
.staff-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.name-text { font-weight: 600; color: #1d2129; }
</style>
