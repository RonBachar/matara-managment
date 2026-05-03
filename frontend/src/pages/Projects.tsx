import { useEffect, useState } from 'react'
import type { Project, ProjectStatus } from '@/types/project'
import { ProjectsTable } from '@/components/projects/ProjectsTable'
import { ProjectFormModal } from '@/components/projects/ProjectFormModal'
import { DeleteProjectDialog } from '@/components/projects/DeleteProjectDialog'
import {
  apiCreateProject,
  apiDeleteProject,
  apiGetProjects,
  apiUpdateProject,
} from '@/lib/projectsApi'

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [activeProject, setActiveProject] = useState<Project | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)

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
        clientName: project.clientName,
        status: project.status,
        totalAmount: project.totalAmount,
        paidAmount: project.paidAmount,
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
      clientName: project.clientName,
      status: project.status,
      totalAmount: project.totalAmount,
      paidAmount: project.paidAmount,
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

  return (
    <>
      <ProjectsTable
        projects={projects}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onStatusChange={handleStatusChange}
      />

      <ProjectFormModal
        open={formOpen}
        mode={formMode}
        initialProject={formMode === 'edit' ? activeProject : undefined}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <DeleteProjectDialog
        open={deleteOpen}
        project={activeProject}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
