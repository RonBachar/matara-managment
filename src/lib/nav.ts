export type NavItem = {
  path: string
  label: string
}

export const navItems: NavItem[] = [
  { path: '/dashboard', label: 'דשבורד' },
  { path: '/leads', label: 'לידים' },
  { path: '/quotes', label: 'הצעות מחיר' },
  { path: '/clients', label: 'לקוחות' },
  { path: '/projects', label: 'פרויקטים' },
  { path: '/tasks', label: 'לוח משימות' },
]

export function getRoutePageTitle(pathname: string): string {
  if (pathname.startsWith('/clients/')) return 'פרטי לקוח'
  const item = navItems.find((entry) => pathname.startsWith(entry.path))
  return item?.label ?? 'Matara Management'
}
