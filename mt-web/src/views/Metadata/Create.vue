<template>
  <div class="page-shell edit-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">新增字段</h2>
        <p class="page-desc">以表格方式一次新增 1 条或多条字段；提交时校验字段名不可与已有字段及本批内重复。</p>
      </div>
      <a-space>
        <a-button @click="goBack">返回列表</a-button>
      </a-space>
    </div>

    <a-card class="content-card edit-card" :bordered="false">
      <div class="edit-card-inner">
        <div class="edit-main">
          <div class="batch-toolbar">
            <a-button type="outline" @click="addRow">添加一行</a-button>
            <span class="batch-toolbar__tip">共 {{ rows.length }} 条，字段名须唯一</span>
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
                  <th class="col-ops">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in rows" :key="row.key">
                  <td class="col-idx">{{ index + 1 }}</td>
                  <td class="col-name">
                    <a-input
                      v-model="row.name"
                      placeholder="字母/数字/下划线"
                      :max-length="64"
                      allow-clear
                      :status="rowErrors[row.key]?.name ? 'error' : undefined"
                    />
                    <div v-if="rowErrors[row.key]?.name" class="cell-error">{{ rowErrors[row.key].name }}</div>
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
                    <a-input v-model="row.remark" placeholder="选填" allow-clear />
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
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { checkMetadataNameExists, saveMetadataBatch } from '@/api/mt'
import { bizCategoryOptions, dataTypeOptions } from '@/mock/mt'

type BatchRow = {
  key: string
  name: string
  description: string
  dataType: string
  length: string
  defaultValue: string
  bizCategory: string
  remark: string
}

const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

const router = useRouter()
const saving = ref(false)
let keySeq = 1

function emptyRow(): BatchRow {
  return {
    key: `r${keySeq++}`,
    name: '',
    description: '',
    dataType: 'String',
    length: '',
    defaultValue: '',
    bizCategory: '',
    remark: '',
  }
}

const rows = ref<BatchRow[]>([emptyRow()])
const rowErrors = reactive<Record<string, Partial<Record<'name' | 'description' | 'dataType', string>>>>({})

function goBack() {
  router.push('/metadata')
}

function addRow() {
  rows.value.push(emptyRow())
}

function removeRow(index: number) {
  if (rows.value.length <= 1) return
  const [removed] = rows.value.splice(index, 1)
  if (removed) delete rowErrors[removed.key]
}

function clearErrors() {
  Object.keys(rowErrors).forEach((k) => delete rowErrors[k])
}

function setError(key: string, field: 'name' | 'description' | 'dataType', msg: string) {
  if (!rowErrors[key]) rowErrors[key] = {}
  rowErrors[key][field] = msg
}

async function validateRows(): Promise<boolean> {
  clearErrors()
  let ok = true
  const seen = new Map<string, string>()

  for (const row of rows.value) {
    const name = row.name.trim()
    if (!name) {
      setError(row.key, 'name', '请填写字段名')
      ok = false
    } else if (!NAME_PATTERN.test(name)) {
      setError(row.key, 'name', '仅支持字母、数字、下划线，且以字母或下划线开头')
      ok = false
    } else if (seen.has(name)) {
      setError(row.key, 'name', '本批内字段名重复')
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
    const name = row.name.trim()
    if (await checkMetadataNameExists(name)) {
      setError(row.key, 'name', '字段名已存在')
      ok = false
    }
  }
  return ok
}

async function onSubmit() {
  if (!(await validateRows())) {
    Message.error('请先修正表格中的校验问题')
    return
  }
  saving.value = true
  try {
    const saved = await saveMetadataBatch(
      rows.value.map((row) => ({
        name: row.name.trim(),
        description: row.description.trim(),
        dataType: row.dataType.trim(),
        length: row.length.trim(),
        defaultValue: row.defaultValue.trim(),
        bizCategory: row.bizCategory,
        remark: row.remark.trim(),
      })),
    )
    Message.success(`已新增 ${saved.length} 个字段`)
    router.push('/metadata')
  } catch (e) {
    Message.error((e as Error).message || '提交失败')
  } finally {
    saving.value = false
  }
}
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
  min-width: 960px;
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
