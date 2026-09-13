<template>
  <div class="push-channel-form">
    <a-form-item field="channelType" required>
      <template #label>
        <FormFieldLabel title="推送类型" desc="中台主动推送的方式，当前支持HTTP接口和消息队列两种方式" />
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
            <a-form-item field="httpConfig.protocol" label="请求协议" required class="field-short">
              <a-select
                v-model="httpConfig.protocol"
                :options="[
                  { label: 'HTTPS', value: 'HTTPS' },
                  { label: 'HTTP', value: 'HTTP' },
                ]"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="8" :md="6">
            <a-form-item field="httpConfig.method" label="请求方法" required class="field-short">
              <a-select v-model="httpConfig.method" :options="[{ label: 'POST', value: 'POST' }]" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="8" :md="12">
            <a-form-item field="httpConfig.authType" label="鉴权方式" required>
              <a-select
                v-model="httpConfig.authType"
                :options="[
                  { label: '无鉴权', value: 'none' },
                  { label: 'Token', value: 'token' },
                  { label: 'AppKey', value: 'appkey' },
                ]"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item v-if="httpConfig.authType === 'token'" field="httpConfig.token" label="Token">
          <a-input-password v-model="httpConfig.token" placeholder="请输入 Token" />
        </a-form-item>
        <a-row v-if="httpConfig.authType === 'token'" :gutter="[16, 0]">
          <a-col :xs="24" :sm="12">
            <a-form-item field="httpConfig.authHeaderName" label="鉴权 Header 名">
              <a-input v-model="httpConfig.authHeaderName" placeholder="Authorization" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row v-if="httpConfig.authType === 'appkey'" :gutter="[16, 0]">
          <a-col :xs="24" :sm="12">
            <a-form-item field="httpConfig.appKey" label="AppKey">
              <a-input v-model="httpConfig.appKey" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12">
            <a-form-item field="httpConfig.appSecret" label="AppSecret">
              <a-input-password v-model="httpConfig.appSecret" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :sm="12">
            <a-form-item field="httpConfig.contentType">
              <template #label>
                <FormFieldLabel title="Content-Type" desc="请求体内容类型" />
              </template>
              <a-select
                v-model="httpConfig.contentType"
                :options="[
                  { label: 'application/json', value: 'application/json' },
                  { label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
                  { label: 'text/plain', value: 'text/plain' },
                ]"
                allow-clear
                allow-create
                placeholder="请选择或输入"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </div>

      <div class="section-block">
        <div class="section-title">流量 &amp; 限流配置</div>
        <a-row :gutter="[16, 0]">
          <a-col :xs="12" :sm="6">
            <a-form-item field="httpConfig.rateLimitQps" class="field-short">
              <template #label>
                <FormFieldLabel title="最大 QPS 上限" desc="外呼每秒最大请求数" />
              </template>
              <a-input-number v-model="httpConfig.rateLimitQps" :min="1" :max="10000" hide-button placeholder="如 50" />
            </a-form-item>
          </a-col>
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
          <a-col :xs="12" :sm="6">
            <a-form-item field="httpConfig.successHttpCode" class="field-short">
              <template #label>
                <FormFieldLabel title="成功响应码" desc="判定推送成功的 HTTP 状态码" />
              </template>
              <a-input v-model="httpConfig.successHttpCode" placeholder="如 200" />
            </a-form-item>
          </a-col>
        </a-row>
      </div>

      <div class="section-block">
        <div class="section-title">数据配置</div>
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :sm="8" :md="6">
            <a-form-item field="httpConfig.charset" label="数据编码" class="field-short">
              <a-select
                v-model="httpConfig.charset"
                :options="[
                  { label: 'UTF-8', value: 'UTF-8' },
                  { label: 'GBK', value: 'GBK' },
                ]"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </div>
    </template>

    <template v-else-if="channelType === 'mq'">
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
import FormFieldLabel from '@/components/FormFieldLabel.vue'
import { pushChannelOptions, type PushChannelType, type PushHttpConfig, type PushMqConfig } from '@/mock/push'

const channelType = defineModel<PushChannelType>('channelType', { required: true })
const httpConfig = defineModel<PushHttpConfig>('httpConfig', { required: true })
const mqConfig = defineModel<PushMqConfig>('mqConfig', { required: true })

const channelOptions = pushChannelOptions

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
</style>
