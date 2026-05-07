import type {
  Alert,
  DiagnosticMessage,
  Dock,
  SystemStats,
  Task,
  Vehicle,
  VehicleTaskInfo,
  VehicleTaskNode,
  VehicleTaskStatus,
} from './agv-types'
import { getMockVehiclePosition } from './topology-map'

const vehicleMaps = ['默认站点地图', '主仓库A区', '主仓库B区', '生产车间', '出货月台']
const taskTypes = ['搬运', '取货', '放货', '充电', '回库']
const taskLocations = ['A1-01', 'A1-02', 'A2-01', 'B1-01', 'B2-03', 'C1-05', '月台1', '月台2', '充电站']
const agvActionTypes = ['agvmove', 'agvinsert', 'agvput', 'agvaction']
const diagnosticTopics = [
  'agv/status/report',
  'agv/command/move',
  'agv/command/stop',
  'agv/heartbeat',
  'agv/task/assign',
  'agv/task/complete',
]

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function createTaskNodes(vehicleIndex: number, baseStatus: Vehicle['status']): VehicleTaskNode[] {
  if (!['busy', 'warning', 'error'].includes(baseStatus)) {
    return []
  }

  const count = Math.random() > 0.55 ? Math.floor(Math.random() * 3) + 2 : 1

  return Array.from({ length: count }, (_, index) => {
    let status: VehicleTaskStatus = 'waiting'

    if (baseStatus === 'busy') {
      status = index === 0 ? pickOne(['active', 'running']) : pickOne(['waiting', 'finished'])
    } else if (baseStatus === 'warning') {
      status = index === 0 ? pickOne(['active', 'running']) : pickOne(['waiting', 'failed'])
    } else if (baseStatus === 'error') {
      status = index === 0 ? 'failed' : pickOne(['waiting', 'canceled'])
    }

    return {
      nodeId: `NODE-${vehicleIndex + 1}-${String(index + 1).padStart(2, '0')}`,
      taskType: agvActionTypes[index % agvActionTypes.length],
      status,
    }
  })
}

function deriveTaskStatus(nodes: VehicleTaskNode[]): VehicleTaskStatus {
  if (nodes.length === 0) return 'unknown'
  const statuses = nodes.map((node) => node.status)

  if (statuses.every((status) => status === 'waiting')) return 'waiting'
  if (statuses.every((status) => status === 'finished')) return 'finished'
  if (statuses.every((status) => status === 'canceled')) return 'canceled'
  if (statuses.some((status) => status === 'failed')) return 'failed'
  if (statuses.some((status) => status === 'active' || status === 'running')) return 'active'
  return 'waiting'
}

function createVehicleTaskInfo(vehicleIndex: number, baseStatus: Vehicle['status']): VehicleTaskInfo {
  const nodes = createTaskNodes(vehicleIndex, baseStatus)
  if (nodes.length === 0) {
    return {
      orderId: null,
      taskMode: 'none',
      taskType: '',
      status: 'unknown',
      nodes,
    }
  }

  return {
    orderId: `ORDER-${String(vehicleIndex + 1).padStart(4, '0')}`,
    taskMode: nodes.length > 1 ? 'queue' : 'single',
    taskType: nodes[0].taskType,
    status: deriveTaskStatus(nodes),
    nodes,
  }
}

function createCameraStatus() {
  return {
    front: Math.random() > 0.1,
    rear: Math.random() > 0.12,
    left: Math.random() > 0.08,
    right: Math.random() > 0.08,
    rearLeft: Math.random() > 0.14,
    rearRight: Math.random() > 0.14,
    fork: Math.random() > 0.1,
  }
}

function createErrorCodes(baseStatus: Vehicle['status']) {
  if (baseStatus !== 'warning' && baseStatus !== 'error') {
    return {
      agvmove: 0,
      agvinsert: 0,
      agvput: 0,
      agvaction: 0,
    }
  }

  const createValue = () => (Math.random() > 0.55 ? Math.floor(Math.random() * 5) + 1 : 0)

  return {
    agvmove: baseStatus === 'error' ? Math.max(1, createValue()) : createValue(),
    agvinsert: createValue(),
    agvput: createValue(),
    agvaction: createValue(),
  }
}

function createMotorStatus(baseStatus: Vehicle['status']) {
  return Array.from({ length: 7 }, (_, index) => {
    if (baseStatus === 'error') return Math.random() > 0.65
    if (baseStatus === 'warning') return index % 3 === 0 ? Math.random() > 0.75 : false
    return false
  })
}

export function generateVehicles(count: number = 50): Vehicle[] {
  const statuses: Vehicle['status'][] = ['online', 'offline', 'warning', 'error', 'charging', 'idle', 'busy']

  return Array.from({ length: count }, (_, index) => {
    const status = pickOne(statuses)
    const position = getMockVehiclePosition(index, status)
    const taskInfo = createVehicleTaskInfo(index, status)
    const speed = status === 'busy' ? Number((Math.random() * 2.2 + 0.2).toFixed(2)) : 0
    const velocity = {
      vx: status === 'busy' ? Number((Math.random() * 1.4 + 0.1).toFixed(3)) : 0,
      vy: status === 'busy' ? Number((Math.random() * 0.35).toFixed(3)) : 0,
      omega: status === 'busy' ? Number((Math.random() * 0.25).toFixed(3)) : 0,
    }
    const battery = Math.floor(Math.random() * 100)
    const mapName = pickOne(vehicleMaps)
    const cameraStatus = createCameraStatus()
    const errorCodes = createErrorCodes(status)
    const motorStatus = createMotorStatus(status)

    return {
      id: `AGV-${String(index + 1).padStart(3, '0')}`,
      name: `叉车${index + 1}号`,
      status,
      battery,
      position,
      currentTask: taskInfo.orderId,
      lastHeartbeat: new Date(Date.now() - Math.random() * 60000),
      map: mapName,
      emergencyStop: Math.random() < 0.02,
      speed,
      errors:
        status === 'warning' || status === 'error'
          ? ['传感器异常', '通信超时'].filter(() => Math.random() > 0.45)
          : [],
      detail: {
        mapId: `MAP-${(index % 3) + 1}`,
        localizationScore: status === 'offline' ? null : Number((Math.random() * 0.2 + 0.8).toFixed(2)),
        positionInitialized: status !== 'offline' && Math.random() > 0.08,
        pose: {
          positionX: Number((position.x / 10).toFixed(3)),
          positionY: Number((position.y / 10).toFixed(3)),
          positionZ: 0,
        },
        messageId: `MSG-${String(index + 1).padStart(6, '0')}`,
        lastOnlineTime: status === 'offline' ? new Date(Date.now() - Math.random() * 7200000) : null,
        velocity,
        batteryVoltage: Number((48 + Math.random() * 7).toFixed(2)),
        cameraStatus,
        taskInfo,
        errorCodes,
        motorStatus,
      },
    }
  })
}

export function generateTasks(count: number = 100): Task[] {
  const statuses: Task['status'][] = ['created', 'queued', 'active', 'finished', 'failed', 'timeout', 'cancelled']

  return Array.from({ length: count }, (_, index) => {
    const status = pickOne(statuses)
    const createdAt = new Date(Date.now() - Math.random() * 86400000)

    return {
      id: `TASK-${String(index + 1).padStart(4, '0')}`,
      type: pickOne(taskTypes),
      status,
      priority: Math.floor(Math.random() * 5) + 1,
      vehicleId: status === 'active' ? `AGV-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}` : null,
      source: pickOne(taskLocations),
      destination: pickOne(taskLocations),
      createdAt,
      startedAt: ['active', 'finished', 'failed'].includes(status) ? new Date(createdAt.getTime() + 60000) : null,
      completedAt: status === 'finished' ? new Date(createdAt.getTime() + 300000) : null,
      progress: status === 'active' ? Math.floor(Math.random() * 100) : status === 'finished' ? 100 : 0,
      description: `从${pickOne(taskLocations)}搬运至${pickOne(taskLocations)}`,
    }
  })
}

export function generateAlerts(count: number = 30): Alert[] {
  const levels: Alert['level'][] = ['info', 'warning', 'error', 'critical']
  const titles = [
    '车辆离线',
    '电量过低',
    '通信超时',
    '传感器异常',
    '急停触发',
    '任务超时',
    '路径阻塞',
    '月台占用超时',
  ]
  const messages = [
    '车辆超过 30 秒未响应心跳',
    '当前电量低于 20%，请安排充电',
    'MQTT 连接超时，正在尝试重连',
    '传感器返回数据异常，请检查现场设备',
    '检测到急停按钮被触发',
    '任务执行时间超过预期阈值',
    '目标路径被其他车辆占用',
    '月台已被占用过久，请人工确认',
  ]

  return Array.from({ length: count }, (_, index) => {
    const titleIndex = Math.floor(Math.random() * titles.length)

    return {
      id: `ALERT-${String(index + 1).padStart(4, '0')}`,
      level: pickOne(levels),
      title: titles[titleIndex],
      message: messages[titleIndex],
      vehicleId: Math.random() > 0.3 ? `AGV-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}` : null,
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      acknowledged: Math.random() > 0.5,
      resolvedAt: Math.random() > 0.7 ? new Date() : null,
    }
  })
}

export function generateDocks(count: number = 24): Dock[] {
  const statuses: Dock['status'][] = ['available', 'occupied', 'disabled', 'maintenance']
  const zones = ['A区', 'B区', 'C区']

  return Array.from({ length: count }, (_, index) => {
    const zone = zones[Math.floor(index / 8)]
    const status = pickOne(statuses)

    return {
      id: `DOCK-${String(index + 1).padStart(2, '0')}`,
      name: `${zone}月台${(index % 8) + 1}`,
      zone,
      status,
      currentVehicle: status === 'occupied' ? `AGV-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}` : null,
      currentTask: status === 'occupied' ? `TASK-${Math.floor(Math.random() * 1000)}` : null,
      queueCount: Math.floor(Math.random() * 5),
      lastUpdated: new Date(),
    }
  })
}

export function generateSystemStats(): SystemStats {
  return {
    totalVehicles: 300,
    onlineVehicles: 256,
    offlineVehicles: 12,
    warningVehicles: 8,
    activeTasks: 89,
    queuedTasks: 156,
    completedToday: 1247,
    failedToday: 23,
    alertCount: 15,
    criticalAlerts: 3,
    dockOccupied: 18,
    dockTotal: 24,
  }
}

export function generateDiagnosticMessages(vehicleId: string, count: number = 50): DiagnosticMessage[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `MSG-${String(index + 1).padStart(6, '0')}`,
    timestamp: new Date(Date.now() - (count - index) * 1000),
    direction: Math.random() > 0.5 ? 'inbound' : 'outbound',
    topic: pickOne(diagnosticTopics),
    payload: JSON.stringify({
      vehicleId,
      timestamp: Date.now(),
      data: {
        position: { x: Math.random() * 100, y: Math.random() * 100 },
        battery: Math.floor(Math.random() * 100),
        status: 'ok',
      },
    }),
    vehicleId,
  }))
}

export function generateTaskTrend(): { time: string; created: number; completed: number; failed: number }[] {
  return Array.from({ length: 24 }, (_, index) => {
    const hour = String(index).padStart(2, '0')
    return {
      time: `${hour}:00`,
      created: Math.floor(Math.random() * 50) + 20,
      completed: Math.floor(Math.random() * 45) + 15,
      failed: Math.floor(Math.random() * 5),
    }
  })
}

export function generateVehicleDistribution(): { name: string; value: number; color: string }[] {
  return [
    { name: '在线执行', value: 156, color: '#2563EB' },
    { name: '在线空闲', value: 68, color: '#0891B2' },
    { name: '充电中', value: 32, color: '#16A34A' },
    { name: '告警', value: 8, color: '#D97706' },
    { name: '离线', value: 12, color: '#94A3B8' },
    { name: '故障', value: 4, color: '#DC2626' },
  ]
}
