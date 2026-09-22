/**
 * 供方能力五维评估：详情雷达 option 构建 + 短板提示
 * 评分口径与纯函数见 @/v8/mock/types（computeSupplierScore / averageSupplierScores）
 */
import type { EChartsCoreOption } from 'echarts/core'
import {
  scoreDimensionMeta,
  SCORE_WEAK_LINE,
  type ScoreDimension,
  type SupplierScore,
} from '@/v8/mock/types'

/** 雷达维度顺序（与产品口径一致，勿随意调整） */
export const SCORE_DIMS: ScoreDimension[] = ['volume', 'activity', 'quality', 'unique', 'timely']

/** 各维度短板的针对性运营建议 */
const WEAK_ADVICE: Record<ScoreDimension, string> = {
  volume: '数据量偏低，供给规模不足，建议推动供数方提升接入量',
  activity: '活跃度不足，近 7 日接入天数偏少，建议确认是否存在间歇性断供',
  quality: '数据质量偏低，拒收率偏高，建议排查字段格式与接入规范符合度',
  unique: '独有性偏低，与其它供数方重合报送的比例较高，建议关注差异化数据来源',
  timely: '及时性不足，同源数据多为非首发入库，建议推动供数方提升采集与推送时效',
}

/** 短板提示文案（最低维 <60 才提示，否则返回空串） */
export function weakTipOf(sc: SupplierScore): string {
  if (sc[sc.weakest] >= SCORE_WEAK_LINE) return ''
  return `短板：${scoreDimensionMeta[sc.weakest].label} ${sc[sc.weakest]} 分。${WEAK_ADVICE[sc.weakest]}`
}

/**
 * 构建五维雷达：当前供方蓝色实线 + 机构启用供方均值灰色虚线对照。
 * 维度名称由调用方以 HTML 覆盖层渲染（名称后带 ⓘ tooltip 说明），
 * 故此处关闭 ECharts 自带 axisName，几何参数（center/radius）需与覆盖层定位保持一致。
 */
export function buildRadarOption(sc: SupplierScore, avg: SupplierScore, supplierName: string): EChartsCoreOption {
  return {
    tooltip: {
      trigger: 'item',
      formatter: () => {
        const rows = SCORE_DIMS.map((d) => {
          const label = scoreDimensionMeta[d].label
          return `<div style="display:flex;justify-content:space-between;gap:16px"><span>${label}</span><span><b>${sc[d]}</b> / ${avg[d]}</span></div>`
        }).join('')
        return `<div style="font-size:12px">
          <div style="margin-bottom:4px;color:#1d2129;font-weight:600">${supplierName}</div>
          <div style="color:#86909c;margin-bottom:2px">各维度：本供方 / 机构均值</div>
          ${rows}
        </div>`
      },
    },
    legend: {
      bottom: 0,
      itemWidth: 14,
      itemHeight: 8,
      textStyle: { fontSize: 12, color: '#4e5969' },
      data: ['当前供方', '机构均值'],
    },
    radar: {
      center: ['50%', '48%'],
      radius: '62%',
      indicator: SCORE_DIMS.map((d) => ({ name: scoreDimensionMeta[d].label, max: 100 })),
      // 维度名称改由页面 HTML 覆盖层渲染（带 tooltip 说明），关闭canvas 名称避免重复
      axisName: { show: false },
      splitLine: { lineStyle: { color: '#eef0f3' } },
      splitArea: { areaStyle: { color: ['#fff', '#fafbfc'] } },
      axisLine: { lineStyle: { color: '#e5e6eb' } },
    },
    series: [
      {
        type: 'radar',
        symbolSize: 4,
        data: [
          {
            value: SCORE_DIMS.map((d) => sc[d]),
            name: '当前供方',
            lineStyle: { color: '#1677ff', width: 2 },
            itemStyle: { color: '#1677ff' },
            areaStyle: { color: 'rgba(22,119,255,0.20)' },
          },
          {
            value: SCORE_DIMS.map((d) => avg[d]),
            name: '机构均值',
            lineStyle: { color: '#a9aeb8', width: 1.5, type: 'dashed' },
            itemStyle: { color: '#a9aeb8' },
            areaStyle: { color: 'rgba(169,174,184,0.08)' },
          },
        ],
      },
    ],
  }
}
