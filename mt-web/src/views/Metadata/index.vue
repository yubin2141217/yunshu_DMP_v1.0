<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <h2 class="page-title">字段库管理</h2>
      </div>
      <a-button v-if="activeTab === 'fields'" type="primary" @click="$router.push('/metadata/create')">新增字段</a-button>
      <a-button v-else-if="activeTab === 'templates'" type="primary" @click="$router.push('/metadata/templates/edit')">新增模板</a-button>
    </div>
    <a-card class="content-card" :bordered="false">
      <a-tabs v-model:active-key="activeTab" type="rounded" @change="onTabChange">
        <a-tab-pane key="fields" title="全部字段">
          <div class="page-search">
            <div class="search-field">
              <span class="search-field__label">字段名 / 描述</span>
              <a-input v-model="form.name" allow-clear style="width: 220px" />
            </div>
            <div class="search-field">
              <span class="search-field__label">业务分类</span>
              <a-select
                v-model="form.bizCategory"
                :options="bizCategoryOptions"
                allow-clear
                style="width: 140px"
              />
            </div>
            <div class="search-field">
              <span class="search-field__label">状态</span>
              <a-select v-model="form.status" :options="statusOptions" allow-clear style="width: 140px" />
            </div>
            <a-button type="primary" @click="onSearchFields">查询</a-button>
            <a-button @click="onResetFields">重置</a-button>
          </div>
          <div class="fields-list-head">
            <a-space v-if="selectedKeys.length">
              <a-button type="primary" @click="goBatchEdit">批量编辑</a-button>
              <a-button @click="onBatchDisable">批量停用</a-button>
              <a-tooltip v-if="batchDeleteLocked" content="开启状态的字段不可删除，请先停用">
                <span class="del-disabled-wrap">
                  <a-button status="danger" disabled>批量删除</a-button>
                </span>
              </a-tooltip>
              <a-button v-else status="danger" @click="onBatchDelete">批量删除</a-button>
            </a-space>
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
            <template #refCount="{ record }">
              <a-button
                v-if="(record.refSchemeCount || 0) > 0"
                type="text"
                size="small"
                class="ref-count-link"
                @click="openRefSchemes(record)"
              >
                {{ record.refSchemeCount }}
              </a-button>
              <span v-else class="ref-count-link">0</span>
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
                <a-button type="text" size="small" @click="$router.push('/metadata/' + record.id)">详情</a-button>
                <a-button type="text" size="small" @click="openEdit(record)">编辑</a-button>
                <a-tooltip v-if="record.status === 'enabled'" content="开启状态的字段不可删除，请先停用">
                  <span class="del-disabled-wrap">
                    <a-button type="text" status="danger" size="small" disabled>删除</a-button>
                  </span>
                </a-tooltip>
                <a-tooltip v-else-if="(record.refSchemeCount || 0) > 0" content="该字段已有方案引用，不可删除">
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
        </a-tab-pane>

        <a-tab-pane key="templates" title="快速模板">
          <div class="page-search">
            <div class="search-field">
              <span class="search-field__label">模板名称 / 说明</span>
              <a-input v-model="tplQuery.name" allow-clear style="width: 220px" />
            </div>
            <div class="search-field">
              <span class="search-field__label">模板类型</span>
              <a-select
                v-model="tplQuery.type"
                :options="tplTypeOptions"
                allow-clear
                style="width: 140px"
              />
            </div>
            <a-button type="primary" @click="fetchTemplates">查询</a-button>
            <a-button @click="onResetTemplates">重置</a-button>
          </div>
          <a-alert type="info" style="margin-bottom: 12px">
            系统内置模板不可删除；用户自定义模板可在此新增/编辑（含供数方字段映射），也可在接入方案「字段库配置」中下拉选用或「保存为模板」。
          </a-alert>
          <a-table
            :columns="tplColumns"
            :data="tplList"
            :loading="tplLoading"
            row-key="id"
            :pagination="tplList.length > 10 ? { pageSize: 10, showTotal: true } : false"
            :bordered="false"
            stripe
          >
            <template #type="{ record }">
              <a-tag :color="record.type === 'system' ? 'arcoblue' : 'orangered'" size="small">
                {{ record.typeLabel || (record.type === 'system' ? '系统内置' : '用户自定义') }}
              </a-tag>
            </template>
            <template #ops="{ record }">
              <a-space class="arco-table-ops" :size="2">
                <a-button type="text" size="small" @click="$router.push('/metadata/templates/' + record.id)">详情</a-button>
                <a-tooltip v-if="record.type === 'system'" content="系统内置模板不可编辑">
                  <span class="del-disabled-wrap">
                    <a-button type="text" size="small" disabled>编辑</a-button>
                  </span>
                </a-tooltip>
                <a-button v-else type="text" size="small" @click="$router.push('/metadata/templates/edit/' + record.id)">编辑</a-button>
                <a-tooltip v-if="record.type === 'system'" content="系统内置模板不可删除">
                  <span class="del-disabled-wrap">
                    <a-button type="text" status="danger" size="small" disabled>删除</a-button>
                  </span>
                </a-tooltip>
                <a-button v-else type="text" status="danger" size="small" @click="onDeleteTpl(record)">删除</a-button>
              </a-space>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>

      <a-modal v-model:visible="visible" title="编辑字段" :width="560" unmount-on-close :on-before-ok="onSubmit">
        <a-form ref="formRef" :model="editor" :rules="rules" layout="vertical">
          <a-form-item field="name" required>
            <template #label>
              <FormFieldLabel title="字段名" desc="英文字段标识，创建后不可修改" />
            </template>
            <a-input v-model="editor.name" placeholder="如 platform" :disabled="!!editor.id" />
          </a-form-item>
          <a-form-item field="description" required>
            <template #label>
              <FormFieldLabel title="描述" desc="字段业务含义说明" />
            </template>
            <a-textarea v-model="editor.description" placeholder="请输入" :auto-size="{ minRows: 2, maxRows: 4 }" />
          </a-form-item>
          <a-form-item field="dataType" label="数据类型" required>
            <a-select v-model="editor.dataType" :options="dataTypeOptions" placeholder="请选择" allow-create allow-clear />
          </a-form-item>
          <a-form-item>
            <template #label>
              <FormFieldLabel title="长度" desc="非必填，如 64" />
            </template>
            <a-input v-model="editor.length" placeholder="请输入" />
          </a-form-item>
          <a-form-item>
            <template #label>
              <FormFieldLabel title="缺省值" desc="非必填" />
            </template>
            <a-input v-model="editor.defaultValue" placeholder="请输入" />
          </a-form-item>
          <a-form-item>
            <template #label>
              <FormFieldLabel title="业务分类" desc="非必填：运维管理 / 文章 / 作者 / 平台 / 标注 / 其它" />
            </template>
            <a-select
              v-model="editor.bizCategory"
              :options="bizCategoryOptions"
              allow-clear
              placeholder="请选择"
            />
          </a-form-item>
          <a-form-item>
            <template #label>
              <FormFieldLabel title="备注" desc="可选" />
            </template>
            <a-textarea
              v-model="editor.remark"
              placeholder="请输入"
              :auto-size="{ minRows: 2, maxRows: 4 }"
              :max-length="200"
              show-word-limit
            />
          </a-form-item>
          <a-form-item field="status" required>
            <template #label>
              <FormFieldLabel title="状态" desc="开启后可被接入方案勾选；停用后不可被新方案勾选" />
            </template>
            <a-switch
              :model-value="editor.status === 'enabled'"
              checked-text="开启"
              unchecked-text="停用"
              @change="(v: boolean | string | number) => (editor.status = v ? 'enabled' : 'disabled')"
            />
          </a-form-item>
        </a-form>
      </a-modal>

      <a-modal
        v-model:visible="refVisible"
        :title="refTitle"
        :width="780"
        :footer="false"
        unmount-on-close
      >
        <a-table
          :columns="refColumns"
          :data="refSchemes"
          :loading="refLoading"
          row-key="id"
          :pagination="false"
          :bordered="false"
          stripe
        >
          <template #org="{ record }">
            <div class="org-cell">
              <div class="cell-main">{{ record.orgName || '—' }}</div>
              <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
            </div>
          </template>
          <template #status="{ record }">
            <a-switch
              :model-value="record.status === 'enabled'"
              checked-text="开启"
              unchecked-text="停用"
              disabled
            />
          </template>
          <template #ops="{ record }">
            <a-button type="text" size="small" @click="goScheme(record.id)">查看方案</a-button>
          </template>
        </a-table>
        <a-empty v-if="!refLoading && !refSchemes.length" description="暂无引用该字段的接入方案" />
      </a-modal>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message, Modal, type FormInstance } from '@arco-design/web-vue'
import FormFieldLabel from '@/components/FormFieldLabel.vue'
import {
  deleteFieldTemplate,
  deleteMetadata,
  deleteMetadataBatch,
  getMetadata,
  listFieldTemplates,
  listMetadata,
  listMetadataByIds,
  listStandardsByField,
  saveMetadata,
  toggleMetadata,
  toggleMetadataBatch,
} from '@/api/mt'
import {
  type FieldTemplate,
  type Metadata,
  type Standard,
  type Status,
} from '@/mock/mt'
import { dictSelectOptions } from '@/api/dict'
import { clearFormValidate, validateForm } from '@/utils/formValidate'
import { formatOrgSub } from '@/utils/orgDisplay'
import { confirmReferencedFieldSubmit, wrapModalText } from '@/utils/metadataEditConfirm'

const router = useRouter()
const route = useRoute()
const activeTab = ref(route.query.tab === 'templates' ? 'templates' : 'fields')
const statusOptions = [
  { label: '开启', value: 'enabled' },
  { label: '停用', value: 'disabled' },
]
const tplTypeOptions = [
  { label: '系统内置', value: 'system' },
  { label: '用户自定义', value: 'custom' },
]
const bizCategoryOptions = computed(() => dictSelectOptions('field_biz_category'))
const dataTypeOptions = computed(() => dictSelectOptions('field_data_type'))
const form = reactive({ name: '', bizCategory: '', status: '' })
const data = ref<Metadata[]>([])
const loading = ref(false)
const selectedKeys = ref<(string | number)[]>([])
const togglingId = ref('')
const BATCH_IDS_KEY = 'mt-metadata-batch-ids'
const fieldCache = reactive<Record<string, Metadata>>({})
const batchDeleteLocked = computed(() =>
  selectedKeys.value.some((id) => fieldCache[String(id)]?.status === 'enabled'),
)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const visible = ref(false)
const formRef = ref<FormInstance>()
const emptyEditor = (): Metadata => ({
  id: '',
  name: '',
  code: '',
  description: '',
  bizCaliber: '',
  dataType: 'String',
  required: null,
  length: '',
  defaultValue: '',
  bizCategory: '',
  remark: '',
  status: 'enabled',
  updatedAt: '',
})
const editor = reactive<Metadata>(emptyEditor())
const refVisible = ref(false)
const refLoading = ref(false)
const refField = ref<Metadata | null>(null)
const refSchemes = ref<Standard[]>([])

const tplQuery = reactive({ name: '', type: '' as '' | 'system' | 'custom' })
const tplList = ref<FieldTemplate[]>([])
const tplLoading = ref(false)

const rules = {
  name: [{ required: true, message: '请填写字段名' }],
  description: [{ required: true, message: '请填写描述' }],
  dataType: [{ required: true, message: '请选择数据类型' }],
}
const columns = [
  { title: '序号', slotName: 'index', width: 64 },
  { title: '字段名', dataIndex: 'name', width: 150, ellipsis: true, tooltip: true },
  { title: '描述', dataIndex: 'description', ellipsis: true, tooltip: true },
  { title: '引用方案数量', dataIndex: 'refSchemeCount', slotName: 'refCount', width: 120 },
  { title: '数据类型', dataIndex: 'dataType', width: 96 },
  { title: '业务分类', dataIndex: 'bizCategory', width: 96 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 88 },
  { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
  { title: '操作', dataIndex: 'operations', slotName: 'operations', width: 180 },
]
const tplColumns = [
  { title: '模板名称', dataIndex: 'name', width: 220, ellipsis: true, tooltip: true },
  { title: '模板说明', dataIndex: 'desc', ellipsis: true, tooltip: true },
  { title: '字段数', dataIndex: 'fieldCount', width: 88 },
  { title: '模板类型', dataIndex: 'type', slotName: 'type', width: 120 },
  { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
  { title: '操作', dataIndex: 'ops', slotName: 'ops', width: 180 },
]
const refColumns = [
  { title: '方案名称', dataIndex: 'name', ellipsis: true, tooltip: true },
  { title: '机构', dataIndex: 'orgName', slotName: 'org', width: 150 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 88 },
  { title: '创建时间', dataIndex: 'uploadedAt', width: 160 },
  { title: '操作', dataIndex: 'ops', slotName: 'ops', width: 100 },
]
const refTitle = computed(() =>
  refField.value ? `${refField.value.name}字段被引用方案列表` : '字段被引用方案列表',
)

async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const res = await listMetadata({ ...form, page, pageSize: pagination.pageSize })
    data.value = res.list
    pagination.current = page
    pagination.total = res.total
    for (const item of res.list) fieldCache[item.id] = item
  } finally {
    loading.value = false
  }
}
async function fetchTemplates() {
  tplLoading.value = true
  try {
    const list = await listFieldTemplates({
      name: tplQuery.name || undefined,
      type: tplQuery.type || undefined,
    })
    tplList.value = list
  } finally {
    tplLoading.value = false
  }
}
function onTabChange(key: string | number) {
  const tab = String(key)
  if (tab === 'templates') {
    selectedKeys.value = []
    fetchTemplates()
    if (route.query.tab !== 'templates') router.replace({ query: { tab: 'templates' } })
    return
  }
  fetchData(pagination.current)
  if (route.query.tab) router.replace({ path: '/metadata' })
}
function onPageSize(size: number) {
  pagination.pageSize = size
  fetchData(1)
}
function onSearchFields() {
  selectedKeys.value = []
  fetchData(1)
}
function onResetFields() {
  form.name = ''
  form.bizCategory = ''
  form.status = ''
  selectedKeys.value = []
  fetchData(1)
}
function goBatchEdit() {
  const ids = selectedKeys.value.map(String)
  if (!ids.length) {
    Message.warning('请先勾选字段')
    return
  }
  sessionStorage.setItem(BATCH_IDS_KEY, JSON.stringify(ids))
  router.push('/metadata/batch-edit')
}
async function onBatchDisable() {
  const ids = selectedKeys.value.map(String)
  if (!ids.length) {
    Message.warning('请先勾选字段')
    return
  }
  const list = await listMetadataByIds(ids)
  const targets = list.filter((item) => item.status === 'enabled')
  if (!targets.length) {
    Message.warning('所选字段均已停用')
    return
  }
  const names = targets.map((item) => item.name)
  Modal.confirm({
    title: '停用字段',
    content: wrapModalText(`确定停用「${names.join(', ')}」？停用后不可被新接入方案勾选。`),
    async onOk() {
      await toggleMetadataBatch(
        targets.map((item) => item.id),
        'disabled',
      )
      Message.success(targets.length === 1 ? '已停用' : `已停用 ${targets.length} 个字段`)
      selectedKeys.value = []
      fetchData(pagination.current)
    },
  })
}
function onBatchDelete() {
  const ids = selectedKeys.value.map(String)
  if (!ids.length) {
    Message.warning('请先勾选字段')
    return
  }
  if (ids.some((id) => fieldCache[id]?.status === 'enabled')) {
    Message.warning('开启状态的字段不可删除，请先停用')
    return
  }
  Modal.confirm({
    title: '批量删除字段',
    content: `确定删除已选的 ${ids.length} 个字段？已被接入方案引用的字段不可删除。`,
    async onOk() {
      const res = await deleteMetadataBatch(ids)
      if (res.deleted.length) Message.success(`已删除 ${res.deleted.length} 个字段`)
      if (res.skipped.length) {
        Message.warning(`${res.skipped.length} 个字段已被方案引用，未删除`)
      }
      if (!res.deleted.length && !res.skipped.length) Message.warning('没有可删除的字段')
      selectedKeys.value = []
      fetchData(pagination.current)
    },
  })
}
function onResetTemplates() {
  tplQuery.name = ''
  tplQuery.type = ''
  fetchTemplates()
}
function openEdit(record: Metadata) {
  Object.assign(editor, emptyEditor(), record, {
    description: record.description || record.bizCaliber || '',
  })
  visible.value = true
  nextTick(() => clearFormValidate(formRef.value))
}
async function openRefSchemes(record: Metadata) {
  refField.value = record
  refVisible.value = true
  refLoading.value = true
  refSchemes.value = []
  try {
    refSchemes.value = await listStandardsByField(record.id)
  } finally {
    refLoading.value = false
  }
}

const REF_FIELD_KEY = 'mt-metadata-ref-field'

function goScheme(id: string) {
  const fieldId = refField.value?.id
  router.push({
    path: '/standard/' + id,
    query: fieldId ? { from: 'metadata-refs', fieldId } : {},
  })
}

async function restoreRefModal() {
  const fromQuery = String(route.query.refField || '')
  const fromStore = sessionStorage.getItem(REF_FIELD_KEY) || ''
  const fieldId = fromQuery || fromStore
  if (!fieldId) return
  sessionStorage.removeItem(REF_FIELD_KEY)
  if (fromQuery) router.replace({ path: '/metadata' })
  activeTab.value = 'fields'
  const field = await getMetadata(fieldId)
  if (field) await openRefSchemes(field)
}
function onDeleteTpl(record: FieldTemplate) {
  Modal.confirm({
    title: '删除模板',
    content: `确定删除快速模板「${record.name}」？`,
    async onOk() {
      try {
        await deleteFieldTemplate(record.id)
        Message.success('已删除')
        fetchTemplates()
      } catch (e) {
        Message.warning((e as Error).message || '删除失败')
      }
    },
  })
}
async function onSubmit() {
  if (!(await validateForm(formRef.value))) return false
  if ((editor.refSchemeCount || 0) > 0) {
    const ok = await confirmReferencedFieldSubmit([editor.name])
    if (!ok) return false
  }
  try {
    await saveMetadata({
      ...editor,
      required: null,
      code: editor.name.trim(),
      bizCaliber: editor.description.trim(),
    })
    Message.success('保存成功')
    fetchData(pagination.current)
    return true
  } catch (e) {
    Message.error((e as Error).message)
    return false
  }
}
async function applyToggle(record: Metadata, next: Status) {
  togglingId.value = record.id
  const prev = record.status
  record.status = next
  try {
    await toggleMetadata(record.id, next)
    Message.success(next === 'enabled' ? '开启成功' : '已停用')
    await fetchData(pagination.current)
  } catch (e) {
    record.status = prev
    Message.error((e as Error).message || '操作失败')
  } finally {
    togglingId.value = ''
  }
}

function onStatusSwitch(record: Metadata, enabled: boolean) {
  const next: Status = enabled ? 'enabled' : 'disabled'
  if (next === record.status) return
  if (next === 'disabled') {
    Modal.confirm({
      title: '停用字段',
      content: `确定停用「${record.name}」？停用后不可被新接入方案勾选。`,
      onOk: () => applyToggle(record, next),
    })
    return
  }
  void applyToggle(record, next)
}
function onDelete(record: Metadata) {
  if (record.status === 'enabled') {
    Message.warning('开启状态的字段不可删除，请先停用')
    return
  }
  Modal.confirm({
    title: '删除字段',
    content: `确定删除「${record.name}」？已被接入标准引用时不可删除。`,
    async onOk() {
      const res = await deleteMetadata(record.id)
      if (!res.ok) {
        Message.warning('已被接入标准引用，不能删除')
        return
      }
      Message.success('已删除')
      fetchData(1)
    },
  })
}

onMounted(() => {
  const reopenRefs = Boolean(route.query.refField || sessionStorage.getItem(REF_FIELD_KEY))
  if (activeTab.value === 'templates' && !reopenRefs) fetchTemplates()
  else fetchData(1)
  void restoreRefModal()
})
</script>

<style scoped>
.fields-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: -4px 0 14px;
}
.fields-list-head :deep(.list-result-bar) {
  margin: 0;
}
.ref-count-link {
  padding: 0 4px;
  font-weight: 400;
  color: rgb(var(--primary-6, 22, 93, 255));
}
.ref-count-link:deep(.arco-btn-text),
.ref-count-link.arco-btn-text {
  font-weight: 400;
  color: rgb(var(--primary-6, 22, 93, 255));
}
.del-disabled-wrap {
  display: inline-block;
  cursor: not-allowed;
}
.org-cell {
  min-width: 0;
}
:deep(.arco-switch-disabled) {
  opacity: 1;
  cursor: default;
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
