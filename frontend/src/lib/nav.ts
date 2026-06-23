export type NavItem = {
  path: string
  label: string
}

export const navItems: NavItem[] = [
  { path: '/dashboard', label: 'דשבורד' },
  { path: '/projects', label: 'פרויקטים' },
  { path: '/tasks', label: 'לוח משימות' },
  { path: '/clients', label: 'לקוחות' },
  { path: '/leads', label: 'לידים' },
]

export const routeTitlesByPath: Record<string, string> = {
  '/dashboard': 'דשבורד',
  '/projects': 'פרויקטים',
  '/tasks': 'לוח משימות',
  '/clients': 'לקוחות',
  '/leads': 'לידים',
}

export function getRoutePageTitle(pathname: string): string {
  const p = pathname || '/'
  if (p.startsWith('/projects/')) return 'פרטי פרויקט'
  if (p.startsWith('/projects')) return routeTitlesByPath['/projects']
  if (p.startsWith('/clients/')) return 'פרטי לקוח'
  if (p.startsWith('/clients')) return routeTitlesByPath['/clients']
  if (p.startsWith('/tasks')) return routeTitlesByPath['/tasks']
  if (p.startsWith('/leads')) return routeTitlesByPath['/leads']
  if (p.startsWith('/dashboard')) return routeTitlesByPath['/dashboard']
  return 'Matara Management'
}
