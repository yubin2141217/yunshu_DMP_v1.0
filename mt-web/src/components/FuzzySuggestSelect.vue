<template>
  <a-auto-complete
    :model-value="displayText"
    :data="suggestData"
    :placeholder="placeholder"
    :style="{ width }"
    allow-clear
    @change="onChange"
    @select="onSelect"
    @clear="onClear"
    @focus="onFocus"
    @blur="onBlur"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

export type FuzzyOption = { label: string; value: string }

const props = withDefaults(
  defineProps<{
    /** 选中项 id；空表示全部 */
    modelValue?: string
    /** 当前输入/展示文案（未选中时可作模糊关键字） */
    keyword?: string
    options: FuzzyOption[]
    /** 输入框提示，如「机构」 */
    placeholder?: string
    /** 未输入时展示的默认文案，如「全部机构」 */
    allLabel?: string
    width?: string
  }>(),
  {
    modelValue: '',
    keyword: '',
    placeholder: '',
    allLabel: '全部',
    width: '180px',
  },
)

const emit = defineEmits<{
  'update:modelValue': [string]
  'update:keyword': [string]
  change: [{ value: string; keyword: string }]
}>()

const editing = ref(false)
const draft = ref('')

const selectedLabel = computed(() => {
  if (!props.modelValue) return ''
  return props.options.find((o) => o.value === props.modelValue)?.label || props.keyword || ''
})

const displayText = computed(() => {
  if (editing.value) return draft.value
  if (props.modelValue) return selectedLabel.value
  if (props.keyword && props.keyword !== props.allLabel) return props.keyword
  return props.allLabel
})

const suggestData = computed(() => {
  const q = (editing.value ? draft.value : displayText.value).trim().toLowerCase()
  const list =
    !q || q === props.allLabel.toLowerCase()
      ? props.options
      : props.options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  return list.slice(0, 50).map((o) => o.label)
})

watch(
  () => [props.modelValue, props.keyword] as const,
  ([value, keyword]) => {
    if (editing.value) return
    if (!value && !keyword) {
      draft.value = ''
      return
    }
    draft.value = value
      ? props.options.find((o) => o.value === value)?.label || keyword || ''
      : keyword && keyword !== props.allLabel
        ? keyword
        : ''
  },
)

function emitAll(value: string, keyword: string) {
  emit('update:modelValue', value)
  emit('update:keyword', keyword)
  emit('change', { value, keyword })
}

function onFocus() {
  editing.value = true
  const cur = displayText.value
  draft.value = cur === props.allLabel ? '' : cur
}

function onBlur() {
  window.setTimeout(() => {
    editing.value = false
    const text = draft.value.trim()
    if (!text || text === props.allLabel) {
      emitAll('', '')
      draft.value = ''
      return
    }
    const hit = props.options.find((o) => o.label === text)
    if (hit) emitAll(hit.value, hit.label)
    else emitAll('', text)
  }, 150)
}

function onChange(val: string) {
  draft.value = val
  if (!editing.value) return
  const hit = props.options.find((o) => o.label === val)
  if (hit) emitAll(hit.value, hit.label)
  else emitAll('', val === props.allLabel ? '' : val)
}

function onSelect(val: string) {
  const hit = props.options.find((o) => o.label === val)
  if (!hit) return
  draft.value = hit.label
  editing.value = false
  emitAll(hit.value, hit.label)
}

function onClear() {
  draft.value = ''
  editing.value = true
  emitAll('', '')
}
</script>
