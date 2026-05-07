'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAGVStore } from '@/lib/agv-store'
import { appPages, type AppPage } from '@/lib/app-pages'
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
        'h-screen flex flex-col bg-white border-r border-[#E2E8F0] transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#E2E8F0]">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#0891B2] flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-[#0F172A]">AGV 调度系统</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#0891B2] flex items-center justify-center mx-auto">
            <Bot className="w-5 h-5 text-white" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]',
            collapsed && 'absolute -right-3 top-5 w-6 h-6 rounded-full bg-white border border-[#E2E8F0] shadow-sm'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
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
        {!collapsed && currentUser && (
          <div className="mb-3 px-2">
            <p className="text-[#0F172A] text-sm font-medium">{currentUser.name}</p>
            <p className="text-[#64748B] text-xs">{currentUser.role}</p>
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
