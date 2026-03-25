import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Lead, LeadStatus } from '@/types/lead'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  deleteAgreementFile,
  saveAgreementFile,
} from '@/lib/agreementFiles'

const STATUS_OPTIONS: LeadStatus[] = [
  'חדש',
  'במעקב',
  'הצעת מחיר נשלחה',
  'נסגר',
  'לא רלוונטי',
]

const REQUESTED_SERVICE_OPTIONS = [
  'דף נחיתה',
  'אתר תדמית',
  'אתר קטלוג',
  'חנות אינטרנט',
  'אתר קורסים',
  'אתר מותאם אישית',
  'מערכת מותאמת אישית',
  'ניהול ותחזוקת אתרים',
  'שירותי פרילנסר',
] as const

const LEAD_SOURCE_OPTIONS = [
  'פנייה מהאתר',
  'גוגל Ads',
  'פייסבוק',
  'אינסטגרם',
  'וואטסאפ',
  'הפניה / מפה לאוזן',
  'אחר',
] as const

type LeadInput = Omit<Lead, 'id'>

type LeadFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialLead?: Lead
  onClose: () => void
  onSubmit: (lead: LeadInput) => void
}

type FormState = LeadInput

const emptyForm: FormState = {
  contactPerson: '',
  phone: '',
  email: '',
  requestedService: '',
  leadSource: '',
  notes: '',
  status: 'חדש',
  agreementFileId: undefined,
  agreementFileName: undefined,
  agreementFileType: undefined,
}

export function LeadFormModal({
  open,
  mode,
  initialLead,
  onClose,
  onSubmit,
}: LeadFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [pendingAgreementFile, setPendingAgreementFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const isConverted = Boolean(initialLead?.convertedClientId) || initialLead?.status === 'הפך ללקוח'
  const agreementLabel = useMemo(() => {
    if (pendingAgreementFile) return pendingAgreementFile.name
    return form.agreementFileName ?? ''
  }, [pendingAgreementFile, form.agreementFileName])

  useEffect(() => {
    if (!open) return
    if (initialLead) {
      setForm({
        createdAt: initialLead.createdAt,
        contactPerson: initialLead.contactPerson,
        phone: initialLead.phone,
        email: initialLead.email,
        requestedService: initialLead.requestedService ?? '',
        leadSource: initialLead.leadSource,
        notes: initialLead.notes ?? '',
        status: isConverted ? 'הפך ללקוח' : initialLead.status,
        agreementFileId: initialLead.agreementFileId,
        agreementFileName: initialLead.agreementFileName,
        agreementFileType: initialLead.agreementFileType,
      })
    } else {
      setForm({ ...emptyForm, status: 'חדש' })
    }
    setPendingAgreementFile(null)
    setIsSaving(false)
  }, [open, initialLead, isConverted])

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    try {
      let agreementRef:
        | { agreementFileId: string; agreementFileName: string; agreementFileType: string }
        | null = null

      if (pendingAgreementFile) {
        agreementRef = await saveAgreementFile(pendingAgreementFile)
        if (form.agreementFileId && form.agreementFileId !== agreementRef.agreementFileId) {
          await deleteAgreementFile(form.agreementFileId)
        }
      }

      const next: LeadInput = {
        createdAt: initialLead?.createdAt,
        contactPerson: form.contactPerson.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        requestedService: (form.requestedService ?? '').trim() || undefined,
        leadSource: form.leadSource.trim(),
        notes: (form.notes ?? '').trim() || undefined,
        status: isConverted ? 'הפך ללקוח' : form.status,
        convertedClientId: initialLead?.convertedClientId,
        agreementFileId: agreementRef?.agreementFileId ?? form.agreementFileId,
        agreementFileName: agreementRef?.agreementFileName ?? form.agreementFileName,
        agreementFileType: agreementRef?.agreementFileType ?? form.agreementFileType,
      }
    onSubmit(next)
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-xl rounded-xl border border-border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            {mode === 'create' ? 'ליד חדש' : 'עריכת ליד'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            סגירה
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="שם מלא" required>
              <Input
                value={form.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                required
              />
            </Field>
            <Field label="טלפון" required>
              <Input
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
              />
            </Field>
            <Field label="אימייל" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </Field>
            <Field label="שירות מבוקש">
              <Select
                value={form.requestedService || ''}
                onValueChange={(value) =>
                  handleChange(
                    'requestedService',
                    value === '__empty__' ? '' : (value ?? ''),
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר שירות (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty__">—</SelectItem>
                  {REQUESTED_SERVICE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="מקור ליד">
              <Select
                value={form.leadSource}
                onValueChange={(value) => handleChange('leadSource', value ?? '')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר מקור" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="סטטוס">
              {isConverted ? (
                <div
                  className={cn(
                    'inline-flex h-8 w-full items-center rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-2.5 text-sm text-emerald-800',
                  )}
                >
                  הפך ללקוח
                </div>
              ) : (
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    handleChange('status', value as LeadStatus)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="בחר סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>

          <Field label="הערות">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </Field>

          <Field label="הסכם חתום (אופציונלי)">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  setPendingAgreementFile(file)
                }}
                className="cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">
                {agreementLabel ? `קובץ מקושר: ${agreementLabel}` : 'לא נבחר קובץ'}
              </span>
            </div>
          </Field>

          <div className="flex justify-between gap-3 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              ביטול
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              className="px-4"
              disabled={isSaving}
            >
              שמירה
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}

