<template>
  <div
    ref="el"
    class="v8-chart"
    :class="{ 'v8-chart--fill': isFill }"
    :style="isFill ? undefined : { width: '100%', height: height }"
  ></div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsCoreOption } from 'echarts/core'

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
])

const props = withDefaults(defineProps<{ option: EChartsCoreOption; height?: string }>(), {
  height: '280px',
})

const emit = defineEmits<{
  (e: 'chart-click', params: { componentType?: string; seriesIndex?: number; dataIndex?: number; name?: string; value?: unknown }): void
}>()

// height="100%" 时改为绝对定位填满父级；百分比高度在被 flex 拉伸的父级内会解析为 0
const isFill = computed(() => props.height === '100%')

const el = ref<HTMLDivElement | null>(null)
let chart: ReturnType<typeof echarts.init> | null = null
let resizeObserver: ResizeObserver | null = null

function render() {
  if (!el.value) return
  // 容器尺寸尚未确定（如 height:100% 的 flex 子项首帧为 0）时跳过，
  // 交由 ResizeObserver 在拿到尺寸后再初始化，避免 ECharts 告警与尺寸错误
  if (el.value.clientWidth === 0 || el.value.clientHeight === 0) return
  if (!chart) {
    chart = echarts.init(el.value)
    chart.on('click', (params) => {
      emit('chart-click', {
        componentType: params.componentType,
        seriesIndex: params.seriesIndex,
        dataIndex: params.dataIndex,
        name: params.name,
        value: params.value,
      })
    })
  }
  chart.setOption(props.option, true)
}

function resize() {
  chart?.resize()
}

onMounted(() => {
  render()
  // 兜底监听容器尺寸变化（首帧为 0、后续被 flex 布局撑开等场景）
  resizeObserver = new ResizeObserver(() => {
    if (!chart && el.value && el.value.clientWidth > 0 && el.value.clientHeight > 0) {
      render()
    } else {
      resize()
    }
  })
  if (el.value) resizeObserver.observe(el.value)
  window.addEventListener('resize', resize)
})

watch(
  () => props.option,
  () => render(),
  { deep: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  resizeObserver?.disconnect()
  resizeObserver = null
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
/* 填满父级：依赖父元素 position: relative */
.v8-chart--fill {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
