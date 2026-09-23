import type { Lead } from '@/types/lead'
import { Button } from '@/components/ui/button'

type DeleteLeadDialogProps = {
  open: boolean
  /** One lead for a row delete, several when deleting a selection. */
  leads: Lead[]
  deleting?: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** How many names to spell out before falling back to a count. */
const MAX_NAMES_SHOWN = 8

export function DeleteLeadDialog({
  open,
  leads,
  deleting,
  onCancel,
  onConfirm,
}: DeleteLeadDialogProps) {
  if (!open || leads.length === 0) return null

  const single = leads.length === 1
  const shown = leads.slice(0, MAX_NAMES_SHOWN)
  const rest = leads.length - shown.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background shadow-lg">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            {single ? 'מחיקת ליד' : `מחיקת ${leads.length} לידים`}
          </h2>
        </div>

        <div className="space-y-2 px-4 py-4 text-sm">
          <p>{single ? 'האם למחוק את הליד הבא?' : `האם למחוק את ${leads.length} הלידים הבאים?`}</p>

          <ul className="max-h-40 space-y-0.5 overflow-y-auto">
            {shown.map((lead) => (
              <li key={lead.id} className="font-medium">
                {lead.clientName}
              </li>
            ))}
          </ul>
          {rest > 0 && <p className="text-xs text-muted-foreground">ועוד {rest}…</p>}

          <p className="text-xs text-muted-foreground">
            פעולה זו תמחק את הרשומות ממסד הנתונים (פעולה בלתי הפיכה).
          </p>
        </div>

        <div className="flex justify-between gap-3 px-4 pb-4">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={deleting}>
            ביטול
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={deleting}
            className="px-4"
          >
            {deleting ? 'מוחק...' : 'מחיקה'}
          </Button>
        </div>
      </div>
    </div>
  )
}
