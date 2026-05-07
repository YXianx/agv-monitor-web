'use client'

import { create } from 'zustand'
import { defaultAppPage, type AppPage } from './app-pages'
import type { Vehicle, Task, Alert, Dock, SystemStats, MapFile, SiteProfile } from './agv-types'
import { defaultMapFile, DEFAULT_MAP_ID } from './default-map'
import { DEFAULT_SITE_PROFILE_ID } from './site-profile-constants'
import { 
  generateVehicles, 
  generateTasks, 
  generateAlerts, 
  generateDocks,
  generateSystemStats 
} from './mock-data'

interface AGVStore {
  // 认证状态
  isAuthenticated: boolean
  currentUser: { name: string; role: string } | null
  login: (username: string, password: string) => boolean
  logout: () => void
  
  // 车辆状态
  vehicles: Vehicle[]
  selectedVehicle: Vehicle | null
  selectVehicle: (id: string | null) => void
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void
  
  // 任务状态
  tasks: Task[]
  selectedTask: Task | null
  selectTask: (id: string | null) => void
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'startedAt' | 'completedAt' | 'progress'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  cancelTask: (id: string) => void
  retryTask: (id: string) => void
  
  // 告警状态
  alerts: Alert[]
  acknowledgeAlert: (id: string) => void
  resolveAlert: (id: string) => void
  clearResolvedAlerts: () => void
  
  // 月台状态
  docks: Dock[]
  selectedDock: Dock | null
  selectDock: (id: string | null) => void
  updateDock: (id: string, updates: Partial<Dock>) => void
  releaseDock: (id: string) => void
  
  // 系统统计
  stats: SystemStats
  refreshStats: () => void
  
  // 页面状态
  currentPage: AppPage
  setCurrentPage: (page: AppPage) => void
  
  // 右侧面板状态
  rightPanelOpen: boolean
  rightPanelContent: 'vehicle' | 'task' | 'dock' | 'alert' | null
  openRightPanel: (content: 'vehicle' | 'task' | 'dock' | 'alert') => void
  closeRightPanel: () => void
  
  // 地图管理
  mapFiles: MapFile[]
  addMapFile: (mapFile: MapFile) => void
  updateMapFile: (id: string, updates: Partial<MapFile>) => void
  deleteMapFile: (id: string) => void
  mapManagementGuideOpen: boolean
  setMapManagementGuideOpen: (open: boolean) => void
  
  // 站点配置
  siteProfiles: SiteProfile[]
  activeProfile: SiteProfile | null
  addSiteProfile: (profile: SiteProfile) => void
  updateSiteProfile: (id: string, updates: Partial<SiteProfile>) => void
  deleteSiteProfile: (id: string) => void
  activateSiteProfile: (id: string) => void
  
  // 初始化数据
  initializeData: () => void
}

export const useAGVStore = create<AGVStore>((set, get) => ({
  // 认证状态
  isAuthenticated: false,
  currentUser: null,
  login: (username: string, password: string) => {
    // 模拟登录验证
    if (username && password) {
      set({ 
        isAuthenticated: true, 
        currentUser: { name: username, role: '调度员' }
      })
      return true
    }
    return false
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
      mapManagementGuideOpen: true
    })
  },
  
  // 车辆状态
  vehicles: [],
  selectedVehicle: null,
  selectVehicle: (id) => {
    const vehicle = id ? get().vehicles.find(v => v.id === id) || null : null
    set({ 
      selectedVehicle: vehicle,
      rightPanelOpen: !!vehicle,
      rightPanelContent: vehicle ? 'vehicle' : null
    })
  },
  updateVehicle: (id, updates) => {
    set(state => ({
      vehicles: state.vehicles.map(v => v.id === id ? { ...v, ...updates } : v),
      selectedVehicle: state.selectedVehicle?.id === id ? { ...state.selectedVehicle, ...updates } : state.selectedVehicle
    }))
  },
  
  // 任务状态
  tasks: [],
  selectedTask: null,
  selectTask: (id) => {
    const task = id ? get().tasks.find(t => t.id === id) || null : null
    set({ 
      selectedTask: task,
      rightPanelOpen: !!task,
      rightPanelContent: task ? 'task' : null
    })
  },
  createTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: `TASK-${String(get().tasks.length + 1).padStart(4, '0')}`,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      progress: 0
    }
    set(state => ({ tasks: [newTask, ...state.tasks] }))
  },
  updateTask: (id, updates) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }))
  },
  cancelTask: (id) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'cancelled' as const } : t)
    }))
  },
  retryTask: (id) => {
    set(state => ({
      tasks: state.tasks.map(t => 
        t.id === id ? { ...t, status: 'queued' as const, progress: 0 } : t
      )
    }))
  },
  
  // 告警状态
  alerts: [],
  acknowledgeAlert: (id) => {
    set(state => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a)
    }))
  },
  resolveAlert: (id) => {
    set(state => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, resolvedAt: new Date() } : a)
    }))
  },
  clearResolvedAlerts: () => {
    set(state => ({
      alerts: state.alerts.filter(a => !a.resolvedAt)
    }))
  },
  
  // 月台状态
  docks: [],
  selectedDock: null,
  selectDock: (id) => {
    const dock = id ? get().docks.find(d => d.id === id) || null : null
    set({ 
      selectedDock: dock,
      rightPanelOpen: !!dock,
      rightPanelContent: dock ? 'dock' : null
    })
  },
  updateDock: (id, updates) => {
    set(state => ({
      docks: state.docks.map(d => d.id === id ? { ...d, ...updates } : d)
    }))
  },
  releaseDock: (id) => {
    set(state => ({
      docks: state.docks.map(d => 
        d.id === id ? { 
          ...d, 
          status: 'available' as const, 
          currentVehicle: null, 
          currentTask: null 
        } : d
      )
    }))
  },
  
  // 系统统计
  stats: generateSystemStats(),
  refreshStats: () => {
    set({ stats: generateSystemStats() })
  },
  
  // 页面状态
  currentPage: defaultAppPage,
  setCurrentPage: (page) => {
    set({ currentPage: page, rightPanelOpen: false, rightPanelContent: null })
  },
  
  // 右侧面板状态
  rightPanelOpen: false,
  rightPanelContent: null,
  openRightPanel: (content) => {
    set({ rightPanelOpen: true, rightPanelContent: content })
  },
  closeRightPanel: () => {
    set({ rightPanelOpen: false, rightPanelContent: null })
  },
  
  // 地图管理
  mapFiles: [],
  addMapFile: (mapFile) => {
    set(state => ({ mapFiles: [...state.mapFiles, mapFile] }))
  },
  updateMapFile: (id, updates) => {
    set(state => ({
      mapFiles: state.mapFiles.map(m => m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m)
    }))
  },
  deleteMapFile: (id) => {
    set(state => ({ mapFiles: state.mapFiles.filter(m => m.id !== id) }))
  },
  mapManagementGuideOpen: true,
  setMapManagementGuideOpen: (open) => {
    set({ mapManagementGuideOpen: open })
  },
  
  // 站点配置
  siteProfiles: [],
  activeProfile: null,
  addSiteProfile: (profile) => {
    set(state => ({ siteProfiles: [...state.siteProfiles, profile] }))
  },
  updateSiteProfile: (id, updates) => {
    set(state => ({
      siteProfiles: state.siteProfiles.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p),
      activeProfile: state.activeProfile?.id === id ? { ...state.activeProfile, ...updates, updatedAt: new Date() } : state.activeProfile
    }))
  },
  deleteSiteProfile: (id) => {
    if (id === DEFAULT_SITE_PROFILE_ID) {
      return
    }

    set(state => {
      const remainingProfiles = state.siteProfiles.filter(p => p.id !== id)
      const fallbackActiveProfile =
        remainingProfiles.find(profile => profile.id === DEFAULT_SITE_PROFILE_ID) ??
        remainingProfiles[0] ??
        null
      const nextActiveProfile =
        state.activeProfile?.id === id
          ? fallbackActiveProfile
          : remainingProfiles.find(profile => profile.id === state.activeProfile?.id) ?? fallbackActiveProfile

      return {
        siteProfiles: remainingProfiles.map(profile => ({
          ...profile,
          isActive: profile.id === nextActiveProfile?.id
        })),
        activeProfile: nextActiveProfile
      }
    })
  },
  activateSiteProfile: (id) => {
    const profile = get().siteProfiles.find(p => p.id === id)
    if (profile) {
      set(state => ({
        siteProfiles: state.siteProfiles.map(p => ({ ...p, isActive: p.id === id })),
        activeProfile: profile
      }))
    }
  },
  
  // 初始化数据
  initializeData: () => {
    const defaultProfile: SiteProfile = {
      id: DEFAULT_SITE_PROFILE_ID,
      name: '默认配置',
      description: '系统默认配置文件',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      mapConfig: {
        selectedMapId: DEFAULT_MAP_ID,
        defaultZoom: 1,
        showGrid: true,
        showVehicleLabels: true,
        autoRefresh: true,
        refreshInterval: 1000
      },
      dockConfig: {
        occupyTimeout: 300,
        queueWarningThreshold: 5,
        autoRelease: false
      },
      alertConfig: {
        heartbeatTimeout: 30,
        batteryLowThreshold: 20,
        taskTimeout: 600,
        enableSound: true,
        enableDesktopNotification: true
      },
      systemConfig: {
        mqttBroker: '192.168.1.100',
        mqttPort: 1883,
        apiEndpoint: 'http://192.168.1.100:8080',
        logLevel: 'info'
      }
    }
    
    const sampleProfiles: SiteProfile[] = [
      defaultProfile,
      {
        ...defaultProfile,
        id: 'profile-siteA',
        name: '地点A - 深圳仓库',
        description: '深圳仓库现场配置',
        isActive: false,
        systemConfig: {
          mqttBroker: '192.168.10.100',
          mqttPort: 1883,
          apiEndpoint: 'http://192.168.10.100:8080',
          logLevel: 'info'
        }
      },
      {
        ...defaultProfile,
        id: 'profile-siteB',
        name: '地点B - 广州工厂',
        description: '广州工厂现场配置',
        isActive: false,
        systemConfig: {
          mqttBroker: '192.168.20.100',
          mqttPort: 1883,
          apiEndpoint: 'http://192.168.20.100:8080',
          logLevel: 'warn'
        }
      }
    ]
    
    set({
      vehicles: generateVehicles(50),
      tasks: generateTasks(100),
      alerts: generateAlerts(30),
      docks: generateDocks(24),
      stats: generateSystemStats(),
      mapFiles: [defaultMapFile],
      siteProfiles: sampleProfiles,
      activeProfile: defaultProfile
    })
  }
}))
