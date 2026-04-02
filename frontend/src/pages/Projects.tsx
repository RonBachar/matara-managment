import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ClientRecord } from '@/types/clientRecord'
import type { Project, ProjectStatus } from '@/types/project'
import { ProjectsTable } from '@/components/projects/ProjectsTable'
import { ProjectFormModal } from '@/components/projects/ProjectFormModal'
import { DeleteProjectDialog } from '@/components/projects/DeleteProjectDialog'
import { ClientFormModal } from '@/components/clients/ClientFormModal'
import { apiCreateClient, apiGetClients } from '@/lib/clientsApi'
import {
  apiCreateProject,
  apiDeleteProject,
  apiGetProjects,
  apiUpdateProject,
} from '@/lib/projectsApi'
import {
  BRIEFS_CHANGED_EVENT,
  getProjectIdsWithBriefs,
} from '@/lib/projectBriefStorage'

export function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectIdsWithBrief, setProjectIdsWithBrief] = useState<Set<string>>(
    () => getProjectIdsWithBriefs(),
  )
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [activeProject, setActiveProject] = useState<Project | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addClientModalOpen, setAddClientModalOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiGetProjects()
      .then((rows) => {
        if (cancelled) return
        setProjects(rows)
      })
      .catch(() => {
        // Keep UI intact; on failure we simply show an empty list for now.
        if (cancelled) return
        setProjects([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    apiGetClients()
      .then((rows) => {
        if (cancelled) return
        setClients(rows)
      })
      .catch(() => {
        if (cancelled) return
        setClients([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const refresh = () => setProjectIdsWithBrief(getProjectIdsWithBriefs())
    window.addEventListener(BRIEFS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(BRIEFS_CHANGED_EVENT, refresh)
  }, [])

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

  async function handleFormSubmit(project: Project) {
    if (formMode === 'edit') {
      const updated = await apiUpdateProject(project.id, {
        projectName: project.projectName,
        clientId: project.clientId,
        clientName: project.clientName,
        projectType: project.projectType,
        status: project.status,
        totalAmount: project.totalAmount,
        paidAmount: project.paidAmount,
        remainingAmount: project.remainingAmount,
        hourlyRate: project.hourlyRate,
        workedHours: project.workedHours,
        billableTotal: project.billableTotal,
        notes: project.notes ?? null,
      })

      setProjects((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      )
      setFormOpen(false)
      return
    }

    const created = await apiCreateProject({
      projectName: project.projectName,
      clientId: project.clientId,
      clientName: project.clientName,
      projectType: project.projectType,
      status: project.status,
      totalAmount: project.totalAmount,
      paidAmount: project.paidAmount,
      remainingAmount: project.remainingAmount,
      hourlyRate: project.hourlyRate,
      workedHours: project.workedHours,
      billableTotal: project.billableTotal,
      notes: project.notes ?? null,
    })

    setProjects((prev) => [created, ...prev])
    setFormOpen(false)
  }

  async function handleStatusChange(project: Project, status: ProjectStatus) {
    const updated = await apiUpdateProject(project.id, { status })
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)),
    )
  }

  function handleDeleteRequest(project: Project) {
    setActiveProject(project)
    setDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!activeProject) return
    const id = activeProject.id
    await apiDeleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setDeleteOpen(false)
  }

  function handleClientAdded(newClient: ClientRecord) {
    setClients((prev) => [newClient, ...prev])
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
        projectIdsWithBrief={projectIdsWithBrief}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onStatusChange={handleStatusChange}
        onOpenProjectBrief={(project) =>
          navigate(`/project-briefs?project=${encodeURIComponent(project.id)}`)
        }
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
          onSubmit={async (data) => {
            const created = await apiCreateClient(data)
            handleClientAdded(created)
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
