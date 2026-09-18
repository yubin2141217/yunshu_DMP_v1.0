<template>
  <div class="v8-page">
    <div class="v8-backdrop" aria-hidden="true" />

    <div class="v8-modal" role="dialog" aria-modal="true" aria-labelledby="v8-modal-title">
      <div class="v8-modal__glow" aria-hidden="true" />
      <div class="v8-modal__header">
        <div class="v8-modal__icon" aria-hidden="true">
          <IconCommon />
        </div>
        <div class="v8-modal__titles">
          <h2 id="v8-modal-title" class="v8-modal__title">调用 V8 应用集成管理中心标准页面</h2>
          <p class="v8-modal__subtitle">{{ pageTitle }} · 标准页面接入 · 无需二次开发</p>
        </div>
      </div>

      <div class="v8-modal__body">
        <div class="v8-tip">
          <IconInfoCircle class="v8-tip__icon" />
          <span>本菜单已对接 V8 应用集成管理中心，请按下列参数完成标准页面调用。</span>
        </div>

        <ul class="v8-params">
          <li v-for="item in params" :key="item.label" class="v8-param">
            <span class="v8-param__label">{{ item.label }}</span>
            <span class="v8-param__value" :class="{ 'is-mono': item.mono }">{{ item.value }}</span>
          </li>
        </ul>
      </div>

      <div class="v8-modal__footer">
        <span class="v8-badge">V8 标准接入</span>
        <span class="v8-footer-text">页面不可关闭，请通过左侧导航切换其它模块</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IconCommon, IconInfoCircle } from '@arco-design/web-vue/es/icon'

const route = useRoute()
const pageTitle = computed(() => (route.meta.title as string) || '机构管理')

const params = [
  { label: '应用名称', value: '指令流转中心' },
  { label: '应用唯一ID', value: 'V8-P-17', mono: true },
  { label: '调用页面', value: '/MT-AIM-API/开通用户列表', mono: true },
  { label: '应用调用密钥', value: 'V8-P-17-WUE7R7R8T0', mono: true },
  { label: '说明', value: '无需二次开发' },
]
</script>

<style scoped>
.v8-page {
  position: relative;
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.v8-backdrop {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background:
    radial-gradient(ellipse 60% 50% at 50% 40%, rgba(22, 93, 255, 0.12), transparent 70%),
    linear-gradient(180deg, #f2f5fb 0%, #e8eef8 100%);
}

.v8-modal {
  position: relative;
  z-index: 1;
  width: min(560px, 100%);
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(22, 93, 255, 0.12);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.8) inset,
    0 18px 48px rgba(15, 35, 80, 0.12),
    0 4px 12px rgba(22, 93, 255, 0.08);
  overflow: hidden;
}

.v8-modal__glow {
  position: absolute;
  top: -40%;
  left: 20%;
  width: 60%;
  height: 55%;
  background: radial-gradient(circle, rgba(22, 93, 255, 0.16), transparent 70%);
  pointer-events: none;
}

.v8-modal__header {
  position: relative;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 28px 28px 20px;
  background: linear-gradient(135deg, #f7f9ff 0%, #eef3ff 55%, #f8fbff 100%);
  border-bottom: 1px solid #e8eef8;
}

.v8-modal__icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  background: linear-gradient(135deg, #165dff 0%, #3c7eff 50%, #0fc6c2 100%);
  box-shadow: 0 8px 20px rgba(22, 93, 255, 0.35);
}

.v8-modal__titles {
  min-width: 0;
  padding-top: 2px;
}

.v8-modal__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1d2129;
  line-height: 1.4;
  letter-spacing: 0.01em;
}

.v8-modal__subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #86909c;
  line-height: 1.45;
}

.v8-modal__body {
  position: relative;
  padding: 22px 28px 8px;
}

.v8-tip {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #f2f7ff;
  border: 1px solid #d6e4ff;
  color: #3b5bdb;
  font-size: 13px;
  line-height: 1.55;
}

.v8-tip__icon {
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 15px;
}

.v8-params {
  list-style: none;
  margin: 0;
  padding: 0;
  border-radius: 12px;
  border: 1px solid #e5e6eb;
  overflow: hidden;
}

.v8-param {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f2f5;
  background: #fff;
}

.v8-param:nth-child(even) {
  background: #fafbfd;
}

.v8-param:last-child {
  border-bottom: none;
}

.v8-param__label {
  font-size: 13px;
  color: #86909c;
  font-weight: 500;
}

.v8-param__value {
  font-size: 14px;
  color: #1d2129;
  font-weight: 600;
  word-break: break-all;
  line-height: 1.45;
}

.v8-param__value.is-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #0e42d2;
}

.v8-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 28px 22px;
  border-top: 1px solid #f0f2f5;
}

.v8-badge {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #165dff;
  background: rgba(22, 93, 255, 0.08);
  border: 1px solid rgba(22, 93, 255, 0.18);
  white-space: nowrap;
}

.v8-footer-text {
  font-size: 12px;
  color: #86909c;
  text-align: right;
  line-height: 1.4;
}
</style>
