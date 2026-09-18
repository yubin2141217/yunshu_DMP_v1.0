<template>
  <div class="push-channel-form">
    <a-form-item field="channelType" required>
      <template #label>
        <FormFieldLabel title="推送方式" desc="中台主动推送的方式，当前仅支持 HTTP 接口推送" />
      </template>
      <a-select
        :model-value="channelType"
        :options="channelOptions"
        style="width: 100%"
        placeholder="请选择"
        @change="onChannelChange"
      />
    </a-form-item>

    <template v-if="channelType === 'http'">
      <div class="section-block">
        <div class="section-title">基础信息</div>
        <a-form-item field="httpConfig.endpointUrl" required>
          <template #label>
            <FormFieldLabel title="推送接口地址" desc="机构接收服务 URL，中台外呼推送至此地址" />
          </template>
          <a-input v-model="httpConfig.endpointUrl" placeholder="请输入，如 https://org.example/api/v1/ingest" />
        </a-form-item>
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :sm="8" :md="6">
            <a-form-item field="httpConfig.method" label="请求方法" required class="field-short">
              <a-select v-model="httpConfig.method" :options="[{ label: 'POST', value: 'POST' }]" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="8" :md="12">
            <a-form-item field="httpConfig.authType" label="鉴权方式" required>
              <a-select v-model="httpConfig.authType" :options="authTypeOptions" />
              <template #extra>
                <span v-if="httpConfig.authType === 'appkey'" class="auth-type-tip">
                  AppKey 系统默认生成 32 位字母数字组合，可手动修改
                </span>
              </template>
            </a-form-item>
          </a-col>
        </a-row>
      </div>

      <div v-if="httpConfig.authType === 'appkey'" class="section-block auth-headers-block">
        <div class="auth-headers-head">
          <div class="section-title">鉴权 Header</div>
          <a-button type="outline" size="small" @click="addAuthHeader">
            <template #icon><IconPlus /></template>
            添加鉴权 Header
          </a-button>
        </div>
        <p class="auth-headers-desc">以键值对列表配置请求头，推送时将随报文一并发送给接收方。</p>
        <a-table
          :data="authHeaderRows"
          :columns="authHeaderColumns"
          :pagination="false"
          :bordered="{ cell: true }"
          size="small"
          row-key="_idx"
          class="auth-headers-table"
        >
          <template #enabled="{ record }">
            <a-checkbox :model-value="record.enabled !== false" @change="(v: boolean | (string | number | boolean)[]) => toggleAuthHeader(record._idx, !!v)" />
          </template>
          <template #name="{ record }">
            <a-input
              :model-value="record.name"
              size="small"
              placeholder="参数名，如 X-App-Key"
              allow-clear
              @update:model-value="(v: string) => patchAuthHeader(record._idx, { name: v })"
            />
          </template>
          <template #value="{ record }">
            <a-input
              :model-value="record.value"
              size="small"
              placeholder="参数值"
              allow-clear
              @update:model-value="(v: string) => patchAuthHeader(record._idx, { value: v })"
            />
          </template>
          <template #remark="{ record }">
            <a-input
              :model-value="record.remark"
              size="small"
              placeholder="说明（可选）"
              allow-clear
              @update:model-value="(v: string) => patchAuthHeader(record._idx, { remark: v })"
            />
          </template>
          <template #op="{ record }">
            <a-button type="text" status="danger" size="small" @click="removeAuthHeader(record._idx)">
              删除
            </a-button>
          </template>
        </a-table>
      </div>

      <div class="section-block">
        <div class="section-title">重试配置</div>
        <a-row :gutter="[16, 0]">
          <a-col :xs="12" :sm="6">
            <a-form-item field="httpConfig.retry" class="field-short">
              <template #label>
                <FormFieldLabel title="重试次数" desc="失败后自动重试，0 表示不重试" />
              </template>
              <a-input-number v-model="httpConfig.retry" :min="0" :max="10" hide-button placeholder="如 3" />
            </a-form-item>
          </a-col>
          <a-col :xs="12" :sm="6">
            <a-form-item field="httpConfig.retryIntervalMs" class="field-short">
              <template #label>
                <FormFieldLabel title="重试间隔（ms）" desc="两次重试间隔" />
              </template>
              <a-input-number
                v-model="httpConfig.retryIntervalMs"
                :min="0"
                :max="60000"
                hide-button
                placeholder="如 1000"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </div>
    </template>

    <template v-else-if="channelType === 'mq'">
      <a-alert type="warning" class="mq-disabled-tip">
        消息队列推送当前已停止新建，以下仅为历史方案配置，如需调整请改用 HTTP 推送方式新建方案。
      </a-alert>
      <div class="section-block">
        <div class="section-title">投递配置</div>
        <a-form-item field="mqConfig.mqType" label="消息队列种类" required>
          <a-radio-group v-model="mqConfig.mqType" type="button">
            <a-radio value="kafka">Kafka</a-radio>
            <a-radio value="bmq">BMQ</a-radio>
            <a-radio value="rocketmq">RocketMQ</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item
          :field="mqConfig.mqType === 'rocketmq' ? 'mqConfig.nameServer' : 'mqConfig.brokers'"
          :label="mqConfig.mqType === 'rocketmq' ? 'NameServer 地址' : 'Broker 地址集群'"
          required
        >
          <a-input
            v-if="mqConfig.mqType === 'rocketmq'"
            v-model="mqConfig.nameServer"
            placeholder="NameServer 地址，多个用逗号分隔"
          />
          <a-input v-else v-model="mqConfig.brokers" placeholder="支持多个地址，逗号分隔" />
        </a-form-item>
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :sm="12">
            <a-form-item field="mqConfig.topic" label="Topic / Queue" required>
              <a-input v-model="mqConfig.topic" placeholder="Topic" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12">
            <a-form-item field="mqConfig.authType" label="鉴权方式">
              <a-select
                v-model="mqConfig.authType"
                :options="[
                  { label: '无', value: 'none' },
                  { label: 'SASL 账号密码', value: 'sasl' },
                  { label: 'SSL 证书', value: 'ssl' },
                ]"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row v-if="mqConfig.authType === 'sasl'" :gutter="[16, 0]">
          <a-col :xs="24" :sm="12">
            <a-form-item field="mqConfig.username" label="用户名">
              <a-input v-model="mqConfig.username" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12">
            <a-form-item field="mqConfig.password" label="密码">
              <a-input-password v-model="mqConfig.password" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item v-if="mqConfig.authType === 'ssl'" field="mqConfig.certPath" label="证书路径">
          <a-input v-model="mqConfig.certPath" placeholder="证书文件路径" />
        </a-form-item>
      </div>

      <div class="section-block">
        <div class="section-title">流量 &amp; 限流配置</div>
        <a-row :gutter="[16, 0]">
          <a-col :xs="12" :sm="8" :md="6">
            <a-form-item field="mqConfig.retry" class="field-short">
              <template #label>
                <FormFieldLabel title="重试次数" desc="投递失败后重试，0 表示不重试" />
              </template>
              <a-input-number v-model="mqConfig.retry" :min="0" :max="10" hide-button placeholder="如 3" />
            </a-form-item>
          </a-col>
          <a-col :xs="12" :sm="8" :md="6">
            <a-form-item field="mqConfig.retryIntervalMs" class="field-short">
              <template #label>
                <FormFieldLabel title="重试间隔（ms）" desc="两次重试间隔" />
              </template>
              <a-input-number
                v-model="mqConfig.retryIntervalMs"
                :min="0"
                :max="60000"
                hide-button
                placeholder="如 1000"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import FormFieldLabel from '@/components/FormFieldLabel.vue'
import {
  pushChannelOptions,
  defaultAppKeyAuthHeader,
  type PushAuthHeader,
  type PushChannelType,
  type PushHttpConfig,
  type PushMqConfig,
} from '@/mock/push'

const channelType = defineModel<PushChannelType>('channelType', { required: true })
const httpConfig = defineModel<PushHttpConfig>('httpConfig', { required: true })
const mqConfig = defineModel<PushMqConfig>('mqConfig', { required: true })

const channelOptions = pushChannelOptions

const authHeaderColumns = [
  { title: '', slotName: 'enabled', width: 48, align: 'center' as const },
  { title: '参数名', slotName: 'name' },
  { title: '参数值', slotName: 'value' },
  { title: '说明', slotName: 'remark', width: 200 },
  { title: '', slotName: 'op', width: 72, align: 'center' as const },
]

/** 鉴权方式只保留无鉴权 / AppKey；历史 Token 方案回显时以禁用项展示 */
const authTypeOptions = computed(() => {
  const opts: { label: string; value: string; disabled?: boolean }[] = [
    { label: '无鉴权', value: 'none' },
    { label: 'AppKey', value: 'appkey' },
  ]
  if (httpConfig.value.authType === 'token') {
    opts.push({ label: 'Token（历史方案）', value: 'token', disabled: true })
  }
  return opts
})

/** 表格视图行：为每行附加索引作为 row-key 与编辑定位，不写回数据模型 */
type AuthHeaderViewRow = PushAuthHeader & { _idx: number }
const authHeaderRows = computed<AuthHeaderViewRow[]>(() =>
  (httpConfig.value.authHeaders || []).map((h, i) => ({ ...h, _idx: i })),
)

function addAuthHeader() {
  if (!Array.isArray(httpConfig.value.authHeaders)) httpConfig.value.authHeaders = []
  httpConfig.value.authHeaders.push({ enabled: true, name: '', value: '', remark: '' })
}

/** 选中 AppKey 鉴权时默认填充一行：参数名 AppKey + 系统生成 32 位字母数字参数值 */
function ensureDefaultAppKeyHeader() {
  if (httpConfig.value.authHeaders?.length) return
  httpConfig.value.authHeaders = [defaultAppKeyAuthHeader()]
}

function removeAuthHeader(index: number) {
  httpConfig.value.authHeaders?.splice(index, 1)
}

function patchAuthHeader(index: number, patch: Partial<PushAuthHeader>) {
  const target = httpConfig.value.authHeaders?.[index]
  if (target) Object.assign(target, patch)
}

function toggleAuthHeader(index: number, checked: boolean) {
  patchAuthHeader(index, { enabled: checked })
}

watch(
  () => httpConfig.value.authType,
  (type) => {
    if (type === 'appkey') ensureDefaultAppKeyHeader()
  },
  { immediate: true },
)

function onChannelChange(
  v: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[],
) {
  const next = String(v) as PushChannelType
  if (next === 'file') return
  channelType.value = next
}
</script>

<style scoped>
.push-channel-form {
  width: 100%;
}

.push-channel-form :deep(.arco-form-item) {
  margin-bottom: 14px;
}

.push-channel-form :deep(.arco-form-item-label-col) {
  padding-bottom: 2px;
}

.section-block {
  margin-bottom: 14px;
  padding: 14px 16px 2px;
  background: #fafbfc;
  border: 1px solid var(--color-border-2, #e5e6eb);
  border-radius: 8px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.4;
}

.field-short :deep(.arco-input-number),
.field-short :deep(.arco-select-view) {
  width: 100%;
}

.mq-disabled-tip {
  margin-bottom: 12px;
}

.auth-type-tip {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #86909c;
}

.auth-headers-block {
  padding-bottom: 14px;
}

.auth-headers-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.auth-headers-head .section-title {
  margin: 0;
}

.auth-headers-desc {
  margin: 0 0 10px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.5;
}

.auth-headers-table :deep(.arco-input-wrapper),
.auth-headers-table :deep(.arco-input-inner-wrapper) {
  width: 100%;
}
</style>
