import type { Client } from '@/types/client'
import { Button } from '@/components/ui/button'

type BulkDeleteClientsDialogProps = {
  open: boolean
  deletableClients: Client[]
  blockedClients: Client[]
  onCancel: () => void
  onConfirm: () => void
}

export function BulkDeleteClientsDialog({
  open,
  deletableClients,
  blockedClients,
  onCancel,
  onConfirm,
}: BulkDeleteClientsDialogProps) {
  if (!open) return null

  const canConfirm = deletableClients.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl border border-border bg-background shadow-lg">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">מחיקה מרובה</h2>
        </div>

        <div className="space-y-4 px-4 py-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">
              פעולה זו תשפיע רק על הנתונים המקומיים במערכת (ללא שרת).
            </p>
          </div>

          {blockedClients.length > 0 && (
            <div className="space-y-2 rounded-lg border border-amber-200/60 bg-amber-50/60 p-3">
              <p className="text-sm font-medium text-amber-900/90">
                לא ניתן למחוק לקוחות עם פרויקטים משויכים
              </p>
              <ul className="list-disc space-y-1 ps-5 text-xs text-amber-900/80">
                {blockedClients.map((c) => (
                  <li key={c.id}>{c.businessName}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">לקוחות למחיקה</p>
            {deletableClients.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                אין לקוחות שניתן למחוק מתוך הבחירה.
              </p>
            ) : (
              <ul className="list-disc space-y-1 ps-5 text-xs text-muted-foreground">
                {deletableClients.map((c) => (
                  <li key={c.id}>{c.businessName}</li>
                ))}
              </ul>
            )}
          </div>
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
            disabled={!canConfirm}
          >
            אישור
          </Button>
        </div>
      </div>
    </div>
  )
}

