<template>
  <div class="page-shell detail-page">
    <div class="page-head detail-page__head">
      <div>
        <h2 class="page-title">接入方案详情</h2>
        <p class="page-desc">查看基础信息、字段库配置与接入方式。</p>
      </div>
      <a-space>
        <a-button :disabled="!record" @click="onCopyCreate">复制新增</a-button>
        <a-button @click="goBack">返回</a-button>
      </a-space>
    </div>

    <template v-if="record">
      <a-card class="content-card detail-block" :bordered="false" title="基础信息">
        <a-descriptions :column="2" bordered size="large" :label-style="descLabelStyle">
          <a-descriptions-item label="方案名称" :span="2">{{ record.name }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="record.status === 'enabled' ? 'green' : 'gray'" size="small">
              {{ record.status === 'enabled' ? '开启' : '停用' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="机构">
            <div class="org-cell">
              <div class="cell-main">{{ record.orgName || '—' }}</div>
              <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="供数方">{{ record.supplierName || '—' }}</a-descriptions-item>
          <a-descriptions-item label="IP 白名单管控">{{ record.requireIpWhitelist ? '是' : '否' }}</a-descriptions-item>
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
          <a-descriptions :column="2" bordered size="large" :label-style="descLabelStyle">
            <a-descriptions-item label="接入方式">{{ accessMethodLabel(method) }}</a-descriptions-item>
            <a-descriptions-item label="请求方法">POST</a-descriptions-item>
            <a-descriptions-item label="接口地址" :span="2">{{ api.endpointUrl || endpoint || '—' }}</a-descriptions-item>
            <a-descriptions-item label="鉴权方式">{{ authLabel }}</a-descriptions-item>
            <a-descriptions-item label="最大 QPS 上限">{{ api.rateLimitQps ?? '—' }}</a-descriptions-item>
          </a-descriptions>

          <div class="response-codes-panel">
            <div class="response-codes-panel__title">接口响应码</div>
            <a-table
              v-if="responseCodeRows.length"
              :columns="responseCodeColumns"
              :data="responseCodeRows"
              :pagination="false"
              :bordered="false"
              size="small"
            />
            <a-empty v-else description="未配置响应码" />
          </div>

          <div v-if="api.authType === 'appkey'" class="cred-panel">
            <div class="cred-panel__head">
              <div class="cred-panel__title">鉴权 Header</div>
              <a-button type="outline" size="small" @click="addCredHeader">
                <template #icon><IconPlus /></template>
                添加鉴权 Header
              </a-button>
            </div>
            <p class="cred-panel__desc">以键值对列表配置请求头，接入时将随报文一并校验。</p>
            <a-table
              :data="credHeaderRows"
              :columns="credHeaderColumns"
              :pagination="false"
              :bordered="{ cell: true }"
              size="small"
              row-key="_idx"
              class="cred-panel__table"
            >
              <template #enabled="{ record }">
                <a-checkbox
                  :model-value="record.enabled !== false"
                  @change="(v: boolean | (string | number | boolean)[]) => toggleCredHeader(record._idx, !!v)"
                />
              </template>
              <template #name="{ record }">
                <a-input
                  :model-value="record.name"
                  size="small"
                  placeholder="参数名，如 X-App-Key"
                  allow-clear
                  @update:model-value="(v: string) => patchCredHeader(record._idx, { name: v })"
                />
              </template>
              <template #value="{ record }">
                <a-input
                  :model-value="record.value"
                  size="small"
                  placeholder="参数值"
                  allow-clear
                  @update:model-value="(v: string) => patchCredHeader(record._idx, { value: v })"
                />
              </template>
              <template #remark="{ record }">
                <a-input
                  :model-value="record.remark"
                  size="small"
                  placeholder="说明（可选）"
                  allow-clear
                  @update:model-value="(v: string) => patchCredHeader(record._idx, { remark: v })"
                />
              </template>
              <template #op="{ record }">
                <a-button type="text" status="danger" size="small" @click="removeCredHeader(record._idx)">
                  删除
                </a-button>
              </template>
            </a-table>
            <div class="cred-panel__save-row">
              <a-button type="primary" size="small" :loading="credSaving" @click="onSaveCredentials">
                保存鉴权 Header
              </a-button>
            </div>
          </div>
        </template>

        <template v-else-if="method === 'mq'">
          <a-descriptions :column="2" bordered size="large" :label-style="descLabelStyle">
            <a-descriptions-item label="接入方式">{{ accessMethodLabel(method) }}</a-descriptions-item>
            <a-descriptions-item label="消息队列种类">{{ mq.mqType.toUpperCase() }}</a-descriptions-item>
            <a-descriptions-item :label="mq.mqType === 'rocketmq' ? 'NameServer 地址' : '接入地址集群'" :span="2">
              {{ mq.mqType === 'rocketmq' ? mq.nameServer || mq.brokers : mq.brokers || '—' }}
            </a-descriptions-item>
            <a-descriptions-item label="Topic 名称">{{ mq.topic || '—' }}</a-descriptions-item>
            <a-descriptions-item label="消费组名称">{{ mq.consumerGroup || '—' }}</a-descriptions-item>
            <a-descriptions-item label="鉴权方式">{{ mqAuthLabel }}</a-descriptions-item>
            <a-descriptions-item label="起始消费位点">{{ mq.startOffset === 'earliest' ? '最早位点' : '最新位点' }}</a-descriptions-item>
            <a-descriptions-item label="消费并发数">{{ mq.concurrency ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="单次拉取最大条数">{{ mq.maxPullSize ?? '—' }}</a-descriptions-item>
            <template v-if="mq.authType === 'sasl'">
              <a-descriptions-item label="用户名">{{ mq.username || '—' }}</a-descriptions-item>
              <a-descriptions-item label="密码">{{ mq.password ? '******' : '—' }}</a-descriptions-item>
            </template>
            <a-descriptions-item v-if="mq.authType === 'ssl'" label="证书路径">{{ mq.certPath || '—' }}</a-descriptions-item>
            <a-descriptions-item label="消息重试次数">{{ mq.retryCount ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="死信开关">{{ mq.deadLetterEnabled ? '开启' : '关闭' }}</a-descriptions-item>
            <a-descriptions-item label="数据格式">{{ mq.dataFormat || '—' }}</a-descriptions-item>
            <a-descriptions-item label="字段校验">{{ mq.enableFieldValidate ? '开启' : '关闭' }}</a-descriptions-item>
            <a-descriptions-item label="去重主键">{{ mq.dedupeField || '—' }}</a-descriptions-item>
            <a-descriptions-item label="堆积告警阈值">{{ mq.lagAlertThreshold ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="失败告警阈值">{{ mq.failAlertThreshold ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="成功响应码">{{ mq.successCode || 'OK' }}</a-descriptions-item>
            <template v-if="mq.mqType === 'bmq'">
              <a-descriptions-item label="SASL 机制">{{ mq.saslMechanism }}</a-descriptions-item>
            </template>
            <template v-if="mq.mqType === 'kafka'">
              <a-descriptions-item label="Offset 自动提交">{{ mq.autoCommit ? '开启' : '关闭' }}</a-descriptions-item>
              <a-descriptions-item label="自动提交间隔">{{ mq.autoCommitIntervalMs ?? '—' }} ms</a-descriptions-item>
            </template>
            <template v-if="mq.mqType === 'rocketmq'">
              <a-descriptions-item label="消息 Tag 过滤">{{ mq.tagFilter || '—' }}</a-descriptions-item>
              <a-descriptions-item label="消费模式">
                {{ mq.consumeMode === 'broadcasting' ? '广播消费' : '集群消费' }}
              </a-descriptions-item>
              <a-descriptions-item label="单消息消费超时">{{ mq.consumeTimeoutMs ?? '—' }} ms</a-descriptions-item>
            </template>
          </a-descriptions>
        </template>

        <template v-else>
          <a-descriptions :column="2" bordered size="large" :label-style="descLabelStyle">
            <a-descriptions-item label="接入方式">{{ accessMethodLabel(method) }}</a-descriptions-item>
            <a-descriptions-item label="传输协议">{{ file.protocol }}</a-descriptions-item>
            <a-descriptions-item label="服务器地址">{{ file.host || '—' }}</a-descriptions-item>
            <a-descriptions-item label="端口号">{{ file.port || '—' }}</a-descriptions-item>
            <a-descriptions-item label="登录方式">{{ file.loginType === 'key' ? '密钥登录' : '用户名密码' }}</a-descriptions-item>
            <a-descriptions-item label="用户名">{{ file.username || '—' }}</a-descriptions-item>
            <a-descriptions-item :label="file.loginType === 'key' ? '私钥路径' : '密码'">
              {{ file.loginType === 'key' ? (file.privateKeyPath || '—') : (file.password ? '******' : '—') }}
            </a-descriptions-item>
            <a-descriptions-item label="文件目录路径" :span="2">{{ file.remoteDir || '—' }}</a-descriptions-item>
            <a-descriptions-item label="文件命名匹配规则">{{ file.fileNamePattern || '—' }}</a-descriptions-item>
            <a-descriptions-item label="文件编码">{{ file.encoding || '—' }}</a-descriptions-item>
            <a-descriptions-item label="文件格式">{{ file.fileFormat || '—' }}</a-descriptions-item>
            <a-descriptions-item label="轮询扫描周期">{{ file.pollInterval || '—' }}</a-descriptions-item>
            <a-descriptions-item label="单次拉取最大文件数">{{ file.maxFilesPerPull ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="文件处理完成动作">{{ afterProcessLabel }}</a-descriptions-item>
            <a-descriptions-item label="断点续传">{{ file.resumeEnabled ? '开启' : '关闭' }}</a-descriptions-item>
            <a-descriptions-item label="字段校验">{{ file.enableFieldValidate ? '开启' : '关闭' }}</a-descriptions-item>
            <a-descriptions-item label="去重主键">{{ file.dedupeField || '—' }}</a-descriptions-item>
            <a-descriptions-item label="文件超时告警">{{ file.fileTimeoutAlert ? '开启' : '关闭' }}</a-descriptions-item>
            <a-descriptions-item label="文件解析失败告警">{{ file.parseFailAlert ? '开启' : '关闭' }}</a-descriptions-item>
            <a-descriptions-item label="成功响应码">{{ file.successCode || 'OK' }}</a-descriptions-item>
          </a-descriptions>
        </template>
      </a-card>

      <SchemeOpLogCard :logs="record.opLogs" />
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
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import SchemeOpLogCard from '@/components/SchemeOpLogCard.vue'
import { getStandard, saveStandard } from '@/api/mt'
import { usePageBack } from '@/composables/useUnsavedLeave'
import {
  accessMethodLabel,
  accessMethodTips,
  apiAuthTypeOptions,
  buildApiEndpoint,
  normalizeApiAccess,
  normalizeFileAccess,
  normalizeMqAccess,
  type AccessAuthHeader,
  type AccessMethodType,
  type Standard,
} from '@/mock/mt'
import { formatOrgSub } from '@/utils/orgDisplay'

const route = useRoute()
const router = useRouter()
const { goBack: goBackFallback } = usePageBack('/standard')

function goBack() {
  const from = String(route.query.from || '')
  const fieldId = String(route.query.fieldId || '')
  if (from === 'metadata-refs') {
    if (fieldId) sessionStorage.setItem('mt-metadata-ref-field', fieldId)
    router.replace({ path: '/metadata', query: { refField: fieldId } })
    return
  }
  goBackFallback()
}
const record = ref<Standard | null>(null)
const credHeaders = ref<AccessAuthHeader[]>([])
const credSaving = ref(false)
const descLabelStyle = { width: '148px', minWidth: '148px', maxWidth: '148px' }

const method = computed<AccessMethodType>(() => (record.value?.accessMethod || 'http_post') as AccessMethodType)
const api = computed(() => normalizeApiAccess(record.value?.apiAccess))
const mq = computed(() => normalizeMqAccess(record.value?.mqAccess))
const file = computed(() => normalizeFileAccess(record.value?.fileAccess))
const endpoint = computed(() => (record.value ? buildApiEndpoint(api.value) : ''))

/** 接口响应码列表行 */
const responseCodeRows = computed(() =>
  (api.value.responseCodes || []).filter((r) => r.code || r.desc).map((r) => ({ code: r.code, desc: r.desc || '—' })),
)

const responseCodeColumns = [
  { title: '响应码', dataIndex: 'code', width: 120 },
  { title: '说明', dataIndex: 'desc', ellipsis: true, tooltip: true },
]

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
  { title: '字段名', dataIndex: 'name', width: 140, ellipsis: true, tooltip: true },
  { title: '字段描述', dataIndex: 'description', ellipsis: true, tooltip: true },
  { title: '平台字段类型', dataIndex: 'dataType', width: 110 },
  { title: '业务分类', dataIndex: 'bizCategory', width: 96 },
  { title: '字段名', dataIndex: 'supplierFieldName', width: 140, ellipsis: true, tooltip: true },
  { title: '供数方字段类型', dataIndex: 'supplierDataType', width: 120 },
]

type CredHeaderViewRow = AccessAuthHeader & { _idx: number }

const credHeaderColumns = [
  { title: '', slotName: 'enabled', width: 48, align: 'center' as const },
  { title: '参数名', slotName: 'name' },
  { title: '参数值', slotName: 'value' },
  { title: '说明', slotName: 'remark', width: 200 },
  { title: '', slotName: 'op', width: 72, align: 'center' as const },
]

const credHeaderRows = computed<CredHeaderViewRow[]>(() =>
  credHeaders.value.map((h, i) => ({ ...h, _idx: i })),
)

function addCredHeader() {
  credHeaders.value.push({ enabled: true, name: '', value: '', remark: '' })
}

function removeCredHeader(index: number) {
  credHeaders.value.splice(index, 1)
}

function patchCredHeader(index: number, patch: Partial<AccessAuthHeader>) {
  const target = credHeaders.value[index]
  if (target) Object.assign(target, patch)
}

function toggleCredHeader(index: number, checked: boolean) {
  patchCredHeader(index, { enabled: checked })
}

watch(
  () => record.value?.apiAccess,
  () => {
    const normalized = normalizeApiAccess(record.value?.apiAccess)
    credHeaders.value = (normalized.authHeaders || []).map((h) => ({ ...h }))
  },
  { immediate: true, deep: true },
)

async function onSaveCredentials() {
  if (!record.value) return
  if (!credHeaders.value.some((h) => h.enabled !== false && h.name?.trim())) {
    Message.warning('请至少配置一个启用且有参数名的鉴权 Header')
    return
  }
  credSaving.value = true
  try {
    const headers = credHeaders.value.map((h) => ({
      enabled: h.enabled ?? true,
      name: h.name,
      value: h.value,
      remark: h.remark || '',
    }))
    // 首个启用且参数名为 AppKey 的行同步到 appKey，兼容历史凭证逻辑
    const appKeyHeader = headers.find(
      (h) => h.enabled !== false && h.name.trim() === 'AppKey' && h.value.trim(),
    )
    const nextApi = {
      ...normalizeApiAccess(record.value.apiAccess),
      authHeaders: headers,
      appKey: appKeyHeader?.value || headers.find((h) => h.enabled !== false)?.value || '',
    }
    const saved = await saveStandard({
      id: record.value.id,
      name: record.value.name,
      fieldIds: record.value.fieldIds,
      fieldMaps: record.value.fieldMaps,
      scope: record.value.scope,
      orgId: record.value.orgId,
      supplierId: record.value.supplierId,
      accessMethod: record.value.accessMethod,
      apiAccess: nextApi,
      mqAccess: record.value.mqAccess,
      fileAccess: record.value.fileAccess,
      requireIpWhitelist: record.value.requireIpWhitelist,
      remark: record.value.remark,
      status: record.value.status,
    })
    record.value = saved
    Message.success('鉴权 Header 已保存')
  } catch (e) {
    Message.error((e as Error).message || '保存失败')
  } finally {
    credSaving.value = false
  }
}

function onCopyCreate() {
  if (!record.value) return
  router.push({ path: '/standard/edit', query: { copyFrom: record.value.id } })
}

onMounted(async () => {
  record.value = await getStandard(String(route.params.id || ''))
})
</script>

<style scoped>
.detail-page__head {
  position: sticky;
  top: 0;
  z-index: 20;
  margin-bottom: 16px;
}
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
  padding: 14px 16px;
  background: #fafbfc;
  border: 1px solid var(--color-border-2, #e5e6eb);
  border-radius: 8px;
}
.cred-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}
.cred-panel__title {
  margin: 0;
  padding-left: 8px;
  border-left: 3px solid rgb(var(--primary-6));
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: #1d2129;
}
.cred-panel__desc {
  margin: 0 0 10px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.5;
}
.cred-panel__table :deep(.arco-input-wrapper),
.cred-panel__table :deep(.arco-input-inner-wrapper) {
  width: 100%;
}
.cred-panel__save-row {
  margin-top: 12px;
}

.response-codes-panel {
  margin-top: 16px;
  padding: 14px 16px;
  background: #fafbfc;
  border: 1px solid var(--color-border-2, #e5e6eb);
  border-radius: 8px;
}
.response-codes-panel__title {
  margin: 0 0 12px;
  padding-left: 8px;
  border-left: 3px solid rgb(var(--primary-6));
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
}
</style>
