'use client'

import { useAGVStore } from '@/lib/agv-store'
import { generateDiagnosticMessages } from '@/lib/mock-data'
import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Filter,
  Radio,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Pause,
  Play,
  Copy,
  Check,
  Wifi,
  WifiOff,
  Server,
  Activity,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function DiagnosticsPage() {
  const { vehicles } = useAGVStore()
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [directionFilter, setDirectionFilter] = useState<'all' | 'inbound' | 'outbound'>('all')
  const [isPaused, setIsPaused] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const messages = useMemo(() => {
    if (!selectedVehicleId) return []
    return generateDiagnosticMessages(selectedVehicleId, 50)
  }, [selectedVehicleId])
  
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      if (directionFilter !== 'all' && m.direction !== directionFilter) return false
      if (searchQuery && !m.topic.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !m.payload.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    })
  }, [messages, directionFilter, searchQuery])
  
  const handleCopy = (id: string, payload: string) => {
    navigator.clipboard.writeText(payload)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // 模拟MQTT状态
  const mqttStatus = {
    connected: true,
    broker: 'mqtt://192.168.1.100:1883',
    clientId: 'agv-dispatcher-001',
    messagesIn: 12847,
    messagesOut: 8923
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">通信诊断</h1>
          <p className="text-[#64748B] mt-1">监控AGV通信状态和消息收发</p>
        </div>
      </div>

      {/* MQTT状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="agv-panel p-4">
          <div className="flex items-center justify-between mb-2">
            {mqttStatus.connected ? (
              <Wifi className="w-5 h-5 text-[#16A34A]" />
            ) : (
              <WifiOff className="w-5 h-5 text-[#DC2626]" />
            )}
            <span className={mqttStatus.connected ? 'status-success' : 'status-danger'}>
              {mqttStatus.connected ? '已连接' : '断开'}
            </span>
          </div>
          <p className="text-[#64748B] text-sm">MQTT状态</p>
          <p className="text-[#0F172A] text-sm font-mono truncate mt-1">{mqttStatus.broker}</p>
        </div>
        
        <div className="agv-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <Server className="w-5 h-5 text-[#0891B2]" />
          </div>
          <p className="text-[#64748B] text-sm">客户端ID</p>
          <p className="text-[#0F172A] text-sm font-mono truncate mt-1">{mqttStatus.clientId}</p>
        </div>
        
        <div className="agv-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <ArrowDownLeft className="w-5 h-5 text-[#16A34A]" />
          </div>
          <p className="text-[#64748B] text-sm">接收消息</p>
          <p className="kpi-number text-xl font-bold text-[#0F172A] mt-1">{mqttStatus.messagesIn.toLocaleString()}</p>
        </div>
        
        <div className="agv-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <ArrowUpRight className="w-5 h-5 text-[#2563EB]" />
          </div>
          <p className="text-[#64748B] text-sm">发送消息</p>
          <p className="kpi-number text-xl font-bold text-[#0F172A] mt-1">{mqttStatus.messagesOut.toLocaleString()}</p>
        </div>
      </div>

      {/* 车辆选择和过滤 */}
      <div className="flex items-center gap-3 mb-4">
        <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
          <SelectTrigger className="w-48 bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]">
            <SelectValue placeholder="选择车辆" />
          </SelectTrigger>
          <SelectContent className="bg-[#F1F5F9] border-[#E2E8F0]">
            {vehicles.map(v => (
              <SelectItem key={v.id} value={v.id} className="text-[#0F172A]">
                {v.id} - {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <Input
            placeholder="搜索主题或内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#64748B]"
          />
        </div>
        
        <div className="flex items-center gap-1 agv-panel p-1">
          <Button 
            variant="ghost" 
            size="sm"
            className={cn(
              "px-3",
              directionFilter === 'all' ? "bg-[#2563EB] text-white" : "text-[#64748B] hover:text-[#0F172A]"
            )}
            onClick={() => setDirectionFilter('all')}
          >
            全部
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className={cn(
              "px-3",
              directionFilter === 'inbound' ? "bg-[#16A34A] text-white" : "text-[#64748B] hover:text-[#0F172A]"
            )}
            onClick={() => setDirectionFilter('inbound')}
          >
            <ArrowDownLeft className="w-4 h-4 mr-1" />
            入站
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className={cn(
              "px-3",
              directionFilter === 'outbound' ? "bg-[#2563EB] text-white" : "text-[#64748B] hover:text-[#0F172A]"
            )}
            onClick={() => setDirectionFilter('outbound')}
          >
            <ArrowUpRight className="w-4 h-4 mr-1" />
            出站
          </Button>
        </div>
        
        <div className="flex-1" />
        
        <Button 
          variant="outline"
          size="icon"
          className={cn(
            "bg-[#FFFFFF] border-[#E2E8F0]",
            isPaused ? "text-[#D97706]" : "text-[#16A34A]"
          )}
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </Button>
        
        <Button 
          variant="outline"
          size="icon"
          className="bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 agv-panel overflow-hidden">
        {!selectedVehicleId ? (
          <div className="flex flex-col items-center justify-center h-full text-[#64748B]">
            <Radio className="w-12 h-12 mb-4 opacity-50" />
            <p>请选择一辆车辆以查看通信消息</p>
          </div>
        ) : (
          <div className="overflow-auto h-full custom-scrollbar font-mono text-sm">
            {filteredMessages.map(msg => (
              <div 
                key={msg.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 border-b border-[#E2E8F0] hover:bg-[#F1F5F9] group",
                  msg.direction === 'inbound' ? 'bg-[#16A34A]/5' : 'bg-[#2563EB]/5'
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
                  msg.direction === 'inbound' ? 'bg-[#16A34A]/20' : 'bg-[#2563EB]/20'
                )}>
                  {msg.direction === 'inbound' ? (
                    <ArrowDownLeft className="w-4 h-4 text-[#16A34A]" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-[#2563EB]" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[#64748B] text-xs">
                      {msg.timestamp.toLocaleTimeString('zh-CN', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit',
                        fractionalSecondDigits: 3 
                      })}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs",
                      msg.direction === 'inbound' 
                        ? 'bg-[#16A34A]/20 text-[#16A34A]' 
                        : 'bg-[#2563EB]/20 text-[#2563EB]'
                    )}>
                      {msg.topic}
                    </span>
                  </div>
                  <pre className="text-[#0F172A] text-xs whitespace-pre-wrap break-all bg-[#F8FAFC] p-2 rounded">
                    {JSON.stringify(JSON.parse(msg.payload), null, 2)}
                  </pre>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#64748B] hover:text-[#0F172A]"
                  onClick={() => handleCopy(msg.id, msg.payload)}
                >
                  {copiedId === msg.id ? (
                    <Check className="w-4 h-4 text-[#16A34A]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
