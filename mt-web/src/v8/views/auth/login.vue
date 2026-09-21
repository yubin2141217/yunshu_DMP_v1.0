<template>
  <div class="v8-login qr-login qr-login--split">
    <!-- 冷色科技背景：基底柔光 / 粒子点阵 / 中央光束 + 钻石棱镜（纯 CSS+SVG，无外链） -->
    <div class="qr-login-bg" aria-hidden="true">
      <div class="bg-dots bg-dots--a"></div>
      <div class="bg-dots bg-dots--b"></div>
      <div class="bg-beam"></div>
      <svg class="bg-prism" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="v8PrismFace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#cfe0f5" stop-opacity="0.0" />
            <stop offset="45%" stop-color="#bcd4f0" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#9dbfe6" stop-opacity="0.15" />
          </linearGradient>
          <linearGradient id="v8PrismFace2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e3eefb" stop-opacity="0.2" />
            <stop offset="55%" stop-color="#aecbe9" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#d7e6f7" stop-opacity="0.05" />
          </linearGradient>
          <radialGradient id="v8CoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
            <stop offset="45%" stop-color="#ffe9c2" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#7fb0e6" stop-opacity="0" />
          </radialGradient>
        </defs>
        <!-- 左侧汇聚光流 -->
        <g stroke="#8fb4e0" stroke-opacity="0.28" fill="none" stroke-width="1">
          <path d="M-40 470 C 320 430, 560 540, 838 566" />
          <path d="M-40 560 C 300 600, 580 520, 838 566" />
          <path d="M-40 660 C 340 640, 600 600, 838 566" />
        </g>
        <!-- 钻石棱镜 -->
        <polygon points="838,360 838,772 690,566" fill="url(#v8PrismFace)" />
        <polygon points="838,360 838,772 986,566" fill="url(#v8PrismFace2)" />
        <polygon points="838,360 690,566 838,566" fill="#dce9f8" fill-opacity="0.35" />
        <polygon points="838,360 986,566 838,566" fill="#b9d2ef" fill-opacity="0.3" />
        <!-- 中心高光 -->
        <circle cx="838" cy="566" r="150" fill="url(#v8CoreGlow)" />
        <circle cx="838" cy="566" r="6" fill="#ffffff" fill-opacity="0.9" />
      </svg>
    </div>

    <!-- 顶部品牌栏 -->
    <header class="qr-topbar">
      <div class="qr-top-brand">
        <span class="pro-logo-mark" aria-hidden="true"><IconThunderbolt /></span>
        <span class="qr-top-name">云数中台</span>
        <span class="qr-top-slash"></span>
        <span class="qr-top-edition">V8 机构端</span>
      </div>
      <div class="qr-top-links">
        <span class="qr-top-link"><IconPhone class="qr-top-phone" />联系我们 4000-999-363</span>
        <span class="qr-top-sep"></span>
        <span class="qr-top-link">产品矩阵</span>
      </div>
    </header>

    <!-- 主舞台：左产品文案 + 右登录卡 -->
    <main class="qr-stage">
      <section class="qr-hero">
        <div class="qr-hero-domain">yunshuDMP.cn</div>
        <h1 class="qr-hero-title">云数中台</h1>
        <p class="qr-hero-subtitle">V8 机构端 · 网信 / 网安机构舆情数据服务</p>
        <div class="qr-hero-line"></div>
        <p class="qr-hero-slogan">
          <span class="qr-hero-dot"></span>供数全程可视 · 数据安全可控 · 推送合规回流
        </p>
      </section>

      <section class="qr-panel">
        <div class="qr-panel-title">欢迎登录</div>
        <div class="qr-panel-sub">云数中台 V8 机构端 · 机构舆情数据服务</div>

        <div class="qr-code-wrap" :class="`is-${status}`" @click="onQrClick">
          <div v-if="status !== 'expired'" class="qr-code" :class="`is-${status}`">
            <svg viewBox="0 0 29 29" shape-rendering="crispEdges" aria-hidden="true">
              <rect width="29" height="29" fill="#ffffff" />
              <template v-for="(row, r) in qrMatrix" :key="r">
                <rect
                  v-for="(cell, c) in row"
                  :key="c"
                  :x="c"
                  :y="r"
                  :width="1"
                  :height="1"
                  :fill="cell ? '#1d2129' : '#ffffff'"
                />
              </template>
            </svg>
            <div v-if="status === 'scanned'" class="qr-code-mask">
              <IconCheckCircleFill class="qr-mask-icon" />
              <span>扫码成功</span>
            </div>
            <div v-if="status === 'confirmed'" class="qr-code-mask">
              <IconLoading class="qr-mask-icon" />
              <span>登录中…</span>
            </div>
          </div>
          <div v-else class="qr-code qr-code-expired">
            <IconRefresh />
            <span>二维码已过期</span>
          </div>
          <div class="qr-corner qr-corner--tl"></div>
          <div class="qr-corner qr-corner--tr"></div>
          <div class="qr-corner qr-corner--bl"></div>
          <div class="qr-corner qr-corner--br"></div>
        </div>

        <div class="qr-panel-hint">{{ statusDesc }}</div>
        <button type="button" class="qr-demo-btn" @click="onDemoLogin" :disabled="loading">
          演示：一键以机构管理员登录
        </button>

        <div class="qr-panel-foot">—— V8 应用集成中心 统一认证 ——</div>
      </section>
    </main>

    <!-- 底部版权 -->
    <footer class="qr-copyright">
      账号由 V8 应用集成中心统一开通，采用微信扫码认证 · © 2026 云数中台
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import {
  IconCheckCircleFill,
  IconLoading,
  IconPhone,
  IconRefresh,
  IconThunderbolt,
} from '@arco-design/web-vue/es/icon'
import {
  createQrSession,
  demoAdminLogin,
  exchangeSession,
  expireQr,
  simulateConfirm,
  simulateScan,
  type QrStatus,
} from '@/v8/api/auth'
import { useUserStore } from '@/v8/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const status = ref<QrStatus>('waiting')
const ttl = ref(60)
const loading = ref(false)
let qrToken = ''
let timer: ReturnType<typeof setInterval> | null = null

// 固定的二维码点阵图案（纯装饰，用于模拟扫码图形）
const qrMatrix = computed<number[][]>(() => {
  const size = 29
  const m: number[][] = []
  const finder = (r: number, c: number) => {
    const inBlock = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7
    if (inBlock(0, 0) || inBlock(0, size - 7) || inBlock(size - 7, 0)) {
      const lr = r >= 0 && r < 7 ? r : r - (size - 7)
      const lc = c >= 0 && c < 7 ? c : c - (size - 7)
      const border = lr === 0 || lr === 6 || lc === 0 || lc === 6
      const core = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4
      return border || core ? 1 : 0
    }
    return -1
  }
  for (let r = 0; r < size; r += 1) {
    const row: number[] = []
    for (let c = 0; c < size; c += 1) {
      const f = finder(r, c)
      if (f !== -1) {
        row.push(f)
      } else {
        // 伪随机但稳定的点阵
        row.push((r * 7 + c * 13 + r * c) % 5 < 2 ? 1 : 0)
      }
    }
    m.push(row)
  }
  return m
})

const statusDesc = computed(() => {
  if (status.value === 'waiting') return `二维码有效期 ${ttl.value} 秒 · 点击二维码可模拟扫码`
  if (status.value === 'scanned') return '扫码成功，请在微信中点击确认登录'
  if (status.value === 'confirmed') return '正在为您建立安全会话…'
  return '二维码已过期，点击二维码即可刷新'
})

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startTicker() {
  clearTimer()
  timer = setInterval(() => {
    if (status.value === 'waiting') {
      ttl.value -= 1
      if (ttl.value <= 0) {
        status.value = 'expired'
        expireQr(qrToken)
      }
    }
  }, 1000)
}

async function initQr() {
  const session = await createQrSession()
  qrToken = session.qrToken
  ttl.value = session.ttl
  status.value = 'waiting'
  startTicker()
}

/** 点击二维码推进 Mock 状态机：waiting→scanned→confirmed→登录；expired→刷新 */
async function onQrClick() {
  if (loading.value) return
  if (status.value === 'expired') {
    await initQr()
    return
  }
  if (status.value === 'waiting') {
    simulateScan(qrToken)
    status.value = 'scanned'
    return
  }
  if (status.value === 'scanned') {
    simulateConfirm(qrToken)
    status.value = 'confirmed'
    loading.value = true
    try {
      const res = await exchangeSession(qrToken)
      userStore.setSession(res.token, res.userInfo)
      Message.success('登录成功')
      await redirectAfterLogin()
    } catch (e) {
      Message.error((e as Error).message || '登录失败，请重试')
      status.value = 'scanned'
      loading.value = false
    }
  }
}

async function onDemoLogin() {
  if (loading.value) return
  loading.value = true
  try {
    const res = await demoAdminLogin()
    userStore.setSession(res.token, res.userInfo)
    Message.success('登录成功（机构管理员）')
    await redirectAfterLogin()
  } finally {
    loading.value = false
  }
}

function redirectAfterLogin() {
  const redirect =
    typeof route.query.redirect === 'string' &&
    route.query.redirect.startsWith('/v8/') &&
    !route.query.redirect.startsWith('//')
      ? route.query.redirect
      : '/v8/overview'
  return router.replace(redirect === '/v8/login' ? '/v8/overview' : redirect)
}

initQr()

onUnmounted(clearTimer)
</script>
