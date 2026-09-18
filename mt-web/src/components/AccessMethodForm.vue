<template>
  <div class="access-method-form">
    <a-form-item field="accessMethod" required>
      <template #label>
        <FormFieldLabel title="接入方式" :desc="accessMethodTips[accessMethod]" />
      </template>
      <a-select
        v-model="accessMethod"
        :options="methodSelectOptions"
        style="width: 100%"
        @change="onMethodChange"
      />
    </a-form-item>

    <!-- HTTP/HTTPS POST -->
    <template v-if="accessMethod === 'http_post'">
      <div class="section-block">
        <div class="section-title">基础信息</div>
        <a-form-item field="apiAccess.endpointUrl" required>
          <template #label>
            <FormFieldLabel
              title="接口地址"
              desc="接口地址全局唯一，由系统网关与自定义路由组成，提交时校验唯一性"
            />
          </template>
          <div class="endpoint-row">
            <a-input
              :model-value="gatewayUrl"
              placeholder="网关"
              readonly
              class="endpoint-gateway"
            />
            <span class="endpoint-sep">/</span>
            <a-input
              v-model="routePath"
              placeholder="/api/v1/push/xxxxxxxx"
              allow-clear
              class="endpoint-route"
              @blur="onRouteBlur"
            />
          </div>
        </a-form-item>
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :sm="8" :md="6">
            <a-form-item field="apiAccess.method" label="请求方法" required class="field-short">
              <a-select v-model="apiAccess.method" :options="[{ label: 'POST', value: 'POST' }]" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="8" :md="12">
            <a-form-item field="apiAccess.authType" label="鉴权方式" required>
              <a-select v-model="apiAccess.authType" :options="apiAuthTypeOptions" />
              <template #extra>
                <span v-if="apiAccess.authType === 'appkey'" class="auth-type-tip">
                  AppKey 系统默认生成 32 位字母数字组合，可手动修改
                </span>
              </template>
            </a-form-item>
          </a-col>
        </a-row>
        <div v-if="apiAccess.authType === 'appkey'" class="auth-headers-block">
          <div class="auth-headers-head">
            <div class="auth-headers-title">鉴权 Header</div>
            <a-button type="outline" size="small" @click="addAuthHeader">
              <template #icon><IconPlus /></template>
              添加鉴权 Header
            </a-button>
          </div>
          <p class="auth-headers-desc">以键值对列表配置请求头，接入时将随报文一并校验。</p>
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
      </div>

      <div class="section-block">
        <div class="section-title">流量 &amp; 限流配置</div>
        <a-row :gutter="[16, 0]">
          <a-col :xs="12" :sm="6">
            <a-form-item field="apiAccess.rateLimitQps" class="field-short">
              <template #label>
                <FormFieldLabel title="最大 QPS 上限" desc="单接口每秒最大请求数，超出将限流" />
              </template>
              <a-input-number
                v-model="apiAccess.rateLimitQps"
                :min="1"
                :max="10000"
                hide-button
                placeholder="数字，如 50"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </div>

      <div class="section-block">
        <div class="section-title">接口响应码</div>
        <a-table
          :data="responseCodeRows"
          :columns="responseCodeColumns"
          :pagination="false"
          :bordered="{ cell: true }"
          size="small"
          row-key="_idx"
          class="response-codes-table"
        >
          <template #code="{ record }">
            <a-input
              :model-value="record.code"
              size="small"
              placeholder="响应码，如 200、4xx"
              @update:model-value="(v: string) => patchResponseCode(record._idx, { code: v })"
            />
          </template>
          <template #desc="{ record }">
            <a-input
              :model-value="record.desc"
              size="small"
              placeholder="说明，如 成功、鉴权失败"
              @update:model-value="(v: string) => patchResponseCode(record._idx, { desc: v })"
            />
          </template>
          <template #op="{ record }">
            <a-button type="text" status="danger" size="small" @click="removeResponseCode(record._idx)">
              删除
            </a-button>
          </template>
        </a-table>
      </div>
    </template>

    <!-- 消息队列订阅 -->
    <template v-else-if="accessMethod === 'mq'">
      <div class="section-block">
        <div class="section-title">接入配置</div>
        <a-form-item field="mqAccess.mqType" label="消息队列种类" required>
          <a-radio-group v-model="mqAccess.mqType" type="button">
            <a-radio value="kafka">Kafka</a-radio>
            <a-radio value="bmq">BMQ</a-radio>
            <a-radio value="rocketmq">RocketMQ</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item
          :field="mqAccess.mqType === 'rocketmq' ? 'mqAccess.nameServer' : 'mqAccess.brokers'"
          :label="mqAccess.mqType === 'rocketmq' ? 'NameServer 地址' : '接入地址集群'"
          required
        >
          <a-input
            v-if="mqAccess.mqType === 'rocketmq'"
            v-model="mqAccess.nameServer"
            placeholder="NameServer 地址，多个用逗号分隔"
          />
          <a-input
            v-else
            v-model="mqAccess.brokers"
            placeholder="支持多个地址，逗号分隔"
          />
        </a-form-item>
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :sm="12">
            <a-form-item field="mqAccess.topic" label="Topic 名称" required>
              <a-input v-model="mqAccess.topic" placeholder="Topic" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12">
            <a-form-item field="mqAccess.consumerGroup" label="消费组名称" required>
              <a-input v-model="mqAccess.consumerGroup" placeholder="Consumer Group" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :sm="8">
            <a-form-item field="mqAccess.authType" label="鉴权方式">
              <a-select
                v-model="mqAccess.authType"
                :options="[
                  { label: '无', value: 'none' },
                  { label: 'SASL 账号密码', value: 'sasl' },
                  { label: 'SSL 证书', value: 'ssl' },
                ]"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="8">
            <a-form-item field="mqAccess.startOffset" label="起始消费位点">
              <a-select
                v-model="mqAccess.startOffset"
                :options="[
                  { label: '最新位点', value: 'latest' },
                  { label: '最早位点', value: 'earliest' },
                ]"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="8">
            <a-form-item field="mqAccess.concurrency" label="消费并发数" class="field-short">
              <a-input-number v-model="mqAccess.concurrency" :min="1" :max="64" hide-button />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row v-if="mqAccess.authType === 'sasl'" :gutter="[16, 0]">
          <a-col :xs="24" :sm="12">
            <a-form-item field="mqAccess.username" label="用户名">
              <a-input v-model="mqAccess.username" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12">
            <a-form-item field="mqAccess.password" label="密码">
              <a-input-password v-model="mqAccess.password" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item v-if="mqAccess.authType === 'ssl'" field="mqAccess.certPath" label="证书路径">
          <a-input v-model="mqAccess.certPath" placeholder="证书文件路径" />
        </a-form-item>
        <a-row :gutter="[16, 0]">
          <a-col :xs="12" :sm="8">
            <a-form-item field="mqAccess.maxPullSize" label="单次拉取最大条数" class="field-short">
              <a-input-number v-model="mqAccess.maxPullSize" :min="1" :max="10000" hide-button />
            </a-form-item>
          </a-col>
          <a-col :xs="12" :sm="8">
            <a-form-item field="mqAccess.retryCount" label="消息重试次数" class="field-short">
              <a-input-number v-model="mqAccess.retryCount" :min="0" :max="20" hide-button />
            </a-form-item>
          </a-col>
          <a-col :xs="12" :sm="8">
            <a-form-item label="死信开关" class="field-switch">
              <a-switch v-model="mqAccess.deadLetterEnabled" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="[16, 0]">
          <a-col :xs="12" :sm="8">
            <a-form-item field="mqAccess.dataFormat" label="数据格式" class="field-short">
              <a-select
                v-model="mqAccess.dataFormat"
                :options="[{ label: 'JSON', value: 'JSON' }]"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="12" :sm="8">
            <a-form-item field="mqAccess.enableFieldValidate" class="field-switch">
              <template #label>
                <FormFieldLabel
                  title="字段校验"
                  desc="数据标准：绑定本方案「字段库配置」已选字段。"
                />
              </template>
              <a-switch v-model="mqAccess.enableFieldValidate" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="8">
            <a-form-item field="mqAccess.dedupeField" label="去重主键">
              <a-input v-model="mqAccess.dedupeField" placeholder="可选" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="[16, 0]">
          <a-col :xs="12" :sm="8">
            <a-form-item field="mqAccess.lagAlertThreshold" label="堆积告警阈值" class="field-short">
              <a-input-number v-model="mqAccess.lagAlertThreshold" :min="0" hide-button />
            </a-form-item>
          </a-col>
          <a-col :xs="12" :sm="8">
            <a-form-item field="mqAccess.failAlertThreshold" label="失败告警阈值" class="field-short">
              <a-input-number v-model="mqAccess.failAlertThreshold" :min="1" hide-button />
            </a-form-item>
          </a-col>
          <a-col :xs="12" :sm="8">
            <a-form-item field="mqAccess.successCode" label="成功响应码" class="field-short">
              <a-input v-model="mqAccess.successCode" placeholder="OK" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item
          v-if="mqAccess.mqType === 'bmq'"
          field="mqAccess.saslMechanism"
          label="SASL 机制"
          class="field-short"
        >
          <a-select
            v-model="mqAccess.saslMechanism"
            :options="[
              { label: 'PLAIN', value: 'PLAIN' },
              { label: 'SCRAM', value: 'SCRAM' },
            ]"
          />
        </a-form-item>
        <a-row v-if="mqAccess.mqType === 'kafka'" :gutter="[16, 0]">
          <a-col :xs="24" :sm="8">
            <a-form-item label="Offset 自动提交" class="field-switch">
              <a-switch v-model="mqAccess.autoCommit" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="8">
            <a-form-item field="mqAccess.autoCommitIntervalMs" label="自动提交间隔（ms）" class="field-short">
              <a-input-number v-model="mqAccess.autoCommitIntervalMs" :min="100" hide-button />
            </a-form-item>
          </a-col>
        </a-row>
        <template v-if="mqAccess.mqType === 'rocketmq'">
          <a-form-item field="mqAccess.tagFilter" label="消息 Tag 过滤">
            <a-input v-model="mqAccess.tagFilter" placeholder="建议填写，用于同一 Topic 区分场景" />
          </a-form-item>
          <a-row :gutter="[16, 0]">
            <a-col :xs="24" :sm="12">
              <a-form-item field="mqAccess.consumeMode" label="消费模式">
                <a-select
                  v-model="mqAccess.consumeMode"
                  :options="[
                    { label: '集群消费', value: 'clustering' },
                    { label: '广播消费', value: 'broadcasting' },
                  ]"
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item field="mqAccess.consumeTimeoutMs" label="单消息消费超时（ms）" class="field-short">
                <a-input-number v-model="mqAccess.consumeTimeoutMs" :min="1000" hide-button />
              </a-form-item>
            </a-col>
          </a-row>
        </template>
      </div>
    </template>

    <!-- 文件传输类 -->
    <template v-else>
      <div class="section-block">
        <div class="section-title">基础连接配置</div>
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :sm="6">
            <a-form-item field="fileAccess.protocol" label="传输协议" required class="field-short">
              <a-select
                v-model="fileAccess.protocol"
                :options="[
                  { label: 'SFTP（推荐）', value: 'SFTP' },
                  { label: 'FTP', value: 'FTP' },
                ]"
                @change="onFileProtocolChange"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12">
            <a-form-item field="fileAccess.host" label="服务器地址" required>
              <a-input v-model="fileAccess.host" placeholder="IP 或域名" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="6">
            <a-form-item field="fileAccess.port" label="端口号" required class="field-short">
              <a-input-number v-model="fileAccess.port" :min="1" :max="65535" hide-button />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item field="fileAccess.loginType" label="登录方式" required>
          <a-radio-group v-model="fileAccess.loginType">
            <a-radio value="password">用户名密码</a-radio>
            <a-radio value="key">密钥登录</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :sm="12">
            <a-form-item field="fileAccess.username" label="用户名">
              <a-input v-model="fileAccess.username" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12">
            <a-form-item v-if="fileAccess.loginType === 'password'" field="fileAccess.password" label="密码">
              <a-input-password v-model="fileAccess.password" />
            </a-form-item>
            <a-form-item v-else field="fileAccess.privateKeyPath" label="私钥路径">
              <a-input v-model="fileAccess.privateKeyPath" placeholder="密钥文件路径" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item field="fileAccess.remoteDir" label="文件目录路径" required>
          <a-input v-model="fileAccess.remoteDir" placeholder="厂商存放数据文件的远程目录" />
        </a-form-item>
      </div>

      <div class="section-block">
        <div class="section-title">文件规则配置</div>
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :sm="12">
            <a-form-item field="fileAccess.fileNamePattern" label="文件命名匹配规则" required>
              <a-input v-model="fileAccess.fileNamePattern" placeholder="如 op_data_*.json" />
            </a-form-item>
          </a-col>
          <a-col :xs="12" :sm="6">
            <a-form-item field="fileAccess.encoding" label="文件编码" class="field-short">
              <a-select
                v-model="fileAccess.encoding"
                :options="[
                  { label: 'UTF-8', value: 'UTF-8' },
                  { label: 'GBK', value: 'GBK' },
                ]"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="12" :sm="6">
            <a-form-item field="fileAccess.fileFormat" label="文件格式" class="field-short">
              <a-select
                v-model="fileAccess.fileFormat"
                :options="[
                  { label: 'JSON', value: 'JSON' },
                  { label: 'CSV', value: 'CSV' },
                  { label: 'Parquet', value: 'Parquet' },
                ]"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="[16, 0]">
          <a-col :xs="12" :sm="8">
            <a-form-item field="fileAccess.maxFilesPerPull" label="单次拉取最大文件数" class="field-short">
              <a-input-number v-model="fileAccess.maxFilesPerPull" :min="1" :max="1000" hide-button />
            </a-form-item>
          </a-col>
          <a-col :xs="12" :sm="8">
            <a-form-item field="fileAccess.pollInterval" label="轮询扫描周期" class="field-short">
              <a-input v-model="fileAccess.pollInterval" placeholder="如 5min" />
            </a-form-item>
          </a-col>
        </a-row>
      </div>

      <div class="section-block">
        <div class="section-title">处理策略配置</div>
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :sm="12">
            <a-form-item field="fileAccess.afterProcess" label="文件处理完成动作">
              <a-select
                v-model="fileAccess.afterProcess"
                :options="[
                  { label: '删除远程文件', value: 'delete' },
                  { label: '移动到归档目录', value: 'archive' },
                  { label: '保留', value: 'keep' },
                ]"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="12" :sm="6">
            <a-form-item label="断点续传" class="field-switch">
              <a-switch v-model="fileAccess.resumeEnabled" />
            </a-form-item>
          </a-col>
          <a-col :xs="12" :sm="6">
            <a-form-item field="fileAccess.enableFieldValidate" class="field-switch">
              <template #label>
                <FormFieldLabel
                  title="字段校验"
                  desc="数据标准：关联本方案「字段库配置」已选元数据标准。"
                />
              </template>
              <a-switch v-model="fileAccess.enableFieldValidate" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item field="fileAccess.dedupeField" label="去重主键">
          <a-input v-model="fileAccess.dedupeField" placeholder="可选" style="max-width: 280px" />
        </a-form-item>
      </div>

      <div class="section-block">
        <div class="section-title">监控 &amp; 告警</div>
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :sm="12">
            <a-form-item label="文件超时告警" class="field-switch">
              <a-switch v-model="fileAccess.fileTimeoutAlert" />
              <span class="inline-hint">轮询周期内未扫到新文件时告警</span>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12">
            <a-form-item label="文件解析失败告警" class="field-switch">
              <a-switch v-model="fileAccess.parseFailAlert" />
              <span class="inline-hint">格式错误或字段不匹配时告警</span>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item field="fileAccess.successCode" label="成功响应码" class="field-short">
          <a-input v-model="fileAccess.successCode" placeholder="OK" />
        </a-form-item>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import FormFieldLabel from '@/components/FormFieldLabel.vue'
import {
  accessMethodOptions,
  accessMethodTips,
  apiAuthTypeOptions,
  defaultAccessAppKeyHeader,
  SYSTEM_GATEWAY,
  type AccessAuthHeader,
  type AccessMethodType,
  type ApiAccessConfig,
  type FileAccessConfig,
  type MqAccessConfig,
} from '@/mock/mt'

const accessMethod = defineModel<AccessMethodType>('accessMethod', { required: true })
const apiAccess = defineModel<ApiAccessConfig>('apiAccess', { required: true })
const mqAccess = defineModel<MqAccessConfig>('mqAccess', { required: true })
const fileAccess = defineModel<FileAccessConfig>('fileAccess', { required: true })

/** 消息队列订阅暂不可选（置灰） */
const methodSelectOptions = accessMethodOptions.map((o) =>
  o.value === 'mq' ? { ...o, disabled: true } : o,
)

const emit = defineEmits<{
  methodChange: [AccessMethodType]
}>()

function onMethodChange(val: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[]) {
  emit('methodChange', val as AccessMethodType)
}

function onFileProtocolChange(val: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[]) {
  const protocol = String(val) as 'SFTP' | 'FTP'
  if (protocol === 'FTP' && fileAccess.value.port === 22) fileAccess.value.port = 21
  if (protocol === 'SFTP' && fileAccess.value.port === 21) fileAccess.value.port = 22
}

// === 接口地址：网关（只读） + 路由（可编辑） ===
const gatewayUrl = SYSTEM_GATEWAY

/** 路由部分：从 endpointUrl 拆出，双向同步 */
const routePath = computed({
  get: () => {
    const full = apiAccess.value.endpointUrl || ''
    const gw = SYSTEM_GATEWAY
    if (full.startsWith(gw)) return full.slice(gw.length).replace(/^\/+/, '/')
    // 兜底：从 baseUrl/path 推断
    return apiAccess.value.path || ''
  },
  set: (v: string) => {
    const normalized = (v || '').trim().replace(/\/+$/, '')
    const route = normalized.startsWith('/') ? normalized : `/${normalized}`
    apiAccess.value.path = route
    apiAccess.value.baseUrl = SYSTEM_GATEWAY
    apiAccess.value.endpointUrl = `${SYSTEM_GATEWAY}${route}`
  },
})

const routeError = ref('')

const ROUTE_REGEX = /^\/[a-zA-Z0-9\-_/]*$/

function onRouteBlur() {
  const v = routePath.value.trim()
  if (!v) {
    routeError.value = '请输入路由部分'
    return
  }
  if (!ROUTE_REGEX.test(v)) {
    routeError.value = '以 / 开头，仅允许字母、数字、-、_、/'
    return
  }
  routeError.value = ''
}

// === 鉴权 Header（与新增推送方案页推送方式一致：AppKey 时默认一行 AppKey + 32 位值） ===
type AuthHeaderViewRow = AccessAuthHeader & { _idx: number }

const authHeaderColumns = [
  { title: '', slotName: 'enabled', width: 48, align: 'center' as const },
  { title: '参数名', slotName: 'name' },
  { title: '参数值', slotName: 'value' },
  { title: '说明', slotName: 'remark', width: 200 },
  { title: '', slotName: 'op', width: 72, align: 'center' as const },
]

const authHeaderRows = computed<AuthHeaderViewRow[]>(() =>
  (apiAccess.value.authHeaders || []).map((h, i) => ({ ...h, _idx: i })),
)

function addAuthHeader() {
  if (!Array.isArray(apiAccess.value.authHeaders)) apiAccess.value.authHeaders = []
  apiAccess.value.authHeaders.push({ enabled: true, name: '', value: '', remark: '' })
}

/** 选中 AppKey 鉴权时默认填充一行：参数名 AppKey + 系统生成 32 位字母数字参数值 */
function ensureDefaultAppKeyHeader() {
  if (apiAccess.value.authHeaders?.length) return
  apiAccess.value.authHeaders = [defaultAccessAppKeyHeader()]
}

function removeAuthHeader(index: number) {
  apiAccess.value.authHeaders?.splice(index, 1)
}

function patchAuthHeader(index: number, patch: Partial<AccessAuthHeader>) {
  const target = apiAccess.value.authHeaders?.[index]
  if (target) Object.assign(target, patch)
}

function toggleAuthHeader(index: number, checked: boolean) {
  patchAuthHeader(index, { enabled: checked })
}

watch(
  () => apiAccess.value.authType,
  (type) => {
    if (type === 'appkey') ensureDefaultAppKeyHeader()
  },
  { immediate: true },
)

// === 接口响应码（固定示例行，支持行内编辑与删除，不再支持新增） ===
interface ResponseCodeRow {
  _idx: number
  code: string
  desc: string
}

const responseCodeColumns = [
  { title: '响应码', slotName: 'code', width: 200 },
  { title: '说明', slotName: 'desc' },
  { title: '操作', slotName: 'op', width: 88, align: 'center' as const },
]

const responseCodeRows = computed<ResponseCodeRow[]>(() =>
  (apiAccess.value.responseCodes || []).map((r, idx) => ({ _idx: idx, ...r })),
)

function patchResponseCode(idx: number, patch: Partial<{ code: string; desc: string }>) {
  const list = apiAccess.value.responseCodes
  if (!Array.isArray(list) || !list[idx]) return
  list[idx] = { ...list[idx], ...patch }
}

function removeResponseCode(idx: number) {
  apiAccess.value.responseCodes.splice(idx, 1)
}

defineExpose({ onRouteBlur, routeError })
</script>

<style scoped>
.access-method-form {
  width: 100%;
}

.access-method-form :deep(.arco-form-item) {
  margin-bottom: 14px;
}

.access-method-form :deep(.arco-form-item-label-col) {
  padding-bottom: 2px;
}

.access-method-form :deep(.arco-form-item-message) {
  min-height: 0;
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
  padding-left: 8px;
  border-left: 3px solid rgb(var(--primary-6));
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: #1d2129;
}

.field-short :deep(.arco-select),
.field-short :deep(.arco-input-wrapper),
.field-short :deep(.arco-input-number) {
  width: 100%;
  max-width: 168px;
}

.field-switch :deep(.arco-form-item-content) {
  min-height: 32px;
  display: flex;
  align-items: center;
}

.align-fields-row {
  align-items: flex-start;
}

.field-aligned :deep(.arco-form-item-label-col) {
  min-height: 22px;
  margin-bottom: 2px;
}

.field-aligned :deep(.arco-form-item-label) {
  line-height: 22px;
}

.switch-with-hint {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  min-height: 32px;
}

.switch-with-hint .inline-hint {
  margin-left: 0;
}

.inline-alert {
  margin: -2px 0 12px;
}

.meta-tip {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #86909c;
}

.inline-hint {
  margin-left: 10px;
  font-size: 12px;
  color: #86909c;
}

.auth-type-tip {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #86909c;
}

.auth-headers-block {
  margin: 2px 0 14px;
}

.auth-headers-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.auth-headers-title {
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.4;
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

.cred-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.cred-row :deep(.arco-input-wrapper),
.cred-row :deep(.arco-input-password) {
  flex: 1;
  min-width: 0;
}

.endpoint-row {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.endpoint-gateway {
  flex: 0 0 auto;
  width: 320px;
}

.endpoint-gateway :deep(.arco-input-wrapper) {
  background: #f2f3f5;
  border-color: #e5e6eb;
  cursor: not-allowed;
}

.endpoint-gateway :deep(.arco-input) {
  background: #f2f3f5;
  color: #86909c;
  cursor: not-allowed;
  -webkit-text-fill-color: #86909c;
}

.endpoint-sep {
  font-size: 14px;
  color: #86909c;
  flex: 0 0 auto;
}

.endpoint-route {
  flex: 1;
  min-width: 0;
}

.response-codes-table {
  margin-bottom: 12px;
}

.response-codes-table :deep(.arco-table-cell) {
  padding: 6px 12px;
}
</style>

