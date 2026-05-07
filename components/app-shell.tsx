'use client'

import { LoginPage } from '@/components/login-page'
import { MainLayout } from '@/components/main-layout'
import { PageRenderer } from '@/components/page-renderer'
import { useAGVStore } from '@/lib/agv-store'

export function AppShell() {
  const { isAuthenticated } = useAGVStore()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <MainLayout>
      <PageRenderer />
    </MainLayout>
  )
}
