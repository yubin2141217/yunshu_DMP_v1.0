<template>
  <div class="page-shell edit-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">{{ pageTitle }}</h2>
        <p class="page-desc">按步骤配置基础信息、推送数据范围与推送方式；提交后方案即可启停运行并查看推送量统计。</p>
      </div>
      <a-space>
        <a-button @click="goBack">返回</a-button>
      </a-space>
    </div>

    <a-card class="content-card edit-card" :bordered="false">
      <div class="edit-card-inner">
        <div class="edit-main">
          <div class="edit-center">
            <a-steps :current="step" class="edit-steps">
              <a-step title="基础信息" description="名称 / 机构 / 状态" />
              <a-step title="选择推送数据" description="来源 / 过滤 / 去重" />
              <a-step title="推送方式" description="推送方式 / 鉴权 / 推送策略" />
            </a-steps>

            <a-form ref="formRef" :model="editor" :rules="rules" layout="vertical" class="edit-form">
              <div v-show="step === 1">
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item field="name" required>
                      <template #label>
                        <FormFieldLabel
                          title="方案名称"
                          desc="支持汉字、英文字母、数字、英文连字符“-”，长度不超过 100"
                        />
                      </template>
                      <a-input
                        v-model="editor.name"
                        placeholder="如：机构回推-HTTP标准"
                        :max-length="100"
                        show-word-limit
                        allow-clear
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item field="status" required>
                      <template #label>
                        <FormFieldLabel title="状态" desc="启用后按策略调度推送；停用后不再推送" />
                      </template>
                      <a-switch
                        :model-value="editor.status === 'enabled'"
                        checked-text="开启"
                        unchecked-text="停用"
                        @change="onStatusSwitch"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item field="orgId" required>
                      <template #label>
                        <FormFieldLabel title="机构" desc="推送目标仅支持 MT 机构" />
                      </template>
                      <a-select
                        v-model="editor.orgId"
                        :options="mtOrgOptions"
                        allow-search
                        allow-clear
                        placeholder="请选择 MT 机构"
                        @change="onReceiverOrgPick"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-form-item label="备注">
                  <a-textarea
                    v-model="editor.remark"
                    placeholder="可选补充说明"
                    :auto-size="{ minRows: 5, maxRows: 10 }"
                    :max-length="200"
                    show-word-limit
                  />
                </a-form-item>
              </div>

              <div v-show="step === 2" class="step-data">
                <a-form-item field="dataSourceType" required>
                  <template #label>
                    <FormFieldLabel title="数据来源" desc="选择按接入方案取数，或按外部数据源 ID 取数" />
                  </template>
                  <a-radio-group v-model="editor.dataSourceType" @change="onDataSourceTypeChange">
                    <a-radio value="standard">接入方案</a-radio>
                    <a-radio value="datasource">数据源</a-radio>
                  </a-radio-group>
                </a-form-item>

                <a-form-item
                  v-if="editor.dataSourceType === 'standard'"
                  field="standardIds"
                  required
                >
                  <template #label>
                    <FormFieldLabel title="接入方案" desc="搜索并选择要推送的接入方案" />
                  </template>
                  <a-select
                    v-model="selectedStandardId"
                    :options="standardOptions"
                    allow-search
                    allow-clear
                    placeholder="搜索接入方案"
                    @change="onStandardPick"
                  />
                </a-form-item>

                <div v-else class="datasource-id-row">
                  <a-form-item field="dataSourceId" required>
                    <template #label>
                      <FormFieldLabel title="数据源ID" desc="填写外部数据源标识" />
                    </template>
                    <a-input
                      v-model="editor.dataSourceId"
                      allow-clear
                      placeholder="请输入数据源 ID"
                      @blur="onDataSourceIdBlur"
                      @input="onDataSourceIdInput"
                      @clear="onDataSourceIdClear"
                    />
                  </a-form-item>
                  <a-form-item :class="{ 'is-miss': dataSourceNameMissing }">
                    <template #label>
                      <FormFieldLabel title="数据源名称" desc="根据数据源 ID 自动回显，不可编辑" />
                    </template>
                    <a-input
                      :model-value="echoedDataSourceName"
                      readonly
                      :title="echoedDataSourceName || undefined"
                      placeholder="填写数据源 ID 后自动回显"
                    />
                  </a-form-item>
                </div>

                <a-form-item field="pushFieldIds" required class="push-fields-item">
                  <template #label>
                    <div class="push-fields-label">
                      <FormFieldLabel title="选择推送字段" />
                      <a-button
                        type="outline"
                        size="mini"
                        class="push-fields-refresh"
                        :disabled="!canRefreshFields"
                        :loading="fieldsLoading"
                        @click="onRefreshFields"
                      >
                        刷新
                      </a-button>
                    </div>
                  </template>
                  <div class="section-block push-fields-block">
                    <p class="push-fields-desc">
                      勾选当前接入方案 / 数据源中的具体字段，并在右侧维护接收方所需字段名与类型的关联映射；接收方字段名留空时默认与中台字段一致。
                    </p>
                    <FieldPicker
                      v-model="editor.pushFieldIds"
                      v-model:field-maps="editor.pushFieldMaps"
                      v-model:fields="metaFields"
                      hide-template-panel
                      hide-save-as-template
                      hide-json-import
                      :loading="fieldsLoading"
                      :empty-text="fieldsEmptyText"
                      :group-titles="['云数中台字段', '接收方字段']"
                    />

                    <div class="preview-action">
                      <a-button type="outline" @click="onPreviewData">预览数据</a-button>
                      <span class="preview-action__tip">
                        按当前字段映射展示接收方字段名及样例数据，最多展示前 {{ PREVIEW_MAX }} 条，对于数据源数据仅配置有关键词的数据源可正常预览数据。
                      </span>
                    </div>

                    <div v-if="previewReady" class="preview-pane">
                      <div class="push-data-pane__head">
                        <span class="section-title inline">数据预览</span>
                        <span class="push-data-pane__meta">{{ previewTip }}</span>
                      </div>
                      <a-table
                        :columns="previewColumns"
                        :data="previewRows"
                        :pagination="previewPagination"
                        row-key="_id"
                        :bordered="false"
                        stripe
                        size="small"
                        :scroll="{ x: '100%' }"
                      />
                    </div>
                    <a-empty
                      v-else-if="previewAttempted"
                      description="暂无可预览数据，请先选择推送字段"
                      class="preview-empty"
                    />
                  </div>
                </a-form-item>

                <div class="section-block filter-block">
                  <div class="filter-head">
                    <span class="section-title inline">数据过滤</span>
                  </div>
                  <div class="filter-head filter-head--wrap">
                    <span class="filter-head__text">满足以下</span>
                    <a-select
                      v-model="editor.filterLogic"
                      :options="filterLogicOptions"
                      style="width: 88px"
                      size="small"
                    />
                    <span class="filter-head__text">条件才推送；不添加则不过滤。</span>
                  </div>
                  <div v-for="(rule, idx) in editor.filterRules" :key="rule.id" class="filter-row">
                    <a-select
                      v-model="rule.field"
                      :options="filterFieldOptions"
                      style="width: 100%"
                      placeholder="字段"
                    />
                    <a-select
                      v-model="rule.op"
                      :options="filterOpOptions"
                      style="width: 100%"
                      placeholder="条件"
                    />
                    <a-input
                      v-model="rule.value"
                      allow-clear
                      placeholder="值（多值用逗号分隔）"
                    />
                    <a-button type="text" status="danger" @click="removeFilterRule(idx)">删除</a-button>
                  </div>
                  <a-button type="text" class="add-rule-btn" @click="addFilterRule">
                    <template #icon><IconPlus /></template>
                    添加条件
                  </a-button>
                </div>

                <div class="section-block dedupe-block">
                  <div class="dedupe-head">
                    <span class="section-title inline">数据去重</span>
                    <a-switch v-model="editor.dedupeEnabled" />
                  </div>
                  <div v-if="editor.dedupeEnabled" class="dedupe-body">
                    <div class="dedupe-window">
                      <span class="dedupe-window__label">时间窗</span>
                      <a-input-number
                        v-model="editor.dedupeWindowHours"
                        :min="1"
                        :max="168"
                        style="width: 110px"
                      />
                      <span class="dedupe-window__unit">h</span>
                      <span class="dedupe-window__text">内，按以下字段去重：</span>
                    </div>
                    <p class="dedupe-window__hint">
                      时间窗最大 168h（即 7×24 小时，一周），仅对该时间跨度内接入的重复数据生效。
                    </p>
                    <a-checkbox-group v-model="editor.dedupeFields" :options="dedupeFieldOptions" />
                  </div>
                </div>
              </div>

              <div v-show="step === 3" class="step-method">
                <PushChannelForm
                  v-model:channel-type="editor.channelType"
                  v-model:http-config="editor.httpConfig"
                  v-model:mq-config="editor.mqConfig"
                />

                <div class="section-block strategy-block">
                  <div class="section-title">推送策略</div>
                  <a-form-item field="pushMode" required>
                    <template #label>
                      <FormFieldLabel
                        title="推送模式"
                        desc="增量：实时推送新接入的数据；全量：按所选时间跨度推送该范围内接入的数据快照"
                      />
                    </template>
                    <a-radio-group v-model="editor.pushMode" @change="onPushModeChange">
                      <a-radio value="incremental">增量</a-radio>
                      <a-radio value="full">全量</a-radio>
                    </a-radio-group>
                  </a-form-item>
                  <a-form-item v-if="editor.pushMode === 'full'" field="fullTimeRange" required>
                    <template #label>
                      <FormFieldLabel
                        title="选择时间段"
                        desc="仅推送所选时间跨度内接入的数据"
                      />
                    </template>
                    <a-range-picker
                      v-model="fullTimeRangeModel"
                      show-time
                      format="YYYY-MM-DD HH:mm:ss"
                      value-format="YYYY-MM-DD HH:mm:ss"
                      allow-clear
                      :placeholder="['开始时间', '结束时间']"
                      style="width: 360px"
                    />
                  </a-form-item>
                  <p class="strategy-hint">
                    增量模式下新数据实时推送；全量模式按系统默认调度执行，推送范围以上方所选时间段为准。
                  </p>
                </div>

                <a-form-item class="request-example-item" hide-label>
                  <div class="request-example">
                    <div class="request-example__head">
                      <div class="request-example__title-wrap">
                        <span class="request-example__title">推送示例</span>
                        <span class="request-example__tip">按当前推送方式参数生成报文 / 投递配置示例</span>
                      </div>
                    </div>
                    <div class="request-example__gen-row">
                      <a-button type="outline" size="small" @click="onGenerateExample">
                        保存配置并生成示例
                      </a-button>
                    </div>
                    <a-textarea
                      v-model="requestExample"
                      placeholder="点击「保存配置并生成示例」生成内容"
                      :auto-size="{ minRows: 10, maxRows: 18 }"
                      class="request-example__input"
                    />
                  </div>
                </a-form-item>

                <div class="conn-test">
                  <div class="conn-test__head">
                    <a-button type="primary" :loading="testing" @click="onTestConnectivity">测试</a-button>
                    <span class="conn-test__tip">
                      测试「{{ channelLabel(editor.channelType) }}」连通性，响应「{{ currentSuccessCode }}」为成功
                    </span>
                  </div>
                  <a-alert v-if="testDone" :type="testOk ? 'success' : 'warning'" style="margin-bottom: 10px">
                    {{ testOk ? '连通性测试成功' : '连通性测试未成功，仍可提交保存' }}
                  </a-alert>
                  <a-textarea
                    v-if="testResponse"
                    :model-value="testResponse"
                    readonly
                    :auto-size="{ minRows: 6, maxRows: 14 }"
                    class="conn-test__response"
                  />
                </div>
              </div>
            </a-form>
          </div>
        </div>

        <div class="edit-actions">
          <a-space>
            <a-button v-if="step > 1" @click="step -= 1">上一步</a-button>
            <a-button v-if="step < 3" type="primary" @click="onNext">下一步</a-button>
            <a-button v-else type="primary" :loading="saving" @click="onSubmit">提交</a-button>
          </a-space>
        </div>
      </div>
    </a-card>

  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Message, type FormInstance } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import FormFieldLabel from '@/components/FormFieldLabel.vue'
import FieldPicker, { type PickerField } from '@/components/FieldPicker.vue'
import PushChannelForm from '@/components/PushChannelForm.vue'
import {
  buildPushExample,
  channelLabel,
  defaultDataConfig,
  emptyFilterRule,
  estimatePushDataCount,
  getPushScheme,
  listPushSourceFields,
  lookupDataSourceName,
  DATA_SOURCE_NOT_FOUND_TEXT,
  exampleDataSourceName,
  pushDedupeFieldOptions,
  pushFilterFieldOptions,
  pushFilterLogicOptions,
  pushFilterOpOptions,
  pushOrgOptions,
  pushStandardOptions,
  savePushScheme,
  successCodeOfPush,
  testPushConnectivity,
} from '@/api/push'
import {
  emptyHttpConfig,
  emptyMqConfig,
  normalizeHttpConfig,
  type PushChannelType,
  type PushDataSourceType,
  type PushFilterLogic,
  type PushFilterOp,
  type PushFilterRule,
  type PushHttpConfig,
  type PushMqConfig,
  type PushMode,
  type PushStatus,
} from '@/mock/push'
import { normalizeFieldMaps, type FieldMapItem } from '@/mock/mt'
import { validateForm } from '@/utils/formValidate'
import { useUnsavedLeave } from '@/composables/useUnsavedLeave'

const route = useRoute()
const { markPristine, confirmLeave } = useUnsavedLeave(() => editor, '/push/schemes')
const formRef = ref<FormInstance>()
const saving = ref(false)
const editingId = ref<string | undefined>()
const step = ref(1)
const requestExample = ref('')
const testing = ref(false)
const testDone = ref(false)
const testOk = ref(false)
const testResponse = ref('')
const PREVIEW_MAX = 100
const estimatedCount = ref(0)
const selectedStandardId = ref('')
const previewReady = ref(false)
const previewAttempted = ref(false)
const previewTip = ref('')
const previewRows = ref<Record<string, string>[]>([])
const previewPagination = {
  pageSize: 10,
  showTotal: true,
  showPageSize: true,
  pageSizeOptions: [10, 20, 50],
}

/** 当前数据来源包含的可推送字段（选择接入方案 / 数据源 ID 后才加载，默认空） */
const metaFields = ref<PickerField[]>([])
/** 字段列表加载中 */
const fieldsLoading = ref(false)
/** 当前是否已选定有效数据来源（决定字段列表与刷新按钮是否可用） */
const sourceReady = computed(() => {
  if (editor.dataSourceType === 'standard') return !!selectedStandardId.value
  return !!editor.dataSourceId.trim() && !!exampleDataSourceName(editor.dataSourceId)
})
/** 字段空态文案：未选来源时引导先选来源，已选但无字段时提示 */
const fieldsEmptyText = computed(() =>
  sourceReady.value ? '该数据来源暂无可推送字段' : '请先选择接入方案或填写数据源 ID',
)
const canRefreshFields = computed(() => sourceReady.value && !fieldsLoading.value)

/**
 * 预览列快照：仅在点击「预览数据」时按当时的字段映射生成；
 * 后续字段勾选 / 映射变化不会自动刷新预览，需再次点击按钮。
 */
const previewColumns = ref<
  { title: string; dataIndex: string; ellipsis: boolean; tooltip: boolean; minWidth: number }[]
>([])

/** 当前已选推送字段的解析结果（中台字段 → 接收方字段） */
const selectedReceiverColumns = computed(() => {
  const mapById = new Map(editor.pushFieldMaps.map((m) => [m.fieldId, m]))
  return editor.pushFieldIds
    .map((id) => {
      const field = metaFields.value.find((f) => f.id === id)
      if (!field) return null
      const map = mapById.get(id)
      const receiverName = map?.supplierFieldName?.trim() || field.name
      return {
        fieldId: id,
        platformName: field.name,
        title: receiverName,
        key: `f_${id}`,
      }
    })
    .filter((x): x is { fieldId: string; platformName: string; title: string; key: string } => x !== null)
})

const standardOptions = ref<{ label: string; value: string }[]>([])
const filterFieldOptions = pushFilterFieldOptions
const filterOpOptions = pushFilterOpOptions
const filterLogicOptions = pushFilterLogicOptions
const dedupeFieldOptions = pushDedupeFieldOptions

const isEdit = computed(() => Boolean(route.params.id) && route.query.copyFrom == null)
const pageTitle = computed(() => {
  if (route.query.copyFrom) return '复制新增推送方案'
  if (isEdit.value) return '编辑推送方案'
  return '新增推送方案'
})

type Editor = {
  name: string
  status: PushStatus
  remark: string
  orgId: string
  orgName: string
  dataSourceType: PushDataSourceType
  dataSourceId: string
  standardIds: string[]
  /** 选择推送字段：中台字段库 id 列表 */
  pushFieldIds: string[]
  /** 中台字段 → 接收方字段映射 */
  pushFieldMaps: FieldMapItem[]
  filterLogic: PushFilterLogic
  filterRules: PushFilterRule[]
  dedupeEnabled: boolean
  dedupeWindowHours: number
  dedupeFields: string[]
  channelType: PushChannelType
  httpConfig: PushHttpConfig
  mqConfig: PushMqConfig
  pushMode: PushMode
  /** 全量推送时选择的接入数据时间跨度 */
  fullTimeRange: [string, string] | []
}

function blankEditor(): Editor {
  const data = defaultDataConfig()
  return {
    name: '',
    status: 'enabled',
    remark: '',
    orgId: '',
    orgName: '',
    dataSourceType: data.dataSourceType,
    dataSourceId: data.dataSourceId,
    standardIds: [],
    pushFieldIds: [],
    pushFieldMaps: [],
    filterLogic: data.filterLogic,
    filterRules: [],
    dedupeEnabled: data.dedupeEnabled,
    dedupeWindowHours: Math.min(data.dedupeWindowHours, 168),
    dedupeFields: [...data.dedupeFields],
    channelType: 'http',
    httpConfig: emptyHttpConfig(),
    mqConfig: emptyMqConfig(),
    pushMode: 'incremental',
    fullTimeRange: [],
  }
}

const editor = reactive<Editor>(blankEditor())

/** 全量时间段选择器的双向绑定（a-range-picker 值为 [开始, 结束] 或空） */
const fullTimeRangeModel = computed<[string, string] | []>({
  get: () => editor.fullTimeRange,
  set: (val) => {
    editor.fullTimeRange = Array.isArray(val) && val.length === 2 ? ([val[0], val[1]] as [string, string]) : []
  },
})
const echoedDataSourceName = ref('')
const dataSourceNameMissing = computed(
  () => echoedDataSourceName.value === DATA_SOURCE_NOT_FOUND_TEXT,
)
const currentSuccessCode = computed(() => successCodeOfPush(editor.channelType, editor.httpConfig))
const mtOrgOptions = ref<{ label: string; value: string }[]>([])

const NAME_PATTERN = /^[\u4e00-\u9fa5a-zA-Z0-9-]+$/

const rules = {
  name: [
    { required: true, message: '请填写方案名称' },
    {
      validator: (value: string, callback: (error?: string) => void) => {
        const name = String(value || '').trim()
        if (!name) {
          callback()
          return
        }
        if (name.length > 100) {
          callback('方案名称长度不能超过 100')
          return
        }
        if (!NAME_PATTERN.test(name)) {
          callback('仅支持汉字、英文字母、数字、英文连字符“-”')
          return
        }
        callback()
      },
    },
  ],
  orgId: [{ required: true, message: '请选择机构' }],
  dataSourceType: [{ required: true, message: '请选择数据来源' }],
  dataSourceId: [{ required: true, message: '请填写数据源 ID' }],
  standardIds: [{ required: true, message: '请选择接入方案' }],
  pushFieldIds: [
    {
      validator: (value: string[], callback: (error?: string) => void) => {
        if (!value?.length) callback('请至少选择一个推送字段')
        else callback()
      },
    },
  ],
  fullTimeRange: [
    {
      validator: (value: string[] | undefined, callback: (error?: string) => void) => {
        if (editor.pushMode === 'full' && (!Array.isArray(value) || value.length !== 2 || !value[0] || !value[1])) {
          callback('全量推送请选择推送时间段')
        } else {
          callback()
        }
      },
    },
  ],
  channelType: [{ required: true, message: '请选择推送方式' }],
  pushMode: [{ required: true, message: '请选择推送模式' }],
  'httpConfig.endpointUrl': [{ required: true, message: '请填写推送接口地址' }],
  'mqConfig.brokers': [{ required: true, message: '请填写 Broker 地址' }],
  'mqConfig.nameServer': [{ required: true, message: '请填写 NameServer' }],
  'mqConfig.topic': [{ required: true, message: '请填写 Topic' }],
}

function onStatusSwitch(v: string | number | boolean) {
  editor.status = v ? 'enabled' : 'disabled'
}

function onPushModeChange() {
  if (editor.pushMode !== 'full') {
    editor.fullTimeRange = []
  }
}

function onReceiverOrgPick(v: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[]) {
  const id = String(v || '')
  editor.orgId = id
  const hit = mtOrgOptions.value.find((o) => o.value === id)
  editor.orgName = hit?.label?.replace(/（[^）]*）$/, '') || hit?.label || id
}

function onDataSourceTypeChange() {
  if (editor.dataSourceType === 'standard') {
    editor.dataSourceId = ''
  } else {
    selectedStandardId.value = ''
    editor.standardIds = []
  }
  echoedDataSourceName.value = ''
  // 切换数据来源类型，字段列表恢复空态
  clearSourceFields()
  void refreshEstimate()
}

function syncEchoedDataSourceName() {
  echoedDataSourceName.value =
    editor.dataSourceType === 'datasource' ? lookupDataSourceName(editor.dataSourceId) : ''
}

function onDataSourceIdBlur() {
  syncEchoedDataSourceName()
  // 数据源 ID 填写完成（失焦）后，按该数据源加载其包含的字段
  void loadSourceFields()
}

function onDataSourceIdInput(val?: string | Event) {
  formRef.value?.clearValidate('dataSourceId')
  const text = typeof val === 'string' ? val : String(editor.dataSourceId || '')
  if (!text.trim()) {
    echoedDataSourceName.value = ''
    clearSourceFields()
  }
}

function onDataSourceIdClear() {
  echoedDataSourceName.value = ''
  formRef.value?.clearValidate('dataSourceId')
  clearSourceFields()
}

function onStandardPick(v: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[]) {
  const id = String(v || '')
  selectedStandardId.value = id
  editor.standardIds = id ? [id] : []
  // 选择接入方案后，加载该方案中包含的具体字段
  void loadSourceFields()
}

function addFilterRule() {
  editor.filterRules.push(emptyFilterRule())
}

function removeFilterRule(idx: number) {
  editor.filterRules.splice(idx, 1)
}

function resetPreview() {
  previewReady.value = false
  previewAttempted.value = false
  previewRows.value = []
  previewColumns.value = []
  previewTip.value = ''
}

/** 依据中台字段名生成可辨识的样例值 */
function sampleCell(platformName: string, index: number, seed: string): string {
  const key = platformName.toLowerCase()
  const day = String((index % 28) + 1).padStart(2, '0')
  const hour = String(8 + (index % 12)).padStart(2, '0')
  if (key.includes('url') || key.includes('链接')) return `https://example.com/news/${1000 + index}`
  if (key.includes('time') || key.includes('date') || key.includes('时间') || key.includes('日期')) {
    return `2026-09-${day} ${hour}:12:00`
  }
  if (key.includes('title') || key.includes('标题')) return `样例标题_${seed}_${index + 1}`
  if (key.includes('keyword') || key.includes('词')) return index % 2 === 0 ? '舆情,政策' : '民生'
  if (key.includes('phone') || key.includes('手机')) return `138${String(10000000 + index).padStart(8, '0')}`
  if (key.includes('name') || key.includes('姓名') || key.includes('作者')) return `样例_${index + 1}`
  return `${platformName}_${index + 1}`
}

function validatePreviewSource(): string | null {
  if (editor.dataSourceType === 'standard') {
    if (!selectedStandardId.value) {
      Message.warning('请先选择接入方案')
      return null
    }
    return standardOptions.value.find((o) => o.value === selectedStandardId.value)?.label || selectedStandardId.value
  }
  if (!editor.dataSourceId.trim()) {
    Message.warning('请先填写数据源 ID')
    return null
  }
  syncEchoedDataSourceName()
  return exampleDataSourceName(editor.dataSourceId) || editor.dataSourceId.trim()
}

function onPreviewData() {
  const sourceName = validatePreviewSource()
  if (sourceName == null) return
  previewAttempted.value = true
  // 点击时按当前字段勾选 / 映射生成列快照，后续字段列表变化不影响已展示的预览
  const columns = selectedReceiverColumns.value
  if (!columns.length) {
    previewReady.value = false
    previewRows.value = []
    previewColumns.value = []
    previewTip.value = ''
    Message.warning('请先选择推送字段')
    return
  }
  previewColumns.value = columns.map((c) => ({
    title: c.title,
    dataIndex: c.key,
    ellipsis: true,
    tooltip: true,
    minWidth: 140,
  }))
  const seed = editor.dataSourceType === 'standard' ? selectedStandardId.value : editor.dataSourceId.trim()
  previewRows.value = Array.from({ length: PREVIEW_MAX }).map((_, i) => {
    const row: Record<string, string> = { _id: `pv-${i}` }
    columns.forEach((col) => {
      row[col.key] = sampleCell(col.platformName, i, seed)
    })
    return row
  })
  previewTip.value = `${editor.dataSourceType === 'standard' ? '接入方案' : '数据源'}「${sourceName}」· 共 ${PREVIEW_MAX} 条样例`
  previewReady.value = true
  Message.success('已加载预览数据')
}

// 注意：字段勾选 / 映射变化不再自动刷新预览，预览列与数据仅在点击「预览数据」时按当时快照生成；
// 切换数据来源 / 刷新字段会经 loadSourceFields → resetPreview 主动清空预览。

async function refreshEstimate() {
  estimatedCount.value = await estimatePushDataCount({
    dataSourceType: editor.dataSourceType,
    dataSourceId: editor.dataSourceId,
    orgId: editor.orgId,
    standardIds: editor.standardIds,
  })
}

watch(
  () =>
    [
      editor.dataSourceType,
      editor.dataSourceId,
      editor.orgId,
      editor.standardIds.slice(),
      editor.filterRules.length,
      editor.dedupeEnabled,
    ] as const,
  () => {
    void refreshEstimate()
  },
)

function goBack() {
  confirmLeave()
}

function clearExampleAndTest() {
  requestExample.value = ''
  testDone.value = false
  testOk.value = false
  testResponse.value = ''
}

function refreshExample() {
  requestExample.value = buildPushExample(editor.channelType, editor.httpConfig, editor.mqConfig)
}

async function onGenerateExample() {
  const basicFields =
    editor.channelType === 'mq'
      ? [
          editor.mqConfig.mqType === 'rocketmq' ? 'mqConfig.nameServer' : 'mqConfig.brokers',
          'mqConfig.topic',
        ]
      : ['httpConfig.endpointUrl', 'httpConfig.method', 'httpConfig.authType']

  const ok = await validateForm(formRef.value, basicFields)
  if (!ok) {
    Message.error('请先完善推送方式中的必填项')
    return
  }
  if (!editor.pushFieldIds.length) {
    Message.warning('请先在选择推送数据中勾选推送字段')
    return
  }
  refreshExample()
  Message.success('已生成推送示例')
}

async function onTestConnectivity() {
  testing.value = true
  try {
    const res = await testPushConnectivity({
      channelType: editor.channelType,
      httpConfig: editor.httpConfig,
      mqConfig: editor.mqConfig,
    })
    testDone.value = true
    testOk.value = res.ok
    testResponse.value = res.responseText
    if (res.ok) Message.success('连通性测试成功')
    else Message.warning('连通性测试未成功，仍可提交保存')
  } catch (e) {
    testDone.value = true
    testOk.value = false
    testResponse.value = String((e as Error).message || e)
    Message.warning('连通性测试未成功，仍可提交保存')
  } finally {
    testing.value = false
  }
}

async function refreshOptions() {
  standardOptions.value = pushStandardOptions()
  mtOrgOptions.value = pushOrgOptions()
}

/** 将后端元数据转换为 FieldPicker 所需结构 */
function toPickerFields(list: Awaited<ReturnType<typeof listPushSourceFields>>): PickerField[] {
  return list.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description || m.bizCaliber || '',
    dataType: m.dataType,
    bizCategory: m.bizCategory || '',
  }))
}

/** 当前数据来源参数 */
function currentSourceParams() {
  return {
    dataSourceType: editor.dataSourceType,
    dataSourceId: editor.dataSourceId.trim(),
    standardId: selectedStandardId.value,
  }
}

/** 清空已加载字段及相关的已选 / 映射 / 预览 */
function clearSourceFields() {
  metaFields.value = []
  editor.pushFieldIds = []
  editor.pushFieldMaps = []
  resetPreview()
}

/** 按当前接入方案 / 数据源 ID 加载其包含的具体字段；未选来源时不加载（空态） */
async function loadSourceFields(options: { silent?: boolean } = {}) {
  if (!sourceReady.value) {
    clearSourceFields()
    return
  }
  fieldsLoading.value = true
  try {
    const list = await listPushSourceFields(currentSourceParams())
    const next = toPickerFields(list)
    const validIds = new Set(next.map((f) => f.id))
    metaFields.value = next
    // 剔除已选字段中不属于当前来源的项，避免脏数据
    editor.pushFieldIds = editor.pushFieldIds.filter((id) => validIds.has(id))
    editor.pushFieldMaps = resolveFieldMaps(editor.pushFieldIds, editor.pushFieldMaps)
    resetPreview()
  } catch (e) {
    metaFields.value = []
    if (!options.silent) Message.error(e instanceof Error ? e.message : '字段加载失败')
  } finally {
    fieldsLoading.value = false
  }
}

/** 点击刷新按钮：重新拉取当前数据来源字段 */
function onRefreshFields() {
  void loadSourceFields()
}

/** 依据中台字段库将字段映射归一化为与已选字段一致的列表 */
function resolveFieldMaps(fieldIds: string[], maps: FieldMapItem[]): FieldMapItem[] {
  return normalizeFieldMaps(fieldIds, maps, (fieldId) => {
    const f = metaFields.value.find((x) => x.id === fieldId)
    return f ? { name: f.name, dataType: f.dataType } : null
  })
}

async function load() {
  step.value = 1
  const copyFrom = String(route.query.copyFrom || '')
  const id = String(route.params.id || '')
  Object.assign(editor, blankEditor())
  echoedDataSourceName.value = ''
  selectedStandardId.value = ''
  editingId.value = undefined
  clearExampleAndTest()
  resetPreview()
  await refreshOptions()

  const sourceId = copyFrom || id
  if (!sourceId) {
    await refreshEstimate()
    await nextTick()
    markPristine()
    return
  }

  try {
    const src = await getPushScheme(sourceId)
    const pushFieldIds = Array.isArray(src.pushFieldIds) ? [...src.pushFieldIds] : []
    Object.assign(editor, {
      name: copyFrom ? `${src.name}-副本` : src.name,
      status: src.status,
      remark: src.remark,
      orgId: src.receiverType === 'third' ? '' : src.orgId,
      orgName: src.receiverType === 'third' ? '' : src.orgName,
      dataSourceType: src.dataSourceType || 'standard',
      dataSourceId: src.dataSourceId || '',
      standardIds: [...(src.standardIds || [])],
      pushFieldIds,
      pushFieldMaps: Array.isArray(src.pushFieldMaps) ? [...src.pushFieldMaps] : [],
      filterLogic: src.filterLogic || 'all',
      filterRules: (src.filterRules || []).map((r) => ({ ...r })),
      dedupeEnabled: src.dedupeEnabled ?? false,
      dedupeWindowHours: Math.min(src.dedupeWindowHours || 72, 168),
      dedupeFields: [...(src.dedupeFields || ['title'])],
      channelType: src.channelType === 'file' ? 'http' : src.channelType,
      httpConfig: normalizeHttpConfig(src.httpConfig),
      mqConfig: { ...emptyMqConfig(), ...src.mqConfig },
      pushMode: src.pushMode,
      fullTimeRange:
        Array.isArray(src.fullTimeRange) && src.fullTimeRange.length === 2
          ? ([src.fullTimeRange[0], src.fullTimeRange[1]] as [string, string])
          : [],
    })
    if (src.receiverType === 'third') {
      Message.warning('原方案为第三方接收方，请重新选择 MT 机构')
    }
    selectedStandardId.value = editor.standardIds[0] || ''
    syncEchoedDataSourceName()
    // 回填来源后，按该来源加载字段，并据此归一化已选字段与映射
    await loadSourceFields({ silent: true })
    if (!copyFrom) editingId.value = src.id
    if (copyFrom) Message.info('已回填原方案配置，请修改方案名称后提交')
    await refreshEstimate()
    await nextTick()
    markPristine()
  } catch (e) {
    Message.error(e instanceof Error ? e.message : '加载失败')
    confirmLeave(true)
  }
}

function channelStepFields() {
  if (editor.channelType === 'mq') {
    const addr = editor.mqConfig.mqType === 'rocketmq' ? 'mqConfig.nameServer' : 'mqConfig.brokers'
    return ['channelType', addr, 'mqConfig.topic']
  }
  return ['channelType', 'httpConfig.endpointUrl']
}

function step2Fields() {
  const base =
    editor.dataSourceType === 'datasource'
      ? ['dataSourceType', 'dataSourceId']
      : ['dataSourceType', 'standardIds']
  return [...base, 'pushFieldIds']
}

async function validateStep2() {
  if (editor.dataSourceType === 'datasource') {
    if (!editor.dataSourceId.trim()) {
      Message.warning('请填写数据源 ID')
      return false
    }
  } else if (!selectedStandardId.value && !editor.standardIds.length) {
    Message.warning('请选择接入方案')
    return false
  }
  if (!editor.pushFieldIds.length) {
    Message.warning('请至少选择一个推送字段')
    return false
  }
  if (editor.dedupeEnabled && !editor.dedupeFields.length) {
    Message.warning('开启去重时请至少选择一个去重字段')
    return false
  }
  return true
}

async function onNext() {
  if (step.value === 1) {
    const ok = await validateForm(formRef.value, ['name', 'status', 'orgId'])
    if (!ok) return
    step.value += 1
    return
  }
  if (step.value === 2) {
    const ok = await validateStep2()
    if (!ok) return
    step.value += 1
  }
}

function namesByIds(ids: string[], opts: { label: string; value: string }[]) {
  return ids.map((id) => opts.find((o) => o.value === id)?.label || id)
}

async function onSubmit() {
  // 推送策略仅保留推送模式：增量实时推送，全量按系统默认每日调度（mock 层兜底）
  const strategyFields = editor.pushMode === 'full' ? ['pushMode', 'fullTimeRange'] : ['pushMode']
  const okForm = await validateForm(formRef.value, ['name', ...channelStepFields(), ...strategyFields])
  const okData = await validateStep2()
  if (!okForm || !okData) {
    if (!(await validateForm(formRef.value, ['name', 'status', 'orgId']))) step.value = 1
    else if (!okData) step.value = 2
    else step.value = 3
    return
  }
  if (editor.pushMode === 'full' && (!editor.fullTimeRange.length || !editor.fullTimeRange[0] || !editor.fullTimeRange[1])) {
    Message.warning('全量推送请选择推送时间段')
    step.value = 3
    return
  }
  if (editor.channelType === 'http' && editor.httpConfig.authType === 'appkey') {
    const hasHeader = (editor.httpConfig.authHeaders || []).some(
      (h) => h.enabled !== false && h.name?.trim(),
    )
    if (!hasHeader) {
      Message.warning('请至少配置一个鉴权 Header')
      step.value = 3
      return
    }
  }
  saving.value = true
  try {
    if (editor.dataSourceType === 'standard' && selectedStandardId.value) {
      editor.standardIds = [selectedStandardId.value]
    }
    const pushFieldMaps = resolveFieldMaps(editor.pushFieldIds, editor.pushFieldMaps)
    editor.pushFieldMaps = pushFieldMaps
    // 已从表单移除的调度字段：增量默认实时，全量默认每日 02:00
    const scheduleType = editor.pushMode === 'full' ? 'cron' : 'realtime'
    const cronExpr = editor.pushMode === 'full' ? '0 2 * * *' : '0 * * * *'
    await savePushScheme({
      id: editingId.value,
      name: editor.name,
      status: editor.status,
      remark: editor.remark,
      receiverType: 'mt',
      orgId: editor.orgId,
      orgName: editor.orgName,
      dataSourceType: editor.dataSourceType,
      dataSourceId: editor.dataSourceId,
      dataSourceName: exampleDataSourceName(editor.dataSourceId),
      standardIds: editor.dataSourceType === 'standard' ? editor.standardIds : [],
      standardNames:
        editor.dataSourceType === 'standard'
          ? namesByIds(editor.standardIds, standardOptions.value)
          : [],
      supplierIds: [],
      supplierNames: [],
      pushFieldIds: [...editor.pushFieldIds],
      pushFieldMaps,
      filterLogic: editor.filterLogic,
      filterRules: editor.filterRules.map((r) => ({
        id: r.id,
        field: r.field,
        op: r.op as PushFilterOp,
        value: r.value,
      })),
      dedupeEnabled: editor.dedupeEnabled,
      dedupeWindowHours: editor.dedupeWindowHours,
      dedupeFields: [...editor.dedupeFields],
      channelType: editor.channelType,
      httpConfig: editor.httpConfig,
      mqConfig: editor.mqConfig,
      pushMode: editor.pushMode,
      fullTimeRange: editor.pushMode === 'full' && editor.fullTimeRange.length === 2 ? editor.fullTimeRange : undefined,
      scheduleType,
      cronExpr,
      intervalMinutes: 30,
      batchLimit: 500,
    })
    Message.success(`已保存「${editor.name}」`)
    confirmLeave(true)
  } catch (e) {
    Message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

watch(
  () => `${String(route.params.id || '')}|${String(route.query.copyFrom || '')}`,
  () => {
    void load()
  },
)

watch(
  () => editor.channelType,
  () => {
    clearExampleAndTest()
  },
)

onMounted(load)
</script>

<style scoped>
.edit-main {
  display: flex;
  justify-content: center;
}

.edit-center {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.edit-steps {
  width: 100%;
  max-width: 100%;
  margin-bottom: 28px;
}

.edit-form {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.step-data,
.step-method {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.field-with-action {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.datasource-id-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  column-gap: 16px;
  align-items: start;
  width: 100%;
}

.datasource-id-row :deep(.arco-form-item) {
  margin-bottom: 0;
  width: 100%;
}

.datasource-id-row :deep(.form-field-label__desc) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.datasource-id-row :deep(.arco-input[readonly]) {
  background: var(--color-fill-2, #f2f3f5);
  cursor: default;
}

.datasource-id-row :deep(.arco-form-item.is-miss .arco-input) {
  color: #f53f3f;
}

.section-block {
  margin-bottom: 14px;
  padding: 14px 16px 12px;
  background: #fafbfc;
  border: 1px solid var(--color-border-2, #e5e6eb);
  border-radius: 8px;
  max-width: 100%;
  box-sizing: border-box;
}

.section-title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.4;
}

.section-title.inline {
  margin: 0;
  margin-right: 8px;
}

.filter-head,
.dedupe-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-head__text {
  font-size: 13px;
  color: #4e5969;
}

.filter-head--wrap {
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.filter-row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  margin-bottom: 12px;
  max-width: 100%;
}

.add-rule-btn {
  padding-left: 0;
  color: var(--mt-primary, #165dff);
}

.dedupe-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dedupe-window {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #4e5969;
}

.dedupe-window__label {
  font-weight: 500;
  color: #1d2129;
}

.dedupe-window__unit {
  font-size: 13px;
  color: #4e5969;
}

.dedupe-window__hint {
  margin: 0;
  font-size: 12px;
  color: #86909c;
  line-height: 1.5;
}

.strategy-hint {
  margin: 0 0 4px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.5;
}

.push-fields-item {
  margin-bottom: 16px;
}

.push-fields-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.push-fields-refresh {
  flex: none;
}

.push-fields-block {
  padding: 14px 16px 16px;
}

.push-fields-desc {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-3, #86909c);
}

.preview-action {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 10px;
  margin: 14px 0 4px;
}

.preview-action__tip {
  flex: 1;
  min-width: 240px;
  font-size: 12px;
  line-height: 1.6;
  color: #86909c;
}

.preview-pane {
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  background: #fafbfc;
}

.preview-empty {
  margin-top: 12px;
  padding: 20px 0;
}

.push-data-pane__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.push-data-pane__meta {
  font-size: 12px;
  color: #86909c;
}

.step-method .request-example-item,
.step-method .conn-test {
  width: 100%;
  box-sizing: border-box;
}

.request-example-item {
  margin-bottom: 14px;
}

.request-example-item :deep(.arco-form-item) {
  display: block;
  width: 100%;
}

.request-example-item :deep(.arco-form-item-label-col) {
  display: none !important;
}

.request-example-item :deep(.arco-form-item-wrapper-col),
.request-example-item :deep(.arco-form-item-content-wrapper),
.request-example-item :deep(.arco-form-item-content) {
  display: block;
  flex: none !important;
  width: 100% !important;
  max-width: 100% !important;
}

.request-example {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--color-border-2, #e5e6eb);
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}

.request-example__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-2, #e5e6eb);
  background: #fafbfc;
}

.request-example__gen-row {
  display: flex;
  justify-content: flex-start;
  padding: 10px 12px 0;
}

.request-example__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.request-example__title {
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.4;
}

.request-example__tip {
  font-size: 12px;
  color: #86909c;
  line-height: 1.4;
}

.request-example__input {
  display: block;
  width: 100%;
}

.request-example__input :deep(.arco-textarea-wrapper),
.request-example__input :deep(textarea) {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: #f7f8fa;
}

.request-example__input :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.55;
  padding: 12px 14px;
}

.conn-test {
  width: 100%;
  box-sizing: border-box;
  margin-top: 0;
  padding: 14px 14px 12px;
  border: 1px solid var(--color-border-2, #e5e6eb);
  border-radius: 6px;
  background: #fafbfc;
}

.conn-test__head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.conn-test__tip {
  font-size: 12px;
  color: #86909c;
  line-height: 1.5;
}

.conn-test__response :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  background: #fff;
}
</style>
