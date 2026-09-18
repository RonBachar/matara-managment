import type { Task, TaskStatus } from '@/types/task'
import { cn } from '@/lib/utils'
import { TaskCard } from '@/components/tasks/TaskCard'

export function TaskColumn({
  title,
  status,
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onDropTask,
  onDragStartTask,
}: {
  title: string
  status: TaskStatus
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
  onDropTask: (taskId: string, nextStatus: TaskStatus) => void
  onDragStartTask: (taskId: string) => void
}) {
  return (
    <section
      className={cn(
        'flex min-w-[16rem] flex-1 flex-col gap-3 rounded-2xl border border-border bg-card p-3',
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const taskId = e.dataTransfer.getData('text/taskId')
        if (taskId) onDropTask(taskId, status)
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{tasks.length}</div>
      </div>

      <div className="flex flex-col gap-3">
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            אין משימות בעמודה זו.
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              draggable
              onDragStart={(taskId) => {
                onDragStartTask(taskId)
              }}
            />
          ))
        )}
      </div>
    </section>
  )
}

