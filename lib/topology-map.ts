import type { Dock, Vehicle, VehicleStatus } from './agv-types'

export type TopologyZoneType = 'dock' | 'charging' | 'parking' | 'cargoSource' | 'cargoTarget'

export interface TopologyPoint {
  x: number
  y: number
}

export interface TopologyPose extends TopologyPoint {
  angle: number
}

export interface TopologyRoute {
  id: string
  label: string
  points: TopologyPoint[]
  tier: 'primary' | 'secondary'
}

export interface TopologyZone {
  id: string
  type: TopologyZoneType
  label: string
  shortLabel: string
  description: string
  x: number
  y: number
  width: number
  height: number
  accent: string
  surface: string
  capacity: number
}

export interface TopologyZoneMetrics {
  total: number
  busy: number
  free: number
  queue: number
  hint: string
}

export const topologyMapMeta = {
  width: 560,
  height: 560,
  imageUrl: '/maps/default-site-map-topology-base.png',
  title: '默认站点地图',
  subtitle: '基于 pgm + yaml 底图裁切、旋转后的拓扑叠加视图',
} as const

export const topologyZones: TopologyZone[] = [
  {
    id: 'dock-west',
    type: 'dock',
    label: '月台范围',
    shortLabel: 'Dock',
    description: '月台接驳与插货靠泊区域，AGV 在此完成装卸对接。',
    x: 302,
    y: 142,
    width: 60,
    height: 104,
    accent: '#DC2626',
    surface: '#FEE2E2',
    capacity: 4,
  },
  {
    id: 'charge-hub',
    type: 'charging',
    label: '充电范围',
    shortLabel: 'Charge',
    description: '低电量车辆集中补能区域，支持排队回充与充电停靠。',
    x: 400,
    y: 53,
    width: 144,
    height: 78,
    accent: '#D97706',
    surface: '#FEF3C7',
    capacity: 6,
  },
  {
    id: 'parking-bay',
    type: 'parking',
    label: '停车范围',
    shortLabel: 'Parking',
    description: '空闲与离线车辆的停放区，靠近左上角便于快速待命。',
    x: 41,
    y: 26,
    width: 155,
    height: 95,
    accent: '#0891B2',
    surface: '#CFFAFE',
    capacity: 10,
  },
  {
    id: 'cargo-target',
    type: 'cargoTarget',
    label: '货箱区域',
    shortLabel: 'Cargo Box',
    description: '目标货箱摆放区，AGV 将货物插送至该区域完成落点。',
    x: 95,
    y: 135,
    width: 60,
    height: 129,
    accent: '#7C3AED',
    surface: '#EDE9FE',
    capacity: 5,
  },
  {
    id: 'cargo-source',
    type: 'cargoSource',
    label: '货物区域',
    shortLabel: 'Cargo Source',
    description: '待搬运货物的起始区域，AGV 从这里取货并运往货箱区。',
    x: 59,
    y: 370,
    width: 146,
    height: 88,
    accent: '#16A34A',
    surface: '#DCFCE7',
    capacity: 8,
  },
]

export const topologyRoutes: TopologyRoute[] = [
  {
    id: 'vertical-spine',
    label: '主纵向通道',
    tier: 'primary',
    points: [
      { x: 220, y: 74 },
      { x: 220, y: 110 },
      { x: 220, y: 160 },
      { x: 220, y: 220 },
      { x: 220, y: 268 },
      { x: 215, y: 306 },
    ],
  },
  {
    id: 'top-east-corridor',
    label: '顶部东向通道',
    tier: 'primary',
    points: [
      { x: 220, y: 91 },
      { x: 272, y: 91 },
      { x: 332, y: 92 },
      { x: 399, y: 91 },
    ],
  },
  {
    id: 'dock-branch',
    label: '月台分支线',
    tier: 'secondary',
    points: [
      { x: 220, y: 199 },
      { x: 252, y: 199 },
      { x: 301, y: 199 },
    ],
  },
  {
    id: 'cargo-loop',
    label: '货箱作业线',
    tier: 'secondary',
    points: [
      { x: 123, y: 306 },
      { x: 123, y: 268 },
      { x: 162, y: 268 },
      { x: 220, y: 268 },
    ],
  },
  {
    id: 'cargo-feed',
    label: '货物接入线',
    tier: 'secondary',
    points: [
      { x: 167, y: 370 },
      { x: 167, y: 336 },
      { x: 167, y: 306 },
      { x: 123, y: 306 },
    ],
  },
  {
    id: 'charge-spur',
    label: '充电引导线',
    tier: 'secondary',
    points: [
      { x: 399, y: 91 },
      { x: 438, y: 91 },
      { x: 470, y: 91 },
    ],
  },
  {
    id: 'parking-cap',
    label: '停车接入线',
    tier: 'secondary',
    points: [
      { x: 195, y: 74 },
      { x: 220, y: 74 },
    ],
  },
]

const topologyWaypoints: TopologyPoint[] = [
  { x: 220, y: 74 },
  { x: 220, y: 91 },
  { x: 220, y: 160 },
  { x: 220, y: 199 },
  { x: 220, y: 268 },
  { x: 123, y: 268 },
  { x: 123, y: 306 },
  { x: 167, y: 306 },
  { x: 167, y: 370 },
  { x: 301, y: 199 },
  { x: 399, y: 91 },
  { x: 470, y: 91 },
]

const trafficSlots: TopologyPose[] = [
  { x: 220, y: 108, angle: 90 },
  { x: 220, y: 156, angle: 90 },
  { x: 220, y: 212, angle: 90 },
  { x: 220, y: 250, angle: 90 },
  { x: 154, y: 268, angle: 0 },
  { x: 132, y: 306, angle: 180 },
  { x: 183, y: 306, angle: 0 },
  { x: 167, y: 348, angle: 90 },
  { x: 255, y: 199, angle: 0 },
  { x: 292, y: 199, angle: 0 },
  { x: 272, y: 91, angle: 0 },
  { x: 338, y: 91, angle: 0 },
  { x: 382, y: 91, angle: 0 },
  { x: 112, y: 306, angle: 180 },
]

const chargingSlots: TopologyPose[] = [
  { x: 430, y: 82, angle: 180 },
  { x: 466, y: 82, angle: 180 },
  { x: 502, y: 82, angle: 180 },
  { x: 430, y: 112, angle: 180 },
  { x: 466, y: 112, angle: 180 },
  { x: 502, y: 112, angle: 180 },
]

const parkingSlots: TopologyPose[] = [
  { x: 82, y: 56, angle: 0 },
  { x: 118, y: 56, angle: 0 },
  { x: 154, y: 56, angle: 0 },
  { x: 82, y: 88, angle: 0 },
  { x: 118, y: 88, angle: 0 },
  { x: 154, y: 88, angle: 0 },
  { x: 82, y: 112, angle: 0 },
  { x: 118, y: 112, angle: 0 },
  { x: 154, y: 112, angle: 0 },
  { x: 176, y: 88, angle: 0 },
]

const cargoTargetSlots: TopologyPose[] = [
  { x: 124, y: 166, angle: 90 },
  { x: 124, y: 204, angle: 90 },
  { x: 124, y: 242, angle: 90 },
  { x: 145, y: 184, angle: 90 },
  { x: 145, y: 224, angle: 90 },
]

const cargoSourceSlots: TopologyPose[] = [
  { x: 90, y: 394, angle: 0 },
  { x: 122, y: 394, angle: 0 },
  { x: 154, y: 394, angle: 0 },
  { x: 90, y: 426, angle: 0 },
  { x: 122, y: 426, angle: 0 },
  { x: 154, y: 426, angle: 0 },
  { x: 186, y: 426, angle: 0 },
  { x: 186, y: 394, angle: 0 },
]

function statusColorGroup(status: VehicleStatus) {
  if (status === 'charging') return 'charging'
  if (status === 'offline' || status === 'idle') return 'parking'
  if (status === 'busy') return 'cargoTarget'
  if (status === 'warning' || status === 'error') return 'cargoSource'
  return 'traffic'
}

function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

function slotForVehicle(vehicleId: string, status: VehicleStatus, index: number) {
  const group = statusColorGroup(status)
  const source =
    group === 'charging'
      ? chargingSlots
      : group === 'parking'
        ? parkingSlots
        : group === 'cargoTarget'
          ? cargoTargetSlots
          : group === 'cargoSource'
            ? cargoSourceSlots
            : trafficSlots
  return source[(hashString(vehicleId) + index) % source.length]
}

export function getMockVehiclePosition(index: number, status: VehicleStatus) {
  const slot = slotForVehicle(`AGV-${index + 1}`, status, index)
  const group = statusColorGroup(status)
  const offsetSeed = (index % 5) - 2
  const crossOffset = group === 'charging' ? 2 : group === 'parking' ? 3 : 4

  return {
    x: slot.x + (slot.angle === 90 ? offsetSeed * crossOffset : offsetSeed * 3),
    y: slot.y + (slot.angle === 90 ? offsetSeed * 3 : offsetSeed * crossOffset),
    angle: slot.angle,
  }
}

export function getVehicleTopologyPose(vehicle: Vehicle, index: number): TopologyPose {
  return slotForVehicle(vehicle.id, vehicle.status, index)
}

function vehicleTargetZone(status: VehicleStatus, index: number) {
  if (status === 'charging') return index % 2 === 0 ? 'charge-hub' : 'charge-hub'
  if (status === 'offline' || status === 'idle') return 'parking-bay'
  if (status === 'busy') return 'cargo-target'
  if (status === 'warning' || status === 'error') return 'cargo-source'
  return 'dock-west'
}

export function buildVehicleTopologyPath(vehicle: Vehicle, index: number): TopologyPoint[] {
  const pose = getVehicleTopologyPose(vehicle, index)
  const targetId = vehicleTargetZone(vehicle.status, index)
  const target = topologyZones.find((zone) => zone.id === targetId)

  if (!target) {
    return []
  }

  const targetPoint =
    target.type === 'charging'
      ? { x: target.x + target.width / 2, y: target.y + target.height / 2 }
      : target.type === 'parking'
        ? { x: target.x + target.width / 2, y: target.y + target.height / 2 }
        : target.type === 'cargoTarget'
          ? { x: target.x + target.width / 2, y: target.y + target.height / 2 }
          : target.type === 'cargoSource'
          ? { x: target.x + target.width / 2, y: target.y + target.height / 2 }
        : target.id === 'dock-west'
          ? { x: target.x + target.width - 8, y: target.y + target.height / 2 }
          : { x: target.x + target.width / 2, y: target.y + 10 }

  const near = (a: number, b: number, gap = 14) => Math.abs(a - b) <= gap

  if (target.type === 'charging') {
    return [
      pose,
      ...(near(pose.y, 91)
        ? []
        : near(pose.x, 220)
          ? [{ x: 220, y: 91 }]
          : [{ x: 220, y: 268 }, { x: 220, y: 91 }]),
      { x: 399, y: 91 },
      targetPoint,
    ]
  }

  if (target.type === 'parking') {
    return [
      pose,
      ...(near(pose.y, 91) ? [{ x: 220, y: 91 }] : []),
      { x: 195, y: 74 },
      targetPoint,
    ]
  }

  if (target.type === 'cargoTarget') {
    return [
      pose,
      { x: 123, y: 268 },
      { x: 123, y: 220 },
      targetPoint,
    ]
  }

  if (target.type === 'cargoSource') {
    return [
      pose,
      { x: 167, y: 370 },
      { x: 167, y: 306 },
      targetPoint,
    ]
  }

  if (target.id === 'dock-west') {
    const dockApproach: TopologyPoint[] = []

    if (near(pose.y, 91)) {
      dockApproach.push({ x: 220, y: 91 }, { x: 220, y: 199 })
    } else if (near(pose.y, 268)) {
      dockApproach.push({ x: 220, y: 268 }, { x: 220, y: 199 })
    } else if (near(pose.y, 306)) {
      if (!near(pose.x, 123)) {
        dockApproach.push({ x: 123, y: 306 })
      }
      dockApproach.push({ x: 123, y: 268 }, { x: 220, y: 268 }, { x: 220, y: 199 })
    } else if (pose.y > 320) {
      dockApproach.push({ x: 167, y: 306 }, { x: 123, y: 306 }, { x: 123, y: 268 }, { x: 220, y: 268 }, { x: 220, y: 199 })
    } else if (!near(pose.x, 220)) {
      dockApproach.push({ x: 220, y: 199 })
    }

    return [
      pose,
      ...dockApproach,
      { x: 301, y: 199 },
      targetPoint,
    ]
  }

  return [
    pose,
    { x: 220, y: 199 },
    { x: 301, y: 199 },
    targetPoint,
  ]
}

export function getTopologyWaypoints() {
  return topologyWaypoints
}

export function getZoneMetrics(zoneId: string, docks: Dock[], vehicles: Vehicle[]): TopologyZoneMetrics {
  if (zoneId === 'charge-hub') {
    const chargingVehicles = vehicles.filter((vehicle) => vehicle.status === 'charging').length
    return {
      total: chargingSlots.length,
      busy: chargingVehicles,
      free: Math.max(chargingSlots.length - chargingVehicles, 0),
      queue: vehicles.filter((vehicle) => vehicle.battery < 30 && vehicle.status !== 'charging').length,
      hint: '低电量车辆优先回充',
    }
  }

  if (zoneId === 'parking-bay') {
    const parked = vehicles.filter((vehicle) => vehicle.status === 'idle' || vehicle.status === 'offline').length
    return {
      total: parkingSlots.length,
      busy: parked,
      free: Math.max(parkingSlots.length - parked, 0),
      queue: vehicles.filter((vehicle) => vehicle.status === 'online').length,
      hint: '空闲与离线车辆分层停放',
    }
  }

  if (zoneId === 'cargo-target') {
    const delivering = vehicles.filter((vehicle) => vehicle.status === 'busy').length
    return {
      total: cargoTargetSlots.length,
      busy: Math.min(delivering, cargoTargetSlots.length),
      free: Math.max(cargoTargetSlots.length - delivering, 0),
      queue: vehicles.filter((vehicle) => vehicle.status === 'online').length,
      hint: '货物最终插送落点区域',
    }
  }

  if (zoneId === 'cargo-source') {
    const waiting = vehicles.filter((vehicle) => vehicle.status === 'warning' || vehicle.status === 'error').length
    return {
      total: cargoSourceSlots.length,
      busy: Math.min(waiting + 2, cargoSourceSlots.length),
      free: Math.max(cargoSourceSlots.length - waiting - 2, 0),
      queue: vehicles.filter((vehicle) => vehicle.status === 'busy').length,
      hint: '待插货搬运的货物起始区域',
    }
  }

  const splitIndex = Math.ceil(docks.length / 2)
  const dockSlice = zoneId === 'dock-west' ? docks.slice(0, splitIndex) : docks.slice(splitIndex)
  const occupied = dockSlice.filter((dock) => dock.status === 'occupied').length
  const queue = dockSlice.reduce((sum, dock) => sum + dock.queueCount, 0)

  return {
    total: dockSlice.length,
    busy: occupied,
    free: Math.max(dockSlice.length - occupied, 0),
    queue,
    hint: zoneId === 'dock-west' ? '适合入库与接货排队' : '适合出库与回库切换',
  }
}
