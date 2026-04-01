import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Client } from '@/types/client'
import type { Project, ProjectStatus } from '@/types/project'
import { ProjectsTable } from '@/components/projects/ProjectsTable'
import { ProjectFormModal } from '@/components/projects/ProjectFormModal'
import { DeleteProjectDialog } from '@/components/projects/DeleteProjectDialog'
import { ClientFormModal } from '@/components/clients/ClientFormModal'
import { CLIENTS_STORAGE_KEY, readStoredClients } from '@/lib/clientStorage'
import {
  BRIEFS_CHANGED_EVENT,
  getProjectIdsWithBriefs,
} from '@/lib/projectBriefStorage'
import {
  PROJECTS_STORAGE_KEY,
  loadProjectsFromStorage,
} from '@/lib/projectsStorage'

export function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>(() =>
    loadProjectsFromStorage(),
  )
  const [projectIdsWithBrief, setProjectIdsWithBrief] = useState<Set<string>>(
    () => getProjectIdsWithBriefs(),
  )
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
    const refresh = () => setProjectIdsWithBrief(getProjectIdsWithBriefs())
    window.addEventListener(BRIEFS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(BRIEFS_CHANGED_EVENT, refresh)
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
