import type { Project, ProjectStatus } from '@/types/project'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const WEBSITE_STATUS_OPTIONS: ProjectStatus[] = [
  'שיחת אפיון',
  'איסוף חומרים',
  'שלב סקיצות',
  'שלב פיתוח',
  'שלב בדיקות והשקה',
  'פרויקט הושלם',
]

const FREELANCE_STATUS_OPTIONS: ProjectStatus[] = [
  'בביצוע',
  'הסתיים',
]

const STATUS_STYLES: Record<ProjectStatus, string> = {
  New: 'bg-sky-50 text-sky-700 border-sky-200/70',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-200/70',
  'Waiting for Client': 'bg-violet-50 text-violet-700 border-violet-200/70',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
  'On Hold': 'bg-slate-100 text-slate-600 border-slate-200/70',
  // Legacy website statuses
  'שלב שיחת אפיון': 'bg-sky-50 text-sky-700 border-sky-200/70',
  'שלב איסוף חומרים': 'bg-amber-50 text-amber-700 border-amber-200/70',
  'סקיצה 1': 'bg-violet-50 text-violet-700 border-violet-200/70',
  'סקיצה 2': 'bg-violet-50 text-violet-700 border-violet-200/70',
  'שלב פיתוח': 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
  'שלב השקה': 'bg-blue-50 text-blue-700 border-blue-200/70',
  'פרויקט הושלם': 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
  // New website statuses
  'שיחת אפיון': 'bg-sky-50 text-sky-700 border-sky-200/70',
  'איסוף חומרים': 'bg-amber-50 text-amber-700 border-amber-200/70',
  'שלב סקיצות': 'bg-violet-50 text-violet-700 border-violet-200/70',
  'שלב בדיקות והשקה': 'bg-blue-50 text-blue-700 border-blue-200/70',
  // New hourly freelancer statuses
  'בביצוע': 'bg-amber-50 text-amber-700 border-amber-200/70',
  'הסתיים': 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
  // Monthly retainer (no real status)
  'ללא סטטוס': 'bg-muted text-muted-foreground border-border',
}

function getStatusStyle(status: ProjectStatus): string {
  return STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground border-border'
}

/** Dot color for each status in the dropdown (soft, professional). */
const STATUS_DOT_CLASSES: Record<ProjectStatus, string> = {
  New: 'bg-sky-500',
  'In Progress': 'bg-amber-500',
  'Waiting for Client': 'bg-violet-500',
  Completed: 'bg-emerald-500',
  'On Hold': 'bg-slate-400',
  'שלב שיחת אפיון': 'bg-sky-500',
  'שלב איסוף חומרים': 'bg-amber-500',
  'סקיצה 1': 'bg-violet-500',
  'סקיצה 2': 'bg-violet-500',
  'שלב פיתוח': 'bg-indigo-500',
  'שלב השקה': 'bg-blue-500',
  'פרויקט הושלם': 'bg-emerald-500',
  'שיחת אפיון': 'bg-sky-500',
  'איסוף חומרים': 'bg-amber-500',
  'שלב סקיצות': 'bg-violet-500',
  'שלב בדיקות והשקה': 'bg-blue-500',
  'בביצוע': 'bg-amber-500',
  'הסתיים': 'bg-emerald-500',
  'ללא סטטוס': 'bg-muted-foreground/50',
}

function getStatusDotClass(status: ProjectStatus): string {
  return STATUS_DOT_CLASSES[status] ?? 'bg-muted-foreground/50'
}

const RETAINER_STATUS_OPTIONS: ProjectStatus[] = ['ללא סטטוס']

function getStatusOptionsForProject(project: Project): ProjectStatus[] {
  let base: ProjectStatus[]
  switch (project.projectType) {
    case 'פרילנסר שעתי':
      base = FREELANCE_STATUS_OPTIONS
      break
    case 'ריטיינר חודשי':
      base = RETAINER_STATUS_OPTIONS
      break
    case 'בניית אתר':
    default:
      base = WEBSITE_STATUS_OPTIONS
      break
  }
  return base.includes(project.status) ? base : [...base, project.status]
}

type ProjectsTableProps = {
  projects: Project[]
  /** Project IDs that have a saved specification brief */
  projectIdsWithBrief: Set<string>
  onAdd: () => void
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onStatusChange: (project: Project, status: ProjectStatus) => void
  onOpenProjectBrief: (project: Project) => void
  canAdd: boolean
  noClientsMessage?: string
  onAddClient?: () => void
}

export function ProjectsTable({
  projects,
  projectIdsWithBrief,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenProjectBrief,
  canAdd,
  noClientsMessage,
  onAddClient,
}: ProjectsTableProps) {
  const totalProjectValue = projects.reduce((sum, p) => {
    const isHourly = p.projectType === 'פרילנסר שעתי'
    return sum + (isHourly ? p.billableTotal : p.totalAmount)
  }, 0)
  const totalRemaining = projects.reduce((sum, p) => sum + p.remainingAmount, 0)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">פרויקטים</h2>
          <p className="text-sm text-muted-foreground">
            {noClientsMessage ??
              'ניהול פרויקטים לפי לקוחות. יש ליצור לקוח לפני הוספת פרויקט.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onAddClient && (
            <Button
              size="sm"
              onClick={onAddClient}
              className="bg-[#10B981] text-white hover:bg-[#059669]"
            >
              הוסף לקוח כדי להתחיל
            </Button>
          )}
          <Button
            size="sm"
            onClick={onAdd}
            disabled={!canAdd}
            className="bg-[#10B981] text-white hover:bg-[#059669] disabled:opacity-50"
          >
            פרויקט חדש
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/60">
            <tr className="text-right">
              <th className="px-3 py-2 font-medium">שם הפרויקט</th>
              <th className="px-3 py-2 font-medium">לקוח</th>
              <th className="px-3 py-2 font-medium">סוג עבודה</th>
              <th className="px-3 py-2 font-medium">סטטוס</th>
              <th className="px-3 py-2 font-medium">סה״כ</th>
              <th className="px-3 py-2 font-medium">שולם</th>
              <th className="px-3 py-2 font-medium">נותר</th>
              <th className="px-3 py-2 font-medium">אפיון</th>
              <th className="px-3 py-2 text-center font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  {canAdd ? 'אין פרויקטים. הוסף פרויקט חדש.' : 'הוסף קודם לקוח כדי ליצור פרויקט.'}
                </td>
              </tr>
            ) : (
              projects.map((project) => {
                const isHourly = project.projectType === 'פרילנסר שעתי'
                const totalDisplay = isHourly ? project.billableTotal : project.totalAmount
                return (
                  <tr
                    key={project.id}
                    className="border-t border-border/60 even:bg-muted/30"
                  >
                    <td className="px-3 py-2 align-middle">
                      {project.projectName}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {project.clientName}
                    </td>
                    <td className="px-3 py-2 align-middle text-xs">
                      {project.projectType}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Select
                        value={project.status}
                        onValueChange={(value) =>
                          onStatusChange(project, value as ProjectStatus)
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          className={cn(
                            'h-7 min-w-[7rem] border text-xs font-medium transition-colors hover:opacity-90',
                            getStatusStyle(project.status),
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getStatusOptionsForProject(project).map((status) => (
                            <SelectItem
                              key={status}
                              value={status}
                              className="text-xs"
                            >
                              <span
                                className={cn(
                                  'me-2 inline-block h-2 w-2 shrink-0 rounded-full',
                                  getStatusDotClass(status),
                                )}
                              />
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      ₪{totalDisplay.toLocaleString('he-IL')}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      ₪{project.paidAmount.toLocaleString('he-IL')}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      ₪{project.remainingAmount.toLocaleString('he-IL')}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {projectIdsWithBrief.has(project.id) ? (
                        <button
                          type="button"
                          className="text-sm font-medium text-[#10B981] underline-offset-2 hover:underline"
                          onClick={() => onOpenProjectBrief(project)}
                        >
                          פתח אפיון
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle text-center">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon-sm"
                          onClick={() => onEdit(project)}
                          aria-label="עריכת פרויקט"
                        >
                          <Pencil className="h-4 w-4 text-[#FBBF24]" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => onDelete(project)}
                          aria-label="מחיקת פרויקט"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[10rem] rounded-xl border border-sky-200/60 bg-sky-50/70 px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-sky-700/80">סה״כ ערך פרויקטים</p>
          <p className="mt-1 text-lg font-semibold text-sky-900/90">
            ₪{totalProjectValue.toLocaleString('he-IL')}
          </p>
        </div>
        <div className="min-w-[10rem] rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-amber-700/80">נותר לגבייה</p>
          <p className="mt-1 text-lg font-semibold text-amber-900/90">
            ₪{totalRemaining.toLocaleString('he-IL')}
          </p>
        </div>
      </div>
    </section>
  )
}
