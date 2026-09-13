<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <h2 class="page-title">供数方管理</h2>
        <p class="page-desc">维护平台侧供数方档案（名称、编码、状态），接口鉴权凭证在接入方案中按方案生成与下发</p>
      </div>
      <a-button type="primary" @click="openCreate">新增供数方</a-button>
    </div>
    <a-card class="content-card" :bordered="false">
      <div class="page-search">
        <a-input v-model="form.name" placeholder="供数方名称" allow-clear style="width: 200px" />
        <a-select v-model="form.status" :options="statusOptions" placeholder="状态" allow-clear style="width: 140px" />
        <a-button type="primary" @click="fetchData(1)">查询</a-button>
        <a-button @click="onReset">重置</a-button>
      </div>
      <a-table :columns="columns" :data="data" :loading="loading" row-key="id" :pagination="false" :bordered="false" stripe>
        <template #code="{ record }">
          <a-space>
            <span class="mono">{{ record.code }}</span>
            <a-button type="text" size="mini" @click="copyCode(record.code)">复制</a-button>
          </a-space>
        </template>
        <template #status="{ record }">
          <a-tag :color="record.status === 'enabled' ? 'green' : 'orangered'" size="small">
            {{ record.status === 'enabled' ? '启用' : '停用' }}
          </a-tag>
        </template>
        <template #operations="{ record }">
          <a-space class="arco-table-ops" :size="2">
            <a-button type="text" size="small" @click="openEdit(record)">编辑</a-button>
            <a-button type="text" size="small" @click="onToggle(record)">{{ record.status === 'enabled' ? '停用' : '启用' }}</a-button>
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
      <a-modal v-model:visible="visible" :title="mode === 'create' ? '新增供数方' : '编辑供数方'" :on-before-ok="onSubmit" @cancel="visible = false">
        <a-form ref="formRef" :model="editor" :rules="rules" layout="vertical">
          <a-form-item field="name" label="供数方名称" required>
            <a-input v-model="editor.name" :max-length="50" placeholder="请输入" />
          </a-form-item>
          <a-form-item field="code" required>
            <template #label>
              <FormFieldLabel title="供数方编码" desc="唯一编码；库表送数时 supplier_code 须填此值" />
            </template>
            <a-input v-model="editor.code" :max-length="32" placeholder="请输入" />
          </a-form-item>
          <a-form-item field="status" label="状态" required>
            <a-select v-model="editor.status" :options="statusOptions.filter((o) => o.value)" />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { Message, Modal, type FormInstance } from '@arco-design/web-vue'
import FormFieldLabel from '@/components/FormFieldLabel.vue'
import { deleteSupplier, listSuppliers, saveSupplier, toggleSupplier } from '@/api/mt'
import type { Status, Supplier } from '@/mock/mt'
import { clearFormValidate, validateForm } from '@/utils/formValidate'

const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
]
const form = reactive({ name: '', status: '' })
const data = ref<Supplier[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const visible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()
const editor = reactive({ id: '', name: '', code: '', status: 'enabled' as Status })
const rules = {
  name: [{ required: true, message: '请填写供数方名称' }],
  code: [{ required: true, message: '请填写供数方编码' }],
  status: [{ required: true, message: '请选择状态' }],
}
const columns = [
  { title: '供数方名称', dataIndex: 'name', width: 180, ellipsis: true, tooltip: true },
  { title: '供数方编码', dataIndex: 'code', slotName: 'code', width: 180 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 72 },
  { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
  { title: '操作', dataIndex: 'operations', slotName: 'operations', width: 180 },
]

async function copyCode(code?: string) {
  if (!code) {
    Message.warning('暂无供数方编码')
    return
  }
  try {
    await navigator.clipboard.writeText(code)
    Message.success('已复制供数方编码，可下发给厂商填入 supplier_code')
  } catch {
    Message.error('复制失败，请手动选择复制')
  }
}

async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const res = await listSuppliers({ name: form.name, status: form.status, page, pageSize: pagination.pageSize })
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
  form.name = ''
  form.status = ''
  fetchData(1)
}

function openCreate() {
  mode.value = 'create'
  Object.assign(editor, { id: '', name: '', code: '', status: 'enabled' as Status })
  visible.value = true
  nextTick(() => clearFormValidate(formRef.value))
}

function openEdit(record: Supplier) {
  mode.value = 'edit'
  Object.assign(editor, { id: record.id, name: record.name, code: record.code, status: record.status })
  visible.value = true
  nextTick(() => clearFormValidate(formRef.value))
}

async function onSubmit() {
  if (!(await validateForm(formRef.value))) return false
  try {
    await saveSupplier({
      id: mode.value === 'edit' ? editor.id : undefined,
      name: editor.name,
      code: editor.code,
      status: editor.status,
    })
    Message.success(mode.value === 'create' ? '新增成功' : '保存成功')
    fetchData(mode.value === 'create' ? 1 : pagination.current)
    return true
  } catch (e) {
    Message.error((e as Error).message)
    return false
  }
}

function onToggle(record: Supplier) {
  const next: Status = record.status === 'enabled' ? 'disabled' : 'enabled'
  Modal.confirm({
    title: next === 'enabled' ? '启用供数方' : '停用供数方',
    content: next === 'enabled' ? `确定启用「${record.name}」？` : `确定停用「${record.name}」？停用后不可被新配置勾选。`,
    async onOk() {
      try {
        await toggleSupplier(record.id, next)
        Message.success('已更新')
        fetchData(pagination.current)
      } catch (e) {
        Message.error((e as Error).message)
      }
    },
  })
}

function onDelete(record: Supplier) {
  Modal.confirm({
    title: '删除供数方',
    content: `确定删除「${record.name}」？已被机构引用时不可删除。`,
    async onOk() {
      try {
        const ok = await deleteSupplier(record.id)
        if (!ok) {
          Message.warning('已被机构引用，请停用')
          return
        }
        Message.success('已删除')
        fetchData(1)
      } catch (e) {
        Message.error((e as Error).message)
      }
    },
  })
}

onMounted(() => fetchData(1))
</script>

<style scoped>
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
}
</style>
