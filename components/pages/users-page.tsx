'use client'

import { useMemo, useState } from 'react'
import { useAGVStore } from '@/lib/agv-store'
import {
  systemUserStatusLabels,
  userRoleLabels,
  type SystemUser,
  type SystemUserStatus,
  type UserRole,
} from '@/lib/agv-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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
import {
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShieldUser,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react'

type DialogMode = 'create' | 'edit'

type UserFormState = {
  username: string
  name: string
  role: UserRole
  status: SystemUserStatus
  phone: string
  email: string
  department: string
  title: string
  remark: string
  password: string
}

const emptyForm: UserFormState = {
  username: '',
  name: '',
  role: 'user',
  status: 'active',
  phone: '',
  email: '',
  department: '',
  title: '',
  remark: '',
  password: '123456',
}

function getRoleClass(role: UserRole) {
  if (role === 'admin') return 'bg-[#DC2626]/10 text-[#B91C1C] border-[#DC2626]/20'
  if (role === 'operator') return 'bg-[#2563EB]/10 text-[#1D4ED8] border-[#2563EB]/20'
  return 'bg-[#E2E8F0] text-[#475569] border-[#CBD5E1]'
}

function getStatusClass(status: SystemUserStatus) {
  return status === 'active'
    ? 'bg-[#16A34A]/10 text-[#15803D] border-[#16A34A]/20'
    : 'bg-[#D97706]/10 text-[#B45309] border-[#D97706]/20'
}

function createFormState(user?: SystemUser | null): UserFormState {
  if (!user) return emptyForm

  return {
    username: user.username,
    name: user.name,
    role: user.role,
    status: user.status,
    phone: user.phone,
    email: user.email,
    department: user.department,
    title: user.title,
    remark: user.remark,
    password: user.password,
  }
}

export function UsersPage() {
  const { users, createUser, updateUser, deleteUser, currentUser } = useAGVStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | SystemUserStatus>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>('create')
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [formState, setFormState] = useState<UserFormState>(emptyForm)

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const keyword = searchQuery.trim().toLowerCase()
      const matchesKeyword =
        !keyword ||
        user.username.toLowerCase().includes(keyword) ||
        user.name.toLowerCase().includes(keyword) ||
        user.department.toLowerCase().includes(keyword) ||
        user.phone.toLowerCase().includes(keyword)

      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter

      return matchesKeyword && matchesRole && matchesStatus
    })
  }, [roleFilter, searchQuery, statusFilter, users])

  const summary = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.status === 'active').length,
      admins: users.filter((user) => user.role === 'admin').length,
      operators: users.filter((user) => user.role === 'operator').length,
    }
  }, [users])

  const openCreateDialog = () => {
    setDialogMode('create')
    setEditingUser(null)
    setFormState(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (user: SystemUser) => {
    setDialogMode('edit')
    setEditingUser(user)
    setFormState(createFormState(user))
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingUser(null)
    setFormState(emptyForm)
  }

  const handleSubmit = () => {
    if (!formState.username.trim() || !formState.name.trim()) return

    if (dialogMode === 'create') {
      createUser({
        ...formState,
        username: formState.username.trim(),
        name: formState.name.trim(),
        department: formState.department.trim(),
        title: formState.title.trim(),
        remark: formState.remark.trim(),
        email: formState.email.trim(),
        phone: formState.phone.trim(),
      })
    } else if (editingUser) {
      updateUser(editingUser.id, {
        ...formState,
        username: formState.username.trim(),
        name: formState.name.trim(),
        department: formState.department.trim(),
        title: formState.title.trim(),
        remark: formState.remark.trim(),
        email: formState.email.trim(),
        phone: formState.phone.trim(),
      })
    }

    closeDialog()
  }

  const handleDelete = (user: SystemUser) => {
    if (user.id === currentUser?.id) {
      window.alert('当前登录账号不能直接删除，请先切换其他管理员账号。')
      return
    }

    if (window.confirm(`确定删除用户“${user.name}”吗？`)) {
      deleteUser(user.id)
    }
  }

  return (
    <div className="h-full p-6 overflow-auto custom-scrollbar space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">用户管理</h1>
          <p className="text-[#64748B] mt-1">
            独立成一级模块更合适，角色、账户状态和基础资料都集中在这里，后面接后端权限体系也更顺。
          </p>
        </div>
        <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          新增用户
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="agv-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-5 h-5 text-[#2563EB]" />
            <span className="status-primary">账户总数</span>
          </div>
          <p className="text-3xl font-semibold text-[#0F172A]">{summary.total}</p>
          <p className="mt-1 text-sm text-[#64748B]">支持后续继续扩展组织与岗位</p>
        </div>
        <div className="agv-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <ShieldCheck className="w-5 h-5 text-[#DC2626]" />
            <span className="status-danger">管理员</span>
          </div>
          <p className="text-3xl font-semibold text-[#0F172A]">{summary.admins}</p>
          <p className="mt-1 text-sm text-[#64748B]">建议至少保留 2 个管理员账号</p>
        </div>
        <div className="agv-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <UserCog className="w-5 h-5 text-[#1D4ED8]" />
            <span className="status-primary">操作员</span>
          </div>
          <p className="text-3xl font-semibold text-[#0F172A]">{summary.operators}</p>
          <p className="mt-1 text-sm text-[#64748B]">适合日常调度和现场处置</p>
        </div>
        <div className="agv-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <ShieldUser className="w-5 h-5 text-[#16A34A]" />
            <span className="status-success">启用中</span>
          </div>
          <p className="text-3xl font-semibold text-[#0F172A]">{summary.active}</p>
          <p className="mt-1 text-sm text-[#64748B]">停用账号保留资料，不影响审计</p>
        </div>
      </div>

      <section className="agv-panel p-5">
        <div className="flex flex-col lg:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索姓名、账号、部门、手机号"
              className="pl-10 bg-white border-[#E2E8F0]"
            />
          </div>

          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as 'all' | UserRole)}>
            <SelectTrigger className="w-[180px] bg-white border-[#E2E8F0]">
              <SelectValue placeholder="角色筛选" />
            </SelectTrigger>
            <SelectContent className="bg-[#F8FAFC] border-[#E2E8F0]">
              <SelectItem value="all">全部角色</SelectItem>
              <SelectItem value="admin">管理员</SelectItem>
              <SelectItem value="operator">操作员</SelectItem>
              <SelectItem value="user">普通用户</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | SystemUserStatus)}>
            <SelectTrigger className="w-[180px] bg-white border-[#E2E8F0]">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent className="bg-[#F8FAFC] border-[#E2E8F0]">
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="disabled">停用</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-[#E2E8F0]">
              <TableHead>用户信息</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>部门 / 岗位</TableHead>
              <TableHead>联系方式</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>最后登录</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="border-[#E2E8F0]">
                <TableCell className="align-top">
                  <div>
                    <p className="font-medium text-[#0F172A]">{user.name}</p>
                    <p className="text-xs text-[#64748B] mt-1">
                      {user.username}
                      {currentUser?.id === user.id ? ' · 当前登录' : ''}
                    </p>
                    {user.remark && <p className="text-xs text-[#94A3B8] mt-1 whitespace-normal">{user.remark}</p>}
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs', getRoleClass(user.role))}>
                    {userRoleLabels[user.role]}
                  </span>
                </TableCell>
                <TableCell className="align-top">
                  <p className="text-[#0F172A]">{user.department || '--'}</p>
                  <p className="text-xs text-[#64748B] mt-1">{user.title || '--'}</p>
                </TableCell>
                <TableCell className="align-top">
                  <p className="text-[#0F172A]">{user.phone || '--'}</p>
                  <p className="text-xs text-[#64748B] mt-1">{user.email || '--'}</p>
                </TableCell>
                <TableCell className="align-top">
                  <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs', getStatusClass(user.status))}>
                    {systemUserStatusLabels[user.status]}
                  </span>
                </TableCell>
                <TableCell className="align-top text-[#64748B]">
                  {user.lastLoginAt
                    ? user.lastLoginAt.toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '从未登录'}
                </TableCell>
                <TableCell className="align-top">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9]"
                      onClick={() => openEditDialog(user)}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#DC2626]/30 bg-white text-[#DC2626] hover:bg-[#DC2626]/10"
                      onClick={() => handleDelete(user)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredUsers.length === 0 && (
          <div className="py-10 text-center text-sm text-[#64748B]">没有匹配到用户，试试放宽筛选条件。</div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={(open) => (!open ? closeDialog() : setDialogOpen(true))}>
        <DialogContent className="max-w-3xl bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? '新增用户' : '编辑用户'}</DialogTitle>
            <DialogDescription className="text-[#64748B]">
              当前先按标准后台字段处理，后续接真实后端时可以直接映射账号、角色、状态、联系方式等基础信息。
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <label className="text-sm text-[#0F172A]">登录账号</label>
              <Input
                value={formState.username}
                onChange={(event) => setFormState((prev) => ({ ...prev, username: event.target.value }))}
                className="bg-white border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#0F172A]">姓名</label>
              <Input
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                className="bg-white border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#0F172A]">角色</label>
              <Select value={formState.role} onValueChange={(value) => setFormState((prev) => ({ ...prev, role: value as UserRole }))}>
                <SelectTrigger className="bg-white border-[#E2E8F0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#F8FAFC] border-[#E2E8F0]">
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="operator">操作员</SelectItem>
                  <SelectItem value="user">普通用户</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#0F172A]">状态</label>
              <Select
                value={formState.status}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, status: value as SystemUserStatus }))}
              >
                <SelectTrigger className="bg-white border-[#E2E8F0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#F8FAFC] border-[#E2E8F0]">
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="disabled">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#0F172A]">手机号</label>
              <Input
                value={formState.phone}
                onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))}
                className="bg-white border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#0F172A]">邮箱</label>
              <Input
                value={formState.email}
                onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                className="bg-white border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#0F172A]">部门</label>
              <Input
                value={formState.department}
                onChange={(event) => setFormState((prev) => ({ ...prev, department: event.target.value }))}
                className="bg-white border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#0F172A]">岗位</label>
              <Input
                value={formState.title}
                onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                className="bg-white border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-[#0F172A]">密码</label>
              <Input
                value={formState.password}
                onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
                className="bg-white border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-[#0F172A]">备注</label>
              <Input
                value={formState.remark}
                onChange={(event) => setFormState((prev) => ({ ...prev, remark: event.target.value }))}
                className="bg-white border-[#E2E8F0]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="bg-transparent border-[#E2E8F0] text-[#0F172A] hover:bg-[#E2E8F0]"
              onClick={closeDialog}
            >
              取消
            </Button>
            <Button
              className="bg-[#2563EB] hover:bg-[#2563EB]/90"
              onClick={handleSubmit}
              disabled={!formState.username.trim() || !formState.name.trim()}
            >
              {dialogMode === 'create' ? '创建用户' : '保存修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
