import type { Lead } from '@/types/lead'
import { Button } from '@/components/ui/button'

type DeleteLeadDialogProps = {
  open: boolean
  lead?: Lead
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteLeadDialog({
  open,
  lead,
  onCancel,
  onConfirm,
}: DeleteLeadDialogProps) {
  if (!open || !lead) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background shadow-lg">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">מחיקת ליד</h2>
        </div>
        <div className="space-y-2 px-4 py-4 text-sm">
          <p>האם למחוק את הליד הבא?</p>
          <p className="font-medium">{lead.contactPerson}</p>
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

