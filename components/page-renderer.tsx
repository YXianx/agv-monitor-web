'use client'

import type { ComponentType } from 'react'
import type { AppPage } from '@/lib/app-pages'
import { useAGVStore } from '@/lib/agv-store'
import { AlertsPage } from '@/components/pages/alerts-page'
import { DiagnosticsPage } from '@/components/pages/diagnostics-page'
import { DocksPage } from '@/components/pages/docks-page'
import { HistoryPage } from '@/components/pages/history-page'
import { MapDispatchPage } from '@/components/pages/map-dispatch-page'
import { MapManagementPage } from '@/components/pages/map-management-page'
import { OverviewPage } from '@/components/pages/overview-page'
import { SettingsPage } from '@/components/pages/settings-page'
import { TasksPage } from '@/components/pages/tasks-page'
import { VehiclesPage } from '@/components/pages/vehicles-page'

const pageRegistry: Record<AppPage, ComponentType> = {
  overview: OverviewPage,
  map: MapDispatchPage,
  maps: MapManagementPage,
  vehicles: VehiclesPage,
  tasks: TasksPage,
  docks: DocksPage,
  alerts: AlertsPage,
  diagnostics: DiagnosticsPage,
  settings: SettingsPage,
  history: HistoryPage,
}

export function PageRenderer() {
  const { currentPage } = useAGVStore()
  const ActivePage = pageRegistry[currentPage]

  return <ActivePage />
}
