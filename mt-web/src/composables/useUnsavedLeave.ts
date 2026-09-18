import { Modal } from '@arco-design/web-vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'

const LEAVE_CONTENT = '当前页面存在未保存的修改，退出后编辑内容将会丢失，是否确认退出？'

function snapshotOf(value: unknown) {
  return JSON.stringify(value)
}

function canGoBack() {
  const state = window.history.state as { back?: string | null } | null
  return Boolean(state && state.back)
}

/** 详情/编辑页「返回」：有历史则后退，否则落到指定列表 */
export function usePageBack(fallback: RouteLocationRaw) {
  const router = useRouter()
  function goBack() {
    if (canGoBack()) router.back()
    else router.push(fallback)
  }
  return { goBack }
}

/** 新增/编辑页「返回」：有未保存修改时先确认再回到上一页 */
export function useUnsavedLeave(getState: () => unknown, fallback: RouteLocationRaw) {
  const router = useRouter()
  let baseline = ''

  function markPristine() {
    baseline = snapshotOf(getState())
  }

  function isDirty() {
    if (!baseline) return false
    return snapshotOf(getState()) !== baseline
  }

  function leave() {
    if (canGoBack()) router.back()
    else router.push(fallback)
  }

  /** force：加载失败/提交成功等场景，不弹窗直接离开 */
  function confirmLeave(force = false) {
    if (force || !isDirty()) {
      leave()
      return
    }
    Modal.confirm({
      title: '确认退出',
      content: LEAVE_CONTENT,
      okText: '确认退出',
      cancelText: '继续编辑',
      onOk: () => {
        leave()
      },
    })
  }

  return { markPristine, isDirty, confirmLeave, leave }
}
