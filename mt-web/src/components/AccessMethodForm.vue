<template>
  <div class="access-method-form">
    <a-form-item field="accessMethod" required>
      <template #label>
        <FormFieldLabel title="接入方式" :desc="accessMethodTips[accessMethod]" />
      </template>
      <a-select
        v-model="accessMethod"
        :options="accessMethodOptions"
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
            <FormFieldLabel title="接口地址" desc="前置机对外暴露 URL，供数方调用此地址推送数据" />
          </template>
          <a-input v-model="apiAccess.endpointUrl" placeholder="请输入接口地址，如 https://xxx/api/v1/push" />
        </a-form-item>
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :sm="8" :md="6">
            <a-form-item field="apiAccess.protocol" label="请求协议" required class="field-short">
              <a-select
                v-model="apiAccess.protocol"
                :options="[
                  { label: 'HTTPS', value: 'HTTPS' },
                  { label: 'HTTP', value: 'HTTP' },
                ]"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="8" :md="6">
            <a-form-item field="apiAccess.method" label="请求方法" required class="field-short">
              <a-select v-model="apiAccess.method" :options="[{ label: 'POST', value: 'POST' }]" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="8" :md="12">
            <a-form-item field="apiAccess.authType" label="鉴权方式" required>
              <a-select v-model="apiAccess.authType" :options="apiAuthTypeOptions" />
            </a-form-item>
          </a-col>
        </a-row>
        <SchemeAppCredentials
          v-if="apiAccess.authType === 'appkey'"
          v-model:app-key="apiAccess.appKey"
          v-model:app-secret="apiAccess.appSecret"
          variant="form"
        />
        <a-row :gutter="[16, 0]">
          <a-col v-if="apiAccess.authType === 'appkey'" :xs="24" :sm="12">
            <a-form-item field="apiAccess.authHeaderName" label="鉴权 Header 名">
              <a-input v-model="apiAccess.authHeaderName" placeholder="X-App-Key" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="apiAccess.authType === 'appkey' ? 12 : 12">
            <a-form-item field="apiAccess.customHeaders">
              <template #label>
                <FormFieldLabel title="请求头" desc="选择请求携带的 Content-Type 等头信息" />
              </template>
              <a-select
                v-model="apiAccess.customHeaders"
                :options="requestHeaderOptions"
                allow-clear
                placeholder="请选择请求头"
                @change="onRequestHeaderChange"
              />
            </a-form-item>
          </a-col>
        </a-row>
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
          <a-col :xs="12" :sm="6">
            <a-form-item field="apiAccess.retry" class="field-short">
              <template #label>
                <FormFieldLabel title="重试次数" desc="推送失败后的自动重试次数，0 表示不重试" />
              </template>
              <a-input-number
                v-model="apiAccess.retry"
                :min="0"
                :max="10"
                hide-button
                placeholder="数字，如 3"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="12" :sm="6">
            <a-form-item field="apiAccess.retryIntervalMs" class="field-short">
              <template #label>
                <FormFieldLabel title="重试间隔（ms）" desc="两次重试之间的等待时间，单位毫秒" />
              </template>
              <a-input-number
                v-model="apiAccess.retryIntervalMs"
                :min="0"
                :max="60000"
                hide-button
                placeholder="数字，单位 ms"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="12" :sm="6">
            <a-form-item field="apiAccess.successHttpCode" class="field-short">
              <template #label>
                <FormFieldLabel title="成功响应码" desc="判定推送成功的 HTTP 状态码，如 200" />
              </template>
              <a-input v-model="apiAccess.successHttpCode" placeholder="数字，如 200" />
            </a-form-item>
          </a-col>
        </a-row>
      </div>

      <div class="section-block">
        <div class="section-title">数据与校验配置</div>
        <a-row :gutter="[16, 0]" class="align-fields-row">
          <a-col :xs="24" :sm="8" :md="6">
            <a-form-item field="apiAccess.charset" label="数据编码" class="field-short field-aligned">
              <a-select
                v-model="apiAccess.charset"
                :options="[
                  { label: 'UTF-8', value: 'UTF-8' },
                  { label: 'GBK', value: 'GBK' },
                ]"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="16" :md="12">
            <a-form-item field="apiAccess.enableFieldValidate" label="开启字段校验" class="field-switch field-aligned">
              <div class="switch-with-hint">
                <a-switch v-model="apiAccess.enableFieldValidate" />
                <span class="inline-hint">数据标准：绑定本方案「字段库配置」已选字段。</span>
              </div>
            </a-form-item>
          </a-col>
        </a-row>
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
import FormFieldLabel from '@/components/FormFieldLabel.vue'
import SchemeAppCredentials from '@/components/SchemeAppCredentials.vue'
import {
  accessMethodOptions,
  accessMethodTips,
  apiAuthTypeOptions,
  requestHeaderOptions,
  type AccessMethodType,
  type ApiAccessConfig,
  type FileAccessConfig,
  type MqAccessConfig,
} from '@/mock/mt'

const accessMethod = defineModel<AccessMethodType>('accessMethod', { required: true })
const apiAccess = defineModel<ApiAccessConfig>('apiAccess', { required: true })
const mqAccess = defineModel<MqAccessConfig>('mqAccess', { required: true })
const fileAccess = defineModel<FileAccessConfig>('fileAccess', { required: true })

const emit = defineEmits<{
  methodChange: [AccessMethodType]
}>()

function onMethodChange(val: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[]) {
  emit('methodChange', val as AccessMethodType)
}

function onRequestHeaderChange(val: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[]) {
  const header = String(val || '')
  const m = header.match(/content-type\s*:\s*(.+)/i)
  if (m?.[1]) apiAccess.value.contentType = m[1].trim()
}

function onFileProtocolChange(val: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[]) {
  const protocol = String(val) as 'SFTP' | 'FTP'
  if (protocol === 'FTP' && fileAccess.value.port === 22) fileAccess.value.port = 21
  if (protocol === 'SFTP' && fileAccess.value.port === 21) fileAccess.value.port = 22
}
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
</style>
