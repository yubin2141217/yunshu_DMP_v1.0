<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <h2 class="page-title">推送方案详情</h2>
        <p class="page-desc">查看基础信息、推送数据范围与推送方式。</p>
      </div>
      <a-button @click="$router.push('/push/schemes')">返回列表</a-button>
    </div>

    <template v-if="record">
      <a-card class="content-card detail-block" :bordered="false" title="基础信息">
        <a-descriptions :column="2" bordered size="large">
          <a-descriptions-item label="方案名称">{{ record.name }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="record.status === 'enabled' ? 'green' : 'orangered'" size="small">
              {{ record.status === 'enabled' ? '启用' : '停用' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="接收方">
            {{ record.receiverType === 'third' ? '第三方机构' : 'MT机构' }}
          </a-descriptions-item>
          <a-descriptions-item label="机构">
            <div class="org-cell">
              <div class="cell-main">{{ record.orgName || '—' }}</div>
              <div class="cell-sub">{{ formatOrgSub(record.orgStatUnit, record.orgSalesName) }}</div>
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="最近推送时间">{{ record.stats?.lastPushAt || '—' }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ record.updatedAt || '—' }}</a-descriptions-item>
          <a-descriptions-item label="备注" :span="2">{{ record.remark || '—' }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card class="content-card detail-block" :bordered="false" title="推送数据范围">
        <a-descriptions :column="2" bordered size="large">
          <a-descriptions-item label="数据来源">
            {{ record.dataSourceType === 'datasource' ? '数据源' : '接入方案' }}
          </a-descriptions-item>
          <a-descriptions-item label="范围摘要">{{ dataScopeSummary(record) }}</a-descriptions-item>
          <a-descriptions-item v-if="record.dataSourceType === 'datasource'" label="数据源 ID" :span="2">
            {{ record.dataSourceId || '—' }}
          </a-descriptions-item>
          <a-descriptions-item v-else label="接入方案" :span="2">
            {{ record.standardNames?.length ? record.standardNames.join('、') : '—' }}
          </a-descriptions-item>
          <a-descriptions-item label="供数方" :span="2">
            {{ record.supplierNames?.length ? record.supplierNames.join('、') : '—' }}
          </a-descriptions-item>
          <a-descriptions-item label="数据去重" :span="2">
            {{
              record.dedupeEnabled
                ? `${record.dedupeWindowHours || 72} 小时内 / ${
                    (record.dedupeFields || []).length
                      ? record.dedupeFields
                          .map((f) => ({ title: '标题', content: '正文内容', url: '原文链接' }[f] || f))
                          .join('、')
                      : '未选字段'
                  }`
                : '关闭'
            }}
          </a-descriptions-item>
          <a-descriptions-item label="过滤逻辑">
            {{
              record.filterRules?.length
                ? `满足${record.filterLogic === 'any' ? '任一' : '全部'}条件才推送`
                : '不过滤'
            }}
          </a-descriptions-item>
          <a-descriptions-item label="条件数">{{ record.filterRules?.length || 0 }}</a-descriptions-item>
        </a-descriptions>

        <div v-if="filterRows.length" class="filter-table-wrap">
          <div class="section-meta">过滤条件明细</div>
          <a-table
            :columns="filterColumns"
            :data="filterRows"
            row-key="id"
            :pagination="false"
            :bordered="false"
            stripe
            size="small"
          />
        </div>
      </a-card>

      <a-card class="content-card detail-block" :bordered="false" title="推送方式">
        <a-alert type="info" show-icon class="detail-alert">
          {{ channelLabel(record.channelType) }}：{{ channelTip }}
        </a-alert>

        <a-descriptions :column="2" bordered size="large">
          <a-descriptions-item label="推送类型">{{ channelLabel(record.channelType) }}</a-descriptions-item>
          <a-descriptions-item label="推送模式">{{ pushModeLabel(record.pushMode) }}</a-descriptions-item>
          <a-descriptions-item label="调度频次">{{ scheduleSummary(record) }}</a-descriptions-item>
          <a-descriptions-item label="批量条数上限">{{ record.batchLimit }}</a-descriptions-item>

          <template v-if="record.channelType === 'http'">
            <a-descriptions-item label="推送接口地址" :span="2">
              {{ record.httpConfig.endpointUrl || '—' }}
            </a-descriptions-item>
            <a-descriptions-item label="请求协议">{{ record.httpConfig.protocol }}</a-descriptions-item>
            <a-descriptions-item label="请求方法">{{ record.httpConfig.method }}</a-descriptions-item>
            <a-descriptions-item label="鉴权方式">{{ httpAuthLabel(record.httpConfig.authType) }}</a-descriptions-item>
            <a-descriptions-item label="Content-Type">
              {{ record.httpConfig.contentType || '—' }}
            </a-descriptions-item>
            <a-descriptions-item label="最大 QPS">{{ record.httpConfig.rateLimitQps ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="重试">
              {{ record.httpConfig.retry ?? '—' }} 次 / {{ record.httpConfig.retryIntervalMs ?? '—' }} ms
            </a-descriptions-item>
            <a-descriptions-item label="成功响应码">{{ record.httpConfig.successHttpCode || '—' }}</a-descriptions-item>
            <a-descriptions-item label="数据编码">{{ record.httpConfig.charset || '—' }}</a-descriptions-item>
          </template>

          <template v-else-if="record.channelType === 'mq'">
            <a-descriptions-item label="队列种类">
              {{ (record.mqConfig.mqType || '').toUpperCase() }}
            </a-descriptions-item>
            <a-descriptions-item label="鉴权方式">{{ mqAuthLabel(record.mqConfig.authType) }}</a-descriptions-item>
            <a-descriptions-item label="接入地址" :span="2">
              {{
                record.mqConfig.mqType === 'rocketmq'
                  ? record.mqConfig.nameServer || '—'
                  : record.mqConfig.brokers || '—'
              }}
            </a-descriptions-item>
            <a-descriptions-item label="Topic / Queue">{{ record.mqConfig.topic || '—' }}</a-descriptions-item>
            <a-descriptions-item label="重试">
              {{ record.mqConfig.retry ?? '—' }} 次 / {{ record.mqConfig.retryIntervalMs ?? '—' }} ms
            </a-descriptions-item>
          </template>
        </a-descriptions>
      </a-card>
    </template>

    <a-card v-else class="content-card" :bordered="false">
      <a-spin :loading="loading" style="width: 100%; min-height: 120px" />
      <a-empty v-if="!loading" description="未找到该推送方案">
        <a-button type="primary" style="margin-top: 12px" @click="$router.push('/push/schemes')">返回列表</a-button>
      </a-empty>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import {
  channelLabel,
  dataScopeSummary,
  getPushScheme,
  pushFilterFieldOptions,
  pushFilterOpOptions,
  pushModeLabel,
  scheduleSummary,
  type PushScheme,
} from '@/api/push'
import { formatOrgSub } from '@/utils/orgDisplay'

const route = useRoute()
const router = useRouter()
const record = ref<PushScheme | null>(null)
const loading = ref(false)

const channelTip = computed(() => {
  if (!record.value) return ''
  if (record.value.channelType === 'mq') {
    return '中台作为生产端，将数据持续写入对端 Topic / Queue'
  }
  return '中台主动调用对端开放接口，POST JSON 报文推送单条 / 批量数据'
})

const filterColumns = [
  { title: '字段', dataIndex: 'fieldLabel', width: 120 },
  { title: '条件', dataIndex: 'opLabel', width: 100 },
  { title: '取值', dataIndex: 'value', ellipsis: true, tooltip: true },
]

const filterRows = computed(() =>
  (record.value?.filterRules || []).map((r) => ({
    id: r.id,
    fieldLabel: pushFilterFieldOptions.find((o) => o.value === r.field)?.label || r.field,
    opLabel: pushFilterOpOptions.find((o) => o.value === r.op)?.label || r.op,
    value: r.value || '—',
  })),
)

function httpAuthLabel(t: string) {
  if (t === 'token') return 'Token'
  if (t === 'appkey') return 'AppKey'
  return '无鉴权'
}

function mqAuthLabel(t: string) {
  if (t === 'sasl') return 'SASL'
  if (t === 'ssl') return 'SSL'
  return '无'
}

onMounted(async () => {
  loading.value = true
  try {
    record.value = await getPushScheme(String(route.params.id))
  } catch (e) {
    Message.error(e instanceof Error ? e.message : '加载失败')
    router.push('/push/schemes')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.detail-block {
  margin-bottom: 14px;
}
.detail-alert {
  margin-bottom: 16px;
}
.section-meta {
  margin: 14px 0 10px;
  font-size: 13px;
  color: #86909c;
}
.filter-table-wrap {
  margin-top: 4px;
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
</style>
