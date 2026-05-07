'use client'

import { useAGVStore } from '@/lib/agv-store'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Filter,
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  Check,
  CheckCheck,
  Trash2,
  X,
  Bell
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Alert, AlertLevel } from '@/lib/agv-types'

const levelConfig: Record<AlertLevel, { label: string; class: string; icon: typeof Info; color: string }> = {
  info: { label: '信息', class: 'status-online', icon: Info, color: '#0891B2' },
  warning: { label: '警告', class: 'status-warning', icon: AlertTriangle, color: '#D97706' },
  error: { label: '错误', class: 'status-danger', icon: XCircle, color: '#DC2626' },
  critical: { label: '紧急', class: 'px-2 py-1 rounded text-xs bg-[#DC2626] text-white animate-pulse font-medium', icon: AlertCircle, color: '#DC2626' }
}

export function AlertsPage() {
  const { alerts, acknowledgeAlert, resolveAlert, clearResolvedAlerts, setCurrentPage } = useAGVStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<AlertLevel[]>([])
  const [showResolved, setShowResolved] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (!showResolved && a.resolvedAt) return false
      if (searchQuery && 
          !a.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !a.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(a.vehicleId?.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false
      }
      if (levelFilter.length > 0 && !levelFilter.includes(a.level)) {
        return false
      }
      return true
    }).sort((a, b) => {
      // 未确认的优先
      if (!a.acknowledged && b.acknowledged) return -1
      if (a.acknowledged && !b.acknowledged) return 1
      // 按时间排序
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
  }, [alerts, searchQuery, levelFilter, showResolved])
  
  const levelCounts = useMemo(() => {
    const active = alerts.filter(a => !a.resolvedAt)
    return active.reduce((acc, a) => {
      acc[a.level] = (acc[a.level] || 0) + 1
      return acc
    }, {} as Record<AlertLevel, number>)
  }, [alerts])
  
  const unacknowledgedCount = useMemo(() => {
    return alerts.filter(a => !a.acknowledged && !a.resolvedAt).length
  }, [alerts])

  const handleAcknowledgeAll = () => {
    filteredAlerts.forEach(a => {
      if (!a.acknowledged) acknowledgeAlert(a.id)
    })
  }

  return (
    <div className="h-full flex">
      {/* 主内容区 */}
      <div className="flex-1 p-6 flex flex-col">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">告警中心</h1>
            <p className="text-[#64748B] mt-1">监控和处理系统告警信息</p>
          </div>
          <div className="flex items-center gap-3">
            {unacknowledgedCount > 0 && (
              <Button 
                variant="outline"
                className="bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-[#2563EB]/10 hover:border-[#2563EB]"
                onClick={handleAcknowledgeAll}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                全部确认 ({unacknowledgedCount})
              </Button>
            )}
            <Button 
              variant="outline"
              className="bg-white border-[#E2E8F0] text-[#DC2626] hover:bg-[#DC2626]/10 hover:border-[#DC2626]"
              onClick={clearResolvedAlerts}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              清除已解决
            </Button>
          </div>
        </div>

        {/* 级别统计卡 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(['critical', 'error', 'warning', 'info'] as AlertLevel[]).map(level => {
            const config = levelConfig[level]
            const Icon = config.icon
            return (
              <button
                key={level}
                onClick={() => {
                  if (levelFilter.includes(level)) {
                    setLevelFilter(levelFilter.filter(l => l !== level))
                  } else {
                    setLevelFilter([...levelFilter, level])
                  }
                }}
                className={cn(
                  "agv-panel p-4 text-left transition-all",
                  levelFilter.includes(level) && "ring-1 ring-[#2563EB]"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5" style={{ color: config.color }} />
                  {level === 'critical' && levelCounts[level] > 0 && (
                    <div className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
                  )}
                </div>
                <p className="text-[#64748B] text-sm">{config.label}</p>
                <p className="kpi-number text-2xl font-bold text-[#0F172A]">
                  {levelCounts[level] || 0}
                </p>
              </button>
            )
          })}
        </div>

        {/* 搜索和过滤 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input
              placeholder="搜索告警..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>
          
          <Button 
            variant="outline"
            className={cn(
              "bg-white border-[#E2E8F0]",
              showResolved ? "text-[#2563EB] border-[#2563EB]" : "text-[#64748B]"
            )}
            onClick={() => setShowResolved(!showResolved)}
          >
            显示已解决
          </Button>
          
          {levelFilter.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLevelFilter([])}
              className="text-[#DC2626] hover:text-[#DC2626] hover:bg-[#DC2626]/10"
            >
              清除筛选
            </Button>
          )}
          
          <div className="flex-1" />
          
          <span className="text-[#64748B] text-sm">
            共 {filteredAlerts.length} 条
          </span>
        </div>

        {/* 告警列表 */}
        <div className="flex-1 agv-panel overflow-hidden">
          <div className="overflow-auto h-full custom-scrollbar divide-y divide-[#E2E8F0]">
            {filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#94A3B8]">
                <Bell className="w-12 h-12 mb-4 opacity-50" />
                <p>暂无告警信息</p>
              </div>
            ) : (
              filteredAlerts.map(alert => {
                const config = levelConfig[alert.level]
                const Icon = config.icon
                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={cn(
                      "p-4 flex items-start gap-4 cursor-pointer transition-colors hover:bg-[#F8FAFC]",
                      selectedAlert?.id === alert.id && "bg-[#2563EB]/5",
                      !alert.acknowledged && !alert.resolvedAt && "border-l-2",
                      !alert.acknowledged && !alert.resolvedAt && alert.level === 'critical' && "border-l-[#DC2626]",
                      !alert.acknowledged && !alert.resolvedAt && alert.level === 'error' && "border-l-[#DC2626]",
                      !alert.acknowledged && !alert.resolvedAt && alert.level === 'warning' && "border-l-[#D97706]",
                      !alert.acknowledged && !alert.resolvedAt && alert.level === 'info' && "border-l-[#0891B2]"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      alert.level === 'critical' ? "bg-[#DC2626]/10" :
                      alert.level === 'error' ? "bg-[#DC2626]/10" :
                      alert.level === 'warning' ? "bg-[#D97706]/10" : "bg-[#0891B2]/10"
                    )}>
                      <Icon className="w-5 h-5" style={{ color: config.color }} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-[#0F172A] font-medium truncate">{alert.title}</h4>
                        <span className={config.class}>{config.label}</span>
                        {alert.resolvedAt && (
                          <span className="status-success text-xs px-2 py-0.5 rounded">已解决</span>
                        )}
                        {!alert.resolvedAt && alert.acknowledged && (
                          <span className="status-offline text-xs px-2 py-0.5 rounded">已确认</span>
                        )}
                      </div>
                      <p className="text-[#64748B] text-sm truncate">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#94A3B8]">
                        {alert.vehicleId && (
                          <span className="font-mono">{alert.vehicleId}</span>
                        )}
                        <span>{alert.timestamp.toLocaleString('zh-CN')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!alert.acknowledged && !alert.resolvedAt && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-[#2563EB] hover:text-[#2563EB] hover:bg-[#2563EB]/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            acknowledgeAlert(alert.id)
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      {!alert.resolvedAt && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-[#16A34A] hover:text-[#16A34A] hover:bg-[#16A34A]/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            resolveAlert(alert.id)
                          }}
                        >
                          <CheckCheck className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* 右侧详情面板 */}
      {selectedAlert && (
        <div className="w-80 bg-white border-l border-[#E2E8F0] flex flex-col shadow-lg">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h3 className="text-[#0F172A] font-semibold">告警详情</h3>
              <p className="text-[#64748B] text-sm">{selectedAlert.id}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedAlert(null)} className="text-[#94A3B8] hover:text-[#0F172A]">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            {/* 级别 */}
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] text-sm">告警级别</span>
              <span className={levelConfig[selectedAlert.level].class}>
                {levelConfig[selectedAlert.level].label}
              </span>
            </div>

            {/* 状态 */}
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] text-sm">处理状态</span>
              {selectedAlert.resolvedAt ? (
                <span className="status-success px-2 py-1 rounded text-xs">已解决</span>
              ) : selectedAlert.acknowledged ? (
                <span className="status-offline px-2 py-1 rounded text-xs">已确认</span>
              ) : (
                <span className="status-danger px-2 py-1 rounded text-xs">待处理</span>
              )}
            </div>

            {/* 标题 */}
            <div>
              <p className="text-[#64748B] text-sm mb-1">告警标题</p>
              <p className="text-[#0F172A]">{selectedAlert.title}</p>
            </div>

            {/* 详情 */}
            <div>
              <p className="text-[#64748B] text-sm mb-1">详细信息</p>
              <p className="text-[#0F172A] text-sm">{selectedAlert.message}</p>
            </div>

            {/* 关联车辆 */}
            {selectedAlert.vehicleId && (
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <p className="text-[#64748B] text-sm mb-1">关联车辆</p>
                <p className="text-[#0F172A] font-mono">{selectedAlert.vehicleId}</p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="mt-2 text-[#2563EB] hover:text-[#2563EB] hover:bg-[#2563EB]/10 p-0 h-auto"
                  onClick={() => setCurrentPage('vehicles')}
                >
                  查看车辆详情 →
                </Button>
              </div>
            )}

            {/* 时间信息 */}
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-[#64748B] text-sm mb-2">时间线</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">触发时间</span>
                  <span className="text-[#0F172A]">{selectedAlert.timestamp.toLocaleString('zh-CN')}</span>
                </div>
                {selectedAlert.resolvedAt && (
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">解决时间</span>
                    <span className="text-[#0F172A]">{selectedAlert.resolvedAt.toLocaleString('zh-CN')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="p-4 border-t border-[#E2E8F0] space-y-2">
            {!selectedAlert.acknowledged && !selectedAlert.resolvedAt && (
              <Button 
                variant="outline" 
                className="w-full bg-white border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/10"
                onClick={() => acknowledgeAlert(selectedAlert.id)}
              >
                <Check className="w-4 h-4 mr-2" />
                确认告警
              </Button>
            )}
            {!selectedAlert.resolvedAt && (
              <Button 
                variant="outline" 
                className="w-full bg-white border-[#16A34A]/20 text-[#16A34A] hover:bg-[#16A34A]/10"
                onClick={() => resolveAlert(selectedAlert.id)}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                标记为已解决
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
