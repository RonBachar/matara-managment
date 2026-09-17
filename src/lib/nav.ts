export type NavItem = {
  path: string
  label: string
}

export const navItems: NavItem[] = [
  { path: '/dashboard', label: 'דשבורד' },
  { path: '/clients', label: 'לקוחות' },
  { path: '/projects', label: 'פרויקטים' },
  { path: '/leads', label: 'לידים' },
]

export function getRoutePageTitle(pathname: string): string {
  if (pathname.startsWith('/clients/')) return 'פרטי לקוח'
  const item = navItems.find((entry) => pathname.startsWith(entry.path))
  return item?.label ?? 'Matara Management'
}
