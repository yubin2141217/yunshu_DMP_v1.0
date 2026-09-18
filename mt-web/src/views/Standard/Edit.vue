<template>
  <div class="page-shell edit-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">{{ isEdit ? '编辑接入方案' : '新增接入方案' }}</h2>
        <p class="page-desc">按步骤配置基础信息、字段库与接入方式；提交后自动生成接入文档。</p>
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
              <a-step title="基础信息" description="名称 / 机构 / 供数方" />
              <a-step title="字段库配置" description="勾选送数字段" />
              <a-step title="接入方式" description="选择接入方式及配置信息" />
            </a-steps>

            <a-form ref="formRef" :model="editor" :rules="rules" layout="vertical" class="edit-form" :class="{ 'edit-form--fields': step === 2 }">
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
                        placeholder="如：陕西省网信办-清博接入方案"
                        :max-length="100"
                        show-word-limit
                        allow-clear
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item field="status" required>
                      <template #label>
                        <FormFieldLabel
                          title="状态"
                          desc="开启后方案生效可供接入；停用后暂停接入"
                        />
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
                        <FormFieldLabel title="选择机构" desc="本方案与所选机构一对一绑定" />
                      </template>
                      <a-select
                        v-model="editor.orgId"
                        :options="orgOpts"
                        allow-search
                        placeholder="请选择机构"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item field="supplierId" required>
                      <template #label>
                        <FormFieldLabel title="选择供数方" desc="本方案与所选供数方一对一绑定" />
                      </template>
                      <a-select
                        v-model="editor.supplierId"
                        :options="supplierOpts"
                        allow-search
                        placeholder="请选择供数方"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-form-item>
                  <template #label>
                    <FormFieldLabel
                      title="IP 白名单管控"
                      desc="开启后须在「IP 白名单」维护数据提供厂商的来源 IP（仅启用状态生效），非名单内 IP 推送请求将被拒绝"
                    />
                  </template>
                  <a-switch v-model="editor.requireIpWhitelist" />
                </a-form-item>
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

              <div v-show="step === 2" class="step-fields">
                <a-form-item field="fieldIds" required class="step-fields__item">
                  <template #label>
                    <FormFieldLabel
                      title="字段库配置"
                      desc="从字段库中选择要接入的数据，并且可以配置这些字段和供数方数据的映射关系；如字段库不满足需求，请联系管理员扩充"
                    />
                  </template>
                  <FieldPicker
                    v-model="editor.fieldIds"
                    v-model:field-maps="editor.fieldMaps"
                    v-model:fields="metaFields"
                    hide-json-import
                  />
                </a-form-item>
              </div>

              <div v-show="step === 3" class="step-access">
                <AccessMethodForm
                  v-model:access-method="editor.accessMethod"
                  v-model:api-access="editor.apiAccess"
                  v-model:mq-access="editor.mqAccess"
                  v-model:file-access="editor.fileAccess"
                  @method-change="onAccessMethodChange"
                />

                <a-form-item class="request-example-item" hide-label>
                  <div class="request-example">
                    <div class="request-example__head">
                      <div class="request-example__title-wrap">
                        <span class="request-example__title">请求示例</span>
                        <span class="request-example__tip">按当前接入参数与已选字段生成报文 / 配置示例</span>
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
                      测试「{{ accessMethodLabel(editor.accessMethod) }}」连通性，响应「{{ currentSuccessCode }}」为成功
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
            <a-button v-if="step === 3" @click="onPreviewScheme">方案预览</a-button>
            <a-button v-if="step < 3" type="primary" @click="onNext">下一步</a-button>
            <a-button v-else type="primary" :loading="saving" @click="onSubmit">提交</a-button>
          </a-space>
        </div>
      </div>
    </a-card>

    <a-modal
      v-model:visible="previewVisible"
      title="方案预览"
      :width="900"
      :footer="false"
      unmount-on-close
      modal-class="scheme-preview-modal"
    >
      <div class="doc-stage">
        <article class="doc-sheet">
          <pre class="doc-md">{{ previewMarkdown }}</pre>
        </article>
      </div>
      <div class="doc-actions">
        <a-button type="primary" @click="previewVisible = false">关闭</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message, type FormInstance } from '@arco-design/web-vue'
import FormFieldLabel from '@/components/FormFieldLabel.vue'
import FieldPicker, { type PickerField } from '@/components/FieldPicker.vue'
import AccessMethodForm from '@/components/AccessMethodForm.vue'
import { checkStandardNameExists, checkEndpointUrlExists, getStandard, listStandards, saveStandard, testAccessConnectivity } from '@/api/mt'
import {
  accessMethodLabel,
  buildAccessExample,
  buildApiDocMarkdown,
  emptyApiAccess,
  defaultFileAccess,
  defaultMqAccess,
  normalizeApiAccess,
  normalizeFileAccess,
  normalizeMqAccess,
  successCodeOfAccess,
  type AccessMethodType,
  type ApiAccessConfig,
  type FieldMapItem,
  type FileAccessConfig,
  type MqAccessConfig,
  type Status,
} from '@/mock/mt'
import { validateForm } from '@/utils/formValidate'
import { useUnsavedLeave } from '@/composables/useUnsavedLeave'

const route = useRoute()
const router = useRouter()
const { markPristine, confirmLeave } = useUnsavedLeave(() => editor, '/standard')
const step = ref(1)
const saving = ref(false)
const testing = ref(false)
const testDone = ref(false)
const testOk = ref(false)
const testResponse = ref('')
const formRef = ref<FormInstance>()
const metaFields = ref<PickerField[]>([])
const orgOpts = ref<{ label: string; value: string }[]>([])
const supplierOpts = ref<{ label: string; value: string }[]>([])
const requestExample = ref('')
const previewVisible = ref(false)
const previewMarkdown = ref('')
function onStatusSwitch(val: string | number | boolean) {
  editor.status = val ? 'enabled' : 'disabled'
}

const editor = reactive({
  id: '',
  name: '',
  orgId: '',
  supplierId: '',
  status: 'enabled' as Status,
  requireIpWhitelist: false,
  remark: '',
  fieldIds: [] as string[],
  fieldMaps: [] as FieldMapItem[],
  accessMethod: 'http_post' as AccessMethodType,
  apiAccess: emptyApiAccess() as ApiAccessConfig,
  mqAccess: defaultMqAccess() as MqAccessConfig,
  fileAccess: defaultFileAccess() as FileAccessConfig,
})

function resetEditor() {
  Object.assign(editor, {
    id: '',
    name: '',
    orgId: '',
    supplierId: '',
    status: 'enabled' as Status,
    requireIpWhitelist: false,
    remark: '',
    fieldIds: [] as string[],
    fieldMaps: [] as FieldMapItem[],
    accessMethod: 'http_post' as AccessMethodType,
    apiAccess: emptyApiAccess() as ApiAccessConfig,
    mqAccess: defaultMqAccess() as MqAccessConfig,
    fileAccess: defaultFileAccess() as FileAccessConfig,
  })
  requestExample.value = ''
  testDone.value = false
  testOk.value = false
  testResponse.value = ''
  step.value = 1
}

const isEdit = computed(() => !!editor.id)

const selectedFields = computed(() =>
  editor.fieldIds
    .map((id) => metaFields.value.find((f) => f.id === id))
    .filter(Boolean)
    .map((f) => ({
      name: f!.name,
      description: f!.description,
      dataType: f!.dataType,
      bizCategory: f!.bizCategory,
    })),
)

const currentSuccessCode = computed(() =>
  successCodeOfAccess(editor.accessMethod, editor.apiAccess, editor.mqAccess, editor.fileAccess),
)

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
        checkStandardNameExists(name, editor.id || undefined).then((exists) => {
          if (exists) callback('方案名称已存在，请修改后再提交')
          else callback()
        })
      },
    },
  ],
  status: [{ required: true, message: '请选择状态' }],
  accessMethod: [{ required: true, message: '请选择接入方式' }],
  orgId: [{ required: true, message: '请选择机构' }],
  supplierId: [{ required: true, message: '请选择供数方' }],
  fieldIds: [
    {
      validator: (value: string[], callback: (error?: string) => void) => {
        if (!value?.length) callback('请至少勾选一个字段')
        else callback()
      },
    },
  ],
  'apiAccess.endpointUrl': [
    {
      validator: (value: string, callback: (error?: string) => void) => {
        if (editor.accessMethod === 'http_post' && !value?.trim()) callback('请填写接口地址')
        else callback()
      },
    },
  ],
  'apiAccess.method': [
    {
      validator: (value: string, callback: (error?: string) => void) => {
        if (editor.accessMethod === 'http_post' && !value) callback('请选择请求方法')
        else callback()
      },
    },
  ],
  'apiAccess.authType': [
    {
      validator: (value: string, callback: (error?: string) => void) => {
        if (editor.accessMethod === 'http_post' && !value) callback('请选择鉴权方式')
        else callback()
      },
    },
  ],
  'mqAccess.brokers': [
    {
      validator: (value: string, callback: (error?: string) => void) => {
        if (editor.accessMethod === 'mq' && editor.mqAccess.mqType !== 'rocketmq' && !value?.trim()) {
          callback('请填写接入地址集群')
        } else callback()
      },
    },
  ],
  'mqAccess.nameServer': [
    {
      validator: (value: string, callback: (error?: string) => void) => {
        if (editor.accessMethod === 'mq' && editor.mqAccess.mqType === 'rocketmq' && !value?.trim()) {
          callback('请填写 NameServer 地址')
        } else callback()
      },
    },
  ],
  'mqAccess.topic': [
    {
      validator: (value: string, callback: (error?: string) => void) => {
        if (editor.accessMethod === 'mq' && !value?.trim()) callback('请填写 Topic 名称')
        else callback()
      },
    },
  ],
  'mqAccess.consumerGroup': [
    {
      validator: (value: string, callback: (error?: string) => void) => {
        if (editor.accessMethod === 'mq' && !value?.trim()) callback('请填写消费组名称')
        else callback()
      },
    },
  ],
  'fileAccess.host': [
    {
      validator: (value: string, callback: (error?: string) => void) => {
        if (editor.accessMethod === 'file' && !value?.trim()) callback('请填写服务器地址')
        else callback()
      },
    },
  ],
  'fileAccess.remoteDir': [
    {
      validator: (value: string, callback: (error?: string) => void) => {
        if (editor.accessMethod === 'file' && !value?.trim()) callback('请填写文件目录路径')
        else callback()
      },
    },
  ],
  'fileAccess.fileNamePattern': [
    {
      validator: (value: string, callback: (error?: string) => void) => {
        if (editor.accessMethod === 'file' && !value?.trim()) callback('请填写文件命名匹配规则')
        else callback()
      },
    },
  ],
}

function goBack() {
  confirmLeave()
}

function refreshExample() {
  requestExample.value = buildAccessExample(
    editor.accessMethod,
    editor.apiAccess,
    editor.mqAccess,
    editor.fileAccess,
    selectedFields.value,
  )
}

/** 接入方式切换后重置连通性测试与请求示例状态 */
function onAccessMethodChange() {
  testDone.value = false
  testOk.value = false
  testResponse.value = ''
  requestExample.value = ''
}

async function onGenerateExample() {
  const basicFields =
    editor.accessMethod === 'http_post'
      ? [
          'apiAccess.endpointUrl',
          'apiAccess.method',
          'apiAccess.authType',
        ]
      : editor.accessMethod === 'mq'
        ? [
            'mqAccess.brokers',
            'mqAccess.nameServer',
            'mqAccess.topic',
            'mqAccess.consumerGroup',
          ]
        : ['fileAccess.host', 'fileAccess.remoteDir', 'fileAccess.fileNamePattern']

  const ok = await validateForm(formRef.value, basicFields)
  if (!ok) {
    Message.error('请先完善基础信息中的必填项')
    return
  }
  if (
    editor.accessMethod === 'http_post' &&
    editor.apiAccess.authType === 'appkey' &&
    !(editor.apiAccess.authHeaders || []).some((h) => h.enabled !== false && h.name?.trim())
  ) {
    Message.warning('请至少配置一个鉴权 Header')
    return
  }
  if (!editor.fieldIds.length) {
    Message.warning('请先在字段库配置中勾选字段')
    return
  }
  refreshExample()
  Message.success('已生成请求示例')
}

async function onTestConnectivity() {
  testing.value = true
  try {
    const res = await testAccessConnectivity({
      accessMethod: editor.accessMethod,
      apiAccess: editor.apiAccess,
      mqAccess: editor.mqAccess,
      fileAccess: editor.fileAccess,
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

function onPreviewScheme() {
  const orgName = orgOpts.value.find((o) => o.value === editor.orgId)?.label || ''
  previewMarkdown.value = buildApiDocMarkdown({
    name: editor.name.trim() || '未命名接入方案',
    scope: 'org',
    orgName,
    requireIpWhitelist: editor.requireIpWhitelist,
    remark: editor.remark,
    fields: selectedFields.value,
    api: editor.apiAccess,
    accessMethod: editor.accessMethod,
    mq: editor.mqAccess,
    file: editor.fileAccess,
  })
  previewVisible.value = true
}

async function loadOptions() {
  const res = await listStandards({ name: '', status: '', page: 1, pageSize: 1 })
  metaFields.value = res.metadata.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description || m.bizCaliber || '',
    dataType: m.dataType,
    bizCategory: m.bizCategory || '',
  }))
  orgOpts.value = res.orgs
  supplierOpts.value = res.suppliers || []
}

/** FieldPicker 导入新字段后通过 v-model:fields 同步 metaFields；此处仅负责其它下拉选项刷新 */

async function loadDetail() {
  const id = String(route.params.id || '')
  const copyFrom = String(route.query.copyFrom || '')
  if (!id && !copyFrom) {
    resetEditor()
    return
  }
  const item = await getStandard(id || copyFrom)
  if (!item) {
    Message.error('未找到接入方案')
    confirmLeave(true)
    return
  }
  const isCopy = !id && !!copyFrom
  Object.assign(editor, {
    id: isCopy ? '' : item.id,
    name: item.name,
    orgId: item.orgId || '',
    supplierId: item.supplierId || '',
    status: item.status === 'disabled' ? 'disabled' : 'enabled',
    requireIpWhitelist: !!item.requireIpWhitelist,
    remark: item.remark || '',
    fieldIds: [...(item.fieldIds || [])],
    fieldMaps: (item.fieldMaps || []).map((m) => ({ ...m })),
    accessMethod: (item.accessMethod || 'http_post') as AccessMethodType,
    apiAccess: normalizeApiAccess(item.apiAccess),
    mqAccess: normalizeMqAccess(item.mqAccess),
    fileAccess: normalizeFileAccess(item.fileAccess),
  })
  refreshExample()
  testDone.value = false
  testOk.value = false
  testResponse.value = ''
  step.value = 1
  if (isCopy) {
    Message.info('已回填原方案配置，请修改方案名称后提交')
  }
}

watch(
  () => `${String(route.params.id || '')}|${String(route.query.copyFrom || '')}`,
  async () => {
    await loadDetail()
    await nextTick()
    markPristine()
  },
)

async function onNext() {
  const fieldsByStep: Record<number, string[]> = {
    1: ['name', 'status', 'orgId', 'supplierId'],
    2: ['fieldIds'],
  }
  const ok = await validateForm(formRef.value, fieldsByStep[step.value])
  if (!ok) return
  step.value += 1
}

async function onSubmit() {
  if (!(await validateForm(formRef.value))) return
  if (await checkStandardNameExists(editor.name, editor.id || undefined)) {
    Message.error('方案名称已存在，不允许添加同名接入方案')
    return
  }
  // HTTP 接入方式下校验接口地址全局唯一
  if (editor.accessMethod === 'http_post' && editor.apiAccess.endpointUrl) {
    if (await checkEndpointUrlExists(editor.apiAccess.endpointUrl, editor.id || undefined)) {
      Message.error('接口地址已存在，请修改路由部分')
      return
    }
  }
  // AppKey 鉴权至少保留一个启用且有参数名的鉴权 Header
  if (
    editor.accessMethod === 'http_post' &&
    editor.apiAccess.authType === 'appkey' &&
    !(editor.apiAccess.authHeaders || []).some((h) => h.enabled !== false && h.name?.trim())
  ) {
    Message.warning('请至少配置一个鉴权 Header')
    return
  }
  saving.value = true
  try {
    const item = await saveStandard({
      id: editor.id || undefined,
      name: editor.name,
      scope: 'org',
      orgId: editor.orgId,
      supplierId: editor.supplierId,
      status: editor.status,
      requireIpWhitelist: editor.requireIpWhitelist,
      remark: editor.remark,
      fieldIds: editor.fieldIds,
      fieldMaps: editor.fieldMaps,
      accessMethod: editor.accessMethod,
      apiAccess: editor.apiAccess,
      mqAccess: editor.mqAccess,
      fileAccess: editor.fileAccess,
    })
    Message.success('已保存并生成接口文档')
    router.replace({ path: '/standard', query: { preview: item.id } })
  } catch (e) {
    Message.error((e as Error).message)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadOptions()
  await loadDetail()
  await nextTick()
  markPristine()
})
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

.edit-form--fields {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
}

.step-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
}

.step-fields__item {
  flex: 1;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.step-fields__item :deep(.arco-form-item-wrapper-col),
.step-fields__item :deep(.arco-form-item-content-wrapper),
.step-fields__item :deep(.arco-form-item-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100% !important;
  max-width: 100% !important;
  min-height: 0;
}

.step-fields__item :deep(.field-picker) {
  flex: 1;
  width: 100%;
  max-width: 100%;
  height: auto;
  min-height: 280px;
  box-sizing: border-box;
}

.step-access {
  width: 100%;
}

.step-access .request-example-item,
.step-access .conn-test {
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
  line-height: 1.55;
  background: #fff;
}

.doc-stage {
  max-height: min(64vh, 680px);
  overflow: auto;
  padding: 16px 20px;
  background: #f2f3f5;
}

.doc-sheet {
  max-width: 820px;
  margin: 0 auto;
  padding: 28px 32px;
  background: #fff;
  border: 1px solid #e5e6eb;
  box-shadow: 0 8px 24px rgba(29, 33, 41, 0.06);
}

.doc-md {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.65;
  color: #1d2129;
}

.doc-actions {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid #e5e6eb;
  background: #fff;
}
</style>

<style>
.scheme-preview-modal .arco-modal-body {
  padding: 0 !important;
}
</style>
