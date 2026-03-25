import type { Task } from '@/types/task'
import { Button } from '@/components/ui/button'

type DeleteTaskDialogProps = {
  open: boolean
  task?: Task
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteTaskDialog({
  open,
  task,
  onCancel,
  onConfirm,
}: DeleteTaskDialogProps) {
  if (!open || !task) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background shadow-lg">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">מחיקת משימה</h2>
        </div>
        <div className="space-y-2 px-4 py-4 text-sm">
          <p>האם למחוק את המשימה הבאה?</p>
          <p className="font-medium">{task.title}</p>
          <p className="text-xs text-muted-foreground">
            פעולה זו תשפיע רק על הנתונים המקומיים במערכת (ללא שרת).
          </p>
        </div>
        <div className="flex justify-between gap-3 px-4 pb-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            ביטול
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            className="px-4"
          >
            מחיקה
          </Button>
        </div>
      </div>
    </div>
  )
}

