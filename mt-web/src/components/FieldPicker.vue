<template>
  <div class="field-picker" :class="{ 'field-picker--compact': compact }">
    <div class="field-picker__toolbar">
      <a-select
        v-if="!hideTemplatePanel"
        v-model="activeTemplateId"
        allow-search
        allow-clear
        placeholder="选择模板"
        style="width: 280px"
        :filter-option="filterTemplateOption"
        @change="onTemplateChange"
      >
        <a-option v-for="tpl in templateOptions" :key="tpl.value" :value="tpl.value" :label="tpl.label">
          {{ tpl.label }}
        </a-option>
      </a-select>
      <a-input v-model="keyword" allow-clear placeholder="搜索字段名 / 描述" style="width: 200px" />
      <a-select
        v-model="category"
        :options="categoryOpts"
        allow-clear
        placeholder="业务分类"
        style="width: 140px"
      />
      <a-button v-if="!hideJsonImport" type="outline" size="mini" @click="openJsonImport">Json批量导入</a-button>
      <a-button type="outline" size="mini" @click="clearFilters">清空筛选条件</a-button>
      <span class="field-picker__count">已选 {{ modelValue.length }} / {{ fields.length }}</span>
      <a-button
        v-if="!hideSaveAsTemplate && canSaveAsTemplate"
        type="outline"
        size="mini"
        @click="openSaveModal"
      >
        保存为模板
      </a-button>
    </div>

    <a-spin v-if="loading" class="field-picker__loading" tip="字段加载中…" />
    <template v-else>
      <div v-if="sortedFilteredFields.length" class="field-picker__body">
        <table class="field-map-table">
          <thead>
          <tr>
            <th class="col-check sticky-r1"></th>
            <th colspan="4" class="group-head group-head--platform sticky-r1">{{ groupTitles[0] }}</th>
            <th colspan="2" class="group-head group-head--supplier sticky-r1">{{ groupTitles[1] }}</th>
          </tr>
          <tr>
            <th class="col-check sticky-r2">
              <a-checkbox
                :model-value="isAllFilteredChecked"
                :indeterminate="isAllFilteredIndeterminate"
                @change="(checked: boolean | (string | number | boolean)[]) => toggleAllFiltered(!!checked)"
              />
            </th>
            <th class="col-name sticky-r2">字段名</th>
            <th class="col-desc sticky-r2">字段描述</th>
            <th class="col-type sticky-r2">字段类型</th>
            <th class="col-biz sticky-r2">业务分类</th>
            <th class="col-s-name sticky-r2">字段名</th>
            <th class="col-s-type sticky-r2">字段类型</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in sortedFilteredFields"
            :key="item.id"
            :class="{ 'is-checked': isChecked(item.id) }"
          >
            <td class="col-check">
              <a-checkbox
                :model-value="isChecked(item.id)"
                @change="(checked: boolean | (string | number | boolean)[]) => toggleField(item.id, !!checked)"
              />
            </td>
            <td class="col-name">{{ item.name }}</td>
            <td class="col-desc" :title="item.description">{{ item.description }}</td>
            <td class="col-type">{{ item.dataType }}</td>
            <td class="col-biz">{{ item.bizCategory || '—' }}</td>
            <td class="col-s-name">
              <a-input
                size="mini"
                :model-value="getMap(item.id).supplierFieldName"
                :disabled="!isChecked(item.id)"
                placeholder="默认同平台字段名"
                allow-clear
                @update:model-value="(v: string) => patchMap(item.id, { supplierFieldName: v })"
              />
            </td>
            <td class="col-s-type">
              <a-select
                size="mini"
                :model-value="getMap(item.id).supplierDataType || undefined"
                :options="dataTypeOptions"
                :disabled="!isChecked(item.id)"
                allow-clear
                allow-create
                placeholder="默认同平台类型"
                style="width: 100%"
                @update:model-value="
                  (v: string | number | boolean | Record<string, any> | (string | number | boolean | Record<string, any>)[]) =>
                    patchMap(item.id, { supplierDataType: v == null ? '' : String(v) })
                "
              />
            </td>
          </tr>
        </tbody>
        </table>
      </div>
      <a-empty v-else :description="emptyText" />
    </template>

    <a-modal
      v-model:visible="saveVisible"
      title="保存为快速模板"
      :width="480"
      unmount-on-close
      :on-before-ok="onSaveTemplate"
    >
      <a-form ref="saveFormRef" :model="saveForm" :rules="saveRules" layout="vertical">
        <a-form-item field="name" label="模板名称" required>
          <a-input v-model="saveForm.name" placeholder="请输入模板名称" :max-length="50" allow-clear />
        </a-form-item>
        <a-form-item field="desc" label="模板说明">
          <a-textarea
            v-model="saveForm.desc"
            placeholder="可选，说明适用场景"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            :max-length="200"
            allow-clear
          />
        </a-form-item>
        <a-alert type="info">
          将保存当前已选 {{ modelValue.length }} 个字段及供数方字段映射（非必填），模板类型为「用户自定义」。
        </a-alert>
      </a-form>
    </a-modal>

    <!-- Json 批量导入弹窗 -->
    <a-modal
      v-model:visible="jsonImportVisible"
      title="Json批量导入"
      :width="640"
      unmount-on-close
      :mask-closible="false"
    >
      <a-textarea
        v-model="jsonImportText"
        :auto-size="{ minRows: 14, maxRows: 24 }"
        class="json-import-textarea"
        allow-clear
        placeholder='示例：
{ "name": "张三", "phone": "13800138000", "role": "商务对接人" },
{ "name": "李四", "phone": "13900139000", "role": "技术负责人" }'
      />
      <template #footer>
        <a-button @click="jsonImportVisible = false">取消</a-button>
        <a-button type="primary" :loading="jsonParsing" @click="parseAndImport">解析导入</a-button>
      </template>
    </a-modal>

    <!-- 缺失字段确认弹窗 -->
    <a-modal
      v-model:visible="missingConfirmVisible"
      title="确认新增字段"
      :width="480"
      unmount-on-close
      :mask-closible="false"
      :on-before-ok="onConfirmAddMissing"
    >
      <a-alert type="warning">
        所填写的字段[{{ missingKeys.join('、') }}]不在字段库中，请确认是否新增该字段到字段库中？
      </a-alert>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Message, type FormInstance } from '@arco-design/web-vue'
import { listFieldTemplates, saveFieldTemplate, saveMetadataBatch, listEnabledMetadata } from '@/api/mt'
import { dictSelectOptions } from '@/api/dict'
import {
  normalizeFieldMaps,
  sameFieldIdSet,
  type FieldMapItem,
  type FieldTemplate,
} from '@/mock/mt'
import { clearFormValidate, validateForm } from '@/utils/formValidate'

export interface PickerField {
  id: string
  name: string
  description: string
  dataType: string
  bizCategory: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    fieldMaps?: FieldMapItem[]
    fields: PickerField[]
    hideTemplatePanel?: boolean
    hideSaveAsTemplate?: boolean
    /** 弹窗内嵌时降低高度，避免占满视口 */
    compact?: boolean
    /** 自定义两列分组标题：[中台/平台列组名, 对端列组名] */
    groupTitles?: [string, string]
    /** 隐藏 Json 批量导入按钮（推送侧仅从字段库选择，不新增字段） */
    hideJsonImport?: boolean
    /** 字段列表加载中（由父组件按数据来源异步加载时传入） */
    loading?: boolean
    /** 无字段时的空态文案（如提示先选择数据来源） */
    emptyText?: string
  }>(),
  {
    fieldMaps: () => [],
    hideTemplatePanel: false,
    hideSaveAsTemplate: false,
    compact: false,
    groupTitles: () => ['平台字段库', '供数方字段'] as [string, string],
    hideJsonImport: false,
    loading: false,
    emptyText: '无匹配字段',
  },
)

const emit = defineEmits<{
  'update:modelValue': [string[]]
  'update:fieldMaps': [FieldMapItem[]]
  'update:fields': [PickerField[]]
}>()

/** 本地渲染源：初始取 props.fields，导入新字段后组件内即时刷新并推送父组件同步 */
const localFields = ref<PickerField[]>([...props.fields])
watch(
  () => props.fields,
  (list) => {
    localFields.value = [...list]
  },
  { deep: true },
)

const keyword = ref('')
const category = ref<string | undefined>()
const categoryOpts = computed(() => dictSelectOptions('field_biz_category'))
const dataTypeOptions = computed(() => dictSelectOptions('field_data_type'))
const categoryOrder = ['平台', '作者', '文章', '标注', '运维管理', '其它']
const templates = ref<FieldTemplate[]>([])
const activeTemplateId = ref<string | undefined>()
const applyingTemplate = ref(false)
const saveVisible = ref(false)
const saveFormRef = ref<FormInstance>()
const saveForm = reactive({ name: '', desc: '' })
const saveRules = {
  name: [{ required: true, message: '请填写模板名称' }],
}

const availableIdSet = computed(() => new Set(localFields.value.map((f) => f.id)))
const fieldById = computed(() => new Map(localFields.value.map((f) => [f.id, f])))

const templateOptions = computed(() =>
  templates.value.map((tpl) => ({
    value: tpl.id,
    label: `${tpl.name}（${tpl.fieldIds?.length || 0}个字段）`,
    name: tpl.name,
  })),
)

const canSaveAsTemplate = computed(() => {
  if (!props.modelValue.length) return false
  const current = [...new Set(props.modelValue)]
  return !templates.value.some((tpl) => sameFieldIdSet(resolveTemplateIds(tpl.fieldIds), current))
})

const filteredFields = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return localFields.value.filter((item) => {
    if (category.value && item.bizCategory !== category.value) return false
    if (!kw) return true
    return item.name.toLowerCase().includes(kw) || item.description.toLowerCase().includes(kw)
  })
})

const sortedFilteredFields = computed(() => {
  const orderIndex = (name: string) => {
    const i = categoryOrder.indexOf(name)
    return i >= 0 ? i : categoryOrder.length + 1
  }
  // 本次 Json 导入的字段置顶（按导入顺序，作为首要排序键，保证新增字段展示在列表最前）
  const importedIdx = (name: string) => lastImportedNames.value.indexOf(name)
  return [...filteredFields.value].sort((a, b) => {
    const ia = importedIdx(a.name)
    const ib = importedIdx(b.name)
    if (ia !== ib) {
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    }
    const ca = a.bizCategory || '未分类'
    const cb = b.bizCategory || '未分类'
    const d = orderIndex(ca) - orderIndex(cb)
    if (d !== 0) return d
    return a.name.localeCompare(b.name)
  })
})

const isAllFilteredChecked = computed(
  () =>
    sortedFilteredFields.value.length > 0 &&
    sortedFilteredFields.value.every((item) => props.modelValue.includes(item.id)),
)
const isAllFilteredIndeterminate = computed(() => {
  const n = sortedFilteredFields.value.filter((item) => props.modelValue.includes(item.id)).length
  return n > 0 && n < sortedFilteredFields.value.length
})

function filterTemplateOption(input: string, option: { label?: string }) {
  const q = String(input || '').trim().toLowerCase()
  if (!q) return true
  return String(option.label || '')
    .toLowerCase()
    .includes(q)
}

function resolveTemplateIds(fieldIds: readonly string[]) {
  return fieldIds.filter((id) => availableIdSet.value.has(id))
}

function defaultMap(fieldId: string): FieldMapItem {
  const f = fieldById.value.get(fieldId)
  return {
    fieldId,
    supplierFieldName: f?.name || '',
    supplierDataType: f?.dataType || '',
  }
}

function getMap(fieldId: string): FieldMapItem {
  const hit = (props.fieldMaps || []).find((m) => m.fieldId === fieldId)
  if (hit) return hit
  return defaultMap(fieldId)
}

function emitMapsForIds(ids: string[], mapsSource?: FieldMapItem[]) {
  const src = mapsSource || props.fieldMaps || []
  const byId = new Map(src.map((m) => [m.fieldId, m]))
  const next = ids.map((id) => {
    const prev = byId.get(id)
    if (prev) return { ...prev }
    return defaultMap(id)
  })
  emit('update:fieldMaps', next)
}

function setIds(ids: string[], mapsSource?: FieldMapItem[]) {
  const uniq = [...new Set(ids)]
  emit('update:modelValue', uniq)
  emitMapsForIds(uniq, mapsSource)
}

function patchMap(fieldId: string, patch: Partial<FieldMapItem>) {
  if (!props.modelValue.includes(fieldId)) return
  const next = normalizeFieldMaps(props.modelValue, props.fieldMaps, (id) => {
    const f = fieldById.value.get(id)
    return f ? { name: f.name, dataType: f.dataType } : null
  }).map((m) => (m.fieldId === fieldId ? { ...m, ...patch } : m))
  emit('update:fieldMaps', next)
}

function matchTemplateId(ids: string[]) {
  for (const tpl of templates.value) {
    const expected = resolveTemplateIds(tpl.fieldIds)
    if (sameFieldIdSet(ids, expected)) return tpl.id
  }
  return undefined
}

function applyTemplate(id: string) {
  const tpl = templates.value.find((t) => t.id === id)
  if (!tpl) return
  applyingTemplate.value = true
  activeTemplateId.value = id
  const ids = resolveTemplateIds(tpl.fieldIds)
  const maps = normalizeFieldMaps(ids, tpl.fieldMaps, (fid) => {
    const f = fieldById.value.get(fid)
    return f ? { name: f.name, dataType: f.dataType } : null
  })
  setIds(ids, maps)
  queueMicrotask(() => {
    applyingTemplate.value = false
  })
}

function onTemplateChange(
  value: string | number | boolean | Record<string, any> | (string | number | boolean | Record<string, any>)[],
) {
  const id = value == null || value === '' ? undefined : String(value)
  if (!id) {
    activeTemplateId.value = undefined
    return
  }
  applyTemplate(id)
}

function clearFilters() {
  keyword.value = ''
  category.value = undefined
  activeTemplateId.value = undefined
}

async function loadTemplates() {
  templates.value = await listFieldTemplates()
  activeTemplateId.value = matchTemplateId(props.modelValue)
}

function openSaveModal() {
  saveForm.name = ''
  saveForm.desc = ''
  saveVisible.value = true
  queueMicrotask(() => clearFormValidate(saveFormRef.value))
}

async function onSaveTemplate() {
  if (!(await validateForm(saveFormRef.value))) return false
  try {
    const fieldIds = [...props.modelValue]
    const fieldMaps = normalizeFieldMaps(fieldIds, props.fieldMaps, (id) => {
      const f = fieldById.value.get(id)
      return f ? { name: f.name, dataType: f.dataType } : null
    })
    await saveFieldTemplate({
      name: saveForm.name,
      desc: saveForm.desc,
      fieldIds,
      fieldMaps,
    })
    Message.success('已保存为用户自定义模板')
    await loadTemplates()
    activeTemplateId.value = matchTemplateId(props.modelValue)
    return true
  } catch (e) {
    Message.error((e as Error).message)
    return false
  }
}

watch(
  () => props.modelValue.slice(),
  (ids) => {
    if (applyingTemplate.value) return
    activeTemplateId.value = matchTemplateId(ids)
  },
)

function isChecked(id: string) {
  return props.modelValue.includes(id)
}
function toggleField(id: string, checked: boolean) {
  if (checked) setIds([...props.modelValue, id])
  else setIds(props.modelValue.filter((x) => x !== id))
}
function toggleAllFiltered(checked: boolean) {
  const ids = sortedFilteredFields.value.map((i) => i.id)
  if (checked) setIds([...props.modelValue, ...ids])
  else {
    const drop = new Set(ids)
    setIds(props.modelValue.filter((id) => !drop.has(id)))
  }
}

onMounted(() => {
  if (!props.hideTemplatePanel || !props.hideSaveAsTemplate) {
    loadTemplates()
  }
})

// === Json 批量导入 ===
const jsonImportVisible = ref(false)
const jsonImportText = ref('')
const jsonParsing = ref(false)
const missingConfirmVisible = ref(false)
const missingKeys = ref<string[]>([])
/** 解析中间态：[key, 是否在字段库存在] */
const parsedKeyInfo = ref<{ key: string; exists: boolean }[]>([])

const JSON_IMPORT_MAX_FIELDS = 50

function openJsonImport() {
  jsonImportText.value = ''
  lastImportedNames.value = []
  jsonImportVisible.value = true
}

/** 解析 Json 文本，返回所有对象的 key 并集 */
function parseJsonText(text: string): { keys: string[]; values: Record<string, unknown>[] } | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const objects: Record<string, unknown>[] = []

  // 先尝试整体解析
  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item && typeof item === 'object' && !Array.isArray(item)) objects.push(item)
      }
    } else if (parsed && typeof parsed === 'object') {
      objects.push(parsed)
    }
  } catch {
    // 降级：正则提取所有顶层 {...} 块逐个解析
    const blocks = trimmed.match(/\{[^{}]*\}/g)
    if (!blocks || !blocks.length) return null
    for (const block of blocks) {
      try {
        const obj = JSON.parse(block)
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) objects.push(obj)
      } catch {
        return null // 任一块解析失败
      }
    }
  }

  if (!objects.length) return null

  // 取所有 key 的并集（去重，保序）
  const seen = new Set<string>()
  const keys: string[] = []
  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      if (!seen.has(key)) {
        seen.add(key)
        keys.push(key)
      }
    }
  }
  return { keys, values: objects }
}

/** 按 Json 值推断数据类型 */
function inferDataType(values: Record<string, unknown>[], key: string): string {
  for (const obj of values) {
    const v = obj[key]
    if (v !== undefined && v !== null) {
      if (typeof v === 'number') return 'Int'
      return 'String'
    }
  }
  return 'String'
}

async function parseAndImport() {
  const parsed = parseJsonText(jsonImportText.value)
  if (!parsed) {
    Message.warning('请输入有效的 Json 内容')
    return
  }
  if (parsed.keys.length > JSON_IMPORT_MAX_FIELDS) {
    Message.error(`单次导入字段数不超过 ${JSON_IMPORT_MAX_FIELDS}`)
    return
  }

  // 比对字段库
  const existingNames = new Set(localFields.value.map((f) => f.name))
  parsedKeyInfo.value = parsed.keys.map((key) => ({
    key,
    exists: existingNames.has(key),
  }))
  const missing = parsedKeyInfo.value.filter((info) => !info.exists).map((info) => info.key)

  if (missing.length > 0) {
    missingKeys.value = missing
    missingConfirmVisible.value = true
    // 存储解析结果供确认回调使用
    pendingParsed.value = parsed
    return
  }

  // 全部存在，直接勾选
  applyParsedFields(parsed)
}

const pendingParsed = ref<{ keys: string[]; values: Record<string, unknown>[] } | null>(null)

/** 本次 Json 导入的字段名（新增 + 已存在，用于导入后列表置顶展示） */
const lastImportedNames = ref<string[]>([])

/** 拉取最新启用字段并同步本地渲染源与父组件；可指定置顶字段名（数据层重排双保险） */
async function refreshFieldsFromApi(preferTopNames: string[] = []) {
  const latest = await listEnabledMetadata()
  let latestFields: PickerField[] = latest.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description || m.bizCaliber || '',
    dataType: m.dataType,
    bizCategory: m.bizCategory || '',
  }))
  if (preferTopNames.length) {
    const top = preferTopNames
      .map((n) => latestFields.find((f) => f.name === n))
      .filter((f): f is PickerField => !!f)
    const topIds = new Set(top.map((f) => f.id))
    latestFields = [...top, ...latestFields.filter((f) => !topIds.has(f.id))]
  }
  // 组件内即时刷新（渲染/勾选映射直接可用，无跨组件时序问题）
  localFields.value = latestFields
  // 同步父组件数据源
  emit('update:fields', latestFields)
}

async function onConfirmAddMissing() {
  const parsed = pendingParsed.value
  if (!parsed) return false
  const missing = parsedKeyInfo.value.filter((info) => !info.exists).map((info) => info.key)

  try {
    // 将缺失字段写入字段库
    const rows = missing.map((name) => ({
      name,
      description: name,
      dataType: inferDataType(parsed.values, name),
      bizCategory: '其它',
    }))
    await saveMetadataBatch(rows)
    // 本次导入的全部字段置顶（含新增与已存在），并同步最新字段库
    lastImportedNames.value = parsed.keys
    await refreshFieldsFromApi(parsed.keys)
    // 勾选全部解析字段（已存在 + 新增）
    applyParsedFields(parsed)
    jsonImportVisible.value = false
    missingConfirmVisible.value = false
    pendingParsed.value = null
    Message.success(`已导入 ${parsed.keys.length} 个字段（其中新增 ${missing.length} 个）`)
    return true
  } catch (e) {
    Message.error((e as Error).message)
    return false
  }
}

/** 将解析出的字段勾选进本方案 */
function applyParsedFields(parsed: { keys: string[]; values: Record<string, unknown>[] }) {
  // 本次导入的字段置顶（全已存在场景同样置顶，便于用户确认导入结果）
  lastImportedNames.value = parsed.keys
  const nameToId = new Map(localFields.value.map((f) => [f.name, f.id]))
  const idsToCheck = parsed.keys
    .map((key) => nameToId.get(key))
    .filter((id): id is string => !!id)
  setIds([...new Set([...props.modelValue, ...idsToCheck])])
  jsonImportVisible.value = false
}

defineExpose({
  reloadTemplates: loadTemplates,
})
</script>

<style scoped>
.json-import-textarea :deep(textarea) {
  min-height: 300px !important;
  font-family: 'Menlo', 'Consolas', monospace;
}

.field-picker {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 268px);
  min-height: 480px;
  border: 1px solid var(--color-border-2, #e5e6eb);
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}
.field-picker--compact {
  height: min(380px, 42vh);
  min-height: 280px;
  max-height: 420px;
}
.field-picker__toolbar {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  min-height: 56px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-2, #e5e6eb);
  background: #fafbfc;
}
.field-picker__count {
  margin-left: auto;
  color: var(--color-text-3, #86909c);
  font-size: 12px;
  white-space: nowrap;
}
.field-picker__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  background: #fff;
}
.field-picker__loading {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: #fff;
}
.field-map-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}
.field-map-table th,
.field-map-table td {
  border-right: 1px solid #e5e6eb;
  border-bottom: 1px solid #e5e6eb;
  padding: 8px 10px;
  vertical-align: middle;
  background-clip: padding-box;
}
.field-map-table th:first-child,
.field-map-table td:first-child {
  border-left: 1px solid #e5e6eb;
}
.field-map-table thead tr:first-child th,
.field-map-table thead .sticky-r1 {
  border-top: 1px solid #e5e6eb;
  position: sticky;
  top: 0;
  z-index: 4;
  height: 42px;
  padding-top: 10px;
  padding-bottom: 10px;
  background: #f2f3f5;
  font-weight: 600;
  font-size: 13px;
  text-align: center;
}
.field-map-table thead tr:nth-child(2) th,
.field-map-table thead .sticky-r2 {
  position: sticky;
  top: 42px;
  z-index: 3;
  height: 38px;
  padding-top: 9px;
  padding-bottom: 9px;
  background: #f2f3f5;
  font-weight: 500;
  text-align: center;
  box-shadow: 0 1px 0 #e5e6eb;
}
.field-map-table thead .sticky-r1.col-check {
  background: #f2f3f5 !important;
}
.field-map-table thead .sticky-r2.col-check {
  background: #f2f3f5 !important;
}
.field-map-table thead .sticky-r2.col-name,
.field-map-table thead .sticky-r2.col-desc,
.field-map-table thead .sticky-r2.col-type,
.field-map-table thead .sticky-r2.col-biz {
  background: #e8f3ff !important;
}
.field-map-table thead .sticky-r2.col-s-name,
.field-map-table thead .sticky-r2.col-s-type {
  background: #cce0ff !important;
}
.group-head--platform {
  background: #e8f3ff !important;
  color: #1d2129;
}
.group-head--supplier {
  background: #cce0ff !important;
  color: #1d2129;
}
.col-check {
  width: 44px;
  text-align: center;
}
.col-name {
  width: 16%;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  word-break: break-all;
}
.col-desc {
  width: 28%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #4e5969;
}
.col-type {
  width: 10%;
  text-align: center;
  color: #86909c;
}
.col-biz {
  width: 12%;
  text-align: center;
}
.col-s-name {
  width: 18%;
}
.col-s-type {
  width: 12%;
}
tbody td {
  background: #fff;
}
tbody tr.is-checked td {
  background: #f7faff;
}
</style>
