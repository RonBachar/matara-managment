import type { Client, ClientType } from '@/types/client'
import type { Lead } from '@/types/lead'
import { ClientFormModal } from '@/components/clients/ClientFormModal'

type ConvertLeadDialogProps = {
  open: boolean
  lead?: Lead
  onClose: () => void
  onConvert: (client: Client) => void
}

function buildNotesFromLead(lead: Lead): string {
  const parts: string[] = []
  if (lead.requestedService) parts.push(`שירות מבוקש: ${lead.requestedService}`)
  if (lead.leadSource) parts.push(`מקור ליד: ${lead.leadSource}`)
  if (lead.notes) parts.push(lead.notes)
  return parts.join('\n')
}

export function ConvertLeadDialog({
  open,
  lead,
  onClose,
  onConvert,
}: ConvertLeadDialogProps) {
  if (!open || !lead) return null

  const prefClientType: ClientType = 'Website Client'

  return (
    <ClientFormModal
      open={open}
      mode="create"
      initialClient={{
        id: 'prefill',
        clientType: prefClientType,
        businessName: lead.contactPerson,
        contactPerson: lead.contactPerson,
        phone: lead.phone,
        email: lead.email,
        website: '',
        notes: buildNotesFromLead(lead),
        packageType: 'None',
        renewalPrice: 0,
        renewalDate: '',
        agreementFileId: lead.agreementFileId,
        agreementFileName: lead.agreementFileName,
        agreementFileType: lead.agreementFileType,
      }}
      onClose={onClose}
      onSubmit={(data) => {
        const newClient: Client = {
          ...data,
          id: String(Date.now()),
          createdAt: lead.createdAt ?? new Date().toISOString(),
          agreementFileId: lead.agreementFileId,
          agreementFileName: lead.agreementFileName,
          agreementFileType: lead.agreementFileType,
        }
        onConvert(newClient)
      }}
    />
  )
}

