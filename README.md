# AGV 调度系统前端

这是一个从 `v0` 导出后继续整理的 `Next.js 16 + React 19 + TypeScript` 项目，当前适合作为 AGV 现场 PC 端的前端原型和接口联调底座。

## 当前状态

- UI、布局和页面骨架已经具备
- 页面切换基于 `Zustand` 的本地状态
- 业务数据目前主要来自 `lib/mock-data.ts`
- 适合先做页面迭代、接口接入、权限与登录改造

## 技术栈

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `shadcn/ui`
- `Zustand`

## 目录说明

- `app/`: Next.js 应用入口
- `components/`: 页面组件、布局组件和基础 UI 组件
- `components/pages/`: 各业务页面
- `lib/`: 类型、状态管理、页面定义和模拟数据
- `public/`: 静态资源
- `styles/`: 旧样式入口，目前以 `app/globals.css` 为主

## 常用命令

```bash
npm install
npm run dev
npm run build
npm run typecheck
```

## 开发约定

- 页面定义统一维护在 `lib/app-pages.ts`
- 页面渲染入口集中在 `components/page-renderer.tsx`
- 布局壳层由 `components/main-layout.tsx` 负责
- 状态管理集中在 `lib/agv-store.ts`

## 本地运行提示

- Next.js 16 需要 `Node.js >= 20.9`
- 如果你本机使用 `nvm` 或 `nvmd`，先确认 `node -v` 和 `npm -v` 指向的是有效版本
- 当前项目里同时存在 `package-lock.json` 和 `pnpm-lock.yaml`，后续建议固定一种包管理器再继续迭代
