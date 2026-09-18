import { h } from 'vue'
import { Modal } from '@arco-design/web-vue'

export function wrapModalText(text: string) {
  return () =>
    h(
      'div',
      { class: 'modal-confirm-wrap' },
      text,
    )
}

/** 被方案引用的字段提交前确认；多个字段名用英文逗号拼接 */
export function confirmReferencedFieldSubmit(fieldNames: string[]) {
  const names = fieldNames.map((n) => n.trim()).filter(Boolean)
  if (!names.length) return Promise.resolve(true)
  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '确认修改',
      content: wrapModalText(
        `字段[${names.join(', ')}]已有方案引用，修改会影响相关接入方案及其它业务，确认修改？`,
      ),
      okText: '确认提交',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })
}
