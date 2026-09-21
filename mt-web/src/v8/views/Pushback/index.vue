<template>
  <div class="workplace-page">
    <div class="workplace-header">
      <div>
        <h2 class="workplace-title">推送回流查看</h2>
        <p class="workplace-desc">查看平台向各供数方推送数据的批次回执情况，包括成功/失败、耗时、重试与回执状态；仅含您可见范围内的供数方。</p>
      </div>
      <div class="v8-summary-stats">
        <span>批次<strong>{{ pagination.total }}</strong></span>
        <span>待回执<strong>{{ waitingCount }}</strong></span>
      </div>
    </div>

    <a-card class="content-card" :bordered="false">
      <div class="v8-filter-grid">
        <div class="v8-filter-item">
          <label>供数方</label>
          <a-select v-model="filters.supplierId" placeholder="全部供数方" allow-clear>
            <a-option v-for="o in supplierOpts" :key="o.value" :value="o.value" :label="o.label" />
          </a-select>
        </div>
        <div class="v8-filter-item">
          <label>推送结果</label>
          <a-select v-model="filters.result">
            <a-option value="all">全部结果</a-option>
            <a-option value="success">成功</a-option>
            <a-option value="fail">失败</a-option>
          </a-select>
        </div>
        <div class="v8-filter-actions">
          <a-button type="primary" @click="fetchData(1)">查询</a-button>
          <a-button @click="onReset">重置</a-button>
        </div>
      </div>

      <a-table :columns="columns" :data="list" :loading="loading" row-key="id" :pagination="false" stripe>
        <template #receiptStatus="{ record }">
          <a-tag :color="receiptOf(record.receiptStatus).color" size="small">
            {{ receiptOf(record.receiptStatus).label }}
          </a-tag>
        </template>
        <template #result="{ record }">
          <span class="v8-text-ok">{{ record.success }}</span>
          <span v-if="record.fail" class="v8-text-bad"> / {{ record.fail }}</span>
        </template>
        <template #operations="{ record }">
          <a-link @click="openDetail(record)">详情</a-link>
        </template>
        <template #empty><a-empty description="暂无推送批次" /></template>
      </a-table>

      <div class="table-footer">
        <a-pagination
          class="table-footer-right"
          v-model:current="pagination.current"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          show-total
          show-page-size
          show-jumper
          @change="fetchData"
          @page-size-change="onPageSize"
        />
      </div>
    </a-card>

    <a-drawer :visible="detailVisible" :width="480" @cancel="detailVisible = false">
      <template #title>推送批次详情</template>
      <template v-if="current">
        <a-descriptions :column="1" bordered size="large">
          <a-descriptions-item label="批次号">{{ current.batchNo }}</a-descriptions-item>
          <a-descriptions-item label="接入方案">{{ current.schemeName }}</a-descriptions-item>
          <a-descriptions-item label="供数方">{{ current.supplierName }}</a-descriptions-item>
          <a-descriptions-item label="推送时间">{{ current.pushedAt }}</a-descriptions-item>
          <a-descriptions-item label="总数 / 成功 / 失败">{{ current.total }} / {{ current.success }} / {{ current.fail }}</a-descriptions-item>
          <a-descriptions-item label="耗时">{{ current.costMs }} ms</a-descriptions-item>
          <a-descriptions-item label="重试次数">{{ current.retryCount }}</a-descriptions-item>
          <a-descriptions-item label="回执状态">
            <a-tag :color="receiptMeta[current.receiptStatus].color" size="small">{{ receiptMeta[current.receiptStatus].label }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="最近回执时间">{{ current.lastReceiptAt || '暂无' }}</a-descriptions-item>
        </a-descriptions>

        <template v-if="current.failReasons.length">
          <div class="section-title v8-fr-title">失败原因分布</div>
          <div v-for="r in current.failReasons" :key="r.reason" class="v8-fr-row">
            <span>{{ r.reason }}</span>
            <a-tag color="red" size="small">{{ r.count }}</a-tag>
          </div>
        </template>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { getPushBatches } from '@/v8/api/monitor'
import { supplierOptions } from '@/v8/api/data'
import { receiptMeta, type PushBatch, type ReceiptStatus } from '@/v8/mock/types'

const receiptOf = (s: ReceiptStatus) => receiptMeta[s]

const supplierOpts = ref<{ label: string; value: string }[]>([])
const loading = ref(false)
const list = ref<PushBatch[]>([])
const waitingCount = ref(0)
const filters = reactive({ supplierId: '', result: 'all' as 'all' | 'success' | 'fail' })
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })

const columns = [
  { title: '批次号', dataIndex: 'batchNo', width: 170 },
  { title: '供数方', dataIndex: 'supplierName', ellipsis: true, tooltip: true },
  { title: '接入方案', dataIndex: 'schemeName', width: 150, ellipsis: true, tooltip: true },
  { title: '推送时间', dataIndex: 'pushedAt', width: 160 },
  { title: '成功/失败', dataIndex: 'result', slotName: 'result', width: 110 },
  { title: '耗时(ms)', dataIndex: 'costMs', width: 100 },
  { title: '回执', dataIndex: 'receiptStatus', slotName: 'receiptStatus', width: 90 },
  { title: '操作', dataIndex: 'operations', slotName: 'operations', width: 70 },
]

async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const res = await getPushBatches({ ...filters, page, pageSize: pagination.pageSize })
    list.value = res.list
    pagination.current = page
    pagination.total = res.total
    waitingCount.value = res.list.filter((b) => b.receiptStatus === 'waiting').length
  } finally {
    loading.value = false
  }
}

function onPageSize(size: number) {
  pagination.pageSize = size
  fetchData(1)
}

function onReset() {
  filters.supplierId = ''
  filters.result = 'all'
  fetchData(1)
}

const detailVisible = ref(false)
const current = ref<PushBatch | null>(null)
function openDetail(row: PushBatch) {
  current.value = row
  detailVisible.value = true
}

onMounted(() => {
  supplierOpts.value = supplierOptions()
  fetchData(1)
})
</script>

<style lang="scss" scoped>
.v8-text-ok { color: #00b42a; }
.v8-text-bad { color: #f53f3f; }
.v8-fr-title {
  margin: 20px 0 12px;
}
.v8-fr-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f7f8fa;
  color: #4e5969;
}
</style>
