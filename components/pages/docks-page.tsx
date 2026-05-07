'use client'

import { useAGVStore } from '@/lib/agv-store'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Filter,
  Warehouse,
  Truck,
  Clock,
  X,
  Power,
  PowerOff,
  Unlock,
  List,
  LayoutGrid
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Dock, DockStatus } from '@/lib/agv-types'

const statusConfig: Record<DockStatus, { label: string; class: string; color: string }> = {
  available: { label: '可用', class: 'status-success', color: '#16A34A' },
  occupied: { label: '占用中', class: 'status-warning', color: '#D97706' },
  disabled: { label: '已禁用', class: 'status-offline', color: '#64748B' },
  maintenance: { label: '维护中', class: 'status-danger', color: '#DC2626' }
}

export function DocksPage() {
  const { docks, selectedDock, selectDock, updateDock, releaseDock } = useAGVStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DockStatus[]>([])
  const [zoneFilter, setZoneFilter] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const zones = useMemo(() => {
    return [...new Set(docks.map(d => d.zone))]
  }, [docks])
  
  const filteredDocks = useMemo(() => {
    return docks.filter(d => {
      if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !d.id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (statusFilter.length > 0 && !statusFilter.includes(d.status)) {
        return false
      }
      if (zoneFilter.length > 0 && !zoneFilter.includes(d.zone)) {
        return false
      }
      return true
    })
  }, [docks, searchQuery, statusFilter, zoneFilter])
  
  const statusCounts = useMemo(() => {
    return docks.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1
      return acc
    }, {} as Record<DockStatus, number>)
  }, [docks])
  
  const groupedDocks = useMemo(() => {
    return zones.reduce((acc, zone) => {
      acc[zone] = filteredDocks.filter(d => d.zone === zone)
      return acc
    }, {} as Record<string, Dock[]>)
  }, [filteredDocks, zones])

  return (
    <div className="h-full flex">
      {/* 主内容区 */}
      <div className="flex-1 p-6 flex flex-col">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">月台管理</h1>
            <p className="text-[#64748B] mt-1">监控和管理所有月台的状态与排队情况</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="icon"
              className={cn(
                "bg-[#FFFFFF] border-[#E2E8F0]",
                viewMode === 'grid' ? "text-[#2563EB] border-[#2563EB]" : "text-[#64748B]"
              )}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline"
              size="icon"
              className={cn(
                "bg-[#FFFFFF] border-[#E2E8F0]",
                viewMode === 'list' ? "text-[#2563EB] border-[#2563EB]" : "text-[#64748B]"
              )}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 状态统计卡 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(['available', 'occupied', 'disabled', 'maintenance'] as DockStatus[]).map(status => {
            const config = statusConfig[status]
            return (
              <button
                key={status}
                onClick={() => {
                  if (statusFilter.includes(status)) {
                    setStatusFilter(statusFilter.filter(s => s !== status))
                  } else {
                    setStatusFilter([...statusFilter, status])
                  }
                }}
                className={cn(
                  "agv-panel p-4 text-left transition-all",
                  statusFilter.includes(status) && "ring-1 ring-[#2563EB]"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                  <Warehouse className="w-5 h-5 text-[#64748B]" />
                </div>
                <p className="text-[#64748B] text-sm">{config.label}</p>
                <p className="kpi-number text-2xl font-bold text-[#0F172A]">
                  {statusCounts[status] || 0}
                </p>
              </button>
            )
          })}
        </div>

        {/* 搜索和过滤 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <Input
              placeholder="搜索月台..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#64748B]"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]">
                <Filter className="w-4 h-4 mr-2" />
                区域筛选
                {zoneFilter.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-[#2563EB] rounded text-xs">{zoneFilter.length}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#F1F5F9] border-[#E2E8F0]">
              {zones.map(zone => (
                <DropdownMenuCheckboxItem
                  key={zone}
                  checked={zoneFilter.includes(zone)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setZoneFilter([...zoneFilter, zone])
                    } else {
                      setZoneFilter(zoneFilter.filter(z => z !== zone))
                    }
                  }}
                  className="text-[#0F172A]"
                >
                  {zone}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {(statusFilter.length > 0 || zoneFilter.length > 0) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => { setStatusFilter([]); setZoneFilter([]) }}
              className="text-[#DC2626] hover:text-[#DC2626] hover:bg-[#DC2626]/10"
            >
              清除筛选
            </Button>
          )}
        </div>

        {/* 月台列表 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
          {Object.entries(groupedDocks).map(([zone, zoneDocks]) => (
            zoneDocks.length > 0 && (
              <div key={zone}>
                <div className="flex items-center gap-2 mb-3">
                  <Warehouse className="w-4 h-4 text-[#64748B]" />
                  <h3 className="text-[#0F172A] font-semibold">{zone}</h3>
                  <span className="text-[#64748B] text-sm">({zoneDocks.length})</span>
                </div>
                
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {zoneDocks.map(dock => {
                      const config = statusConfig[dock.status]
                      return (
                        <button
                          key={dock.id}
                          onClick={() => selectDock(dock.id)}
                          className={cn(
                            "agv-panel p-4 text-left transition-all hover:border-[#2563EB]/50",
                            selectedDock?.id === dock.id && "ring-1 ring-[#2563EB]"
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[#0F172A] font-medium">{dock.name}</span>
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: config.color }}
                            />
                          </div>
                          
                          <span className={cn("text-xs px-2 py-1 rounded", config.class)}>
                            {config.label}
                          </span>
                          
                          {dock.status === 'occupied' && (
                            <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                              <div className="flex items-center gap-2 text-sm">
                                <Truck className="w-4 h-4 text-[#D97706]" />
                                <span className="text-[#0F172A] font-mono">{dock.currentVehicle}</span>
                              </div>
                            </div>
                          )}
                          
                          {dock.queueCount > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-[#64748B] text-xs">
                              <Clock className="w-3 h-3" />
                              <span>排队 {dock.queueCount} 辆</span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="agv-panel divide-y divide-[#E2E8F0]">
                    {zoneDocks.map(dock => {
                      const config = statusConfig[dock.status]
                      return (
                        <button
                          key={dock.id}
                          onClick={() => selectDock(dock.id)}
                          className={cn(
                            "w-full p-4 flex items-center gap-4 text-left transition-colors hover:bg-[#F1F5F9]",
                            selectedDock?.id === dock.id && "bg-[#2563EB]/10"
                          )}
                        >
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: config.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[#0F172A] font-medium">{dock.name}</p>
                            <p className="text-[#64748B] text-sm">{dock.id}</p>
                          </div>
                          <span className={cn("text-xs px-2 py-1 rounded flex-shrink-0", config.class)}>
                            {config.label}
                          </span>
                          {dock.currentVehicle && (
                            <div className="flex items-center gap-2 text-sm flex-shrink-0">
                              <Truck className="w-4 h-4 text-[#D97706]" />
                              <span className="text-[#0F172A] font-mono">{dock.currentVehicle}</span>
                            </div>
                          )}
                          {dock.queueCount > 0 && (
                            <div className="flex items-center gap-1 text-[#64748B] text-xs flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              <span>{dock.queueCount}</span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          ))}
        </div>
      </div>

      {/* 右侧详情面板 */}
      {selectedDock && (
        <div className="w-80 bg-[#F1F5F9] border-l border-[#E2E8F0] flex flex-col">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h3 className="text-[#0F172A] font-semibold">{selectedDock.name}</h3>
              <p className="text-[#64748B] text-sm">{selectedDock.id}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => selectDock(null)} className="text-[#64748B] hover:text-[#0F172A]">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            {/* 状态 */}
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] text-sm">当前状态</span>
              <span className={statusConfig[selectedDock.status].class}>
                {statusConfig[selectedDock.status].label}
              </span>
            </div>

            {/* 区域 */}
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] text-sm">所属区域</span>
              <span className="text-[#0F172A]">{selectedDock.zone}</span>
            </div>

            {/* 排队情况 */}
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] text-sm">排队车辆</span>
              <span className="kpi-number text-[#0F172A]">{selectedDock.queueCount} 辆</span>
            </div>

            {/* 当前占用 */}
            {selectedDock.currentVehicle && (
              <div className="p-3 rounded-lg bg-[#D97706]/10 border border-[#D97706]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-[#D97706]" />
                  <span className="text-[#D97706] font-medium">当前占用车辆</span>
                </div>
                <p className="text-[#0F172A] font-mono">{selectedDock.currentVehicle}</p>
                {selectedDock.currentTask && (
                  <p className="text-[#64748B] text-sm mt-1">任务: {selectedDock.currentTask}</p>
                )}
              </div>
            )}

            {/* 最后更新 */}
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] text-sm">最后更新</span>
              <span className="text-[#0F172A] text-sm">
                {selectedDock.lastUpdated.toLocaleTimeString('zh-CN')}
              </span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="p-4 border-t border-[#E2E8F0] space-y-2">
            {selectedDock.status === 'occupied' && (
              <Button 
                variant="outline" 
                className="w-full bg-[#FFFFFF] border-[#16A34A]/30 text-[#16A34A] hover:bg-[#16A34A]/10"
                onClick={() => releaseDock(selectedDock.id)}
              >
                <Unlock className="w-4 h-4 mr-2" />
                释放月台
              </Button>
            )}
            
            {selectedDock.status === 'available' && (
              <Button 
                variant="outline" 
                className="w-full bg-[#FFFFFF] border-[#DC2626]/30 text-[#DC2626] hover:bg-[#DC2626]/10"
                onClick={() => updateDock(selectedDock.id, { status: 'disabled' })}
              >
                <PowerOff className="w-4 h-4 mr-2" />
                禁用月台
              </Button>
            )}
            
            {selectedDock.status === 'disabled' && (
              <Button 
                variant="outline" 
                className="w-full bg-[#FFFFFF] border-[#16A34A]/30 text-[#16A34A] hover:bg-[#16A34A]/10"
                onClick={() => updateDock(selectedDock.id, { status: 'available' })}
              >
                <Power className="w-4 h-4 mr-2" />
                启用月台
              </Button>
            )}
            
            {selectedDock.status !== 'maintenance' && (
              <Button 
                variant="outline" 
                className="w-full bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] hover:bg-[#D97706]/10 hover:border-[#D97706]"
                onClick={() => updateDock(selectedDock.id, { status: 'maintenance' })}
              >
                设为维护中
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
