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

const STATUS_OPTIONS: ProjectStatus[] = ['התחיל', 'בתהליך עבודה', 'הושלם']

const STATUS_STYLES: Record<ProjectStatus, string> = {
  'התחיל': 'bg-sky-50 text-sky-700 border-sky-200/70',
  'בתהליך עבודה': 'bg-amber-50 text-amber-700 border-amber-200/70',
  'הושלם': 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
}

const STATUS_DOT_CLASSES: Record<ProjectStatus, string> = {
  'התחיל': 'bg-sky-500',
  'בתהליך עבודה': 'bg-amber-500',
  'הושלם': 'bg-emerald-500',
}

function getStatusStyle(status: ProjectStatus): string {
  return STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground border-border'
}

function getStatusDotClass(status: ProjectStatus): string {
  return STATUS_DOT_CLASSES[status] ?? 'bg-muted-foreground/50'
}

type ProjectsTableProps = {
  projects: Project[]
  onAdd: () => void
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onStatusChange: (project: Project, status: ProjectStatus) => void
}

export function ProjectsTable({
  projects,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
}: ProjectsTableProps) {
  const totalProjectValue = projects.reduce((sum, p) => sum + p.totalAmount, 0)
  const totalRemaining = projects.reduce(
    (sum, p) => sum + Math.max(0, p.totalAmount - p.paidAmount),
    0,
  )

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">פרויקטים</h2>
          <p className="text-sm text-muted-foreground">
            ניהול פרויקטים עצמאי ללא תלות במודולים אחרים.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onAdd}
          className="bg-[#10B981] text-white hover:bg-[#059669]"
        >
          פרויקט חדש
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/60">
            <tr className="text-right">
              <th className="px-3 py-2 font-medium">שם הפרויקט</th>
              <th className="px-3 py-2 font-medium">לקוח</th>
              <th className="px-3 py-2 font-medium">סטטוס</th>
              <th className="px-3 py-2 font-medium">סה״כ</th>
              <th className="px-3 py-2 font-medium">שולם</th>
              <th className="px-3 py-2 text-center font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  אין פרויקטים. הוסף פרויקט חדש.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-t border-border/60 even:bg-muted/30"
                >
                  <td className="px-3 py-2 align-middle">{project.projectName}</td>
                  <td className="px-3 py-2 align-middle">{project.clientName}</td>
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
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status} className="text-xs">
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
                    ₪{project.totalAmount.toLocaleString('he-IL')}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    ₪{project.paidAmount.toLocaleString('he-IL')}
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
              ))
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
