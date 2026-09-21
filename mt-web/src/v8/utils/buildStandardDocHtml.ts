import type { Standard, StandardField } from '@/v8/mock/v8'

function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function dash(s: unknown): string {
  const v = String(s ?? '').trim()
  return v || '—'
}

type AccessMethod = 'http_post' | 'mq' | 'file'

function accessMethodLabel(method: AccessMethod): string {
  if (method === 'mq') return '消息队列'
  if (method === 'file') return '文件传输'
  return 'HTTP/HTTPS POST 推送'
}

/** 依据 Standard 生成与 MT 端样式一致的接入文档 HTML（.api-doc-pdf） */
export function buildStandardDocHtml(item: Standard): string {
  const method: AccessMethod =
    item.accessMethod === 'mq' || item.accessMethod === 'file' ? item.accessMethod : 'http_post'
  const scopeLabel = item.scope === 'org' ? `机构${item.orgName ? `（${item.orgName}）` : ''}` : '全局'
  const api = item.apiAccess || {}
  const whitelist = !!item.requireIpWhitelist

  const endpoint = [api.baseUrl?.replace(/\/$/, ''), api.path].filter(Boolean).join('')
  const securityNotice =
    method === 'http_post'
      ? `本方案适用范围为${scopeLabel}：接口鉴权所需的 appkey 请联系${
          item.scope === 'org' ? '机构负责人' : '康奈公司对接人'
        }获取，请勿通过公开渠道传播${whitelist ? '；已启用 IP 白名单，来源 IP 未登记将拒收' : ''}。`
      : `本方案适用范围为${scopeLabel}：请妥善保管接入地址与鉴权凭证，勿通过公开渠道传播${
          whitelist ? '；已启用 IP 白名单' : ''
        }。`

  const fieldRows = (item.fields || [])
    .map(
      (f: StandardField, i: number) =>
        `<tr><td>${i + 1}</td><td><code>${escapeHtml(f.name)}</code></td><td>${escapeHtml(
          f.description || '—',
        )}</td><td>${escapeHtml(f.dataType || '—')}</td><td>${escapeHtml(
          f.length || '—',
        )}</td><td>${escapeHtml(f.bizCategory || '—')}</td></tr>`,
    )
    .join('')

  const kv = (rows: [string, string][]) =>
    rows.map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${v}</td></tr>`).join('')

  let accessHtml = ''
  if (method === 'mq') {
    accessHtml = `<h2>3. 消息队列配置</h2><table><tbody>${kv([
      ['队列类型', 'Kafka'],
      ['Topic', '<code>yunshu_article</code>'],
      ['消费模式', '集群消费'],
      ['数据格式', 'application/json'],
      ['成功响应码', '0'],
    ])}</tbody></table>`
  } else if (method === 'file') {
    accessHtml = `<h2>3. 文件传输配置</h2><table><tbody>${kv([
      ['传输协议', 'SFTP'],
      ['文件格式', 'CSV（UTF-8）'],
      ['命名规则', '<code>{supplier_code}_{yyyyMMdd}_{seq}.csv</code>'],
      ['断点续传', '开启'],
      ['成功响应码', '0'],
    ])}</tbody></table>`
  } else {
    accessHtml = `<h2>3. 接口信息</h2><table><tbody>${kv([
      ['接口地址', `<code>${escapeHtml(dash(endpoint))}</code>`],
      ['请求方法', escapeHtml(dash(api.method || 'POST'))],
      ['Content-Type', escapeHtml(dash(api.contentType || 'application/json'))],
      ['鉴权方式', 'AppKey（请求头 ' + `<code>${escapeHtml(dash(api.authHeaderName || 'X-App-Key'))}</code>` + '）'],
      ['最大 QPS 上限', escapeHtml(dash(api.rateLimitQps))],
      ['超时 / 重试', `${escapeHtml(dash(api.timeoutSec))}s / ${escapeHtml(dash(api.retry))} 次`],
    ])}</tbody></table>`
  }

  const exampleObj: Record<string, unknown> = {
    supplier_code: item.supplierId || 'SUP001',
    org_id: item.scope === 'org' ? 'ORG_DEMO' : 'GLOBAL',
    ...(item.fields || []).slice(2, 6).reduce<Record<string, unknown>>((acc, f) => {
      acc[f.name] = f.dataType?.toLowerCase().includes('int') ? 0 : '示例值'
      return acc
    }, {}),
  }
  const example = escapeHtml(JSON.stringify(exampleObj, null, 2))

  return `<div class="api-doc-pdf">
  <h1>${escapeHtml(item.name)} · 接入文档</h1>
  <h2>1. 概要</h2>
  <ul>
    <li>方案编号：${escapeHtml(dash(item.schemeNo))}</li>
    <li>供数方：${escapeHtml(dash(item.supplierName))}</li>
    <li>生效范围：${escapeHtml(scopeLabel)}</li>
    <li>接入方式：${escapeHtml(accessMethodLabel(method))}</li>
    <li>IP 白名单管控：${whitelist ? '是' : '否'}</li>
    <li>方案摘要：${escapeHtml(item.summary || item.remark || '—')}</li>
  </ul>
  <h2>2. 安全说明</h2>
  <p class="security">${escapeHtml(securityNotice)}</p>
  ${accessHtml}
  <h2>4. 请求体字段</h2>
  <table>
    <thead><tr><th>序号</th><th>字段名</th><th>描述</th><th>类型</th><th>长度</th><th>业务分类</th></tr></thead>
    <tbody>${fieldRows || '<tr><td colspan="6">—</td></tr>'}</tbody>
  </table>
  <h2>5. 请求示例</h2>
  <pre>${example}</pre>
  <h2>6. 响应约定</h2>
  <p>${escapeHtml(
    method === 'http_post'
      ? '默认 code=0 视为接入成功。失败时返回可读错误信息；需白名单时来源 IP 未登记将拒收。'
      : '连通性测试成功响应码为 0。失败时返回可读错误信息；需白名单时来源 IP 未登记将拒收。',
  )}</p>
</div>`
}
