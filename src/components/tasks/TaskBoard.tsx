import type { Task, TaskStatus } from '@/types/task'
import { TaskColumn } from '@/components/tasks/TaskColumn'

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'לביצוע', title: 'לביצוע' },
  { status: 'בתהליך', title: 'בתהליך' },
  { status: 'ממתין', title: 'ממתין' },
  { status: 'הושלם', title: 'הושלם' },
]

export function TaskBoard({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
}) {
  function handleDropTask(taskId: string, nextStatus: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === nextStatus) return
    onStatusChange(task, nextStatus)
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {COLUMNS.map((col) => (
        <TaskColumn
          key={col.status}
          title={col.title}
          status={col.status}
          tasks={tasks.filter((t) => t.status === col.status)}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onDropTask={handleDropTask}
          onDragStartTask={() => {}}
        />
      ))}
    </div>
  )
}

