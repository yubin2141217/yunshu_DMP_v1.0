<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <h2 class="page-title">告警规则</h2>
        <p class="page-desc">统一配置供数断流、拒收率突增、入库延迟与字段异常的告警阈值与级别，启用后下发至机构端「供数监控」生效</p>
      </div>
      <a-button type="primary" @click="openCreate">新增规则</a-button>
    </div>
    <a-card class="content-card" :bordered="false">
      <div class="page-search">
        <div class="search-field">
          <span class="search-field__label">规则名称</span>
          <a-input v-model="form.keyword" allow-clear style="width: 200px" placeholder="规则名称 / 阈值" />
        </div>
        <div class="search-field">
          <span class="search-field__label">告警类型</span>
          <a-select v-model="form.type" :options="typeOptions" allow-clear placeholder="全部类型" style="width: 160px" />
        </div>
        <div class="search-field">
          <span class="search-field__label">状态</span>
          <a-select v-model="form.status" :options="statusOptions" allow-clear placeholder="全部状态" style="width: 140px" />
        </div>
        <a-button type="primary" @click="fetchData">查询</a-button>
        <a-button @click="onReset">重置</a-button>
      </div>
      <a-table :columns="columns" :data="data" :loading="loading" row-key="id" :pagination="false" :bordered="false" stripe>
        <template #type="{ record }">
          <a-tag size="small">{{ typeLabel(record.type) }}</a-tag>
        </template>
        <template #level="{ record }">
          <a-tag :color="levelMeta(record.level).color" size="small">{{ levelMeta(record.level).label }}</a-tag>
        </template>
        <template #enabled="{ record }">
          <a-switch
            :model-value="record.enabled"
            checked-text="启用"
            unchecked-text="停用"
            :loading="togglingId === record.id"
            @change="(v: boolean | string | number) => onToggle(record, !!v)"
          />
        </template>
        <template #operations="{ record }">
          <a-space class="arco-table-ops" :size="2">
            <a-button type="text" size="small" @click="openEdit(record)">编辑</a-button>
            <a-button type="text" status="danger" size="small" @click="onDelete(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="visible" :title="mode === 'create' ? '新增告警规则' : '编辑告警规则'" :on-before-ok="onSubmit" @cancel="visible = false">
      <a-form ref="formRef" :model="editor" :rules="rules" layout="vertical">
        <a-form-item field="name" label="规则名称" required>
          <a-input v-model="editor.name" :max-length="30" placeholder="如：供数断流告警" />
        </a-form-item>
        <a-form-item field="type" label="告警类型" required>
          <a-select v-model="editor.type" :options="typeOptions" placeholder="请选择" @change="onTypeChange" />
        </a-form-item>
        <a-form-item field="level" required>
          <template #label>
            <FormFieldLabel title="告警级别" desc="规则命中后产生的告警级别，机构端按其订阅的接收级别决定是否推送" />
          </template>
          <a-radio-group v-model="editor.level" direction="horizontal">
            <a-radio value="high">高</a-radio>
            <a-radio value="mid">中</a-radio>
            <a-radio value="low">低</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item v-if="editor.type" class="threshold-item">
          <template #label>
            <span class="req-star">*</span>
            <FormFieldLabel title="触发阈值" desc="按结构化条件配置，系统据此规范判定；切换告警类型将重置对应阈值项" />
          </template>

          <div class="cond-box">
            <!-- 供数断流：连续 N 分钟/小时无入库 -->
            <div v-if="editor.type === 'break'" class="cond-grid">
              <span class="cond-label">无入库时长</span>
              <div class="cond-controls cond-controls--inline">
                <a-input-number
                  v-model="condBreak.noDataValue"
                  :min="1"
                  :precision="0"
                  :step="1"
                  class="cond-num"
                />
                <a-select v-model="condBreak.noDataUnit" class="cond-unit">
                  <a-option value="minute">分钟</a-option>
                  <a-option value="hour">小时</a-option>
                </a-select>
              </div>
            </div>

            <!-- 拒收率突增：窗口 + 拒收率 + 最小样本量 -->
            <div v-else-if="editor.type === 'reject'" class="cond-stack">
              <div class="cond-grid">
                <span class="cond-label">统计窗口</span>
                <div class="cond-controls">
                  <a-input-number
                    v-model="condReject.windowHours"
                    :min="1"
                    :precision="0"
                    :step="1"
                    class="cond-num"
                  />
                  <span class="cond-unit-text">小时</span>
                </div>
              </div>
              <div class="cond-grid">
                <span class="cond-label">拒收率上限</span>
                <div class="cond-controls">
                  <a-input-number
                    v-model="condReject.ratePercent"
                    :min="0"
                    :max="100"
                    :precision="1"
                    :step="0.5"
                    class="cond-num"
                  />
                  <span class="cond-unit-text">%</span>
                </div>
              </div>
              <div class="cond-grid">
                <span class="cond-label">最小样本量</span>
                <div class="cond-controls">
                  <a-input-number
                    v-model="condReject.minVolume"
                    :min="0"
                    :precision="0"
                    :step="100"
                    class="cond-num cond-num--wide"
                  />
                  <span class="cond-unit-text">条</span>
                  <span class="cond-hint">低于此量不判定，避免小样本误报</span>
                </div>
              </div>
            </div>

            <!-- 入库延迟：延迟指标 + 分钟数 -->
            <div v-else-if="editor.type === 'delay'" class="cond-stack">
              <div class="cond-grid">
                <span class="cond-label">延迟指标</span>
                <div class="cond-controls">
                  <a-select v-model="condDelay.metric" class="cond-select">
                    <a-option value="avg">平均延迟</a-option>
                    <a-option value="p95">P95 延迟</a-option>
                    <a-option value="max">最大延迟</a-option>
                  </a-select>
                </div>
              </div>
              <div class="cond-grid">
                <span class="cond-label">延迟阈值</span>
                <div class="cond-controls">
                  <a-input-number
                    v-model="condDelay.minutes"
                    :min="1"
                    :precision="0"
                    :step="1"
                    class="cond-num"
                  />
                  <span class="cond-unit-text">分钟（大于该值触发）</span>
                </div>
              </div>
            </div>

            <!-- 字段异常：必选监测字段 + 缺失率 -->
            <div v-else-if="editor.type === 'field'" class="cond-stack">
              <div class="cond-grid">
                <span class="cond-label"><i class="req-star cond-req">*</i>监测字段</span>
                <div class="cond-controls">
                  <a-select
                    v-model="condField.fieldKey"
                    allow-search
                    allow-create
                    :fallback-option="false"
                    placeholder="请选择或输入监测字段"
                    class="cond-select cond-select--wide"
                  >
                    <a-option v-for="f in fieldSuggestions" :key="f" :value="f">{{ f }}</a-option>
                  </a-select>
                </div>
              </div>
              <div class="cond-grid">
                <span class="cond-label">缺失率上限</span>
                <div class="cond-controls">
                  <a-input-number
                    v-model="condField.missingRatePercent"
                    :min="0"
                    :max="100"
                    :precision="1"
                    :step="0.5"
                    class="cond-num"
                  />
                  <span class="cond-unit-text">%</span>
                </div>
              </div>
            </div>

            <div class="cond-preview">
              <icon-info-circle />
              <span>规则实际判定口径：{{ thresholdPreview || previewEmptyHint }}</span>
            </div>
          </div>
        </a-form-item>
        <a-form-item field="enabled" label="状态">
          <a-switch
            :model-value="editor.enabled"
            checked-text="启用"
            unchecked-text="停用"
            @change="(v: boolean | string | number) => (editor.enabled = !!v)"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { Message, Modal, type FormInstance } from '@arco-design/web-vue'
import { IconInfoCircle } from '@arco-design/web-vue/es/icon'
import FormFieldLabel from '@/components/FormFieldLabel.vue'
import {
  deleteAlertRule,
  listAlertRules,
  saveAlertRule,
  toggleAlertRule,
} from '@/api/alertRules'
import {
  alertLevelMeta,
  alertTypeLabels,
  defaultCondition,
  describeCondition,
  type AlertLevel,
  type AlertRule,
  type AlertRuleCondition,
  type AlertType,
  type BreakCondition,
  type DelayCondition,
  type FieldCondition,
  type RejectCondition,
} from '@/v8/mock/types'
import { clearFormValidate, validateForm } from '@/utils/formValidate'

const typeLabel = (t: AlertType) => alertTypeLabels[t]
const levelMeta = (l: AlertLevel) => alertLevelMeta[l]

const typeOptions = (Object.keys(alertTypeLabels) as AlertType[]).map((t) => ({ label: alertTypeLabels[t], value: t }))
const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
]

/** 字段异常监测字段建议（可搜索可自定义输入） */
const fieldSuggestions = ['news_title', 'news_content', 'publish_time', 'source', 'author', 'url']

const form = reactive({ keyword: '', type: '', status: '' })
const data = ref<AlertRule[]>([])
const loading = ref(false)
const togglingId = ref('')
const visible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()

const emptyEditor = () => ({ id: '', name: '', type: '' as AlertType | '', level: 'high' as AlertLevel, enabled: true })
const editor = reactive(emptyEditor())

// 四类阈值条件的表单态（随告警类型切换显示其中一组）
const condBreak = reactive<BreakCondition>({ ...(defaultCondition('break') as BreakCondition) })
const condReject = reactive<RejectCondition>({ ...(defaultCondition('reject') as RejectCondition) })
const condDelay = reactive<DelayCondition>({ ...(defaultCondition('delay') as DelayCondition) })
const condField = reactive<FieldCondition>({ ...(defaultCondition('field') as FieldCondition) })

function resetCondition(type: AlertType) {
  const c = defaultCondition(type)
  if (c.type === 'break') Object.assign(condBreak, c)
  else if (c.type === 'reject') Object.assign(condReject, c)
  else if (c.type === 'delay') Object.assign(condDelay, c)
  else Object.assign(condField, c)
}

function fillCondition(c: AlertRuleCondition) {
  if (c.type === 'break') Object.assign(condBreak, c)
  else if (c.type === 'reject') Object.assign(condReject, c)
  else if (c.type === 'delay') Object.assign(condDelay, c)
  else Object.assign(condField, c)
}

/** 选择告警类型时，重置为该类型默认阈值，避免残留其他类型参数 */
function onTypeChange(value: unknown) {
  if (typeof value === 'string') resetCondition(value as AlertType)
}

const isNum = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v)

/** 依据当前类型与表单态组装结构化条件；参数不完整返回 null */
function buildCondition(): AlertRuleCondition | null {
  switch (editor.type) {
    case 'break':
      if (!isNum(condBreak.noDataValue) || condBreak.noDataValue < 1) return null
      return { type: 'break', noDataValue: condBreak.noDataValue, noDataUnit: condBreak.noDataUnit }
    case 'reject':
      if (!isNum(condReject.windowHours) || condReject.windowHours < 1) return null
      if (!isNum(condReject.ratePercent) || condReject.ratePercent < 0 || condReject.ratePercent > 100) return null
      if (!isNum(condReject.minVolume) || condReject.minVolume < 0) return null
      return { type: 'reject', ...condReject }
    case 'delay':
      if (!isNum(condDelay.minutes) || condDelay.minutes < 1) return null
      return { type: 'delay', metric: condDelay.metric, minutes: condDelay.minutes }
    case 'field':
      if (!condField.fieldKey.trim()) return null
      if (!isNum(condField.missingRatePercent) || condField.missingRatePercent < 0 || condField.missingRatePercent > 100) return null
      return { type: 'field', fieldKey: condField.fieldKey.trim(), missingRatePercent: condField.missingRatePercent }
    default:
      return null
  }
}

const thresholdPreview = computed(() => {
  const c = buildCondition()
  return c ? describeCondition(c) : ''
})

/** 口径预览为空时的引导文案 */
const previewEmptyHint = computed(() => {
  if (!editor.type) return '请先选择告警类型'
  if (editor.type === 'field' && !condField.fieldKey.trim()) return '请选择监测字段'
  return '请完善触发阈值参数'
})

const rules = {
  name: [{ required: true, message: '请填写规则名称' }],
  type: [{ required: true, message: '请选择告警类型' }],
  level: [{ required: true, message: '请选择告警级别' }],
}

const columns = [
  { title: '规则名称', dataIndex: 'name', width: 180, ellipsis: true, tooltip: true },
  { title: '告警类型', dataIndex: 'type', slotName: 'type', width: 130 },
  { title: '级别', dataIndex: 'level', slotName: 'level', width: 90 },
  { title: '触发阈值', dataIndex: 'threshold' },
  { title: '状态', dataIndex: 'enabled', slotName: 'enabled', width: 100 },
  { title: '更新时间', dataIndex: 'updatedAt', width: 170 },
  { title: '操作', dataIndex: 'operations', slotName: 'operations', width: 120, fixed: 'right' as const },
]

async function fetchData() {
  loading.value = true
  try {
    data.value = await listAlertRules({ ...form })
  } finally {
    loading.value = false
  }
}

function onReset() {
  form.keyword = ''
  form.type = ''
  form.status = ''
  fetchData()
}

function openCreate() {
  mode.value = 'create'
  Object.assign(editor, emptyEditor())
  ;(['break', 'reject', 'delay', 'field'] as AlertType[]).forEach(resetCondition)
  visible.value = true
  nextTick(() => clearFormValidate(formRef.value))
}

function openEdit(record: AlertRule) {
  mode.value = 'edit'
  Object.assign(editor, {
    id: record.id,
    name: record.name,
    type: record.type,
    level: record.level,
    enabled: record.enabled,
  })
  ;(['break', 'reject', 'delay', 'field'] as AlertType[]).forEach(resetCondition)
  fillCondition(record.condition)
  visible.value = true
  nextTick(() => clearFormValidate(formRef.value))
}

async function onSubmit() {
  if (!(await validateForm(formRef.value))) return false
  if (editor.type === 'field' && !condField.fieldKey.trim()) {
    Message.error('请选择监测字段')
    return false
  }
  const condition = buildCondition()
  if (!editor.type || !condition) {
    Message.error('请完善触发阈值参数')
    return false
  }
  try {
    await saveAlertRule({
      id: mode.value === 'edit' ? editor.id : undefined,
      name: editor.name,
      type: editor.type,
      level: editor.level,
      condition,
      enabled: editor.enabled,
    })
    Message.success(mode.value === 'create' ? `新增成功「${editor.name}」` : `保存成功「${editor.name}」`)
    fetchData()
    return true
  } catch (e) {
    Message.error((e as Error).message)
    return false
  }
}

async function onToggle(record: AlertRule, enabled: boolean) {
  togglingId.value = record.id
  const prev = record.enabled
  record.enabled = enabled
  try {
    await toggleAlertRule(record.id, enabled)
    Message.success(enabled ? '规则已启用并下发' : '规则已停用')
  } catch (e) {
    record.enabled = prev
    Message.error((e as Error).message)
  } finally {
    togglingId.value = ''
  }
}

function onDelete(record: AlertRule) {
  Modal.warning({
    title: '删除告警规则',
    content: `确定删除规则「${record.name}」吗？删除后机构端将不再收到该规则触发的告警，此操作不可恢复。`,
    hideCancel: false,
    okText: '删除',
    cancelText: '取消',
    onOk: async () => {
      await deleteAlertRule(record.id)
      Message.success('规则已删除')
      fetchData()
    },
  })
}

onMounted(fetchData)
</script>

<style scoped>
/* 触发阈值：块级容器占满表单项宽度，规避 Arco 内容区 inline-flex 造成的横向挤压 */
.cond-box {
  width: 100%;
}
.cond-stack {
  display: flex;
  flex-direction: column;
}
/* 统一的「标签列 + 控件列」栅格，四类告警共用，保证纵向对齐规整 */
.cond-grid {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  align-items: center;
  column-gap: 12px;
  margin-bottom: 12px;
}
.cond-stack .cond-grid:last-of-type {
  margin-bottom: 0;
}
.cond-label {
  color: var(--color-text-2, #4e5969);
  font-size: 13px;
  line-height: 32px;
  text-align: right;
  white-space: nowrap;
}
.cond-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
/* 断流：数字框与单位下拉强制同一行，禁止换行 */
.cond-controls--inline {
  flex-wrap: nowrap;
  white-space: nowrap;
}
.cond-num {
  width: 110px;
}
.cond-num--wide {
  width: 140px;
}
.cond-unit {
  width: 96px;
}
.cond-select {
  width: 160px;
}
.cond-select--wide {
  width: 260px;
}
.cond-unit-text {
  color: var(--color-text-2, #4e5969);
  font-size: 13px;
  white-space: nowrap;
}
.cond-hint {
  color: var(--color-text-3, #86909c);
  font-size: 12px;
  line-height: 1.5;
  white-space: nowrap;
}
.req-star {
  color: rgb(var(--danger-6));
  margin-right: 4px;
  line-height: 1;
}
/* 行内标签前的必填红星（监测字段） */
.cond-label .cond-req {
  font-style: normal;
  font-size: 13px;
  vertical-align: baseline;
}
.cond-preview {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 4px;
  padding: 8px 12px;
  border-radius: 4px;
  background: var(--color-fill-1);
  color: var(--color-text-2);
  font-size: 12px;
  line-height: 1.6;
}
.cond-preview :deep(svg) {
  margin-top: 3px;
  color: rgb(var(--primary-6));
  flex-shrink: 0;
}
</style>
