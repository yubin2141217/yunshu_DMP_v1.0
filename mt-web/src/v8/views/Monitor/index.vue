<template>
  <div class="workplace-page">
    <div class="workplace-header">
      <div>
        <h2 class="workplace-title">供数监控</h2>
        <p class="workplace-desc">监控供数断流、拒收率突增、入库延迟与字段异常等情况，告警规则由平台统一下发，机构端可处置告警、设置通知订阅。</p>
      </div>
    </div>

    <a-card class="content-card" :bordered="false">
      <a-tabs v-model:active-key="activeTab" type="rounded">
        <!-- 告警记录 -->
        <a-tab-pane key="records" title="告警记录">
          <div class="v8-filter-grid v8-monitor-filters">
            <div class="v8-filter-item">
              <label>供数方</label>
              <a-select v-model="filters.supplierId" placeholder="全部供数方" allow-clear>
                <a-option v-for="o in supplierOpts" :key="o.value" :value="o.value" :label="o.label" />
              </a-select>
            </div>
            <div class="v8-filter-item">
              <label>级别</label>
              <a-select v-model="filters.level" placeholder="全部级别" allow-clear>
                <a-option value="high">高</a-option>
                <a-option value="mid">中</a-option>
                <a-option value="low">低</a-option>
              </a-select>
            </div>
            <div class="v8-filter-item">
              <label>类型</label>
              <a-select v-model="filters.type" placeholder="全部类型" allow-clear>
                <a-option v-for="(label, key) in alertTypeLabels" :key="key" :value="key">{{ label }}</a-option>
              </a-select>
            </div>
            <div class="v8-filter-item">
              <label>状态</label>
              <a-select v-model="filters.status" placeholder="全部状态" allow-clear>
                <a-option v-for="(m, k) in alertStatusMeta" :key="k" :value="k">{{ m.label }}</a-option>
              </a-select>
            </div>
            <div class="v8-filter-actions">
              <a-button type="primary" @click="fetchAlerts(1)">查询</a-button>
            </div>
          </div>

          <a-table :columns="alertColumns" :data="alerts" :loading="loading" row-key="id" :pagination="false" stripe>
            <template #level="{ record }">
              <a-tag :color="levelMeta(record.level).color" size="small">{{ levelMeta(record.level).label }}</a-tag>
            </template>
            <template #type="{ record }">{{ typeLabel(record.type) }}</template>
            <template #status="{ record }">
              <a-tag :color="statusMeta(record.status).color" size="small">{{ statusMeta(record.status).label }}</a-tag>
            </template>
            <template #operations="{ record }">
              <div class="v8-op-links">
                <a-link @click="openAlert(record, 'view')">详情</a-link>
                <a-link v-if="record.status === 'pending'" class="v8-op-dispose" @click="openAlert(record, 'dispose')">处理</a-link>
              </div>
            </template>
            <template #empty><a-empty description="暂无告警记录" /></template>
          </a-table>

          <div class="table-footer">
            <a-pagination
              class="table-footer-right"
              v-model:current="page.current"
              :total="page.total"
              :page-size="page.pageSize"
              show-total
              show-page-size
              show-jumper
              @change="fetchAlerts"
              @page-size-change="onAlertPageSize"
            />
          </div>
        </a-tab-pane>

        <!-- 订阅设置 -->
        <a-tab-pane key="subscribe" title="订阅设置">
          <a-alert type="info" class="v8-sub-note">
            <div class="v8-sub-tip">
              <p>· <b>接收级别</b>可多选，为「勾选即推送」的并集关系：例如同时勾选「高」「低」，则该类告警触发时高级与低级都会推送、中级不推送；全部不勾则该类型不推送。</p>
              <p>· <b>通知对象</b>为本机构接收成员，所选「通知渠道」都会投递给这批成员（站内信发送至其消息中心，邮件/微信按其在个人设置绑定的账号投递）。</p>
              <p>· 免打扰时段内，除高级（高）告警外的其他级别将顺延至时段结束后推送；微信渠道需成员先在个人设置扫码绑定。</p>
            </div>
          </a-alert>
          <a-table :columns="subColumns" :data="subs" :pagination="false" row-key="id">
            <template #type="{ record }">{{ typeLabel(record.type) }}</template>
            <template #levels="{ record }">
              <a-checkbox-group v-model="record.levels" direction="horizontal" :disabled="!record.enabled">
                <a-checkbox value="high">高</a-checkbox>
                <a-checkbox value="mid">中</a-checkbox>
                <a-checkbox value="low">低</a-checkbox>
              </a-checkbox-group>
            </template>
            <template #channels="{ record }">
              <a-checkbox-group v-model="record.channels" direction="horizontal" :disabled="!record.enabled">
                <a-checkbox value="inbox">站内信</a-checkbox>
                <a-checkbox value="wechat">微信</a-checkbox>
                <a-checkbox value="email">邮件</a-checkbox>
              </a-checkbox-group>
            </template>
            <template #receivers="{ record }">
              <a-select
                v-model="record.receiverIds"
                :options="receiverOptions"
                multiple
                allow-search
                :disabled="!record.enabled"
                placeholder="选择接收成员"
                :max-tag-count="2"
                style="min-width: 200px; max-width: 260px"
              />
            </template>
            <template #quiet="{ record }">
              <a-time-picker v-model="record.quietStart" format="HH:mm" value-format="HH:mm" :disabled="!record.enabled" style="width: 90px" />
              <span style="margin: 0 6px; color: #a9aeb8">至</span>
              <a-time-picker v-model="record.quietEnd" format="HH:mm" value-format="HH:mm" :disabled="!record.enabled" style="width: 90px" />
            </template>
            <template #enabled="{ record }">
              <a-switch v-model="record.enabled" />
            </template>
          </a-table>
          <div class="v8-sub-actions">
            <a-button type="primary" :loading="saving" @click="saveSubs">保存订阅</a-button>
          </div>
        </a-tab-pane>

        <!-- 告警规则（只读） -->
        <a-tab-pane key="rules" title="告警规则">
          <a-alert type="info" class="v8-sub-note">
            告警阈值规则由平台运营统一配置与下发，机构端仅可查看；如需调整请联系平台运营。
          </a-alert>
          <a-table :columns="ruleColumns" :data="rules" :loading="rulesLoading" :pagination="false" row-key="id">
            <template #type="{ record }">{{ typeLabel(record.type) }}</template>
            <template #level="{ record }">
              <a-tag :color="levelMeta(record.level).color" size="small">{{ levelMeta(record.level).label }}</a-tag>
            </template>
            <template #enabled="{ record }">
              <a-tag :color="record.enabled ? 'green' : 'gray'" size="small">{{ record.enabled ? '启用' : '停用' }}</a-tag>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 告警详情/处置抽屉（footer 关闭：详情/处置操作均在内容区，避免出现无功能的默认确定按钮） -->
    <a-drawer :visible="drawerVisible" :width="560" :footer="false" @cancel="drawerVisible = false">
      <template #title>告警详情与处置</template>
      <template v-if="current">
        <a-descriptions :column="1" bordered size="large">
          <a-descriptions-item label="告警类型">{{ alertTypeLabels[current.type] }}</a-descriptions-item>
          <a-descriptions-item label="级别">
            <a-tag :color="alertLevelMeta[current.level].color" size="small">{{ alertLevelMeta[current.level].label }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="供数方">{{ current.supplierName }}</a-descriptions-item>
          <a-descriptions-item label="触发规则">{{ current.ruleName }}</a-descriptions-item>
          <a-descriptions-item label="触发值">{{ current.triggerValue }}</a-descriptions-item>
          <a-descriptions-item label="阈值">{{ current.threshold }}</a-descriptions-item>
          <a-descriptions-item label="触发时间">{{ current.triggeredAt }}</a-descriptions-item>
          <a-descriptions-item label="当前状态">
            <a-tag :color="alertStatusMeta[current.status].color" size="small">{{ alertStatusMeta[current.status].label }}</a-tag>
          </a-descriptions-item>
        </a-descriptions>

        <div class="v8-timeline-title">处置记录</div>
        <a-timeline class="v8-timeline">
          <a-timeline-item v-for="(n, i) in current.timeline" :key="i" :label="n.at">
            <div class="v8-tl-action">{{ n.action }} · {{ n.operator }}</div>
            <div class="v8-tl-note" v-if="n.note">{{ n.note }}</div>
          </a-timeline-item>
        </a-timeline>

        <!-- view：仅查看详情 + 处置记录；对仍可处置的告警提供「处置此告警」入口 -->
        <template v-if="drawerMode === 'view'">
          <div v-if="canDispose" class="v8-view-dispose-entry">
            <a-button type="primary" @click="enterDispose">
              <template #icon><IconEdit /></template>
              处置此告警
            </a-button>
          </div>
        </template>

        <!-- dispose：展开处置动作表单 -->
        <template v-else>
          <a-divider />
          <div ref="disposeFormRef" class="v8-dispose-form">
            <div class="v8-form-label">处置动作</div>
            <a-radio-group v-model="disposeAction" direction="vertical">
              <a-radio value="confirm">确认异常（记录并继续跟进）</a-radio>
              <a-radio value="processing">标记处理中</a-radio>
              <a-radio value="transfer">转供方整改</a-radio>
              <a-radio value="ignore">忽略（误报/无需处理）</a-radio>
            </a-radio-group>
            <div class="v8-form-label" style="margin-top: 14px">处置说明</div>
            <a-textarea v-model="disposeNote" placeholder="请填写处置说明（必填）" :max-length="200" show-word-limit />
            <div class="v8-dispose-actions">
              <a-button @click="drawerMode = 'view'">返回详情</a-button>
              <a-button type="primary" :loading="disposing" @click="submitDispose">提交处置</a-button>
            </div>
          </div>
        </template>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconEdit } from '@arco-design/web-vue/es/icon'
import {
  disposeAlert,
  getAlerts,
  getAlertRules,
  getSubscriptions,
  saveSubscriptions,
} from '@/v8/api/monitor'
import { supplierOptions } from '@/v8/api/data'
import { getOrgUsers } from '@/v8/api/system'
import {
  alertLevelMeta,
  alertStatusMeta,
  alertTypeLabels,
  type AlertLevel,
  type AlertRecord,
  type AlertRule,
  type AlertStatus,
  type AlertSubscription,
  type AlertType,
  type DisposeAction,
  type OrgUser,
  type V8Role,
} from '@/v8/mock/types'

const levelMeta = (l: AlertLevel) => alertLevelMeta[l]
const statusMeta = (s: AlertStatus) => alertStatusMeta[s]
const typeLabel = (t: AlertType) => alertTypeLabels[t]
const roleLabel = (r: V8Role) => (r === 'admin' ? '机构管理员' : r === 'duty' ? '值班人员' : '只读人员')

const route = useRoute()
const activeTab = ref('records')
const supplierOpts = ref<{ label: string; value: string }[]>([])
const loading = ref(false)
const alerts = ref<AlertRecord[]>([])
const filters = reactive({
  supplierId: '',
  level: '' as AlertLevel | '',
  type: '' as AlertType | '',
  status: '' as AlertStatus | '',
})
const page = reactive({ current: 1, pageSize: 10, total: 0 })

const alertColumns = [
  { title: '级别', dataIndex: 'level', slotName: 'level', width: 70 },
  { title: '类型', dataIndex: 'type', slotName: 'type', width: 120 },
  { title: '供数方', dataIndex: 'supplierName', ellipsis: true, tooltip: true },
  { title: '触发规则', dataIndex: 'ruleName', width: 180, ellipsis: true, tooltip: true },
  { title: '触发值', dataIndex: 'triggerValue', width: 160 },
  { title: '触发时间', dataIndex: 'triggeredAt', width: 160 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 90 },
  { title: '操作', dataIndex: 'operations', slotName: 'operations', width: 110 },
]

async function fetchAlerts(p = page.current) {
  loading.value = true
  try {
    const res = await getAlerts({ ...filters, page: p, pageSize: page.pageSize })
    alerts.value = res.list
    page.current = p
    page.total = res.total
  } finally {
    loading.value = false
  }
}

function onAlertPageSize(size: number) {
  page.pageSize = size
  fetchAlerts(1)
}

// 详情 / 处置
const drawerVisible = ref(false)
/** view=仅查看详情；dispose=从列表「处理」进入，定位到处置区 */
const drawerMode = ref<'view' | 'dispose'>('view')
const current = ref<AlertRecord | null>(null)
const disposeAction = ref<DisposeAction>('confirm')
const disposeNote = ref('')
const disposing = ref(false)
const disposeFormRef = ref<HTMLElement | null>(null)

/** 仅「待处理」告警可发起处置（与列表「处理」按钮显隐口径一致） */
const canDispose = computed(() => current.value?.status === 'pending')

function openAlert(row: AlertRecord, mode: 'view' | 'dispose' = 'view') {
  current.value = row
  drawerMode.value = mode
  disposeAction.value = 'confirm'
  disposeNote.value = ''
  drawerVisible.value = true
  // 「处理」入口：抽屉渲染后滚动定位到处置表单
  if (mode === 'dispose') {
    setTimeout(() => disposeFormRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120)
  }
}

/** 详情抽屉内点击「处置此告警」，切换到处置表单 */
function enterDispose() {
  drawerMode.value = 'dispose'
  setTimeout(() => disposeFormRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60)
}

async function submitDispose() {
  if (!disposeNote.value.trim()) {
    Message.warning('请填写处置说明')
    return
  }
  if (!current.value) return
  disposing.value = true
  try {
    const updated = await disposeAlert(current.value.id, { action: disposeAction.value, note: disposeNote.value.trim() })
    if (updated) current.value = updated
    Message.success('处置已提交')
    drawerVisible.value = false
    fetchAlerts(page.current)
  } finally {
    disposing.value = false
  }
}

// 订阅（复选框双向绑定使用宽松的 string[]，提交时转回领域类型）
type SubEditable = Omit<AlertSubscription, 'levels' | 'channels'> & {
  levels: string[]
  channels: string[]
}
const subs = ref<SubEditable[]>([])
const saving = ref(false)
const orgMembers = ref<OrgUser[]>([])
// 仅启用状态的成员可作为通知对象；label 附带角色便于区分同名
const receiverOptions = computed(() =>
  orgMembers.value
    .filter((m) => m.status === 'enabled')
    .map((m) => ({ label: `${m.name}（${roleLabel(m.role)}）`, value: m.id })),
)
const subColumns = [
  { title: '告警类型', dataIndex: 'type', slotName: 'type', width: 110 },
  { title: '接收级别', dataIndex: 'levels', slotName: 'levels', width: 180 },
  { title: '通知渠道', dataIndex: 'channels', slotName: 'channels', width: 200 },
  { title: '通知对象', dataIndex: 'receiverIds', slotName: 'receivers', width: 240 },
  { title: '免打扰时段', dataIndex: 'quiet', slotName: 'quiet', width: 230 },
  { title: '启用', dataIndex: 'enabled', slotName: 'enabled', width: 70 },
]

async function loadSubs() {
  subs.value = await getSubscriptions()
}

async function saveSubs() {
  // 启用行校验：至少勾选一个级别、一个渠道、一个接收人
  const invalid = subs.value.find((s) => {
    if (!s.enabled) return false
    return s.levels.length === 0 || s.channels.length === 0 || s.receiverIds.length === 0
  })
  if (invalid) {
    Message.warning(`「${typeLabel(invalid.type)}」已启用，请至少选择一个接收级别、一个通知渠道和一个通知对象`)
    return
  }
  saving.value = true
  try {
    await saveSubscriptions(subs.value as AlertSubscription[])
    Message.success('订阅设置已保存')
  } finally {
    saving.value = false
  }
}

// 规则（只读）
const rules = ref<AlertRule[]>([])
const rulesLoading = ref(false)
const ruleColumns = [
  { title: '规则名称', dataIndex: 'name' },
  { title: '类型', dataIndex: 'type', slotName: 'type', width: 120 },
  { title: '级别', dataIndex: 'level', slotName: 'level', width: 80 },
  { title: '阈值', dataIndex: 'threshold', width: 200 },
  { title: '状态', dataIndex: 'enabled', slotName: 'enabled', width: 90 },
  { title: '更新时间', dataIndex: 'updatedAt', width: 170 },
]

async function loadRules() {
  rulesLoading.value = true
  try {
    rules.value = await getAlertRules()
  } finally {
    rulesLoading.value = false
  }
}

onMounted(() => {
  supplierOpts.value = supplierOptions()
  getOrgUsers().then((list) => { orgMembers.value = list })
  // 数据概览下钻回填：?status=pending / ?type=break|reject|delay|field
  const q = route.query
  if (q.status === 'pending' || q.status === 'processing' || q.status === 'resolved' || q.status === 'ignored') {
    filters.status = q.status
  }
  if (q.type === 'break' || q.type === 'reject' || q.type === 'delay' || q.type === 'field') {
    filters.type = q.type
  }
  fetchAlerts(1)
  loadSubs()
  loadRules()
})
</script>

<style lang="scss" scoped>
.v8-sub-note {
  margin-bottom: 16px;
}
/* 操作列：详情 / 处理 分开展示 */
.v8-op-links {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}
.v8-op-dispose {
  font-weight: 500;
}
.v8-sub-tip p {
  margin: 0;
  line-height: 1.9;
}
.v8-sub-actions {
  margin-top: 18px;
  text-align: right;
}
.v8-timeline-title {
  font-weight: 600;
  color: #1d2129;
  margin: 20px 0 12px;
}
.v8-tl-action {
  font-weight: 500;
  color: #1d2129;
}
.v8-tl-note {
  font-size: 13px;
  color: #86909c;
  margin-top: 2px;
}
.v8-form-label {
  font-size: 13px;
  color: #4e5969;
  margin-bottom: 8px;
}
.v8-dispose-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}
/* 详情视图底部的处置入口 */
.v8-view-dispose-entry {
  margin-top: 20px;
  text-align: right;
}
</style>
