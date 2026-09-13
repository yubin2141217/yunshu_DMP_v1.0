<template>
  <div class="page-shell edit-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">{{ pageTitle }}</h2>
        <p class="page-desc">按步骤配置基础信息、推送数据范围与推送方式；提交后方案即可启停运行并查看推送量统计。</p>
      </div>
      <a-space>
        <a-button @click="goBack">返回列表</a-button>
      </a-space>
    </div>

    <a-card class="content-card edit-card" :bordered="false">
      <div class="edit-card-inner">
        <div class="edit-main">
          <div class="edit-center">
            <a-steps :current="step" class="edit-steps">
              <a-step title="基础信息" description="名称 / 接收方 / 状态" />
              <a-step title="选择推送数据" description="来源 / 过滤 / 去重" />
              <a-step title="推送方式" description="通道 / 频次 / 增量全量" />
            </a-steps>

            <a-form ref="formRef" :model="editor" :rules="rules" layout="vertical" class="edit-form">
              <div v-show="step === 1">
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item field="name" required>
                      <template #label>
                        <FormFieldLabel
                          title="方案名称"
                          desc="全局唯一；支持汉字、英文字母、数字、下划线，长度不超过 100"
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
                      <a-switch :model-value="editor.status === 'enabled'" @change="onStatusSwitch" />
                      <span class="switch-text">{{ editor.status === 'enabled' ? '启用' : '停用' }}</span>
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item field="receiverType" required>
                      <template #label>
                        <FormFieldLabel title="接收方" desc="选择推送目标为 MT 机构或第三方接收方机构" />
                      </template>
                      <a-select
                        v-model="editor.receiverType"
                        :options="receiverTypeOptions"
                        placeholder="请选择接收方类型"
                        @change="onReceiverTypeChange"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item field="orgId" required>
                      <template #label>
                        <FormFieldLabel
                          :title="editor.receiverType === 'third' ? '机构（第三方）' : '机构（MT）'"
                          :desc="
                            editor.receiverType === 'third'
                              ? '选项来自「接收方机构」列表'
                              : '选项来自 MT 机构列表'
                          "
                        />
                      </template>
                      <a-select
                        v-model="editor.orgId"
                        :options="orgSelectOptions"
                        allow-search
                        allow-clear
                        :placeholder="editor.receiverType === 'third' ? '请选择第三方接收方机构' : '请选择 MT 机构'"
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
                  <div class="field-with-action">
                    <a-select
                      v-model="selectedStandardId"
                      :options="standardOptions"
                      allow-search
                      allow-clear
                      placeholder="搜索接入方案"
                      style="flex: 1; min-width: 0"
                      @change="onStandardPick"
                    />
                    <a-button type="outline" @click="onPreviewData">预览数据</a-button>
                  </div>
                </a-form-item>

                <a-form-item v-else field="dataSourceId" required>
                  <template #label>
                    <FormFieldLabel title="数据源ID" desc="填写外部数据源标识" />
                  </template>
                  <div class="field-with-action">
                    <a-input
                      v-model="editor.dataSourceId"
                      allow-clear
                      placeholder="请输入数据源 ID"
                      style="flex: 1; min-width: 0"
                    />
                    <a-button type="outline" @click="onPreviewData">预览数据</a-button>
                  </div>
                </a-form-item>

                <div class="push-data-module">
                  <div class="push-data-module__head">
                    <div>
                      <h3 class="push-data-module__title">选择推送数据</h3>
                      <p class="push-data-module__desc">左侧预览样例，右侧配置过滤与去重规则</p>
                    </div>
                  </div>
                  <a-alert type="info" show-icon class="push-data-module__alert">
                    预览最多展示
                    <strong> 100 </strong>
                    条样例数据，所选数据来源目前全量范围数据
                    <strong> {{ estimatedCount.toLocaleString() }} </strong>
                    条，可预览查看并设置数据过滤范围。
                  </a-alert>

                  <div class="push-data-split">
                    <div class="push-data-split__left">
                      <div class="push-data-pane__head">
                        <span class="section-title inline">数据预览</span>
                        <span v-if="previewReady" class="push-data-pane__meta">{{ previewTip }}</span>
                      </div>
                      <a-table
                        v-if="previewReady"
                        :columns="previewColumns"
                        :data="previewRows"
                        :pagination="previewPagination"
                        row-key="_id"
                        :bordered="false"
                        stripe
                        size="small"
                        :scroll="{ x: '100%' }"
                      />
                      <a-empty v-else description="点击上方「预览数据」后在此展示样例" />
                    </div>

                    <div class="push-data-split__right">
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
                              :max="8760"
                              style="width: 110px"
                            />
                            <span class="dedupe-window__text">小时内，按以下字段去重：</span>
                          </div>
                          <a-checkbox-group v-model="editor.dedupeFields" :options="dedupeFieldOptions" />
                        </div>
                      </div>
                    </div>
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
                  <a-row :gutter="16">
                    <a-col :span="12">
                      <a-form-item field="pushMode" required>
                        <template #label>
                          <FormFieldLabel title="推送模式" desc="增量推送上次成功后的新数据；全量按当前快照推送" />
                        </template>
                        <a-radio-group v-model="editor.pushMode">
                          <a-radio value="incremental">增量</a-radio>
                          <a-radio value="full">全量</a-radio>
                        </a-radio-group>
                      </a-form-item>
                    </a-col>
                    <a-col :span="12">
                      <a-form-item field="scheduleType" required>
                        <template #label>
                          <FormFieldLabel title="频次类型" desc="Cron 表达式或固定间隔（分钟）" />
                        </template>
                        <a-radio-group v-model="editor.scheduleType">
                          <a-radio value="cron">Cron</a-radio>
                          <a-radio value="interval">固定间隔</a-radio>
                        </a-radio-group>
                      </a-form-item>
                    </a-col>
                  </a-row>
                  <a-row :gutter="16">
                    <a-col v-if="editor.scheduleType === 'cron'" :span="12">
                      <a-form-item field="cronExpr" required>
                        <template #label>
                          <FormFieldLabel title="Cron 表达式" desc="至少 5 段，如 0 */1 * * *" />
                        </template>
                        <a-input v-model="editor.cronExpr" placeholder="0 */1 * * *" allow-clear />
                      </a-form-item>
                    </a-col>
                    <a-col v-else :span="12">
                      <a-form-item field="intervalMinutes" required>
                        <template #label>
                          <FormFieldLabel title="间隔（分钟）" desc="正整数，如 30" />
                        </template>
                        <a-input-number
                          v-model="editor.intervalMinutes"
                          :min="1"
                          :max="10080"
                          hide-button
                          placeholder="如 30"
                          style="width: 100%"
                        />
                      </a-form-item>
                    </a-col>
                    <a-col :span="12">
                      <a-form-item field="batchLimit" required>
                        <template #label>
                          <FormFieldLabel title="批量条数上限" desc="单次推送最大条数" />
                        </template>
                        <a-input-number
                          v-model="editor.batchLimit"
                          :min="1"
                          :max="100000"
                          hide-button
                          placeholder="如 500"
                          style="width: 100%"
                        />
                      </a-form-item>
                    </a-col>
                  </a-row>
                  <p class="strategy-hint">失败重试次数与间隔已在上方「流量 &amp; 限流配置」中统一设置，此处不再重复。</p>
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message, type FormInstance } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import FormFieldLabel from '@/components/FormFieldLabel.vue'
import PushChannelForm from '@/components/PushChannelForm.vue'
import {
  defaultDataConfig,
  emptyFilterRule,
  estimatePushDataCount,
  getPushScheme,
  pushDedupeFieldOptions,
  pushFilterFieldOptions,
  pushFilterLogicOptions,
  pushFilterOpOptions,
  pushOrgOptions,
  pushReceiverOptions,
  pushStandardOptions,
  savePushScheme,
} from '@/api/push'
import {
  emptyHttpConfig,
  emptyMqConfig,
  type PushChannelType,
  type PushDataSourceType,
  type PushFilterLogic,
  type PushFilterOp,
  type PushFilterRule,
  type PushHttpConfig,
  type PushMqConfig,
  type PushMode,
  type PushReceiverType,
  type PushStatus,
  type ScheduleType,
} from '@/mock/push'
import { validateForm } from '@/utils/formValidate'

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()
const saving = ref(false)
const editingId = ref<string | undefined>()
const step = ref(1)
const PREVIEW_MAX = 100
const estimatedCount = ref(0)
const selectedStandardId = ref('')
const previewReady = ref(false)
const previewTip = ref('')
const previewRows = ref<Record<string, string>[]>([])
const previewPagination = {
  pageSize: 10,
  showTotal: true,
  showPageSize: true,
  pageSizeOptions: [10, 20, 50],
}
const previewColumns = [
  { title: '标题', dataIndex: 'title', ellipsis: true, tooltip: true, minWidth: 140 },
  { title: '关键词', dataIndex: 'keyword', width: 100, ellipsis: true, tooltip: true },
  { title: '原文链接', dataIndex: 'url', ellipsis: true, tooltip: true, minWidth: 120 },
  { title: '入库时间', dataIndex: 'accessAt', width: 156 },
]

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
  receiverType: PushReceiverType
  orgId: string
  orgName: string
  dataSourceType: PushDataSourceType
  dataSourceId: string
  standardIds: string[]
  supplierIds: string[]
  filterLogic: PushFilterLogic
  filterRules: PushFilterRule[]
  dedupeEnabled: boolean
  dedupeWindowHours: number
  dedupeFields: string[]
  channelType: PushChannelType
  httpConfig: PushHttpConfig
  mqConfig: PushMqConfig
  pushMode: PushMode
  scheduleType: ScheduleType
  cronExpr: string
  intervalMinutes: number
  batchLimit: number
}

function blankEditor(): Editor {
  const data = defaultDataConfig()
  return {
    name: '',
    status: 'enabled',
    remark: '',
    receiverType: 'mt',
    orgId: '',
    orgName: '',
    dataSourceType: data.dataSourceType,
    dataSourceId: data.dataSourceId,
    standardIds: [],
    supplierIds: [],
    filterLogic: data.filterLogic,
    filterRules: [],
    dedupeEnabled: data.dedupeEnabled,
    dedupeWindowHours: data.dedupeWindowHours,
    dedupeFields: [...data.dedupeFields],
    channelType: 'http',
    httpConfig: emptyHttpConfig(),
    mqConfig: emptyMqConfig(),
    pushMode: 'incremental',
    scheduleType: 'interval',
    cronExpr: '0 * * * *',
    intervalMinutes: 30,
    batchLimit: 500,
  }
}

const editor = reactive<Editor>(blankEditor())
const mtOrgOptions = ref<{ label: string; value: string }[]>([])
const receiverOrgOptions = ref<{ label: string; value: string }[]>([])
const receiverTypeOptions = [
  { label: 'MT机构', value: 'mt' },
  { label: '第三方机构', value: 'third' },
]
const orgSelectOptions = computed(() =>
  editor.receiverType === 'third' ? receiverOrgOptions.value : mtOrgOptions.value,
)

const rules = {
  name: [{ required: true, message: '请填写方案名称' }],
  receiverType: [{ required: true, message: '请选择接收方' }],
  orgId: [{ required: true, message: '请选择机构' }],
  dataSourceType: [{ required: true, message: '请选择数据来源' }],
  dataSourceId: [{ required: true, message: '请填写数据源 ID' }],
  standardIds: [{ required: true, message: '请选择接入方案' }],
  channelType: [{ required: true, message: '请选择推送类型' }],
  pushMode: [{ required: true, message: '请选择推送模式' }],
  scheduleType: [{ required: true, message: '请选择频次类型' }],
  cronExpr: [{ required: true, message: '请填写 Cron' }],
  intervalMinutes: [{ required: true, message: '请填写间隔分钟' }],
  batchLimit: [{ required: true, message: '请填写批量上限' }],
  'httpConfig.endpointUrl': [{ required: true, message: '请填写推送接口地址' }],
  'mqConfig.brokers': [{ required: true, message: '请填写 Broker 地址' }],
  'mqConfig.nameServer': [{ required: true, message: '请填写 NameServer' }],
  'mqConfig.topic': [{ required: true, message: '请填写 Topic' }],
}

function onStatusSwitch(v: string | number | boolean) {
  editor.status = v ? 'enabled' : 'disabled'
}

function onReceiverTypeChange() {
  editor.orgId = ''
  editor.orgName = ''
}

function onReceiverOrgPick(v: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[]) {
  const id = String(v || '')
  editor.orgId = id
  const hit = orgSelectOptions.value.find((o) => o.value === id)
  editor.orgName = hit?.label?.replace(/（[^）]*）$/, '') || hit?.label || id
}

function onDataSourceTypeChange() {
  if (editor.dataSourceType === 'standard') {
    editor.dataSourceId = ''
  } else {
    selectedStandardId.value = ''
    editor.standardIds = []
  }
  previewReady.value = false
  previewRows.value = []
  void refreshEstimate()
}

function onStandardPick(v: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[]) {
  const id = String(v || '')
  selectedStandardId.value = id
  editor.standardIds = id ? [id] : []
  previewReady.value = false
  previewRows.value = []
}

function addFilterRule() {
  editor.filterRules.push(emptyFilterRule())
}

function removeFilterRule(idx: number) {
  editor.filterRules.splice(idx, 1)
}

function onPreviewData() {
  if (editor.dataSourceType === 'standard') {
    if (!selectedStandardId.value) {
      Message.warning('请先选择接入方案')
      return
    }
    const name = standardOptions.value.find((o) => o.value === selectedStandardId.value)?.label || selectedStandardId.value
    previewTip.value = `接入方案「${name}」· 共 ${PREVIEW_MAX} 条样例`
  } else {
    if (!editor.dataSourceId.trim()) {
      Message.warning('请先填写数据源 ID')
      return
    }
    previewTip.value = `数据源「${editor.dataSourceId.trim()}」· 共 ${PREVIEW_MAX} 条样例`
  }
  const seed = editor.dataSourceType === 'standard' ? selectedStandardId.value : editor.dataSourceId.trim()
  previewRows.value = Array.from({ length: PREVIEW_MAX }).map((_, i) => {
    const day = String(((i % 28) + 1)).padStart(2, '0')
    const hour = String(8 + (i % 12)).padStart(2, '0')
    return {
      _id: `pv-${i}`,
      title: `样例标题_${seed}_${i + 1}`,
      keyword: i % 2 === 0 ? '舆情,政策' : '民生',
      url: `https://example.com/news/${1000 + i}`,
      accessAt: `2026-09-${day} ${hour}:12:00`,
    }
  })
  previewReady.value = true
  Message.success('已加载预览数据')
}

async function refreshEstimate() {
  estimatedCount.value = await estimatePushDataCount({
    dataSourceType: editor.dataSourceType,
    dataSourceId: editor.dataSourceId,
    orgId: editor.orgId,
    standardIds: editor.standardIds,
    supplierIds: editor.supplierIds,
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
  router.push('/push/schemes')
}

function refreshOptions() {
  standardOptions.value = pushStandardOptions()
  mtOrgOptions.value = pushOrgOptions()
  receiverOrgOptions.value = pushReceiverOptions()
}

async function load() {
  step.value = 1
  const copyFrom = String(route.query.copyFrom || '')
  const id = String(route.params.id || '')
  Object.assign(editor, blankEditor())
  selectedStandardId.value = ''
  editingId.value = undefined
  refreshOptions()

  const sourceId = copyFrom || id
  if (!sourceId) {
    await refreshEstimate()
    return
  }

  try {
    const src = await getPushScheme(sourceId)
    Object.assign(editor, {
      name: copyFrom ? `${src.name}-副本` : src.name,
      status: src.status,
      remark: src.remark,
      receiverType: src.receiverType === 'third' ? 'third' : 'mt',
      orgId: src.orgId,
      orgName: src.orgName,
      dataSourceType: src.dataSourceType || 'standard',
      dataSourceId: src.dataSourceId || '',
      standardIds: [...(src.standardIds || [])],
      supplierIds: [...(src.supplierIds || [])],
      filterLogic: src.filterLogic || 'all',
      filterRules: (src.filterRules || []).map((r) => ({ ...r })),
      dedupeEnabled: src.dedupeEnabled ?? false,
      dedupeWindowHours: src.dedupeWindowHours || 72,
      dedupeFields: [...(src.dedupeFields || ['title'])],
      channelType: src.channelType === 'file' ? 'http' : src.channelType,
      httpConfig: { ...emptyHttpConfig(), ...src.httpConfig },
      mqConfig: { ...emptyMqConfig(), ...src.mqConfig },
      pushMode: src.pushMode,
      scheduleType: src.scheduleType,
      cronExpr: src.cronExpr,
      intervalMinutes: src.intervalMinutes,
      batchLimit: src.batchLimit,
    })
    selectedStandardId.value = editor.standardIds[0] || ''
    if (!copyFrom) editingId.value = src.id
    if (copyFrom) Message.info('已回填原方案配置，请修改方案名称后提交')
    await refreshEstimate()
  } catch (e) {
    Message.error(e instanceof Error ? e.message : '加载失败')
    goBack()
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
  if (editor.dataSourceType === 'datasource') return ['dataSourceType', 'dataSourceId']
  return ['dataSourceType', 'standardIds']
}

async function validateStep2() {
  if (editor.dataSourceType === 'datasource') {
    if (!editor.dataSourceId.trim()) {
      Message.warning('请填写数据源 ID')
      return false
    }
    return true
  }
  if (!selectedStandardId.value && !editor.standardIds.length) {
    Message.warning('请选择接入方案')
    return false
  }
  return true
}

async function onNext() {
  if (step.value === 1) {
    const ok = await validateForm(formRef.value, ['name', 'status', 'receiverType', 'orgId'])
    if (!ok) return
    step.value += 1
    return
  }
  if (step.value === 2) {
    const ok = await validateStep2()
    if (!ok) return
    if (editor.dedupeEnabled && !editor.dedupeFields.length) {
      Message.warning('开启去重时请至少选择一个去重字段')
      return
    }
    step.value += 1
  }
}

function namesByIds(ids: string[], opts: { label: string; value: string }[]) {
  return ids.map((id) => opts.find((o) => o.value === id)?.label || id)
}

async function onSubmit() {
  const strategyFields =
    editor.scheduleType === 'cron'
      ? ['pushMode', 'scheduleType', 'cronExpr', 'batchLimit']
      : ['pushMode', 'scheduleType', 'intervalMinutes', 'batchLimit']
  const okForm = await validateForm(formRef.value, ['name', ...channelStepFields(), ...strategyFields])
  const okData = await validateStep2()
  if (!okForm || !okData) {
    if (!(await validateForm(formRef.value, ['name', 'status', 'receiverType', 'orgId']))) step.value = 1
    else if (!okData) step.value = 2
    else step.value = 3
    return
  }
  if (editor.dedupeEnabled && !editor.dedupeFields.length) {
    Message.warning('开启去重时请至少选择一个去重字段')
    step.value = 2
    return
  }
  saving.value = true
  try {
    if (editor.dataSourceType === 'standard' && selectedStandardId.value) {
      editor.standardIds = [selectedStandardId.value]
    }
    await savePushScheme({
      id: editingId.value,
      name: editor.name,
      status: editor.status,
      remark: editor.remark,
      receiverType: editor.receiverType,
      orgId: editor.orgId,
      orgName: editor.orgName,
      dataSourceType: editor.dataSourceType,
      dataSourceId: editor.dataSourceId,
      standardIds: editor.dataSourceType === 'standard' ? editor.standardIds : [],
      standardNames:
        editor.dataSourceType === 'standard'
          ? namesByIds(editor.standardIds, standardOptions.value)
          : [],
      supplierIds: [],
      supplierNames: [],
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
      scheduleType: editor.scheduleType,
      cronExpr: editor.cronExpr,
      intervalMinutes: editor.intervalMinutes,
      batchLimit: editor.batchLimit,
    })
    Message.success('保存成功')
    goBack()
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

.strategy-hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.5;
}

.switch-text {
  margin-left: 8px;
  color: var(--color-text-3);
  font-size: 13px;
}

.push-data-module {
  margin-top: 8px;
  padding: 16px;
  border: 1px solid var(--color-border-2, #e5e6eb);
  border-radius: 10px;
  background: #fff;
  box-sizing: border-box;
}

.push-data-module__head {
  margin-bottom: 10px;
}

.push-data-module__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}

.push-data-module__desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: #86909c;
}

.push-data-module__alert {
  margin-bottom: 14px;
}

.push-data-split {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.9fr);
  gap: 14px;
  align-items: start;
}

@media (max-width: 1100px) {
  .push-data-split {
    grid-template-columns: 1fr;
  }
}

.push-data-split__left,
.push-data-split__right {
  min-width: 0;
}

.push-data-split__left {
  padding: 12px 14px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  background: #fafbfc;
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

.push-data-split__right .section-block {
  margin-bottom: 12px;
}

.push-data-split__right .section-block:last-child {
  margin-bottom: 0;
}
</style>
