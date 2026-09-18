import {
  ArrowRight,
  LayoutDashboard,
  Settings2,
  Smartphone,
} from 'lucide-react'

const MT_DASHBOARD_URL =
  import.meta.env.VITE_MT_DASHBOARD_URL || 'http://localhost:5174/stats'

function App() {
  const openMtDashboard = () => {
    window.open(MT_DASHBOARD_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-[#0B132B] via-[#1C2541] to-[#0B132B]">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 grid-dot" />
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-600/25 blur-[100px] animate-glow-pulse" />
      <div className="pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-cyan-400/15 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-indigo-500/20 blur-[90px]" />

      <div className="relative z-10 mx-auto flex min-h-full max-w-6xl flex-col px-6 pb-10 pt-6 lg:px-8">
        {/* Header */}
        <header className="flex items-center justify-between animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-400 shadow-[0_0_24px_rgba(59,130,246,0.45)]">
              <span className="text-lg font-extrabold tracking-tight text-white">KN</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-wide text-white">云数中台</h1>
              <span className="rounded-full border border-blue-400/40 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-200">
                C&amp;C
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-4 backdrop-blur-md">
            <img
              src="/avatar.jpg"
              alt="产品经理余斌"
              className="h-9 w-9 rounded-full object-cover ring-2 ring-blue-400/30"
            />
            <span className="text-sm font-medium text-slate-100">产品经理：余斌</span>
          </div>
        </header>

        {/* Main — 略偏下垂直居中 */}
        <main className="flex flex-1 flex-col justify-center pb-8 pt-40 md:pt-48">
          <section className="mb-10 text-center animate-fade-up" style={{ animationDelay: '80ms' }}>
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <span aria-hidden>✨</span>
              <span>请选择登录进入 WZGA 各平台入口</span>
            </div>
            <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              云数中台 原型设计门户
            </h2>
            <p className="mx-auto max-w-3xl text-base leading-relaxed text-slate-300/90 md:text-lg">
              统一管理数据接入与推送的配置、机构可对比各供数厂商数据接入情况。
            </p>
          </section>

          {/* Cards */}
          <section
            className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch animate-fade-up"
            style={{ animationDelay: '160ms' }}
          >
            {/* Left: MT */}
            <article className="group flex flex-col rounded-2xl border border-white/10 bg-[#121a33]/80 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:shadow-[0_12px_48px_rgba(37,99,235,0.18)]">
              <span className="mb-5 w-fit rounded-md bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-200">
                MT后台管理系统
              </span>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-[#0B132B]">
                <Settings2 className="h-7 w-7 text-slate-200" strokeWidth={1.75} />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-white">MT管理端</h3>
              <p className="mb-8 flex-1 text-sm leading-relaxed text-slate-400">
                MT后台对系统配置及应用级的各项参数的管理。
              </p>
              <button
                type="button"
                onClick={openMtDashboard}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-blue-400/40 hover:bg-blue-500/15"
              >
                MT管理端
              </button>
            </article>

            {/* Center: highlighted */}
            <article className="relative flex flex-col rounded-2xl border-2 border-blue-500 bg-[#121a33]/90 p-6 shadow-[0_0_0_1px_rgba(59,130,246,0.35),0_0_48px_rgba(37,99,235,0.45),0_16px_48px_rgba(0,0,0,0.4)] backdrop-blur-sm transition duration-300 hover:-translate-y-1.5 md:-mt-2 md:mb-[-0.5rem]">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-0.5 text-[11px] font-semibold text-white shadow-[0_0_16px_rgba(59,130,246,0.55)]">
                核心入口 · 推荐
              </span>
              <span className="mb-5 w-fit rounded-md bg-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-100">
                云数中台 互联网通道
              </span>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-400 shadow-[0_0_28px_rgba(59,130,246,0.55)]">
                <LayoutDashboard className="h-7 w-7 text-white" strokeWidth={1.75} />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-white">外网PC端</h3>
              <p className="mb-8 flex-1 text-sm leading-relaxed text-slate-300">
                互联网用户使用此入口登录PC端。
              </p>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_32px_rgba(37,99,235,0.55)] transition hover:brightness-110"
              >
                进入 外网PC端登录入口
                <ArrowRight className="h-4 w-4" />
              </button>
            </article>

            {/* Right: 专网 / 移动端 */}
            <article className="group flex flex-col rounded-2xl border border-white/10 bg-[#121a33]/80 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:shadow-[0_12px_48px_rgba(37,99,235,0.18)]">
              <span className="mb-5 w-fit rounded-md bg-slate-500/20 px-2.5 py-1 text-xs font-medium text-slate-300">
                云数中台 移动端
              </span>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-[#0B132B]">
                <Smartphone className="h-7 w-7 text-slate-200" strokeWidth={1.75} />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-white">专网PC端</h3>
              <p className="mb-8 flex-1 text-sm leading-relaxed text-slate-400">敬请期待。</p>
              <button
                type="button"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10"
              >
                进入 专网登录入口
              </button>
            </article>
          </section>

          <p
            className="mt-12 text-center text-xs tracking-wide text-slate-500/90 animate-fade-up md:text-sm"
            style={{ animationDelay: '240ms' }}
          >
            云数中台系统 · yunshuDMP.cn · 等保三级安全认证 · 多租户权限体系统一
          </p>
        </main>
      </div>
    </div>
  )
}

export default App
