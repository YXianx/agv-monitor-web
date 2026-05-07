'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAGVStore } from '@/lib/agv-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertTriangle,
  Download,
  Eye,
  FileImage,
  FileText,
  Map,
  MapPinned,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import type { MapFile } from '@/lib/agv-types'
import { cn } from '@/lib/utils'

const MAP_GUIDE_STORAGE_KEY = 'agv.mapGuideDismissed'

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export function MapManagementPage() {
  const {
    mapFiles,
    addMapFile,
    deleteMapFile,
    siteProfiles,
    activeProfile,
    mapManagementGuideOpen,
    setMapManagementGuideOpen,
  } = useAGVStore()

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [previewMapId, setPreviewMapId] = useState<string | null>(null)
  const [newMapName, setNewMapName] = useState('')
  const [pgmFile, setPgmFile] = useState<File | null>(null)
  const [yamlFile, setYamlFile] = useState<File | null>(null)
  const pgmInputRef = useRef<HTMLInputElement>(null)
  const yamlInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem(MAP_GUIDE_STORAGE_KEY) === '1' && mapManagementGuideOpen) {
      setMapManagementGuideOpen(false)
    }
  }, [mapManagementGuideOpen, setMapManagementGuideOpen])

  const previewMap = useMemo(
    () => mapFiles.find((map) => map.id === previewMapId) ?? null,
    [mapFiles, previewMapId]
  )

  const mapUsageCount = useMemo(() => {
    return mapFiles.reduce<Record<string, number>>((acc, map) => {
      acc[map.id] = siteProfiles.filter((profile) => profile.mapConfig.selectedMapId === map.id).length
      return acc
    }, {})
  }, [mapFiles, siteProfiles])

  const handleDownloadMap = (map: MapFile, type: 'pgm' | 'yaml') => {
    const data = type === 'pgm' ? map.pgmData : map.yamlData
    const fileName = type === 'pgm' ? map.pgmFileName : map.yamlFileName
    if (!data) return

    const link = document.createElement('a')
    if (type === 'pgm') {
      link.href = data
    } else {
      link.href = `data:text/yaml;charset=utf-8,${encodeURIComponent(data)}`
    }
    link.download = fileName
    link.click()
  }

  const resetUploadForm = () => {
    setUploadDialogOpen(false)
    setNewMapName('')
    setPgmFile(null)
    setYamlFile(null)
  }

  const handleMapUpload = async () => {
    if (!newMapName || !pgmFile || !yamlFile) return

    try {
      const pgmData = await readFileAsDataURL(pgmFile)
      const yamlText = await readFileAsText(yamlFile)

      const resolutionMatch = yamlText.match(/resolution:\s*([\d.]+)/)
      const originMatch = yamlText.match(/origin:\s*\[([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\]/)

      addMapFile({
        id: `map-${Date.now()}`,
        name: newMapName,
        pgmFileName: pgmFile.name,
        yamlFileName: yamlFile.name,
        pgmData,
        yamlData: yamlText,
        previewImageUrl: null,
        resolution: resolutionMatch ? Number.parseFloat(resolutionMatch[1]) : 0.05,
        origin: originMatch
          ? [
              Number.parseFloat(originMatch[1]),
              Number.parseFloat(originMatch[2]),
              Number.parseFloat(originMatch[3]),
            ]
          : [0, 0, 0],
        width: 0,
        height: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      resetUploadForm()
    } catch (error) {
      console.error('Map upload failed', error)
    }
  }

  const handleDeleteMap = (map: MapFile) => {
    const usageCount = mapUsageCount[map.id] ?? 0
    if (usageCount > 0) return

    if (window.confirm(`确定删除地图“${map.name}”吗？`)) {
      deleteMapFile(map.id)
    }
  }

  const dismissGuide = () => {
    setMapManagementGuideOpen(false)
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(MAP_GUIDE_STORAGE_KEY, '1')
    }
  }

  return (
    <div className="h-full p-6 overflow-auto custom-scrollbar">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">地图管理</h1>
          <p className="text-[#64748B] mt-1">
            这里维护地图资源本身；站点配置页面只负责选择要用哪张地图。
          </p>
        </div>
        <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={() => setUploadDialogOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          上传地图
        </Button>
      </div>

      {mapManagementGuideOpen && (
        <div className="agv-panel p-4 mb-4 bg-[linear-gradient(135deg,rgba(45,120,244,0.08),rgba(35,183,217,0.04))]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#0891B2]" />
                <h2 className="text-[#0F172A] font-semibold">管理说明</h2>
              </div>
              <p className="text-[#475569] text-sm leading-6">
                地图被站点引用后不能直接删除。关闭这条说明后，本次登录期间不会再次占位显示。
              </p>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              onClick={dismissGuide}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {mapFiles.length === 0 ? (
        <div className="agv-panel p-12 text-center flex flex-col items-center">
          <Map className="w-16 h-16 text-[#64748B] mb-4" />
          <h2 className="text-[#0F172A] text-lg font-semibold mb-2">还没有地图资源</h2>
          <p className="text-[#64748B] max-w-md mb-6">
            上传 PGM 和对应的 YAML 后，站点配置里的默认地图下拉框就可以直接选择。
          </p>
          <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            上传第一张地图
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {mapFiles.map((map) => {
            const usageCount = mapUsageCount[map.id] ?? 0
            const isActiveMap = activeProfile?.mapConfig.selectedMapId === map.id
            const canDelete = usageCount === 0

            return (
              <article
                key={map.id}
                className={cn(
                  'agv-panel p-4 transition-all duration-200',
                  isActiveMap && 'border-[#2563EB]/60 shadow-[0_0_0_1px_rgba(45,120,244,0.25)]'
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[#0F172A] font-semibold truncate">{map.name}</h2>
                      {isActiveMap && <span className="status-primary">当前站点使用</span>}
                      {usageCount > 0 && <span className="status-success">已被引用</span>}
                    </div>
                    <p className="text-[#64748B] text-xs mt-1">
                      创建于 {map.createdAt.toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <MapPinned className="w-5 h-5 text-[#0891B2] flex-shrink-0" />
                </div>

                <div className="space-y-2 text-[13px] mb-4">
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <FileImage className="w-4 h-4" />
                    <span className="truncate">{map.pgmFileName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <FileText className="w-4 h-4" />
                    <span className="truncate">{map.yamlFileName}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span>分辨率</span>
                    <span className="text-[#0F172A] kpi-number">{map.resolution} m/px</span>
                  </div>
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span>引用站点数量</span>
                    <span className="text-[#0F172A]">{usageCount}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="col-span-2 bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] hover:bg-[#2563EB]/10 hover:border-[#2563EB]"
                    onClick={() => setPreviewMapId(map.id)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    预览
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] hover:bg-[#16A34A]/10 hover:border-[#16A34A]"
                    onClick={() => handleDownloadMap(map, 'pgm')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'bg-[#FFFFFF] text-[#DC2626] border-[#DC2626]/30 hover:bg-[#DC2626]/10',
                      !canDelete && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={!canDelete}
                    onClick={() => handleDeleteMap(map)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Dialog open={uploadDialogOpen} onOpenChange={(open) => (!open ? resetUploadForm() : setUploadDialogOpen(true))}>
        <DialogContent className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#2563EB]" />
              上传地图文件
            </DialogTitle>
            <DialogDescription className="text-[#64748B]">
              上传 PGM 地图图像和对应的 YAML 配置文件。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-[#0F172A]">地图名称</label>
              <Input
                value={newMapName}
                onChange={(event) => setNewMapName(event.target.value)}
                placeholder="例如：深圳仓库一层"
                className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#64748B]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[#0F172A]">PGM 地图文件</label>
              <input
                ref={pgmInputRef}
                type="file"
                accept=".pgm,.png,.jpg"
                className="hidden"
                onChange={(event) => setPgmFile(event.target.files?.[0] ?? null)}
              />
              <Button
                variant="outline"
                className="w-full justify-start bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] hover:bg-[#E2E8F0]"
                onClick={() => pgmInputRef.current?.click()}
              >
                <FileImage className="w-4 h-4 mr-2 text-[#64748B]" />
                {pgmFile ? pgmFile.name : '选择 PGM 文件'}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[#0F172A]">YAML 配置文件</label>
              <input
                ref={yamlInputRef}
                type="file"
                accept=".yaml,.yml"
                className="hidden"
                onChange={(event) => setYamlFile(event.target.files?.[0] ?? null)}
              />
              <Button
                variant="outline"
                className="w-full justify-start bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] hover:bg-[#E2E8F0]"
                onClick={() => yamlInputRef.current?.click()}
              >
                <FileText className="w-4 h-4 mr-2 text-[#64748B]" />
                {yamlFile ? yamlFile.name : '选择 YAML 文件'}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="bg-transparent border-[#E2E8F0] text-[#0F172A] hover:bg-[#E2E8F0]"
              onClick={resetUploadForm}
            >
              取消
            </Button>
            <Button
              className="bg-[#2563EB] hover:bg-[#2563EB]/90"
              disabled={!newMapName || !pgmFile || !yamlFile}
              onClick={handleMapUpload}
            >
              <Upload className="w-4 h-4 mr-2" />
              上传地图
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewMapId} onOpenChange={() => setPreviewMapId(null)}>
        <DialogContent className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#0891B2]" />
              地图预览 {previewMap ? `- ${previewMap.name}` : ''}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {(previewMap?.previewImageUrl || previewMap?.pgmData) && (
              <div className="rounded-lg overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC]">
                <img
                  src={previewMap?.previewImageUrl ?? previewMap?.pgmData ?? ''}
                  alt={previewMap?.name ?? '地图预览'}
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
              <div className="p-3 rounded bg-[#FFFFFF]">
                <p className="text-[#64748B]">分辨率</p>
                <p className="text-[#0F172A] kpi-number">{previewMap?.resolution} m/px</p>
              </div>
              <div className="p-3 rounded bg-[#FFFFFF]">
                <p className="text-[#64748B]">原点</p>
                <p className="text-[#0F172A] kpi-number font-mono text-xs">[{previewMap?.origin.join(', ')}]</p>
              </div>
              <div className="p-3 rounded bg-[#FFFFFF]">
                <p className="text-[#64748B]">文件名</p>
                <p className="text-[#0F172A] truncate">{previewMap?.pgmFileName}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] hover:bg-[#16A34A]/10 hover:border-[#16A34A]"
              onClick={() => previewMap && handleDownloadMap(previewMap, 'pgm')}
            >
              <Download className="w-4 h-4 mr-2" />
              下载 PGM
            </Button>
            <Button
              variant="outline"
              className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] hover:bg-[#16A34A]/10 hover:border-[#16A34A]"
              onClick={() => previewMap && handleDownloadMap(previewMap, 'yaml')}
            >
              <Download className="w-4 h-4 mr-2" />
              下载 YAML
            </Button>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={() => setPreviewMapId(null)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
