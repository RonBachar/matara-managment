/** Fired when the sidebar "אפיון פרויקטים" item is clicked (same route). */
export const PROJECT_BRIEFS_SHOW_LIST_EVENT = 'matara:project-briefs:show-list'

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
  { path: '/project-briefs', label: 'אפיון פרויקטים' },
]

export const routeTitlesByPath: Record<string, string> = {
  '/dashboard': 'דשבורד',
  '/projects': 'פרויקטים',
  '/tasks': 'לוח משימות',
  '/clients': 'לקוחות',
  '/leads': 'לידים',
  '/project-briefs': 'אפיון פרויקטים',
}

