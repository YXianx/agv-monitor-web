'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  History,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Calendar,
  Clock,
  Search,
  Download,
  Filter
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

// 模拟历史任务数据
const historyTasks = Array.from({ length: 20 }, (_, i) => ({
  id: `TASK-${String(i + 1).padStart(4, '0')}`,
  type: ['搬运', '取货', '放货', '充电'][Math.floor(Math.random() * 4)],
  vehicleId: `AGV-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`,
  source: ['A1-01', 'A2-01', 'B1-01', 'B2-03'][Math.floor(Math.random() * 4)],
  destination: ['月台1', '月台2', '月台3', '充电站1'][Math.floor(Math.random() * 4)],
  startTime: new Date(Date.now() - Math.random() * 86400000 * 7),
  endTime: new Date(Date.now() - Math.random() * 86400000 * 7 + 300000),
  status: ['finished', 'failed'][Math.floor(Math.random() * 10) < 8 ? 0 : 1]
}))

export function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [progress, setProgress] = useState([0])
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredTasks = useMemo(() => {
    return historyTasks.filter(t => {
      if (searchQuery && 
          !t.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !t.vehicleId.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    })
  }, [searchQuery])

  return (
    <div className="h-full flex">
      {/* 左侧任务列表 */}
      <div className="w-80 bg-[#FFFFFF] border-r border-[#E2E8F0] flex flex-col">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h3 className="text-[#0F172A] font-semibold mb-4">历史任务</h3>
          
          {/* 日期选择 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#64748B]" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]"
              />
            </div>
            
            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <Input
                placeholder="搜索任务..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#64748B]"
              />
            </div>
          </div>
        </div>
        
        {/* 任务列表 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredTasks.map(task => (
            <button
              key={task.id}
              onClick={() => setSelectedTask(task.id)}
              className={cn(
                "w-full p-4 text-left border-b border-[#E2E8F0] transition-colors hover:bg-[#F1F5F9]",
                selectedTask === task.id && "bg-[#2563EB]/10 border-l-2 border-l-[#2563EB]"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#0F172A] font-mono text-sm">{task.id}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded",
                  task.status === 'finished' ? 'status-success' : 'status-danger'
                )}>
                  {task.status === 'finished' ? '完成' : '失败'}
                </span>
              </div>
              <p className="text-[#64748B] text-sm">{task.type} - {task.vehicleId}</p>
              <p className="text-[#64748B] text-xs mt-1">
                {task.source} → {task.destination}
              </p>
              <p className="text-[#64748B] text-xs mt-1">
                {task.startTime.toLocaleString('zh-CN', { 
                  month: '2-digit', 
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 主内容区 - 回放画布 */}
      <div className="flex-1 flex flex-col">
        {/* 工具栏 */}
        <div className="h-14 bg-[#FFFFFF] border-b border-[#E2E8F0] flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h2 className="text-[#0F172A] font-semibold">历史回放</h2>
            {selectedTask && (
              <span className="text-[#64748B] text-sm font-mono">{selectedTask}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              className="bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]"
            >
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
          </div>
        </div>

        {/* 回放区域 */}
        <div className="flex-1 relative bg-[#F8FAFC]">
          {!selectedTask ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#64748B]">
              <History className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">选择一个任务开始回放</p>
              <p className="text-sm mt-2">从左侧列表选择历史任务</p>
            </div>
          ) : (
            <>
              {/* 模拟地图画布 */}
              <div 
                className="absolute inset-4 rounded-lg border border-[#E2E8F0]"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(45, 120, 244, 0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(45, 120, 244, 0.05) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px'
                }}
              >
                {/* 起点 */}
                <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-8 rounded-lg bg-[#16A34A]/20 border border-[#16A34A] flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-[#16A34A]" />
                  </div>
                  <p className="text-[#16A34A] text-xs mt-1 text-center">起点</p>
                </div>
                
                {/* 终点 */}
                <div className="absolute top-3/4 right-1/4 transform translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-8 rounded-lg bg-[#DC2626]/20 border border-[#DC2626] flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-[#DC2626]" />
                  </div>
                  <p className="text-[#DC2626] text-xs mt-1 text-center">终点</p>
                </div>
                
                {/* 路径 */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <path
                    d="M 25% 25% L 50% 25% L 50% 75% L 75% 75%"
                    fill="none"
                    stroke="#0891B2"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                    className="opacity-50"
                  />
                </svg>
                
                {/* 车辆位置 (根据进度移动) */}
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                  style={{
                    left: `${25 + progress[0] * 0.5}%`,
                    top: `${25 + progress[0] * 0.5}%`
                  }}
                >
                  <div className="w-6 h-6 rounded-full bg-[#2563EB] border-2 border-white shadow-lg flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-white transform -rotate-45" />
                  </div>
                </div>
              </div>
              
              {/* 时间信息 */}
              <div className="absolute top-8 right-8 agv-elevated p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#64748B]" />
                  <span className="text-[#64748B] text-sm">回放时间</span>
                </div>
                <p className="kpi-number text-xl text-[#0F172A]">
                  {new Date(Date.now() - 86400000).toLocaleTimeString('zh-CN')}
                </p>
              </div>
            </>
          )}
        </div>

        {/* 播放控制条 */}
        <div className="h-20 bg-[#FFFFFF] border-t border-[#E2E8F0] px-6 flex items-center gap-6">
          {/* 播放控制按钮 */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              disabled={!selectedTask}
              className="text-[#64748B] hover:text-[#0F172A] disabled:opacity-50"
            >
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              disabled={!selectedTask}
              className={cn(
                "w-12 h-12 rounded-full",
                isPlaying 
                  ? "bg-[#2563EB] text-white hover:bg-[#2563EB]/90" 
                  : "bg-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/30"
              )}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              disabled={!selectedTask}
              className="text-[#64748B] hover:text-[#0F172A] disabled:opacity-50"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          {/* 进度条 */}
          <div className="flex-1 space-y-1">
            <Slider
              value={progress}
              onValueChange={setProgress}
              max={100}
              step={1}
              disabled={!selectedTask}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#64748B]">
              <span>00:00</span>
              <span>{Math.round(progress[0])}%</span>
              <span>05:00</span>
            </div>
          </div>

          {/* 播放速度 */}
          <div className="flex items-center gap-2">
            <span className="text-[#64748B] text-sm">速度</span>
            <Select value={String(playbackSpeed)} onValueChange={(v) => setPlaybackSpeed(parseFloat(v))}>
              <SelectTrigger className="w-20 bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#F1F5F9] border-[#E2E8F0]">
                <SelectItem value="0.5" className="text-[#0F172A]">0.5x</SelectItem>
                <SelectItem value="1" className="text-[#0F172A]">1x</SelectItem>
                <SelectItem value="2" className="text-[#0F172A]">2x</SelectItem>
                <SelectItem value="4" className="text-[#0F172A]">4x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
