'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CameraSensorCode, Vehicle, VehicleStatus, VehicleTaskStatus } from '@/lib/agv-types'
import {
  AlertTriangle,
  Battery,
  Camera,
  Cpu,
  Gauge,
  MapPin,
  Navigation,
  Pause,
  Play,
  StopCircle,
  X,
} from 'lucide-react'

const vehicleStatusLabels: Record<VehicleStatus, { label: string; className: string }> = {
  online: { label: '在线', className: 'status-online' },
  offline: { label: '离线', className: 'status-offline' },
  warning: { label: '告警', className: 'status-warning' },
  error: { label: '故障', className: 'status-danger' },
  charging: { label: '充电中', className: 'status-success' },
  idle: { label: '空闲', className: 'status-online' },
  busy: { label: '执行中', className: 'status-primary' },
}

const taskStatusLabels: Record<VehicleTaskStatus, { label: string; className: string }> = {
  waiting: { label: '待执行', className: 'status-warning' },
  active: { label: '执行中', className: 'status-primary' },
  running: { label: '执行中', className: 'status-primary' },
  finished: { label: '已完成', className: 'status-success' },
  failed: { label: '已失败', className: 'status-danger' },
  canceled: { label: '已取消', className: 'status-offline' },
  unknown: { label: '-', className: 'status-offline' },
}

const cameraSensorLabels: Record<CameraSensorCode, string> = {
  front: '前侧相机',
  rear: '后侧相机',
  left: '左侧相机',
  right: '右侧相机',
  rearLeft: '左后相机',
  rearRight: '右后相机',
  fork: '货叉相机',
}

function taskStatusLabel(status: VehicleTaskStatus) {
  return taskStatusLabels[status] ?? taskStatusLabels.unknown
}

function ErrorChip({
  label,
  value,
  offline,
}: {
  label: string
  value: number
  offline: boolean
}) {
  const isBad = !offline && value > 0

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 text-xs flex items-center gap-2',
        offline && 'bg-[#F1F5F9] border-[#E2E8F0] text-[#94A3B8]',
        !offline && !isBad && 'bg-[#16A34A]/10 border-[#16A34A]/20 text-[#16A34A]',
        !offline && isBad && 'bg-[#DC2626]/10 border-[#DC2626]/20 text-[#DC2626]'
      )}
    >
      <span className="w-2 h-2 rounded-full bg-current" />
      <span>{label}</span>
      <span className="ml-auto font-mono">{offline ? '-' : value}</span>
    </div>
  )
}

function MotorChip({
  index,
  fault,
  offline,
}: {
  index: number
  fault: boolean
  offline: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 text-xs flex items-center gap-2',
        offline && 'bg-[#F1F5F9] border-[#E2E8F0] text-[#94A3B8]',
        !offline && !fault && 'bg-[#16A34A]/10 border-[#16A34A]/20 text-[#16A34A]',
        !offline && fault && 'bg-[#DC2626]/10 border-[#DC2626]/20 text-[#DC2626]'
      )}
    >
      <span className="w-2 h-2 rounded-full bg-current" />
      <span>M{index}</span>
      <span className="ml-auto">{offline ? '-' : fault ? '故障' : '正常'}</span>
    </div>
  )
}

export function AgvDetailPanel({
  vehicle,
  onClose,
  onUpdateVehicle,
  onLocateMap,
  showLastHeartbeat = false,
}: {
  vehicle: Vehicle
  onClose: () => void
  onUpdateVehicle: (updates: Partial<Vehicle>) => void
  onLocateMap?: () => void
  showLastHeartbeat?: boolean
}) {
  const vehicleStatus = vehicleStatusLabels[vehicle.status]
  const taskStatus = taskStatusLabel(vehicle.detail.taskInfo.status)
  const isOffline = vehicle.status === 'offline'
  const batteryWidth = `${Math.max(0, Math.min(100, vehicle.battery))}%`

  return (
    <aside className="h-full w-[380px] overflow-hidden bg-white border-l border-[#E2E8F0] flex flex-col shadow-lg">
      <div className="p-4 border-b border-[#E2E8F0] flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[#0F172A] font-semibold">{vehicle.id}</h3>
            <span className={vehicleStatus.className}>{vehicleStatus.label}</span>
          </div>
          <p className="text-[#64748B] text-sm mt-1">{vehicle.name}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A]">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
        <section className="agv-panel p-4 space-y-3">
          <div className="flex items-center gap-2 text-[#0F172A] font-medium">
            <MapPin className="w-4 h-4 text-[#0891B2]" />
            基础信息
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">定位状态</span>
              <span className="text-[#0F172A]">
                {vehicle.detail.positionInitialized ? '已初始化' : '未初始化'}
                {vehicle.detail.localizationScore !== null && (
                  <span className="ml-2 text-[#475569]">置信度 {vehicle.detail.localizationScore.toFixed(2)}</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">位置</span>
              <span className="text-[#0F172A] font-mono text-xs">
                x={vehicle.detail.pose.positionX.toFixed(3)}, y={vehicle.detail.pose.positionY.toFixed(3)}, z={vehicle.detail.pose.positionZ.toFixed(3)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">任务状态</span>
              <span className={taskStatus.className}>{taskStatus.label}</span>
            </div>
            {showLastHeartbeat && (
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">最后心跳</span>
                <span className="text-[#0F172A]">{vehicle.lastHeartbeat.toLocaleTimeString('zh-CN')}</span>
              </div>
            )}
            {isOffline && vehicle.detail.lastOnlineTime && (
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">最近在线时间</span>
                <span className="text-[#0F172A]">{vehicle.detail.lastOnlineTime.toLocaleString('zh-CN')}</span>
              </div>
            )}
          </div>
        </section>

        <section className="agv-panel p-4 space-y-3">
          <div className="flex items-center gap-2 text-[#0F172A] font-medium">
            <Gauge className="w-4 h-4 text-[#0891B2]" />
            速度数据
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3">
              <p className="text-[#64748B]">前进速度</p>
              <p className="text-[#0F172A] font-mono mt-1">{vehicle.detail.velocity.vx.toFixed(3)} m/s</p>
            </div>
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3">
              <p className="text-[#64748B]">横移速度</p>
              <p className="text-[#0F172A] font-mono mt-1">{vehicle.detail.velocity.vy.toFixed(3)} m/s</p>
            </div>
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3">
              <p className="text-[#64748B]">旋转速度</p>
              <p className="text-[#0F172A] font-mono mt-1">{vehicle.detail.velocity.omega.toFixed(3)} rad/s</p>
            </div>
          </div>
        </section>

        <section className="agv-panel p-4 space-y-3">
          <div className="flex items-center gap-2 text-[#0F172A] font-medium">
            <Battery className="w-4 h-4 text-[#16A34A]" />
            电池数据
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#64748B]">电量</span>
              <span className="text-[#0F172A] font-mono">{vehicle.battery}%</span>
            </div>
            <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  vehicle.battery > 50 ? 'bg-[#16A34A]' : vehicle.battery > 20 ? 'bg-[#D97706]' : 'bg-[#DC2626]'
                )}
                style={{ width: batteryWidth }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#64748B]">电压</span>
              <span className="text-[#0F172A] font-mono">
                {vehicle.detail.batteryVoltage === null ? '-' : `${vehicle.detail.batteryVoltage.toFixed(2)} V`}
              </span>
            </div>
          </div>
        </section>

        <section className="agv-panel p-4 space-y-3">
          <div className="flex items-center gap-2 text-[#0F172A] font-medium">
            <Camera className="w-4 h-4 text-[#0891B2]" />
            相机状态
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(vehicle.detail.cameraStatus).map(([code, ok]) => (
              <div
                key={code}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs flex items-center gap-2',
                  isOffline && 'bg-[#F1F5F9] border-[#E2E8F0] text-[#94A3B8]',
                  !isOffline && ok && 'bg-[#16A34A]/10 border-[#16A34A]/20 text-[#16A34A]',
                  !isOffline && !ok && 'bg-[#DC2626]/10 border-[#DC2626]/20 text-[#DC2626]'
                )}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{cameraSensorLabels[code as CameraSensorCode]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="agv-panel p-4 space-y-3">
          <div className="flex items-center gap-2 text-[#0F172A] font-medium">
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            状态详情
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ErrorChip label="移动" value={vehicle.detail.errorCodes.agvmove} offline={isOffline} />
            <ErrorChip label="插货" value={vehicle.detail.errorCodes.agvinsert} offline={isOffline} />
            <ErrorChip label="放货" value={vehicle.detail.errorCodes.agvput} offline={isOffline} />
            <ErrorChip label="动作" value={vehicle.detail.errorCodes.agvaction} offline={isOffline} />
          </div>
        </section>

        <section className="agv-panel p-4 space-y-3">
          <div className="flex items-center gap-2 text-[#0F172A] font-medium">
            <Cpu className="w-4 h-4 text-[#DC2626]" />
            电机状态
          </div>
          <div className="grid grid-cols-2 gap-2">
            {vehicle.detail.motorStatus.map((fault, index) => (
              <MotorChip key={index} index={index + 1} fault={fault} offline={isOffline} />
            ))}
          </div>
        </section>

        {vehicle.errors.length > 0 && (
          <section className="agv-panel p-4 space-y-2 border-[#DC2626]/20 bg-[#DC2626]/5">
            <div className="flex items-center gap-2 text-[#DC2626] font-medium">
              <AlertTriangle className="w-4 h-4" />
              当前错误
            </div>
            {vehicle.errors.map((error, index) => (
              <p key={index} className="text-sm text-[#DC2626]">
                {error}
              </p>
            ))}
          </section>
        )}
      </div>

      <div className="p-4 border-t border-[#E2E8F0] space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-[#16A34A]/10 hover:border-[#16A34A] hover:text-[#16A34A]"
            onClick={() =>
              onUpdateVehicle({
                status: 'busy',
                detail: {
                  ...vehicle.detail,
                  taskInfo: {
                    ...vehicle.detail.taskInfo,
                    status: 'active',
                  },
                },
              })
            }
          >
            <Play className="w-4 h-4 mr-1" />
            继续
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-[#D97706]/10 hover:border-[#D97706] hover:text-[#D97706]"
            onClick={() =>
              onUpdateVehicle({
                status: 'idle',
                detail: {
                  ...vehicle.detail,
                  taskInfo: {
                    ...vehicle.detail.taskInfo,
                    status: vehicle.detail.taskInfo.orderId ? 'waiting' : 'unknown',
                  },
                },
              })
            }
          >
            <Pause className="w-4 h-4 mr-1" />
            暂停
          </Button>
        </div>
        <Button
          variant="outline"
          className="w-full bg-white border-[#DC2626]/20 text-[#DC2626] hover:bg-[#DC2626]/10"
          onClick={() => onUpdateVehicle({ emergencyStop: !vehicle.emergencyStop })}
        >
          <StopCircle className="w-4 h-4 mr-2" />
          {vehicle.emergencyStop ? '解除急停' : '紧急停机'}
        </Button>
        {onLocateMap && (
          <Button
            variant="outline"
            className="w-full bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-[#2563EB]/10 hover:border-[#2563EB]"
            onClick={onLocateMap}
          >
            <Navigation className="w-4 h-4 mr-2" />
            在地图中定位
          </Button>
        )}
      </div>
    </aside>
  )
}
