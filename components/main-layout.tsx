import { SidebarNav } from './sidebar-nav'
import { TopStatusBar } from './top-status-bar'

export function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <SidebarNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopStatusBar />
        <main className="flex-1 overflow-auto custom-scrollbar">{children}</main>
      </div>
    </div>
  )
}
