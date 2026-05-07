'use client'

import { useMemo, useState } from 'react'
import { useAGVStore } from '@/lib/agv-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { VehicleStatus } from '@/lib/agv-types'
import { Filter, MapPin, Search, ChevronRight } from 'lucide-react'
import { AgvDetailPanel } from '@/components/agv-detail-panel'

const statusLabels: Record<VehicleStatus, { label: string; className: string }> = {
  online: { label: '在线', className: 'status-online' },
  offline: { label: '离线', className: 'status-offline' },
  warning: { label: '告警', className: 'status-warning' },
  error: { label: '故障', className: 'status-danger' },
  charging: { label: '充电中', className: 'status-success' },
  idle: { label: '空闲', className: 'status-online' },
  busy: { label: '执行中', className: 'status-primary' },
}

export function VehiclesPage() {
  const { vehicles, selectedVehicle, selectVehicle, updateVehicle, setCurrentPage } = useAGVStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<VehicleStatus[]>([])
  const [mapFilter, setMapFilter] = useState<string[]>([])

  const maps = useMemo(() => [...new Set(vehicles.map((vehicle) => vehicle.map))], [vehicles])

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      if (
        searchQuery &&
        !vehicle.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !vehicle.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      if (statusFilter.length > 0 && !statusFilter.includes(vehicle.status)) {
        return false
      }
      if (mapFilter.length > 0 && !mapFilter.includes(vehicle.map)) {
        return false
      }
      return true
    })
  }, [vehicles, searchQuery, statusFilter, mapFilter])

  const statusCounts = useMemo(() => {
    return vehicles.reduce((acc, vehicle) => {
      acc[vehicle.status] = (acc[vehicle.status] || 0) + 1
      return acc
    }, {} as Record<VehicleStatus, number>)
  }, [vehicles])

  return (
    <div className="h-full flex">
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">车辆中心</h1>
            <p className="text-[#64748B] mt-1">管理并查看所有 AGV 的实时状态与详情。</p>
          </div>
          <Button
            variant="outline"
            className="bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9]"
            onClick={() => setCurrentPage('map')}
          >
            <MapPin className="w-4 h-4 mr-2" />
            查看地图
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {(['online', 'busy', 'idle', 'charging', 'warning', 'error', 'offline'] as VehicleStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => {
                if (statusFilter.includes(status)) {
                  setStatusFilter(statusFilter.filter((item) => item !== status))
                } else {
                  setStatusFilter([...statusFilter, status])
                }
              }}
              className={cn(
                'agv-panel p-3 text-left transition-all',
                statusFilter.includes(status) && 'ring-1 ring-[#2563EB]'
              )}
            >
              <p className="text-[#64748B] text-xs mb-1">{statusLabels[status].label}</p>
              <p className="kpi-number text-xl font-bold text-[#0F172A]">{statusCounts[status] || 0}</p>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input
              placeholder="搜索车辆编号或名称..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10 bg-white border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white border-[#E2E8F0] text-[#0F172A]">
                <Filter className="w-4 h-4 mr-2" />
                地图筛选
                {mapFilter.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-[#2563EB] text-white rounded text-xs">{mapFilter.length}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border-[#E2E8F0] shadow-lg">
              {maps.map((mapName) => (
                <DropdownMenuCheckboxItem
                  key={mapName}
                  checked={mapFilter.includes(mapName)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setMapFilter([...mapFilter, mapName])
                    } else {
                      setMapFilter(mapFilter.filter((item) => item !== mapName))
                    }
                  }}
                  className="text-[#0F172A]"
                >
                  {mapName}
                </DropdownMenuCheckboxItem>
              ))}
              {mapFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator className="bg-[#E2E8F0]" />
                  <button
                    className="w-full px-2 py-1.5 text-sm text-[#DC2626] hover:bg-[#DC2626]/10 text-left"
                    onClick={() => setMapFilter([])}
                  >
                    清除地图筛选
                  </button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {(statusFilter.length > 0 || mapFilter.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter([])
                setMapFilter([])
              }}
              className="text-[#DC2626] hover:text-[#DC2626] hover:bg-[#DC2626]/10"
            >
              清除全部筛选
            </Button>
          )}

          <div className="flex-1" />
          <span className="text-[#64748B] text-sm">共 {filteredVehicles.length} 辆</span>
        </div>

        <div className="flex-1 agv-panel overflow-hidden">
          <div className="overflow-auto h-full custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-[#E2E8F0] hover:bg-transparent">
                  <TableHead className="text-[#64748B]">车辆编号</TableHead>
                  <TableHead className="text-[#64748B]">状态</TableHead>
                  <TableHead className="text-[#64748B]">当前地图</TableHead>
                  <TableHead className="text-[#64748B]">电量</TableHead>
                  <TableHead className="text-[#64748B]">急停</TableHead>
                  <TableHead className="text-[#64748B]">当前任务</TableHead>
                  <TableHead className="text-[#64748B]">最后心跳</TableHead>
                  <TableHead className="text-[#64748B] w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow
                    key={vehicle.id}
                    className={cn(
                      'border-[#E2E8F0] cursor-pointer transition-colors',
                      selectedVehicle?.id === vehicle.id ? 'bg-[#2563EB]/5' : 'hover:bg-[#F8FAFC]'
                    )}
                    onClick={() => selectVehicle(vehicle.id)}
                  >
                    <TableCell className="font-medium text-[#0F172A]">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            vehicle.status === 'online' || vehicle.status === 'idle'
                              ? 'bg-[#0891B2]'
                              : vehicle.status === 'busy'
                                ? 'bg-[#2563EB]'
                                : vehicle.status === 'charging'
                                  ? 'bg-[#16A34A]'
                                  : vehicle.status === 'warning'
                                    ? 'bg-[#D97706]'
                                    : vehicle.status === 'error'
                                      ? 'bg-[#DC2626]'
                                      : 'bg-[#94A3B8]'
                          )}
                        />
                        <span>{vehicle.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={statusLabels[vehicle.status].className}>{statusLabels[vehicle.status].label}</span>
                    </TableCell>
                    <TableCell className="text-[#475569]">{vehicle.map}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              vehicle.battery > 50 ? 'bg-[#16A34A]' : vehicle.battery > 20 ? 'bg-[#D97706]' : 'bg-[#DC2626]'
                            )}
                            style={{ width: `${vehicle.battery}%` }}
                          />
                        </div>
                        <span className="text-[#475569] text-sm kpi-number">{vehicle.battery}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {vehicle.emergencyStop ? (
                        <span className="status-danger px-2 py-1 rounded text-xs">已触发</span>
                      ) : (
                        <span className="text-[#94A3B8] text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[#475569] font-mono text-sm">{vehicle.currentTask || '-'}</TableCell>
                    <TableCell className="text-[#64748B] text-sm">
                      {vehicle.lastHeartbeat.toLocaleTimeString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-[#2563EB] hover:text-[#2563EB] hover:bg-[#2563EB]/10">
                        详情
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {selectedVehicle && (
        <AgvDetailPanel
          vehicle={selectedVehicle}
          onClose={() => selectVehicle(null)}
          onLocateMap={() => setCurrentPage('map')}
          onUpdateVehicle={(updates) => updateVehicle(selectedVehicle.id, updates)}
        />
      )}
    </div>
  )
}
