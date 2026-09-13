<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <h2 class="page-title">机构供数配置</h2>
        <p class="page-desc">
          为机构配置接入方案与供数方；机构名称从 MT 同步主数据中选择。
        </p>
      </div>
      <a-button type="primary" @click="openCreate">新增</a-button>
    </div>
    <a-card class="content-card" :bordered="false">
      <div class="page-search">
        <a-input v-model="name" placeholder="机构 / 方案 / 供数方" allow-clear style="width: 240px" />
        <a-button type="primary" @click="fetchData(1)">查询</a-button>
        <a-button @click="name = ''; fetchData(1)">重置</a-button>
      </div>
      <a-table :columns="columns" :data="data" :loading="loading" row-key="id" :pagination="false" :bordered="false" stripe>
        <template #org="{ record }">
          <div class="org-cell">
            <div class="cell-main">{{ record.orgName || '—' }}</div>
            <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
          </div>
        </template>
        <template #code="{ record }">
          <a-space>
            <span class="mono">{{ record.orgCode }}</span>
            <a-button type="text" size="mini" @click="copyCode(record.orgCode)">复制</a-button>
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
            <a-button type="text" size="small" @click="onToggle(record)">
              {{ record.status === 'enabled' ? '停用' : '启用' }}
            </a-button>
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
        :title="mode === 'create' ? '新增机构供数配置' : '编辑机构供数配置'"
        :width="560"
        unmount-on-close
        :on-before-ok="onSubmit"
      >
        <a-form ref="formRef" :model="editor" :rules="rules" layout="vertical">
          <a-form-item field="catalogId" label="机构名称" required>
            <a-select
              v-if="mode === 'create'"
              v-model="editor.catalogId"
              :options="catalogOptions"
              allow-search
              placeholder="请选择机构（从 MT 同步）"
              @change="onCatalogChange"
            />
            <a-input v-else :model-value="editor.name" disabled />
          </a-form-item>
          <a-form-item field="code" required>
            <template #label>
              <FormFieldLabel
                title="机构编码"
                desc="唯一编码；请安全下发给厂商，送数时 org_id 字段须填此值"
              />
            </template>
            <a-input v-model="editor.code" :max-length="64" placeholder="选择机构后自动带出，可微调" allow-clear />
          </a-form-item>
          <a-form-item field="standardId" required>
            <template #label>
              <FormFieldLabel title="接入方案" desc="选择该机构使用的接入方案（单选）" />
            </template>
            <a-select
              v-model="editor.standardId"
              :options="standardOptions"
              allow-clear
              allow-search
              placeholder="请选择接入方案"
            />
          </a-form-item>
          <a-form-item field="supplierId" required>
            <template #label>
              <FormFieldLabel title="供数方" desc="选择向本机构供数的厂商（单选）" />
            </template>
            <a-select
              v-if="supplierOptions.length"
              v-model="editor.supplierId"
              :options="supplierOptions"
              allow-clear
              allow-search
              placeholder="请选择供数方"
            />
            <a-empty v-else description="暂无启用中的供数方，请先在供数方管理中新增或启用" />
          </a-form-item>
          <a-form-item field="remark" label="备注">
            <a-textarea
              v-model="editor.remark"
              placeholder="可选补充说明"
              :auto-size="{ minRows: 2, maxRows: 4 }"
              :max-length="200"
              allow-clear
            />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { Message, Modal, type FormInstance } from '@arco-design/web-vue'
import FormFieldLabel from '@/components/FormFieldLabel.vue'
import { createOrg, listOrgBindings, saveOrg, toggleOrg } from '@/api/mt'
import type { OrgBindingRow, OrgCatalogItem, Status, Supplier } from '@/mock/mt'
import { clearFormValidate, validateForm } from '@/utils/formValidate'
import { formatOrgSub } from '@/utils/orgDisplay'

const name = ref('')
const data = ref<OrgBindingRow[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const visible = ref(false)
const mode = ref<'create' | 'edit'>('edit')
const formRef = ref<FormInstance>()
const supplierOptions = ref<{ label: string; value: string }[]>([])
const standardOptions = ref<{ label: string; value: string }[]>([])
const catalogOptions = ref<{ label: string; value: string; code: string }[]>([])
const catalogMap = ref<Record<string, OrgCatalogItem>>({})
const editor = reactive({
  id: '',
  catalogId: '',
  name: '',
  code: '',
  standardId: undefined as string | undefined,
  supplierId: undefined as string | undefined,
  remark: '',
})
const rules = computed(() => ({
  catalogId:
    mode.value === 'create'
      ? [{ required: true, message: '请选择机构名称' }]
      : [],
  code: [{ required: true, message: '请填写机构编码' }],
  standardId: [{ required: true, message: '请选择接入方案' }],
  supplierId: [{ required: true, message: '请选择供数方' }],
}))
const columns = [
  { title: '机构', dataIndex: 'orgName', slotName: 'org', width: 150 },
  { title: '机构编码', dataIndex: 'orgCode', slotName: 'code', width: 160 },
  { title: '接入方案', dataIndex: 'standardName', ellipsis: true, tooltip: true },
  { title: '供数方', dataIndex: 'supplierName', width: 140, ellipsis: true, tooltip: true },
  { title: '备注', dataIndex: 'remark', ellipsis: true, tooltip: true, width: 140 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 72 },
  { title: '操作', dataIndex: 'operations', slotName: 'operations', width: 120 },
]

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    Message.success('已复制机构编码，可下发给厂商填入 org_id')
  } catch {
    Message.error('复制失败，请手动选择复制')
  }
}

function onCatalogChange(val: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[]) {
  const id = String(val || '')
  const hit = catalogMap.value[id]
  if (!hit) return
  editor.name = hit.name
  editor.code = hit.code
}

async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const res = await listOrgBindings({ name: name.value, page, pageSize: pagination.pageSize })
    data.value = res.list
    supplierOptions.value = res.enabledSuppliers.map((s: Supplier) => ({
      label: `${s.name}（${s.code}）`,
      value: s.id,
    }))
    standardOptions.value = res.enabledStandards || []
    catalogOptions.value = (res.availableCatalog || []).map((c) => ({
      label: `${c.name}（${c.code}）`,
      value: c.id,
      code: c.code,
    }))
    catalogMap.value = Object.fromEntries((res.availableCatalog || []).map((c) => [c.id, c]))
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

function openCreate() {
  mode.value = 'create'
  Object.assign(editor, {
    id: '',
    catalogId: '',
    name: '',
    code: '',
    standardId: undefined,
    supplierId: undefined,
    remark: '',
  })
  visible.value = true
  nextTick(() => clearFormValidate(formRef.value))
  if (!catalogOptions.value.length) Message.warning('暂无可选机构，请检查 MT 同步主数据或已全部配置')
  if (!supplierOptions.value.length) Message.warning('暂无启用中的供数方，请先在供数方管理中新增或启用')
  if (!standardOptions.value.length) Message.warning('暂无启用中的接入方案，请先在接入方案管理中新增或启用')
}

function openEdit(record: OrgBindingRow) {
  mode.value = 'edit'
  Object.assign(editor, {
    id: record.orgId,
    catalogId: '',
    name: record.orgName,
    code: record.orgCode || '',
    standardId: record.standardId || undefined,
    supplierId: record.supplierId || undefined,
    remark: record.remark || '',
  })
  visible.value = true
  nextTick(() => clearFormValidate(formRef.value))
}

async function onSubmit() {
  if (!(await validateForm(formRef.value))) return false
  if (!editor.standardId || !editor.supplierId) {
    Message.warning('请选择接入方案与供数方')
    return false
  }
  const standardIds = [editor.standardId]
  const supplierIds = [editor.supplierId]
  const remark = editor.remark.trim()
  if (mode.value === 'create') {
    try {
      await createOrg({
        name: editor.name.trim(),
        code: editor.code.trim(),
        supplierIds,
        standardIds,
        remark,
      })
      Message.success('新增成功')
      fetchData(1)
      return true
    } catch (e) {
      Message.error((e as Error).message || '新增失败')
      return false
    }
  }
  if (!editor.id) return false
  try {
    await saveOrg(editor.id, {
      code: editor.code.trim(),
      supplierIds,
      standardIds,
      remark,
    })
    Message.success('保存成功')
    fetchData(pagination.current)
    return true
  } catch (e) {
    Message.error((e as Error).message || '保存失败')
    return false
  }
}

function onToggle(record: OrgBindingRow) {
  const next: Status = record.status === 'enabled' ? 'disabled' : 'enabled'
  Modal.confirm({
    title: next === 'enabled' ? '启用机构' : '停用机构',
    content:
      next === 'enabled'
        ? `确定启用「${record.orgName}」？启用后可按配置计入供数统计。`
        : `确定停用「${record.orgName}」？停用后该机构不再计入新入库统计。`,
    async onOk() {
      try {
        await toggleOrg(record.orgId, next)
        Message.success('已更新')
        fetchData(pagination.current)
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
.org-cell {
  min-width: 0;
}
.cell-main {
  font-size: 13px;
  color: #1d2129;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cell-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
