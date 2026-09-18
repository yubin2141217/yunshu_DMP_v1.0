<template>
  <div class="page-shell edit-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">批量编辑字段</h2>
        <p class="page-desc">以表格方式一次编辑已选字段；字段名创建后不可修改，本批内字段名须唯一。</p>
      </div>
      <a-space>
        <a-button @click="goBack">返回</a-button>
      </a-space>
    </div>

    <a-card class="content-card edit-card" :bordered="false">
      <div class="edit-card-inner">
        <div class="edit-main">
          <div class="batch-toolbar">
            <span class="batch-toolbar__tip">共 {{ rows.length }} 条，字段名创建后不可修改</span>
          </div>

          <div class="batch-table-wrap">
            <table class="batch-table">
              <thead>
                <tr>
                  <th class="col-idx">#</th>
                  <th class="col-name">字段名 <span class="req">*</span></th>
                  <th class="col-desc">描述 <span class="req">*</span></th>
                  <th class="col-type">数据类型 <span class="req">*</span></th>
                  <th class="col-len">长度</th>
                  <th class="col-default">缺省值</th>
                  <th class="col-biz">业务分类</th>
                  <th class="col-remark">备注</th>
                  <th class="col-status">状态</th>
                  <th class="col-ops">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in rows" :key="row.key">
                  <td class="col-idx">{{ index + 1 }}</td>
                  <td class="col-name">
                    <a-input v-model="row.name" disabled placeholder="字母/数字/下划线" />
                  </td>
                  <td class="col-desc">
                    <a-input
                      v-model="row.description"
                      placeholder="业务含义说明"
                      allow-clear
                      :status="rowErrors[row.key]?.description ? 'error' : undefined"
                    />
                    <div v-if="rowErrors[row.key]?.description" class="cell-error">{{ rowErrors[row.key].description }}</div>
                  </td>
                  <td class="col-type">
                    <a-select
                      v-model="row.dataType"
                      :options="dataTypeOptions"
                      placeholder="请选择"
                      allow-create
                      allow-clear
                      :status="rowErrors[row.key]?.dataType ? 'error' : undefined"
                    />
                    <div v-if="rowErrors[row.key]?.dataType" class="cell-error">{{ rowErrors[row.key].dataType }}</div>
                  </td>
                  <td class="col-len">
                    <a-input v-model="row.length" placeholder="数字，如 64" allow-clear />
                  </td>
                  <td class="col-default">
                    <a-input v-model="row.defaultValue" placeholder="选填" allow-clear />
                  </td>
                  <td class="col-biz">
                    <a-select
                      v-model="row.bizCategory"
                      :options="bizCategoryOptions"
                      allow-clear
                      placeholder="请选择"
                    />
                  </td>
                  <td class="col-remark">
                    <a-input
                      v-model="row.remark"
                      placeholder="选填"
                      allow-clear
                      :max-length="200"
                      show-word-limit
                    />
                  </td>
                  <td class="col-status">
                    <a-switch
                      :model-value="row.status === 'enabled'"
                      checked-text="开启"
                      unchecked-text="停用"
                      @change="(v: boolean | string | number) => (row.status = v ? 'enabled' : 'disabled')"
                    />
                  </td>
                  <td class="col-ops">
                    <a-button type="text" status="danger" size="small" :disabled="rows.length <= 1" @click="removeRow(index)">
                      删除
                    </a-button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="edit-actions">
          <a-space>
            <a-button @click="goBack">取消</a-button>
            <a-button type="primary" :loading="saving" @click="onSubmit">提交</a-button>
          </a-space>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { checkMetadataNameExists, listMetadataByIds, saveMetadataBatchUpdate } from '@/api/mt'
import { dictSelectOptions } from '@/api/dict'
import { type Status } from '@/mock/mt'
import { useUnsavedLeave } from '@/composables/useUnsavedLeave'
import { confirmReferencedFieldSubmit } from '@/utils/metadataEditConfirm'

const BATCH_IDS_KEY = 'mt-metadata-batch-ids'

const bizCategoryOptions = computed(() => dictSelectOptions('field_biz_category'))
const dataTypeOptions = computed(() => dictSelectOptions('field_data_type'))

type BatchRow = {
  key: string
  id: string
  name: string
  description: string
  dataType: string
  length: string
  defaultValue: string
  bizCategory: string
  remark: string
  status: Status
  refSchemeCount: number
}

const router = useRouter()
const saving = ref(false)
let keySeq = 1

const rows = ref<BatchRow[]>([])
const rowErrors = reactive<Record<string, Partial<Record<'description' | 'dataType', string>>>>({})
const { markPristine, confirmLeave } = useUnsavedLeave(
  () => rows.value.map(({ key: _key, ...rest }) => rest),
  '/metadata',
)

function goBack() {
  confirmLeave()
}

function removeRow(index: number) {
  if (rows.value.length <= 1) return
  const [removed] = rows.value.splice(index, 1)
  if (removed) delete rowErrors[removed.key]
}

function clearErrors() {
  Object.keys(rowErrors).forEach((k) => delete rowErrors[k])
}

function setError(key: string, field: 'description' | 'dataType', msg: string) {
  if (!rowErrors[key]) rowErrors[key] = {}
  rowErrors[key][field] = msg
}

function readIds(): string[] {
  try {
    const raw = sessionStorage.getItem(BATCH_IDS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : []
  } catch {
    return []
  }
}

async function validateRows(): Promise<boolean> {
  clearErrors()
  let ok = true
  const seen = new Map<string, string>()

  for (const row of rows.value) {
    const name = row.name.trim()
    if (seen.has(name)) {
      Message.warning(`字段名「${name}」在本批中重复`)
      ok = false
    } else {
      seen.set(name, row.key)
    }
    if (!row.description.trim()) {
      setError(row.key, 'description', '请填写描述')
      ok = false
    }
    if (!row.dataType?.trim()) {
      setError(row.key, 'dataType', '请选择数据类型')
      ok = false
    }
    if (row.length.trim() && !/^\d+$/.test(row.length.trim())) {
      Message.warning(`第 ${rows.value.indexOf(row) + 1} 行「长度」须为数字`)
      ok = false
    }
  }

  if (!ok) return false

  for (const row of rows.value) {
    if (await checkMetadataNameExists(row.name.trim(), row.id)) {
      Message.warning(`字段名「${row.name.trim()}」已存在`)
      ok = false
    }
  }
  return ok
}

async function onSubmit() {
  if (!rows.value.length) {
    Message.warning('请至少保留一条字段')
    return
  }
  if (!(await validateRows())) {
    Message.error('请先修正表格中的校验问题')
    return
  }
  const referencedNames = rows.value
    .filter((row) => (row.refSchemeCount || 0) > 0)
    .map((row) => row.name.trim())
  if (referencedNames.length) {
    const ok = await confirmReferencedFieldSubmit(referencedNames)
    if (!ok) return
  }
  saving.value = true
  try {
    const saved = await saveMetadataBatchUpdate(
      rows.value.map((row) => ({
        id: row.id,
        name: row.name.trim(),
        description: row.description.trim(),
        dataType: row.dataType.trim(),
        length: row.length.trim(),
        defaultValue: row.defaultValue.trim(),
        bizCategory: row.bizCategory,
        remark: row.remark.trim(),
        status: row.status,
      })),
    )
    sessionStorage.removeItem(BATCH_IDS_KEY)
    Message.success(`已保存 ${saved.length} 个字段`)
    confirmLeave(true)
  } catch (e) {
    Message.error((e as Error).message || '提交失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const ids = readIds()
    if (!ids.length) {
      Message.warning('请先在列表勾选要编辑的字段')
      router.replace('/metadata')
      return
    }
    const list = await listMetadataByIds(ids)
    if (!list.length) {
      Message.warning('未找到已选字段')
      router.replace('/metadata')
      return
    }
    rows.value = list.map((item) => ({
      key: `r${keySeq++}`,
      id: item.id,
      name: item.name,
      description: item.description || item.bizCaliber || '',
      dataType: item.dataType,
      length: item.length || '',
      defaultValue: item.defaultValue || '',
      bizCategory: item.bizCategory || '',
      remark: item.remark || '',
      status: item.status || 'enabled',
      refSchemeCount: item.refSchemeCount || 0,
    }))
    await nextTick()
    markPristine()
  } catch (e) {
    Message.error((e as Error).message || '加载失败')
    router.replace('/metadata')
  }
})
</script>

<style scoped>
.edit-main {
  display: flex;
  flex-direction: column;
}

.batch-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.batch-toolbar__tip {
  font-size: 12px;
  color: #86909c;
}

.batch-table-wrap {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: visible;
  border: 1px solid var(--color-border-2, #e5e6eb);
  border-radius: 6px;
  background: #fff;
}

.batch-table {
  width: 100%;
  min-width: 1056px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
}

.batch-table th,
.batch-table td {
  border-bottom: 1px solid #e5e6eb;
  border-right: 1px solid #e5e6eb;
  padding: 10px 8px;
  vertical-align: top;
  background: #fff;
}

.batch-table th {
  background: #f7f8fa;
  font-weight: 600;
  color: #1d2129;
  text-align: left;
  white-space: nowrap;
}

.batch-table th:first-child,
.batch-table td:first-child {
  border-left: none;
}

.batch-table th:last-child,
.batch-table td:last-child {
  border-right: none;
}

.batch-table tbody tr:last-child td {
  border-bottom: none;
}

.req {
  color: rgb(var(--danger-6));
}

.col-idx {
  width: 48px;
  text-align: center !important;
  color: #86909c;
}

.col-name {
  width: 160px;
}

.col-desc {
  width: 220px;
}

.col-type {
  width: 120px;
}

.col-len {
  width: 100px;
}

.col-default {
  width: 110px;
}

.col-biz {
  width: 120px;
}

.col-remark {
  width: 140px;
}

.col-status {
  width: 96px;
}

.col-ops {
  width: 72px;
  text-align: center !important;
}

.cell-error {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.3;
  color: rgb(var(--danger-6));
}
</style>
