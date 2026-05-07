'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAGVStore } from '@/lib/agv-store'
import { appPages, type AppPage } from '@/lib/app-pages'
import { userRoleLabels } from '@/lib/agv-types'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  Bot,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Map,
  MapPinned,
  Radio,
  Settings2,
  ShieldUser,
  Truck,
  type LucideIcon,
  Warehouse,
} from 'lucide-react'

const navIcons: Record<AppPage, LucideIcon> = {
  overview: LayoutDashboard,
  map: Map,
  maps: MapPinned,
  vehicles: Truck,
  tasks: ClipboardList,
  docks: Warehouse,
  alerts: AlertTriangle,
  diagnostics: Radio,
  users: ShieldUser,
  settings: Settings2,
  history: History,
}

const navItems = appPages.map((item) => ({
  ...item,
  icon: navIcons[item.id],
}))

export function SidebarNav() {
  const { currentPage, setCurrentPage, logout, stats, currentUser } = useAGVStore()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'relative h-screen flex flex-col bg-white border-r border-[#E2E8F0] transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div
        className={cn(
          'h-16 border-b border-[#E2E8F0]',
          collapsed ? 'flex items-center justify-center px-2' : 'flex items-center px-4'
        )}
      >
        {!collapsed ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#0891B2] flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-[#0F172A] truncate">AGV 调度系统</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#0891B2] flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            const hasAlert = item.id === 'alerts' && stats.criticalAlerts > 0

            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]',
                    isActive && 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20',
                    collapsed && 'justify-center px-0'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="relative">
                    <Icon className={cn('w-5 h-5', isActive && 'text-[#2563EB]')} />
                    {hasAlert && <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#DC2626] rounded-full animate-pulse" />}
                  </div>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                      {item.id === 'alerts' && stats.alertCount > 0 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20">
                          {stats.alertCount}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'mb-3 w-full rounded-xl text-[#64748B] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A]',
            collapsed
              ? 'flex h-10 items-center justify-center border border-transparent'
              : 'flex items-center justify-between px-3 py-2 text-sm'
          )}
          title={collapsed ? '展开导航' : '折叠导航'}
        >
          <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>收起导航</span>}
          </div>
          {!collapsed && <span className="text-xs text-[#94A3B8]">侧栏</span>}
        </button>

        {!collapsed && currentUser && (
          <div className="mb-3 px-2">
            <p className="text-[#0F172A] text-sm font-medium">{currentUser.name}</p>
            <p className="text-[#64748B] text-xs">{userRoleLabels[currentUser.role]}</p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            'w-full text-[#475569] hover:text-[#DC2626] hover:bg-[#DC2626]/10',
            collapsed ? 'px-0 justify-center' : 'justify-start'
          )}
          title={collapsed ? '退出登录' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-3">退出登录</span>}
        </Button>
      </div>
    </aside>
  )
}
