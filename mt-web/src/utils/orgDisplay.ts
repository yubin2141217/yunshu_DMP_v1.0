/** 机构副信息：所属统计单元·所属销售 */
export function formatOrgSub(unit?: string | null, sales?: string | null) {
  const u = String(unit || '').trim()
  const s = String(sales || '').trim()
  if (!u && !s) return '—'
  if (u && s) return `${u}·${s}`
  return u || s
}
