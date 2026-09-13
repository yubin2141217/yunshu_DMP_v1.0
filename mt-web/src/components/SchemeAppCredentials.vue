<template>
  <div class="scheme-creds" :class="{ 'scheme-creds--form': variant === 'form' }">
    <template v-if="variant === 'form'">
      <a-row :gutter="[16, 0]">
        <a-col :xs="24" :sm="12">
          <a-form-item :field="keyField" required>
            <template #label>
              <span class="scheme-creds__label-row">
                <span>AppKey</span>
                <a-button type="text" size="mini" class="scheme-creds__gen-btn" @click.stop="autoGenerate">
                  自动生成
                </a-button>
                <span class="scheme-creds__tip">{{ tipText }}</span>
              </span>
            </template>
            <div class="scheme-creds__control">
              <p class="scheme-creds__format">{{ keyFormatHint }}</p>
              <a-input v-model="appKey" placeholder="可手动输入，或点击自动生成" allow-clear :max-length="keyLen" />
            </div>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="12">
          <a-form-item :field="secretField" label="AppSecret" required>
            <div class="scheme-creds__control">
              <p class="scheme-creds__format">{{ secretFormatHint }}</p>
              <a-input-password
                v-model="appSecret"
                placeholder="可手动输入，或点击自动生成"
                allow-clear
                :max-length="secretLen"
              />
            </div>
          </a-form-item>
        </a-col>
      </a-row>
    </template>

    <template v-else>
      <div class="scheme-creds__detail-grid">
        <div class="scheme-creds__detail-item">
          <div class="scheme-creds__label-row scheme-creds__label-row--detail">
            <span class="scheme-creds__detail-label">AppKey</span>
            <a-button type="text" size="mini" class="scheme-creds__gen-btn" @click="autoGenerate">
              自动生成
            </a-button>
            <span class="scheme-creds__tip">{{ tipText }}</span>
          </div>
          <p class="scheme-creds__format">{{ keyFormatHint }}</p>
          <a-input v-model="appKey" placeholder="可手动输入，或点击自动生成" allow-clear :max-length="keyLen" />
        </div>
        <div class="scheme-creds__detail-item">
          <div class="scheme-creds__detail-label scheme-creds__detail-label--solo">AppSecret</div>
          <p class="scheme-creds__format">{{ secretFormatHint }}</p>
          <a-input-password
            v-model="appSecret"
            placeholder="可手动输入，或点击自动生成"
            allow-clear
            :max-length="secretLen"
          />
        </div>
      </div>
      <div v-if="showSave" class="scheme-creds__save-row">
        <a-button type="primary" size="small" :loading="saving" @click="emit('save')">保存凭证</a-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  SCHEME_APP_KEY_LEN,
  SCHEME_APP_SECRET_LEN,
  genSchemeAppKey,
  genSchemeAppSecret,
} from '@/mock/mt'

const appKey = defineModel<string>('appKey', { default: '' })
const appSecret = defineModel<string>('appSecret', { default: '' })

withDefaults(
  defineProps<{
    /** form：嵌入接入方式表单；detail：详情页可编辑 */
    variant?: 'form' | 'detail'
    keyField?: string
    secretField?: string
    showSave?: boolean
    saving?: boolean
  }>(),
  {
    variant: 'form',
    keyField: 'apiAccess.appKey',
    secretField: 'apiAccess.appSecret',
    showSave: false,
    saving: false,
  },
)

const emit = defineEmits<{
  save: []
}>()

const keyLen = SCHEME_APP_KEY_LEN
const secretLen = SCHEME_APP_SECRET_LEN
const tipText = '系统自动按规则生成安全凭证，请妥善保管'
const keyFormatHint = `长度限制 ${SCHEME_APP_KEY_LEN} 位，支持大小写字母与数字组合`
const secretFormatHint = `长度限制 ${SCHEME_APP_SECRET_LEN} 位，支持大小写字母与数字组合`

function autoGenerate() {
  appKey.value = genSchemeAppKey()
  appSecret.value = genSchemeAppSecret()
}

defineExpose({ autoGenerate })
</script>

<style scoped>
.scheme-creds__label-row {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  max-width: 100%;
}

.scheme-creds__label-row--detail {
  display: flex;
  margin-bottom: 4px;
}

.scheme-creds__gen-btn {
  padding: 0 4px;
  height: auto;
  line-height: 1.4;
  color: rgb(var(--primary-6));
}

.scheme-creds__gen-btn:hover {
  color: rgb(var(--primary-5));
}

.scheme-creds__tip {
  font-size: 12px;
  line-height: 1.4;
  font-weight: 400;
  color: #86909c;
}

.scheme-creds__control {
  width: 100%;
}

.scheme-creds__format {
  margin: 0 0 6px;
  font-size: 12px;
  line-height: 1.4;
  color: #86909c;
}

.scheme-creds__detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  margin-bottom: 12px;
}

.scheme-creds__detail-label {
  font-size: 13px;
  color: #4e5969;
  font-weight: 500;
}

.scheme-creds__detail-label--solo {
  margin-bottom: 4px;
}

.scheme-creds__save-row {
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .scheme-creds__detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
