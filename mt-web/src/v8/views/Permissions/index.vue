<template>
  <div class="workplace-page">
    <div class="workplace-header">
      <div>
        <h2 class="workplace-title">用户与数据权限</h2>
        <p class="workplace-desc">管理本机构用户。</p>
      </div>
    </div>

    <a-card class="content-card" :bordered="false">
      <a-alert type="info" class="v8-perm-note">
        账号开通、实名与微信绑定由公司统一认证中心管理，本页不新增/删除账号，仅调整已加入用户的数据权限。
      </a-alert>

      <a-table :columns="columns" :data="users" :loading="loading" row-key="id" :pagination="false" stripe>
        <template #role="{ record }">
          <a-tag :color="roleOf(record.role).color" size="small">{{ roleOf(record.role).label }}</a-tag>
        </template>
        <template #scope="{ record }">
          <a-tooltip :content="scopeText(record)">
            <span>{{ record.supplierScope === '*' ? `全部供方（${record.supplierCount}）` : `${record.supplierCount} 个供方` }}</span>
          </a-tooltip>
        </template>
        <template #menus="{ record }">
          <a-tooltip :content="menuText(record)">
            <span>{{ record.menus === '*' ? `全部菜单（${record.menuCount}）` : `${record.menuCount} 个菜单` }}</span>
          </a-tooltip>
        </template>
        <template #status="{ record }">
          <a-badge :status="record.status === 'enabled' ? 'success' : 'danger'" :text="record.status === 'enabled' ? '正常' : '停用'" />
        </template>
        <template #operations="{ record }">
          <a-link @click="openEdit(record)">编辑权限</a-link>
          <a-link
            :style="{ marginLeft: '12px', color: record.status === 'enabled' ? '#f53f3f' : '#00b42a' }"
            @click="onToggle(record)"
          >
            {{ record.status === 'enabled' ? '停用' : '启用' }}
          </a-link>
        </template>
        <template #empty><a-empty description="暂无机构用户" /></template>
      </a-table>
    </a-card>

    <!-- 编辑权限抽屉 -->
    <a-drawer :visible="editVisible" :width="520" :mask-closable="false" @cancel="editVisible = false">
      <template #title>编辑数据权限</template>
      <template v-if="editing">
        <div class="v8-edit-user">
          <a-avatar :size="40" style="background: rgb(var(--primary-6))">{{ editing.name.slice(0, 1) }}</a-avatar>
          <div>
            <div class="v8-edit-name">{{ editing.name }}</div>
            <div class="v8-edit-account">{{ editing.accountMasked }} · {{ editing.phoneMasked }}</div>
          </div>
        </div>

        <div class="v8-form-label">角色</div>
        <a-radio-group v-model="form.role" type="button" @change="onRolePreset">
          <a-radio value="admin">机构管理员</a-radio>
          <a-radio value="duty">值班人员</a-radio>
          <a-radio value="readonly">只读人员</a-radio>
        </a-radio-group>

        <div class="v8-form-row">
          <div class="v8-form-label">
            菜单权限
            <a-checkbox :model-value="allMenusChecked" :indeterminate="menuIndeterminate" @change="onToggleAllMenus">
              全选
            </a-checkbox>
          </div>
          <a-checkbox-group v-model="form.menus" direction="horizontal" class="v8-check-grid">
            <a-checkbox v-for="m in editableMenus" :key="m.key" :value="m.key">{{ m.title }}</a-checkbox>
          </a-checkbox-group>
        </div>

        <div class="v8-form-row">
          <div class="v8-form-label">
            可见供数方
            <a-checkbox
              :model-value="form.supplierScope === '*'"
              @change="onToggleAllSuppliers"
            >
              全部供数方
            </a-checkbox>
          </div>
          <a-checkbox-group
            v-if="Array.isArray(form.supplierScope)"
            v-model="form.supplierScope"
            direction="horizontal"
            class="v8-check-grid"
          >
            <a-checkbox v-for="s in supplierOpts" :key="s.value" :value="s.value">{{ s.label }}</a-checkbox>
          </a-checkbox-group>
          <div v-else class="v8-scope-all-tip">已授权查看本机构全部供数方。</div>
        </div>
      </template>
      <template #footer>
        <a-button @click="editVisible = false">取消</a-button>
        <a-button type="primary" :loading="saving" @click="onSave">保存</a-button>
      </template>
    </a-drawer>

    <!-- 模块内容引用 V8 集成应用中心，暂不可关闭；提供返回按钮回到上一页 -->
    <a-modal
      :visible="true"
      :closable="false"
      :mask-closable="false"
      :esc-to-close="false"
      :mask="true"
      width="420px"
      title="用户与数据权限"
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconInfoCircle, IconLeft } from '@arco-design/web-vue/es/icon'
import { getSuppliers } from '@/v8/api/data'
import { getOrgUsers, toggleUserStatus, updateUserPermission } from '@/v8/api/system'
import { V8_MENUS } from '@/v8/config/menus'
import {
  type MenuKey,
  type OrgUser,
  type V8Role,
} from '@/v8/mock/types'

const router = useRouter()

/** 回退上个页面；无历史记录时兜底回数据概览 */
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/v8/overview')
  }
}

const roleMeta: Record<V8Role, { label: string; color: string }> = {
  admin: { label: '管理员', color: 'purple' },
  duty: { label: '值班', color: 'blue' },
  readonly: { label: '只读', color: 'gray' },
}
const roleOf = (r: V8Role) => roleMeta[r]

/** 权限类菜单（个人设置默认人人可用，不纳入授权勾选） */
const editableMenus = V8_MENUS.filter((m) => m.key !== 'settings')

const loading = ref(false)
const users = ref<OrgUser[]>([])
const supplierOpts = ref<{ label: string; value: string }[]>([])

const columns = [
  { title: '姓名', dataIndex: 'name', width: 110 },
  { title: '账号', dataIndex: 'accountMasked', width: 180, ellipsis: true, tooltip: true },
  { title: '角色', dataIndex: 'role', slotName: 'role', width: 90 },
  { title: '菜单权限', dataIndex: 'menus', slotName: 'menus', width: 120 },
  { title: '可见供方', dataIndex: 'scope', slotName: 'scope', width: 130 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 90 },
  { title: '最近登录', dataIndex: 'lastLoginAt', width: 160 },
  { title: '操作', dataIndex: 'operations', slotName: 'operations', width: 150 },
]

function menuText(u: OrgUser) {
  if (u.menus === '*') return '全部菜单'
  return u.menus.map((k) => V8_MENUS.find((m) => m.key === k)?.title || k).join('、')
}
function scopeText(u: OrgUser) {
  return u.supplierScope === '*' ? '全部供数方' : `供数方 ${u.supplierScope.length} 个`
}

async function load() {
  loading.value = true
  try {
    users.value = await getOrgUsers()
  } finally {
    loading.value = false
  }
}

// ── 编辑权限 ──
const editVisible = ref(false)
const saving = ref(false)
const editing = ref<OrgUser | null>(null)
const form = reactive<{ role: V8Role; menus: MenuKey[]; supplierScope: string[] | '*' }>({
  role: 'readonly',
  menus: [],
  supplierScope: [],
})

const allMenusChecked = computed(() => form.menus.length === editableMenus.length)
const menuIndeterminate = computed(() => form.menus.length > 0 && form.menus.length < editableMenus.length)

const ROLE_PRESET: Record<V8Role, MenuKey[]> = {
  admin: editableMenus.map((m) => m.key),
  duty: ['overview', 'dataCheck', 'suppliers', 'monitor', 'pushback', 'message', 'spec'],
  readonly: ['overview', 'dataCheck', 'suppliers', 'message'],
}

function openEdit(u: OrgUser) {
  editing.value = u
  form.role = u.role
  form.menus = u.menus === '*' ? editableMenus.map((m) => m.key) : [...u.menus]
  form.supplierScope = u.supplierScope === '*' ? '*' : [...u.supplierScope]
  editVisible.value = true
}

function onRolePreset(role: V8Role | string | number | boolean) {
  const r = role as V8Role
  form.menus = [...ROLE_PRESET[r]]
}

function onToggleAllMenus(checked: boolean | (string | number | boolean)[]) {
  form.menus = checked ? editableMenus.map((m) => m.key) : []
}

function onToggleAllSuppliers(checked: boolean | (string | number | boolean)[]) {
  form.supplierScope = checked ? '*' : []
}

async function onSave() {
  if (!editing.value) return
  if (!form.menus.length) {
    Message.warning('请至少选择一个菜单权限')
    return
  }
  if (form.supplierScope !== '*' && !form.supplierScope.length) {
    Message.warning('请至少选择一个可见供数方，或勾选全部供数方')
    return
  }
  saving.value = true
  try {
    const updated = await updateUserPermission(editing.value.id, {
      role: form.role,
      menus: form.menus,
      supplierScope: form.supplierScope,
    })
    if (updated) {
      const idx = users.value.findIndex((u) => u.id === updated.id)
      if (idx > -1) users.value[idx] = updated
    }
    Message.success('权限已更新')
    editVisible.value = false
  } finally {
    saving.value = false
  }
}

async function onToggle(u: OrgUser) {
  const updated = await toggleUserStatus(u.id)
  if (updated) {
    const idx = users.value.findIndex((x) => x.id === u.id)
    if (idx > -1) users.value[idx] = updated
    Message.success(updated.status === 'enabled' ? '账号已启用' : '账号已停用')
  }
}

onMounted(async () => {
  const res = await getSuppliers({ keyword: '', health: '', page: 1, pageSize: 200 })
  supplierOpts.value = res.list.map((s) => ({ label: s.name, value: s.id }))
  load()
})
</script>

<style lang="scss" scoped>
.v8-perm-note {
  margin-bottom: 16px;
}
.v8-edit-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  margin-bottom: 18px;
  border-bottom: 1px solid #f2f3f5;
}
.v8-edit-name {
  font-weight: 600;
  color: #1d2129;
}
.v8-edit-account {
  font-size: 12px;
  color: #86909c;
  margin-top: 2px;
}
.v8-form-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #4e5969;
  margin-bottom: 10px;
}
.v8-form-row {
  margin-top: 20px;
}
.v8-check-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}
.v8-scope-all-tip {
  font-size: 13px;
  color: #86909c;
  padding: 10px 12px;
  background: #f7f8fa;
  border-radius: 6px;
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
