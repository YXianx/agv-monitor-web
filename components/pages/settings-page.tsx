'use client'

import { useState } from 'react'
import { useAGVStore } from '@/lib/agv-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { SiteProfile } from '@/lib/agv-types'
import { DEFAULT_SITE_PROFILE_ID } from '@/lib/site-profile-constants'
import {
  Bell,
  Check,
  Copy,
  Edit3,
  FolderCog,
  MapPinned,
  Plus,
  Save,
  Server,
  Trash2,
  Warehouse,
} from 'lucide-react'

type EditTab = 'map' | 'dock' | 'alert' | 'system'
type ProfileDialogMode = 'create' | 'duplicate' | 'rename'

type ProfileDraft = {
  name: string
  description: string
  mapConfig: SiteProfile['mapConfig']
  dockConfig: SiteProfile['dockConfig']
  alertConfig: SiteProfile['alertConfig']
  systemConfig: SiteProfile['systemConfig']
}

const fallbackProfileTemplate = {
  mapConfig: {
    selectedMapId: null as string | null,
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

function createDraft(profile: SiteProfile): ProfileDraft {
  return {
    name: profile.name,
    description: profile.description,
    mapConfig: { ...profile.mapConfig },
    dockConfig: { ...profile.dockConfig },
    alertConfig: { ...profile.alertConfig },
    systemConfig: { ...profile.systemConfig },
  }
}

function createSeedProfile(base?: SiteProfile | null): SiteProfile {
  if (base) {
    return base
  }

  const now = new Date()
  return {
    id: DEFAULT_SITE_PROFILE_ID,
    name: '默认配置',
    description: '系统默认站点配置',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...fallbackProfileTemplate,
  }
}

export function SettingsPage() {
  const {
    siteProfiles,
    activeProfile,
    mapFiles,
    addSiteProfile,
    updateSiteProfile,
    deleteSiteProfile,
    activateSiteProfile,
    setCurrentPage,
  } = useAGVStore()

  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ProfileDraft | null>(null)
  const [editTab, setEditTab] = useState<EditTab>('map')
  const [savedMessage, setSavedMessage] = useState('')

  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [profileDialogMode, setProfileDialogMode] = useState<ProfileDialogMode>('create')
  const [profileDialogSourceId, setProfileDialogSourceId] = useState<string | null>(null)
  const [profileNameInput, setProfileNameInput] = useState('')
  const [profileDescriptionInput, setProfileDescriptionInput] = useState('')

  const editingProfile = siteProfiles.find((profile) => profile.id === editingProfileId) ?? null
  const profileDialogSource =
    siteProfiles.find((profile) => profile.id === profileDialogSourceId) ?? null

  const updateMapConfig = (updates: Partial<SiteProfile['mapConfig']>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            mapConfig: { ...current.mapConfig, ...updates },
          }
        : current
    )
  }

  const updateDockConfig = (updates: Partial<SiteProfile['dockConfig']>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            dockConfig: { ...current.dockConfig, ...updates },
          }
        : current
    )
  }

  const updateAlertConfig = (updates: Partial<SiteProfile['alertConfig']>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            alertConfig: { ...current.alertConfig, ...updates },
          }
        : current
    )
  }

  const updateSystemConfig = (updates: Partial<SiteProfile['systemConfig']>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            systemConfig: { ...current.systemConfig, ...updates },
          }
        : current
    )
  }

  const openProfileDialog = (mode: ProfileDialogMode, profile?: SiteProfile | null) => {
    setProfileDialogMode(mode)
    setProfileDialogSourceId(profile?.id ?? null)
    setProfileNameInput(mode === 'duplicate' ? `${profile?.name ?? '站点配置'} 副本` : profile?.name ?? '')
    setProfileDescriptionInput(profile?.description ?? '')
    setProfileDialogOpen(true)
  }

  const resetProfileDialog = () => {
    setProfileDialogOpen(false)
    setProfileDialogSourceId(null)
    setProfileNameInput('')
    setProfileDescriptionInput('')
  }

  const beginEditProfile = (profile: SiteProfile) => {
    setEditingProfileId(profile.id)
    setDraft(createDraft(profile))
    setEditTab('map')
  }

  const leaveEditMode = () => {
    setEditingProfileId(null)
    setDraft(null)
    setEditTab('map')
  }

  const handleSaveDraft = () => {
    if (!editingProfileId || !draft) return

    updateSiteProfile(editingProfileId, {
      mapConfig: draft.mapConfig,
      dockConfig: draft.dockConfig,
      alertConfig: draft.alertConfig,
      systemConfig: draft.systemConfig,
    })

    setSavedMessage('已保存配置')
    leaveEditMode()
    window.setTimeout(() => setSavedMessage(''), 2200)
  }

  const handleSubmitProfileDialog = () => {
    const trimmedName = profileNameInput.trim()
    const trimmedDescription = profileDescriptionInput.trim()
    if (!trimmedName) return

    if (profileDialogMode === 'rename' && profileDialogSource) {
      updateSiteProfile(profileDialogSource.id, {
        name: trimmedName,
        description: trimmedDescription,
      })
      resetProfileDialog()
      return
    }

    const baseProfile = createSeedProfile(profileDialogSource ?? activeProfile ?? siteProfiles[0] ?? null)
    const newProfile: SiteProfile = {
      id: `profile-${Date.now()}`,
      name: trimmedName,
      description: trimmedDescription,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      mapConfig: { ...baseProfile.mapConfig },
      dockConfig: { ...baseProfile.dockConfig },
      alertConfig: { ...baseProfile.alertConfig },
      systemConfig: { ...baseProfile.systemConfig },
    }

    addSiteProfile(newProfile)
    resetProfileDialog()
  }

  const handleDeleteProfile = (profile: SiteProfile) => {
    if (profile.id === DEFAULT_SITE_PROFILE_ID) return

    if (window.confirm(`确定删除站点配置“${profile.name}”吗？`)) {
      deleteSiteProfile(profile.id)
    }
  }

  if (editingProfile && draft) {
    return (
      <div className="h-full p-6 overflow-auto custom-scrollbar">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">编辑站点配置</h1>
            <p className="text-[#64748B] mt-1">
              当前站点：<span className="text-[#0F172A]">{editingProfile.name}</span>。地图文件维护请到“地图管理”。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="bg-transparent border-[#E2E8F0] text-[#0F172A] hover:bg-[#E2E8F0]"
              onClick={leaveEditMode}
            >
              取消
            </Button>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={handleSaveDraft}>
              <Save className="w-4 h-4 mr-2" />
              保存配置
            </Button>
          </div>
        </div>

        <Tabs value={editTab} onValueChange={(value) => setEditTab(value as EditTab)} className="space-y-6">
          <TabsList className="bg-[#FFFFFF] border border-[#E2E8F0]">
            <TabsTrigger value="map" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
              <MapPinned className="w-4 h-4 mr-2" />
              地图配置
            </TabsTrigger>
            <TabsTrigger value="dock" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
              <Warehouse className="w-4 h-4 mr-2" />
              月台配置
            </TabsTrigger>
            <TabsTrigger value="alert" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" />
              告警配置
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
              <Server className="w-4 h-4 mr-2" />
              系统配置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="agv-panel p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[#0F172A] font-semibold">显示参数</h2>
                    <p className="text-[#64748B] text-sm mt-1">
                      站点地图只需要选择资源并设置默认显示参数。
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] hover:bg-[#E2E8F0]"
                    onClick={() => setCurrentPage('maps')}
                  >
                    管理地图
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-[#0F172A]">默认地图</label>
                  <Select
                    value={draft.mapConfig.selectedMapId ?? '__none__'}
                    onValueChange={(value) =>
                      updateMapConfig({ selectedMapId: value === '__none__' ? null : value })
                    }
                  >
                    <SelectTrigger className="w-full bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]">
                      <SelectValue placeholder="请选择地图" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A]">
                      <SelectItem value="__none__">不选择地图</SelectItem>
                      {mapFiles.map((map) => (
                        <SelectItem key={map.id} value={map.id}>
                          {map.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[#0F172A]">默认缩放比例</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="2"
                    value={draft.mapConfig.defaultZoom}
                    onChange={(event) =>
                      updateMapConfig({ defaultZoom: Number.parseFloat(event.target.value) || 1 })
                    }
                    className="max-w-32 bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#0F172A]">显示网格</p>
                    <p className="text-[#64748B] text-sm">进入地图调度时默认显示辅助网格。</p>
                  </div>
                  <Switch
                    checked={draft.mapConfig.showGrid}
                    onCheckedChange={(checked) => updateMapConfig({ showGrid: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#0F172A]">显示车辆标签</p>
                    <p className="text-[#64748B] text-sm">在地图上显示车辆编号和标签信息。</p>
                  </div>
                  <Switch
                    checked={draft.mapConfig.showVehicleLabels}
                    onCheckedChange={(checked) => updateMapConfig({ showVehicleLabels: checked })}
                  />
                </div>
              </div>

              <div className="agv-panel p-6 space-y-5">
                <h2 className="text-[#0F172A] font-semibold">刷新参数</h2>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#0F172A]">自动刷新</p>
                    <p className="text-[#64748B] text-sm">进入地图调度页后自动更新车辆位置与图层状态。</p>
                  </div>
                  <Switch
                    checked={draft.mapConfig.autoRefresh}
                    onCheckedChange={(checked) => updateMapConfig({ autoRefresh: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[#0F172A]">刷新间隔（毫秒）</label>
                  <Input
                    type="number"
                    value={draft.mapConfig.refreshInterval}
                    onChange={(event) =>
                      updateMapConfig({ refreshInterval: Number.parseInt(event.target.value, 10) || 1000 })
                    }
                    className="max-w-40 bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dock">
            <div className="agv-panel p-6 space-y-6 max-w-3xl">
              <h2 className="text-[#0F172A] font-semibold">月台配置</h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[#0F172A]">占用超时（秒）</label>
                  <p className="text-[#64748B] text-sm">月台被占用超过这个时间后触发超时告警。</p>
                  <Input
                    type="number"
                    value={draft.dockConfig.occupyTimeout}
                    onChange={(event) =>
                      updateDockConfig({ occupyTimeout: Number.parseInt(event.target.value, 10) || 300 })
                    }
                    className="max-w-40 bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[#0F172A]">排队预警阈值</label>
                  <p className="text-[#64748B] text-sm">等待月台的车辆达到这个数量时在界面上标红提示。</p>
                  <Input
                    type="number"
                    value={draft.dockConfig.queueWarningThreshold}
                    onChange={(event) =>
                      updateDockConfig({
                        queueWarningThreshold: Number.parseInt(event.target.value, 10) || 5,
                      })
                    }
                    className="max-w-40 bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#0F172A]">任务完成后自动释放月台</p>
                    <p className="text-[#64748B] text-sm">减少人工干预，适合流程固定的现场。</p>
                  </div>
                  <Switch
                    checked={draft.dockConfig.autoRelease}
                    onCheckedChange={(checked) => updateDockConfig({ autoRelease: checked })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alert">
            <div className="agv-panel p-6 space-y-6 max-w-3xl">
              <h2 className="text-[#0F172A] font-semibold">告警配置</h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[#0F172A]">心跳超时（秒）</label>
                  <p className="text-[#64748B] text-sm">车辆超过这个时间没有心跳就视为离线。</p>
                  <Input
                    type="number"
                    value={draft.alertConfig.heartbeatTimeout}
                    onChange={(event) =>
                      updateAlertConfig({
                        heartbeatTimeout: Number.parseInt(event.target.value, 10) || 30,
                      })
                    }
                    className="max-w-40 bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[#0F172A]">低电量阈值（%）</label>
                  <p className="text-[#64748B] text-sm">低于该阈值后会触发低电量告警。</p>
                  <Input
                    type="number"
                    min="5"
                    max="50"
                    value={draft.alertConfig.batteryLowThreshold}
                    onChange={(event) =>
                      updateAlertConfig({
                        batteryLowThreshold: Number.parseInt(event.target.value, 10) || 20,
                      })
                    }
                    className="max-w-40 bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[#0F172A]">任务超时（秒）</label>
                  <p className="text-[#64748B] text-sm">任务执行超过该时间后标记为超时。</p>
                  <Input
                    type="number"
                    value={draft.alertConfig.taskTimeout}
                    onChange={(event) =>
                      updateAlertConfig({ taskTimeout: Number.parseInt(event.target.value, 10) || 600 })
                    }
                    className="max-w-40 bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#0F172A]">启用提示音</p>
                    <p className="text-[#64748B] text-sm">收到新告警时播放声效。</p>
                  </div>
                  <Switch
                    checked={draft.alertConfig.enableSound}
                    onCheckedChange={(checked) => updateAlertConfig({ enableSound: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#0F172A]">启用桌面通知</p>
                    <p className="text-[#64748B] text-sm">适合值守人员切出界面时也能及时收到提醒。</p>
                  </div>
                  <Switch
                    checked={draft.alertConfig.enableDesktopNotification}
                    onCheckedChange={(checked) => updateAlertConfig({ enableDesktopNotification: checked })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="system">
            <div className="agv-panel p-6 space-y-6 max-w-3xl">
              <h2 className="text-[#0F172A] font-semibold">系统配置</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[#0F172A]">MQTT Broker</label>
                  <Input
                    value={draft.systemConfig.mqttBroker}
                    onChange={(event) => updateSystemConfig({ mqttBroker: event.target.value })}
                    className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[#0F172A]">MQTT 端口</label>
                  <Input
                    type="number"
                    value={draft.systemConfig.mqttPort}
                    onChange={(event) =>
                      updateSystemConfig({ mqttPort: Number.parseInt(event.target.value, 10) || 1883 })
                    }
                    className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[#0F172A]">API 地址</label>
                <Input
                  value={draft.systemConfig.apiEndpoint}
                  onChange={(event) => updateSystemConfig({ apiEndpoint: event.target.value })}
                  className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[#0F172A]">日志级别</label>
                <select
                  value={draft.systemConfig.logLevel}
                  onChange={(event) => updateSystemConfig({ logLevel: event.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A]"
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="h-full p-6 overflow-auto custom-scrollbar">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#0F172A]">系统配置</h1>
          <p className="text-[#64748B] mt-1">
            一级只做站点配置管理；所有站点操作都放在卡片内部，顶部只保留“新增站点”。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {savedMessage && (
            <div className="px-4 py-2 rounded-xl bg-[#16A34A]/10 border border-[#16A34A]/30 text-[#0F172A] flex items-center gap-2">
              <Check className="w-4 h-4 text-[#16A34A]" />
              <span>{savedMessage}</span>
            </div>
          )}
          <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={() => openProfileDialog('create')}>
            <Plus className="w-4 h-4 mr-2" />
            新增站点
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {siteProfiles.map((profile) => {
          const mapName = profile.mapConfig.selectedMapId
            ? mapFiles.find((map) => map.id === profile.mapConfig.selectedMapId)?.name ?? '未找到地图'
            : '未选择'
          const isDefaultProfile = profile.id === DEFAULT_SITE_PROFILE_ID

          return (
            <article
              key={profile.id}
              className={cn(
                'agv-panel p-4 transition-all duration-200 hover:border-[#2563EB]/40',
                profile.isActive && 'border-[#2563EB] shadow-[0_0_0_1px_rgba(45,120,244,0.3)]'
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-[#0F172A] font-semibold truncate">{profile.name}</h2>
                    {profile.isActive && <span className="status-success">当前生效</span>}
                    {isDefaultProfile && <span className="status-primary">默认配置</span>}
                  </div>
                  <p className="text-[#64748B] text-xs mt-1 line-clamp-2">
                    {profile.description || '暂无站点说明'}
                  </p>
                </div>
                <FolderCog className="w-5 h-5 text-[#0891B2] flex-shrink-0" />
              </div>

              <div className="space-y-2 text-[13px]">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>默认地图</span>
                  <span className="text-[#0F172A] truncate ml-3">{mapName}</span>
                </div>
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>MQTT</span>
                  <span className="text-[#0F172A] font-mono text-xs truncate ml-3">
                    {profile.systemConfig.mqttBroker}:{profile.systemConfig.mqttPort}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>API</span>
                  <span className="text-[#0F172A] truncate ml-3">{profile.systemConfig.apiEndpoint}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2E8F0] space-y-2">
                <Button
                  size="sm"
                  className="w-full bg-[#2563EB] hover:bg-[#2563EB]/90"
                  onClick={() => beginEditProfile(profile)}
                >
                  编辑配置
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-[#E2E8F0] text-[#0F172A] hover:bg-[#E2E8F0]"
                    onClick={() => openProfileDialog('rename', profile)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    编辑站点
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-[#E2E8F0] text-[#0F172A] hover:bg-[#E2E8F0]"
                    onClick={() => openProfileDialog('duplicate', profile)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    复制配置
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      'border-[#E2E8F0] text-[#0F172A] hover:bg-[#E2E8F0]',
                      profile.isActive && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={profile.isActive}
                    onClick={() => activateSiteProfile(profile.id)}
                  >
                    {profile.isActive ? '当前生效' : '启用站点'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      'border-[#DC2626]/30 text-[#DC2626] hover:bg-[#DC2626]/10',
                      isDefaultProfile && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={isDefaultProfile}
                    onClick={() => handleDeleteProfile(profile)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除站点
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-0.5 text-xs">
                  <span className="text-[#64748B]">最近更新</span>
                  <span className="text-[#0F172A]">{profile.updatedAt.toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <Dialog open={profileDialogOpen} onOpenChange={(open) => (!open ? resetProfileDialog() : setProfileDialogOpen(true))}>
        <DialogContent className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderCog className="w-5 h-5 text-[#2563EB]" />
              {profileDialogMode === 'create'
                ? '新建站点配置'
                : profileDialogMode === 'duplicate'
                  ? '复制站点配置'
                  : '编辑站点信息'}
            </DialogTitle>
            <DialogDescription className="text-[#64748B]">
              {profileDialogMode === 'create'
                ? '新站点会继承当前生效站点的配置参数，你可以稍后进入二级页面继续细调。'
                : profileDialogMode === 'duplicate'
                  ? '复制会完整保留地图、月台、告警和系统配置，只需要改一个新名字。'
                  : '这里只修改站点名称和说明，详细参数请走“编辑配置”。'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-[#0F172A]">站点名称</label>
              <Input
                value={profileNameInput}
                onChange={(event) => setProfileNameInput(event.target.value)}
                placeholder="例如：华南仓 A 区"
                className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[#0F172A]">站点说明</label>
              <Input
                value={profileDescriptionInput}
                onChange={(event) => setProfileDescriptionInput(event.target.value)}
                placeholder="例如：深圳仓一层现场配置"
                className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="bg-transparent border-[#E2E8F0] text-[#0F172A] hover:bg-[#E2E8F0]"
              onClick={resetProfileDialog}
            >
              取消
            </Button>
            <Button
              className="bg-[#2563EB] hover:bg-[#2563EB]/90"
              disabled={!profileNameInput.trim()}
              onClick={handleSubmitProfileDialog}
            >
              {profileDialogMode === 'rename' ? '保存站点' : '继续'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
