export type VehicleStatus = 'online' | 'offline' | 'warning' | 'error' | 'charging' | 'idle' | 'busy'
export type TaskStatus = 'created' | 'queued' | 'active' | 'finished' | 'failed' | 'timeout' | 'cancelled'
export type AlertLevel = 'info' | 'warning' | 'error' | 'critical'
export type DockStatus = 'available' | 'occupied' | 'disabled' | 'maintenance'
export type VehicleTaskStatus = 'waiting' | 'active' | 'running' | 'finished' | 'failed' | 'canceled' | 'unknown'
export type CameraSensorCode = 'front' | 'rear' | 'left' | 'right' | 'rearLeft' | 'rearRight' | 'fork'

export interface VehicleTaskNode {
  nodeId: string
  taskType: string
  status: VehicleTaskStatus
}

export interface VehicleTaskInfo {
  orderId: string | null
  taskMode: 'single' | 'queue' | 'none'
  taskType: string
  status: VehicleTaskStatus
  nodes: VehicleTaskNode[]
}

export interface VehicleDetailState {
  mapId: string
  localizationScore: number | null
  positionInitialized: boolean
  pose: {
    positionX: number
    positionY: number
    positionZ: number
  }
  messageId: string
  lastOnlineTime: Date | null
  velocity: {
    vx: number
    vy: number
    omega: number
  }
  batteryVoltage: number | null
  cameraStatus: Record<CameraSensorCode, boolean>
  taskInfo: VehicleTaskInfo
  errorCodes: {
    agvmove: number
    agvinsert: number
    agvput: number
    agvaction: number
  }
  motorStatus: boolean[]
}

export interface Vehicle {
  id: string
  name: string
  status: VehicleStatus
  battery: number
  position: { x: number; y: number; angle: number }
  currentTask: string | null
  lastHeartbeat: Date
  map: string
  emergencyStop: boolean
  speed: number
  errors: string[]
  detail: VehicleDetailState
}

export interface Task {
  id: string
  type: string
  status: TaskStatus
  priority: number
  vehicleId: string | null
  source: string
  destination: string
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
  progress: number
  description: string
}

export interface Alert {
  id: string
  level: AlertLevel
  title: string
  message: string
  vehicleId: string | null
  timestamp: Date
  acknowledged: boolean
  resolvedAt: Date | null
}

export interface Dock {
  id: string
  name: string
  zone: string
  status: DockStatus
  currentVehicle: string | null
  currentTask: string | null
  queueCount: number
  lastUpdated: Date
}

export interface SystemStats {
  totalVehicles: number
  onlineVehicles: number
  offlineVehicles: number
  warningVehicles: number
  activeTasks: number
  queuedTasks: number
  completedToday: number
  failedToday: number
  alertCount: number
  criticalAlerts: number
  dockOccupied: number
  dockTotal: number
}

export interface MapPoint {
  x: number
  y: number
  type: 'vehicle' | 'dock' | 'charger' | 'obstacle' | 'waypoint'
  id: string
  status?: string
}

export interface DiagnosticMessage {
  id: string
  timestamp: Date
  direction: 'inbound' | 'outbound'
  topic: string
  payload: string
  vehicleId: string
}

export interface MapFile {
  id: string
  name: string
  pgmFileName: string
  yamlFileName: string
  pgmData: string | null
  yamlData: string | null
  previewImageUrl?: string | null
  resolution: number
  origin: [number, number, number]
  width: number
  height: number
  createdAt: Date
  updatedAt: Date
}

export interface SiteProfile {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  mapConfig: {
    selectedMapId: string | null
    defaultZoom: number
    showGrid: boolean
    showVehicleLabels: boolean
    autoRefresh: boolean
    refreshInterval: number
  }
  dockConfig: {
    occupyTimeout: number
    queueWarningThreshold: number
    autoRelease: boolean
  }
  alertConfig: {
    heartbeatTimeout: number
    batteryLowThreshold: number
    taskTimeout: number
    enableSound: boolean
    enableDesktopNotification: boolean
  }
  systemConfig: {
    mqttBroker: string
    mqttPort: number
    apiEndpoint: string
    logLevel: string
  }
}
