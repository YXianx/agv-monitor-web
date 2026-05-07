'use client'

import { useAGVStore } from '@/lib/agv-store'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  X,
  Play,
  RotateCcw,
  Ban,
  ArrowUp,
  ArrowDown,
  Truck
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/lib/agv-types'

const statusConfig: Record<TaskStatus, { label: string; class: string; icon: typeof Clock }> = {
  created: { label: '已创建', class: 'status-warning', icon: Clock },
  queued: { label: '排队中', class: 'status-warning', icon: Clock },
  active: { label: '执行中', class: 'px-2 py-1 rounded text-xs bg-[#2563EB]/20 text-[#2563EB] border border-[#2563EB]/30', icon: Play },
  finished: { label: '已完成', class: 'status-success', icon: CheckCircle },
  failed: { label: '失败', class: 'status-danger', icon: XCircle },
  timeout: { label: '超时', class: 'status-danger', icon: AlertTriangle },
  cancelled: { label: '已取消', class: 'status-offline', icon: Ban }
}

const taskTypes = ['搬运', '取货', '放货', '充电', '回库']
const locations = ['A1-01', 'A1-02', 'A2-01', 'B1-01', 'B2-03', 'C1-05', '月台1', '月台2', '月台3', '充电站1', '充电站2']

export function TasksPage() {
  const { tasks, selectedTask, selectTask, createTask, updateTask, cancelTask, retryTask, vehicles } = useAGVStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([])
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
  // 新任务表单
  const [newTask, setNewTask] = useState({
    type: '',
    priority: 3,
    source: '',
    destination: '',
    description: ''
  })
  
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (searchQuery && !t.id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (statusFilter.length > 0 && !statusFilter.includes(t.status)) {
        return false
      }
      if (typeFilter.length > 0 && !typeFilter.includes(t.type)) {
        return false
      }
      return true
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }, [tasks, searchQuery, statusFilter, typeFilter])
  
  const statusCounts = useMemo(() => {
    return tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1
      return acc
    }, {} as Record<TaskStatus, number>)
  }, [tasks])
  
  const handleCreateTask = () => {
    if (!newTask.type || !newTask.source || !newTask.destination) return
    
    createTask({
      type: newTask.type,
      status: 'created',
      priority: newTask.priority,
      vehicleId: null,
      source: newTask.source,
      destination: newTask.destination,
      description: newTask.description || `从${newTask.source}到${newTask.destination}的${newTask.type}任务`
    })
    
    setNewTask({ type: '', priority: 3, source: '', destination: '', description: '' })
    setShowCreateDialog(false)
  }

  return (
    <div className="h-full flex">
      {/* 主内容区 */}
      <div className="flex-1 p-6 flex flex-col">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">任务中心</h1>
            <p className="text-[#64748B] mt-1">创建、监控和管理所有调度任务</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              className="bg-[#2563EB] hover:bg-[#2563EB]/90"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              创建任务
            </Button>
          </div>
        </div>

        {/* 状态统计卡 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {(['created', 'queued', 'active', 'finished', 'failed', 'timeout', 'cancelled'] as TaskStatus[]).map(status => {
            const config = statusConfig[status]
            const Icon = config.icon
            return (
              <button
                key={status}
                onClick={() => {
                  if (statusFilter.includes(status)) {
                    setStatusFilter(statusFilter.filter(s => s !== status))
                  } else {
                    setStatusFilter([...statusFilter, status])
                  }
                }}
                className={cn(
                  "agv-panel p-3 text-left transition-all",
                  statusFilter.includes(status) && "ring-1 ring-[#2563EB]"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-[#64748B]" />
                  <p className="text-[#64748B] text-xs">{config.label}</p>
                </div>
                <p className="kpi-number text-xl font-bold text-[#0F172A]">
                  {statusCounts[status] || 0}
                </p>
              </button>
            )
          })}
        </div>

        {/* 搜索和过滤 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <Input
              placeholder="搜索任务编号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#64748B]"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]">
                <Filter className="w-4 h-4 mr-2" />
                任务类型
                {typeFilter.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-[#2563EB] rounded text-xs">{typeFilter.length}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#F1F5F9] border-[#E2E8F0]">
              {taskTypes.map(type => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={typeFilter.includes(type)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setTypeFilter([...typeFilter, type])
                    } else {
                      setTypeFilter(typeFilter.filter(t => t !== type))
                    }
                  }}
                  className="text-[#0F172A]"
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
              {typeFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator className="bg-[#E2E8F0]" />
                  <button 
                    className="w-full px-2 py-1.5 text-sm text-[#DC2626] hover:bg-[#DC2626]/10 text-left"
                    onClick={() => setTypeFilter([])}
                  >
                    清除筛选
                  </button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {(statusFilter.length > 0 || typeFilter.length > 0) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => { setStatusFilter([]); setTypeFilter([]) }}
              className="text-[#DC2626] hover:text-[#DC2626] hover:bg-[#DC2626]/10"
            >
              清除所有筛选
            </Button>
          )}
          
          <div className="flex-1" />
          
          <span className="text-[#64748B] text-sm">
            共 {filteredTasks.length} 条
          </span>
        </div>

        {/* 任务列表 */}
        <div className="flex-1 agv-panel overflow-hidden">
          <div className="overflow-auto h-full custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-[#E2E8F0] hover:bg-transparent">
                  <TableHead className="text-[#64748B]">任务编号</TableHead>
                  <TableHead className="text-[#64748B]">类型</TableHead>
                  <TableHead className="text-[#64748B]">状态</TableHead>
                  <TableHead className="text-[#64748B]">优先级</TableHead>
                  <TableHead className="text-[#64748B]">执行车辆</TableHead>
                  <TableHead className="text-[#64748B]">起点</TableHead>
                  <TableHead className="text-[#64748B]">终点</TableHead>
                  <TableHead className="text-[#64748B]">进度</TableHead>
                  <TableHead className="text-[#64748B]">创建时间</TableHead>
                  <TableHead className="text-[#64748B] w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const config = statusConfig[task.status]
                  return (
                    <TableRow 
                      key={task.id}
                      className={cn(
                        "border-[#E2E8F0] cursor-pointer transition-colors",
                        selectedTask?.id === task.id 
                          ? "bg-[#2563EB]/10" 
                          : "hover:bg-[#F1F5F9]"
                      )}
                      onClick={() => selectTask(task.id)}
                    >
                      <TableCell className="font-mono text-[#0F172A]">{task.id}</TableCell>
                      <TableCell className="text-[#475569]">{task.type}</TableCell>
                      <TableCell>
                        <span className={config.class}>{config.label}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div 
                              key={i}
                              className={cn(
                                "w-1.5 h-3 rounded-sm",
                                i < task.priority ? 'bg-[#D97706]' : 'bg-[#E2E8F0]'
                              )}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#475569] font-mono">
                        {task.vehicleId || '-'}
                      </TableCell>
                      <TableCell className="text-[#475569]">{task.source}</TableCell>
                      <TableCell className="text-[#475569]">{task.destination}</TableCell>
                      <TableCell>
                        {task.status === 'active' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#2563EB] rounded-full transition-all"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-[#475569] text-sm kpi-number">{task.progress}%</span>
                          </div>
                        ) : task.status === 'finished' ? (
                          <span className="text-[#16A34A] text-sm">100%</span>
                        ) : (
                          <span className="text-[#64748B] text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-[#64748B] text-sm">
                        {task.createdAt.toLocaleString('zh-CN', { 
                          month: '2-digit', 
                          day: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-[#2563EB] hover:text-[#2563EB] hover:bg-[#2563EB]/10"
                        >
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* 右侧详情面板 */}
      {selectedTask && (
        <div className="w-80 bg-[#F1F5F9] border-l border-[#E2E8F0] flex flex-col">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h3 className="text-[#0F172A] font-semibold font-mono">{selectedTask.id}</h3>
              <p className="text-[#64748B] text-sm">{selectedTask.type}任务</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => selectTask(null)} className="text-[#64748B] hover:text-[#0F172A]">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            {/* 状态 */}
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] text-sm">任务状态</span>
              <span className={statusConfig[selectedTask.status].class}>
                {statusConfig[selectedTask.status].label}
              </span>
            </div>

            {/* 优先级 */}
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] text-sm">优先级</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "w-2 h-4 rounded-sm",
                      i < selectedTask.priority ? 'bg-[#D97706]' : 'bg-[#E2E8F0]'
                    )}
                  />
                ))}
                <span className="text-[#0F172A] ml-2">{selectedTask.priority}</span>
              </div>
            </div>

            {/* 进度 */}
            {selectedTask.status === 'active' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B] text-sm">执行进度</span>
                  <span className="kpi-number text-[#0F172A]">{selectedTask.progress}%</span>
                </div>
                <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#2563EB] rounded-full transition-all"
                    style={{ width: `${selectedTask.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 路径信息 */}
            <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0]">
              <p className="text-[#64748B] text-sm mb-3">路径信息</p>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="w-8 h-8 rounded-lg bg-[#16A34A]/10 flex items-center justify-center mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  </div>
                  <p className="text-[#0F172A] text-sm font-medium">{selectedTask.source}</p>
                  <p className="text-[#64748B] text-xs">起点</p>
                </div>
                <div className="flex-1 border-t border-dashed border-[#E2E8F0]" />
                <div className="text-center">
                  <div className="w-8 h-8 rounded-lg bg-[#DC2626]/10 flex items-center justify-center mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#DC2626]" />
                  </div>
                  <p className="text-[#0F172A] text-sm font-medium">{selectedTask.destination}</p>
                  <p className="text-[#64748B] text-xs">终点</p>
                </div>
              </div>
            </div>

            {/* 执行车辆 */}
            {selectedTask.vehicleId && (
              <div className="p-3 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/30">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-[#2563EB] font-medium">执行车辆</span>
                </div>
                <p className="text-[#0F172A] font-mono mt-1">{selectedTask.vehicleId}</p>
              </div>
            )}

            {/* 时间线 */}
            <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0]">
              <p className="text-[#64748B] text-sm mb-3">时间线</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  <div className="flex-1">
                    <p className="text-[#475569] text-xs">创建时间</p>
                    <p className="text-[#0F172A] text-sm">{selectedTask.createdAt.toLocaleString('zh-CN')}</p>
                  </div>
                </div>
                {selectedTask.startedAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
                    <div className="flex-1">
                      <p className="text-[#475569] text-xs">开始时间</p>
                      <p className="text-[#0F172A] text-sm">{selectedTask.startedAt.toLocaleString('zh-CN')}</p>
                    </div>
                  </div>
                )}
                {selectedTask.completedAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
                    <div className="flex-1">
                      <p className="text-[#475569] text-xs">完成时间</p>
                      <p className="text-[#0F172A] text-sm">{selectedTask.completedAt.toLocaleString('zh-CN')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 描述 */}
            <div>
              <p className="text-[#64748B] text-sm mb-1">任务描述</p>
              <p className="text-[#0F172A] text-sm">{selectedTask.description}</p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="p-4 border-t border-[#E2E8F0] space-y-2">
            {['created', 'queued'].includes(selectedTask.status) && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] hover:bg-[#16A34A]/10 hover:border-[#16A34A]"
                    onClick={() => updateTask(selectedTask.id, { priority: Math.min(5, selectedTask.priority + 1) })}
                  >
                    <ArrowUp className="w-4 h-4 mr-1" />
                    提升优先级
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] hover:bg-[#D97706]/10 hover:border-[#D97706]"
                    onClick={() => updateTask(selectedTask.id, { priority: Math.max(1, selectedTask.priority - 1) })}
                  >
                    <ArrowDown className="w-4 h-4 mr-1" />
                    降低优先级
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full bg-[#FFFFFF] border-[#DC2626]/30 text-[#DC2626] hover:bg-[#DC2626]/10"
                  onClick={() => cancelTask(selectedTask.id)}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  取消任务
                </Button>
              </>
            )}
            {['failed', 'timeout', 'cancelled'].includes(selectedTask.status) && (
              <Button 
                variant="outline" 
                className="w-full bg-[#FFFFFF] border-[#2563EB]/30 text-[#2563EB] hover:bg-[#2563EB]/10"
                onClick={() => retryTask(selectedTask.id)}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重新执行
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 创建任务对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A]">
          <DialogHeader>
            <DialogTitle className="text-[#0F172A]">创建新任务</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-[#475569]">任务类型</label>
              <Select value={newTask.type} onValueChange={(v) => setNewTask({ ...newTask, type: v })}>
                <SelectTrigger className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]">
                  <SelectValue placeholder="选择任务类型" />
                </SelectTrigger>
                <SelectContent className="bg-[#F1F5F9] border-[#E2E8F0]">
                  {taskTypes.map(type => (
                    <SelectItem key={type} value={type} className="text-[#0F172A]">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-[#475569]">优先级</label>
              <Select value={String(newTask.priority)} onValueChange={(v) => setNewTask({ ...newTask, priority: parseInt(v) })}>
                <SelectTrigger className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#F1F5F9] border-[#E2E8F0]">
                  {[1, 2, 3, 4, 5].map(p => (
                    <SelectItem key={p} value={String(p)} className="text-[#0F172A]">
                      {p} - {p === 1 ? '最低' : p === 5 ? '最高' : '中等'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-[#475569]">起点</label>
                <Select value={newTask.source} onValueChange={(v) => setNewTask({ ...newTask, source: v })}>
                  <SelectTrigger className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]">
                    <SelectValue placeholder="选择起点" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#F1F5F9] border-[#E2E8F0]">
                    {locations.map(loc => (
                      <SelectItem key={loc} value={loc} className="text-[#0F172A]">{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-[#475569]">终点</label>
                <Select value={newTask.destination} onValueChange={(v) => setNewTask({ ...newTask, destination: v })}>
                  <SelectTrigger className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]">
                    <SelectValue placeholder="选择终点" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#F1F5F9] border-[#E2E8F0]">
                    {locations.map(loc => (
                      <SelectItem key={loc} value={loc} className="text-[#0F172A]">{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-[#475569]">任务描述（可选）</label>
              <Input
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="输入任务描述..."
                className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#64748B]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-[#E2E8F0] text-[#475569]">
              取消
            </Button>
            <Button 
              onClick={handleCreateTask}
              disabled={!newTask.type || !newTask.source || !newTask.destination}
              className="bg-[#2563EB] hover:bg-[#2563EB]/90"
            >
              创建任务
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
