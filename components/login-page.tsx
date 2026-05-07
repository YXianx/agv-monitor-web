'use client'

import { useState } from 'react'
import { useAGVStore } from '@/lib/agv-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Bot, 
  Lock, 
  User, 
  AlertCircle,
  Wifi,
  Server,
  Database
} from 'lucide-react'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, initializeData } = useAGVStore()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    // 模拟登录延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (!username || !password) {
      setError('请输入用户名和密码')
      setLoading(false)
      return
    }
    
    const success = login(username, password)
    if (success) {
      initializeData()
    } else {
      setError('登录失败，请检查用户名和密码')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* 左侧品牌区域 */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* 背景渐变 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/10 via-[#F8FAFC] to-[#0891B2]/10" />
        
        {/* 网格背景 */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(37, 99, 235, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(37, 99, 235, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* 动态装饰元素 */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#2563EB]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#0891B2]/5 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* 内容 */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#0891B2] flex items-center justify-center shadow-lg">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#0F172A]">AGV智能调度系统</h1>
              <p className="text-[#475569] mt-1">Industrial Fleet Management System</p>
            </div>
          </div>
          
          <p className="text-[#64748B] text-lg text-center max-w-md mb-12">
            工业级AGV车队管理与监控平台，支持300+车辆实时调度与追踪
          </p>
          
          {/* 系统状态指示器 */}
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <Wifi className="w-4 h-4 text-[#94A3B8]" />
              <span className="text-[#475569] text-sm">网络正常</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <Server className="w-4 h-4 text-[#94A3B8]" />
              <span className="text-[#475569] text-sm">服务在线</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <Database className="w-4 h-4 text-[#94A3B8]" />
              <span className="text-[#475569] text-sm">数据库连接</span>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录区域 */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* 移动端Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#0891B2] flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A]">AGV智能调度系统</h1>
          </div>

          {/* 登录卡片 */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-[#0F172A]">欢迎回来</h2>
              <p className="text-[#64748B] mt-2">请登录您的账户以继续</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-lg text-[#DC2626]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-[#475569]">用户名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="pl-10 bg-white border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-[#2563EB]/20 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#475569]">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="pl-10 bg-white border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-[#2563EB]/20 h-12"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>登录中...</span>
                  </div>
                ) : (
                  '登录'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#94A3B8] text-sm">
                测试账号：任意用户名和密码
              </p>
            </div>
          </div>

          {/* 底部信息 */}
          <div className="mt-8 text-center">
            <p className="text-[#94A3B8] text-xs">
              AGV智能调度系统 V1.0 | 2026 AGV项目组
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
