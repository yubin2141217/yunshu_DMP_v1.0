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
        <div class="search-field">
          <span class="search-field__label">供数方名称</span>
          <a-input v-model="form.name" allow-clear style="width: 200px" />
        </div>
        <div class="search-field">
          <span class="search-field__label">状态</span>
          <a-select v-model="form.status" :options="statusOptions" allow-clear style="width: 140px" />
        </div>
        <a-button type="primary" @click="fetchData(1)">查询</a-button>
        <a-button @click="onReset">重置</a-button>
      </div>
      <a-table :columns="columns" :data="data" :loading="loading" row-key="id" :pagination="false" :bordered="false" stripe>
        <template #name="{ record }">
          <div class="sup-cell">
            <a-avatar :size="26" class="sup-logo" :image-url="record.logo">
              {{ record.name.charAt(0) }}
            </a-avatar>
            <span class="sup-name">{{ record.name }}</span>
          </div>
        </template>
        <template #code="{ record }">
          <a-space>
            <span class="mono">{{ record.code }}</span>
            <a-button type="text" size="mini" @click="copyCode(record.code)">复制</a-button>
          </a-space>
        </template>
        <template #status="{ record }">
          <a-switch
            :model-value="record.status === 'enabled'"
            checked-text="开启"
            unchecked-text="停用"
            :loading="togglingId === record.id"
            @change="(v: boolean | string | number) => onStatusSwitch(record, !!v)"
          />
        </template>
        <template #operations="{ record }">
          <a-space class="arco-table-ops" :size="2">
            <a-button type="text" size="small" @click="openEdit(record)">编辑</a-button>
            <a-tooltip v-if="record.status === 'enabled'" content="开启状态的供数方不可删除，请先停用">
              <span class="del-disabled-wrap">
                <a-button type="text" status="danger" size="small" disabled>删除</a-button>
              </span>
            </a-tooltip>
            <a-button v-else type="text" status="danger" size="small" @click="onDelete(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
      <div class="table-footer">
        <a-pagination
          v-model:current="pagination.current"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          :page-size-options="MT_PAGE_SIZE_OPTIONS"
          show-total
          show-page-size
          show-jumper
          @change="onPageChange"
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
          <a-form-item field="logo">
            <template #label>
              <FormFieldLabel title="供数方 logo" desc="图片地址；机构端（V8）供数方查看与接入日志中展示，留空则显示名称首字" />
            </template>
            <a-input v-model="editor.logo" placeholder="请输入 logo 图片地址" allow-clear>
              <template #prefix>
                <a-avatar :size="20" class="sup-logo" :image-url="editor.logo">
                  {{ editor.name.charAt(0) || '?' }}
                </a-avatar>
              </template>
            </a-input>
          </a-form-item>
          <a-form-item field="status" required>
            <template #label>
              <FormFieldLabel title="状态" desc="开启后可被接入方案勾选；停用后不可被新方案勾选" />
            </template>
            <a-switch
              :model-value="editor.status === 'enabled'"
              checked-text="开启"
              unchecked-text="停用"
              @change="(v: boolean | string | number) => onFormStatusSwitch(!!v)"
            />
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
import { MT_PAGE_SIZE_OPTIONS, scrollToTableTop } from '@/utils/mtPage'

const statusOptions = [
  { label: '开启', value: 'enabled' },
  { label: '停用', value: 'disabled' },
]
const form = reactive({ name: '', status: '' })
const data = ref<Supplier[]>([])
const loading = ref(false)
const togglingId = ref('')
const pagination = reactive({ current: 1, pageSize: 100, total: 0 })
const visible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()
const editor = reactive({ id: '', name: '', code: '', status: 'enabled' as Status, logo: '' })
const rules = {
  name: [{ required: true, message: '请填写供数方名称' }],
  code: [{ required: true, message: '请填写供数方编码' }],
  status: [{ required: true, message: '请设置状态' }],
}
const columns = [
  { title: '供数方名称', dataIndex: 'name', slotName: 'name', width: 220, ellipsis: true, tooltip: true },
  { title: '供数方编码', dataIndex: 'code', slotName: 'code', width: 180 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 88 },
  { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
  { title: '操作', dataIndex: 'operations', slotName: 'operations', width: 120, fixed: 'right' as const },
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

function onPageChange(page: number) {
  scrollToTableTop()
  fetchData(page)
}

function onPageSize(size: number) {
  scrollToTableTop()
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
  Object.assign(editor, { id: '', name: '', code: '', status: 'enabled' as Status, logo: '' })
  visible.value = true
  nextTick(() => clearFormValidate(formRef.value))
}

function openEdit(record: Supplier) {
  mode.value = 'edit'
  Object.assign(editor, { id: record.id, name: record.name, code: record.code, status: record.status, logo: record.logo || '' })
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
      logo: editor.logo,
    })
    Message.success(mode.value === 'create' ? `新增成功「${editor.name}」` : `保存成功「${editor.name}」`)
    fetchData(mode.value === 'create' ? 1 : pagination.current)
    return true
  } catch (e) {
    Message.error((e as Error).message)
    return false
  }
}

function onFormStatusSwitch(enabled: boolean) {
  editor.status = enabled ? 'enabled' : 'disabled'
}

async function applyToggle(record: Supplier, next: Status) {
  togglingId.value = record.id
  const prev = record.status
  record.status = next
  try {
    await toggleSupplier(record.id, next)
    Message.success(next === 'enabled' ? `已开启「${record.name}」` : `已停用「${record.name}」`)
    await fetchData(pagination.current)
  } catch (e) {
    record.status = prev
    Message.error((e as Error).message || '操作失败')
  } finally {
    togglingId.value = ''
  }
}

function onStatusSwitch(record: Supplier, enabled: boolean) {
  const next: Status = enabled ? 'enabled' : 'disabled'
  if (next === record.status) return
  if (next === 'disabled') {
    Modal.confirm({
      title: '停用供数方',
      content: `确定停用「${record.name}」？停用后不可被新配置勾选。`,
      onOk: () => applyToggle(record, next),
    })
    return
  }
  void applyToggle(record, next)
}

function onDelete(record: Supplier) {
  if (record.status === 'enabled') {
    Message.warning('开启状态的供数方不可删除，请先停用')
    return
  }
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
        Message.success(`已删除「${record.name}」`)
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
/* 供数方名称列：logo + 名称横向排列 */
.sup-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.sup-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sup-logo {
  flex: none;
  background: #f2f3f5;
}
.del-disabled-wrap {
  display: inline-block;
  cursor: not-allowed;
}
</style>
