import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { cn } from '@/lib/utils'

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Sidebar />

      <div className={cn('min-h-dvh', 'pr-64')}>
        <main className="px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

