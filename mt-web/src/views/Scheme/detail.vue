<template>
  <div class="page-shell detail-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">接入方案详情</h2>
        <p class="page-desc">查看数据源类型与 JDBC 连接配置。</p>
      </div>
      <a-button @click="goBack">返回</a-button>
    </div>
    <a-card v-if="record" class="content-card detail-block" :bordered="false" title="对接策略">
      <a-descriptions :column="2" bordered size="large" :label-style="descLabelStyle">
        <a-descriptions-item label="方案名称">{{ record.name }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="record.status === 'enabled' ? 'green' : 'orangered'" size="small">
            {{ record.status === 'enabled' ? '开启' : '停用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="数据源类型" :span="2">{{ record.dataSourceTypeLabel || '—' }}</a-descriptions-item>
        <template v-if="(record.dataSourceType || 'table') === 'table'">
          <a-descriptions-item label="数据库类型">{{ record.jdbcDbTypeLabel || record.jdbcDbType || '—' }}</a-descriptions-item>
          <a-descriptions-item label="主机地址">{{ record.jdbcHost || '—' }}</a-descriptions-item>
          <a-descriptions-item label="端口">{{ record.jdbcPort || '—' }}</a-descriptions-item>
          <a-descriptions-item label="数据库名">{{ record.jdbcDatabase || '—' }}</a-descriptions-item>
          <a-descriptions-item label="Schema / 模式">{{ record.jdbcSchema || '—' }}</a-descriptions-item>
          <a-descriptions-item label="用户名">{{ record.jdbcUsername || '—' }}</a-descriptions-item>
          <a-descriptions-item label="密码">{{ record.jdbcPassword ? '******' : '—' }}</a-descriptions-item>
          <a-descriptions-item label="JDBC URL 预览" :span="2">{{ record.jdbcUrlPreview || '—' }}</a-descriptions-item>
          <a-descriptions-item label="抽取频次">{{ record.frequencyLabel }}</a-descriptions-item>
          <a-descriptions-item label="更新规则">{{ record.updateModeLabel }}</a-descriptions-item>
          <a-descriptions-item label="增量字段">{{ record.incrementField || '—' }}</a-descriptions-item>
          <a-descriptions-item label="失败重试次数">{{ record.retry }}</a-descriptions-item>
          <a-descriptions-item label="IP 白名单管控">{{ record.requireIpWhitelist ? '是' : '否' }}</a-descriptions-item>
        </template>
        <template v-else>
          <a-descriptions-item label="配置状态" :span="2">该数据源类型配置能力预留</a-descriptions-item>
        </template>
        <a-descriptions-item label="备注" :span="2">{{ record.remark || '—' }}</a-descriptions-item>
      </a-descriptions>
    </a-card>
    <a-card v-else class="content-card" :bordered="false">
      <a-empty description="未找到该接入方案">
        <a-button type="primary" style="margin-top: 12px" @click="$router.push('/scheme')">返回列表</a-button>
      </a-empty>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getScheme } from '@/api/mt'
import { usePageBack } from '@/composables/useUnsavedLeave'
import type { Scheme } from '@/mock/mt'

const route = useRoute()
const { goBack } = usePageBack('/scheme')
const record = ref<Scheme | null>(null)
const descLabelStyle = { width: '148px', minWidth: '148px', maxWidth: '148px' }

onMounted(async () => {
  record.value = await getScheme(String(route.params.id || ''))
})
</script>

<style scoped>
.detail-block {
  margin-bottom: 14px;
}
</style>
