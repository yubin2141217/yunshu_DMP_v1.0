<template>
  <div class="workplace-page">
    <div class="workplace-header">
      <div>
        <h2 class="workplace-title">接入规范</h2>
        <p class="workplace-desc">
          查看本机构已开通的接入方案，可预览下载并提供给各供数商。
        </p>
      </div>
    </div>

    <a-card class="content-card" :bordered="false">
      <!-- 筛选 -->
      <div class="v8-filter-grid">
        <div class="v8-filter-item">
          <label>方案名称</label>
          <a-input
            v-model="filterForm.name"
            placeholder="请输入方案名称"
            allow-clear
            @press-enter="applyFilters"
          />
        </div>
        <div class="v8-filter-item">
          <label>字段信息</label>
          <a-input
            v-model="filterForm.field"
            placeholder="请输入字段名 / 描述"
            allow-clear
            @press-enter="applyFilters"
          />
        </div>
        <div class="v8-filter-item">
          <label>供数方</label>
          <a-select v-model="filterForm.supplier" placeholder="全部供数方" allow-clear>
            <a-option v-for="s in supplierOptions" :key="s.value" :value="s.value">{{ s.label }}</a-option>
          </a-select>
        </div>
        <div class="v8-filter-actions">
          <a-button type="primary" @click="applyFilters">查询</a-button>
          <a-button @click="resetFilters">重置</a-button>
        </div>
      </div>

      <a-table
        :columns="columns"
        :data="filteredSpecs"
        :pagination="{ pageSize: 10, hideOnSinglePage: true }"
        :bordered="false"
        stripe
        row-key="id"
      >
        <template #name="{ record }">
          <a-button type="text" size="small" class="v8-spec-name-btn" @click="openDetail(record)">
            {{ record.name }}
          </a-button>
          <div class="v8-spec-name-summary" :title="record.summary">{{ record.summary || '—' }}</div>
        </template>
        <template #supplier="{ record }">
          <a-link v-if="record.supplierId" @click="openSupplier(record)">{{ record.supplierName || '—' }}</a-link>
          <span v-else>{{ record.supplierName || '—' }}</span>
        </template>
        <template #fieldCount="{ record }">
          <a-link v-if="record.fields?.length" @click="openFields(record)">{{ record.fields.length }}</a-link>
          <span v-else>0</span>
        </template>
        <template #ops="{ record }">
          <a-button type="text" size="small" :loading="downloadingId === record.id" @click="onDownload(record)">
            下载文档
          </a-button>
        </template>
        <template #empty><a-empty description="暂无符合条件的接入方案" /></template>
      </a-table>
    </a-card>

    <!-- 方案详情抽屉 -->
    <a-drawer
      :visible="detailVisible"
      :width="760"
      :footer="false"
      :mask-closable="true"
      unmount-on-close
      @cancel="detailVisible = false"
    >
      <template #title>
        <span class="v8-drawer-title">接入方案详情</span>
      </template>
      <template v-if="active">
        <div class="v8-detail-section">
          <div class="v8-detail-h">基本信息</div>
          <table class="v8-kv">
            <tbody>
              <tr><th>方案 ID</th><td>{{ active.id }}</td></tr>
              <tr><th>方案编号</th><td>{{ active.schemeNo || '—' }}</td></tr>
              <tr><th>方案名称</th><td>{{ active.name }}</td></tr>
              <tr><th>供数方</th><td>{{ active.supplierName || '—' }}</td></tr>
              <tr><th>接入方式</th><td>{{ accessMethodText(active.accessMethod) }}</td></tr>
              <tr><th>IP 白名单</th><td>{{ active.requireIpWhitelist ? '是' : '否' }}</td></tr>
              <tr><th>发布时间</th><td>{{ active.publishedAt || '—' }}</td></tr>
              <tr><th>方案摘要</th><td>{{ active.summary || active.remark || '—' }}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="v8-detail-section">
          <div class="v8-detail-h">字段列表（{{ active.fields?.length || 0 }}）</div>
          <a-table
            :columns="fieldColumns"
            :data="active.fields || []"
            :pagination="{ pageSize: 10, showTotal: true }"
            :bordered="false"
            size="small"
            row-key="id"
          >
            <template #required="{ record }">
              <a-tag :color="record.required ? 'red' : 'gray'" size="small">{{ requiredText(record.required) }}</a-tag>
            </template>
            <template #empty><a-empty description="暂无字段" /></template>
          </a-table>
        </div>

        <div class="v8-detail-section">
          <div class="v8-detail-h">操作记录</div>
          <a-table
            :columns="opLogColumns"
            :data="active.opLogs || []"
            :pagination="false"
            :bordered="false"
            size="small"
            row-key="id"
          >
            <template #action="{ record }">
              <a-tag :color="opActionColor(record.action)" size="small">
                {{ opActionText(record.action) }}
              </a-tag>
            </template>
            <template #empty><a-empty description="暂无操作记录" /></template>
          </a-table>
        </div>
      </template>
    </a-drawer>

    <!-- 字段列表抽屉（列表「字段数」点击打开） -->
    <a-drawer
      :visible="fieldsVisible"
      :width="640"
      :footer="false"
      :mask-closable="true"
      unmount-on-close
      @cancel="fieldsVisible = false"
    >
      <template #title>
        <span class="v8-drawer-title">{{ fieldsActive?.name }} · 字段列表（{{ fieldsActive?.fields?.length || 0 }}）</span>
      </template>
      <a-table
        :columns="fieldColumns"
        :data="fieldsActive?.fields || []"
        :pagination="{ pageSize: 10, showTotal: true }"
        :bordered="false"
        size="small"
        row-key="id"
      >
        <template #required="{ record }">
          <a-tag :color="record.required ? 'red' : 'gray'" size="small">{{ requiredText(record.required) }}</a-tag>
        </template>
        <template #empty><a-empty description="暂无字段" /></template>
      </a-table>
    </a-drawer>

    <!-- 供数方详情抽屉（列表「供数方」点击打开） -->
    <a-drawer
      :visible="supplierVisible"
      :width="520"
      :footer="false"
      :mask-closable="true"
      unmount-on-close
      @cancel="supplierVisible = false"
    >
      <template #title>供数方详情</template>
      <template v-if="supplierActive">
        <div class="v8-sup-head">
          <div>
            <div class="v8-sup-name">{{ supplierActive.name }}</div>
            <div class="v8-sup-code">编码：{{ supplierActive.code }}</div>
          </div>
          <a-badge :status="badgeOf(supplierActive.health).status" :text="badgeOf(supplierActive.health).label" />
        </div>

        <a-descriptions :column="1" bordered size="large" class="v8-sup-desc">
          <a-descriptions-item label="启用状态">{{ supplierActive.status === 'enabled' ? '启用' : '停用' }}</a-descriptions-item>
          <a-descriptions-item label="今日入库">{{ Number(supplierActive.todayCount).toLocaleString('zh-CN') }} 条</a-descriptions-item>
          <a-descriptions-item label="今日拒收率">{{ supplierActive.todayRejectRate }}%</a-descriptions-item>
          <a-descriptions-item label="最近推送">{{ supplierActive.lastPushAt || '暂无' }}</a-descriptions-item>
          <a-descriptions-item label="信息更新时间">{{ supplierActive.updatedAt }}</a-descriptions-item>
        </a-descriptions>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { getEnabledStandards } from '@/v8/api/v8'
import { getAllSuppliers } from '@/v8/api/data'
import { logSpecDownload } from '@/v8/api/system'
import { currentUserName } from '@/v8/api/scope'
import { schemeOpActionLabel, type Standard, type SchemeOpAction } from '@/v8/mock/v8'
import { healthMeta, type Health, type Supplier } from '@/v8/mock/types'
import { downloadApiDocPdf } from '@/v8/utils/downloadApiDocPdf'
import { buildStandardDocHtml } from '@/v8/utils/buildStandardDocHtml'

// ── 接入方案列表 ──
const specs = ref<Standard[]>([])
const downloadingId = ref('')

// ── 筛选（输入态与已应用条件分离，点查询后生效）──
const filterForm = reactive({ name: '', field: '', supplier: undefined as string | undefined })
const applied = reactive({ name: '', field: '', supplier: undefined as string | undefined })

const supplierOptions = computed(() => {
  const map = new Map<string, string>()
  specs.value.forEach((s) => {
    const key = s.supplierId || s.supplierName || ''
    if (key && s.supplierName) map.set(key, s.supplierName)
  })
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
})

const filteredSpecs = computed(() => {
  const nameKw = applied.name.trim().toLowerCase()
  const fieldKw = applied.field.trim().toLowerCase()
  return specs.value.filter((s) => {
    if (nameKw && !(s.name || '').toLowerCase().includes(nameKw)) return false
    if (applied.supplier) {
      const key = s.supplierId || s.supplierName || ''
      if (key !== applied.supplier) return false
    }
    if (fieldKw) {
      const hit = (s.fields || []).some(
        (f) =>
          (f.name || '').toLowerCase().includes(fieldKw) ||
          (f.description || '').toLowerCase().includes(fieldKw),
      )
      if (!hit) return false
    }
    return true
  })
})

function applyFilters() {
  applied.name = filterForm.name
  applied.field = filterForm.field
  applied.supplier = filterForm.supplier
}

function resetFilters() {
  filterForm.name = ''
  filterForm.field = ''
  filterForm.supplier = undefined
  applyFilters()
}

const columns = [
  { title: '方案名称', dataIndex: 'name', slotName: 'name', ellipsis: true, tooltip: true },
  { title: '供数方', dataIndex: 'supplier', slotName: 'supplier', width: 110 },
  { title: '字段数', dataIndex: 'fieldCount', slotName: 'fieldCount', width: 84, align: 'center' as const },
  { title: '发布时间', dataIndex: 'publishedAt', width: 168 },
  { title: '操作', dataIndex: 'ops', slotName: 'ops', width: 104 },
]

// ── 详情抽屉 ──
const detailVisible = ref(false)
const active = ref<Standard | null>(null)

function openDetail(record: Standard) {
  active.value = record
  detailVisible.value = true
}

// ── 字段列表抽屉（列表「字段数」点击打开）──
const fieldsVisible = ref(false)
const fieldsActive = ref<Standard | null>(null)

function openFields(record: Standard) {
  fieldsActive.value = record
  fieldsVisible.value = true
}

// ── 供数方详情抽屉（列表「供数方」点击打开，不跳转页面）──
const supplierVisible = ref(false)
const supplierActive = ref<Supplier | null>(null)

const supplierBadgeMap: Record<Health, { status: 'success' | 'processing' | 'danger' | 'normal' }> = {
  healthy: { status: 'success' },
  active: { status: 'processing' },
  error: { status: 'danger' },
  disabled: { status: 'normal' },
}
function badgeOf(h: Health) {
  return { ...supplierBadgeMap[h], label: healthMeta[h].label }
}

function openSupplier(record: Standard) {
  if (!record.supplierId) return
  const target = getAllSuppliers().find((s) => s.id === record.supplierId)
  if (!target) {
    Message.warning('未找到对应供数方信息')
    return
  }
  supplierActive.value = target
  supplierVisible.value = true
}

const fieldColumns = [
  { title: '字段名', dataIndex: 'name', width: 150 },
  { title: '描述', dataIndex: 'description' },
  { title: '类型', dataIndex: 'dataType', width: 100 },
  { title: '必填', dataIndex: 'required', slotName: 'required', width: 70 },
  { title: '长度', dataIndex: 'length', width: 70 },
]

const opLogColumns = [
  { title: '时间', dataIndex: 'operatedAt', width: 172, cellStyle: { whiteSpace: 'nowrap' } },
  { title: '操作', dataIndex: 'action', slotName: 'action', width: 80 },
  { title: '内容', dataIndex: 'summary', minWidth: 160 },
  { title: '操作人', dataIndex: 'operator', width: 96 },
]

function accessMethodText(method?: string): string {
  if (method === 'mq') return '消息队列'
  if (method === 'file') return '文件传输'
  return 'HTTP/HTTPS POST 推送'
}

function opActionText(action: SchemeOpAction): string {
  return schemeOpActionLabel(action)
}

function opActionColor(action: SchemeOpAction): string {
  if (action === 'download') return 'arcoblue'
  if (action === 'enable') return 'green'
  if (action === 'disable') return 'orangered'
  if (action === 'create') return 'arcoblue'
  return 'gray'
}

function requiredText(value: boolean | null | undefined) {
  if (value === true) return '必填'
  if (value === false) return '选填'
  return '—'
}

// ── 下载文档（PDF，Word 样式排版，对齐 MT 端）──
async function onDownload(record: Standard) {
  downloadingId.value = record.id
  try {
    const html = buildStandardDocHtml(record)
    const fileName = (record.fileName || `${record.name}-接口文档`).replace(/\.(md|docx?)$/i, '')
    await downloadApiDocPdf(html, fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`)
    // 留痕：写入下载审计 + 本地操作记录
    await logSpecDownload(`方案-${record.name}`)
    record.opLogs = [
      {
        id: `op_dl_${Date.now()}`,
        action: 'download',
        summary: '下载文档',
        operator: currentUserName() || '机构用户',
        operatedAt: new Date().toLocaleString('sv-SE').replace('T', ' '),
      },
      ...(record.opLogs || []),
    ]
    Message.success('已开始下载文档')
  } catch (e) {
    Message.error((e as Error).message || '下载失败')
  } finally {
    downloadingId.value = ''
  }
}

onMounted(async () => {
  specs.value = await getEnabledStandards()
})
</script>

<style lang="scss" scoped>
.v8-spec-name-btn {
  display: block;
  max-width: 100%;
  height: auto;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}
.v8-spec-name-summary {
  margin-top: 2px;
  max-width: 100%;
  font-size: 12px;
  color: #86909c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.v8-drawer-title {
  font-weight: 600;
}

.v8-detail-section {
  margin-bottom: 24px;
}
.v8-detail-h {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid rgb(var(--primary-6));
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}

.v8-kv {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th,
  td {
    border: 1px solid #e5e6eb;
    padding: 8px 10px;
    text-align: left;
    vertical-align: top;
    word-break: break-word;
  }
  th {
    width: 96px;
    background: #fafafa;
    color: #86909c;
    font-weight: 500;
    white-space: nowrap;
  }
}

/* 供数方详情抽屉 */
.v8-sup-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}
.v8-sup-name {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}
.v8-sup-code {
  margin-top: 4px;
  font-size: 13px;
  color: #86909c;
}
</style>
