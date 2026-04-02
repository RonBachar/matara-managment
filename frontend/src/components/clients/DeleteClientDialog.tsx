import type { ClientRecord } from '@/types/clientRecord'
import { Button } from '@/components/ui/button'

type DeleteClientDialogProps = {
  open: boolean
  client?: ClientRecord
  onCancel: () => void
  onConfirm: () => void
  blockedMessage?: string
}

export function DeleteClientDialog({
  open,
  client,
  onCancel,
  onConfirm,
  blockedMessage,
}: DeleteClientDialogProps) {
  if (!open || !client) return null

  const isBlocked = Boolean(blockedMessage)
  const displayName = client.clientName || client.businessName || '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background shadow-lg">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            {isBlocked ? 'לא ניתן למחוק לקוח' : 'מחיקת לקוח'}
          </h2>
        </div>
        <div className="space-y-2 px-4 py-4 text-sm">
          {isBlocked ? (
            <>
              <p className="font-medium">{displayName}</p>
              <p className="text-sm text-muted-foreground">{blockedMessage}</p>
            </>
          ) : (
            <>
              <p>האם למחוק את הלקוח הבא?</p>
              <p className="font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                פעולה זו תמחק את הלקוח מהשרת/מסד הנתונים (פעולה בלתי הפיכה).
              </p>
            </>
          )}
        </div>
        <div className="flex justify-between gap-3 px-4 pb-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {isBlocked ? 'סגירה' : 'ביטול'}
          </Button>
          {!isBlocked && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onConfirm}
              className="px-4"
            >
              מחיקה
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

