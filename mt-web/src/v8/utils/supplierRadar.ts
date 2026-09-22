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
export const SCORE_DIMS: ScoreDimension[] = ['volume', 'activity', 'quality', 'stability', 'freshness']

/** 各维度短板的针对性运营建议 */
const WEAK_ADVICE: Record<ScoreDimension, string> = {
  volume: '数据量偏低，供给规模不足，建议推动供数方提升接入量',
  activity: '活跃度不足，近 7 日接入天数偏少，建议确认是否存在间歇性断供',
  quality: '数据质量偏低，拒收率偏高，建议排查字段格式与接入规范符合度',
  stability: '供给稳定性不足，每日入库量波动较大，建议关注定时任务与峰值突增',
  freshness: '时效性不足，最近推送时间较久，疑似断流，建议及时联系供数方',
}

/** 短板提示文案（最低维 <60 才提示，否则返回空串） */
export function weakTipOf(sc: SupplierScore): string {
  if (sc[sc.weakest] >= SCORE_WEAK_LINE) return ''
  return `短板：${scoreDimensionMeta[sc.weakest].label} ${sc[sc.weakest]} 分。${WEAK_ADVICE[sc.weakest]}`
}

/**
 * 构建五维雷达：当前供方蓝色实线 + 机构启用供方均值灰色虚线对照
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
      axisName: { color: '#4e5969', fontSize: 12 },
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
