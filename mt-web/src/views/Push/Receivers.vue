<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <h2 class="page-title">接收方管理</h2>
        <p class="page-desc">维护非 MT的第三方推送接收方机构档案，可关联 MT 机构并填写联系人信息，供推送方案选择。</p>
      </div>
      <a-button type="primary" @click="openCreate">新增接收方机构</a-button>
    </div>

    <a-card class="content-card" :bordered="false">
      <div class="page-search">
        <a-input v-model="form.keyword" placeholder="名称 / 机构ID / 联系人" allow-clear style="width: 220px" />
        <a-select v-model="form.status" :options="statusOptions" placeholder="状态" allow-clear style="width: 140px" />
        <a-select
          v-model="form.relatedMtOrgId"
          :options="mtOrgOptions"
          placeholder="关联 MT 机构"
          allow-clear
          allow-search
          style="width: 220px"
        />
        <a-button type="primary" @click="fetchData(1)">查询</a-button>
        <a-button @click="onReset">重置</a-button>
      </div>

      <a-table :columns="columns" :data="data" :loading="loading" row-key="id" :pagination="false" :bordered="false" stripe>
        <template #code="{ record }">
          <span class="mono">{{ record.code }}</span>
        </template>
        <template #status="{ record }">
          <a-tag :color="record.status === 'enabled' ? 'green' : 'orangered'" size="small">
            {{ record.status === 'enabled' ? '启用' : '停用' }}
          </a-tag>
        </template>
        <template #operations="{ record }">
          <a-space class="arco-table-ops" :size="2">
            <a-button type="text" size="small" @click="openEdit(record)">编辑</a-button>
            <a-button type="text" size="small" @click="onToggle(record)">
              {{ record.status === 'enabled' ? '停用' : '启用' }}
            </a-button>
            <a-button type="text" status="danger" size="small" @click="onDelete(record)">删除</a-button>
          </a-space>
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

    <a-modal
      v-model:visible="visible"
      :title="mode === 'create' ? '新增接收方机构' : '编辑接收方机构'"
      :width="560"
      :on-before-ok="onSubmit"
      @cancel="visible = false"
    >
      <a-form ref="formRef" :model="editor" :rules="rules" layout="vertical">
        <a-form-item field="code" required>
          <template #label>
            <FormFieldLabel title="机构 ID" desc="业务唯一编码，推送对接时使用" />
          </template>
          <a-input v-model="editor.code" :max-length="64" placeholder="如 TP-MEDIA-01" allow-clear />
        </a-form-item>
        <a-form-item field="name" label="机构名称" required>
          <a-input v-model="editor.name" :max-length="100" placeholder="请输入机构名称" allow-clear />
        </a-form-item>
        <a-form-item field="relatedMtOrgId" required>
          <template #label>
            <FormFieldLabel title="关联机构" desc="关联的 MT 机构，便于业务归属与查询" />
          </template>
          <a-select
            v-model="editor.relatedMtOrgId"
            :options="mtOrgOptions"
            allow-search
            allow-clear
            placeholder="请选择 MT 机构"
          />
        </a-form-item>
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item field="contactName" label="联系人">
              <a-input v-model="editor.contactName" :max-length="50" placeholder="可选" allow-clear />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="contactPhone" label="联系电话">
              <a-input v-model="editor.contactPhone" :max-length="32" placeholder="可选" allow-clear />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item field="contactEmail" label="联系邮箱">
          <a-input v-model="editor.contactEmail" :max-length="100" placeholder="可选" allow-clear />
        </a-form-item>
        <a-form-item field="status" label="状态" required>
          <a-select v-model="editor.status" :options="statusOptions.filter((o) => o.value)" />
        </a-form-item>
        <a-form-item field="remark" label="备注">
          <a-textarea v-model="editor.remark" :auto-size="{ minRows: 2, maxRows: 4 }" placeholder="可选" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { Message, Modal, type FormInstance } from '@arco-design/web-vue'
import FormFieldLabel from '@/components/FormFieldLabel.vue'
import {
  deletePushReceiver,
  listPushReceivers,
  pushOrgOptions,
  savePushReceiver,
  togglePushReceiver,
  type PushReceiverOrg,
  type PushStatus,
} from '@/api/push'
import { clearFormValidate, validateForm } from '@/utils/formValidate'

const statusOptions = [
  { label: '全部', value: '' },
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
]

const form = reactive({ keyword: '', status: '', relatedMtOrgId: '' })
const data = ref<PushReceiverOrg[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const visible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()
const mtOrgOptions = pushOrgOptions()

const editor = reactive({
  id: '',
  code: '',
  name: '',
  relatedMtOrgId: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  remark: '',
  status: 'enabled' as PushStatus,
})

const rules = {
  code: [{ required: true, message: '请填写机构 ID' }],
  name: [{ required: true, message: '请填写机构名称' }],
  relatedMtOrgId: [{ required: true, message: '请选择关联 MT 机构' }],
  status: [{ required: true, message: '请选择状态' }],
}

const columns = [
  { title: '机构 ID', dataIndex: 'code', slotName: 'code', width: 140 },
  { title: '机构名称', dataIndex: 'name', ellipsis: true, tooltip: true },
  { title: '关联机构', dataIndex: 'relatedMtOrgName', width: 160, ellipsis: true, tooltip: true },
  { title: '联系人', dataIndex: 'contactName', width: 100 },
  { title: '联系电话', dataIndex: 'contactPhone', width: 130 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80 },
  { title: '更新时间', dataIndex: 'updatedAt', width: 168 },
  { title: '操作', dataIndex: 'operations', slotName: 'operations', width: 180 },
]

async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const res = await listPushReceivers({
      keyword: form.keyword,
      status: form.status || undefined,
      relatedMtOrgId: form.relatedMtOrgId || undefined,
      page,
      pageSize: pagination.pageSize,
    })
    data.value = res.list
    pagination.current = page
    pagination.total = res.total
  } finally {
    loading.value = false
  }
}

function onPageSize(size: number) {
  pagination.pageSize = size
  fetchData(1)
}

function onReset() {
  form.keyword = ''
  form.status = ''
  form.relatedMtOrgId = ''
  fetchData(1)
}

function resetEditor() {
  Object.assign(editor, {
    id: '',
    code: '',
    name: '',
    relatedMtOrgId: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    remark: '',
    status: 'enabled' as PushStatus,
  })
}

function openCreate() {
  mode.value = 'create'
  resetEditor()
  visible.value = true
  nextTick(() => clearFormValidate(formRef.value))
}

function openEdit(record: PushReceiverOrg) {
  mode.value = 'edit'
  Object.assign(editor, {
    id: record.id,
    code: record.code,
    name: record.name,
    relatedMtOrgId: record.relatedMtOrgId,
    contactName: record.contactName,
    contactPhone: record.contactPhone,
    contactEmail: record.contactEmail,
    remark: record.remark,
    status: record.status,
  })
  visible.value = true
  nextTick(() => clearFormValidate(formRef.value))
}

async function onSubmit() {
  const ok = await validateForm(formRef.value, ['code', 'name', 'relatedMtOrgId', 'status'])
  if (!ok) return false
  const related = mtOrgOptions.find((o) => o.value === editor.relatedMtOrgId)
  const relatedName = (related?.label || '').replace(/（[^）]*）\s*$/, '')
  try {
    await savePushReceiver({
      id: mode.value === 'edit' ? editor.id : undefined,
      code: editor.code,
      name: editor.name,
      relatedMtOrgId: editor.relatedMtOrgId,
      relatedMtOrgName: relatedName || editor.relatedMtOrgId,
      contactName: editor.contactName,
      contactPhone: editor.contactPhone,
      contactEmail: editor.contactEmail,
      remark: editor.remark,
      status: editor.status,
    })
    Message.success(mode.value === 'create' ? '已新增' : '已保存')
    visible.value = false
    await fetchData(mode.value === 'create' ? 1 : pagination.current)
    return true
  } catch (e) {
    Message.error(e instanceof Error ? e.message : '保存失败')
    return false
  }
}

async function onToggle(record: PushReceiverOrg) {
  const next = record.status === 'enabled' ? 'disabled' : 'enabled'
  try {
    await togglePushReceiver(record.id, next)
    Message.success(next === 'enabled' ? '已启用' : '已停用')
    await fetchData()
  } catch (e) {
    Message.error(e instanceof Error ? e.message : '操作失败')
  }
}

function onDelete(record: PushReceiverOrg) {
  Modal.warning({
    title: '确认删除',
    content: `确定删除接收方机构「${record.name}」？已被推送方案引用时不可删除。`,
    hideCancel: false,
    onOk: async () => {
      try {
        await deletePushReceiver(record.id)
        Message.success('已删除')
        await fetchData(1)
      } catch (e) {
        Message.error(e instanceof Error ? e.message : '删除失败')
      }
    },
  })
}

onMounted(() => fetchData(1))
</script>

<style scoped>
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}
</style>
