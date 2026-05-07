'use client'

import { useEffect, useMemo, useRef, useState, type Dispatch, type PointerEvent as ReactPointerEvent, type SetStateAction, type WheelEvent as ReactWheelEvent } from 'react'
import { useAGVStore } from '@/lib/agv-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AgvDetailPanel } from '@/components/agv-detail-panel'
import {
  buildVehicleTopologyPath,
  getTopologyWaypoints,
  getVehicleTopologyPose,
  topologyMapMeta,
  topologyRoutes,
  topologyZones,
  type TopologyPoint,
  type TopologyZone,
  type TopologyZoneMetrics,
} from '@/lib/topology-map'
import type { Vehicle, VehicleStatus } from '@/lib/agv-types'
import {
  Filter,
  Layers,
  RotateCcw,
  Truck,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

type LayerState = {
  base: boolean
  routes: boolean
  zones: boolean
  vehicles: boolean
  paths: boolean
}

type FilterState = {
  operational: boolean
  charging: boolean
  alerts: boolean
  offline: boolean
}

type MapViewport = {
  zoom: number
  offsetX: number
  offsetY: number
}

const ROUTE_COLORS = {
  primary: '#2E83A9',
  secondary: '#6D8E9F',
  waypointOuter: '#DCE5EB',
  waypointInner: '#3C8DAF',
  selectedPath: '#2F6FE4',
} as const

const MAP_BASE_OVERSCAN = 1.28
const MIN_MAP_ZOOM = 0.78
const MAX_MAP_ZOOM = 3.2

function formatPolyline(points: TopologyPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

function withOpacity(color: string, opacity: number) {
  if (!color.startsWith('#') || color.length !== 7) return color

  const red = Number.parseInt(color.slice(1, 3), 16)
  const green = Number.parseInt(color.slice(3, 5), 16)
  const blue = Number.parseInt(color.slice(5, 7), 16)

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function clampViewport(viewport: MapViewport, width: number, height: number) {
  const baseSide = Math.max(width, height) * MAP_BASE_OVERSCAN
  const maxOffsetX = Math.max(0, (baseSide * viewport.zoom - width) / 2)
  const maxOffsetY = Math.max(0, (baseSide * viewport.zoom - height) / 2)

  return {
    zoom: viewport.zoom,
    offsetX: clamp(viewport.offsetX, -maxOffsetX, maxOffsetX),
    offsetY: clamp(viewport.offsetY, -maxOffsetY, maxOffsetY),
  }
}

function vehicleTone(vehicle: Vehicle) {
  if (vehicle.status === 'offline') return '#708295'
  if (vehicle.status === 'warning' || vehicle.status === 'error') return '#D9645B'
  if (vehicle.status === 'charging') return '#4FAE86'
  if (vehicle.status === 'busy') return '#3B78D1'
  return '#468EAB'
}

function zoneByVehicleStatus(status: VehicleStatus) {
  if (status === 'charging') return 'charge-hub'
  if (status === 'idle' || status === 'offline') return 'parking-bay'
  if (status === 'busy') return 'cargo-target'
  if (status === 'warning' || status === 'error') return 'cargo-source'
  return 'dock-west'
}

type DisplayVehicle = {
  vehicle: Vehicle
  pose: ReturnType<typeof getVehicleTopologyPose>
  path: TopologyPoint[]
}

function poseInZone(pose: { x: number; y: number }, zone: TopologyZone) {
  return (
    pose.x >= zone.x &&
    pose.x <= zone.x + zone.width &&
    pose.y >= zone.y &&
    pose.y <= zone.y + zone.height
  )
}

function buildZoneMetrics(zone: TopologyZone, displayVehicles: DisplayVehicle[]): TopologyZoneMetrics {
  const actualCount = displayVehicles.filter((item) => poseInZone(item.pose, zone)).length

  return {
    total: zone.capacity,
    busy: actualCount,
    free: Math.max(zone.capacity - actualCount, 0),
    queue: Math.max(actualCount - zone.capacity, 0),
    hint: '',
  }
}

function MapStage({
  viewport,
  setViewport,
  layers,
  displayVehicles,
  selectedVehicle,
  selectedZone,
  zoneMetrics,
  onSelectVehicle,
  onSelectZone,
}: {
  viewport: MapViewport
  setViewport: Dispatch<SetStateAction<MapViewport>>
  layers: LayerState
  displayVehicles: DisplayVehicle[]
  selectedVehicle: Vehicle | null
  selectedZone: TopologyZone
  zoneMetrics: Record<string, TopologyZoneMetrics>
  onSelectVehicle: (id: string) => void
  onSelectZone: (id: string) => void
}) {
  const selectedDisplayVehicle = displayVehicles.find((item) => item.vehicle.id === selectedVehicle?.id) ?? null
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<{ pointerId: number; x: number; y: number; moved: boolean; captured: boolean } | null>(null)
  const ignoreClickUntilRef = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return

    const syncSize = () => {
      setViewportSize({
        width: element.clientWidth,
        height: element.clientHeight,
      })
    }

    syncSize()

    const observer = new ResizeObserver(syncSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!viewportSize.width || !viewportSize.height) return

    const clamped = clampViewport(viewport, viewportSize.width, viewportSize.height)
    if (
      clamped.zoom === viewport.zoom &&
      clamped.offsetX === viewport.offsetX &&
      clamped.offsetY === viewport.offsetY
    ) {
      return
    }

    setViewport(clamped)
  }, [setViewport, viewport, viewportSize.height, viewportSize.width])

  const selectVehicle = (id: string) => {
    if (performance.now() < ignoreClickUntilRef.current) return
    onSelectVehicle(id)
  }

  const selectZone = (id: string) => {
    if (performance.now() < ignoreClickUntilRef.current) return
    onSelectZone(id)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return

    dragStateRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      captured: false,
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) return

    const deltaX = event.clientX - dragState.x
    const deltaY = event.clientY - dragState.y

    if (!dragState.moved && Math.hypot(deltaX, deltaY) > 4) {
      dragState.moved = true
      if (!dragState.captured && event.currentTarget.hasPointerCapture && !event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId)
        dragState.captured = true
      }
      setIsDragging(true)
    }

    if (!dragState.moved) return

    dragState.x = event.clientX
    dragState.y = event.clientY

    setViewport((current) =>
      clampViewport(
        {
          ...current,
          offsetX: current.offsetX + deltaX,
          offsetY: current.offsetY + deltaY,
        },
        viewportSize.width,
        viewportSize.height
      )
    )
  }

  const endDrag = (pointerId: number, currentTarget: HTMLDivElement) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== pointerId) return

    if (dragState.captured && currentTarget.hasPointerCapture(pointerId)) {
      currentTarget.releasePointerCapture(pointerId)
    }

    if (dragState.moved) {
      ignoreClickUntilRef.current = performance.now() + 180
    }

    dragStateRef.current = null
    setIsDragging(false)
  }

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault()

    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect || !viewportSize.width || !viewportSize.height) return

    const zoomDelta = event.deltaY < 0 ? 0.12 : -0.12
    const nextZoom = clamp(Number((viewport.zoom + zoomDelta).toFixed(2)), MIN_MAP_ZOOM, MAX_MAP_ZOOM)
    if (nextZoom === viewport.zoom) return

    const centeredX = event.clientX - rect.left - rect.width / 2
    const centeredY = event.clientY - rect.top - rect.height / 2
    const worldX = (centeredX - viewport.offsetX) / viewport.zoom
    const worldY = (centeredY - viewport.offsetY) / viewport.zoom

    setViewport(
      clampViewport(
        {
          zoom: nextZoom,
          offsetX: centeredX - worldX * nextZoom,
          offsetY: centeredY - worldY * nextZoom,
        },
        viewportSize.width,
        viewportSize.height
      )
    )
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={viewportRef}
        className="relative h-full w-full overflow-hidden bg-[#cdcdcd] select-none"
        style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
        draggable={false}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => endDrag(event.pointerId, event.currentTarget)}
        onPointerCancel={(event) => endDrag(event.pointerId, event.currentTarget)}
        onWheel={handleWheel}
        onDragStart={(event) => event.preventDefault()}
      >
        <div
          className={isDragging ? 'absolute inset-0 cursor-grabbing select-none' : 'absolute inset-0 cursor-grab select-none'}
          style={{
            width: Math.max(viewportSize.width, viewportSize.height) * MAP_BASE_OVERSCAN || '100%',
            height: Math.max(viewportSize.width, viewportSize.height) * MAP_BASE_OVERSCAN || '100%',
            left: viewportSize.width
              ? `${(viewportSize.width - Math.max(viewportSize.width, viewportSize.height) * MAP_BASE_OVERSCAN) / 2}px`
              : '0',
            top: viewportSize.height
              ? `${(viewportSize.height - Math.max(viewportSize.width, viewportSize.height) * MAP_BASE_OVERSCAN) / 2}px`
              : '0',
            transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.zoom})`,
            transformOrigin: 'center center',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
        >
          {layers.base && (
            <img
              src={topologyMapMeta.imageUrl}
              alt={topologyMapMeta.title}
              className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
              draggable={false}
            />
          )}

          <svg
            viewBox={`0 0 ${topologyMapMeta.width} ${topologyMapMeta.height}`}
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
          >
          {layers.zones &&
            topologyZones.map((zone) => {
              const metrics = zoneMetrics[zone.id]
              const isActive = selectedZone.id === zone.id
              const isVerticalZone = zone.height > zone.width
              const labelX = isVerticalZone ? zone.x + zone.width / 2 : zone.x + 14
              const labelY = isVerticalZone ? zone.y + 18 : zone.y + zone.height - 14
              const labelAnchor = isVerticalZone ? 'middle' : 'start'
              const countX = isVerticalZone ? zone.x + zone.width / 2 : zone.x + zone.width - 14
              const countY = isVerticalZone ? zone.y + zone.height - 12 : zone.y + zone.height - 14
              const countAnchor = isVerticalZone ? 'middle' : 'end'

              return (
                <g
                  key={zone.id}
                  className="cursor-pointer"
                  onClick={() => selectZone(zone.id)}
                  role="button"
                  aria-label={zone.label}
                >
                  <rect
                    x={zone.x}
                    y={zone.y}
                    width={zone.width}
                    height={zone.height}
                    rx={20}
                    fill={withOpacity(zone.surface, isActive ? 0.34 : 0.2)}
                    stroke={withOpacity(zone.accent, isActive ? 0.96 : 0.72)}
                    strokeWidth={isActive ? 2.4 : 1.5}
                    strokeDasharray={zone.type === 'dock' ? '8 8' : zone.type === 'parking' ? '10 8' : undefined}
                  />
                  <text
                    x={labelX}
                    y={labelY}
                    fill={withOpacity(zone.accent, 0.96)}
                    fontSize="10.5"
                    fontWeight="700"
                    letterSpacing="0.4"
                    textAnchor={labelAnchor}
                  >
                    {zone.label}
                  </text>
                  <text
                    x={countX}
                    y={countY}
                    fill={withOpacity(zone.accent, 0.88)}
                    fontSize="10.5"
                    fontWeight="700"
                    textAnchor={countAnchor}
                  >
                    {metrics.busy} 台
                  </text>
                </g>
              )
          })}

          {layers.routes &&
            topologyRoutes.map((route) => (
              <polyline
                key={route.id}
                points={formatPolyline(route.points)}
                fill="none"
                stroke={route.tier === 'primary' ? ROUTE_COLORS.primary : ROUTE_COLORS.secondary}
                strokeOpacity={route.tier === 'primary' ? 0.9 : 0.72}
                strokeWidth={route.tier === 'primary' ? 4.8 : 2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

          {layers.routes &&
            getTopologyWaypoints().map((point, index) => (
              <g key={`${point.x}-${point.y}-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={5.6}
                  fill={withOpacity(ROUTE_COLORS.waypointOuter, 0.94)}
                  stroke={withOpacity('#0F1E2A', 0.16)}
                  strokeWidth={1}
                />
                <circle cx={point.x} cy={point.y} r={2.4} fill={ROUTE_COLORS.waypointInner} />
              </g>
            ))}

          {layers.paths && selectedDisplayVehicle && (
            <polyline
              points={formatPolyline(selectedDisplayVehicle.path)}
              fill="none"
              stroke={ROUTE_COLORS.selectedPath}
              strokeWidth={3.8}
              strokeDasharray="8 8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {layers.vehicles &&
            displayVehicles.map(({ vehicle, pose }) => {
              const isSelected = vehicle.id === selectedVehicle?.id
              const tone = vehicleTone(vehicle)

              return (
                <g
                  key={vehicle.id}
                  className="cursor-pointer"
                  transform={`translate(${pose.x} ${pose.y}) rotate(${pose.angle})`}
                  onClick={() => selectVehicle(vehicle.id)}
                >
                  {isSelected && <circle r={13.5} fill={withOpacity(tone, 0.16)} stroke={withOpacity(tone, 0.76)} strokeWidth={1.6} />}
                  {(vehicle.status === 'error' || vehicle.emergencyStop) && (
                    <circle r={10.5} fill="none" stroke="#D9645B" strokeWidth={1.6} />
                  )}
                  <rect x={-4.7} y={-2.8} width={9.4} height={10.2} rx={2.4} fill="#DFE5EA" stroke="#101820" strokeWidth={1} />
                  <rect x={-4.1} y={-1.9} width={8.2} height={4.6} rx={1.9} fill={withOpacity(tone, 0.9)} />
                  <rect x={-1.9} y={-6.9} width={3.8} height={4.1} rx={0.9} fill="#202B34" />
                  <rect x={-1.25} y={-9.7} width={0.9} height={2.8} rx={0.45} fill="#202B34" />
                  <rect x={0.35} y={-9.7} width={0.9} height={2.8} rx={0.45} fill="#202B34" />
                  <path d="M-4.8 4.8 H4.8" stroke="#101820" strokeWidth={0.9} strokeLinecap="round" />
                  <circle cx={-2.6} cy={5.6} r={0.95} fill="#101820" />
                  <circle cx={2.6} cy={5.6} r={0.95} fill="#101820" />
                  <text
                    x={0}
                    y={17}
                    fill="#101820"
                    fontSize="8.6"
                    textAnchor="middle"
                    transform={`rotate(${-pose.angle})`}
                  >
                    {vehicle.id.replace('AGV-', '')}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

      </div>

      <div className="pointer-events-none absolute bottom-6 left-6 z-10 max-w-[calc(100%-3rem)] rounded-xl border border-[#E2E8F0] bg-white/95 px-4 py-3 text-xs text-[#475569] shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="flex items-center gap-2 whitespace-nowrap">
            <span className="h-2 w-8 rounded-full" style={{ backgroundColor: ROUTE_COLORS.primary }} />
            主路线
          </span>
          <span className="flex items-center gap-2 whitespace-nowrap">
            <span className="h-2 w-8 rounded-full" style={{ backgroundColor: ROUTE_COLORS.secondary }} />
            辅路线
          </span>
          <span className="flex items-center gap-2 whitespace-nowrap">
            <Truck className="h-3.5 w-3.5 text-[#0F172A]" />
            车辆
          </span>
          <span className="flex items-center gap-2 whitespace-nowrap">
            <span className="h-2 w-8 rounded-full border-2 border-dashed" style={{ borderColor: ROUTE_COLORS.selectedPath }} />
            选中任务
          </span>
        </div>
      </div>
    </div>
  )
}

export function MapDispatchPage() {
  const { vehicles, selectedVehicle, selectVehicle, updateVehicle } = useAGVStore()

  const [viewport, setViewport] = useState<MapViewport>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  })
  const [selectedZoneId, setSelectedZoneId] = useState(topologyZones[0]?.id ?? '')
  const [layers, setLayers] = useState<LayerState>({
    base: true,
    routes: true,
    zones: true,
    vehicles: true,
    paths: true,
  })
  const [filters, setFilters] = useState<FilterState>({
    operational: true,
    charging: true,
    alerts: true,
    offline: true,
  })

  const visibleVehicles = useMemo(() => {
    const matchesFilter = (vehicle: Vehicle) => {
      const isOperational = vehicle.status === 'online' || vehicle.status === 'idle' || vehicle.status === 'busy'
      const isAlert = vehicle.status === 'warning' || vehicle.status === 'error'

      return (
        (filters.operational && isOperational) ||
        (filters.charging && vehicle.status === 'charging') ||
        (filters.alerts && isAlert) ||
        (filters.offline && vehicle.status === 'offline')
      )
    }

    return vehicles.filter(matchesFilter).slice(0, 24)
  }, [filters, vehicles])

  const displayVehicles = useMemo(
    () =>
      visibleVehicles.map((vehicle, index) => ({
        vehicle,
        pose: getVehicleTopologyPose(vehicle, index),
        path: buildVehicleTopologyPath(vehicle, index),
      })),
    [visibleVehicles]
  )

  const zoneMetrics = useMemo(
    () => Object.fromEntries(topologyZones.map((zone) => [zone.id, buildZoneMetrics(zone, displayVehicles)])),
    [displayVehicles]
  )

  const selectedZone = topologyZones.find((zone) => zone.id === selectedZoneId) ?? topologyZones[0]
  const updateZoom = (nextZoom: number) => {
    setViewport((current) => {
      const clampedZoom = clamp(Number(nextZoom.toFixed(2)), MIN_MAP_ZOOM, MAX_MAP_ZOOM)
      if (clampedZoom === current.zoom) return current

      const ratio = clampedZoom / current.zoom
      return {
        zoom: clampedZoom,
        offsetX: current.offsetX * ratio,
        offsetY: current.offsetY * ratio,
      }
    })
  }

  const selectedVehicleFocus = () => {
    if (!selectedVehicle) return
    updateZoom(1.12)
    setSelectedZoneId(zoneByVehicleStatus(selectedVehicle.status))
  }

  return (
    <div className="relative flex h-full overflow-hidden bg-[#F8FAFC]">
      <div className="relative flex-1 overflow-hidden bg-[#E2E8F0]">
        <div className="absolute inset-0">
          <div
            className="h-full w-full"
            style={{
              backgroundColor: '#E2E8F0',
            }}
          />
        </div>

        <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => updateZoom(viewport.zoom + 0.08)}
              className="text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="px-2 text-[#0F172A] text-sm kpi-number">{Math.round(viewport.zoom * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => updateZoom(viewport.zoom - 0.08)}
              className="text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setViewport({
                zoom: 1,
                offsetX: 0,
                offsetY: 0,
              })
            }
            className="bg-white border border-[#E2E8F0] shadow-sm text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="bg-white border border-[#E2E8F0] shadow-sm text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              >
                <Layers className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-[#E2E8F0] bg-white text-[#0F172A] shadow-lg">
              <DropdownMenuLabel>图层切换</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#E2E8F0]" />
              <DropdownMenuCheckboxItem checked={layers.base} onCheckedChange={(checked) => setLayers((current) => ({ ...current, base: !!checked }))}>
                底图图层
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={layers.routes} onCheckedChange={(checked) => setLayers((current) => ({ ...current, routes: !!checked }))}>
                路线图层
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={layers.zones} onCheckedChange={(checked) => setLayers((current) => ({ ...current, zones: !!checked }))}>
                区域图层
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={layers.vehicles} onCheckedChange={(checked) => setLayers((current) => ({ ...current, vehicles: !!checked }))}>
                车辆图层
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={layers.paths} onCheckedChange={(checked) => setLayers((current) => ({ ...current, paths: !!checked }))}>
                任务路径
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="bg-white border border-[#E2E8F0] shadow-sm text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-[#E2E8F0] bg-white text-[#0F172A] shadow-lg">
              <DropdownMenuLabel>车辆筛选</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#E2E8F0]" />
              <DropdownMenuCheckboxItem checked={filters.operational} onCheckedChange={(checked) => setFilters((current) => ({ ...current, operational: !!checked }))}>
                在线/空闲/执行中
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filters.charging} onCheckedChange={(checked) => setFilters((current) => ({ ...current, charging: !!checked }))}>
                充电中
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filters.alerts} onCheckedChange={(checked) => setFilters((current) => ({ ...current, alerts: !!checked }))}>
                告警/故障
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filters.offline} onCheckedChange={(checked) => setFilters((current) => ({ ...current, offline: !!checked }))}>
                离线
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <MapStage
          viewport={viewport}
          setViewport={setViewport}
          layers={layers}
          displayVehicles={displayVehicles}
          selectedVehicle={selectedVehicle}
          selectedZone={selectedZone}
          zoneMetrics={zoneMetrics}
          onSelectVehicle={selectVehicle}
          onSelectZone={setSelectedZoneId}
        />
      </div>

      {selectedVehicle && (
        <div className="absolute inset-y-0 right-0 z-40 h-full max-w-full overflow-hidden">
          <div className="h-full overflow-hidden shadow-[-24px_0_56px_rgba(0,0,0,0.38)]">
            <AgvDetailPanel
              vehicle={selectedVehicle}
              onClose={() => selectVehicle(null)}
              onUpdateVehicle={(updates) => updateVehicle(selectedVehicle.id, updates)}
              onLocateMap={selectedVehicleFocus}
              showLastHeartbeat
            />
          </div>
        </div>
      )}
    </div>
  )
}
