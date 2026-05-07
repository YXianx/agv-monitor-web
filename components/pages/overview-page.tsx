'use client'

import { useAGVStore } from '@/lib/agv-store'
import { generateTaskTrend, generateVehicleDistribution } from '@/lib/mock-data'
import { 
  Truck, 
  ClipboardCheck, 
  AlertTriangle, 
  Warehouse,
  TrendingUp,
  ArrowRight,
  Activity,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { useMemo } from 'react'

export function OverviewPage() {
  const { stats, alerts, setCurrentPage } = useAGVStore()
  
  const taskTrendData = useMemo(() => generateTaskTrend(), [])
  const vehicleDistribution = useMemo(() => generateVehicleDistribution(), [])
  
  const recentAlerts = alerts
    .filter(a => !a.resolvedAt)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">调度总览</h1>
          <p className="text-[#64748B] mt-1">实时监控系统运行状态，快速掌握全局信息</p>
        </div>
        <Button 
          onClick={() => setCurrentPage('map')}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
        >
          进入调度台
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* KPI指标卡 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 在线车辆 */}
        <div className="agv-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#0891B2]/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-[#0891B2]" />
            </div>
            <span className="status-online text-xs px-2 py-1 rounded-full">运行中</span>
          </div>
          <div className="space-y-1">
            <p className="text-[#64748B] text-sm">在线车辆</p>
            <div className="flex items-baseline gap-2">
              <span className="kpi-number text-3xl font-bold text-[#0F172A]">{stats.onlineVehicles}</span>
              <span className="text-[#94A3B8] text-sm">/ {stats.totalVehicles}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#D97706]" />
              <span className="text-[#475569]">告警 {stats.warningVehicles}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#94A3B8]" />
              <span className="text-[#475569]">离线 {stats.offlineVehicles}</span>
            </div>
          </div>
        </div>

        {/* 今日任务 */}
        <div className="agv-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-[#16A34A]" />
            </div>
            <div className="flex items-center gap-1 text-[#16A34A] text-xs">
              <TrendingUp className="w-3 h-3" />
              <span>+12%</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[#64748B] text-sm">今日完成</p>
            <div className="flex items-baseline gap-2">
              <span className="kpi-number text-3xl font-bold text-[#0F172A]">{stats.completedToday}</span>
              <span className="text-[#94A3B8] text-sm">任务</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span className="text-[#475569]">执行 {stats.activeTasks}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#D97706]" />
              <span className="text-[#475569]">排队 {stats.queuedTasks}</span>
            </div>
          </div>
        </div>

        {/* 月台占用 */}
        <div className="agv-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#D97706]/10 flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-[#D97706]" />
            </div>
            <span className="status-warning text-xs px-2 py-1 rounded-full">
              {Math.round(stats.dockOccupied / stats.dockTotal * 100)}%
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-[#64748B] text-sm">月台占用</p>
            <div className="flex items-baseline gap-2">
              <span className="kpi-number text-3xl font-bold text-[#0F172A]">{stats.dockOccupied}</span>
              <span className="text-[#94A3B8] text-sm">/ {stats.dockTotal}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#D97706] rounded-full transition-all duration-500"
                style={{ width: `${(stats.dockOccupied / stats.dockTotal) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 告警统计 */}
        <div className="agv-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
            </div>
            {stats.criticalAlerts > 0 && (
              <span className="status-danger text-xs px-2 py-1 rounded-full animate-pulse-danger">
                紧急 {stats.criticalAlerts}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[#64748B] text-sm">活跃告警</p>
            <div className="flex items-baseline gap-2">
              <span className={`kpi-number text-3xl font-bold ${stats.criticalAlerts > 0 ? 'text-[#DC2626]' : 'text-[#0F172A]'}`}>
                {stats.alertCount}
              </span>
              <span className="text-[#94A3B8] text-sm">条</span>
            </div>
          </div>
          <div className="mt-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-[#DC2626] hover:text-[#DC2626] hover:bg-[#DC2626]/10 p-0 h-auto"
              onClick={() => setCurrentPage('alerts')}
            >
              查看详情 →
            </Button>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 任务趋势图 */}
        <div className="lg:col-span-2 agv-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[#0F172A] font-semibold">任务趋势</h3>
              <p className="text-[#64748B] text-sm">24小时任务统计</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-[#2563EB]" />
                <span className="text-[#475569]">创建</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-[#16A34A]" />
                <span className="text-[#475569]">完成</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-[#DC2626]" />
                <span className="text-[#475569]">失败</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={taskTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis 
                  dataKey="time" 
                  stroke="#94A3B8" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94A3B8" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    color: '#0F172A',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="created" 
                  stroke="#2563EB" 
                  strokeWidth={2}
                  dot={false}
                  name="创建"
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#16A34A" 
                  strokeWidth={2}
                  dot={false}
                  name="完成"
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#DC2626" 
                  strokeWidth={2}
                  dot={false}
                  name="失败"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 车辆状态分布 */}
        <div className="agv-panel p-5">
          <div className="mb-4">
            <h3 className="text-[#0F172A] font-semibold">车辆状态分布</h3>
            <p className="text-[#64748B] text-sm">当前车队状态</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {vehicleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    color: '#0F172A',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {vehicleDistribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[#475569]">{item.name}</span>
                <span className="text-[#0F172A] font-medium ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部：告警列表和快捷操作 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最新告警 */}
        <div className="agv-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[#0F172A] font-semibold">最新告警</h3>
              <p className="text-[#64748B] text-sm">需要关注的异常事件</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-[#2563EB] hover:text-[#2563EB] hover:bg-[#2563EB]/10"
              onClick={() => setCurrentPage('alerts')}
            >
              查看全部
            </Button>
          </div>
          <div className="space-y-3">
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-[#94A3B8]">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>暂无活跃告警</p>
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#2563EB]/30 transition-colors cursor-pointer"
                  onClick={() => setCurrentPage('alerts')}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    alert.level === 'critical' ? 'bg-[#DC2626] animate-pulse' :
                    alert.level === 'error' ? 'bg-[#DC2626]' :
                    alert.level === 'warning' ? 'bg-[#D97706]' : 'bg-[#0891B2]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[#0F172A] text-sm font-medium truncate">{alert.title}</p>
                      {alert.vehicleId && (
                        <span className="text-[#94A3B8] text-xs">{alert.vehicleId}</span>
                      )}
                    </div>
                    <p className="text-[#64748B] text-xs mt-0.5 truncate">{alert.message}</p>
                  </div>
                  <span className="text-[#94A3B8] text-xs flex-shrink-0">
                    {Math.round((Date.now() - alert.timestamp.getTime()) / 60000)}分钟前
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="agv-panel p-5">
          <div className="mb-4">
            <h3 className="text-[#0F172A] font-semibold">快捷操作</h3>
            <p className="text-[#64748B] text-sm">常用功能快速入口</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2 bg-white border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#2563EB]/5 text-[#0F172A]"
              onClick={() => setCurrentPage('map')}
            >
              <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#2563EB]" />
              </div>
              <span>地图调度台</span>
            </Button>
            <Button 
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2 bg-white border-[#E2E8F0] hover:border-[#0891B2] hover:bg-[#0891B2]/5 text-[#0F172A]"
              onClick={() => setCurrentPage('tasks')}
            >
              <div className="w-10 h-10 rounded-lg bg-[#0891B2]/10 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-[#0891B2]" />
              </div>
              <span>创建任务</span>
            </Button>
            <Button 
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2 bg-white border-[#E2E8F0] hover:border-[#16A34A] hover:bg-[#16A34A]/5 text-[#0F172A]"
              onClick={() => setCurrentPage('vehicles')}
            >
              <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-[#16A34A]" />
              </div>
              <span>车辆管理</span>
            </Button>
            <Button 
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2 bg-white border-[#E2E8F0] hover:border-[#D97706] hover:bg-[#D97706]/5 text-[#0F172A]"
              onClick={() => setCurrentPage('docks')}
            >
              <div className="w-10 h-10 rounded-lg bg-[#D97706]/10 flex items-center justify-center">
                <Warehouse className="w-5 h-5 text-[#D97706]" />
              </div>
              <span>月台管理</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
