<template>
  <div class="portal">
    <!-- 氛围层 -->
    <div class="portal__grid" />
    <div class="portal__glow portal__glow--left" />
    <div class="portal__glow portal__glow--right" />
    <div class="portal__glow portal__glow--bottom" />

    <div class="portal__inner">
      <!-- 顶部 -->
      <header class="portal__header fade-up">
        <div class="portal__brand">
          <div class="portal__logo">KN</div>
          <div class="portal__brand-text">
            <h1 class="portal__title">云数中台</h1>
          </div>
        </div>

        <div class="portal__user">
          <img src="/images/avatar.jpg" alt="产品经理余斌" class="portal__avatar" />
          <span class="portal__username">产品经理：余斌</span>
        </div>
      </header>

      <!-- 主体 -->
      <main class="portal__main">
        <section class="portal__hero fade-up" style="animation-delay: 80ms">
          <h2 class="portal__heading">云数中台 原型设计门户</h2>
          <p class="portal__desc">统一管理数据接入与推送的配置、机构可对比各供数厂商数据接入情况。</p>
        </section>

        <section class="portal__cards fade-up" style="animation-delay: 160ms">
          <!-- 左：MT 管理端 -->
          <article class="entry-card">
            <span class="entry-card__tag entry-card__tag--blue">MT后台管理系统</span>
            <div class="entry-card__icon entry-card__icon--plain">
              <!-- settings -->
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <h3 class="entry-card__name">MT管理端</h3>
            <p class="entry-card__desc">MT后台对系统配置及应用级的各项参数的管理。</p>
            <button type="button" class="entry-card__btn" @click="goDashboard">MT管理端</button>
          </article>

          <!-- 中：V8 机构端（推荐） -->
          <article class="entry-card entry-card--featured">
            <span class="entry-card__ribbon">核心入口 · 推荐</span>
            <span class="entry-card__tag entry-card__tag--strong">云数中台 互联网通道</span>
            <div class="entry-card__icon entry-card__icon--grad">
              <!-- dashboard -->
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="9" rx="1.5" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" />
                <rect x="3" y="16" width="7" height="5" rx="1.5" />
              </svg>
            </div>
            <h3 class="entry-card__name">V8机构端</h3>
            <p class="entry-card__desc entry-card__desc--light">互联网用户使用此入口登录PC端。</p>
            <button type="button" class="entry-card__btn entry-card__btn--primary" @click="goV8Login">
              进入 V8机构端登录入口
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </button>
          </article>

          <!-- 右：H5 移动端 -->
          <article class="entry-card">
            <span class="entry-card__tag entry-card__tag--gray">云数中台 移动端</span>
            <div class="entry-card__icon entry-card__icon--plain">
              <!-- smartphone -->
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <rect x="6" y="2" width="12" height="20" rx="2.5" />
                <path d="M11 18h2" />
              </svg>
            </div>
            <h3 class="entry-card__name">H5移动端</h3>
            <p class="entry-card__desc">敬请期待。</p>
            <button type="button" class="entry-card__btn" disabled>进入 专网登录入口</button>
          </article>
        </section>

        <p class="portal__footer fade-up" style="animation-delay: 240ms">
          云数中台系统 · yunshuDMP.cn · 等保三级安全认证 · 多租户权限体系统一
        </p>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore as useV8UserStore } from '@/v8/store/user'

const router = useRouter()
const v8UserStore = useV8UserStore()

function goDashboard() {
  router.push('/stats')
}

// 始终先进入 V8 登录页：清除既有 V8 会话，避免已登录态被守卫直接重定向进概览；
// 携带回跳地址，登录成功后进入数据概览首页
function goV8Login() {
  v8UserStore.logout()
  router.push({ path: '/v8/login', query: { redirect: '/v8/overview' } })
}

// 门户页使用独立深色主题标题与底色
onMounted(() => {
  document.title = '云数中台-yunshuDMP.cn-V1.0'
  document.body.classList.add('portal-entry')
})

onUnmounted(() => {
  document.body.classList.remove('portal-entry')
})
</script>

<style lang="scss">
/* 非 scoped：门户停留期间覆盖全局浅色 body，避免橡皮筋滚动露白 */
body.portal-entry {
  background: #0b132b;
}
</style>

<style scoped lang="scss">
$ink: #e8eefc;
$muted: #94a3b8;

.portal {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #0b132b 0%, #1c2541 50%, #0b132b 100%);
  color: $ink;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
}

.portal__grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(rgba(94, 148, 255, 0.18) 1px, transparent 1px);
  background-size: 28px 28px;
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 75%);
  mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 75%);
}

.portal__glow {
  position: absolute;
  border-radius: 9999px;
  pointer-events: none;
  filter: blur(100px);

  &--left {
    left: -6rem;
    top: 4rem;
    width: 18rem;
    height: 18rem;
    background: rgba(37, 99, 235, 0.25);
    animation: glow-pulse 6s ease-in-out infinite;
  }
  &--right {
    right: 0;
    top: 10rem;
    width: 20rem;
    height: 20rem;
    filter: blur(110px);
    background: rgba(34, 211, 238, 0.15);
  }
  &--bottom {
    bottom: 2.5rem;
    left: 33%;
    width: 16rem;
    height: 16rem;
    filter: blur(90px);
    background: rgba(99, 102, 241, 0.2);
  }
}

.portal__inner {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 72rem;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 2.5rem;

  @media (min-width: 1024px) {
    padding: 1.5rem 2rem 2.5rem;
  }
}

.portal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.portal__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.portal__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  font-size: 1.125rem;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 55%, #22d3ee 100%);
  box-shadow: 0 0 24px rgba(59, 130, 246, 0.45);
}

.portal__brand-text {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.portal__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #fff;
}

.portal__user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 9999px;
  padding: 0.375rem 1rem 0.375rem 0.375;
  backdrop-filter: blur(12px);
}

.portal__avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  object-fit: cover;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.3);
}

.portal__username {
  font-size: 0.875rem;
  font-weight: 500;
  color: #f1f5f9;
  white-space: nowrap;
}

.portal__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 10rem 0 2rem;
  /* 内容区域整体上移 200px */
  transform: translateY(-200px);

  @media (min-width: 768px) {
    padding-top: 12rem;
  }
}

.portal__hero {
  margin-bottom: 2.5rem;
  text-align: center;
}

.portal__heading {
  margin: 0 0 1rem;
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #fff;

  @media (min-width: 768px) {
    font-size: 3rem;
  }
}

.portal__desc {
  max-width: 48rem;
  margin: 0 auto;
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(203, 213, 225, 0.9);

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
}

.portal__cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    align-items: stretch;
  }
}

.entry-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  background: rgba(18, 26, 51, 0.8);
  padding: 1.5rem;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(96, 165, 250, 0.3);
    box-shadow: 0 12px 48px rgba(37, 99, 235, 0.18);
  }

  &--featured {
    border: 2px solid #3b82f6;
    background: rgba(18, 26, 51, 0.9);
    box-shadow:
      0 0 0 1px rgba(59, 130, 246, 0.35),
      0 0 48px rgba(37, 99, 235, 0.45),
      0 16px 48px rgba(0, 0, 0, 0.4);

    &:hover {
      transform: translateY(-6px);
    }

    @media (min-width: 768px) {
      margin-top: -0.5rem;
      margin-bottom: -0.5rem;
    }
  }
}

.entry-card__ribbon {
  position: absolute;
  top: -0.75rem;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  border-radius: 9999px;
  padding: 0.125rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(90deg, #2563eb 0%, #06b6d4 100%);
  box-shadow: 0 0 16px rgba(59, 130, 246, 0.55);
}

.entry-card__tag {
  width: fit-content;
  border-radius: 0.375rem;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 1.25rem;

  &--blue {
    background: rgba(59, 130, 246, 0.15);
    color: #bfdbfe;
  }
  &--strong {
    background: rgba(59, 130, 246, 0.2);
    color: #dbeafe;
  }
  &--gray {
    background: rgba(100, 116, 139, 0.2);
    color: #cbd5e1;
  }
}

.entry-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.25rem;

  &--plain {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: #0b132b;
    color: #e2e8f0;
  }
  &--grad {
    color: #fff;
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 55%, #22d3ee 100%);
    box-shadow: 0 0 28px rgba(59, 130, 246, 0.55);
  }
}

.entry-card__name {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}

.entry-card__desc {
  flex: 1;
  margin: 0 0 2rem;
  font-size: 0.875rem;
  line-height: 1.7;
  color: $muted;

  &--light {
    color: #cbd5e1;
  }
}

.entry-card__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #f1f5f9;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, filter 0.2s ease;

  &:hover:not(:disabled) {
    border-color: rgba(96, 165, 250, 0.4);
    background: rgba(59, 130, 246, 0.15);
  }

  &:disabled {
    cursor: not-allowed;
    color: #cbd5e1;
  }

  &--primary {
    border: none;
    padding: 0.875rem 1rem;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(90deg, #2563eb 0%, #4f46e5 55%, #06b6d4 100%);
    box-shadow: 0 8px 32px rgba(37, 99, 235, 0.55);

    &:hover:not(:disabled) {
      background: linear-gradient(90deg, #2563eb 0%, #4f46e5 55%, #06b6d4 100%);
      filter: brightness(1.1);
    }
  }
}

.portal__footer {
  margin: 3rem 0 0;
  text-align: center;
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  color: rgba(100, 116, 139, 0.9);

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
}

.fade-up {
  animation: fade-up 0.7s ease-out both;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glow-pulse {
  0%,
  100% {
    opacity: 0.45;
  }
  50% {
    opacity: 0.75;
  }
}
</style>
