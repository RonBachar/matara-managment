import { useEffect, useState } from 'react'
import type { Client } from '@/types/client'
import type { Project, ProjectStatus, ProjectType } from '@/types/project'
import { ProjectsTable } from '@/components/projects/ProjectsTable'
import { ProjectFormModal } from '@/components/projects/ProjectFormModal'
import { DeleteProjectDialog } from '@/components/projects/DeleteProjectDialog'
import { ClientFormModal } from '@/components/clients/ClientFormModal'
import { CLIENTS_STORAGE_KEY, readStoredClients } from '@/lib/clientStorage'

const PROJECTS_STORAGE_KEY = 'matara_projects'

function loadInitialProjects(): Project[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as any[]
    if (!Array.isArray(parsed)) return []

    // Normalize legacy stored values to current work types (סוג עבודה) for compatibility.
    const mapType = (t: any): ProjectType => {
      switch (t) {
        case 'Full Project':
        case 'בניית אתרים':
          return 'בניית אתר'
        case 'Hourly Project':
        case 'עבודת פרילנסר לפי שעה':
          return 'פרילנסר שעתי'
        case 'ריטיינר חודשי':
          return 'ריטיינר חודשי'
        case 'בניית אתר':
        case 'פרילנסר שעתי':
          return t
        default:
          return 'בניית אתר'
      }
    }

    return parsed.map((p) => ({
      id: String(p.id ?? Date.now()),
      projectName: String(p.projectName ?? ''),
      clientId: String(p.clientId ?? ''),
      clientName: String(p.clientName ?? ''),
      projectType: mapType(p.projectType),
      status: (p.status as ProjectStatus) ?? 'New',
      totalAmount: Number(p.totalAmount ?? 0),
      paidAmount: Number(p.paidAmount ?? 0),
      remainingAmount: Number(p.remainingAmount ?? 0),
      hourlyRate: Number(p.hourlyRate ?? 0),
      workedHours: Number(p.workedHours ?? 0),
      billableTotal: Number(p.billableTotal ?? 0),
      notes: typeof p.notes === 'string' ? p.notes : undefined,
    }))
  } catch {
    return []
  }
}

export function Projects() {
  const [projects, setProjects] = useState<Project[]>(() => loadInitialProjects())
  const [clients, setClients] = useState<Client[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [activeProject, setActiveProject] = useState<Project | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addClientModalOpen, setAddClientModalOpen] = useState(false)

  useEffect(() => {
    setClients(readStoredClients())
    const onStorage = () => setClients(readStoredClients())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects))
  }, [projects])

  function handleAdd() {
    setFormMode('create')
    setActiveProject(undefined)
    setFormOpen(true)
  }

  function handleEdit(project: Project) {
    setFormMode('edit')
    setActiveProject(project)
    setFormOpen(true)
  }

  function handleFormSubmit(project: Project) {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === project.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = project
        return next
      }
      return [...prev, project]
    })
    setFormOpen(false)
  }

  function handleStatusChange(project: Project, status: ProjectStatus) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id ? { ...p, status } : p,
      ),
    )
  }

  function handleDeleteRequest(project: Project) {
    setActiveProject(project)
    setDeleteOpen(true)
  }

  function handleDeleteConfirm() {
    if (!activeProject) return
    setProjects((prev) => prev.filter((p) => p.id !== activeProject.id))
    setDeleteOpen(false)
  }

  function handleClientAdded(newClient: Client) {
    setClients((prev) => {
      const next = [...prev, newClient]
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(next))
      }
      return next
    })
  }

  const canAdd = clients.length > 0
  const noClientsMessage =
    clients.length === 0
      ? 'יש ליצור לפחות לקוח אחד לפני הוספת פרויקט. עבור לעמוד לקוחות.'
      : undefined

  return (
    <>
      <ProjectsTable
        projects={projects}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onStatusChange={handleStatusChange}
        canAdd={canAdd}
        noClientsMessage={noClientsMessage}
        onAddClient={canAdd ? undefined : () => setAddClientModalOpen(true)}
      />

      <ProjectFormModal
        open={formOpen}
        mode={formMode}
        clients={clients}
        initialProject={formMode === 'edit' ? activeProject : undefined}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        onClientAdded={handleClientAdded}
      />

      {addClientModalOpen && (
        <ClientFormModal
          open={addClientModalOpen}
          mode="create"
          onClose={() => setAddClientModalOpen(false)}
          onSubmit={(data) => {
            const newClient: Client = {
              ...data,
              id: String(Date.now()),
              createdAt: new Date().toISOString(),
            }
            handleClientAdded(newClient)
            setAddClientModalOpen(false)
          }}
        />
      )}

      <DeleteProjectDialog
        open={deleteOpen}
        project={activeProject}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
