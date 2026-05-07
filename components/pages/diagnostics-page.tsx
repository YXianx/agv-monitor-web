'use client'

import { useMemo, useState } from 'react'
import { useAGVStore } from '@/lib/agv-store'
import { pingStatusLabels } from '@/lib/agv-types'
import { generateDiagnosticMessages } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  Gauge,
  Loader2,
  RefreshCw,
  Search,
  TimerReset,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function getPingBadgeClasses(status: string) {
  if (status === 'success') return 'bg-[#16A34A]/10 text-[#15803D] border-[#16A34A]/20'
  if (status === 'warning') return 'bg-[#D97706]/10 text-[#B45309] border-[#D97706]/20'
  if (status === 'timeout' || status === 'offline') return 'bg-[#DC2626]/10 text-[#B91C1C] border-[#DC2626]/20'
  if (status === 'testing') return 'bg-[#2563EB]/10 text-[#1D4ED8] border-[#2563EB]/20'
  return 'bg-[#E2E8F0] text-[#64748B] border-[#CBD5E1]'
}

export function DiagnosticsPage() {
  const { vehicles, pingResults, pingTesting, lastPingBatchAt, runPingTestForAllVehicles, runPingTestForVehicle } =
    useAGVStore()
  const [reportVehicleId, setReportVehicleId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [directionFilter, setDirectionFilter] = useState<'all' | 'inbound' | 'outbound'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const reportMessages = useMemo(() => {
    if (!reportVehicleId) return []
    return generateDiagnosticMessages(reportVehicleId, 50)
  }, [reportVehicleId])

  const filteredMessages = useMemo(() => {
    return reportMessages.filter((message) => {
      if (directionFilter !== 'all' && message.direction !== directionFilter) return false
      if (
        searchQuery &&
        !message.topic.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !message.payload.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [directionFilter, reportMessages, searchQuery])

  const pingSummary = useMemo(() => {
    const tested = pingResults.filter((item) => item.testedAt)
    const successCount = pingResults.filter((item) => item.status === 'success').length
    const warningCount = pingResults.filter((item) => item.status === 'warning').length
    const failedCount = pingResults.filter((item) => item.status === 'timeout' || item.status === 'offline').length
    const latencyValues = tested.flatMap((item) => (item.latencyMs === null ? [] : [item.latencyMs]))
    const averageLatency =
      latencyValues.length > 0
        ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length)
        : null
    const passRate = pingResults.length > 0 ? Math.round(((successCount + warningCount) / pingResults.length) * 100) : 0

    return {
      successCount,
      warningCount,
      failedCount,
      averageLatency,
      passRate,
    }
  }, [pingResults])

  const handleCopy = (id: string, payload: string) => {
    navigator.clipboard.writeText(payload)
    setCopiedId(id)
    window.setTimeout(() => setCopiedId(null), 2000)
  }

  const openReportDialog = (vehicleId: string) => {
    setReportVehicleId(vehicleId)
    setSearchQuery('')
    setDirectionFilter('all')
  }

  return (
    <div className="h-full p-6 overflow-auto custom-scrollbar space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">通信诊断</h1>
          <p className="text-[#64748B] mt-1">
            建议把 ping 包测试放在通信诊断页顶部，先看整场连通性，再通过单车报文弹窗下钻定位问题。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {lastPingBatchAt && (
            <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2 text-sm text-[#1D4ED8]">
              最近批量测试：
              {lastPingBatchAt.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          )}
          <Button
            className="bg-[#2563EB] hover:bg-[#2563EB]/90"
            onClick={runPingTestForAllVehicles}
            disabled={pingTesting}
          >
            {pingTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
            一键测试
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="agv-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <Wifi className="w-5 h-5 text-[#16A34A]" />
            <span className="status-success">{pingSummary.passRate}% 通过</span>
          </div>
          <p className="text-sm text-[#64748B]">现场连通通过率</p>
          <p className="mt-2 text-3xl font-semibold text-[#0F172A]">{pingSummary.successCount + pingSummary.warningCount}</p>
          <p className="mt-1 text-xs text-[#94A3B8]">共 {pingResults.length} 台车辆纳入测试</p>
        </div>

        <div className="agv-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <Gauge className="w-5 h-5 text-[#2563EB]" />
            <span className="status-primary">平均延迟</span>
          </div>
          <p className="text-sm text-[#64748B]">成功样本时延</p>
          <p className="mt-2 text-3xl font-semibold text-[#0F172A]">
            {pingSummary.averageLatency === null ? '--' : pingSummary.averageLatency}
            <span className="ml-1 text-base font-medium text-[#64748B]">ms</span>
          </p>
          <p className="mt-1 text-xs text-[#94A3B8]">适合现场快速判断交换机或 AP 抖动</p>
        </div>

        <div className="agv-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
            <span className="status-success">稳定</span>
          </div>
          <p className="text-sm text-[#64748B]">正常车辆</p>
          <p className="mt-2 text-3xl font-semibold text-[#0F172A]">{pingSummary.successCount}</p>
          <p className="mt-1 text-xs text-[#94A3B8]">低延迟、低丢包，可直接投入运行</p>
        </div>

        <div className="agv-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <WifiOff className="w-5 h-5 text-[#DC2626]" />
            <span className="status-danger">需排查</span>
          </div>
          <p className="text-sm text-[#64748B]">失败 / 离线车辆</p>
          <p className="mt-2 text-3xl font-semibold text-[#0F172A]">{pingSummary.failedCount}</p>
          <p className="mt-1 text-xs text-[#94A3B8]">建议优先核查网桥供电、AP 覆盖和现场屏蔽区</p>
        </div>
      </div>

      <section className="agv-panel p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">网络连通测试</h2>
            <p className="text-sm text-[#64748B] mt-1">
              这里保留整场“一键测试”和单车“复测”入口；单击“查看报文”时，用对话框展示对应 AGV 的报文详情。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-[#16A34A]/10 text-[#15803D] border-[#16A34A]/20">正常 {pingSummary.successCount}</Badge>
            <Badge className="bg-[#D97706]/10 text-[#B45309] border-[#D97706]/20">波动 {pingSummary.warningCount}</Badge>
            <Badge className="bg-[#DC2626]/10 text-[#B91C1C] border-[#DC2626]/20">失败 {pingSummary.failedCount}</Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                <th className="text-left py-3 pr-3 font-medium">车辆</th>
                <th className="text-left py-3 pr-3 font-medium">目标地址</th>
                <th className="text-left py-3 pr-3 font-medium">测试结果</th>
                <th className="text-left py-3 pr-3 font-medium">延迟</th>
                <th className="text-left py-3 pr-3 font-medium">抖动</th>
                <th className="text-left py-3 pr-3 font-medium">丢包率</th>
                <th className="text-left py-3 pr-3 font-medium">说明</th>
                <th className="text-right py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {pingResults.map((result) => (
                <tr key={result.vehicleId} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                  <td className="py-3 pr-3">
                    <div>
                      <p className="font-medium text-[#0F172A]">{result.vehicleId}</p>
                      <p className="text-xs text-[#64748B]">{result.vehicleName}</p>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-[#0F172A] font-mono">{result.targetIp}</td>
                  <td className="py-3 pr-3">
                    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs', getPingBadgeClasses(result.status))}>
                      {result.status === 'testing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      {pingStatusLabels[result.status]}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-[#0F172A]">{result.latencyMs === null ? '--' : `${result.latencyMs} ms`}</td>
                  <td className="py-3 pr-3 text-[#0F172A]">{result.jitterMs === null ? '--' : `${result.jitterMs} ms`}</td>
                  <td className="py-3 pr-3 text-[#0F172A]">{result.packetLoss}%</td>
                  <td className="py-3 pr-3 text-[#64748B] max-w-[260px] whitespace-normal">{result.note}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9]"
                        onClick={() => openReportDialog(result.vehicleId)}
                      >
                        查看报文
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE]"
                        onClick={() => runPingTestForVehicle(result.vehicleId)}
                      >
                        <TimerReset className="w-4 h-4 mr-1" />
                        复测
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={Boolean(reportVehicleId)} onOpenChange={(open) => (!open ? setReportVehicleId(null) : undefined)}>
        <DialogContent className="max-w-6xl bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]">
          <DialogHeader>
            <DialogTitle>{reportVehicleId ? `${reportVehicleId} 通信报文` : '通信报文'}</DialogTitle>
            <DialogDescription className="text-[#64748B]">
              从连通测试表进入单车报文详情，避免页面常驻一大片空白区域，也更适合现场逐台排查。
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <Input
                placeholder="搜索 topic 或 payload"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10 bg-white border-[#E2E8F0] text-[#0F172A]"
              />
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-white p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn('px-3', directionFilter === 'all' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:text-[#0F172A]')}
                onClick={() => setDirectionFilter('all')}
              >
                全部
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'px-3',
                  directionFilter === 'inbound' ? 'bg-[#16A34A] text-white' : 'text-[#64748B] hover:text-[#0F172A]'
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
                  'px-3',
                  directionFilter === 'outbound' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:text-[#0F172A]'
                )}
                onClick={() => setDirectionFilter('outbound')}
              >
                <ArrowUpRight className="w-4 h-4 mr-1" />
                出站
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]"
              onClick={() => setSearchQuery('')}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="max-h-[65vh] overflow-auto custom-scrollbar font-mono text-sm rounded-2xl border border-[#E2E8F0] bg-white">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 border-b border-[#E2E8F0] hover:bg-[#F1F5F9] group',
                  message.direction === 'inbound' ? 'bg-[#16A34A]/5' : 'bg-[#2563EB]/5'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded flex items-center justify-center flex-shrink-0',
                    message.direction === 'inbound' ? 'bg-[#16A34A]/20' : 'bg-[#2563EB]/20'
                  )}
                >
                  {message.direction === 'inbound' ? (
                    <ArrowDownLeft className="w-4 h-4 text-[#16A34A]" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-[#2563EB]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[#64748B] text-xs">
                      {message.timestamp.toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        fractionalSecondDigits: 3,
                      })}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs',
                        message.direction === 'inbound'
                          ? 'bg-[#16A34A]/20 text-[#16A34A]'
                          : 'bg-[#2563EB]/20 text-[#2563EB]'
                      )}
                    >
                      {message.topic}
                    </span>
                  </div>
                  <pre className="text-[#0F172A] text-xs whitespace-pre-wrap break-all bg-[#F8FAFC] p-2 rounded">
                    {JSON.stringify(JSON.parse(message.payload), null, 2)}
                  </pre>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#64748B] hover:text-[#0F172A]"
                  onClick={() => handleCopy(message.id, message.payload)}
                >
                  {copiedId === message.id ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ))}

            {filteredMessages.length === 0 && (
              <div className="flex h-48 items-center justify-center text-[#64748B]">
                <XCircle className="w-5 h-5 mr-2" />
                当前筛选条件下没有报文记录
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
