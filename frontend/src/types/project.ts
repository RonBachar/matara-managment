/** Work type (סוג עבודה). Values are Hebrew labels used in UI and storage. */
export type ProjectType = 'בניית אתר' | 'פרילנסר שעתי' | 'ריטיינר חודשי'

export type ProjectStatus =
  // Legacy English statuses (for backward compatibility)
  | 'New'
  | 'In Progress'
  | 'Waiting for Client'
  | 'Completed'
  | 'On Hold'
  // Legacy website Hebrew statuses (for backward compatibility)
  | 'שלב שיחת אפיון'
  | 'שלב איסוף חומרים'
  | 'סקיצה 1'
  | 'סקיצה 2'
  | 'שלב פיתוח'
  | 'שלב השקה'
  | 'פרויקט הושלם'
  // New website project statuses
  | 'שיחת אפיון'
  | 'איסוף חומרים'
  | 'שלב סקיצות'
  | 'שלב בדיקות והשקה'
  // New hourly freelancer statuses
  | 'בביצוע'
  | 'הסתיים'
  // Monthly retainer: no meaningful statuses (kept as a single placeholder for DB compatibility)
  | 'ללא סטטוס'

export type Project = {
  id: string
  projectName: string
  clientId: string
  clientName: string
  /** Work type (סוג עבודה). Determines allowed status set and financial fields. */
  projectType: ProjectType
  status: ProjectStatus
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  hourlyRate: number
  workedHours: number
  billableTotal: number
  notes?: string
}
