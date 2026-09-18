# 云数中台入口门户 · portal-web

应用名称：**云数中台-yunshuDMP.cn-V1.0**

单页 SPA：三端入口选择（MT管理端 / 外网PC端 / 专网PC端），无其它业务子页面。

## 技术栈

React + TypeScript + Tailwind CSS + Lucide React

## 启动

```bash
npm install
npm run dev
```

默认端口：`http://localhost:5180`

根目录也可：`npm run dev:portal`

## MT 跳转

「MT管理端」按钮打开综合看板，地址由环境变量配置：

```
VITE_MT_DASHBOARD_URL=http://localhost:5174/stats
```
