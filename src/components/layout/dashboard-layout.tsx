import { Sidebar } from './sidebar'
import { Header } from './header'
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset className="min-h-svh flex flex-col bg-background">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1500px] w-full mx-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
