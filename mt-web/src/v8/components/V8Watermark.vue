<template>
  <div class="v8-watermark" aria-hidden="true" :style="watermarkStyle"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ text: string }>()

/** 生成平铺水印背景（SVG data URI，覆盖滚动全高，不拦截交互） */
const watermarkStyle = computed(() => {
  const text = props.text || '云数中台'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="160" viewBox="0 0 280 160">
    <g transform="rotate(-20 140 80)">
      <text x="50%" y="50%" fill="rgba(29,33,41,0.07)" font-size="14" font-family="PingFang SC, Microsoft YaHei, sans-serif" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </g>
  </svg>`
  const uri = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
  return {
    backgroundImage: uri,
  }
})
</script>
