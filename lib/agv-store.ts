'use client'

import { create } from 'zustand'
import { defaultAppPage, type AppPage } from './app-pages'
import type {
  Alert,
  Dock,
  MapFile,
  PingTestResult,
  SiteProfile,
  SystemStats,
  SystemUser,
  Task,
  UserRole,
  Vehicle,
} from './agv-types'
import { defaultMapFile, DEFAULT_MAP_ID } from './default-map'
import { DEFAULT_SITE_PROFILE_ID } from './site-profile-constants'
import {
  createMockPingResult,
  generateAlerts,
  generateDocks,
  generatePingResults,
  generateSystemStats,
  generateSystemUsers,
  generateTasks,
  generateVehicles,
} from './mock-data'

type CurrentUserSession = {
  id: string
  username: string
  name: string
  role: UserRole
}

type UserDraft = Omit<SystemUser, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'> & {
  lastLoginAt?: Date | null
}

interface AGVStore {
  isAuthenticated: boolean
  currentUser: CurrentUserSession | null
  login: (username: string, password: string) => boolean
  logout: () => void

  vehicles: Vehicle[]
  selectedVehicle: Vehicle | null
  selectVehicle: (id: string | null) => void
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void

  tasks: Task[]
  selectedTask: Task | null
  selectTask: (id: string | null) => void
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'startedAt' | 'completedAt' | 'progress'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  cancelTask: (id: string) => void
  retryTask: (id: string) => void

  alerts: Alert[]
  acknowledgeAlert: (id: string) => void
  resolveAlert: (id: string) => void
  clearResolvedAlerts: () => void

  docks: Dock[]
  selectedDock: Dock | null
  selectDock: (id: string | null) => void
  updateDock: (id: string, updates: Partial<Dock>) => void
  releaseDock: (id: string) => void

  stats: SystemStats
  refreshStats: () => void

  currentPage: AppPage
  setCurrentPage: (page: AppPage) => void

  rightPanelOpen: boolean
  rightPanelContent: 'vehicle' | 'task' | 'dock' | 'alert' | null
  openRightPanel: (content: 'vehicle' | 'task' | 'dock' | 'alert') => void
  closeRightPanel: () => void

  mapFiles: MapFile[]
  addMapFile: (mapFile: MapFile) => void
  updateMapFile: (id: string, updates: Partial<MapFile>) => void
  deleteMapFile: (id: string) => void
  mapManagementGuideOpen: boolean
  setMapManagementGuideOpen: (open: boolean) => void

  siteProfiles: SiteProfile[]
  activeProfile: SiteProfile | null
  addSiteProfile: (profile: SiteProfile) => void
  updateSiteProfile: (id: string, updates: Partial<SiteProfile>) => void
  deleteSiteProfile: (id: string) => void
  activateSiteProfile: (id: string) => void

  users: SystemUser[]
  createUser: (draft: UserDraft) => void
  updateUser: (id: string, updates: Partial<UserDraft>) => void
  deleteUser: (id: string) => void

  pingResults: PingTestResult[]
  pingTesting: boolean
  lastPingBatchAt: Date | null
  runPingTestForVehicle: (vehicleId: string) => void
  runPingTestForAllVehicles: () => void

  initializeData: () => void
}

function createDefaultSiteProfile(): SiteProfile {
  return {
    id: DEFAULT_SITE_PROFILE_ID,
    name: '默认配置',
    description: '系统默认站点配置文件',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    mapConfig: {
      selectedMapId: DEFAULT_MAP_ID,
      defaultZoom: 1,
      showGrid: true,
      showVehicleLabels: true,
      autoRefresh: true,
      refreshInterval: 1000,
    },
    dockConfig: {
      occupyTimeout: 300,
      queueWarningThreshold: 5,
      autoRelease: false,
    },
    alertConfig: {
      heartbeatTimeout: 30,
      batteryLowThreshold: 20,
      taskTimeout: 600,
      enableSound: true,
      enableDesktopNotification: true,
    },
    systemConfig: {
      mqttBroker: '192.168.1.100',
      mqttPort: 1883,
      apiEndpoint: 'http://192.168.1.100:8080',
      logLevel: 'info',
    },
  }
}

function buildSampleProfiles(defaultProfile: SiteProfile): SiteProfile[] {
  return [
    defaultProfile,
    {
      ...defaultProfile,
      id: 'profile-siteA',
      name: '站点A - 深圳仓库',
      description: '深圳仓库现场配置',
      isActive: false,
      systemConfig: {
        mqttBroker: '192.168.10.100',
        mqttPort: 1883,
        apiEndpoint: 'http://192.168.10.100:8080',
        logLevel: 'info',
      },
    },
    {
      ...defaultProfile,
      id: 'profile-siteB',
      name: '站点B - 广州工厂',
      description: '广州工厂现场配置',
      isActive: false,
      systemConfig: {
        mqttBroker: '192.168.20.100',
        mqttPort: 1883,
        apiEndpoint: 'http://192.168.20.100:8080',
        logLevel: 'warn',
      },
    },
  ]
}

function recalculateStats(state: Pick<AGVStore, 'vehicles' | 'tasks' | 'alerts' | 'docks'>): SystemStats {
  const totalVehicles = state.vehicles.length
  const onlineVehicles = state.vehicles.filter((vehicle) => vehicle.status !== 'offline').length
  const offlineVehicles = state.vehicles.filter((vehicle) => vehicle.status === 'offline').length
  const warningVehicles = state.vehicles.filter((vehicle) => ['warning', 'error'].includes(vehicle.status)).length
  const activeTasks = state.tasks.filter((task) => task.status === 'active').length
  const queuedTasks = state.tasks.filter((task) => task.status === 'queued').length
  const completedToday = state.tasks.filter((task) => task.status === 'finished').length
  const failedToday = state.tasks.filter((task) => ['failed', 'timeout', 'cancelled'].includes(task.status)).length
  const unresolvedAlerts = state.alerts.filter((alert) => !alert.resolvedAt)
  const criticalAlerts = unresolvedAlerts.filter((alert) => alert.level === 'critical').length
  const dockOccupied = state.docks.filter((dock) => dock.status === 'occupied').length

  return {
    totalVehicles,
    onlineVehicles,
    offlineVehicles,
    warningVehicles,
    activeTasks,
    queuedTasks,
    completedToday,
    failedToday,
    alertCount: unresolvedAlerts.length,
    criticalAlerts,
    dockOccupied,
    dockTotal: state.docks.length,
  }
}

export const useAGVStore = create<AGVStore>((set, get) => ({
  isAuthenticated: false,
  currentUser: null,
  login: (username: string, password: string) => {
    const normalizedUsername = username.trim()
    const normalizedPassword = password.trim()
    if (!normalizedUsername || !normalizedPassword) return false

    const matchedUser = get().users.find(
      (user) =>
        user.status === 'active' &&
        user.username.toLowerCase() === normalizedUsername.toLowerCase() &&
        user.password === normalizedPassword
    )

    const fallbackRole: UserRole =
      normalizedUsername.toLowerCase().includes('admin')
        ? 'admin'
        : normalizedUsername.toLowerCase().includes('op')
          ? 'operator'
          : 'user'

    const sessionUser: CurrentUserSession = matchedUser
      ? {
          id: matchedUser.id,
          username: matchedUser.username,
          name: matchedUser.name,
          role: matchedUser.role,
        }
      : {
          id: `SESSION-${Date.now()}`,
          username: normalizedUsername,
          name: normalizedUsername,
          role: fallbackRole,
        }

    set((state) => ({
      isAuthenticated: true,
      currentUser: sessionUser,
      users: matchedUser
        ? state.users.map((user) =>
            user.id === matchedUser.id ? { ...user, lastLoginAt: new Date(), updatedAt: new Date() } : user
          )
        : state.users,
    }))
    return true
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('agv.mapGuideDismissed')
    }

    set({
      isAuthenticated: false,
      currentUser: null,
      currentPage: defaultAppPage,
      rightPanelOpen: false,
      rightPanelContent: null,
      mapManagementGuideOpen: true,
    })
  },

  vehicles: [],
  selectedVehicle: null,
  selectVehicle: (id) => {
    const vehicle = id ? get().vehicles.find((item) => item.id === id) ?? null : null
    set({
      selectedVehicle: vehicle,
      rightPanelOpen: Boolean(vehicle),
      rightPanelContent: vehicle ? 'vehicle' : null,
    })
  },
  updateVehicle: (id, updates) => {
    set((state) => ({
      vehicles: state.vehicles.map((vehicle) => (vehicle.id === id ? { ...vehicle, ...updates } : vehicle)),
      selectedVehicle:
        state.selectedVehicle?.id === id ? { ...state.selectedVehicle, ...updates } : state.selectedVehicle,
    }))
  },

  tasks: [],
  selectedTask: null,
  selectTask: (id) => {
    const task = id ? get().tasks.find((item) => item.id === id) ?? null : null
    set({
      selectedTask: task,
      rightPanelOpen: Boolean(task),
      rightPanelContent: task ? 'task' : null,
    })
  },
  createTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: `TASK-${String(get().tasks.length + 1).padStart(4, '0')}`,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      progress: 0,
    }
    set((state) => ({ tasks: [newTask, ...state.tasks] }))
  },
  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
    }))
  },
  cancelTask: (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? { ...task, status: 'cancelled' } : task)),
    }))
  },
  retryTask: (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? { ...task, status: 'queued', progress: 0 } : task)),
    }))
  },

  alerts: [],
  acknowledgeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.map((alert) => (alert.id === id ? { ...alert, acknowledged: true } : alert)),
    }))
  },
  resolveAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.map((alert) => (alert.id === id ? { ...alert, resolvedAt: new Date() } : alert)),
    }))
  },
  clearResolvedAlerts: () => {
    set((state) => ({
      alerts: state.alerts.filter((alert) => !alert.resolvedAt),
    }))
  },

  docks: [],
  selectedDock: null,
  selectDock: (id) => {
    const dock = id ? get().docks.find((item) => item.id === id) ?? null : null
    set({
      selectedDock: dock,
      rightPanelOpen: Boolean(dock),
      rightPanelContent: dock ? 'dock' : null,
    })
  },
  updateDock: (id, updates) => {
    set((state) => ({
      docks: state.docks.map((dock) => (dock.id === id ? { ...dock, ...updates } : dock)),
    }))
  },
  releaseDock: (id) => {
    set((state) => ({
      docks: state.docks.map((dock) =>
        dock.id === id
          ? {
              ...dock,
              status: 'available',
              currentVehicle: null,
              currentTask: null,
            }
          : dock
      ),
    }))
  },

  stats: generateSystemStats(),
  refreshStats: () => {
    set((state) => ({
      stats: recalculateStats(state),
    }))
  },

  currentPage: defaultAppPage,
  setCurrentPage: (page) => {
    set({ currentPage: page, rightPanelOpen: false, rightPanelContent: null })
  },

  rightPanelOpen: false,
  rightPanelContent: null,
  openRightPanel: (content) => set({ rightPanelOpen: true, rightPanelContent: content }),
  closeRightPanel: () => set({ rightPanelOpen: false, rightPanelContent: null }),

  mapFiles: [],
  addMapFile: (mapFile) => {
    set((state) => ({ mapFiles: [...state.mapFiles, mapFile] }))
  },
  updateMapFile: (id, updates) => {
    set((state) => ({
      mapFiles: state.mapFiles.map((mapFile) =>
        mapFile.id === id ? { ...mapFile, ...updates, updatedAt: new Date() } : mapFile
      ),
    }))
  },
  deleteMapFile: (id) => {
    set((state) => ({ mapFiles: state.mapFiles.filter((mapFile) => mapFile.id !== id) }))
  },
  mapManagementGuideOpen: true,
  setMapManagementGuideOpen: (open) => set({ mapManagementGuideOpen: open }),

  siteProfiles: [],
  activeProfile: null,
  addSiteProfile: (profile) => {
    set((state) => ({ siteProfiles: [...state.siteProfiles, profile] }))
  },
  updateSiteProfile: (id, updates) => {
    set((state) => ({
      siteProfiles: state.siteProfiles.map((profile) =>
        profile.id === id ? { ...profile, ...updates, updatedAt: new Date() } : profile
      ),
      activeProfile:
        state.activeProfile?.id === id
          ? { ...state.activeProfile, ...updates, updatedAt: new Date() }
          : state.activeProfile,
    }))
  },
  deleteSiteProfile: (id) => {
    if (id === DEFAULT_SITE_PROFILE_ID) return

    set((state) => {
      const remainingProfiles = state.siteProfiles.filter((profile) => profile.id !== id)
      const fallbackActiveProfile =
        remainingProfiles.find((profile) => profile.id === DEFAULT_SITE_PROFILE_ID) ?? remainingProfiles[0] ?? null
      const nextActiveProfile =
        state.activeProfile?.id === id
          ? fallbackActiveProfile
          : remainingProfiles.find((profile) => profile.id === state.activeProfile?.id) ?? fallbackActiveProfile

      return {
        siteProfiles: remainingProfiles.map((profile) => ({
          ...profile,
          isActive: profile.id === nextActiveProfile?.id,
        })),
        activeProfile: nextActiveProfile,
      }
    })
  },
  activateSiteProfile: (id) => {
    const profile = get().siteProfiles.find((item) => item.id === id)
    if (!profile) return

    set((state) => ({
      siteProfiles: state.siteProfiles.map((item) => ({ ...item, isActive: item.id === id })),
      activeProfile: { ...profile, isActive: true },
    }))
  },

  users: generateSystemUsers(),
  createUser: (draft) => {
    const now = new Date()
    const nextUser: SystemUser = {
      ...draft,
      id: `USER-${String(get().users.length + 1).padStart(3, '0')}`,
      lastLoginAt: draft.lastLoginAt ?? null,
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({ users: [nextUser, ...state.users] }))
  },
  updateUser: (id, updates) => {
    set((state) => ({
      users: state.users.map((user) =>
        user.id === id
          ? {
              ...user,
              ...updates,
              updatedAt: new Date(),
            }
          : user
      ),
      currentUser:
        state.currentUser?.id === id
          ? {
              ...state.currentUser,
              name: updates.name ?? state.currentUser.name,
              username: updates.username ?? state.currentUser.username,
              role: updates.role ?? state.currentUser.role,
            }
          : state.currentUser,
    }))
  },
  deleteUser: (id) => {
    set((state) => ({
      users: state.users.filter((user) => user.id !== id),
      currentUser: state.currentUser?.id === id ? null : state.currentUser,
      isAuthenticated: state.currentUser?.id === id ? false : state.isAuthenticated,
      currentPage: state.currentUser?.id === id ? defaultAppPage : state.currentPage,
    }))
  },

  pingResults: [],
  pingTesting: false,
  lastPingBatchAt: null,
  runPingTestForVehicle: (vehicleId) => {
    const vehicle = get().vehicles.find((item) => item.id === vehicleId)
    if (!vehicle) return

    set((state) => ({
      pingResults: state.pingResults.map((result) =>
        result.vehicleId === vehicleId
          ? {
              ...result,
              status: 'testing',
              latencyMs: null,
              jitterMs: null,
              packetLoss: 0,
              note: '正在发送测试包...',
            }
          : result
      ),
    }))

    window.setTimeout(() => {
      set((state) => ({
        pingResults: state.pingResults.map((result) =>
          result.vehicleId === vehicleId ? createMockPingResult(vehicle) : result
        ),
        lastPingBatchAt: new Date(),
      }))
    }, 650)
  },
  runPingTestForAllVehicles: () => {
    const vehicles = get().vehicles
    set((state) => ({
      pingTesting: true,
      pingResults: state.pingResults.map((result) => ({
        ...result,
        status: 'testing',
        latencyMs: null,
        jitterMs: null,
        packetLoss: 0,
        note: '正在批量发送测试包...',
      })),
    }))

    window.setTimeout(() => {
      set({
        pingResults: vehicles.map((vehicle) => createMockPingResult(vehicle)),
        pingTesting: false,
        lastPingBatchAt: new Date(),
      })
    }, 1100)
  },

  initializeData: () => {
    const vehicles = generateVehicles(50)
    const tasks = generateTasks(100)
    const alerts = generateAlerts(30)
    const docks = generateDocks(24)
    const defaultProfile = createDefaultSiteProfile()
    const siteProfiles = buildSampleProfiles(defaultProfile)

    set({
      vehicles,
      tasks,
      alerts,
      docks,
      stats: recalculateStats({ vehicles, tasks, alerts, docks }),
      mapFiles: [defaultMapFile],
      siteProfiles,
      activeProfile: defaultProfile,
      pingResults: generatePingResults(vehicles),
      users: generateSystemUsers(),
    })
  },
}))
