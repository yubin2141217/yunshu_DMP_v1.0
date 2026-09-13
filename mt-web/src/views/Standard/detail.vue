<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <h2 class="page-title">接入方案详情</h2>
        <p class="page-desc">查看基础信息、字段库配置与接入方式。</p>
      </div>
      <a-button @click="$router.push('/standard')">返回列表</a-button>
    </div>

    <template v-if="record">
      <a-card class="content-card detail-block" :bordered="false" title="基础信息">
        <a-descriptions :column="2" bordered size="large">
          <a-descriptions-item label="方案 ID">{{ record.schemeNo || '—' }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="record.status === 'enabled' ? 'green' : 'orangered'" size="small">
              {{ record.status === 'enabled' ? '启用' : '停用' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="方案名称" :span="2">{{ record.name }}</a-descriptions-item>
          <a-descriptions-item label="机构">
            <div class="org-cell">
              <div class="cell-main">{{ record.orgName || '—' }}</div>
              <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="供数方">{{ record.supplierName || '—' }}</a-descriptions-item>
          <a-descriptions-item label="IP 白名单管控">{{ record.requireIpWhitelist ? '是' : '否' }}</a-descriptions-item>
          <a-descriptions-item label="最近接入">{{ record.lastAccessAt || '—' }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ record.uploadedAt || '—' }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ record.updatedAt || '—' }}</a-descriptions-item>
          <a-descriptions-item label="备注" :span="2">{{ record.remark || '—' }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card class="content-card detail-block" :bordered="false" title="字段库配置">
        <div class="section-meta">共 {{ fieldList.length }} 个字段</div>
        <a-table
          v-if="fieldList.length"
          :columns="fieldColumns"
          :data="fieldList"
          row-key="id"
          :pagination="false"
          :bordered="false"
          stripe
          size="small"
        />
        <a-empty v-else description="未配置字段" />
      </a-card>

      <a-card class="content-card detail-block" :bordered="false" title="接入方式">
        <a-alert type="info" show-icon class="detail-alert">
          {{ accessMethodLabel(method) }}：{{ accessMethodTips[method] }}
        </a-alert>

        <template v-if="method === 'http_post'">
          <a-descriptions :column="2" bordered size="large">
            <a-descriptions-item label="接入方式">{{ accessMethodLabel(method) }}</a-descriptions-item>
            <a-descriptions-item label="请求方法">POST</a-descriptions-item>
            <a-descriptions-item label="接口地址" :span="2">{{ api.endpointUrl || endpoint || '—' }}</a-descriptions-item>
            <a-descriptions-item label="请求协议">{{ api.protocol || '—' }}</a-descriptions-item>
            <a-descriptions-item label="鉴权方式">{{ authLabel }}</a-descriptions-item>
            <a-descriptions-item label="成功响应码">{{ api.successHttpCode || '200' }}</a-descriptions-item>
            <a-descriptions-item label="最大 QPS">{{ api.rateLimitQps ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="重试">{{ api.retry ?? '—' }} 次 / {{ api.retryIntervalMs ?? '—' }} ms</a-descriptions-item>
            <a-descriptions-item label="数据编码">{{ api.charset || '—' }}</a-descriptions-item>
            <a-descriptions-item label="字段校验">{{ api.enableFieldValidate ? '是' : '否' }}</a-descriptions-item>
            <a-descriptions-item label="Content-Type">{{ api.contentType || '—' }}</a-descriptions-item>
          </a-descriptions>

          <div v-if="api.authType === 'appkey'" class="cred-panel">
            <div class="cred-panel__title">鉴权凭证（AppKey + AppSecret）</div>
            <SchemeAppCredentials
              v-model:app-key="credAppKey"
              v-model:app-secret="credAppSecret"
              variant="detail"
              show-save
              :saving="credSaving"
              @save="onSaveCredentials"
            />
          </div>
        </template>

        <template v-else-if="method === 'mq'">
          <a-descriptions :column="2" bordered size="large">
            <a-descriptions-item label="接入方式">{{ accessMethodLabel(method) }}</a-descriptions-item>
            <a-descriptions-item label="队列种类">{{ mq.mqType.toUpperCase() }}</a-descriptions-item>
            <a-descriptions-item label="成功响应码">{{ mq.successCode || 'OK' }}</a-descriptions-item>
            <a-descriptions-item label="接入地址" :span="2">
              {{ mq.mqType === 'rocketmq' ? mq.nameServer || mq.brokers : mq.brokers || '—' }}
            </a-descriptions-item>
            <a-descriptions-item label="Topic">{{ mq.topic || '—' }}</a-descriptions-item>
            <a-descriptions-item label="消费组">{{ mq.consumerGroup || '—' }}</a-descriptions-item>
            <a-descriptions-item label="鉴权">{{ mqAuthLabel }}</a-descriptions-item>
            <a-descriptions-item label="起始位点">{{ mq.startOffset === 'earliest' ? '最早位点' : '最新位点' }}</a-descriptions-item>
            <a-descriptions-item label="消费并发数">{{ mq.concurrency ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="单次拉取条数">{{ mq.maxPullSize ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="重试 / 死信">
              {{ mq.retryCount ?? '—' }} 次 / {{ mq.deadLetterEnabled ? '开启' : '关闭' }}
            </a-descriptions-item>
            <a-descriptions-item label="数据格式">{{ mq.dataFormat || '—' }}</a-descriptions-item>
            <template v-if="mq.mqType === 'bmq'">
              <a-descriptions-item label="SASL 机制">{{ mq.saslMechanism }}</a-descriptions-item>
            </template>
            <template v-if="mq.mqType === 'kafka'">
              <a-descriptions-item label="Offset 自动提交">{{ mq.autoCommit ? '开启' : '关闭' }}</a-descriptions-item>
              <a-descriptions-item label="自动提交间隔">{{ mq.autoCommitIntervalMs ?? '—' }} ms</a-descriptions-item>
            </template>
            <template v-if="mq.mqType === 'rocketmq'">
              <a-descriptions-item label="Tag 过滤">{{ mq.tagFilter || '—' }}</a-descriptions-item>
              <a-descriptions-item label="消费模式">
                {{ mq.consumeMode === 'broadcasting' ? '广播消费' : '集群消费' }}
              </a-descriptions-item>
              <a-descriptions-item label="单消息超时">{{ mq.consumeTimeoutMs ?? '—' }} ms</a-descriptions-item>
            </template>
          </a-descriptions>
        </template>

        <template v-else>
          <a-descriptions :column="2" bordered size="large">
            <a-descriptions-item label="接入方式">{{ accessMethodLabel(method) }}</a-descriptions-item>
            <a-descriptions-item label="传输协议">{{ file.protocol }}</a-descriptions-item>
            <a-descriptions-item label="成功响应码">{{ file.successCode || 'OK' }}</a-descriptions-item>
            <a-descriptions-item label="服务器">{{ file.host || '—' }}:{{ file.port }}</a-descriptions-item>
            <a-descriptions-item label="登录方式">{{ file.loginType === 'key' ? '密钥登录' : '用户名密码' }}</a-descriptions-item>
            <a-descriptions-item label="目录路径" :span="2">{{ file.remoteDir || '—' }}</a-descriptions-item>
            <a-descriptions-item label="文件规则">{{ file.fileNamePattern || '—' }}</a-descriptions-item>
            <a-descriptions-item label="格式 / 编码">{{ file.fileFormat }} / {{ file.encoding }}</a-descriptions-item>
            <a-descriptions-item label="轮询周期">{{ file.pollInterval || '—' }}</a-descriptions-item>
            <a-descriptions-item label="单次最大文件数">{{ file.maxFilesPerPull ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="处理完成动作">{{ afterProcessLabel }}</a-descriptions-item>
            <a-descriptions-item label="断点续传">{{ file.resumeEnabled ? '开启' : '关闭' }}</a-descriptions-item>
          </a-descriptions>
        </template>
      </a-card>
    </template>

    <a-card v-else class="content-card" :bordered="false">
      <a-empty description="未找到该接入方案">
        <a-button type="primary" style="margin-top: 12px" @click="$router.push('/standard')">返回列表</a-button>
      </a-empty>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import SchemeAppCredentials from '@/components/SchemeAppCredentials.vue'
import { getStandard, saveStandard } from '@/api/mt'
import {
  accessMethodLabel,
  accessMethodTips,
  apiAuthTypeOptions,
  buildApiEndpoint,
  normalizeApiAccess,
  normalizeFileAccess,
  normalizeMqAccess,
  type AccessMethodType,
  type Standard,
} from '@/mock/mt'
import { formatOrgSub } from '@/utils/orgDisplay'

const route = useRoute()
const record = ref<Standard | null>(null)
const credAppKey = ref('')
const credAppSecret = ref('')
const credSaving = ref(false)

const method = computed<AccessMethodType>(() => (record.value?.accessMethod || 'http_post') as AccessMethodType)
const api = computed(() => normalizeApiAccess(record.value?.apiAccess))
const mq = computed(() => normalizeMqAccess(record.value?.mqAccess))
const file = computed(() => normalizeFileAccess(record.value?.fileAccess))
const endpoint = computed(() => (record.value ? buildApiEndpoint(api.value) : ''))

const authLabel = computed(() => {
  const hit = apiAuthTypeOptions.find((o) => o.value === api.value.authType)
  return hit?.label || api.value.authType || '—'
})

const mqAuthLabel = computed(() => {
  if (mq.value.authType === 'sasl') return 'SASL 账号密码'
  if (mq.value.authType === 'ssl') return 'SSL 证书'
  return '无'
})

const afterProcessLabel = computed(() => {
  if (file.value.afterProcess === 'delete') return '删除远程文件'
  if (file.value.afterProcess === 'keep') return '保留'
  return '移动到归档目录'
})

const fieldList = computed(() =>
  (record.value?.fields || []).map((f) => {
    const ext = f as typeof f & { supplierFieldName?: string; supplierDataType?: string }
    return {
      id: f.id,
      name: f.name,
      description: f.description || f.bizCaliber || '',
      dataType: f.dataType || '—',
      bizCategory: f.bizCategory || '—',
      supplierFieldName: ext.supplierFieldName || f.name,
      supplierDataType: ext.supplierDataType || f.dataType || '—',
    }
  }),
)

const fieldColumns = [
  { title: '平台字段名', dataIndex: 'name', width: 140, ellipsis: true, tooltip: true },
  { title: '字段描述', dataIndex: 'description', ellipsis: true, tooltip: true },
  { title: '平台字段类型', dataIndex: 'dataType', width: 110 },
  { title: '业务分类', dataIndex: 'bizCategory', width: 96 },
  { title: '供数方字段名称', dataIndex: 'supplierFieldName', width: 140, ellipsis: true, tooltip: true },
  { title: '供数方字段类型', dataIndex: 'supplierDataType', width: 120 },
]

watch(
  () => record.value?.apiAccess,
  () => {
    const normalized = normalizeApiAccess(record.value?.apiAccess)
    credAppKey.value = normalized.appKey || ''
    credAppSecret.value = normalized.appSecret || ''
  },
  { immediate: true, deep: true },
)

async function onSaveCredentials() {
  if (!record.value) return
  if (!credAppKey.value.trim() || !credAppSecret.value.trim()) {
    Message.warning('请填写 AppKey 与 AppSecret')
    return
  }
  credSaving.value = true
  try {
    const nextApi = {
      ...normalizeApiAccess(record.value.apiAccess),
      appKey: credAppKey.value.trim(),
      appSecret: credAppSecret.value.trim(),
    }
    const saved = await saveStandard({
      id: record.value.id,
      name: record.value.name,
      fieldIds: record.value.fieldIds,
      fieldMaps: record.value.fieldMaps,
      scope: record.value.scope,
      orgId: record.value.orgId,
      accessMethod: record.value.accessMethod,
      apiAccess: nextApi,
      mqAccess: record.value.mqAccess,
      fileAccess: record.value.fileAccess,
      requireIpWhitelist: record.value.requireIpWhitelist,
      remark: record.value.remark,
      status: record.value.status,
    })
    record.value = saved
    Message.success('鉴权凭证已保存')
  } catch (e) {
    Message.error((e as Error).message || '保存失败')
  } finally {
    credSaving.value = false
  }
}

onMounted(async () => {
  record.value = await getStandard(String(route.params.id || ''))
})
</script>

<style scoped>
.detail-block + .detail-block {
  margin-top: 14px;
}
.detail-alert {
  margin-bottom: 16px;
}
.section-meta {
  margin-bottom: 10px;
  font-size: 13px;
  color: #86909c;
}
.org-cell {
  min-width: 0;
}
.cell-main {
  font-size: 13px;
  color: #1d2129;
  line-height: 1.35;
}
.cell-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.35;
}
.cred-panel {
  margin-top: 16px;
  padding: 14px 16px 4px;
  background: #fafbfc;
  border: 1px solid var(--color-border-2, #e5e6eb);
  border-radius: 8px;
}
.cred-panel__title {
  margin: 0 0 12px;
  padding-left: 8px;
  border-left: 3px solid rgb(var(--primary-6));
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
}
</style>
