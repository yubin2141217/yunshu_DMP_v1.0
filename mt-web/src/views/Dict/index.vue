<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <h2 class="page-title">数据字典</h2>
        <p class="page-desc">维护字段业务分类、内容平台、字段数据类型；停用后新配置不可选，已落库数据仍按原码展示。</p>
      </div>
      <a-button type="primary" @click="openCreate">新增字典项</a-button>
    </div>
    <a-card class="content-card" :bordered="false">
      <a-tabs v-model:active-key="form.type" @change="fetchData(1)">
        <a-tab-pane v-for="t in typeOptions" :key="t.value" :title="t.label" />
      </a-tabs>
      <div class="page-search">
        <div class="search-field">
          <span class="search-field__label">名称 / 编码</span>
          <a-input v-model="form.keyword" allow-clear style="width: 200px" />
        </div>
        <div class="search-field">
          <span class="search-field__label">状态</span>
          <a-select v-model="form.status" :options="statusOptions" allow-clear style="width: 140px" />
        </div>
        <a-button type="primary" @click="fetchData(1)">查询</a-button>
        <a-button @click="onReset">重置</a-button>
      </div>
      <a-table :columns="columns" :data="data" :loading="loading" row-key="id" :pagination="false" :bordered="false" stripe>
        <template #code="{ record }">
          <span class="mono">{{ record.code }}</span>
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
            <a-tooltip v-if="record.builtin" content="预置字典项不可删除">
              <span class="del-disabled-wrap">
                <a-button type="text" status="danger" size="small" disabled>删除</a-button>
              </span>
            </a-tooltip>
            <a-tooltip v-else-if="record.status === 'enabled'" content="开启状态的字典项不可删除，请先停用">
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
          show-total
          show-page-size
          show-jumper
          @change="fetchData"
          @page-size-change="onPageSize"
        />
      </div>
      <a-modal
        v-model:visible="visible"
        :title="mode === 'create' ? '新增字典项' : '编辑字典项'"
        :on-before-ok="onSubmit"
        @cancel="visible = false"
      >
        <a-form ref="formRef" :model="editor" :rules="rules" layout="vertical">
          <a-form-item field="type" label="字典类型" required>
            <a-select v-model="editor.type" :options="typeOptions" :disabled="mode === 'edit'" />
          </a-form-item>
          <a-form-item field="code" required>
            <template #label>
              <FormFieldLabel title="编码" desc="同一类型下唯一；预置项编码不可改" />
            </template>
            <a-input v-model="editor.code" :max-length="32" :disabled="editor.builtin" placeholder="请输入编码" />
          </a-form-item>
          <a-form-item field="name" label="名称" required>
            <a-input v-model="editor.name" :max-length="50" placeholder="请输入名称" />
          </a-form-item>
          <a-form-item field="sort" label="排序" required>
            <a-input-number v-model="editor.sort" :min="0" :max="9999" hide-button style="width: 100%" />
          </a-form-item>
          <a-form-item field="status" required>
            <template #label>
              <FormFieldLabel title="状态" desc="开启后可被配置页下拉选用；停用后新配置不可选" />
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
import {
  deleteDictItem,
  dictTypeOptions,
  listDictItems,
  saveDictItem,
  toggleDictItem,
  type DictItem,
  type DictItemStatus,
  type DictTypeCode,
} from '@/api/dict'
import { clearFormValidate, validateForm } from '@/utils/formValidate'

const typeOptions = dictTypeOptions
const statusOptions = [
  { label: '开启', value: 'enabled' },
  { label: '停用', value: 'disabled' },
]
const form = reactive({ type: 'field_biz_category' as DictTypeCode, keyword: '', status: '' })
const data = ref<DictItem[]>([])
const loading = ref(false)
const togglingId = ref('')
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const visible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()
const editor = reactive({
  id: '',
  type: 'field_biz_category' as DictTypeCode,
  code: '',
  name: '',
  sort: 10,
  status: 'enabled' as DictItemStatus,
  builtin: false,
})
const rules = {
  type: [{ required: true, message: '请选择字典类型' }],
  code: [{ required: true, message: '请填写编码' }],
  name: [{ required: true, message: '请填写名称' }],
  sort: [{ required: true, message: '请填写排序' }],
  status: [{ required: true, message: '请设置状态' }],
}
const columns = [
  { title: '编码', dataIndex: 'code', slotName: 'code', width: 160 },
  { title: '名称', dataIndex: 'name', ellipsis: true, tooltip: true },
  { title: '排序', dataIndex: 'sort', width: 88 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 88 },
  { title: '更新时间', dataIndex: 'updatedAt', width: 168 },
  { title: '操作', dataIndex: 'operations', slotName: 'operations', width: 120 },
]

async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const res = await listDictItems({
      type: form.type,
      keyword: form.keyword,
      status: form.status,
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
  fetchData(1)
}

function openCreate() {
  mode.value = 'create'
  const maxSort = data.value.reduce((m, i) => Math.max(m, Number(i.sort) || 0), 0)
  Object.assign(editor, {
    id: '',
    type: form.type,
    code: '',
    name: '',
    sort: maxSort + 10,
    status: 'enabled' as DictItemStatus,
    builtin: false,
  })
  visible.value = true
  nextTick(() => clearFormValidate(formRef.value))
}

function openEdit(record: DictItem) {
  mode.value = 'edit'
  Object.assign(editor, {
    id: record.id,
    type: record.type,
    code: record.code,
    name: record.name,
    sort: record.sort,
    status: record.status,
    builtin: record.builtin,
  })
  visible.value = true
  nextTick(() => clearFormValidate(formRef.value))
}

async function onSubmit() {
  if (!(await validateForm(formRef.value))) return false
  try {
    await saveDictItem({
      id: mode.value === 'edit' ? editor.id : undefined,
      type: editor.type,
      code: editor.code,
      name: editor.name,
      sort: Number(editor.sort),
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

function onFormStatusSwitch(enabled: boolean) {
  editor.status = enabled ? 'enabled' : 'disabled'
}

async function applyToggle(record: DictItem, next: DictItemStatus) {
  togglingId.value = record.id
  const prev = record.status
  record.status = next
  try {
    await toggleDictItem(record.id, next)
    Message.success(next === 'enabled' ? '开启成功' : '已停用')
    await fetchData(pagination.current)
  } catch (e) {
    record.status = prev
    Message.error((e as Error).message || '操作失败')
  } finally {
    togglingId.value = ''
  }
}

function onStatusSwitch(record: DictItem, enabled: boolean) {
  const next: DictItemStatus = enabled ? 'enabled' : 'disabled'
  if (next === record.status) return
  if (next === 'disabled') {
    Modal.confirm({
      title: '停用字典项',
      content: `确定停用「${record.name}」？停用后新配置不可再选用该项。`,
      onOk: () => applyToggle(record, next),
    })
    return
  }
  void applyToggle(record, next)
}

function onDelete(record: DictItem) {
  if (record.builtin) {
    Message.warning('预置字典项不可删除')
    return
  }
  if (record.status === 'enabled') {
    Message.warning('开启状态的字典项不可删除，请先停用')
    return
  }
  Modal.confirm({
    title: '删除字典项',
    content: `确定删除「${record.name}」？删除后不可恢复。`,
    async onOk() {
      try {
        await deleteDictItem(record.id)
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
.del-disabled-wrap {
  display: inline-block;
  cursor: not-allowed;
}
.page-search {
  margin-top: 4px;
}
</style>
