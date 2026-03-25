import type { ClientType } from '@/types/client'

/** Hebrew labels for service type (סוג שירות). Internal values stay in English for storage. */
export function getClientTypeLabel(clientType: ClientType): string {
  switch (clientType) {
    case 'Website Client':
      return 'בניית אתרים'
    case 'Service Client':
      return 'עבודת פרילנסר'
    default:
      return String(clientType)
  }
}

