export const appPages = [
  { id: 'overview', label: '调度总览' },
  { id: 'map', label: '地图调度' },
  { id: 'maps', label: '地图管理' },
  { id: 'vehicles', label: '车辆中心' },
  { id: 'tasks', label: '任务中心' },
  { id: 'docks', label: '月台管理' },
  { id: 'alerts', label: '告警中心' },
  { id: 'diagnostics', label: '通信诊断' },
  { id: 'users', label: '用户管理' },
  { id: 'settings', label: '系统配置' },
  { id: 'history', label: '历史回放' },
] as const

export type AppPage = (typeof appPages)[number]['id']

export const defaultAppPage: AppPage = 'overview'
