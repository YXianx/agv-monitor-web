'use client'

import { useAGVStore } from '@/lib/agv-store'
import { 
  Wifi, 
  Server, 
  Clock, 
  Bell,
  Truck,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function TopStatusBar() {
  const { stats, alerts, setCurrentPage, acknowledgeAlert } = useAGVStore()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date())
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged && !a.resolvedAt).slice(0, 5)
  const dateLabel = currentTime
    ? currentTime.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    : '--/--'
  const timeLabel = currentTime
    ? currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--'

  return (
    <header className="h-14 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 shadow-sm">
      {/* 左侧：关键状态指标 */}
      <div className="flex items-center gap-6">
        {/* 在线车辆 */}
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#0891B2]" />
          <span className="text-[#475569] text-sm">在线车辆</span>
          <span className="kpi-number text-[#0F172A] font-semibold">
            {stats.onlineVehicles}
            <span className="text-[#94A3B8] font-normal">/{stats.totalVehicles}</span>
          </span>
        </div>

        {/* 执行任务 */}
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#16A34A]" />
          <span className="text-[#475569] text-sm">执行中</span>
          <span className="kpi-number text-[#0F172A] font-semibold">{stats.activeTasks}</span>
        </div>

        {/* 排队任务 */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#D97706]" />
          <span className="text-[#475569] text-sm">排队中</span>
          <span className="kpi-number text-[#0F172A] font-semibold">{stats.queuedTasks}</span>
        </div>

        {/* 告警数 */}
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
          <span className="text-[#475569] text-sm">告警</span>
          <span className={`kpi-number font-semibold ${stats.criticalAlerts > 0 ? 'text-[#DC2626]' : 'text-[#0F172A]'}`}>
            {stats.alertCount}
          </span>
        </div>
      </div>

      {/* 右侧：系统状态和时间 */}
      <div className="flex items-center gap-4">
        {/* 系统状态 */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <Wifi className="w-4 h-4 text-[#94A3B8]" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <Server className="w-4 h-4 text-[#94A3B8]" />
          </div>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-6 bg-[#E2E8F0]" />

        {/* 告警通知 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]">
              <Bell className="w-5 h-5" />
              {unacknowledgedAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#DC2626] rounded-full text-white text-xs flex items-center justify-center">
                  {unacknowledgedAlerts.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-white border-[#E2E8F0] shadow-lg">
            <div className="px-3 py-2 border-b border-[#E2E8F0]">
              <p className="text-[#0F172A] font-medium">最新告警</p>
            </div>
            {unacknowledgedAlerts.length === 0 ? (
              <div className="px-3 py-4 text-center text-[#94A3B8] text-sm">
                暂无未处理告警
              </div>
            ) : (
              <>
                {unacknowledgedAlerts.map((alert) => (
                  <DropdownMenuItem 
                    key={alert.id} 
                    className="flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-[#F1F5F9]"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      alert.level === 'critical' ? 'bg-[#DC2626]' :
                      alert.level === 'error' ? 'bg-[#DC2626]' :
                      alert.level === 'warning' ? 'bg-[#D97706]' : 'bg-[#0891B2]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#0F172A] text-sm font-medium truncate">{alert.title}</p>
                      <p className="text-[#94A3B8] text-xs truncate">{alert.message}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
                <div className="px-3 py-2 border-t border-[#E2E8F0]">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-[#2563EB] hover:text-[#2563EB] hover:bg-[#2563EB]/10"
                    onClick={() => setCurrentPage('alerts')}
                  >
                    查看全部告警
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 时间显示 */}
        <div className="flex items-center gap-2 text-[#0F172A]">
          <Clock className="w-4 h-4 text-[#94A3B8]" />
          <span className="kpi-number text-sm">{dateLabel}</span>
          <span className="kpi-number text-sm font-semibold">{timeLabel}</span>
        </div>
      </div>
    </header>
  )
}
