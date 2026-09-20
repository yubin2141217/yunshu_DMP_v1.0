<template>
  <div class="page-shell edit-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">{{ pageTitle }}</h2>
        <p class="page-desc">配置模板名称与字段（含供数方字段映射），保存后可在接入方案字段库配置中选用。</p>
      </div>
      <a-space>
        <a-button @click="goBack">返回</a-button>
      </a-space>
    </div>

    <a-card class="content-card edit-card" :bordered="false">
      <div class="edit-card-inner">
        <div class="edit-main">
          <a-alert v-if="isSystem" type="info" style="margin-bottom: 16px">系统内置模板仅供查看，不可修改。</a-alert>
          <a-form ref="formRef" :model="editor" :rules="rules" layout="vertical" class="edit-form">
            <a-form-item field="name" label="模板名称" required>
              <a-input
                v-model="editor.name"
                placeholder="请输入模板名称"
                :max-length="50"
                allow-clear
                :disabled="isSystem"
              />
            </a-form-item>
            <a-form-item field="desc" label="模板说明">
              <a-textarea
                v-model="editor.desc"
                placeholder="可选，说明适用场景"
                :auto-size="{ minRows: 2, maxRows: 3 }"
                :max-length="200"
                allow-clear
                :disabled="isSystem"
              />
            </a-form-item>
            <a-form-item label="字段配置" required>
              <div :class="{ 'tpl-fields--readonly': isSystem }">
                <FieldPicker
                  v-model="editor.fieldIds"
                  v-model:field-maps="editor.fieldMaps"
                  :fields="pickerFields"
                  compact
                  hide-template-panel
                  hide-save-as-template
                  hide-json-import
                />
              </div>
            </a-form-item>
            <a-alert v-if="!isSystem" type="info">保存后类型为「用户自定义」；供数方字段名/类型为非必填，默认与平台字段一致。</a-alert>
          </a-form>
        </div>
        <div class="edit-actions">
          <a-space>
            <a-button @click="goBack">取消</a-button>
            <a-button v-if="!isSystem" type="primary" :loading="saving" @click="onSubmit">提交</a-button>
          </a-space>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Message, type FormInstance } from '@arco-design/web-vue'
import FieldPicker, { type PickerField } from '@/components/FieldPicker.vue'
import { getFieldTemplate, listMetadata, saveFieldTemplate } from '@/api/mt'
import type { FieldMapItem } from '@/mock/mt'
import { useUnsavedLeave } from '@/composables/useUnsavedLeave'
import { validateForm } from '@/utils/formValidate'

const LIST_FALLBACK = { path: '/metadata', query: { tab: 'templates' } }
const route = useRoute()
const formRef = ref<FormInstance>()
const saving = ref(false)
const pickerFields = ref<PickerField[]>([])
const tplType = ref<'system' | 'custom'>('custom')
const editor = reactive({
  id: '',
  name: '',
  desc: '',
  fieldIds: [] as string[],
  fieldMaps: [] as FieldMapItem[],
})
const { markPristine, confirmLeave } = useUnsavedLeave(() => editor, LIST_FALLBACK)
const rules = {
  name: [{ required: true, message: '请填写模板名称' }],
}
const isEdit = computed(() => !!String(route.params.id || ''))
const isSystem = computed(() => tplType.value === 'system')
const pageTitle = computed(() => {
  if (!isEdit.value) return '新增快速模板'
  return isSystem.value ? '查看快速模板' : '编辑快速模板'
})

function resetEditor() {
  Object.assign(editor, { id: '', name: '', desc: '', fieldIds: [] as string[], fieldMaps: [] as FieldMapItem[] })
  tplType.value = 'custom'
}

function goBack() {
  confirmLeave()
}

async function loadPickerFields() {
  const all = await listMetadata({ name: '', status: 'enabled', page: 1, pageSize: 500 })
  pickerFields.value = all.list.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description || f.bizCaliber || '',
    dataType: f.dataType,
    bizCategory: f.bizCategory || '',
  }))
}

async function load() {
  resetEditor()
  await loadPickerFields()
  const id = String(route.params.id || '')
  if (!id) {
    await nextTick()
    markPristine()
    return
  }
  const item = await getFieldTemplate(id)
  if (!item) {
    Message.error('未找到模板')
    confirmLeave(true)
    return
  }
  tplType.value = item.type === 'system' ? 'system' : 'custom'
  Object.assign(editor, {
    id: item.id,
    name: item.name,
    desc: item.desc || '',
    fieldIds: [...(item.fieldIds || [])],
    fieldMaps: [...(item.fieldMaps || [])],
  })
  await nextTick()
  markPristine()
}

async function onSubmit() {
  if (isSystem.value) return
  if (!(await validateForm(formRef.value))) return
  if (!editor.fieldIds.length) {
    Message.warning('请至少选择一个字段')
    return
  }
  saving.value = true
  try {
    await saveFieldTemplate({
      id: editor.id || undefined,
      name: editor.name.trim(),
      desc: editor.desc.trim(),
      fieldIds: editor.fieldIds,
      fieldMaps: editor.fieldMaps,
    })
    Message.success(`保存成功「${editor.name}」`)
    confirmLeave(true)
  } catch (e) {
    Message.error((e as Error).message)
  } finally {
    saving.value = false
  }
}

watch(
  () => String(route.params.id || ''),
  () => {
    void load()
  },
)

onMounted(load)
</script>

<style scoped>
.tpl-fields--readonly {
  pointer-events: none;
  opacity: 0.72;
}
</style>
