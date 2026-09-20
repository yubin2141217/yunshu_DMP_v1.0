/**
 * 列表页分页规范（《康奈网络MT系统产品规范》2.6）：
 * - 每页条数选择器：10 / 50 / 100 / 200 / 500，MT 系统默认 100 条/页
 * - 切换条数后立即生效并回到第一页
 * - 翻页后自动滚动到表格顶部
 */
export const MT_PAGE_SIZE_OPTIONS = [10, 50, 100, 200, 500]
export const MT_DEFAULT_PAGE_SIZE = 100

/** 翻页后滚动到表格顶部（主区滚动容器内定位首个表格） */
export function scrollToTableTop() {
  const container = document.querySelector('.mt-main')
  const table = document.querySelector('.arco-table')
  if (!container || !table) return
  const cRect = container.getBoundingClientRect()
  const tRect = table.getBoundingClientRect()
  const target = container.scrollTop + tRect.top - cRect.top - 12
  container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
}
